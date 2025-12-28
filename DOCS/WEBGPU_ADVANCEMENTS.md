# WebGPU Advancements for Zombobs

**Document Purpose**: This document outlines advanced WebGPU features and techniques that can significantly enhance the visual fidelity, performance, and gameplay depth of Zombobs. Each feature leverages GPU compute shaders and modern rendering techniques to achieve effects previously impossible in browser-based games.

---

## Table of Contents
1. [Real-Time Global Illumination (GI)](#1-real-time-global-illumination-gi)
2. [GPU-Driven Destruction System](#2-gpu-driven-destruction-system)
3. [GPU-Driven Crowd Pathfinding](#3-gpu-driven-crowd-pathfinding)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Performance Considerations](#performance-considerations)

---

## 1. Real-Time Global Illumination (GI)

### What is Real-Time GI?
Real-time Global Illumination simulates how light bounces off surfaces to illuminate other surfaces, creating realistic indirect lighting. Instead of only direct light sources (like muzzle flashes), GI allows light to "bounce" and spread naturally, dramatically improving visual realism.

### Why Add Real-Time GI to Zombobs?

**1. Enhanced Horror Atmosphere**
- Dynamic shadows from flickering lights create tension
- Zombies emerging from darkness become more terrifying
- Fire from explosions illuminates nearby areas realistically
- Blood pools reflect ambient light, making them more visible

**2. Visual Polish & Immersion**
- Areas lit only by muzzle flashes feel more cinematic
- Streetlights cast realistic pools of light with soft falloff
- Burning cars illuminate nearby zombies with orange glow
- Night waves become visually stunning with dynamic lighting

**3. Gameplay Clarity**
- Players can better see zombie silhouettes against lit backgrounds
- Light/dark areas create natural tactical zones
- Weapon fire reveals hidden zombies through bounce lighting
- Environmental storytelling through lighting (lit vs dark zones = safety vs danger)

### Implementation Examples

#### Example 1: Voxel-Based GI with Light Propagation Volumes (LPV)
**Technique**: Divide the game world into a 3D voxel grid (e.g., 64×64×16 for a top-down game). Each voxel stores light intensity and direction. Light propagates from direct sources (muzzle flashes, explosions, fire) to neighboring voxels using compute shaders.

**WebGPU Workflow**:
1. **Voxelization Pass**: Convert game world into 3D voxel grid
2. **Injection Pass**: Inject direct light from sources (muzzle flash, fire, explosions)
3. **Propagation Pass** (Compute Shader): Propagate light to neighbors over 4-6 iterations
4. **Sampling Pass**: Sample GI from voxel grid during final rendering

**Pseudocode (WGSL Compute Shader)**:
```wgsl
@group(0) @binding(0) var<storage, read_write> lightGrid: array<vec4<f32>>;

@compute @workgroup_size(8, 8, 1)
fn propagateLight(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 64u + id.z * 64u * 64u;
    let currentLight = lightGrid[idx];
    
    // Sample 6 neighbors (±X, ±Y, ±Z)
    var neighborLight = vec4<f32>(0.0);
    for (var i = 0; i < 6; i++) {
        let neighborIdx = getNeighborIndex(idx, i);
        neighborLight += lightGrid[neighborIdx] * 0.9; // 90% propagation
    }
    
    // Average and attenuate
    lightGrid[idx] = max(currentLight, neighborLight / 6.0);
}
```

**Game-Specific Application**:
- Muzzle flash at (playerX, playerY, height=8) injects orange light → propagates outward 3-4 cells
- Explosion creates intense light burst → decays over 10 frames
- Fire from burnt cars continuously injects light → creates persistent glow zones

---

#### Example 2: Screen-Space Global Illumination (SSGI)
**Technique**: Use the rendered frame as input. For each pixel, trace rays in screen space to find nearby surfaces, then sample their color/brightness to estimate indirect light. Much cheaper than full path tracing.

**WebGPU Workflow**:
1. Render depth buffer and normal buffer
2. For each pixel, trace 4-8 short rays in hemisphere around normal
3. Sample color from hit points → accumulate as indirect light
4. Blend with direct lighting

**Pseudocode (WGSL Fragment Shader)**:
```wgsl
@fragment
fn ssgi(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let depth = textureSample(depthTexture, depthSampler, uv).r;
    let normal = textureSample(normalTexture, normalSampler, uv).rgb;
    
    var indirectLight = vec3<f32>(0.0);
    let rayCount = 8;
    
    for (var i = 0; i < rayCount; i++) {
        let randomDir = hemisphereSample(normal, i, rayCount);
        let hitUV = rayMarch(uv, randomDir, depth);
        let hitColor = textureSample(colorTexture, colorSampler, hitUV).rgb;
        indirectLight += hitColor;
    }
    
    return vec4<f32>(indirectLight / f32(rayCount), 1.0);
}
```

**Game-Specific Application**:
- Blood pools on ground reflect red tint onto nearby zombies' legs
- Muzzle flash illuminates player's hands/arms from below
- Explosions cast orange glow on nearby walls/props

---

#### Example 3: Radiance Hints with GPU Particles
**Technique**: Treat every particle (bullet tracers, blood splatter, fire) as a light source. Use compute shaders to calculate their contribution to a low-resolution irradiance map, then upscale for final rendering.

**WebGPU Workflow**:
1. Render all particles to low-res (128×128) radiance texture
2. Blur radiance texture with Gaussian blur (compute shader)
3. Upscale to screen resolution and blend additively

**Pseudocode (WGSL Compute Shader)**:
```wgsl
@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var radianceTexture: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(16, 16)
fn computeRadiance(@builtin(global_invocation_id) id: vec3<u32>) {
    let uv = vec2<f32>(id.xy) / vec2<f32>(128.0, 128.0);
    let worldPos = uvToWorld(uv);
    
    var radiance = vec3<f32>(0.0);
    for (var i = 0u; i < arrayLength(&particles); i++) {
        let particle = particles[i];
        let dist = distance(worldPos, particle.position);
        let attenuation = 1.0 / (1.0 + dist * dist * 0.01);
        radiance += particle.color.rgb * particle.intensity * attenuation;
    }
    
    textureStore(radianceTexture, id.xy, vec4<f32>(radiance, 1.0));
}
```

**Game-Specific Application**:
- Bullet tracers leave glowing trails that illuminate the environment
- Blood splatter creates subtle red ambient glow
- Grenade explosions create intense but short-lived light bursts

---

## 2. GPU-Driven Destruction System

### What is GPU-Driven Destruction?
Instead of CPU-based physics, GPU compute shaders handle object fragmentation, debris physics, and collision detection. This allows thousands of destructible pieces to exist simultaneously without tanking performance.

### Why Add GPU-Driven Destruction to Zombobs?

**1. Cinematic Combat Feedback**
- Zombies explode into dozens of body parts (heads, limbs, torsos)
- Props shatter when shot (wooden crates → splinters, cars → metal scraps)
- Walls crack and crumble when hit by rockets
- Creates visceral, satisfying combat moments

**2. Environmental Storytelling**
- Destroyed areas show player's path through levels
- Debris fields tell story of intense battles
- Destructible cover adds tactical depth (hide behind car → car explodes → scramble for new cover)

**3. Gameplay Depth**
- Explosive barrels create chain reactions
- Destructible walls reveal shortcuts or secrets
- Debris slows zombie movement (realistic obstacle navigation)
- Environmental hazards from collapsing structures

### Implementation Examples

#### Example 1: Voxel-Based Destruction with Marching Cubes
**Technique**: Represent destructible objects as 3D voxel grids. Explosions "carve out" voxels in a radius. Use Marching Cubes algorithm (GPU compute shader) to regenerate mesh in real-time.

**WebGPU Workflow**:
1. Store destructible objects as 3D voxel buffers (e.g., 32×32×32 for a car)
2. On explosion, compute shader clears voxels in blast radius
3. Marching Cubes compute shader regenerates mesh from modified voxel data
4. Render updated mesh with debris particles

**Pseudocode (WGSL Compute Shader)**:
```wgsl
@group(0) @binding(0) var<storage, read_write> voxels: array<f32>; // 1.0 = solid, 0.0 = air

@compute @workgroup_size(8, 8, 8)
fn applyExplosion(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 32u + id.z * 32u * 32u;
    let voxelPos = vec3<f32>(id.xyz);
    let explosionPos = uniforms.explosionCenter;
    let radius = uniforms.explosionRadius;
    
    let dist = distance(voxelPos, explosionPos);
    if (dist < radius) {
        // Carve out voxel with noise for irregular crater
        let noiseVal = perlinNoise(voxelPos * 0.1);
        voxels[idx] *= smoothstep(radius, radius * 0.5, dist + noiseVal * 2.0);
    }
}
```

**Game-Specific Application**:
- Grenade explosion carves crater in wooden barricade
- Shotgun blast shatters zombie's torso into chunks
- Rocket impact creates large irregular hole in wall

---

#### Example 2: Particle-Based Soft Body Destruction
**Technique**: Destructible objects are clusters of GPU particles connected by constraints. Explosions break constraints, particles scatter using GPU physics. Much cheaper than voxels for organic destruction (flesh, cloth).

**WebGPU Workflow**:
1. Represent zombie body as 100-200 particles (head=10, torso=30, limbs=15 each)
2. Store particle positions, velocities, and constraint IDs in GPU buffer
3. On kill, compute shader breaks constraints and applies explosive force
4. Physics compute shader updates particle trajectories
5. Render particles as instanced meshes (gibs)

**Pseudocode (WGSL Compute Shader)**:
```wgsl
struct Particle {
    position: vec3<f32>,
    velocity: vec3<f32>,
    mass: f32,
    isActive: u32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64)
fn simulateGibs(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (particles[i].isActive == 0u) { return; }
    
    // Apply gravity
    particles[i].velocity.y -= 9.8 * uniforms.deltaTime;
    
    // Apply air resistance
    particles[i].velocity *= 0.98;
    
    // Update position
    particles[i].position += particles[i].velocity * uniforms.deltaTime;
    
    // Ground collision
    if (particles[i].position.y < 0.0) {
        particles[i].position.y = 0.0;
        particles[i].velocity.y *= -0.5; // Bounce with 50% energy loss
        particles[i].velocity.xz *= 0.8; // Friction
    }
}
```

**Game-Specific Application**:
- Headshot scatters 10-15 skull/brain particles with blood spray
- Explosive zombie death launches 50+ body chunks in all directions
- Limbs severed by shotgun blast fly off realistically

---

#### Example 3: Voronoi Fracture with Precomputed Shards
**Technique**: Pre-fracture props (crates, windows, concrete) into irregular shards using Voronoi diagrams. Store shard meshes. On impact, GPU compute shader activates shards and applies physics.

**WebGPU Workflow**:
1. Pre-generate 5-10 fracture patterns per prop type (offline tool)
2. Store shard meshes and transforms in GPU buffers (inactive by default)
3. On impact, compute shader activates nearest shards and applies impulse
4. Render shards as instanced meshes

**Pseudocode (WGSL Compute Shader)**:
```wgsl
struct Shard {
    position: vec3<f32>,
    rotation: vec4<f32>, // quaternion
    velocity: vec3<f32>,
    angularVelocity: vec3<f32>,
    isActive: u32,
};

@group(0) @binding(0) var<storage, read_write> shards: array<Shard>;

@compute @workgroup_size(64)
fn activateShards(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    let shard = &shards[i];
    
    let impactDist = distance(shard.position, uniforms.impactPoint);
    if (impactDist < uniforms.fractureRadius) {
        shard.isActive = 1u;
        let impulseDir = normalize(shard.position - uniforms.impactPoint);
        shard.velocity = impulseDir * (1.0 / impactDist) * 5.0;
        shard.angularVelocity = randomRotation(i) * 2.0;
    }
}
```

**Game-Specific Application**:
- Wooden crate shatters into 12 planks when shot
- Car window explodes into 20-30 glass shards
- Concrete wall crumbles into 15-20 irregular chunks

---

## 3. GPU-Driven Crowd Pathfinding

### What is GPU-Driven Crowd Pathfinding?
Instead of CPU-based A* pathfinding for each zombie, GPU compute shaders calculate flow fields and steering behaviors for thousands of agents simultaneously. Each zombie follows local gradient to reach player.

### Why Add GPU-Driven Crowd Pathfinding to Zombobs?

**1. Massive Horde Support**
- Support 1,000+ zombies on screen without CPU bottleneck
- Wave 50+ becomes visually spectacular with swarms
- "Zombie tsunami" moments where horde overwhelms player
- Console-quality crowd density in browser

**2. Emergent Behavior & Realism**
- Zombies naturally flow around obstacles like water
- Crowd crushing effects (zombies push each other)
- Realistic bottleneck formation at choke points
- Swarm intelligence (flanking, surrounding) without explicit AI

**3. Performance & Scalability**
- O(1) pathfinding cost per zombie (vs O(n log n) for A*)
- Scales linearly with zombie count on GPU
- CPU freed for other gameplay systems
- Lower-end hardware can still run large hordes

### Implementation Examples

#### Example 1: Flow Field Pathfinding with Dijkstra Flood Fill
**Technique**: Use GPU compute shader to generate a "flow field" - a 2D grid where each cell points toward the player. Zombies simply follow their cell's direction vector. Recalculate field when player moves significantly.

**WebGPU Workflow**:
1. Divide world into grid (e.g., 256×256 cells, 20px per cell)
2. Mark player cell as goal (distance = 0)
3. Dijkstra compute shader: Flood fill distances from goal outward
4. Gradient compute shader: Calculate flow direction from distance gradient
5. Zombies read flow direction from their grid cell

**Pseudocode (WGSL Compute Shader - Dijkstra Pass)**:
```wgsl
@group(0) @binding(0) var<storage, read_write> distanceField: array<f32>;
@group(0) @binding(1) var<storage, read> obstacles: array<u32>; // 1 = blocked

@compute @workgroup_size(16, 16)
fn floodFillDistance(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (obstacles[idx] == 1u) { return; } // Skip walls
    
    var minNeighborDist = distanceField[idx];
    
    // Check 4 neighbors
    let neighbors = array<u32, 4>(
        idx - 1u, idx + 1u, idx - 256u, idx + 256u
    );
    
    for (var i = 0; i < 4; i++) {
        let nDist = distanceField[neighbors[i]];
        if (nDist < minNeighborDist - 1.0) {
            minNeighborDist = nDist + 1.0;
        }
    }
    
    distanceField[idx] = minNeighborDist;
}
```

**Pseudocode (WGSL Compute Shader - Flow Field Generation)**:
```wgsl
@group(0) @binding(0) var<storage, read> distanceField: array<f32>;
@group(0) @binding(1) var<storage, write> flowField: array<vec2<f32>>;

@compute @workgroup_size(16, 16)
fn generateFlowField(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    let currentDist = distanceField[idx];
    
    // Sample neighbors to find gradient
    let left = distanceField[idx - 1u];
    let right = distanceField[idx + 1u];
    let up = distanceField[idx - 256u];
    let down = distanceField[idx + 256u];
    
    // Gradient points toward lower distance
    let gradient = vec2<f32>(left - right, up - down);
    flowField[idx] = normalize(gradient);
}
```

**Game-Specific Application**:
- 500 zombies all pathfind to player using single flow field (recalc every 30 frames)
- Zombies automatically navigate around props, walls, and debris
- Dynamic obstacles (destroyed cars) update flow field in real-time

---

#### Example 2: Boids-Based Crowd Steering with Spatial Hashing
**Technique**: Each zombie is a "boid" with steering behaviors (seek player, avoid neighbors, match velocity). GPU compute shader uses spatial hashing to find nearby zombies efficiently, then calculates steering forces.

**WebGPU Workflow**:
1. Build spatial hash grid on GPU (divide world into 50×50px cells)
2. For each zombie, find neighbors in same cell + 8 adjacent cells
3. Calculate steering forces: cohesion, separation, alignment, seek
4. Update zombie position/velocity based on forces

**Pseudocode (WGSL Compute Shader - Spatial Hashing)**:
```wgsl
struct Zombie {
    position: vec2<f32>,
    velocity: vec2<f32>,
};

@group(0) @binding(0) var<storage, read_write> zombies: array<Zombie>;
@group(0) @binding(1) var<storage, read_write> hashGrid: array<atomic<u32>>;

@compute @workgroup_size(64)
fn spatialHash(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    let z = zombies[i];
    
    // Calculate hash cell (50px per cell)
    let cellX = u32(z.position.x / 50.0);
    let cellY = u32(z.position.y / 50.0);
    let hash = cellX + cellY * 1000u;
    
    // Atomically increment cell count
    atomicAdd(&hashGrid[hash], 1u);
}
```

**Pseudocode (WGSL Compute Shader - Steering)**:
```wgsl
@compute @workgroup_size(64)
fn calculateSteering(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    var z = &zombies[i];
    
    var separation = vec2<f32>(0.0);
    var alignment = vec2<f32>(0.0);
    var neighborCount = 0u;
    
    // Check neighbors in spatial hash
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            let neighborCell = getHashCell(z.position + vec2<f32>(dx, dy) * 50.0);
            let neighbors = getZombiesInCell(neighborCell);
            
            for (var j = 0u; j < neighbors.count; j++) {
                let n = neighbors.zombies[j];
                let dist = distance(z.position, n.position);
                
                if (dist < 30.0 && dist > 0.1) {
                    // Separation: avoid crowding
                    separation += normalize(z.position - n.position) / dist;
                    // Alignment: match velocity
                    alignment += n.velocity;
                    neighborCount++;
                }
            }
        }
    }
    
    // Seek player
    let seek = normalize(uniforms.playerPosition - z.position);
    
    // Combine forces
    z.velocity += seek * 0.5;
    if (neighborCount > 0u) {
        z.velocity += (separation / f32(neighborCount)) * 0.3;
        z.velocity += (alignment / f32(neighborCount)) * 0.1;
    }
    
    z.velocity = normalize(z.velocity) * uniforms.zombieSpeed;
    z.position += z.velocity * uniforms.deltaTime;
}
```

**Game-Specific Application**:
- Zombies maintain natural spacing (no overlapping blob)
- Swarm behavior: Zombies surround player from multiple angles
- Panic spreading: If one zombie is hit, neighbors scatter briefly

---

#### Example 3: Layered Influence Maps with Threat Assessment
**Technique**: Multiple influence maps (player attraction, danger zones from explosions, cover points) stored as textures. Zombies sample all maps and make weighted decisions. AI director adjusts map weights for dramatic pacing.

**WebGPU Workflow**:
1. Maintain 3 influence maps (256×256 textures):
   - **Attraction Map**: High values near player, decays with distance
   - **Danger Map**: High values near recent explosions/gunfire
   - **Terrain Map**: Pathable vs blocked areas
2. Zombie AI compute shader samples all 3 maps at its position
3. Calculate weighted direction: `dir = attraction * 0.6 - danger * 0.4`
4. Move toward best direction

**Pseudocode (WGSL Compute Shader)**:
```wgsl
@group(0) @binding(0) var attractionMap: texture_2d<f32>;
@group(0) @binding(1) var dangerMap: texture_2d<f32>;
@group(0) @binding(2) var terrainMap: texture_2d<f32>;
@group(0) @binding(3) var<storage, read_write> zombies: array<Zombie>;

@compute @workgroup_size(64)
fn influencePathfinding(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    var z = &zombies[i];
    
    // Convert world position to UV
    let uv = z.position / vec2<f32>(5120.0, 5120.0); // World size
    
    // Sample influence maps
    let attraction = textureSampleLevel(attractionMap, linearSampler, uv, 0.0).r;
    let danger = textureSampleLevel(dangerMap, linearSampler, uv, 0.0).r;
    let terrain = textureSampleLevel(terrainMap, linearSampler, uv, 0.0).r;
    
    if (terrain < 0.5) { return; } // Blocked terrain
    
    // Sample 8 directions to find best gradient
    var bestDir = vec2<f32>(0.0);
    var bestScore = -1000.0;
    
    for (var angle = 0.0; angle < 6.28; angle += 0.785) { // 8 directions
        let dir = vec2<f32>(cos(angle), sin(angle));
        let sampleUV = uv + dir * 0.01; // Sample 10px ahead
        
        let sampleAttraction = textureSampleLevel(attractionMap, linearSampler, sampleUV, 0.0).r;
        let sampleDanger = textureSampleLevel(dangerMap, linearSampler, sampleUV, 0.0).r;
        
        let score = sampleAttraction * 0.7 - sampleDanger * 0.3;
        
        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    }
    
    z.velocity = bestDir * uniforms.zombieSpeed;
    z.position += z.velocity * uniforms.deltaTime;
}
```

**Game-Specific Application**:
- Zombies flee from grenade explosions temporarily (danger map spikes)
- Sniper rifle fire in one area causes zombies to approach from flanks
- Boss zombies ignore danger map (fearless behavior)

---

## Implementation Roadmap

### Phase 1: Foundation (v0.9.0)
- ✅ WebGPU renderer infrastructure
- ✅ Basic compute shader support
- ✅ Volumetric blood simulation (completed v0.8.1.8)
- ✅ GPU-driven Snow Accumulation System (completed v0.8.2.2)
- 🔲 Radiance hints system (simplest GI method)
- 🔲 Flow field pathfinding prototype (64×64 grid, 100 zombies)

### Phase 2: Core Features (v0.10.0)
- 🔲 SSGI implementation (screen-space GI)
- 🔲 Particle-based destruction (gibs, blood chunks)
- 🔲 Flow field pathfinding (256×256 grid, 500 zombies)
- 🔲 Performance profiling & optimization

### Phase 3: Polish & Advanced Features (v0.11.0)
- 🔲 Voxel-based GI (light propagation volumes)
- 🔲 Voronoi fracture system (props, walls)
- 🔲 Boids-based crowd steering layer
- 🔲 Quality scaling for all GPU features

### Phase 4: Next-Gen Features (v0.12.0+)
- 🔲 Voxel-based destruction (marching cubes)
- 🔲 Layered influence maps (AI director integration)
- 🔲 GPU-driven LOD system (automatic detail reduction)
- 🔲 Temporal accumulation for GI (denoising)

---

## Performance Considerations

### GPU Budget Allocation (16ms frame budget @ 60fps)

| System | Budget | Quality Scaling |
|--------|--------|-----------------|
| **Base Rendering** | 6ms | N/A (required) |
| **Particle System** | 2ms | Low: 0.5ms, Ultra: 3ms |
| **Blood Simulation** | 1ms | Disabled on Low/Med |
| **GI (Radiance Hints)** | 2ms | Low: disabled, Ultra: 3ms |
| **Crowd Pathfinding** | 1.5ms | Scales with zombie count |
| **Destruction Physics** | 1.5ms | Scales with active debris |
| **UI & HUD** | 1ms | N/A |
| **Buffer/Headroom** | 1ms | Prevents frame drops |

### Quality Presets

**Low** (30-60 FPS on integrated GPUs):
- Radiance hints: Disabled
- Destruction: Simple particle gibs only
- Pathfinding: CPU-based A* (max 100 zombies)
- Blood: Particle splatter only

**Medium** (60 FPS on mid-range GPUs):
- Radiance hints: 64×64 resolution
- Destruction: Particle gibs + simple shards
- Pathfinding: Flow field (128×128, max 300 zombies)
- Blood: CPU simulation (64×64 grid)

**High** (60 FPS on modern GPUs):
- Radiance hints: 128×128 resolution
- Destruction: Full Voronoi fracture
- Pathfinding: Flow field + boids (256×256, max 500 zombies)
- Blood: CPU simulation (64×64 grid)

**Ultra** (60 FPS on high-end GPUs):
- SSGI or voxel GI: Full resolution
- Destruction: Voxel-based + Voronoi
- Pathfinding: Flow field + boids + influence maps (512×512, max 1000 zombies)
- Blood: CPU simulation (128×128 grid) with future GPU upgrade

---

## Conclusion

These WebGPU advancements would elevate Zombobs from a solid browser game to a **console-quality experience**. By leveraging GPU compute shaders, we can achieve visual effects and gameplay scale previously impossible in web-based games while maintaining 60 FPS on modern hardware.

**Key Takeaways**:
1. **Real-Time GI** makes the game visually stunning and enhances horror atmosphere
2. **GPU Destruction** creates satisfying combat feedback and environmental storytelling
3. **GPU Pathfinding** enables massive zombie hordes without CPU bottleneck

**Recommended Order**:
1. Start with **Radiance Hints GI** (easiest, big visual impact)
2. Add **Flow Field Pathfinding** (enables larger hordes)
3. Implement **Particle Gibs** destruction (satisfying combat)
4. Expand to advanced features based on performance headroom

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-24  
**Author**: Gemini AI / Zombobs Development Team
