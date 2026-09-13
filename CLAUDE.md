# Champion Trainer - Horse Racing Management Sim

## Project Overview
Single-page vanilla JS horse racing management game. No frameworks, no build tools. Open `index.html` in a browser to play.

## Files
- **game.js** (~11,600 lines) - All game logic, state, rendering
- **index.html** (~855 lines) - UI screens and layout
- **styles.css** (~5,450 lines) - All styling, animations, tile graphics
- **docs/** - Architecture documentation (may be outdated vs current code)

## Architecture
- **GameState** (line ~10) - Central state object, persisted via `localStorage` as JSON
- **Save/Load** - `saveGame()` / `loadGame()` with migration blocks for backward compatibility. New features MUST add migration in `loadGame()`.
- **Screens** - Switched via `showScreen(id)`. Main screens: main-menu, new-game-setup, dashboard, race, auction, yearling-auction, stable, yard, season-ceremony, between-races
- **Yard** - 2D tile-based world (30x40 grid, TILE_SIZE=32px). Player moves with WASD, interacts with E. Multiple zones: outdoor, barn, feed room, stall, racecourse interior
- **Races** - 10 racedays/season, 8 races each, 100-tick simulation with tactics (front-runner/stalker/closer), whip mechanic, jump racing with spacebar timing

## Key Systems
- **5 Training Centres** (TRAINING_CENTRES constant) - Newmarket, Lambourn, Epsom, Middleham, Malton. Each defines buildings, paths, decorations, visual features (fence style, tree style, landmarks, terrain patches, building tints)
- **Horse Attributes** - speed, stamina, acceleration, temperament, tacticalSuitability, distancePreference, groundPreference, isJumper, jumpAbility
- **XP/Levels** - 20 levels, XP from races/training/care/seasons, pluggable reward hooks (rewards TBD)
- **Owners** - Attracted by yard quality + player level, pay weekly fees, depart if unsatisfied
- **Yard Pets** - Cats/dogs/rabbits counter pests (rats/pigeons/foxes), boost morale
- **Betting** - Odds from stats, win/place/each-way bets, settled after each race
- **Live Bidding** - Interactive Tattersalls auction with Bid/Pass buttons and 5-second timer
- **Settings** - Race difficulty, care needs, staff automation (set at game creation)
- **Cars** - Purchasable vehicle for 2x yard movement speed

## Conventions
- All functions are global (no modules). New functions must be exported via `window.functionName = functionName` near the bottom of game.js
- Interactables are defined per-centre in TRAINING_CENTRES extras arrays, plus auto-generated from buildings via `generateInteractablesFromCentre()`
- New interactable handlers go in the `interactYard()` switch statement
- Horse generation: `generateHorse()` for adults, `generateYearling()` for yearlings. Both must include all current attributes.
- SVG graphics are inline in JS functions (e.g., `horseSpriteSVG()`, `getTreeSVG()`, `getLandmarkSVG()`)
- CSS custom properties `--centre-grass`, `--centre-path` set per training centre for map theming
- Building styles use `.yard-building-2d.{css-class}` with optional tint class from visualFeatures

## Adding New Features
1. Add new state fields to `GameState` object (line ~10)
2. Add migration block in `loadGame()` (search for "Migration:")
3. Add UI in `index.html` or generate dynamically in JS
4. Add CSS in `styles.css`
5. Export new functions via `window.x = x`
6. If adding to yard: add interactables to TRAINING_CENTRES extras or BUILDING_INTERACT_MAP

## Testing
Open `index.html` in browser. Check console for errors. Test both new game and loading existing saves (migration).
