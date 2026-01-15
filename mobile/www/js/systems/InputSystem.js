export class GamepadState {
    constructor() {
        this.buttons = {
            fire: { pressed: false, justPressed: false, value: 0 },
            reload: { pressed: false, justPressed: false, value: 0 },
            grenade: { pressed: false, justPressed: false, value: 0 },
            interact: { pressed: false, justPressed: false, value: 0 },
            pause: { pressed: false, justPressed: false, value: 0 },
            prevWeapon: { pressed: false, justPressed: false, value: 0 },
            nextWeapon: { pressed: false, justPressed: false, value: 0 },
            sprint: { pressed: false, justPressed: false, value: 0 },
            melee: { pressed: false, justPressed: false, value: 0 },
            flashlight: { pressed: false, justPressed: false, value: 0 },
            // Menu/Navigation
            select: { pressed: false, justPressed: false, value: 0 }, // A
            back: { pressed: false, justPressed: false, value: 0 },   // B
            up: { pressed: false, justPressed: false, value: 0 },
            down: { pressed: false, justPressed: false, value: 0 },
            left: { pressed: false, justPressed: false, value: 0 },
            right: { pressed: false, justPressed: false, value: 0 }
        };

        this.axes = {
            move: { x: 0, y: 0 },
            aim: { x: 0, y: 0 }
        };
    }

    resetJustPressed() {
        for (const key in this.buttons) {
            this.buttons[key].justPressed = false;
        }
    }
}

export class InputSystem {
    constructor() {
        this.gamepadStates = new Map(); // index -> GamepadState
        this.deadzone = 0.2;
        this.virtualState = null; // Virtual gamepad state for touch controls

        this.rebindMode = false; this.rebindCallback = null;

        window.addEventListener("gamepadconnected", (e) => {
            // Ensure state exists
            if (!this.gamepadStates.has(e.gamepad.index)) {
                this.gamepadStates.set(e.gamepad.index, new GamepadState());
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            this.gamepadStates.delete(e.gamepad.index);
        });
    }

    update(controlSettings) {
        const gamepads = navigator.getGamepads();

        // If we are in rebind mode, specialized handling
        if (this.rebindMode && this.rebindCallback) {
            // Check all gamepads for any button press
            for (let i = 0; i < gamepads.length; i++) {
                const gp = gamepads[i];
                if (gp) {
                    for (let b = 0; b < gp.buttons.length; b++) {
                        if (gp.buttons[b].pressed) {
                            this.rebindCallback(b);
                            this.rebindMode = false;
                            this.rebindCallback = null;
                            return;
                        }
                    }
                }
            }
            return;
        }

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) {
                // Handle disconnected gamepad slot if state exists? 
                // Usually gamepaddisconnected handles this, but navigator.getGamepads() can return nulls for empty slots.
                continue;
            }

            // Force ensure state if we see a gamepad (sometimes events miss)
            if (!this.gamepadStates.has(i)) {
                this.gamepadStates.set(i, new GamepadState());
            }

            const state = this.gamepadStates.get(i);
            state.resetJustPressed();

            this.updateGamepadState(state, gp, controlSettings);
        }
    }

    updateGamepadState(state, gamepad, settings) {
        // Axes
        this.applyDeadzone(gamepad.axes[0], gamepad.axes[1], state.axes.move);
        this.applyDeadzone(gamepad.axes[2], gamepad.axes[3], state.axes.aim);

        // Default mapping if settings not provided
        // Assuming Xbox-style controller standard mapping
        const map = settings || {
            fire: 7, // RT
            reload: 2, // X
            grenade: 4, // LB
            interact: 3, // Y
            pause: 9, // Start
            prevWeapon: 14, // D-Left
            nextWeapon: 15, // D-Right
            sprint: 10, // L-Stick Click
            melee: 5, // RB

            select: 0, // A
            back: 1,   // B
            up: 12, down: 13, left: 14, right: 15
        };

        // Process mapped actions
        for (const action in state.buttons) {
            const idx = map[action];
            if (idx !== undefined && gamepad.buttons[idx]) {
                this.updateButton(state.buttons[action], gamepad.buttons[idx]);
            }
        }
    }

    updateButton(buttonState, rawButton) {
        const pressed = typeof rawButton === 'object' ? rawButton.pressed : rawButton > 0.5;
        const value = typeof rawButton === 'object' ? rawButton.value : (pressed ? 1 : 0);

        if (pressed && !buttonState.pressed) {
            buttonState.justPressed = true;
        }
        buttonState.pressed = pressed;
        buttonState.value = value;
    }

    applyDeadzone(x, y, target) {
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude < this.deadzone) {
            target.x = 0;
            target.y = 0;
        } else {
            target.x = x;
            target.y = y;
        }
    }

    getGamepad(index) {
        return this.gamepadStates.get(index);
    }

    setVirtualState(state) {
        this.virtualState = state;
    }

    getAnyGamepad() {
        if (this.gamepadStates.size > 0) return this.gamepadStates.values().next().value;
        if (this.virtualState) return this.virtualState;
        return null;
    }
    // New helper to get all active indices
    getConnectedGamepadIndices() {
        return Array.from(this.gamepadStates.keys());
    }

    // Backward compatibility for P1 (assumes first gamepad)
    getAimInput() { return this.getAnyGamepad()?.axes.aim || { x: 0, y: 0 }; }
    getMoveInput() { return this.getAnyGamepad()?.axes.move || { x: 0, y: 0 }; }

    // Proxy for buttons of first available gamepad
    get buttons() {
        const gp = this.getAnyGamepad();
        return gp ? gp.buttons : new GamepadState().buttons;
    }

    isConnected() { return this.gamepadStates.size > 0; }

    startRebind(callback) {
        this.rebindMode = true;
        this.rebindCallback = callback;
    }

    cancelRebind() {
        this.rebindMode = false;
        this.rebindCallback = null;
    }
}

export const inputSystem = new InputSystem();
