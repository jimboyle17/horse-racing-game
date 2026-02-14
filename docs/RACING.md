# Race System

## Race Calendar (RACE_NAMES ~line 88)

Every season has the same 8 races in fixed order, each with a random ground condition:

| # | Name | Distance | Furlongs | Track | Laps | Prize |
|---|------|----------|----------|-------|------|-------|
| 1 | Dorington Stakes | 1 mile | 8 | Oval | 1 | 30,000 |
| 2 | Pemberton Sprint | 5 furlongs | 5 | Straight | - | 25,000 |
| 3 | Thornfield Handicap | 7 furlongs | 7 | Oval | 1 | 30,000 |
| 4 | Ashbury Cup | 1m 2f | 10 | Oval | 2 | 40,000 |
| 5 | Kingswood Classic | 1m 4f | 12 | Oval | 2 | 50,000 |
| 6 | Lightning Sprint | 6 furlongs | 6 | Straight | - | 35,000 |
| 7 | Whitehall Gold Cup | 1m 2f | 10 | Oval | 2 | 60,000 |
| 8 | Champion Stakes | 1 mile | 8 | Oval | 1 | 100,000 |

Total prize pool per season: 370,000.

## Distance Categories (getRaceDistanceCategory ~line 111)

| Category | Furlongs | Track Type | Laps |
|----------|----------|------------|------|
| Sprint | 5-6f | Straight | N/A |
| Mid | 7-8f | Oval | 1 |
| Stayer | 10-12f | Oval | 2 |

## Ground Conditions

`['Soft', 'Good to Soft', 'Good', 'Good to Firm', 'Firm']`

Randomly assigned per race at calendar generation. Only visible for the current race and completed races.

## Runners

Always 8 total per race. Player can enter up to 4 horses. Remaining slots filled with AI.

**AI quality distribution:** `['medium', 'high', 'high', 'high', 'elite', 'elite']` (cycled)

**AI strategy auto-selection:**
- `speed > stamina` AND `speed > acceleration` -> front-runner
- `acceleration > speed` -> closer
- Otherwise -> stalker

## Race Simulation (runRaceSimulation ~line 2228)

- **100 ticks**, 150ms each (~15 seconds excluding pauses)
- **Decision moments** at ticks 25, 50, 75 (race pauses)
- **Mid-race injury** check at tick 40 (4% per player horse)
- Race ends when `tick >= 100` OR all runners reach position >= 100

### Per-Tick Position Update

```javascript
baseSpeed = calculateRunnerSpeed(runner, tick);

// Player-only condition penalty
if (runner.isPlayer) {
    conditionMult = (0.5 + (horse.condition / 100) * 0.5); // 0.5x to 1.0x
    baseSpeed *= conditionMult;
}

// Random noise
baseSpeed += (Math.random() - 0.5) * 0.25;

runner.position += baseSpeed;
runner.position = Math.min(runner.position, 100);
```

## Speed Formula (calculateRunnerSpeed ~line 2323)

### Phase Definitions

| Phase | Tick Range |
|-------|-----------|
| Early | 0-29 |
| Mid | 30-69 |
| Late | 70-100 |

### Step 1: Distance-Weighted Stats

| Race Category | effectiveSpeed | effectiveStamina |
|---------------|---------------|-----------------|
| Sprint | `speed * 1.4` | `stamina * 0.7` |
| Mid | `speed * 1.0` | `stamina * 1.0` |
| Stayer | `speed * 0.7` | `stamina * 1.4` |

Both capped at 100.

### Step 2: Distance Preference Modifier

| Mismatch (index difference) | Modifier |
|-----------------------------|----------|
| 0 (perfect) | 1.00 |
| 1 (adjacent) | 0.95 |
| 2 (opposite) | 0.88 |

### Step 3: Ground Preference Modifier

| Mismatch | Modifier |
|----------|----------|
| 0 | 1.00 |
| 1 | 0.97 |
| 2 | 0.94 |
| 3 | 0.90 |
| 4 | 0.85 |
| 5+ | 0.78 |

### Step 4: Form & Variance

