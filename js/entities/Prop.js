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
                this.color = '#5a5a5a'; // Slightly lighter gray base
                this.outlineColor = '#2a2a2a';
                
                // Generate jagged vertices for irregular rock shape
                this.vertices = [];
                const numPoints = 7 + Math.floor(Math.random() * 5); // 7-11 points
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    // Vary radius significantly for jagged look (0.6 to 1.0)
                    const r = 0.6 + Math.random() * 0.4;
                    this.vertices.push({
                        x: Math.cos(angle) * (this.width/2) * r,
                        y: Math.sin(angle) * (this.height/2) * r
                    });
                }
                
                // Generate cracks/texture details
                this.cracks = [];
                const numCracks = 2 + Math.floor(Math.random() * 3);
                for(let i=0; i<numCracks; i++) {
                     this.cracks.push({
                         x: (Math.random() - 0.5) * this.width * 0.5,
                         y: (Math.random() - 0.5) * this.height * 0.5,
                         length: 4 + Math.random() * 8,
                         angle: Math.random() * Math.PI * 2,
                         width: 0.5 + Math.random() * 1
                     });
                }
                break;
            case 'debris':
                this.width = 25 + Math.random() * 20; // Increased size slightly
                this.height = 25 + Math.random() * 20;
                this.color = '#3a3a3a';
                this.outlineColor = '#1a1a1a';
                
                // Generate scattered debris pieces instead of one block
                this.debrisPieces = [];
                const numPieces = 4 + Math.floor(Math.random() * 4); // 4-7 pieces
                for(let i=0; i<numPieces; i++) {
                    const size = 6 + Math.random() * 10;
                    this.debrisPieces.push({
                        x: (Math.random() - 0.5) * this.width * 0.8,
                        y: (Math.random() - 0.5) * this.height * 0.8,
                        w: size,
                        h: size * (0.5 + Math.random() * 1), // Irregular aspect ratio
                        rot: Math.random() * Math.PI * 2,
                        color: Math.random() > 0.5 ? '#4a4a4a' : '#2a2a2a' // Varied gray
                    });
                }
                break;
            case 'burntCar':
                this.width = 60 + Math.random() * 30; // 60-90px (increased from 40-60px)
                this.height = 80 + Math.random() * 40; // 80-120px (increased from 60-80px)
                this.color = '#1a1a1a';
                this.outlineColor = '#0a0a0a';
                
                // Initialize static visual details (rust, cracks) so they don't jitter
                this.initBurntCarDetails();
                
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
                this.width = 25 + Math.random() * 10; // 25-35px width (shoulder to hand width area)
                this.height = 45 + Math.random() * 15; // 45-60px total length roughly
                this.color = '#7a8a65'; // Greenish decayed flesh (more zombie-like than brown)
                this.outlineColor = '#3a4a25'; // Darker green/black outline
                this.armCount = 2 + Math.floor(Math.random() * 2); // 2-3 arms
                // Store random properties for each arm
                this.armProps = [];
                for (let i = 0; i < this.armCount; i++) {
                    this.armProps.push({
                        rotation: (Math.random() - 0.5) * 1.5, // More random rotation variation
                        elbowAngle: 0.2 + Math.random() * 0.8, // Slight bend to 90 degree bend
                        scale: 0.8 + Math.random() * 0.4,
                        flip: Math.random() > 0.5 ? 1 : -1 // Left or right bending
                    });
                }
                break;
            case 'zombieLegs':
                this.width = 30 + Math.random() * 10; // 30-40px width (hip width area)
                this.height = 60 + Math.random() * 20; // 60-80px total length
                this.color = '#7a8a65'; // Greenish decayed flesh
                this.outlineColor = '#3a4a25';
                // Store random properties for each leg
                this.legProps = [];
                for (let i = 0; i < 2; i++) {
                    this.legProps.push({
                        rotation: (Math.random() - 0.5) * 0.5,
                        kneeAngle: 0.1 + Math.random() * 0.4, // Less bend than elbow typically for lying legs
                        scale: 0.9 + Math.random() * 0.3,
                        flip: Math.random() > 0.5 ? 1 : -1
                    });
                }
                break;
            case 'trashCan':
                this.width = 30 + Math.random() * 10; // 30-40px
                this.height = 35 + Math.random() * 10; // 35-45px (slightly taller for cylindrical look)
                this.color = '#2d5016'; // Dark green metal base
                this.outlineColor = '#1a300a'; // Darker green outline
                
                // Initialize static visual details (lid position, dents) to prevent jittering
                this.initTrashCanDetails();
                
                // Initialize fire particles for trash can
                this.fireParticles = [];
                this.initTrashCanFireParticles();
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
     * Initialize static details for burnt car to prevent jittering
     */
    initBurntCarDetails() {
        // Rust patches
        this.rustPatches = [];
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        for(let i=0; i<3; i++) {
            this.rustPatches.push({
                x: (Math.random() - 0.5) * halfWidth * 1.5,
                y: (Math.random() - 0.5) * halfHeight * 1.5,
                radius: Math.random() * 10 + 5
            });
        }

        // Window crack details
        this.frontWindowCracks = this.generateCrackData(this.width * 0.9 * 0.85, this.height * 0.6 * 0.25); // Approximate dims
        this.rearWindowCracks = this.generateCrackData(this.width * 0.9 * 0.85, this.height * 0.6 * 0.2);
    }

    /**
     * Helper to generate random crack data for windows
     */
    generateCrackData(w, h) {
        const centerX = (Math.random() - 0.5) * w * 0.5;
        const centerY = (Math.random() - 0.5) * h * 0.5;
        const lines = [];
        for(let i=0; i<5; i++) {
            lines.push((i/5) * Math.PI * 2 + Math.random());
        }
        return { centerX, centerY, lines };
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
     * Initialize static details for trash can to prevent jittering
     */
    initTrashCanDetails() {
        // Dents/scratches
        this.dents = [];
        const numDents = 2 + Math.floor(Math.random() * 2); // 2-3 dents
        for (let i = 0; i < numDents; i++) {
            this.dents.push({
                x: (Math.random() - 0.5) * this.width * 0.6,
                y: (Math.random() - 0.5) * this.height * 0.6,
                radius: 2 + Math.random() * 3
            });
        }
        
        // Lid opening angle (slightly open for fire)
        this.lidOpenAngle = 0.3 + Math.random() * 0.2; // 0.3-0.5 radians
    }

    /**
     * Initialize fire particles for trash can
     * Fire particles spawn from top center of trash can
     */
    initTrashCanFireParticles() {
        const fireColors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const particleCount = 3 + Math.floor(Math.random() * 3); // 3-5 particles
        
        for (let i = 0; i < particleCount; i++) {
            // Spawn from top center of trash can
            const spawnX = (Math.random() - 0.5) * this.width * 0.3; // Small spread around center
            const spawnY = -this.height * 0.4; // Top of trash can
            
            this.fireParticles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 0.4, // Horizontal drift
                vy: -0.8 - Math.random() * 0.4, // Rise speed (-0.8 to -1.2)
                color: fireColors[Math.floor(Math.random() * fireColors.length)],
                baseOpacity: 0.7 + Math.random() * 0.3, // 0.7-1.0
                size: 4 + Math.random() * 4, // 4-8px
                baseSize: 4 + Math.random() * 4, // Store base size for flickering
                lifetime: 1000 + Math.random() * 1000, // 1-2 seconds
                age: Math.random() * 500, // Random starting age
                flickerPhase: Math.random() * Math.PI * 2, // Random phase for flickering
                currentOpacity: 0.7 + Math.random() * 0.3,
                currentSize: 4 + Math.random() * 4
            });
        }
    }

    /**
     * Update smoke and fire particles (for burntCar and trashCan)
     */
    update() {
        if (this.type === 'burntCar' && this.smokeParticles) {
            this.updateBurntCarParticles();
        } else if (this.type === 'trashCan' && this.fireParticles) {
            this.updateTrashCanFireParticles();
        } else {
            return;
        }
    }

    /**
     * Update burnt car smoke and fire particles
     */
    updateBurntCarParticles() {
        
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
     * Update trash can fire particles
     */
    updateTrashCanFireParticles() {
        const now = Date.now();
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = now;
            return;
        }
        
        const deltaTime = Math.min(now - this.lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
        this.lastUpdateTime = now;
        
        // Update fire particles
        if (this.fireParticles && this.fireParticles.length > 0) {
            for (let i = 0; i < this.fireParticles.length; i++) {
                const particle = this.fireParticles[i];
                
                // Update age
                particle.age += deltaTime;
                
                // Respawn if expired (at top center of trash can)
                if (particle.age >= particle.lifetime) {
                    particle.x = (Math.random() - 0.5) * this.width * 0.3;
                    particle.y = -this.height * 0.4;
                    particle.age = 0;
                    particle.baseOpacity = 0.7 + Math.random() * 0.3;
                    particle.flickerPhase = Math.random() * Math.PI * 2;
                } else {
                    // Update position (relative to trash can)
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
            case 'trashCan':
                this.drawTrashCan();
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
        
        // 1. Main body (Jagged Polygon)
        if (this.vertices && this.vertices.length > 0) {
            // Gradient for 3D volume effect
            const rockGradient = ctx.createRadialGradient(-halfWidth*0.3, -halfHeight*0.3, 0, 0, 0, Math.max(halfWidth, halfHeight));
            rockGradient.addColorStop(0, '#7a7a7a'); // Highlight
            rockGradient.addColorStop(1, '#3a3a3a'); // Shadow
            
            ctx.fillStyle = rockGradient;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Outline
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // 2. Texture/Cracks
            if (this.cracks) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                for(const crack of this.cracks) {
                    ctx.lineWidth = crack.width;
                    ctx.beginPath();
                    // Draw a jagged line for the crack
                    const startX = crack.x - Math.cos(crack.angle) * crack.length/2;
                    const startY = crack.y - Math.sin(crack.angle) * crack.length/2;
                    const endX = crack.x + Math.cos(crack.angle) * crack.length/2;
                    const endY = crack.y + Math.sin(crack.angle) * crack.length/2;
                    
                    // Add a mid-point deviation
                    const midX = (startX + endX)/2 + (Math.random()-0.5)*2;
                    const midY = (startY + endY)/2 + (Math.random()-0.5)*2;
                    
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            // 3. Highlight edge (pseudo-rim lighting)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Draw highlight on top-left vertices
            const limit = Math.floor(this.vertices.length / 2);
            // Find top-left-most vertex to start (roughly) - actually just drawing first half usually covers top-left due to generation order? 
            // Vertices generated by angle 0 to 2PI. 0 is Right, PI/2 is Down. 
            // So we want roughly PI to 3PI/2 (Left to Top). That's indices around length/2 to 3*length/4.
            // Let's just draw a simple arc highlight for consistency
            ctx.beginPath();
            ctx.arc(-halfWidth*0.1, -halfHeight*0.1, halfWidth*0.7, Math.PI, Math.PI*1.5);
            ctx.stroke();
            
        } else {
            // Fallback to old circle method if vertices missing
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Draw debris prop
     */
    drawDebris() {
        // Draw scattered pieces
        if (this.debrisPieces && this.debrisPieces.length > 0) {
            for(const piece of this.debrisPieces) {
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rot);
                
                ctx.fillStyle = piece.color || this.color;
                ctx.fillRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
                
                ctx.strokeStyle = this.outlineColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
                
                ctx.restore();
            }
        } else {
            // Fallback
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            ctx.fillStyle = this.color;
            ctx.fillRect(-halfWidth, -halfHeight, this.width, this.height);
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(-halfWidth, -halfHeight, this.width, this.height);
        }
    }

    /**
     * Draw burnt car prop with enhanced details and smoke
     */
    drawBurntCar() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Shadow underneath
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth * 1.1, halfHeight * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car body (slightly irregular rectangular shape for damage)
        // We'll use a path instead of rect to allow for dents
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Front (Top in this orientation usually, but let's assume standard)
        // Top-left
        ctx.moveTo(-halfWidth, -halfHeight * 0.8); 
        // Hood curve
        ctx.quadraticCurveTo(0, -halfHeight * 1.05, halfWidth, -halfHeight * 0.8);
        // Right side (with dents)
        ctx.lineTo(halfWidth, -halfHeight * 0.4);
        ctx.lineTo(halfWidth * 0.95, 0); // Dent
        ctx.lineTo(halfWidth, halfHeight * 0.4);
        // Trunk/Rear
        ctx.lineTo(halfWidth * 0.9, halfHeight);
        ctx.lineTo(-halfWidth * 0.9, halfHeight);
        // Left side
        ctx.lineTo(-halfWidth, halfHeight * 0.4);
        ctx.lineTo(-halfWidth * 0.95, 0); // Dent
        ctx.lineTo(-halfWidth, -halfHeight * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Charred texture gradient overlay
        const gradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0.6)');
        gradient.addColorStop(0.5, 'rgba(40, 40, 40, 0.3)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill(); // Fill the same path again
        
        // Outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hood details (damaged)
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.7, -halfHeight * 0.8);
        ctx.lineTo(-halfWidth * 0.6, -halfHeight * 0.5); // Bent hood line
        ctx.lineTo(halfWidth * 0.6, -halfHeight * 0.5);
        ctx.lineTo(halfWidth * 0.7, -halfHeight * 0.8);
        ctx.stroke();
        
        // Roof / Cabin area
        const roofWidth = halfWidth * 0.85;
        const roofHeight = halfHeight * 0.6;
        const roofY = 0;
        
        ctx.fillStyle = '#151515';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-roofWidth/2, roofY - roofHeight/2, roofWidth, roofHeight, 5);
        } else {
            ctx.rect(-roofWidth/2, roofY - roofHeight/2, roofWidth, roofHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Shattered Windows
        ctx.fillStyle = '#050505'; // Dark interior
        
        // Front Windshield
        this.drawShatteredWindow(0, -roofHeight/2, roofWidth * 0.9, roofHeight * 0.25, true, this.frontWindowCracks);
        
        // Rear Window
        this.drawShatteredWindow(0, roofHeight/2, roofWidth * 0.9, roofHeight * 0.2, false, this.rearWindowCracks);
        
        // Wheels (circles with rims) - slightly askew
        ctx.fillStyle = '#0a0a0a';
        const wheelWidth = halfWidth * 0.25; // Wider tires
        const wheelLength = halfHeight * 0.35; // Longer tires
        const wheelY = halfHeight * 0.6;
        const wheelYFront = -halfHeight * 0.6;
        
        // Helper for wheel
        const drawWheel = (x, y, angleOffset) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleOffset); // Damaged suspension
            
            // Tire rubber (dark grey with gradient)
            const tireGradient = ctx.createLinearGradient(-wheelWidth/2, 0, wheelWidth/2, 0);
            tireGradient.addColorStop(0, '#050505');
            tireGradient.addColorStop(0.2, '#2a2a2a'); // Highlight
            tireGradient.addColorStop(0.5, '#1a1a1a');
            tireGradient.addColorStop(0.8, '#2a2a2a'); // Highlight
            tireGradient.addColorStop(1, '#050505');
            ctx.fillStyle = tireGradient;
            
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-wheelWidth/2, -wheelLength/2, wheelWidth, wheelLength, 4);
            else ctx.rect(-wheelWidth/2, -wheelLength/2, wheelWidth, wheelLength);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Tire Treads
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i = -wheelLength/2 + 4; i < wheelLength/2; i+=6) {
                ctx.moveTo(-wheelWidth/2 + 2, i);
                ctx.lineTo(wheelWidth/2 - 2, i);
            }
            ctx.stroke();
            
            ctx.restore();
        };

        // Move wheels further out to "pop out"
        const wheelOffsetX = halfWidth * 1.05; 
        
        drawWheel(-wheelOffsetX, wheelY, 0.1); // Rear Left
        drawWheel(wheelOffsetX, wheelY, -0.1); // Rear Right
        drawWheel(-wheelOffsetX, wheelYFront, -0.05); // Front Left
        drawWheel(wheelOffsetX, wheelYFront, 0.05); // Front Right
        
        // Burnt/Rust patches
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Rust
        if (this.rustPatches) {
            for(const patch of this.rustPatches) {
                ctx.beginPath();
                ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        // Draw fire particles (before smoke for proper layering)
        if (this.fireParticles && this.fireParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; // Additive blending for fire glow
            
            for (const particle of this.fireParticles) {
                // Ensure particle has valid properties before rendering
                if (!particle || particle.currentOpacity <= 0 || !particle.currentSize) continue;
                
                // Use relative coordinates if available (x,y are relative to car center in constructor/update)
                // The drawBurntCar function is already inside a context translated to this.x, this.y
                // But particle positions are stored relative to the car center (0,0)
                
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
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.8));
                const alpha3 = Math.max(0, Math.min(1, particle.currentOpacity * 0.4));
                
                fireGradient.addColorStop(0, `${baseColor}${alpha1})`);
                fireGradient.addColorStop(0.3, `${baseColor}${alpha2})`);
                fireGradient.addColorStop(0.6, `${baseColor}${alpha3})`);
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
                // Ensure particle has valid properties
                if (!particle || particle.currentOpacity <= 0 || !particle.size) continue;
                
                const smokeX = particle.x;
                const smokeY = particle.y;
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.7));
                
                // Smoke gradient (white to gray)
                const smokeGradient = ctx.createRadialGradient(
                    smokeX, smokeY, 0,
                    smokeX, smokeY, particle.size
                );
                smokeGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha1})`);
                smokeGradient.addColorStop(0.5, `rgba(200, 200, 200, ${alpha2})`);
                smokeGradient.addColorStop(1, `rgba(150, 150, 150, 0)`);
                
                ctx.fillStyle = smokeGradient;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Helper to draw a shattered window
     */
    drawShatteredWindow(x, y, width, height, isFront, crackData) {
        ctx.save();
        ctx.translate(x, y);
        
        // Window base
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        if (isFront) {
            // Trapezoid shape for windshield
            ctx.moveTo(-width/2, -height/2); // Top-left (wider)
            ctx.lineTo(width/2, -height/2);  // Top-right
            ctx.lineTo(width/2 * 0.8, height/2);   // Bottom-right (narrower)
            ctx.lineTo(-width/2 * 0.8, height/2);  // Bottom-left
        } else {
            // Rear window
            ctx.moveTo(-width/2 * 0.8, -height/2);
            ctx.lineTo(width/2 * 0.8, -height/2);
            ctx.lineTo(width/2, height/2);
            ctx.lineTo(-width/2, height/2);
        }
        ctx.closePath();
        ctx.fill();
        
        // Crack lines
        if (crackData) {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const { centerX, centerY, lines } = crackData;
            
            // Radial lines
            for(const angle of lines) {
                const len = Math.min(width, height) * 0.4;
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + Math.cos(angle) * len, centerY + Math.sin(angle) * len);
            }
            // Concentric lines (rough)
            ctx.moveTo(centerX + 5, centerY);
            ctx.arc(centerX, centerY, 5, 0, Math.PI*2);
            ctx.moveTo(centerX + 10, centerY);
            ctx.arc(centerX, centerY, 10, 0, Math.PI*2);
            
            ctx.stroke();
        }
        ctx.restore();
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
     * Draw zombie arms prop with anatomical details
     */
    drawZombieArms() {
        // Draw arms
        for (let i = 0; i < this.armCount; i++) {
            // Position arms relative to prop center
            // Spread them out slightly so they aren't perfectly stacked
            const offsetX = (i - (this.armCount-1)/2) * 15; 
            const offsetY = (i % 2 === 0 ? -1 : 1) * 5;
            
            const props = this.armProps[i];
            const armScale = props.scale;
            const upperArmLen = 18 * armScale;
            const lowerArmLen = 16 * armScale;
            const armThickness = 8 * armScale;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.rotate(props.rotation);
            ctx.scale(props.flip, 1); // Flip for left/right variation
            
            // --- UPPER ARM ---
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            
            // Draw Upper Arm Segment
            ctx.beginPath();
            // Shoulder end (rounded)
            ctx.arc(0, 0, armThickness/2, Math.PI, 0);
            // Down to elbow
            ctx.lineTo(armThickness/2 - 1, upperArmLen);
            ctx.lineTo(-armThickness/2 + 1, upperArmLen);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // --- ELBOW & LOWER ARM ---
            ctx.save();
            ctx.translate(0, upperArmLen - 2); // Pivot at elbow
            ctx.rotate(props.elbowAngle); // Bend
            
            // Draw Lower Arm Segment
            ctx.beginPath();
            ctx.moveTo(-armThickness/2 + 1, 0);
            ctx.lineTo(armThickness/2 - 1, 0);
            // Taper towards wrist
            ctx.lineTo(armThickness/2 - 2, lowerArmLen);
            ctx.lineTo(-armThickness/2 + 2, lowerArmLen);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.stroke();
            
            // --- HAND ---
            ctx.translate(0, lowerArmLen);
            
            // Palm
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 3, armThickness/2, Math.PI, 0); // Palm heel
            ctx.lineTo(armThickness/2, 8);
            ctx.lineTo(-armThickness/2, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Fingers
            ctx.fillStyle = this.color;
            const fingerLen = 6 * armScale;
            const fingerWidth = 1.5 * armScale;
            
            // Thumb (angled out)
            ctx.save();
            ctx.translate(-armThickness/2 + 1, 2);
            ctx.rotate(-0.5);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, fingerWidth, fingerLen * 0.8, 1);
            else ctx.rect(0, 0, fingerWidth, fingerLen * 0.8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            // 3 Main Fingers
            for(let f=0; f<3; f++) {
                ctx.save();
                // Spread fingers slightly
                const fX = -armThickness/3 + (f * armThickness/3);
                const fAngle = (f-1) * 0.1;
                ctx.translate(fX, 8);
                ctx.rotate(fAngle);
                
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-fingerWidth/2, 0, fingerWidth, fingerLen + (f===1?2:0), 1);
                else ctx.rect(-fingerWidth/2, 0, fingerWidth, fingerLen + (f===1?2:0));
                
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.restore(); // End Lower Arm
            
            // --- SEVERED END DETAILS (Shoulder) ---
            // Draw bone sticking out
            ctx.fillStyle = '#e8e8e8'; // Bone white
            ctx.beginPath();
            ctx.arc(0, 0, armThickness/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Gore/Blood
            ctx.fillStyle = '#8a0303'; // Dark red blood
            ctx.beginPath();
            // Jagged flesh shape
            for(let k=0; k<5; k++) {
                const angle = (k/5) * Math.PI * 2;
                const r = armThickness/2 + (Math.random() * 2);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (k===0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Some random decay spots on the arm
            ctx.fillStyle = '#4a5a3a'; // Darker decay spot
            ctx.beginPath();
            ctx.arc(0, upperArmLen * 0.4, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore(); // End Whole Arm
        }
    }

    /**
     * Draw zombie legs prop with anatomical details
     */
    drawZombieLegs() {
        // Draw 2 legs
        for (let i = 0; i < 2; i++) {
            // Position legs relative to prop center
            const offsetX = (i === 0 ? -1 : 1) * 12;
            const offsetY = (i % 2 === 0 ? 1 : -1) * 3;
            
            const props = this.legProps[i];
            const legScale = props.scale;
            const thighLen = 22 * legScale;
            const calfLen = 20 * legScale;
            const legThickness = 10 * legScale;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.rotate(props.rotation);
            ctx.scale(props.flip, 1);
            
            // --- THIGH ---
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            // Hip end (rounded)
            ctx.arc(0, 0, legThickness/2, Math.PI, 0);
            // Down to knee
            ctx.lineTo(legThickness/2 - 1, thighLen);
            ctx.lineTo(-legThickness/2 + 1, thighLen);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // --- KNEE & CALF ---
            ctx.save();
            ctx.translate(0, thighLen - 2); // Pivot at knee
            ctx.rotate(props.kneeAngle); // Bend
            
            // Draw Calf
            ctx.beginPath();
            ctx.moveTo(-legThickness/2 + 1, 0);
            ctx.lineTo(legThickness/2 - 1, 0);
            // Taper towards ankle
            ctx.lineTo(legThickness/2 - 3, calfLen);
            ctx.lineTo(-legThickness/2 + 3, calfLen);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.stroke();
            
            // --- FOOT ---
            ctx.translate(0, calfLen);
            ctx.rotate(Math.PI/2); // Feet point out usually
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Heel
            ctx.arc(0, 0, legThickness/2.5, Math.PI/2, -Math.PI/2);
            // Foot length
            ctx.lineTo(12 * legScale, -legThickness/3);
            ctx.lineTo(12 * legScale, legThickness/3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Toes (simple block or small bumps)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(12 * legScale, -legThickness/3, 3 * legScale, legThickness * 0.7, 1);
            else ctx.rect(12 * legScale, -legThickness/3, 3 * legScale, legThickness * 0.7);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore(); // End Calf
            
            // --- SEVERED END DETAILS (Hip) ---
            // Bone
            ctx.fillStyle = '#e8e8e8'; // Bone white
            ctx.beginPath();
            ctx.arc(0, 0, legThickness/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Gore
            ctx.fillStyle = '#8a0303'; // Dark red blood
            ctx.beginPath();
            for(let k=0; k<6; k++) {
                const angle = (k/6) * Math.PI * 2;
                const r = legThickness/2 + (Math.random() * 2.5);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (k===0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Tattered pants fragment (optional detail)
            ctx.fillStyle = '#3a4a5a'; // Dark blue jeans color
            ctx.beginPath();
            ctx.moveTo(-legThickness/2 - 1, 5);
            ctx.lineTo(legThickness/2 + 1, 5);
            ctx.lineTo(legThickness/2 + 2, 12); // Tattered edge
            ctx.lineTo(0, 10);
            ctx.lineTo(-legThickness/2 - 2, 13);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore(); // End Whole Leg
        }
    }

    /**
     * Draw trash can prop with fire effect (2.5D/3D perspective)
     */
    drawTrashCan() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const radius = (halfWidth + halfHeight) / 2;
        
        // 3D Perspective: Top ellipse (wider than tall) and bottom ellipse (narrower)
        // Top of cylinder (closer to viewer)
        const topRadiusX = radius;
        const topRadiusY = radius * 0.6; // Flattened ellipse for perspective
        const topY = -radius * 0.7; // Position further above center (lengthened)
        
        // Bottom of cylinder (further from viewer)
        const bottomRadiusX = radius * 0.85; // Slightly smaller (perspective)
        const bottomRadiusY = radius * 0.5; // More flattened
        const bottomY = radius * 1.0; // Position further below center (lengthened)
        
        // Shadow underneath (elliptical for 3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, bottomY + radius * 0.2, bottomRadiusX * 1.1, bottomRadiusY * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw fire particles BEFORE lid (so fire appears through gap)
        if (this.fireParticles && this.fireParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; // Additive blending for fire glow
            
            for (const particle of this.fireParticles) {
                // Ensure particle has valid properties before rendering
                if (!particle || particle.currentOpacity <= 0 || !particle.currentSize) continue;
                
                // Adjust fire position for 3D perspective (fire comes from top opening)
                const fireX = particle.x;
                const fireY = topY + particle.y; // Position relative to top of cylinder
                
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
                    '#ffaa00': 'rgba(255, 170, 0,',
                    '#ffff00': 'rgba(255, 255, 0,',
                    '#ff4400': 'rgba(255, 68, 0,',
                    '#ff0000': 'rgba(255, 0, 0,'
                };
                const baseColor = colorMap[particle.color] || 'rgba(255, 102, 0,';
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.8));
                const alpha3 = Math.max(0, Math.min(1, particle.currentOpacity * 0.4));
                
                fireGradient.addColorStop(0, `${baseColor}${alpha1})`);
                fireGradient.addColorStop(0.3, `${baseColor}${alpha2})`);
                fireGradient.addColorStop(0.6, `${baseColor}${alpha3})`);
                fireGradient.addColorStop(1, `${baseColor}0)`);
                
                ctx.fillStyle = fireGradient;
                ctx.beginPath();
                ctx.arc(fireX, fireY, particle.currentSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        // CYLINDRICAL BODY - 3D Perspective Drawing
        
        // Draw side walls of cylinder (connecting top and bottom ellipses)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Left curve (from top left to bottom left)
        ctx.moveTo(-topRadiusX * 0.9, topY);
        ctx.lineTo(-bottomRadiusX * 0.9, bottomY);
        // Bottom curve
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, Math.PI, 0, true);
        // Right curve (from bottom right to top right)
        ctx.lineTo(topRadiusX * 0.9, topY);
        // Top curve
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI, true);
        ctx.closePath();
        ctx.fill();
        
        // Side wall shading (darker on right, lighter on left)
        const sideGradient = ctx.createLinearGradient(
            -topRadiusX, 0,
            topRadiusX, 0
        );
        sideGradient.addColorStop(0, 'rgba(74, 106, 47, 0.3)'); // Left highlight
        sideGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); // Center transparent
        sideGradient.addColorStop(1, 'rgba(26, 48, 10, 0.6)'); // Right shadow
        
        ctx.fillStyle = sideGradient;
        ctx.fill(); // Fill the same path with gradient overlay
        
        // Top ellipse (top of cylinder - visible opening)
        const topGradient = ctx.createRadialGradient(
            -topRadiusX * 0.3, topY - topRadiusY * 0.3, 0,
            0, topY, topRadiusX
        );
        topGradient.addColorStop(0, '#4a6a2f'); // Highlight
        topGradient.addColorStop(0.5, this.color); // Base
        topGradient.addColorStop(1, '#1a300a'); // Shadow
        
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top rim (thick edge)
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.95, topRadiusY * 0.95, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Top rim inner edge
        ctx.strokeStyle = '#1a300a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.88, topRadiusY * 0.88, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bottom ellipse (base of cylinder) - only draw visible front portion
        ctx.fillStyle = '#1a300a';
        ctx.beginPath();
        // Draw only the front half (visible from this angle) - from left to right
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.lineTo(0, bottomY + bottomRadiusY * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Bottom rim - draw as wrapping around from behind (left) to front (right)
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw rim starting from behind-left, curving around the bottom front
        // Start from behind (left side at ~210 degrees), curve to front (right side at ~330 degrees)
        ctx.ellipse(0, bottomY, bottomRadiusX * 0.95, bottomRadiusY * 0.95, 0, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        
        // Bottom rim inner edge (visible portion only - same arc)
        ctx.strokeStyle = '#1a300a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, bottomY, bottomRadiusX * 0.88, bottomRadiusY * 0.88, 0, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        
        // Horizontal metal bands (elliptical rings with perspective)
        ctx.strokeStyle = '#3a5a1f';
        ctx.lineWidth = 1.5;
        // Top band (near top)
        const band1Y = topY + (bottomY - topY) * 0.3;
        const band1RX = topRadiusX * 0.9 - (topRadiusX - bottomRadiusX) * 0.3;
        const band1RY = topRadiusY * 0.9 - (topRadiusY - bottomRadiusY) * 0.3;
        ctx.beginPath();
        ctx.ellipse(0, band1Y, band1RX, band1RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Middle band
        const band2Y = topY + (bottomY - topY) * 0.5;
        const band2RX = topRadiusX * 0.92 - (topRadiusX - bottomRadiusX) * 0.5;
        const band2RY = topRadiusY * 0.92 - (topRadiusY - bottomRadiusY) * 0.5;
        ctx.beginPath();
        ctx.ellipse(0, band2Y, band2RX, band2RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Bottom band (near bottom)
        const band3Y = topY + (bottomY - topY) * 0.7;
        const band3RX = topRadiusX * 0.9 - (topRadiusX - bottomRadiusX) * 0.7;
        const band3RY = topRadiusY * 0.9 - (topRadiusY - bottomRadiusY) * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, band3Y, band3RX, band3RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Vertical highlight line (left side - brightest)
        ctx.strokeStyle = 'rgba(74, 106, 47, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-topRadiusX * 0.85, topY);
        ctx.lineTo(-bottomRadiusX * 0.85, bottomY);
        ctx.stroke();
        
        // Vertical shadow line (right side - darkest)
        ctx.strokeStyle = 'rgba(26, 48, 10, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topRadiusX * 0.85, topY);
        ctx.lineTo(bottomRadiusX * 0.85, bottomY);
        ctx.stroke();
        
        // Outline (top and bottom ellipses)
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Bottom outline - only visible front portion
        ctx.beginPath();
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
        
        // Lid (slightly open arc at top - 3D perspective)
        ctx.fillStyle = '#1a300a';
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 1.5;
        
        // Lid body (arc shape with perspective)
        ctx.beginPath();
        const lidStartAngle = Math.PI - this.lidOpenAngle;
        const lidEndAngle = Math.PI + this.lidOpenAngle;
        ctx.ellipse(0, topY, topRadiusX * 0.9, topRadiusY * 0.9, 0, lidStartAngle, lidEndAngle);
        ctx.lineTo(0, topY - topRadiusY * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Lid handle/rim detail
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.9, topRadiusY * 0.9, 0, lidStartAngle, lidEndAngle);
        ctx.stroke();
        
        // Lid highlight (left side of lid)
        ctx.strokeStyle = 'rgba(74, 106, 47, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-topRadiusX * 0.7, topY);
        ctx.lineTo(-topRadiusX * 0.5, topY - topRadiusY * 0.1);
        ctx.stroke();
        
        // Dents/scratches
        if (this.dents) {
            ctx.fillStyle = 'rgba(26, 48, 10, 0.6)';
            for (const dent of this.dents) {
                ctx.beginPath();
                ctx.arc(dent.x, dent.y, dent.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

