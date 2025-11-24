import { ctx } from '../core/canvas.js';

/**
 * Prop - Base class for world props (rocks, debris, burnt cars, skulls, zombie parts)
 * Props are static decorative elements that spawn procedurally
 */
export class Prop {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'rock', 'debris', 'burntCar', 'skull', 'zombieArms', 'zombieLegs'
        this.rotation = Math.random() * Math.PI * 2; // Random rotation
        
        // Set dimensions and visual properties based on type
        switch (type) {
            case 'rock':
                this.width = 20 + Math.random() * 15; // 20-35px
                this.height = 20 + Math.random() * 15;
                this.color = '#4a4a4a';
                this.outlineColor = '#2a2a2a';
                break;
            case 'debris':
                this.width = 15 + Math.random() * 20; // 15-35px
                this.height = 15 + Math.random() * 20;
                this.color = '#3a3a3a';
                this.outlineColor = '#1a1a1a';
                break;
            case 'burntCar':
                this.width = 60 + Math.random() * 30; // 60-90px (increased from 40-60px)
                this.height = 80 + Math.random() * 40; // 80-120px (increased from 60-80px)
                this.color = '#1a1a1a';
                this.outlineColor = '#0a0a0a';
                // Initialize smoke particles for burnt car
                this.smokeParticles = [];
                this.initSmokeParticles();
                // Initialize fire particles for burnt car
                this.fireParticles = [];
                this.initFireParticles();
                break;
            case 'skull':
                this.width = 25 + Math.random() * 10; // 25-35px
                this.height = 25 + Math.random() * 10;
                this.color = '#e8e8e8'; // Bone white
                this.outlineColor = '#4a4a4a'; // Dark cracks
                // Store fixed texture mark positions for bone texture
                this.textureMarks = [];
                for (let i = 0; i < 4; i++) {
                    this.textureMarks.push({
                        x: (Math.random() - 0.5) * 0.6,
                        y: (Math.random() - 0.5) * 0.6,
                        size: 1 + Math.random() * 1.5
                    });
                }
                break;
            case 'zombieArms':
                this.width = 20 + Math.random() * 10; // 20-30px
                this.height = 40 + Math.random() * 20; // 40-60px
                this.color = '#8b7355'; // Decayed flesh
                this.outlineColor = '#d4c5a9'; // Bone
                this.armCount = 2 + Math.floor(Math.random() * 2); // 2-3 arms
                // Store random rotations and decay marks for each arm (fixed per instance)
                this.armRotations = [];
                this.armDecayMarks = [];
                for (let i = 0; i < this.armCount; i++) {
                    this.armRotations.push((Math.random() - 0.5) * 0.3); // -0.15 to 0.15 radians
                    const marks = [];
                    for (let j = 0; j < 2; j++) {
                        marks.push({
                            x: (Math.random() - 0.5) * 0.6,
                            y: (Math.random() - 0.5) * 0.6
                        });
                    }
                    this.armDecayMarks.push(marks);
                }
                break;
            case 'zombieLegs':
                this.width = 25 + Math.random() * 10; // 25-35px
                this.height = 50 + Math.random() * 20; // 50-70px
                this.color = '#8b7355'; // Decayed flesh
                this.outlineColor = '#d4c5a9'; // Bone
                // Store random rotations and decay marks for each leg (fixed per instance)
                this.legRotations = [];
                this.legDecayMarks = [];
                for (let i = 0; i < 2; i++) {
                    this.legRotations.push((Math.random() - 0.5) * 0.2); // -0.1 to 0.1 radians
                    const marks = [];
                    for (let j = 0; j < 3; j++) {
                        marks.push({
                            x: (Math.random() - 0.5) * 0.6,
                            y: (Math.random() - 0.5) * 0.6
                        });
                    }
                    this.legDecayMarks.push(marks);
                }
                break;
            default:
                this.width = 20;
                this.height = 20;
                this.color = '#4a4a4a';
                this.outlineColor = '#2a2a2a';
        }
        
