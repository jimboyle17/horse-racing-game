# Function Index (game.js)

All functions listed with approximate line numbers. Lines may shift slightly as code evolves.

## Distance / Track Helpers (~111-185)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `getRaceDistanceCategory(furlongs)` | 111 | Returns 'sprint', 'mid', or 'stayer' |
| `isOvalRace(furlongs)` | 120 | True if furlongs > 6 |
| `getOvalLaps(furlongs)` | 127 | Returns 1 (<=8f) or 2 (>8f) |
| `getOvalPosition(progress, laps, runnerIndex, totalRunners)` | 140 | Parametric ellipse position for oval track |

## Modal System (~188-226)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `showGameModal(title, bodyHTML, buttons)` | 191 | Show modal, returns Promise with button value |
| `gameAlert(title, message)` | 215 | Single-button OK modal |
| `gameConfirm(title, message)` | 221 | Cancel/Confirm modal, returns boolean |

## Sound Manager (~232-388)

| Method | ~Line | Purpose |
|--------|-------|---------|
| `SoundManager._init()` | 238 | Lazy-init AudioContext |
| `SoundManager.toggleMute()` | 247 | Toggle mute state |
| `SoundManager.playClick()` | 254 | UI click sound |
| `SoundManager.playFanfare()` | 269 | Victory fanfare |
| `SoundManager.playGavel()` | 289 | Auction gavel |
| `SoundManager.playWhoosh()` | 311 | Decision whoosh |
| `SoundManager.startCrowd()` | 328 | Start crowd ambience |
| `SoundManager.buildCrowd()` | 355 | Intensify crowd |
| `SoundManager.startHoofbeats(bpm)` | 364 | Start hoofbeat rhythm |

## Utilities (~392-476)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `randomInt(min, max)` | 394 | Random integer in [min, max] |
| `generateId()` | 398 | Unique ID from timestamp + random |
| `formatMoney(amount)` | 402 | Locale-formatted currency string |
| `generateHorseName()` | 406 | Random prefix + suffix name |
| `generateHorseAttributes(qualityTier)` | 412 | Stats within quality tier range |
| `calculateHorseValue(horse)` | 440 | Estimated value from stats + age |
| `generateHorse(qualityTier)` | 450 | Full horse object |

## Injury & Setbacks (~478-652)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `checkForInjury(horse, context)` | 487 | Roll for injury, apply if triggered |
| `applyStatLoss(horse, amount)` | 519 | Reduce a random stat |
| `processInjuryRecovery()` | 525 | Decrement recovery counters |
| `applyAgingEffects()` | 537 | Age horses, apply stat decline |
| `checkForSetbacks()` | 615 | Roll for random between-race setbacks |

## Screen Navigation (~654-663)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `showScreen(screenId)` | 658 | Switch active screen |

## Game Init (~665-734)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `initializeCompetitors()` | 672 | Create 5 AI trainers + standings |
| `initializeRaceCalendar()` | 709 | Generate 8 races with ground conditions |
| `startNewGame(stableName, budget, difficulty)` | 721 | Full game initialisation |

## Silk Colours (~736-773)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `renderSilkColourPicker()` | 740 | Render 12 colour swatches in setup |
| `silkSwatchHTML(primary, secondary, extraClass)` | 770 | HTML for inline silk swatch |

## UI Updates (~776-836)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `updateDashboard()` | 779 | Refresh all dashboard displays |
| `updateNextRaceDisplay()` | 789 | Populate next race panel |
| `updateStandingsDisplay()` | 819 | Render sorted standings |
| `updateContinueButton()` | 832 | Enable/disable continue button |

## Save/Load (~838-905)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `saveGame()` | 842 | Serialize to localStorage |
| `loadGame()` | 849 | Deserialize from localStorage (with migrations) |

