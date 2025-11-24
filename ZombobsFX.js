export class ZombobsFX {
    constructor() {
        this.canvas = null;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.computePipeline = null;
        this.particleBindGroups = [];
        this.numParticles = 100000; // 100k Particles!
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Parameters
        this.paramsBuffer = null;
        this.simParams = {
            deltaTime: 0.016,
            cursorX: 0.0,
            cursorY: 0.0,
            repelStrength: 2.0
        };
    }

    async init(targetCanvasInfo) {
        // 1. Setup WebGPU Context
        if (!navigator.gpu) {
            console.error("WebGPU not supported on this browser.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();

        // Create or attach to canvas
        if (typeof targetCanvasInfo === 'string') {
            this.canvas = document.querySelector(targetCanvasInfo);
        } else {
            this.canvas = targetCanvasInfo;
        }
        
        // Ensure canvas is overlayed correctly if you want it as a background/foreground
        // this.canvas.style.position = 'absolute'; 
        // this.canvas.style.top = '0'; 
        // this.canvas.style.zIndex = '-1'; // Background

        this.context = this.canvas.getContext('webgpu');
        this.format = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        await this.createAssets();
        this.setupInput();
        this.animate();
    }

    async createAssets() {
        const shaderModule = this.device.createShaderModule({
            label: 'Zombobs Shaders',
            code: `
            struct Particle {
                pos : vec2<f32>,
                vel : vec2<f32>,
                life : f32,
                padding : f32,
            };

            struct SimParams {
                deltaTime : f32,
                cursorX : f32,
                cursorY : f32,
                repelStrength : f32,
            };

            @group(0) @binding(0) var<uniform> params : SimParams;
            @group(0) @binding(1) var<storage, read_write> particlesA : array<Particle>;
            @group(0) @binding(2) var<storage, read_write> particlesB : array<Particle>;

            // Pseudo-random generator
            fn rand(n: vec2<f32>) -> f32 {
                return fract(sin(dot(n, vec2<f32>(12.9898, 4.1414))) * 43758.5453);
            }

            // Compute Shader: Updates physics
            @compute @workgroup_size(64)
            fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
                let index = GlobalInvocationID.x;
                if (index >= arrayLength(&particlesA)) { return; }

                var p = particlesA[index];

                // Curl Noise-ish movement
                let noiseScale = 3.0;
                let angle = rand(p.pos * 0.1) * 6.28;
                let flow = vec2<f32>(cos(angle), sin(angle)) * 0.002;

                // Mouse Repulsion (The "Antidote" Effect)
                let dx = p.pos.x - params.cursorX;
                let dy = p.pos.y - params.cursorY;
                let dist = sqrt(dx*dx + dy*dy);
                var repel = vec2<f32>(0.0, 0.0);
                
                if (dist < 0.3) {
                    let force = (0.3 - dist) * params.repelStrength;
                    repel = normalize(vec2<f32>(dx, dy)) * force * 0.05;
                }

                p.vel = p.vel * 0.96 + flow + repel;
                p.pos = p.pos + p.vel;

                // Wrap around screen
                if (p.pos.x < -1.0) { p.pos.x = 1.0; }
                if (p.pos.x > 1.0) { p.pos.x = -1.0; }
                if (p.pos.y < -1.0) { p.pos.y = 1.0; }
                if (p.pos.y > 1.0) { p.pos.y = -1.0; }

                // Color/Life modulation
                p.life = p.life - 0.001;
                if (p.life < 0.0) { p.life = 1.0; p.pos = vec2<f32>(rand(vec2<f32>(f32(index), p.vel.x))*2.0 - 1.0, rand(vec2<f32>(p.vel.y, f32(index)))*2.0 - 1.0); }

                particlesB[index] = p;
            }

            // Vertex Shader
            struct VertexOutput {
                @builtin(position) Position : vec4<f32>,
                @location(0) color : vec4<f32>,
                @location(1) uv : vec2<f32>,
            };

            @vertex
            fn vs_main(
                @builtin(vertex_index) vIndex : u32,
                @builtin(instance_index) iIndex : u32,
                @location(0) pos : vec2<f32>, // From particle buffer (manual fetch needed usually, but we use storage)
            ) -> VertexOutput {
                // Quad vertices
                var pos_vertex = array<vec2<f32>, 6>(
                    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
                    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
                );
                
                let particle = particlesA[iIndex];
                let vertex_pos = pos_vertex[vIndex] * 0.008; // Particle Size

                var output : VertexOutput;
                output.Position = vec4<f32>(particle.pos + vertex_pos, 0.0, 1.0);
                output.uv = pos_vertex[vIndex];
                
                // Toxic Green / Zombie Purple Gradient
                let lifeFactor = particle.life;
                let toxicGreen = vec3<f32>(0.2, 1.0, 0.1);
                let zombiePurple = vec3<f32>(0.6, 0.0, 0.8);
                
                output.color = vec4<f32>(mix(zombiePurple, toxicGreen, lifeFactor), lifeFactor * 0.8);
                return output;
            }

            @fragment
            fn fs_main(@location(0) color : vec4<f32>, @location(1) uv : vec2<f32>) -> @location(0) vec4<f32> {
                // Circular soft particle
                let dist = length(uv);
                if (dist > 1.0) { discard; }
                let alpha = (1.0 - dist) * color.a;
                return vec4<f32>(color.rgb, alpha);
            }
            `
        });

        // 3. Buffers
        // Initial Particle Data
        const initialParticleData = new Float32Array(this.numParticles * 6); // 4 floats (pos, vel) + 2 (life, pad)
        for (let i = 0; i < this.numParticles; ++i) {
            initialParticleData[i * 6 + 0] = (Math.random() * 2 - 1); // x
            initialParticleData[i * 6 + 1] = (Math.random() * 2 - 1); // y
            initialParticleData[i * 6 + 2] = 0; // vx
            initialParticleData[i * 6 + 3] = 0; // vy
            initialParticleData[i * 6 + 4] = Math.random(); // life
            initialParticleData[i * 6 + 5] = 0; // padding
        }

        this.particleBuffers = [
            this.device.createBuffer({ size: initialParticleData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, mappedAtCreation: true }),
            this.device.createBuffer({ size: initialParticleData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
        ];
        new Float32Array(this.particleBuffers[0].getMappedRange()).set(initialParticleData);
        this.particleBuffers[0].unmap();

        // Uniform Buffer
        this.paramsBuffer = this.device.createBuffer({
            size: 16, // 4 floats
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 4. Pipelines
        // Compute Pipeline
        const computeBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX, buffer: { type: 'storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX, buffer: { type: 'storage' } },
            ]
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
            compute: { module: shaderModule, entryPoint: 'simulate' }
        });

        // Render Pipeline
        this.pipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
            vertex: { module: shaderModule, entryPoint: 'vs_main' },
            fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ 
                format: this.format,
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, // Additive Blending for Glow
                    alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' }
                }
            }] },
            primitive: { topology: 'triangle-list' }
        });

        // Create Bind Groups (Double buffering for ping-pong)
        this.particleBindGroups = [
            this.device.createBindGroup({
                layout: computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[1] } },
                ]
            }),
            this.device.createBindGroup({
                layout: computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[0] } },
                ]
            })
        ];
    }

    setupInput() {
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Map mouse to -1 to 1
            this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1); // Flip Y
        });
    }

    animate() {
        // Update Uniforms
        const paramsData = new Float32Array([0.016, this.mouseX, this.mouseY, 2.0]);
        this.device.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

        const commandEncoder = this.device.createCommandEncoder();

        // 1. Compute Pass
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.computePipeline);
        passEncoder.setBindGroup(0, this.particleBindGroups[this.frame % 2]);
        passEncoder.dispatchWorkgroups(Math.ceil(this.numParticles / 64));
        passEncoder.end();

        // 2. Render Pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 }, // Dark Purple Background
                loadOp: 'clear',
                storeOp: 'store',
            }]
        });
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.particleBindGroups[this.frame % 2]);
        renderPass.draw(6, this.numParticles); // Draw 6 vertices (quad) per particle
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.frame++;
        requestAnimationFrame(() => this.animate());
    }
    
    frame = 0;
}