        // Collision bounds (circular for simplicity)
        this.radius = Math.max(this.width, this.height) / 2;
    }

    /**
     * Initialize smoke particles for burnt car
     */
    initSmokeParticles() {
        const particleCount = 3 + Math.floor(Math.random() * 3); // 3-5 particles
        this.smokeParticles = [];
        this.lastUpdateTime = Date.now(); // Initialize update time
        
        for (let i = 0; i < particleCount; i++) {
            this.smokeParticles.push({
                x: (Math.random() - 0.5) * this.width * 0.6, // Random position on hood
                y: -this.height * 0.4 + Math.random() * this.height * 0.2, // Top of car
                vx: (Math.random() - 0.5) * 0.4, // Horizontal drift
                vy: -0.5 - Math.random() * 0.5, // Rise speed
                opacity: 0.3 + Math.random() * 0.3, // 0.3-0.6
                size: 3 + Math.random() * 4, // 3-7px
                lifetime: 2000 + Math.random() * 2000, // 2-4 seconds
                age: Math.random() * 1000, // Random starting age
                currentOpacity: 0.3 + Math.random() * 0.3 // Initialize current opacity
            });
        }
    }

    /**
     * Initialize fire particles for burnt car
     * Fire particles spawn from windows and engine area
     */
    initFireParticles() {
        const fireColors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const particleCount = 4 + Math.floor(Math.random() * 4); // 4-7 particles
        
        for (let i = 0; i < particleCount; i++) {
            // Determine spawn location: windows or engine/hood
            const locationType = Math.random();
            let spawnX, spawnY;
            
            if (locationType < 0.4) {
                // Left window
                spawnX = -this.width * 0.4 + Math.random() * this.width * 0.2;
                spawnY = -this.height * 0.15 + Math.random() * this.height * 0.15;
            } else if (locationType < 0.8) {
                // Right window
                spawnX = this.width * 0.2 + Math.random() * this.width * 0.2;
                spawnY = -this.height * 0.15 + Math.random() * this.height * 0.15;
            } else {
                // Engine/hood area
                spawnX = (Math.random() - 0.5) * this.width * 0.5;
                spawnY = -this.height * 0.45 + Math.random() * this.height * 0.1;
            }
            
            this.fireParticles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 0.3, // Horizontal drift
                vy: -0.8 - Math.random() * 0.6, // Rise speed (faster than smoke)
                color: fireColors[Math.floor(Math.random() * fireColors.length)],
                baseOpacity: 0.7 + Math.random() * 0.3, // 0.7-1.0
                size: 4 + Math.random() * 5, // 4-9px
                baseSize: 4 + Math.random() * 5, // Store base size for flickering
                lifetime: 1000 + Math.random() * 1000, // 1-2 seconds (shorter than smoke)
                age: Math.random() * 500, // Random starting age
                flickerPhase: Math.random() * Math.PI * 2, // Random phase for flickering
                currentOpacity: 0.7 + Math.random() * 0.3,
                currentSize: 4 + Math.random() * 5
            });
        }
    }

    /**
     * Update smoke and fire particles (only for burntCar)
     */
    update() {
        if (this.type !== 'burntCar' || !this.smokeParticles) return;
        
        const now = Date.now();
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = now;
            return;
        }
        
        const deltaTime = Math.min(now - this.lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
        this.lastUpdateTime = now;
        
        // Update smoke particles
        for (let i = 0; i < this.smokeParticles.length; i++) {
            const particle = this.smokeParticles[i];
            
            // Update age
            particle.age += deltaTime;
            
            // Respawn if expired
            if (particle.age >= particle.lifetime) {
                particle.x = (Math.random() - 0.5) * this.width * 0.6;
                particle.y = -this.height * 0.4 + Math.random() * this.height * 0.2;
                particle.age = 0;
                particle.opacity = 0.3 + Math.random() * 0.3;
                particle.currentOpacity = particle.opacity;
            } else {
                // Update position (relative to car)
                particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
                particle.y += particle.vy * (deltaTime / 16);
                
                // Fade out over lifetime
                const lifeRatio = particle.age / particle.lifetime;
                particle.currentOpacity = particle.opacity * (1 - lifeRatio);
            }
        }
        
        // Update fire particles
        if (this.fireParticles && this.fireParticles.length > 0) {
            for (let i = 0; i < this.fireParticles.length; i++) {
                const particle = this.fireParticles[i];
                
                // Update age
                particle.age += deltaTime;
                
                // Respawn if expired
                if (particle.age >= particle.lifetime) {
                    // Respawn at original location type
                    const locationType = Math.random();
                    if (locationType < 0.4) {
                        // Left window
                        particle.x = -this.width * 0.4 + Math.random() * this.width * 0.2;
                        particle.y = -this.height * 0.15 + Math.random() * this.height * 0.15;
                    } else if (locationType < 0.8) {
                        // Right window
                        particle.x = this.width * 0.2 + Math.random() * this.width * 0.2;
                        particle.y = -this.height * 0.15 + Math.random() * this.height * 0.15;
                    } else {
                        // Engine/hood area
                        particle.x = (Math.random() - 0.5) * this.width * 0.5;
                        particle.y = -this.height * 0.45 + Math.random() * this.height * 0.1;
                    }
                    particle.age = 0;
                    particle.baseOpacity = 0.7 + Math.random() * 0.3;
                    particle.flickerPhase = Math.random() * Math.PI * 2;
                } else {
                    // Update position (relative to car)
                    particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
                    particle.y += particle.vy * (deltaTime / 16);
                    
                    // Flickering effect using sine wave
                    const flickerSpeed = 0.02; // Speed of flickering
                    particle.flickerPhase += flickerSpeed * (deltaTime / 16);
                    const flickerAmount = 0.3; // Amount of flicker variation
                    const flicker = Math.sin(particle.flickerPhase) * flickerAmount;
                    
                    // Fade out over lifetime with flickering
                    const lifeRatio = particle.age / particle.lifetime;
                    const baseFade = 1 - lifeRatio;
                    particle.currentOpacity = Math.max(0, particle.baseOpacity * baseFade * (1 + flicker));
                    
                    // Size variation for flickering
                    const sizeFlicker = Math.sin(particle.flickerPhase * 1.3) * 0.2;
                    particle.currentSize = particle.baseSize * (1 + sizeFlicker);
                }
            }
        }
    }

    /**
     * Render the prop on the canvas
     */
    draw() {
        ctx.save();
        
        // Translate to prop position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw based on type
        switch (this.type) {
            case 'rock':
                this.drawRock();
                break;
            case 'debris':
                this.drawDebris();
                break;
            case 'burntCar':
                this.drawBurntCar();
                break;
            case 'skull':
                this.drawSkull();
                break;
            case 'zombieArms':
                this.drawZombieArms();
                break;
            case 'zombieLegs':
                this.drawZombieLegs();
                break;
        }
        
        ctx.restore();
    }

    /**
     * Draw a rock prop
     */
    drawRock() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Main body (irregular shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add some texture with darker spots
        ctx.fillStyle = this.outlineColor;
        ctx.beginPath();
        ctx.arc(-halfWidth * 0.3, -halfHeight * 0.3, halfWidth * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw debris prop
     */
    drawDebris() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Main body (rectangular debris)
        ctx.fillStyle = this.color;
        ctx.fillRect(-halfWidth, -halfHeight, this.width, this.height);
        
        // Outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(-halfWidth, -halfHeight, this.width, this.height);
        
        // Add some detail lines
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.5, -halfHeight);
        ctx.lineTo(-halfWidth * 0.5, halfHeight);
        ctx.moveTo(halfWidth * 0.5, -halfHeight);
        ctx.lineTo(halfWidth * 0.5, halfHeight);
        ctx.stroke();
    }

    /**
     * Draw burnt car prop with enhanced details and smoke
     */
    drawBurntCar() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Car body (rectangular)
        ctx.fillStyle = this.color;
        ctx.fillRect(-halfWidth, -halfHeight, this.width, this.height);
        
        // Charred texture gradient overlay
        const gradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0.4)');
        gradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.2)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-halfWidth, -halfHeight, this.width, this.height);
        
        // Outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfWidth, -halfHeight, this.width, this.height);
        
        // Hood details
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.8, -halfHeight * 0.9);
        ctx.lineTo(halfWidth * 0.8, -halfHeight * 0.9);
        ctx.stroke();
        
        // Door lines (vertical)
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.3, -halfHeight * 0.5);
        ctx.lineTo(-halfWidth * 0.3, halfHeight * 0.5);
        ctx.moveTo(halfWidth * 0.3, -halfHeight * 0.5);
        ctx.lineTo(halfWidth * 0.3, halfHeight * 0.5);
        ctx.stroke();
        
        // Windows (darker rectangles with frames)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(-halfWidth * 0.6, -halfHeight * 0.3, halfWidth * 0.4, halfHeight * 0.3);
        ctx.fillRect(halfWidth * 0.2, -halfHeight * 0.3, halfWidth * 0.4, halfHeight * 0.3);
        
        // Window frames
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-halfWidth * 0.6, -halfHeight * 0.3, halfWidth * 0.4, halfHeight * 0.3);
        ctx.strokeRect(halfWidth * 0.2, -halfHeight * 0.3, halfWidth * 0.4, halfHeight * 0.3);
        
        // Wheels (circles with rims)
        ctx.fillStyle = '#0a0a0a';
        const wheelRadius = halfWidth * 0.15;
        const wheelY = halfHeight * 0.7;
        
        // Left wheel
        ctx.beginPath();
        ctx.arc(-halfWidth * 0.6, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        // Left wheel rim
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-halfWidth * 0.6, wheelY, wheelRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right wheel
        ctx.beginPath();
        ctx.arc(halfWidth * 0.6, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        // Right wheel rim
        ctx.beginPath();
        ctx.arc(halfWidth * 0.6, wheelY, wheelRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        // Burnt effect (charred edges)
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth, -halfHeight);
        ctx.lineTo(-halfWidth * 0.8, -halfHeight * 0.9);
        ctx.moveTo(halfWidth, -halfHeight);
        ctx.lineTo(halfWidth * 0.8, -halfHeight * 0.9);
        ctx.moveTo(-halfWidth, halfHeight);
        ctx.lineTo(-halfWidth * 0.9, halfHeight * 0.9);
        ctx.moveTo(halfWidth, halfHeight);
        ctx.lineTo(halfWidth * 0.9, halfHeight * 0.9);
        ctx.stroke();
        
        // Draw fire particles (before smoke for proper layering)
        if (this.fireParticles && this.fireParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; // Additive blending for fire glow
            
            for (const particle of this.fireParticles) {
                if (particle.currentOpacity <= 0) continue;
                
                const fireX = particle.x;
                const fireY = particle.y;
                
                // Fire gradient (bright center, transparent edges)
                const fireGradient = ctx.createRadialGradient(
                    fireX, fireY, 0,
                    fireX, fireY, particle.currentSize
                );
                
                // Convert hex color to rgba for gradient
                const colorMap = {
                    '#ff6600': 'rgba(255, 102, 0,',
                    '#ff8800': 'rgba(255, 136, 0,',
                    '#ffaa00': 'rgba(255, 170, 0,',
                    '#ffff00': 'rgba(255, 255, 0,',
                    '#ff4400': 'rgba(255, 68, 0,',
                    '#ff0000': 'rgba(255, 0, 0,'
                };
                const baseColor = colorMap[particle.color] || 'rgba(255, 102, 0,';
                
                fireGradient.addColorStop(0, `${baseColor}${particle.currentOpacity})`);
                fireGradient.addColorStop(0.3, `${baseColor}${particle.currentOpacity * 0.8})`);
                fireGradient.addColorStop(0.6, `${baseColor}${particle.currentOpacity * 0.4})`);
                fireGradient.addColorStop(1, `${baseColor}0)`);
                
                ctx.fillStyle = fireGradient;
                ctx.beginPath();
                ctx.arc(fireX, fireY, particle.currentSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Draw smoke particles
        if (this.smokeParticles && this.smokeParticles.length > 0) {
            for (const particle of this.smokeParticles) {
                if (particle.currentOpacity <= 0) continue;
                
                const smokeX = particle.x;
                const smokeY = particle.y;
                
                // Smoke gradient (white to gray)
                const smokeGradient = ctx.createRadialGradient(
                    smokeX, smokeY, 0,
                    smokeX, smokeY, particle.size
                );
                smokeGradient.addColorStop(0, `rgba(255, 255, 255, ${particle.currentOpacity})`);
                smokeGradient.addColorStop(0.5, `rgba(200, 200, 200, ${particle.currentOpacity * 0.7})`);
                smokeGradient.addColorStop(1, `rgba(150, 150, 150, 0)`);
                
                ctx.fillStyle = smokeGradient;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Draw a zombie skull prop with enhanced detail and glow effects
     */
    drawSkull() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Outer glow effect
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(200, 255, 150, 0.3)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Main skull shape (oval) with subtle color variation
        const boneGradient = ctx.createRadialGradient(0, -halfHeight * 0.2, 0, 0, 0, halfWidth);
        boneGradient.addColorStop(0, '#f0f0e8'); // Slightly brighter at top
        boneGradient.addColorStop(0.5, this.color); // Base bone white
        boneGradient.addColorStop(1, '#d8d8d0'); // Slightly yellow/brown tint at edges
        ctx.fillStyle = boneGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Thicker outline for more definition
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Enhanced eye sockets with depth and inner glow
        ctx.save();
        // Inner glow for eye sockets
        const eyeGlowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfWidth * 0.2);
        eyeGlowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        eyeGlowGradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.6)');
        eyeGlowGradient.addColorStop(1, 'rgba(42, 42, 42, 0.4)');
        
        // Left eye socket
        ctx.fillStyle = eyeGlowGradient;
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye socket
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye socket outlines
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Cheekbone definition
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.35, halfHeight * 0.1);
        ctx.lineTo(-halfWidth * 0.45, halfHeight * 0.25);
        ctx.moveTo(halfWidth * 0.35, halfHeight * 0.1);
        ctx.lineTo(halfWidth * 0.45, halfHeight * 0.25);
        ctx.stroke();
        
        // Enhanced nasal cavity with depth
        const nasalGradient = ctx.createRadialGradient(0, halfHeight * 0.1, 0, 0, halfHeight * 0.1, halfWidth * 0.15);
        nasalGradient.addColorStop(0, '#1a1a1a');
        nasalGradient.addColorStop(0.5, '#2a2a2a');
        nasalGradient.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = nasalGradient;
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nasal cavity outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Jaw line
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, halfHeight * 0.6, halfWidth * 0.4, 0, Math.PI);
        ctx.stroke();
        
        // Teeth along jaw line
        ctx.fillStyle = '#f5f5f0'; // Slightly whiter than bone
        const toothCount = 6;
        const jawStartAngle = 0;
        const jawEndAngle = Math.PI;
        const jawRadius = halfWidth * 0.4;
        const jawCenterY = halfHeight * 0.6;
        
        for (let i = 0; i < toothCount; i++) {
            const t = i / (toothCount - 1);
            const angle = jawStartAngle + (jawEndAngle - jawStartAngle) * t;
            const toothX = Math.cos(angle) * jawRadius;
            const toothY = jawCenterY + Math.sin(angle) * jawRadius;
            const toothWidth = halfWidth * 0.08;
            const toothHeight = halfHeight * 0.1;
            
            ctx.beginPath();
            ctx.ellipse(toothX, toothY, toothWidth * 0.5, toothHeight * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tooth outline
            ctx.strokeStyle = '#c8c8c0';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        // Enhanced cracks with varying thickness and darker fills
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Primary cracks
        ctx.moveTo(-halfWidth * 0.3, -halfHeight * 0.3);
        ctx.lineTo(-halfWidth * 0.1, halfHeight * 0.2);
        ctx.moveTo(halfWidth * 0.2, -halfHeight * 0.2);
        ctx.lineTo(halfWidth * 0.3, halfHeight * 0.3);
        ctx.stroke();
        
        // Additional cracks
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.2, -halfHeight * 0.1);
        ctx.lineTo(-halfWidth * 0.35, halfHeight * 0.15);
        ctx.moveTo(halfWidth * 0.15, -halfHeight * 0.25);
        ctx.lineTo(halfWidth * 0.25, 0);
        ctx.moveTo(0, -halfHeight * 0.35);
        ctx.lineTo(halfWidth * 0.1, -halfHeight * 0.1);
        ctx.moveTo(-halfWidth * 0.15, halfHeight * 0.25);
        ctx.lineTo(0, halfHeight * 0.4);
        ctx.stroke();
        
        // Fill cracks with darker color for depth
        ctx.fillStyle = 'rgba(42, 42, 42, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.3, -halfHeight * 0.3);
        ctx.lineTo(-halfWidth * 0.1, halfHeight * 0.2);
        ctx.lineTo(-halfWidth * 0.15, halfHeight * 0.25);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(halfWidth * 0.2, -halfHeight * 0.2);
        ctx.lineTo(halfWidth * 0.3, halfHeight * 0.3);
        ctx.lineTo(halfWidth * 0.25, 0);
        ctx.closePath();
        ctx.fill();
        
        // Bone texture - subtle detail marks (using stored positions)
        ctx.fillStyle = 'rgba(200, 200, 180, 0.3)';
        if (this.textureMarks) {
            for (const mark of this.textureMarks) {
                const texX = mark.x * halfWidth;
                const texY = mark.y * halfHeight;
                ctx.beginPath();
                ctx.arc(texX, texY, mark.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Subtle shadow beneath skull for depth
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = halfHeight * 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.7, halfWidth * 0.6, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw zombie arms prop
     */
    drawZombieArms() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Draw 2-3 arms
        for (let i = 0; i < this.armCount; i++) {
            const armX = -halfWidth * 0.5 + (i * (this.width / (this.armCount + 1)));
            const armWidth = this.width * 0.25;
            const armHeight = this.height * 0.8;
            const armRotation = this.armRotations ? this.armRotations[i] : 0;
            
            ctx.save();
            ctx.translate(armX, 0);
            ctx.rotate(armRotation);
            
            // Arm shape (elongated oval)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, armWidth / 2, armHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Outline
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Bone end (visible at top)
            ctx.fillStyle = this.outlineColor;
            ctx.beginPath();
            ctx.ellipse(0, -armHeight * 0.3, armWidth * 0.3, armWidth * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Decay marks (use stored positions)
            ctx.fillStyle = '#5a4a3a';
            const decayMarks = this.armDecayMarks ? this.armDecayMarks[i] : [];
            for (const mark of decayMarks) {
                ctx.beginPath();
                ctx.arc(mark.x * armWidth, mark.y * armHeight, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    /**
     * Draw zombie legs prop
     */
    drawZombieLegs() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Draw 2 legs
        for (let i = 0; i < 2; i++) {
            const legX = -halfWidth * 0.3 + (i * (this.width * 0.6));
            const legWidth = this.width * 0.3;
            const legHeight = this.height * 0.9;
            const legRotation = this.legRotations ? this.legRotations[i] : 0;
            
            ctx.save();
            ctx.translate(legX, 0);
            ctx.rotate(legRotation);
            
            // Leg shape (elongated oval)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, legWidth / 2, legHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Outline
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Bone end (visible at top)
            ctx.fillStyle = this.outlineColor;
            ctx.beginPath();
            ctx.ellipse(0, -legHeight * 0.35, legWidth * 0.35, legWidth * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Decay marks (use stored positions)
            ctx.fillStyle = '#5a4a3a';
            const decayMarks = this.legDecayMarks ? this.legDecayMarks[i] : [];
            for (const mark of decayMarks) {
                ctx.beginPath();
                ctx.arc(mark.x * legWidth, mark.y * legHeight, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
}

