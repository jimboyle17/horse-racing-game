# Champion Trainer - Horse Racing Game

## Project Overview

A single-page browser game (HTML/CSS/JS, no frameworks) where the player manages a racing stable across multiple seasons. Buy horses at auction, train them, choose race strategies, and make split-second decisions during live races to become champion.

## File Structure

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~507 | All screens, modals, and UI structure. Loads Google Fonts (Outfit + Playfair Display). |
| `styles.css` | ~3210 | Full styling: CSS variables, screen layouts, race track visuals, animations, responsive breakpoints. |
| `game.js` | ~3130 | All game logic: state management, auction, stable, race simulation, AI, sound, save/load, seasons. |

## Game Flow

```
Main Menu
  -> New Game Setup -> Dashboard
  -> Continue (Load) -> Dashboard

Dashboard (central hub)
  -> Auction -> Catalogue -> Live Bidding -> Results -> Dashboard
  -> Stable -> Horse Detail Modal (training/stats) -> Stable
  -> Races -> Calendar -> Horse Select -> Strategy -> Live Race -> Results
                                                                     |
                                                                     v
                                                              Between Races -> Dashboard
                                                              (or after final race)
                                                              Season Ceremony -> Next Season -> Dashboard
```

## Screens (index.html)

| Screen ID | Purpose |
|-----------|---------|
| `main-menu` | New Game, Continue, How to Play |
| `how-to-play` | 4 instruction cards |
| `new-game-setup` | Trainer name, silk colours, difficulty/budget |
| `dashboard` | Hub: budget, season, standings, nav to Auction/Stable/Races |
| `auction` | Sub-views: catalogue, live bidding, results |
| `stable` | Horse cards grid + detail modal (stats, training, condition) |
| `race` | Sub-views: calendar, horse select, strategy, live race, results |
| `between-races` | Training report, injuries, setbacks, next race preview |
| `season-ceremony` | End-of-season standings, aging, confetti for champion |
| `game-modal` | Reusable alert/confirm overlay (replaces native dialogs) |

## Key Technologies

- Pure vanilla JS (no build step, no frameworks)
- Web Audio API for all sound (no audio files)
- CSS animations for horse sprites, confetti, modals
- SVG horse+jockey sprites with CSS custom properties for silk colours
- localStorage for save/load
- Parametric ellipse math for oval track positioning
