import { gpuCanvas } from './canvas.js';

export class WebGPURenderer {
    constructor() {
        this.device = null;
        this.context = null;
        this.format = null;
        this.renderPipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.isInitialized = false;
        this.fallbackMode = false;
        this.time = 0;

        // Bloom settings
        this.bloomEnabled = true;
        this.bloomIntensity = 0.5;
        this.bloomTexture = null;
        this.bloomPipeline = null;
        this.bloomBindGroup = null;
        this.sampler = null;

        this.distortionEnabled = true;
        this.lightingQuality = 1;

        this.particleCount = 0;
        this.particleBuffer = null;
        this.particleStaging = null;
        this.computePipeline = null;
        this.particleRenderPipeline = null;
        this.particleBindGroup = null;
        this.particleComputeBindGroup = null;
        this.particleRenderBindGroup = null;
        this.particleComputeBindGroupLayout = null;
        this.particleRenderBindGroupLayout = null;

        // Dirty flags for uniform updates
        this.uniformsDirty = true;
        this.cachedTime = 0;
        this.cachedResolutionX = 0;
        this.cachedResolutionY = 0;
        this.cachedBloomIntensity = -1;
        this.cachedDistortionEnabled = null;
        this.cachedLightingQuality = -1;
        this.cachedCameraX = 0;
        this.cachedCameraY = 0;

        // Particle buffer management
        this.particleBufferSize = 0;
        this.particleStagingBuffer = null;

        // Game particle sync (for explosions, etc.)
        this.gameParticleCount = 0;
        this.gameParticleBuffer = null;
        this.gameParticleRenderBindGroup = null;
        this.gameParticleRenderPipeline = null;
        this.gameParticleBindGroupLayout = null;

        // Game particle sync (for explosions, etc.)
        this.gameParticleCount = 0;
        this.gameParticleBuffer = null;
        this.gameParticleRenderBindGroup = null;
    }