```
form = runner.formFactor    // Player: 0.75-1.20, AI: 0.85-1.25
consistencyFactor = 0.5 + (temperament / 100) * 0.5
variance = (1 - consistencyFactor) * (Math.random() - 0.5) * 0.4
```

### Step 5: Strategy-Based Speed

**Front Runner:**

| Phase | Formula | Range |
|-------|---------|-------|
| Early | `0.65 + (effectiveSpeed/100) * 0.35` | 0.65-1.00 |
| Mid | `0.50 + (effectiveSpeed/100) * 0.30` | 0.50-0.80 |
| Late | `0.35 + (effectiveStamina/100) * 0.35` | 0.35-0.70 |

**Stalker:**

| Phase | Formula | Range |
|-------|---------|-------|
| Early | `0.50 + (effectiveSpeed/100) * 0.30` | 0.50-0.80 |
| Mid | `0.55 + (midStat/100) * 0.30` | 0.55-0.85 |
| Late | `0.55 + (acceleration/100) * 0.35` | 0.55-0.90 |

Where `midStat = (effectiveSpeed + effectiveStamina) / 2`.

**Closer:**

| Phase | Formula | Range |
|-------|---------|-------|
| Early | `0.35 + (effectiveStamina/100) * 0.25` | 0.35-0.60 |
| Mid | `0.50 + (effectiveStamina/100) * 0.30` | 0.50-0.80 |
| Late | `0.70 + (acceleration/100) * 0.40` | 0.70-1.10 |

### Step 6: Final Calculation

```
finalSpeed = baseSpeed * form * distancePrefModifier * groundPrefModifier + variance
return max(finalSpeed, 0.2)
```

## Decision Moments (~line 1670)

4 possible decisions, randomly chosen at ticks 25, 50, 75:

| ID | Prompt | Option 1 | Attr | Risk | Option 2 | Attr | Risk |
|----|--------|----------|------|------|----------|------|------|
| gap_opens | "A gap opens on the rail!" | Push through | acceleration | 0.3 | Hold steady | temperament | 0.1 |
| leader_tires | "The leader is starting to tire..." | Make your move now | speed | 0.2 | Wait for the stretch | stamina | 0.1 |
| tight_pack | "The pack is bunching up ahead!" | Go wide | stamina | 0.2 | Stay in tight | temperament | 0.25 |
| final_push | "Final furlong - your horse has energy left!" | All out sprint | speed | 0.3 | Controlled finish | acceleration | 0.1 |

**5-second timer** (auto-selects option 0 on expiry).

**Resolution** (applied to best-placed player horse):
```
successChance = (attributeValue / 100) * (1 - risk)
Success: position += randomInt(3, 8)
Failure: position -= randomInt(2, 5)
```

## Prize Money & Points

| Place | Prize | Points |
|-------|-------|--------|
| 1st | 100% | 25 |
| 2nd | 40% | 18 |
| 3rd | 20% | 12 |
| 4th | 10% | 8 |
| 5th | 5% | 5 |
| 6th-8th | 0% | 2 |

Player earns points from ALL entered horses (summed).

**AI points:** Top 4 non-player finishers get [18, 12, 8, 5] points; others get 2.

## Post-Race

- Horse condition: `condition -= randomInt(20, 35)` (floor 10)
- Injury recovery: `recoveryRacesLeft--` (injury clears at 0)
- Photo finish: triggered if top 3 within 3 position units

## Race Stage Text

**2-lap races:**
| Tick Range | Text |
|-----------|------|
| 0-11 | First circuit (Lap 1/2) |
| 12-24 | Back straight (Lap 1/2) |
| 25-37 | Turning for home (Lap 1/2) |
| 38-49 | Passing the post (Lap 1/2) |
| 50-61 | Final circuit (Lap 2/2) |
| 62-74 | Back straight (Lap 2/2) |
| 75-87 | Turning for home (Lap 2/2) |
| 88+ | Final stretch! |

**1-lap / straight races:**
| Tick Range | Text |
|-----------|------|
| 0-24 | Early pace |
| 25-49 | Midway |
| 50-74 | Turning for home |
| 75+ | Final stretch! |
