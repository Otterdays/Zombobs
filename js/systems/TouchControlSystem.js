import { GamepadState } from './InputSystem.js';

export class TouchControlSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.active = false;

        // Virtual Gamepad State (mimics a physical controller)
        this.virtualState = new GamepadState();

        // Configuration
        this.joystickRadius = 45; // Shrunk from 60
        this.joystickInnerRadius = 20; // Shrunk from 30
        this.buttonRadius = 30; // Shrunk from 35
        this.padding = 60; // Increased padding to bring controls into frame (was 40)

        // Touch tracking
        this.touches = new Map(); // identifier -> { x, y, startX, startY, type }

        // Controls definition
        this.controls = {
            leftStick: {
                id: 'leftStick',
                x: 100, y: 0, // y calculated on resize 
                active: false,
                touchId: null,
                value: { x: 0, y: 0 }
            },
            rightStick: {
                id: 'rightStick',
                x: 0, y: 0,
                active: false,
                touchId: null,
                value: { x: 0, y: 0 }
            },
            // Virtual Buttons
            reload: { id: 'reload', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'R' },
            grenade: { id: 'grenade', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'G' },
            melee: { id: 'melee', x: 0, y: 0, radius: 25, active: false, touchId: null, label: 'M' },
            pause: { id: 'pause', x: 0, y: 0, radius: 20, active: false, touchId: null, label: 'II' },
            flashlight: { id: 'flashlight', x: 0, y: 0, radius: 25, active: false, touchId: null, label: '🔦' }
        };

        this.initEvents();
        this.resize();
    }

    initEvents() {
        // Use passive: false to allow preventing default (scrolling)
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Use Screen Dimensions for positioning (not canvas internal resolution)
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Calculate DPR for scaling radii and hit detection
        const rect = this.canvas.getBoundingClientRect();
        const dpr = this.canvas.width / rect.width;

        // Use padding to shift controls in (default padding is 60 now)
        const shiftX = Math.max(0, this.padding - 40);
        const shiftY = Math.max(0, this.padding - 40);

        // Position Left Stick (Bottom Left) - Moved UP
        this.controls.leftStick.x = 80 + shiftX;
        this.controls.leftStick.y = h - 120 - shiftY; // Higher up (was h - 80)

        // Position Right Stick (Bottom Right) - Moved WAY LEFT
        this.controls.rightStick.x = w - 220 - shiftX; // Way more left (was w - 140)
        this.controls.rightStick.y = h - 120 - shiftY;

        // Position Buttons (Right side, clustered around Right Stick) - All moved WAY LEFT
        // Reload (Top Left of stick)
        this.controls.reload.x = w - 280 - shiftX; // Way more left
        this.controls.reload.y = h - 180 - shiftY;

        // Grenade (Top of stick)
        this.controls.grenade.x = w - 220 - shiftX;
        this.controls.grenade.y = h - 200 - shiftY;

        // Melee (Left of stick)
        this.controls.melee.x = w - 340 - shiftX; // Way more left
        this.controls.melee.y = h - 120 - shiftY;

        // Pause (Top Right Corner)
        this.controls.pause.x = w - 40;
        this.controls.pause.y = 40;

        // Flashlight (Below Pause)
        this.controls.flashlight.x = w - 40;
        this.controls.flashlight.y = 100;

        // Store DPR for scaling radii in draw/hit detection
        this.scale = dpr;
    }

    handleTouchStart(e) {
        if (!this.active) return;
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'start');
        }
    }

    handleTouchMove(e) {
        if (!this.active) return;
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'move');
        }
    }

    handleTouchEnd(e) {
        if (!this.active) return;
        for (const touch of e.changedTouches) {
            this.processTouch(touch, 'end');
        }
    }

    setActive(active) {
        this.active = active;
        // If deactivating, reset all controls
        if (!active) {
            this.virtualState.resetJustPressed();
            this.virtualState.buttons.fire.pressed = false;
            this.virtualState.buttons.reload.pressed = false;
            this.virtualState.buttons.grenade.pressed = false;
            this.virtualState.buttons.melee.pressed = false;
            this.virtualState.buttons.pause.pressed = false;
            this.virtualState.axes.move.x = 0;
            this.virtualState.axes.move.y = 0;
            this.virtualState.axes.aim.x = 0;
            this.virtualState.axes.aim.y = 0;

            // Reset control states
            this.controls.leftStick.active = false;
            this.controls.rightStick.active = false;
            this.controls.reload.active = false;
            this.controls.grenade.active = false;
            this.controls.melee.active = false;
            this.controls.pause.active = false;
            this.controls.flashlight.active = false;
        }
    }

    processTouch(touch, phase) {
        // Use Screen Coordinates directly (controls are positioned in screen space)
        const x = touch.clientX;
        const y = touch.clientY;
        const id = touch.identifier;

        if (phase === 'start') {
            // Check if touch hits any control

            // 1. Buttons
            if (this.checkButtonHit(this.controls.reload, x, y, id)) return;
            if (this.checkButtonHit(this.controls.grenade, x, y, id)) return;
            if (this.checkButtonHit(this.controls.melee, x, y, id)) return;
            if (this.checkButtonHit(this.controls.pause, x, y, id)) return;
            if (this.checkButtonHit(this.controls.flashlight, x, y, id)) return;

            // 2. Joysticks
            // Check distance to Left Stick center
            if (this.checkStickHit(this.controls.leftStick, x, y, id)) return;

            // Check distance to Right Stick center
            if (this.checkStickHit(this.controls.rightStick, x, y, id)) return;

            // Dynamic Stick Logic - Strict Half-Screen Split
            // If we didn't hit a specific button, the entire half of the screen acts as the stick

            const midX = window.innerWidth / 2;

            if (x < midX) {
                // LEFT SIDE -> LEFT STICK (Movement)
                if (!this.controls.leftStick.active) {
                    this.controls.leftStick.active = true;
                    this.controls.leftStick.touchId = id;
                    // Optional: Recenter stick to touch position for comfort? 
                    // For now, let's keep the stick static but allow the input to 'grab' it from anywhere on left
                    // But we need initial delta to be 0 or consistent.
                    // If we just latch on, the player might jump if they touch far from center.
                    // Standard mobile latch: Touch anywhere -> that becomes center OR Stick moves to touch.
                    // Let's implement: Stick stays put, but we treat the touch as valid input controlling it.
                    this.updateStickValue(this.controls.leftStick, x, y);
                }
            } else {
                // RIGHT SIDE -> RIGHT STICK (Aiming/Firing)
                if (!this.controls.rightStick.active) {
                    this.controls.rightStick.active = true;
                    this.controls.rightStick.touchId = id;
                    this.updateStickValue(this.controls.rightStick, x, y);
                }
            }
        } else if (phase === 'move') {
            // Update Sticks
            if (this.controls.leftStick.active && this.controls.leftStick.touchId === id) {
                this.updateStickValue(this.controls.leftStick, x, y);
            }
            if (this.controls.rightStick.active && this.controls.rightStick.touchId === id) {
                this.updateStickValue(this.controls.rightStick, x, y);
            }
        } else if (phase === 'end') {
            // Reset controls associated with this touch
            this.resetControl(this.controls.leftStick, id);
            this.resetControl(this.controls.rightStick, id);
            this.resetControl(this.controls.reload, id);
            this.resetControl(this.controls.grenade, id);
            this.resetControl(this.controls.melee, id);
            this.resetControl(this.controls.pause, id);
        }

        // Update Virtual State
        this.updateVirtualState();
    }

    checkButtonHit(btn, x, y, touchId) {
        const dx = x - btn.x;
        const dy = y - btn.y;
        if (dx * dx + dy * dy < (btn.radius + 20) ** 2) {
            btn.active = true;
            btn.touchId = touchId;
            return true;
        }
        return false;
    }

    checkStickHit(stick, x, y, touchId) {
        // Larger hit area for sticks
        const dx = x - stick.x;
        const dy = y - stick.y;
        if (dx * dx + dy * dy < (this.joystickRadius * 2) ** 2) {
            stick.active = true;
            stick.touchId = touchId;
            this.updateStickValue(stick, x, y);
            return true;
        }
        return false;
    }

    updateStickValue(stick, x, y) {
        let dx = x - stick.x;
        let dy = y - stick.y;

        // Clamp length
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > this.joystickRadius) {
            const scale = this.joystickRadius / len;
            dx *= scale;
            dy *= scale;
        }

        // Normalize for output (-1 to 1)
        stick.value.x = dx / this.joystickRadius;
        stick.value.y = dy / this.joystickRadius;
    }

    resetControl(control, touchId) {
        if (control.touchId === touchId) {
            control.active = false;
            control.touchId = null;
            if (control.value) {
                control.value.x = 0;
                control.value.y = 0;
            }
        }
    }

    updateVirtualState() {
        const state = this.virtualState;

        // Reset JustPressed happens in InputSystem loop, but we set Pressed here
        state.axes.move.x = this.controls.leftStick.value.x;
        state.axes.move.y = this.controls.leftStick.value.y;

        state.axes.aim.x = this.controls.rightStick.value.x;
        state.axes.aim.y = this.controls.rightStick.value.y;

        // Auto-fire if right stick is moved significantly
        const aimMag = Math.sqrt(state.axes.aim.x ** 2 + state.axes.aim.y ** 2);
        state.buttons.fire.pressed = aimMag > 0.3; // Deadzone

        state.buttons.reload.pressed = this.controls.reload.active;
        state.buttons.grenade.pressed = this.controls.grenade.active;
        state.buttons.melee.pressed = this.controls.melee.active;
        state.buttons.pause.pressed = this.controls.pause.active;
        state.buttons.flashlight.pressed = this.controls.flashlight.active;
    }

    getVirtualState() {
        return this.virtualState;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Scale to match canvas resolution (controls are in screen space, canvas is high-res)
        const dpr = this.scale || 1;

        // Draw Left Stick
        this.drawStick(ctx, this.controls.leftStick, dpr);

        // Draw Right Stick
        this.drawStick(ctx, this.controls.rightStick, dpr);

        // Draw Buttons
        this.drawButton(ctx, this.controls.reload, dpr);
        this.drawButton(ctx, this.controls.grenade, dpr);
        this.drawButton(ctx, this.controls.melee, dpr);
        this.drawButton(ctx, this.controls.pause, dpr);
        this.drawButton(ctx, this.controls.flashlight, dpr);

        ctx.restore();
    }

    drawStick(ctx, stick, dpr = 1) {
        const x = stick.x * dpr;
        const y = stick.y * dpr;
        const outerRadius = this.joystickRadius * dpr;
        const innerRadius = this.joystickInnerRadius * dpr;

        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        ctx.beginPath();
        const knobX = x + stick.value.x * outerRadius;
        const knobY = y + stick.value.y * outerRadius;
        ctx.arc(knobX, knobY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = stick.active ? 'rgba(255, 23, 68, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    drawButton(ctx, btn, dpr = 1) {
        const x = btn.x * dpr;
        const y = btn.y * dpr;
        const radius = btn.radius * dpr;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = btn.active ? 'rgba(255, 23, 68, 0.6)' : 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = `bold ${16 * dpr}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, x, y);
    }
}
