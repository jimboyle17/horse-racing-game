# Global State Objects

## GameState (game.js ~line 10)

The main persistent state, saved/loaded via localStorage.

```javascript
{
    stableName: '',           // Player's stable name
    budget: 500000,           // Current budget in pounds
    season: 1,                // Current season number
    seasonPoints: 0,          // Points accumulated this season
    horses: [],               // Array of owned horse objects
    races: [],                // Current season race calendar
    currentRaceIndex: 0,      // Index of next race to run
    competitors: [],          // 5 AI trainer objects
    standings: [],            // Season standings (player + 5 AI)
    difficulty: 'medium',     // 'easy' | 'medium' | 'hard' (affects starting budget only)
    silkPrimary: '#1a5f3c',   // Player silk colour 1
    silkSecondary: '#c9a227', // Player silk colour 2
    lastSaved: null           // ISO timestamp of last save
}
```

## AuctionState (game.js ~line 911)

Transient state for the auction screen.

```javascript
{
    catalogue: [],        // Array of horses for sale (8 per auction)
    playerBids: {},       // Map: horseId -> max bid amount
    currentLotIndex: 0,   // Index of lot currently being auctioned
    results: [],          // Array of lot outcomes
    horsesWon: [],        // Horses won by the player
    totalSpent: 0         // Running total of money spent
}
```

## RaceState (game.js ~line 1656)

Transient state for the race screen.

```javascript
{
    selectedRace: null,         // Currently selected race object
    selectedHorseIds: new Set(),// Horse IDs entered in the race (max 4)
    horseStrategies: {},        // Map: horseId -> 'front-runner'|'stalker'|'closer'
    racePositions: [],          // Array of runner objects during simulation
    currentDecision: null,      // Current decision prompt object
    decisionTimer: null,        // Timer interval for decision countdown
    raceInterval: null,         // Main race simulation setInterval handle
    raceProgress: 0,            // Current tick (0-100)
    isRacing: false,            // Whether race is actively running
    crowdStop: null,            // Stop function for crowd sound loop
    hoofStop: null,             // Stop function for hoofbeat sound loop
    playerInjuredDuringRace: {} // Map: horseId -> boolean (mid-race injury)
}
```

## Runner Object (created in startRace)

Each entry in `RaceState.racePositions`:

```javascript
{
    id: string,
    name: string,
    trainer: string,
    isPlayer: boolean,
    stats: { speed, stamina, acceleration, temperament },
    strategy: 'front-runner' | 'stalker' | 'closer',
    position: 0-100,        // Current race progress (0=start, 100=finish)
    energy: 100,
    score: 0,
    formFactor: number,     // Player: 0.75-1.20, AI: 0.85-1.25
    silkPrimary: string,
    silkSecondary: string,
    distancePreference: 'sprint' | 'mid' | 'stayer',
    groundPreference: string
}
```
