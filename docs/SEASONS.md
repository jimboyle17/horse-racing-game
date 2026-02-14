# Season & Progression System

## Season Structure

Each season consists of 8 races in fixed order. Between races, training effects are applied and the between-races interstitial is shown.

## Championship Standings

6 entries: 1 player + 5 AI trainers. Sorted by season points (descending). Most points at season end = Champion.

### Competitor Initialization (initializeCompetitors ~line 672)

5 AI trainers created from `AI_TRAINER_NAMES` array. Each gets a unique name and silk colour scheme.

**AI Trainer Names:** J. O'Brien, W. Haggas, A. Balding, C. Appleby, R. Varian, M. Johnston, S. bin Suroor, J. Gosden

## Points Per Race

| Place | Player Points | AI Points |
|-------|--------------|-----------|
| 1st | 25 | 18 (top non-player) |
| 2nd | 18 | 12 |
| 3rd | 12 | 8 |
| 4th | 8 | 5 |
| 5th | 5 | 2 |
| 6th-8th | 2 | 2 |

Player earns points from ALL entered horses (summed). AI points only go to their single entry.

## Season End Ceremony (showSeasonCeremony ~line 2864)

1. Aging effects applied (all horses +1 year, stat decline chance for age >= 5)
2. All injuries cleared, condition reset to 100
3. One final training round applied
4. Champion determined (highest points)
5. Trophy + confetti + fanfare if player is champion
6. Standings table, season stats (wins, earnings, points, best horse), aging report

## Starting Next Season (startNextSeason ~line 2951)

- Season number increments
- New race calendar with fresh ground conditions
- All standings points reset to 0
- Per-season horse stats reset (racesRun, wins, totalEarnings)
- Player keeps all horses and budget
- Cycle continues indefinitely

## Difficulty Levels

Only affects starting budget:

| Level | Budget | Label |
|-------|--------|-------|
| Easy | 750,000 | Newcomer |
| Medium | 500,000 | Standard |
| Hard | 300,000 | Challenge |

No difficulty-based speed modifier is applied during races.

## Silk Colours (12 options)

| Name | Primary | Secondary |
|------|---------|-----------|
| Royal Green | #1a5f3c | #c9a227 |
| Classic Blue | #1a3a6c | #ffffff |
| Scarlet Red | #b22222 | #ffd700 |
| Purple & Gold | #5b2c8e | #e6c04a |
| Orange Blaze | #d4600a | #1a1a1a |
| Sky Blue | #4a90d9 | #e8e8e8 |
| Racing Pink | #c74375 | #f0e0e8 |
| Dark Navy | #0c1e3c | #cc0000 |
| Emerald | #2e8b57 | #ffffff |
| Burgundy | #6b1d3a | #d4af37 |
| Teal & Cream | #008080 | #ffefd5 |
| Charcoal | #333333 | #ff6600 |
