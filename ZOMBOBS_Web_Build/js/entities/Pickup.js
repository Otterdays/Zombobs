import { ctx } from '../core/canvas.js';

// Simple health pickup (healing orb with cross icon)
export class HealthPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 10;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'health';
    }

    draw() {
        const t = Date.now() / 500 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.15;
        // Enhanced pulse for better visibility (V0.7.1)
        const enhancedPulse = 0.75 + Math.sin(t) * 0.2;

        // Outer glow - Enhanced visibility (V0.7.1)
        const glowRadius = this.radius * 2.4 * enhancedPulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 80, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#ff8a80');
        coreGradient.addColorStop(1, '#d50000');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // White cross icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius / 2, this.y);
        ctx.lineTo(this.x + this.radius / 2, this.y);
        ctx.moveTo(this.x, this.y - this.radius / 2);
        ctx.lineTo(this.x, this.y + this.radius / 2);
        ctx.stroke();
    }
}

// Ammo pickup (ammo box with bullet icon)
export class AmmoPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 10;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'ammo';
    }

    draw() {
        const t = Date.now() / 500 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.15;
        // Enhanced pulse for better visibility (V0.7.1)
        const enhancedPulse = 0.75 + Math.sin(t) * 0.2;

        // Outer glow (yellow/orange) - Enhanced visibility (V0.7.1)
        const glowRadius = this.radius * 2.4 * enhancedPulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc (yellow/orange)
        const coreGradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#ffd54f');
        coreGradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bullet icon (simple rectangle with point)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - this.radius * 0.4, this.y - this.radius * 0.3, this.radius * 0.8, this.radius * 0.6);
        // Bullet tip
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.4, this.y - this.radius * 0.3);
        ctx.lineTo(this.x + this.radius * 0.6, this.y);
        ctx.lineTo(this.x + this.radius * 0.4, this.y + this.radius * 0.3);
        ctx.fill();
    }
}

// Double Damage Pickup (Purple)
export class DamagePickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 12;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'damage';
    }

    draw() {
        const t = Date.now() / 300 + this.pulseOffset; // Fast pulse
        const pulse = 0.8 + Math.sin(t) * 0.2;
        // Enhanced pulse for rare pickup (V0.7.1)
        const enhancedPulse = 0.7 + Math.sin(t) * 0.3; // Stronger pulse range

        // Outer glow (Purple) - Enhanced for rare pickup (V0.7.1)
        const glowRadius = this.radius * 2.8 * enhancedPulse; // Larger glow radius
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(224, 64, 251, 1.0)'); // Brighter center
        glowGradient.addColorStop(0.5, 'rgba(224, 64, 251, 0.6)'); // Extended glow
        glowGradient.addColorStop(1, 'rgba(156, 39, 176, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional outer glow ring for rare pickup (V0.7.1)
        const ringRadius = this.radius * 3.5 * enhancedPulse;
        const ringGradient = ctx.createRadialGradient(
            this.x, this.y, glowRadius * 0.8,
            this.x, this.y, ringRadius
        );
        ringGradient.addColorStop(0, 'rgba(224, 64, 251, 0.3)');
        ringGradient.addColorStop(1, 'rgba(156, 39, 176, 0)');
        ctx.fillStyle = ringGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#e1bee7');
        coreGradient.addColorStop(1, '#7b1fa2');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (Lightning bolt / "2x")
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2x', this.x, this.y);
    }
}

// Nuke Pickup (Hazard Yellow/Black)
export class NukePickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 14;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'nuke';
    }

    draw() {
        const t = Date.now() / 200 + this.pulseOffset; // Very fast pulse
        const pulse = 0.8 + Math.sin(t) * 0.2;
        // Enhanced pulse for very rare pickup (V0.7.1)
        const enhancedPulse = 0.7 + Math.sin(t) * 0.3; // Stronger pulse range

        // Outer glow (Hazard Yellow)
        const glowRadius = this.radius * 2.5 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc (Black)
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Yellow border
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Radiation symbol (Simple approximation: 3 triangles)
        ctx.fillStyle = '#ffeb3b';
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i / 3) - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.radius * 0.7, angle - 0.5, angle + 0.5);
            ctx.fill();
        }

        // Center dot
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Speed Boost Pickup (Cyan/Turquoise)
export class SpeedPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 12;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'speed';
    }

    draw() {
        const t = Date.now() / 250 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.2;

        // Outer glow (Cyan)
        const glowRadius = this.radius * 2.2 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
        glowGradient.addColorStop(1, 'rgba(0, 188, 212, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#80deea');
        coreGradient.addColorStop(1, '#00acc1');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (Speed arrows »)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('»', this.x, this.y);
    }
}

// Rapid Fire Pickup (Orange/Red)
export class RapidFirePickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 12;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'rapidfire';
    }

    draw() {
        const t = Date.now() / 250 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.2;

        // Outer glow (Orange/Red)
        const glowRadius = this.radius * 2.2 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 152, 0, 0.9)');
        glowGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#ffcc80');
        coreGradient.addColorStop(1, '#f57c00');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (Lightning/burst ⚡)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', this.x, this.y);
    }
}

// Shield Pickup (Light Blue)
export class ShieldPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 12;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'shield';
    }

    draw() {
        const t = Date.now() / 300 + this.pulseOffset;
        const pulse = 0.8 + Math.sin(t) * 0.2;

        // Outer glow (Light Blue)
        const glowRadius = this.radius * 2.2 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(129, 212, 250, 0.9)');
        glowGradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc
        const coreGradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#b3e5fc');
        coreGradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (Shield - hexagon shape)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = this.x + Math.cos(angle) * (this.radius * 0.6);
            const y = this.y + Math.sin(angle) * (this.radius * 0.6);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

// Adrenaline Shot Pickup (Green/Yellow - Speed + Reload + Fire Rate)
export class AdrenalinePickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 12;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'adrenaline';
    }

    draw() {
        const t = Date.now() / 200 + this.pulseOffset; // Fast pulse
        const pulse = 0.8 + Math.sin(t) * 0.2;

        // Outer glow (Green/Yellow)
        const glowRadius = this.radius * 2.5 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
        glowGradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.6)');
        glowGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main disc (Green/Yellow gradient)
        const coreGradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#c8e6c9');
        coreGradient.addColorStop(1, '#4caf50');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (Syringe/Cross symbol)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Vertical line (syringe body)
        ctx.moveTo(this.x, this.y - this.radius * 0.6);
        ctx.lineTo(this.x, this.y + this.radius * 0.6);
        // Horizontal cross
        ctx.moveTo(this.x - this.radius * 0.4, this.y);
        ctx.lineTo(this.x + this.radius * 0.4, this.y);
        ctx.stroke();
    }
}

