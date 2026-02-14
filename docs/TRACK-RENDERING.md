# Track Rendering

## Track Type Selection

```javascript
isOvalRace(furlongs) -> furlongs > 6
```

- **Straight:** 5f, 6f (sprint)
- **Oval:** 7f, 8f, 10f, 12f (mid/stayer)

## Straight Track

Simple horizontal layout. Each runner is a row with the horse sprite positioned by:

```
leftPos = (runner.position / 100) * 90   // max 90% from left
```

## Oval Track

### CSS Structure (styles.css)

The `.race-track.oval-track` element has:
- **Track surface:** Radial gradient creating brown running surface between 59%-72% of the ellipse
- **Green infield:** Inner radial gradient up to 58%
- **Outer rail** (`::before`): Elliptical border, `top:7% left:4% right:4% bottom:7%` -> semi-axes ~46% x ~43%
- **Inner rail** (`::after`): Elliptical border, `top:20% left:14% right:14% bottom:20%` -> semi-axes ~36% x ~30%
- **Finish line** (`.oval-finish`): `left:79%, top:62%, height:26%`

### Oval Position Maths (getOvalPosition ~line 140)

Full parametric ellipse. Returns `{ x, y, flipped, scale, zIndex }`.

**Ellipse centre and base semi-axes** (midpoint between inner/outer CSS rails):
```
cx = 50%,  cy = 50%
baseA = 41%  (horizontal)
baseB = 36%  (vertical)
```

**Lane staggering** (spread runners across track width):
```
laneMid = (totalRunners - 1) / 2
laneSpread = 0.4  (% per lane index)
laneOffset = (runnerIndex - laneMid) * laneSpread
a = baseA + laneOffset
b = baseB + laneOffset * 0.85
```

Inner runners get smaller ellipses, outer runners get larger ones. Total spread across 8 runners ≈ 2.8%.

**Start/finish angle:** 315 degrees (bottom-right of home straight).

**Direction:** Counter-clockwise on screen (left-handed, like real British racing). Angle increases with progress.

```
startAngle = (315 / 180) * PI
totalAngle = laps * 2 * PI
t = clamp(progress / 100, 0, 1)
angle = startAngle + t * totalAngle
```

**Position:**
```
x = cx + a * cos(angle)
y = cy - b * sin(angle)
```

**Facing direction:**
```
flipped = sin(angle) > 0   // true when moving left (far side)
```

Sprite faces right by default; `scaleX(-1)` flips it to face left.

**Perspective scale** (depth effect):
```
yNorm = (y - (cy - baseB)) / (2 * baseB)    // 0 at top, 1 at bottom
scale = 0.6 + 0.4 * clamp(yNorm, 0, 1)
```

Horses at top (far side) render at 60% size; at bottom (home straight) at 100%.

**Z-index** (depth sorting):
```
zIndex = round(y * 10)    // higher y = drawn on top
```

### Lap Count (getOvalLaps ~line 127)

```
furlongs > 8 -> 2 laps
else -> 1 lap
```

### Oval Runner CSS

`.oval-runner` elements are absolutely positioned with:
- `left` / `top` from `getOvalPosition`
- `--oval-scale` CSS variable for `scale` property
- `z-index` for depth sorting
- `transform: scaleX(-1)` when flipped
- 0.25s CSS transition on left/top for smooth movement

Text labels (`.oval-badge`, `.oval-label`) are un-flipped on the far side via:
```css
.oval-runner[style*="scaleX(-1)"] .position-badge,
.oval-runner[style*="scaleX(-1)"] .race-horse-label {
    transform: translateX(-50%) scaleX(-1);
}
```

### Horse Sprite SVG (horseSpriteSVG ~line 2092)

Inline SVG (56x36 viewBox) with CSS-animated legs, tail, and mane. Jockey silks use `var(--silk-primary)` and `var(--silk-secondary)` custom properties.

Animations:
- `svgLegForward` / `svgLegBack`: Galloping legs (0.4s)
- `svgTail`: Tail swish (1.2s)
- `svgMane`: Mane flutter (0.8s)
