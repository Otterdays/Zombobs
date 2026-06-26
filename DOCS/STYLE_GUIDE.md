# ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS Style Guide & Design System

## 1. Design Philosophy
**"Retro-Future Arcade Horror"**

ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS combines the raw, pixel-perfect feel of classic arcade shooters with modern web aesthetics. The design language balances "gritty survival" with "slick, high-tech interface".

- **Core Pillars**: Dark, Neon, Glitch, Glass.
- **Atmosphere**: Oppressive darkness punctuated by vibrant, dangerous lights.

## 2. Color Palette

### Primary Colors
| Role | Color | Hex | CSS Variable | Usage |
|------|-------|-----|--------------|-------|
| **Deep Dark** | ![#02040a](https://placehold.co/15x15/02040a/02040a.png) | `#02040a` | `--bg-start` | Main background gradient start |
| **Abyssal Green** | ![#051b1f](https://placehold.co/15x15/051b1f/051b1f.png) | `#051b1f` | `--bg-end` | Main background gradient end |
| **Blood Red** | ![#ff1744](https://placehold.co/15x15/ff1744/ff1744.png) | `#ff1744` | `--accent` | Primary actions, health, danger |
| **Soft Red** | ![#ff5252](https://placehold.co/15x15/ff5252/ff5252.png) | `#ff5252` | `--accent-soft` | Glows, gradients, secondary highlights |

### Neutral / UI Colors
| Role | Color | Hex | CSS Variable | Usage |
|------|-------|-----|--------------|-------|
| **Text Main** | ![#f5f5f5](https://placehold.co/15x15/f5f5f5/f5f5f5.png) | `#f5f5f5` | `--text-main` | Primary headers, body text |
| **Text Muted** | ![#9e9e9e](https://placehold.co/15x15/9e9e9e/9e9e9e.png) | `#9e9e9e` | `--text-muted` | Metadata, labels, secondary info |
| **Glass Card** | ![#0a0c10](https://placehold.co/15x15/0a0c10/0a0c10.png) | `rgba(10, 12, 16, 0.65)` | `--card-bg` | Panel backgrounds (needs blur) |
| **Border** | ![#ffffff](https://placehold.co/15x15/ffffff/ffffff.png) | `rgba(255, 255, 255, 0.08)` | `--card-border` | Subtle outlining |

## 3. Typography

### Headings & Branding
**Font**: `Creepster`
**Usage**: Game Title, specific dramatic headers.
**Styling**:
- Heavy text-shadows for glow effect.
- Vertical gradients often applied via `background-clip: text`.

```css
font-family: 'Creepster', system-ui;
text-shadow: 0 0 15px rgba(255, 23, 68, 0.8);
```

### Interface & Body
**Font**: `'Roboto Mono', monospace`
**Usage**: UI elements, body text, code snippets, buttons.
**Rationale**: Reinforces the "tech/prototype" aesthetic.

## 4. UI Components

### Cards (Glassmorphism)
Containers use a frosted glass effect to separate content from the animated background.

```css
background: var(--card-bg);
backdrop-filter: blur(16px) saturate(120%);
-webkit-backdrop-filter: blur(16px) saturate(120%);
border: 1px solid var(--card-border);
border-radius: 18px;
```

### Buttons (Primary)
High-visibility call-to-action elements.

- **Shape**: Full rounded pills (`border-radius: 999px`).
- **Style**: Radial/Linear gradient background.
- **Effect**: "Pulse" animation on shadow to suggest energy.

### Pills / Tags
Used for metadata and quick info.

- **Style**: Outlined, low opacity background.
- **Interaction**: Slight glow and opacity increase on hover.

## 5. Visual Effects (FX)

### Noise Overlay
A global grain effect applied to the viewport to reduce banding and add texture.

```css
.noise-overlay {
    mix-blend-mode: overlay;
    opacity: 0.15;
    pointer-events: none;
    /* Uses SVG filter or noise image */
}
```

### Animations
- **`fadeInUp`**: Standard entrance animation for cards (opacity 0->1, Y-translation).
- **`pulse-glow`**: Breathing effect for key interactive elements.

## 6. Game Canvas Rendering
*Styling implemented via Canvas API Context 2D*

- **Zombies**: Radial gradients for "toxic aura" and body.
  - [AMENDED 2026-06-25]: Upright zombies use additive torso overlay layers (`screen`/`lighter`, clipped to torso ellipse) and procedural organic motion (gaze-offset eyes, velocity lean, per-id `walkPhase`). Extra glow layers respect `graphicsSettings.getQualityValues('aura'|'eyeGlow')`.
- **Projectiles**: High contrast cores (white/yellow) with colored outer glows.
- **Lighting**: Additive blending (implicit in some particle effects) and radial gradient overlays for vignettes.
- **Shadows**: Dark ellipses offset below entities (zombies and players) when shadows enabled.
- **Lighting Overlay**: Radial gradient lighting effect that follows player position when lighting enabled.
- **Vignette**: Dark radial gradient overlay at screen edges (toggleable via settings).

## 7. Canvas UI System
*Canvas-based UI components (Settings Panel, HUD elements)*

Canvas UI elements must maintain visual consistency with DOM-based UI while working within Canvas rendering constraints.

### Color Constants
All Canvas UI components should use the standardized color palette:

```javascript
const COLORS = {
    bgStart: '#02040a',
    bgEnd: '#051b1f',
    accent: '#ff1744',
    accentSoft: '#ff5252',
    cardBg: 'rgba(10, 12, 16, 0.9)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textMain: '#f5f5f5',
    textMuted: '#9e9e9e',
    glassBg: 'rgba(10, 12, 16, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.12)'
};
```

### Typography (Canvas)

#### Headers
- **Font**: `'bold 36px "Creepster", cursive'`
- **Usage**: Main panel titles (SETTINGS, CONTROLS, VIDEO SETTINGS)
- **Styling**:
  - Gradient fill: `#ff5252` → `#ff1744`
  - Shadow blur: `20px`
  - Shadow color: `rgba(255, 23, 68, 0.8)`
  - Text align: `center`, baseline: `middle`

#### Body Text
- **Font**: `'14px "Roboto Mono", monospace'` (regular) or `'bold 16px "Roboto Mono", monospace'` (buttons)
- **Usage**: Labels, button text, descriptions
- **Colors**: `COLORS.textMain` for primary, `COLORS.textMuted` for secondary

### Standard Components

#### Buttons
**Method**: `drawButton(x, y, width, height, text, isHovered, isActive)`

**Styling**:
- **Default**: `rgba(255, 23, 68, 0.2)` background, `rgba(255, 255, 255, 0.12)` border
- **Hover**: `rgba(255, 23, 68, 0.4)` background, `#ff1744` border with `8px` glow
- **Active**: Gradient `#ff5252` → `#ff1744`, `#ff1744` border with glow
- **Text**: `bold 16px "Roboto Mono"`, `#f5f5f5` color, centered

**Example**:
```javascript
this.drawButton(x, y, width, height, 'Button Text', isHovered, isActive);
```

#### Toggle Switches
**Method**: `drawToggle(x, y, width, height, isOn, isHovered)`

**Styling**:
- **Track (OFF)**: `rgba(40, 40, 40, 0.8)` background, `rgba(255, 255, 255, 0.12)` border
- **Track (ON)**: `#ff1744` background, `#ff5252` border with `6px` glow
- **Handle**: White square (`#f5f5f5`), slides left/right
- **Handle Glow (ON)**: `rgba(255, 255, 255, 0.3)` radial glow around handle
- **Dimensions**: Standard `50x26px`, handle `20x20px` with `3px` padding

**Example**:
```javascript
this.drawToggle(x, y, 50, 26, isOn, isHovered);
```

#### Sliders
**Method**: `drawSlider(x, width, y, label, value, min, max, settingKey)`

**Styling**:
- **Track Background**: `rgba(255, 255, 255, 0.15)`, `6px` height
- **Fill**: Gradient `#ff5252` → `#ff1744` with `8px` glow (`rgba(255, 23, 68, 0.6)`)
- **Handle**: White circle (`#f5f5f5`), `8px` radius
- **Handle Glow**: `10px` blur, `rgba(255, 23, 68, 0.8)` color
- **Handle Border**: `#ff1744`, `2px` width
- **Label**: `14px "Roboto Mono"`, `#f5f5f5` (left-aligned)
- **Value**: `14px "Roboto Mono"`, `#9e9e9e` (right-aligned)

**Example**:
```javascript
this.drawSlider(x, width, y, 'Max Particles', value, 50, 500, 'particleCount');
```

### Panel Backgrounds

#### Glass-morphism Panel
- **Background**: `rgba(10, 12, 16, 0.9)` solid fill
- **Outer Border**: `#ff1744`, `2px` width, `10px` glow (`rgba(255, 23, 68, 0.5)`)
- **Inner Border**: `rgba(255, 255, 255, 0.12)`, `1px` width, offset by `1px`

#### Overlay
- **Type**: Radial gradient from center
- **Colors**: `rgba(2, 4, 10, 0.92)` → `rgba(0, 0, 0, 0.95)`
- **Purpose**: Darken background while maintaining slight red tint

### Interaction States

#### Hover
- Buttons: Increased opacity/glow
- Toggles: Slight background brightening
- Sliders: Handle glow intensifies

#### Active/Selected
- Buttons: Full gradient fill with strong glow
- Toggles: Red track with handle glow
- Preset buttons: Same as active button state

#### Rebinding (Controls)
- Keybind buttons: Full gradient fill (`#ff5252` → `#ff1744`)
- Border: White (`#f5f5f5`), `2px` width
- Glow: `12px` blur, `rgba(255, 23, 68, 0.8)`
- Text: "Press..." in white

### Best Practices

1. **Consistency**: Always use helper methods (`drawButton`, `drawToggle`, `drawSlider`) for consistency
2. **Colors**: Reference `COLORS` constant object, never hardcode hex values
3. **Typography**: Use Creepster only for main headers, Roboto Mono for all other text
4. **Glow Effects**: Use `shadowBlur` and `shadowColor` for neon glow effects, reset to `0` after use
5. **Spacing**: Maintain consistent padding (`100px` from edges, `40px` between elements)
6. **State Management**: Track hover/active states via mouse position checks