    async init() {
        // Check for WebGPU support
        if (!navigator.gpu) {
            console.warn('WebGPU is not supported in this browser. Falling back to Canvas 2D.');
            this.fallbackMode = true;
            return false;
        }

        try {
            // Request adapter
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                console.warn('Failed to get WebGPU adapter. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            // Request device
            this.device = await adapter.requestDevice();

            // Get canvas context
            if (!gpuCanvas) {
                console.warn('gpuCanvas element not found. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            this.context = gpuCanvas.getContext('webgpu');
            if (!this.context) {
                console.warn('Failed to get WebGPU context. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            // Configure context
            this.format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: this.format,
            });

            this.uniformBuffer = this.device.createBuffer({
                size: 48,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // Create procedural background shader pipeline
            const shaderModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                        cameraX: f32,
                        cameraY: f32,
                    }
                    
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    
                    struct VertexOutput {
                        @builtin(position) position: vec4<f32>,
                        @location(0) uv: vec2<f32>,
                    }
                    
                    @vertex
                    fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> VertexOutput {
                        var pos = array<vec2<f32>, 3>(
                            vec2<f32>(-1.0, -1.0),
                            vec2<f32>(3.0, -1.0),
                            vec2<f32>(-1.0, 3.0)
                        );
                        var output: VertexOutput;
                        output.position = vec4<f32>(pos[in_vertex_index], 0.0, 1.0);
                        output.uv = pos[in_vertex_index] * 0.5 + 0.5;
                        return output;
                    }
                    
                    // Simple noise function
                    fn hash(p: vec2<f32>) -> f32 {
                        var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.13);
                        p3 += dot(p3, vec3<f32>(p3.y, p3.z, p3.x) + 3.333);
                        return fract((p3.x + p3.y) * p3.z);
                    }
                    
                    fn noise(p: vec2<f32>) -> f32 {
                        let i = floor(p);
                        let f = fract(p);
                        let u = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(hash(i + vec2<f32>(0.0, 0.0)), hash(i + vec2<f32>(1.0, 0.0)), u.x),
                            mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x),
                            u.y
                        );
                    }
                    
                    fn fbm(p: vec2<f32>) -> f32 {
                        var value = 0.0;
                        var amplitude = 0.5;
                        var frequency = 1.0;
                        var pp = p;
                        
                        for (var i = 0; i < 5; i++) {
                            value += amplitude * noise(pp * frequency);
                            frequency *= 2.0;
                            amplitude *= 0.5;
                        }
                        
                        return value;
                    }
                    
                    @fragment
                    fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
                        let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
                        let uv = input.uv;
                        let aspect = resolution.x / resolution.y;
                        
                        // Parallax offset for background (moves slower than camera)
                        let cameraOffset = vec2<f32>(uniforms.cameraX, uniforms.cameraY) / resolution;
                        var coord = vec2<f32>(uv.x * aspect, uv.y) + cameraOffset * 0.2; // 20% parallax speed
                        
                        // Animated noise layers - SLOWER and LESS BUSY
                        let time = uniforms.time * 0.05; // Slowed down
                        let noise1 = fbm(coord * 1.5 + vec2<f32>(time * 0.1, time * 0.05));
                        let noise2 = fbm(coord * 2.0 - vec2<f32>(time * 0.05, time * 0.1));
                        
                        // Combine noise layers
                        let combined = (noise1 * 0.6 + noise2 * 0.4);
                        
                        // Apocalyptic / Ash / Burnt Paper Theme
                        let darkBase = vec3<f32>(0.05, 0.05, 0.05); // Dark Grey/Black
                        let ashColor = vec3<f32>(0.2, 0.2, 0.2); // Ash Grey
                        let emberColor = vec3<f32>(0.3, 0.1, 0.05); // Dull glowing ember
                        
                        // Mix colors based on noise
                        var color = mix(darkBase, ashColor, combined * 0.8);
                        // Add subtle ember glow in dark spots
                        color = mix(color, emberColor, (1.0 - combined) * 0.3);

                        if (uniforms.distortionEnabled > 0.5) {
                            // Subtle heat haze instead of heavy swirl
                            let haze = sin(coord.y * 10.0 + time * 2.0) * 0.005;
                            coord.x += haze;
                        }
                        
                        // Vignette effect
                        let center = uv - 0.5;
                        let vignette = 1.0 - dot(center, center) * 0.8;
                        color *= vignette;
                        
                        // Apply bloom effect (brighten highlights)
                        let bloomIntensity = uniforms.bloomIntensity;
                        if (bloomIntensity > 0.0) {
                            // Identify bright areas
                            let brightness = dot(color, vec3<f32>(0.299, 0.587, 0.114));
                            let bloomThreshold = 0.2; // Higher threshold
                            if (brightness > bloomThreshold) {
                                let bloomAmount = (brightness - bloomThreshold) * bloomIntensity * 2.0;
                                color += vec3<f32>(bloomAmount * 0.4, bloomAmount * 0.2, bloomAmount * 0.1); // Warm bloom
                            }
                        }
                        
                        return vec4<f32>(color, 1.0);
                    }
                `,
            });

            // Separate bind group layouts for background rendering and particle system
            // Background render pipeline only needs uniforms (no storage buffers)
            const backgroundBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                ],
            });

            // Create background bind group (only uniforms, no particles)
            this.bindGroup = this.device.createBindGroup({
                layout: backgroundBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                ],
            });

            // Create background pipeline layout
            const backgroundPipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [backgroundBindGroupLayout],
            });

            // Create render pipeline for background
            this.renderPipeline = this.device.createRenderPipeline({
                layout: backgroundPipelineLayout,
                vertex: {
                    module: shaderModule,
                    entryPoint: 'vs_main',
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: 'fs_main',
                    targets: [
                        {
                            format: this.format,
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-list',
                },
            });

            const computeModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                        cameraX: f32,
                        cameraY: f32,
                    }
                    struct Particle {
                        pos: vec2<f32>,
                        vel: vec2<f32>,
                    }
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
                    @compute @workgroup_size(256)
                    fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
                        let i = gid.x;
                        if (i >= arrayLength(&particles)) { return; }
                        var p = particles[i];
                        let t = uniforms.time;
                        
                        // Floaty ash movement
                        // Dampen velocity
                        p.vel = p.vel * 0.95;
                        
                        // Add gentle drift
                        let noise = sin(t * 0.5 + f32(i) * 0.1) * 0.0002;
                        let gravity = 0.0001; // Slow falling
                        
                        p.vel += vec2<f32>(noise, gravity);
                        
                        p.pos += p.vel;
                        let w = uniforms.resolutionX;
                        let h = uniforms.resolutionY;
                        if (p.pos.x < 0.0) { p.pos.x += w; }
                        if (p.pos.y < 0.0) { p.pos.y += h; }
                        if (p.pos.x > w) { p.pos.x -= w; }
                        if (p.pos.y > h) { p.pos.y -= h; }
                        particles[i] = p;
                    }
                `,
            });

