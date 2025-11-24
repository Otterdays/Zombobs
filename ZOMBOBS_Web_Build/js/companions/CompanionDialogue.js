/**
 * CompanionDialogue handles the chat bubble system for AI companions.
 * It manages the message queue, random triggers, and rendering of speech bubbles.
 */
export class CompanionDialogue {
    constructor(player) {
        this.player = player;
        this.speechQueue = [];
        this.currentMessage = null;
        this.messageLifetime = 3000; // ms
        this.fadeTime = 500; // ms
        this.lastSpeechTime = 0;
        this.minSpeechInterval = 5000; // Minimum time between messages

        // Database of text blurbs
        this.dialogueDb = {
            spawn: [
                "Let's rock!", "Locked and loaded.", "Watch your six.", "I'm with you.",
                "Let's kill some zeds.", "Ready for action.", "Stay close.", "Moving out."
            ],
            reload: [
                "Reloading!", "Cover me!", "Dry!", "Changing mag!",
                "Need a sec!", "Reloading weapon!", "Out of ammo!"
            ],
            kill: [
                "Got one!", "Scratch one!", "Headshot!", "Down!",
                "Take that!", "Boom!", "Clean kill.", "Target neutralized."
            ],
            low_health: [
                "I'm hit!", "Taking damage!", "Need a medic!", "Bleeding out!",
                "Too many of them!", "Back me up!", "Health critical!"
            ],
            idle: [
                "All quiet...", "Stay alert.", "Check your corners.", "Where are they?",
                "Keep moving.", "Don't let your guard down.", "I hear something..."
            ],
            revive: [
                "Thanks, boss.", "I owe you one.", "Back in the fight.", "Let's go!",
                "Close call.", "Appreciate it.", "Not dead yet."
            ],
            engaging: [
                "Contact!", "Open fire!", "Lit 'em up!", "Engaging target!",
                "Zombies ahead!", "They're everywhere!", "Die, you ugly..."
            ],
            help_player: [
                "I got you!", "Helping out!", "Covering you!", "On my way!",
                "Hang in there!", "Don't die on me!"
            ]
        };
    }

    /**
     * Triggers a dialogue message based on context
     * @param {string} context - The context key (e.g., 'reload', 'kill')
     * @param {number} probability - Chance to trigger (0.0 to 1.0)
     */
    trigger(context, probability = 1.0) {
        // Check probability
        if (Math.random() > probability) return;

        // Check cooldown (unless critical)
        const now = Date.now();
        const isCritical = context === 'low_health' || context === 'help_player';

        if (!isCritical && now - this.lastSpeechTime < this.minSpeechInterval) {
            return;
        }

        const templates = this.dialogueDb[context];
        if (templates && templates.length > 0) {
            const text = templates[Math.floor(Math.random() * templates.length)];
            this.addMessage(text, isCritical ? 2 : 1);
            this.lastSpeechTime = now;
        }
    }

    addMessage(text, priority = 1) {
        // If current message is lower priority, overwrite it
        // If same priority, queue it? No, just overwrite for instant feedback usually better in fast paced games
        // But let's use a simple queue for critical stuff

        if (this.currentMessage && this.currentMessage.priority > priority) {
            return; // Don't interrupt higher priority
        }

        this.currentMessage = {
            text: text,
            startTime: Date.now(),
            priority: priority,
            life: this.messageLifetime
        };
    }

    update() {
        if (this.currentMessage) {
            const now = Date.now();
            const elapsed = now - this.currentMessage.startTime;

            if (elapsed > this.currentMessage.life) {
                this.currentMessage = null;
            }
        }
    }

    /**
     * Renders the chat bubble above the player
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - Player X position
     * @param {number} y - Player Y position (center)
     */
    draw(ctx, x, y) {
        if (!this.currentMessage) return;

        const now = Date.now();
        const elapsed = now - this.currentMessage.startTime;

        // Fade in/out
        let alpha = 1.0;
        if (elapsed < 200) {
            alpha = elapsed / 200; // Fade in
        } else if (elapsed > this.currentMessage.life - this.fadeTime) {
            alpha = (this.currentMessage.life - elapsed) / this.fadeTime; // Fade out
        }

        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Bubble positioning
        const padding = 8;
        const fontSize = 14;
        ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        const textMetrics = ctx.measureText(this.currentMessage.text);
        const textWidth = textMetrics.width;
        const bubbleWidth = textWidth + (padding * 2);
        const bubbleHeight = fontSize + (padding * 2);

        // Draw above player
        const bubbleX = x - (bubbleWidth / 2);
        const bubbleY = y - bubbleHeight - 10; // 10px gap

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        // Bubble Background
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
        ctx.fill();

        // Little triangle pointer
        ctx.beginPath();
        ctx.moveTo(x - 6, bubbleY + bubbleHeight);
        ctx.lineTo(x + 6, bubbleY + bubbleHeight);
        ctx.lineTo(x, bubbleY + bubbleHeight + 6);
        ctx.fill();

        // Text
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentMessage.text, x, bubbleY + (bubbleHeight / 2));

        ctx.restore();
    }
}
