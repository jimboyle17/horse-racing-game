# Horse System

## Horse Object Properties

```javascript
{
    id: string,                    // Unique ID (timestamp + random base36)
    name: string,                  // Random prefix + suffix
    age: 2-6,                      // Integer, incremented each season
    speed: number,                 // 20-95 (quality-dependent starting range)
    stamina: number,               // 20-95
    acceleration: number,          // 20-95
    temperament: number,           // 20-95
    condition: 0-100,              // Fitness level, affects race speed
    trainingFocus: null | string,  // null | 'speed' | 'stamina' | 'acceleration' | 'temperament'
    racesRun: number,              // Per-season count (reset each season)
    wins: number,                  // Per-season count
    totalEarnings: number,         // Per-season total (reset each season)
    isInjured: boolean,
    injuryType: null | string,
    recoveryRacesLeft: number,
    silkPrimary: string,           // Hex colour (overridden to player silks on purchase)
    silkSecondary: string,
    distancePreference: 'sprint' | 'mid' | 'stayer',
    groundPreference: 'Soft' | 'Good to Soft' | 'Good' | 'Good to Firm' | 'Firm',
    estimatedValue: number         // Guide price for auction
}
```

## Quality Tiers (generateHorseAttributes ~line 412)

Each stat is independently rolled within the tier range:

| Tier | Min | Max | Used In |
|------|-----|-----|---------|
| `low` | 30 | 55 | Auction (2 per catalogue) |
| `medium` | 45 | 70 | Auction (3), AI runners |
| `high` | 60 | 85 | Auction (2), AI runners |
| `elite` | 75 | 95 | Auction (1), AI runners |

## Horse Names (~line 56)

**Prefixes (18):** Midnight, Golden, Silver, Thunder, Storm, Royal, Noble, Swift, Brave, Wild, Dancing, Flying, Lucky, Proud, Gallant, Bold, Bright, Shadow

**Suffixes (18):** Star, Dream, Spirit, Arrow, Wind, Flash, Legend, Glory, Hope, Fire, Knight, Prince, Dancer, Runner, Champion, Warrior, Thunder, Storm

## Valuation Formula (calculateHorseValue ~line 440)

```
avgAttr = (speed + stamina + acceleration + temperament) / 4
ageMultiplier = age <= 3 ? 1.2 : age <= 5 ? 1.0 : 0.8
estimatedValue = round((avgAttr * 2000 * ageMultiplier) / 1000) * 1000
```

## Condition System

| Event | Change |
|-------|--------|
| After a race | -20 to -35 (floor 10) |
| Training (between races, not injured) | +10 to +20 (cap 100) |
| Resting (between races, injured) | +5 to +10 (cap 100) |
| Rest action (restHorse) | +30 (cap 100) |
| Season end | Reset to 100 |

## Training (applyTrainingEffects ~line 1573)

Applied between races. Only the stat matching `trainingFocus` improves.

**Diminishing returns:**

| Current stat | Improvement |
|-------------|-------------|
| >= 90 | 30% chance of +1, else 0 |
| >= 80 | 60% chance of +1, else 0 |
| < 80 | 20% chance of +2, else +1 |

**Hard cap:** 95 (no stat can exceed this).

Training carries a 4% base injury risk (higher for old/tired horses).

## Aging (applyAgingEffects ~line 537)

Applied at season end. All horses age +1 year.

For horses age >= 5:
```
declineChance = (age - 4) * 0.15
```
- Age 5: 15%, Age 6: 30%, Age 7: 45%, Age 8: 60%

If triggered: 1-2 random stats each lose 1-4 points (floor 20).

## Injury System (~line 478)

### Injury Types

| Injury | Recovery (races) | Stat Loss Chance | Stat Loss |
|--------|-----------------|------------------|-----------|
| Muscle strain | 1-2 | 20% | 1-3 |
| Tendon injury | 2-4 | 40% | 2-5 |
| Joint inflammation | 1-3 | 30% | 1-4 |
| Ligament damage | 3-5 | 50% | 3-6 |
| Minor knock | 1-1 | 10% | 0-2 |

### Injury Probability (checkForInjury ~line 487)

```
Base: training = 4%, racing = 6%
+3% if age >= 6
+5% if age >= 7
+5% if condition < 50
+5% if condition < 30
```

### Mid-Race Injury (~line 2278)

At tick 40: 4% chance per player horse. If triggered:
- `formFactor *= 0.6` (immediate 40% speed loss)
- Full injury applied post-race

### Setbacks (between races, ~line 558)

10 random setback types, each checked independently per horse:

| Setback | Chance | Target Stat | Loss |
|---------|--------|-------------|------|
| Mild illness | 8% | random | 1-2 |
| Viral infection | 4% | 2 random | 1-3 |
| Overtraining | 6% | random | 1-2 |
| Underperforming | 6% | random | 1-2 |
| Loss of appetite | 5% | random | 1-2 |
| Travel stress | 4% | random | 1-2 |
| Teeth issues | 3% | random | 1-2 |
| Behavioural issues | 4% | temperament | 1-3 |
| Weight gain | 4% | speed | 1-2 |
| Muscle soreness | 5% | acceleration | 1-2 |

All stat reductions have a floor of 20.