            // Particle system bind group layout (for compute and render)
            // Compute needs read-write, vertex needs read-only
            // Use separate layouts: compute can write, vertex can only read
            this.particleComputeBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // Read-write for compute
                ],
            });

            this.particleRenderBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Read-only for vertex
                ],
            });

            // Create compute pipeline layout
            const computePipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [this.particleComputeBindGroupLayout]
            });

            this.computePipeline = this.device.createComputePipeline({
                layout: computePipelineLayout,
                compute: { module: computeModule, entryPoint: 'main' },
            });

            const particleVertexModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                        cameraX: f32,
                        cameraY: f32,
                    }
                    struct Particle { pos: vec2<f32>, vel: vec2<f32> }
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    @group(0) @binding(1) var<storage> particles: array<Particle>;
                    
                    struct VSOut { 
                        @builtin(position) position: vec4<f32>,
                        @location(0) random: f32
                    };
                    
                    @vertex fn vs_main(@builtin(vertex_index) i: u32) -> VSOut {
                        let p = particles[i].pos;
                        
                        // Apply camera offset for world-space feel (wrapping)
                        let camPos = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
                        let res = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
                        
                        // Calculate relative position with wrapping
                        // We want particles to stay around the screen but move opposite to camera
                        // effectively making them "world space" but repeating
                        let relativePos = (p - camPos) % res;
                        
                        // Handle negative modulo result in WGSL/GLSL style
                        let wrappedPos = relativePos + select(vec2<f32>(0.0), res, relativePos < vec2<f32>(0.0));
                        
                        let x = (wrappedPos.x / uniforms.resolutionX) * 2.0 - 1.0;
                        let y = (wrappedPos.y / uniforms.resolutionY) * -2.0 + 1.0;
                        var out: VSOut;
                        out.position = vec4<f32>(x, y, 0.0, 1.0);
                        // Generate stable random value based on index
                        out.random = fract(sin(f32(i)) * 43758.5453);
                        return out;
                    }
                    
                    @fragment fn fs_main(in: VSOut) -> @location(0) vec4<f32> { 
                        // Mix between Ash (grey) and Ember (orange)
                        // 90% Ash, 10% Embers
                        let isEmber = step(0.9, in.random);
                        
                        let ashColor = vec4<f32>(0.5, 0.5, 0.5, 0.4); // Grey, semi-transparent
                        let emberColor = vec4<f32>(1.0, 0.4, 0.1, 0.8); // Orange/Red, brighter
                        
                        return mix(ashColor, emberColor, isEmber);
                    }
                `,
            });

            // Create particle render pipeline layout
            const particleRenderPipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [this.particleRenderBindGroupLayout],
            });

            this.particleRenderPipeline = this.device.createRenderPipeline({
                layout: particleRenderPipelineLayout,
                vertex: { module: particleVertexModule, entryPoint: 'vs_main' },
                fragment: { module: particleVertexModule, entryPoint: 'fs_main', targets: [{ format: this.format }] },
                primitive: { topology: 'point-list' },
            });

            // Create game particle shader (for explosions with color and radius)
            // Data format: [x, y, r, g, b, a, radius, life] = 8 floats
            // Render as billboarded quads (4 vertices per particle)
            const gameParticleModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                        cameraX: f32,
                        cameraY: f32,
                    }
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    @group(0) @binding(1) var<storage> particleData: array<f32>;
                    
                    struct VSOut {
                        @builtin(position) position: vec4<f32>,
                        @location(0) color: vec4<f32>,
                        @location(1) uv: vec2<f32>,
                    }
                    
                    @vertex
                    fn vs_main(@builtin(vertex_index) vertexId: u32) -> VSOut {
                        // Each particle is rendered as a quad (4 vertices)
                        // vertexId: 0,1,2,3 = one quad
                        let particleIndex = vertexId / 4u;
                        let quadVertex = vertexId % 4u;
                        
                        let idx = particleIndex * 8u;
                        let x = particleData[idx + 0u];
                        let y = particleData[idx + 1u];
                        let r = particleData[idx + 2u];
                        let g = particleData[idx + 3u];
                        let b = particleData[idx + 4u];
                        let a = particleData[idx + 5u];
                        let radius = particleData[idx + 6u];
                        
                        // Make particles MUCH bigger - multiply radius by 5 and ensure minimum size
                        // Use select() instead of max() for WGSL compatibility
                        let baseSize = radius * 5.0;
                        let size = select(10.0, baseSize, baseSize > 10.0); // At least 10 pixels, or 5x radius
                        
                        // Quad corners for triangle-strip: order must be top-left, bottom-left, top-right, bottom-right
                        // This creates triangles: (0,1,2) and (1,2,3)
                        var quadPos = vec2<f32>(0.0, 0.0);
                        var uv = vec2<f32>(0.0, 0.0);
                        
                        if (quadVertex == 0u) { // Top-left (first triangle start)
                            quadPos = vec2<f32>(-1.0, 1.0);
                            uv = vec2<f32>(0.0, 0.0);
                        } else if (quadVertex == 1u) { // Bottom-left (first triangle, second triangle start)
                            quadPos = vec2<f32>(-1.0, -1.0);
                            uv = vec2<f32>(0.0, 1.0);
                        } else if (quadVertex == 2u) { // Top-right (first triangle end, second triangle)
                            quadPos = vec2<f32>(1.0, 1.0);
                            uv = vec2<f32>(1.0, 0.0);
                        } else { // Bottom-right (second triangle end)
                            quadPos = vec2<f32>(1.0, -1.0);
                            uv = vec2<f32>(1.0, 1.0);
                        }
                        
                        // Convert particle position to NDC
                        // Convert particle position to NDC (apply camera offset)
                        // Game particles are in world space, so we subtract camera position directly
                        let camX = uniforms.cameraX;
                        let camY = uniforms.cameraY;
                        
                        let screenX = x - camX;
                        let screenY = y - camY;
                        
                        let ndcX = (screenX / uniforms.resolutionX) * 2.0 - 1.0;
                        let ndcY = (screenY / uniforms.resolutionY) * -2.0 + 1.0;
                        
                        // Scale quad by particle size (in NDC space)
                        let scaleX = (size / uniforms.resolutionX) * 2.0;
                        let scaleY = (size / uniforms.resolutionY) * 2.0;
                        
                        var out: VSOut;
                        out.position = vec4<f32>(
                            ndcX + quadPos.x * scaleX,
                            ndcY + quadPos.y * scaleY,
                            0.0,
                            1.0
                        );
                        out.color = vec4<f32>(r, g, b, a);
                        out.uv = uv;
                        return out;
                    }
                    
                    @fragment
                    fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
                        // Create circular particle with smooth edges
                        let center = vec2<f32>(0.5, 0.5);
                        let dist = distance(input.uv, center);
                        let alpha = input.color.a * (1.0 - smoothstep(0.3, 0.5, dist));
                        return vec4<f32>(input.color.rgb, alpha);
                    }
                `,
            });

            // Create bind group layout for game particles
            this.gameParticleBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                ],
            });

            const gameParticlePipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [this.gameParticleBindGroupLayout],
            });

            this.gameParticleRenderPipeline = this.device.createRenderPipeline({
                layout: gameParticlePipelineLayout,
                vertex: { module: gameParticleModule, entryPoint: 'vs_main' },
                fragment: {
                    module: gameParticleModule, entryPoint: 'fs_main', targets: [{
                        format: this.format, blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                        }
                    }]
                },
                primitive: { topology: 'triangle-strip' },
            });

            this.isInitialized = true;
            console.log('WebGPU renderer initialized successfully.');
            return true;
        } catch (error) {
            console.error('Error initializing WebGPU:', error);
            this.fallbackMode = true;
            return false;
        }
    }

    render(dt, camera = { x: 0, y: 0 }) {
        if (!this.isInitialized || this.fallbackMode) {
            return;
        }

        if (!this.context || !this.device || !this.renderPipeline) {
            return;
        }

        try {
            // Update time
            this.time += dt / 1000; // Convert to seconds

            // Check if uniforms need updating (dirty flag system)
            const resolutionChanged = gpuCanvas.width !== this.cachedResolutionX ||
                gpuCanvas.height !== this.cachedResolutionY;
            const bloomChanged = this.bloomIntensity !== this.cachedBloomIntensity;
            const distortionChanged = this.distortionEnabled !== this.cachedDistortionEnabled;
            const lightingChanged = this.lightingQuality !== this.cachedLightingQuality;
            const cameraChanged = camera.x !== this.cachedCameraX || camera.y !== this.cachedCameraY;

            // Always update time, but only update buffer if something changed
            if (this.uniformsDirty || resolutionChanged || bloomChanged || distortionChanged || lightingChanged || cameraChanged) {
                const uniformData = new Float32Array([
                    this.time,
                    gpuCanvas.width,
                    gpuCanvas.height,
                    this.bloomIntensity,
                    this.distortionEnabled ? 1 : 0,
                    this.lightingQuality,
                    camera.x,
                    camera.y,
                ]);
                this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

                // Update cached values
                this.cachedTime = this.time;
                this.cachedResolutionX = gpuCanvas.width;
                this.cachedResolutionY = gpuCanvas.height;
                this.cachedBloomIntensity = this.bloomIntensity;
                this.cachedDistortionEnabled = this.distortionEnabled;
                this.cachedLightingQuality = this.lightingQuality;
                this.cachedCameraX = camera.x;
                this.cachedCameraY = camera.y;
                this.uniformsDirty = false;
            }

            const encoder = this.device.createCommandEncoder();

            if (this.particleCount > 0 && this.particleBuffer && this.particleComputeBindGroup) {
                const cPass = encoder.beginComputePass();
                cPass.setPipeline(this.computePipeline);
                cPass.setBindGroup(0, this.particleComputeBindGroup);
                const groups = Math.ceil(this.particleCount / 256);
                cPass.dispatchWorkgroups(groups);
                cPass.end();
            }

            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.context.getCurrentTexture().createView(),
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // Transparent clear for particle layer
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            // Set pipeline and bind group for background
            pass.setPipeline(this.renderPipeline);
            pass.setBindGroup(0, this.bindGroup); // Background uses separate bind group
            pass.draw(3, 1, 0, 0);

            // Render background particles with separate bind group (read-only storage)
            if (this.particleCount > 0 && this.particleBuffer && this.particleRenderBindGroup) {
                pass.setPipeline(this.particleRenderPipeline);
                pass.setBindGroup(0, this.particleRenderBindGroup);
                pass.draw(this.particleCount, 1, 0, 0);
            }

            // Render game particles (explosions, etc.) if synced
            // Each particle is rendered as a quad (4 vertices = triangle-strip with 2 triangles)
            if (this.gameParticleCount > 0 && this.gameParticleBuffer && this.gameParticleRenderBindGroup) {
                pass.setPipeline(this.gameParticleRenderPipeline);
                pass.setBindGroup(0, this.gameParticleRenderBindGroup);
                // Draw 4 vertices per particle (quad), so total vertices = particleCount * 4
                const vertexCount = this.gameParticleCount * 4;
                pass.draw(vertexCount, 1, 0, 0);
                console.log('[WebGPU] render: Drawing', this.gameParticleCount, 'particles (', vertexCount, 'vertices)');
            } else {
                if (this.gameParticleCount > 0) {
                    console.warn('[WebGPU] render: Particles exist but not rendering - count:', this.gameParticleCount, 'buffer:', !!this.gameParticleBuffer, 'bindGroup:', !!this.gameParticleRenderBindGroup);
                }
            }
            pass.end();

            // Submit commands
            this.device.queue.submit([encoder.finish()]);
        } catch (error) {
            console.error('Error rendering WebGPU frame:', error);
            // Graceful fallback: disable WebGPU and fall back to Canvas 2D
            if (!this.fallbackMode) {
                console.warn('WebGPU render error detected, falling back to Canvas 2D');
                this.fallbackMode = true;
            }
            // Don't throw, just log the error to prevent breaking the game loop
        }
    }

    /**
     * Helper function to check WebGPU availability (consolidates checks)
     */
    static isWebGPUAvailable() {
        return typeof navigator !== 'undefined' && navigator.gpu !== undefined;
    }

    isAvailable() {
        return this.isInitialized && !this.fallbackMode;
    }

    setBloomEnabled(enabled) {
        this.bloomEnabled = enabled;
    }

    setBloomIntensity(intensity) {
        const newIntensity = Math.max(0, Math.min(1, intensity));
        if (this.bloomIntensity !== newIntensity) {
            this.bloomIntensity = newIntensity;
            this.uniformsDirty = true;
        }
    }

    setDistortionEffects(enabled) {
        const newEnabled = !!enabled;
        if (this.distortionEnabled !== newEnabled) {
            this.distortionEnabled = newEnabled;
            this.uniformsDirty = true;
        }
    }

    setLightingQuality(level) {
        let newQuality = 1;
        if (level === 'off') newQuality = 0;
        else if (level === 'simple') newQuality = 1;
        else newQuality = 2;

        if (this.lightingQuality !== newQuality) {
            this.lightingQuality = newQuality;
            this.uniformsDirty = true;
        }
    }

    setParticleCount(level) {
        let count = 0;
        if (level === 'low') count = 0;
        else if (level === 'high') count = 10000;
        else if (level === 'ultra') count = 50000;
        if (count === this.particleCount) return;
        this.particleCount = count;
        if (!this.device) return;

        const stride = 16; // 4 floats * 4 bytes each
        const requiredSize = count * stride;

        // Only recreate buffer if size changed significantly or doesn't exist
        if (!this.particleBuffer || this.particleBufferSize < requiredSize) {
            // Destroy old buffer if exists
            if (this.particleBuffer) {
                this.particleBuffer.destroy?.();
                this.particleBuffer = null;
            }

            if (count > 0) {
                // Create buffer with required size
                this.particleBuffer = this.device.createBuffer({
                    size: requiredSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                });
                this.particleBufferSize = requiredSize;

                // Initialize particle data
                const initData = new Float32Array(count * 4);
                const w = gpuCanvas.width || 1920;
                const h = gpuCanvas.height || 1080;
                for (let i = 0; i < count; i++) {
                    initData[i * 4 + 0] = Math.random() * w;
                    initData[i * 4 + 1] = Math.random() * h;
                    initData[i * 4 + 2] = (Math.random() - 0.5) * 0.5;
                    initData[i * 4 + 3] = (Math.random() - 0.5) * 0.5;
                }
                this.device.queue.writeBuffer(this.particleBuffer, 0, initData.buffer);

                // Recreate bind groups with new buffer
                this._createParticleBindGroups();
            } else {
                // No particles - cleanup
                this.particleBufferSize = 0;
                this.particleComputeBindGroup = null;
                this.particleRenderBindGroup = null;
            }
        } else if (count > 0) {
            // Buffer exists and is large enough, just recreate bind groups if needed
            this._createParticleBindGroups();
        } else {
            // No particles - cleanup bind groups
            this.particleComputeBindGroup = null;
            this.particleRenderBindGroup = null;
        }
    }

    /**
     * Helper method to create particle bind groups (reused when buffer changes)
     */
    _createParticleBindGroups() {
        if (!this.particleBuffer || !this.particleComputeBindGroupLayout || !this.particleRenderBindGroupLayout) {
            return;
        }

        this.particleComputeBindGroup = this.device.createBindGroup({
            layout: this.particleComputeBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } }, // Read-write for compute
            ],
        });

        this.particleRenderBindGroup = this.device.createBindGroup({
            layout: this.particleRenderBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } }, // Read-only for vertex shader
            ],
        });
    }

    /**
     * Sync game particles from gameState.particles to WebGPU buffer
     * @param {Array} particles - Array of particle objects from gameState.particles
     */
    syncGameParticles(particles) {
        if (!this.device || !this.isInitialized || this.fallbackMode) {
            console.log('[WebGPU] syncGameParticles: Skipping - device:', !!this.device, 'initialized:', this.isInitialized, 'fallback:', this.fallbackMode);
            return;
        }

        if (!particles || particles.length === 0) {
            this.gameParticleCount = 0;
            this.gameParticleRenderBindGroup = null;
            return;
        }

        console.log('[WebGPU] syncGameParticles: Syncing', particles.length, 'particles');

        const count = Math.min(particles.length, 500); // Limit to 500 particles for performance
        const stride = 32; // 8 floats * 4 bytes: pos(2) + color(4) + radius(1) + life(1) + maxLife(1) = 9, but we'll use 8 for alignment
        const requiredSize = count * stride;

        // Recreate buffer if needed
        if (!this.gameParticleBuffer || this.gameParticleBufferSize < requiredSize) {
            if (this.gameParticleBuffer) {
                this.gameParticleBuffer.destroy?.();
            }

            this.gameParticleBuffer = this.device.createBuffer({
                size: requiredSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            this.gameParticleBufferSize = requiredSize;
        }

        // Convert particles to WebGPU format
        // Format: [x, y, r, g, b, a, radius, life, maxLife]
        const particleData = new Float32Array(count * 8);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            if (!p) continue;

            // Parse color
            let r = 1.0, g = 1.0, b = 1.0, a = 1.0;
            if (p.color) {
                if (p.color.startsWith('rgba')) {
                    const match = p.color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
                    if (match) {
                        r = parseFloat(match[1]) / 255;
                        g = parseFloat(match[2]) / 255;
                        b = parseFloat(match[3]) / 255;
                        a = match[4] ? parseFloat(match[4]) : 1.0;
                    }
                } else if (p.color.startsWith('#')) {
                    const hex = p.color.replace('#', '');
                    r = parseInt(hex.substr(0, 2), 16) / 255;
                    g = parseInt(hex.substr(2, 2), 16) / 255;
                    b = parseInt(hex.substr(4, 2), 16) / 255;
                }
            }

            const maxLife = p.maxLife || p.life || 30;
            const lifeRatio = p.life / maxLife;
            a *= Math.max(0, Math.min(1, lifeRatio)); // Apply life-based alpha

            const idx = i * 8;
            particleData[idx + 0] = p.x || 0;
            particleData[idx + 1] = p.y || 0;
            particleData[idx + 2] = r;
            particleData[idx + 3] = g;
            particleData[idx + 4] = b;
            particleData[idx + 5] = a;
            particleData[idx + 6] = p.radius || 2;
            particleData[idx + 7] = p.life || 0;
        }

        // Write to buffer
        this.device.queue.writeBuffer(this.gameParticleBuffer, 0, particleData.buffer);
        console.log('[WebGPU] syncGameParticles: Wrote', count, 'particles to buffer, buffer size:', requiredSize, 'bytes');

        // Update count and create bind group if needed
        this.gameParticleCount = count;

        if (this.gameParticleBindGroupLayout && this.gameParticleBuffer) {
            this.gameParticleRenderBindGroup = this.device.createBindGroup({
                layout: this.gameParticleBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.gameParticleBuffer } },
                ],
            });
            console.log('[WebGPU] syncGameParticles: Created bind group, particle count:', this.gameParticleCount);
        } else {
            console.warn('[WebGPU] syncGameParticles: Failed to create bind group - layout:', !!this.gameParticleBindGroupLayout, 'buffer:', !!this.gameParticleBuffer);
        }
    }
}