## Auction (~907-1360)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `generateAuctionCatalogue()` | 920 | Generate 8 auction horses |
| `renderHorseCard(horse)` | 944 | HTML for auction horse card |
| `renderAuctionCatalogue()` | 1008 | Render full catalogue grid |
| `handleBidInput(e)` | 1022 | Handle bid value changes |
| `updateStartAuctionButton()` | 1048 | Update button state / bid count |
| `openAuction()` | 1062 | Open auction screen |
| `startLiveAuction()` | 1073 | Begin live bidding |
| `runAuctionLot()` | 1087 | Set up and display current lot |
| `simulateAuctionBidding(horse, playerMaxBid)` | 1186 | Run bidding simulation |
| `nextAuctionLot()` | 1301 | Advance to next lot |
| `showAuctionResults()` | 1311 | Display auction summary |
| `finishAuction()` | 1349 | Transfer horses, deduct budget |

## Stable (~1362-1650)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `openStable()` | 1368 | Show stable screen |
| `renderStableHorseCard(horse)` | 1386 | HTML for stable horse card |
| `renderStableHorses()` | 1456 | Render all horse cards |
| `capitalizeFirst(str)` | 1469 | Capitalize first letter |
| `openHorseDetail(horseId)` | 1473 | Show horse detail modal |
| `updateTrainingButtons(horse)` | 1538 | Update training button states |
| `setTrainingFocus(focus)` | 1547 | Set/toggle training focus |
| `closeHorseDetail()` | 1565 | Hide detail modal |
| `applyTrainingEffects()` | 1573 | Process all horse training |
| `restHorse(horseId)` | 1645 | Add +30 condition to horse |

## Racing (~1652-2713)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `openRaces()` | 1708 | Show race calendar |
| `renderRaceCalendar()` | 1726 | Render 8 race cards |
| `getOrdinal(n)` | 1780 | Ordinal string (1st, 2nd...) |
| `selectRace(raceIndex)` | 1786 | Select race, show horse selection |
| `renderHorseOptions()` | 1819 | Render horse entry cards with suitability |
| `toggleHorseForRace(horseId)` | 1916 | Toggle horse in/out of race |
| `updateEnterRaceButton()` | 1927 | Enable/disable enter button |
| `proceedToStrategy()` | 1934 | Transition to strategy selection |
| `renderStrategyEntries()` | 1942 | Render strategy cards per horse |
| `setHorseStrategy(horseId, strategy)` | 1982 | Assign strategy to horse |
| `updateStartRaceButton()` | 1987 | Enable start only when all strategies set |
| `startRace()` | 1997 | Initialize runners, sounds, start simulation |
| `horseSpriteSVG()` | 2092 | SVG horse+jockey sprite markup |
| `renderRaceTrack()` | 2125 | Initial track render (straight or oval) |
| `updateRaceTrack()` | 2182 | Update positions per frame |
| `runRaceSimulation()` | 2228 | Main 100-tick simulation loop |
| `calculateRunnerSpeed(runner, tick)` | 2323 | Core speed calculation |
| `updateCommentary(tick)` | 2405 | Dynamic race commentary |
| `showDecisionMoment(decisionIndex)` | 2450 | Pause for decision prompt |
| `makeDecision(optionIndex)` | 2477 | Resolve decision outcome |
| `finishRace()` | 2511 | Process results, prizes, injuries |
| `showRaceResults(...)` | 2637 | Display results screen |

## Between-Races (~2715-2826)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `showBetweenRaces(trainingData)` | 2719 | Render training/injury/setback reports |
| `quickSetTraining(selectEl)` | 2816 | Inline training focus change |
| `continueToDashboard()` | 2823 | Return to dashboard |

## Post-Race Flow (~2828-2841)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `finishRaceView()` | 2832 | Route to ceremony or between-races |

## Season Ceremony (~2843-2965)

| Function | ~Line | Purpose |
|----------|-------|---------|
| `spawnConfetti()` | 2847 | Create 60 falling confetti particles |
| `showSeasonCeremony()` | 2864 | Full end-of-season ceremony |
| `startNextSeason()` | 2951 | Reset for new season |

## Event Listeners (~2976-3125)

All button bindings are inside `DOMContentLoaded`. Key bindings include menu nav, auction flow, stable management, race flow, save/load, and mute toggle.

## Debug Exports (~3127)

```javascript
window.GameState = GameState;
window.generateHorse = generateHorse;
```
