/**
 * Champion Trainer - Horse Racing Game
 * Main Game Logic
 */

// ============================================
// GAME STATE
// ============================================

const GameState = {
    // Player data
    stableName: '',
    budget: 500000,
    season: 1,
    seasonPoints: 0,

    // Horses owned by player
    horses: [],

    // Current race calendar
    races: [],
    currentRaceIndex: 0,

    // AI Competitors
    competitors: [],

    // Season standings
    standings: [],

    // Game settings
    difficulty: 'medium',
    settings: {
        raceDifficulty: 'medium',   // 'easy' | 'medium' | 'hard'
        careNeeds: 'medium',        // 'low' | 'medium' | 'high'
        staffAutomation: false      // true = staff auto-assign tasks
    },

    // Stable colours (Phase 2)
    silkPrimary: '#1a5f3c',
    silkSecondary: '#c9a227',

    // Save timestamp
    lastSaved: null,

    // Yard economy
    maxStalls: 10,
    feedSupply: 20,
    tack: { saddles: 2, bridles: 2, rugs: 4 },
    barnExpansions: 0,

    // Forage & bedding stock
    forage: { hay: 10, straw: 5, shavings: 5, carrots: 0 },

    // Barn upgrades (passive bonuses)
    barnUpgrades: { rubberMatting: false, autoWaterers: false, climateControl: false },

    // Lorry ownership
    ownsLorry: false,

    // Car ownership
    ownsCar: false,

    // Reputation (0-100): what the sport thinks of you as a trainer
    reputation: 0,

    // Bloodstock & breeding
    broodmares: [],     // Retired mares: { id, name, stats, inFoal, dueSeason, coveredBy }
    foals: [],          // Unraced produce: { id, sire, dam, stats (hidden), bornSeason, conformation }
    stallions: [],      // Stud roster for the current season, regenerated each year
    broodmareSale: [],  // Mares in the sales ring this season, with askingPrice

    // Staff system
    staff: [],          // Array of { id, name, skill: 1-5, wage, busy, busyTask, busyHorseIdx }
    staffWagePerSeason: 20000,  // legacy flat rate - retained for old saves
    staffCandidates: [],        // Array of { id, name, skill } available at the Racing School

    // XP / Levels
    xp: 0,
    level: 1,
    unlockedRewards: [],

    // Training centre
    trainingCentre: 'newmarket',

    // Betting
    activeBets: [],
    bettingHistory: []
};

// ============================================
// CONSTANTS
// ============================================

const AI_TRAINER_NAMES = [
    'Oakwood Racing',
    'Silverstone Stables',
    'Wellington Farms',
    'Thornbury Racing',
    'Kingsley Stables',
    'Meadowbrook Racing',
    'Ashford Stables',
    'Cromwell Racing'
];

const HORSE_NAME_PREFIXES = [
    'Midnight', 'Golden', 'Silver', 'Thunder', 'Storm', 'Royal',
    'Noble', 'Swift', 'Brave', 'Wild', 'Dancing', 'Flying',
    'Lucky', 'Proud', 'Gallant', 'Bold', 'Bright', 'Shadow'
];

const HORSE_NAME_SUFFIXES = [
    'Star', 'Dream', 'Spirit', 'Arrow', 'Wind', 'Flash',
    'Legend', 'Glory', 'Hope', 'Fire', 'Knight', 'Prince',
    'Dancer', 'Runner', 'Champion', 'Warrior', 'Thunder', 'Storm'
];

// Yearling Sale: Sire and Dam name arrays
const SIRE_NAME_PREFIXES = [
    'Galileo', 'Frankel', 'Dubawi', 'Danehill', 'Sadler',
    'Montjeu', 'Camelot', 'Pivotal', 'Oasis', 'Kingman'
];

const SIRE_NAME_SUFFIXES = [
    'Wells', 'Dream', 'Gold', 'Rock', 'King',
    'Storm', 'Star', 'Peak', 'Bay', 'Ridge'
];

const DAM_NAME_PREFIXES = [
    'Lady', 'Starlit', 'Moonbeam', 'Crystal', 'Velvet',
    'Autumn', 'Mystic', 'Highland', 'Emerald', 'Regal'
];

const DAM_NAME_SUFFIXES = [
    'Rose', 'Grace', 'Song', 'Belle', 'Charm',
    'Jewel', 'Dawn', 'Whisper', 'Lace', 'Spirit'
];

// Phase 2: Silk colours
const SILK_COLOURS = [
    { name: 'Royal Green',      primary: '#1a5f3c', secondary: '#c9a227' },
    { name: 'Classic Blue',     primary: '#1a3a6c', secondary: '#ffffff' },
    { name: 'Scarlet Red',      primary: '#b22222', secondary: '#ffd700' },
    { name: 'Purple & Gold',    primary: '#5b2c8e', secondary: '#e6c04a' },
    { name: 'Orange Blaze',     primary: '#d4600a', secondary: '#1a1a1a' },
    { name: 'Sky Blue',         primary: '#4a90d9', secondary: '#e8e8e8' },
    { name: 'Racing Pink',      primary: '#c74375', secondary: '#f0e0e8' },
    { name: 'Dark Navy',        primary: '#0c1e3c', secondary: '#cc0000' },
    { name: 'Emerald',          primary: '#2e8b57', secondary: '#ffffff' },
    { name: 'Burgundy',         primary: '#6b1d3a', secondary: '#d4af37' },
    { name: 'Teal & Cream',     primary: '#008080', secondary: '#ffefd5' },
    { name: 'Charcoal',         primary: '#333333', secondary: '#ff6600' }
];

// Distance categories:
// Sprint: 5f-6f (speed focused)
// Mid: 7f-1m (balanced)
// Stayer: 1m2f+ (stamina focused)
const RACE_NAMES = [
    { name: 'Dorington Stakes', distance: '1 mile', distanceFurlongs: 8, prize: 30000, type: 'conditions' },
    { name: 'Pemberton Sprint', distance: '5 furlongs', distanceFurlongs: 5, prize: 25000, type: 'handicap' },
    { name: 'Thornfield Handicap', distance: '7 furlongs', distanceFurlongs: 7, prize: 30000, type: 'handicap' },
    { name: 'Ashbury Cup', distance: '1m 2f', distanceFurlongs: 10, prize: 40000, type: 'handicap' },
    { name: 'Kingswood Classic', distance: '1m 4f', distanceFurlongs: 12, prize: 50000, type: 'group' },
    { name: 'Lightning Sprint', distance: '6 furlongs', distanceFurlongs: 6, prize: 35000, type: 'handicap' },
    { name: 'Whitehall Gold Cup', distance: '1m 2f', distanceFurlongs: 10, prize: 60000, type: 'group' },
    { name: 'Champion Stakes', distance: '1 mile', distanceFurlongs: 8, prize: 100000, type: 'group' }
];

// ============================================
// XP / LEVELS SYSTEM
// ============================================

const XP_LEVELS = [
    { level: 1,  xpRequired: 0,     reward: null },
    { level: 2,  xpRequired: 200,   reward: { id: 'reward_2', type: 'tbd', description: 'TBD' } },
    { level: 3,  xpRequired: 500,   reward: { id: 'reward_3', type: 'tbd', description: 'TBD' } },
    { level: 4,  xpRequired: 1000,  reward: { id: 'reward_4', type: 'tbd', description: 'TBD' } },
    { level: 5,  xpRequired: 1800,  reward: { id: 'reward_5', type: 'tbd', description: 'TBD' } },
    { level: 6,  xpRequired: 2800,  reward: { id: 'reward_6', type: 'tbd', description: 'TBD' } },
    { level: 7,  xpRequired: 4000,  reward: { id: 'reward_7', type: 'tbd', description: 'TBD' } },
    { level: 8,  xpRequired: 5500,  reward: { id: 'reward_8', type: 'tbd', description: 'TBD' } },
    { level: 9,  xpRequired: 7500,  reward: { id: 'reward_9', type: 'tbd', description: 'TBD' } },
    { level: 10, xpRequired: 10000, reward: { id: 'reward_10', type: 'tbd', description: 'TBD' } },
    { level: 11, xpRequired: 13000, reward: { id: 'reward_11', type: 'tbd', description: 'TBD' } },
    { level: 12, xpRequired: 16500, reward: { id: 'reward_12', type: 'tbd', description: 'TBD' } },
    { level: 13, xpRequired: 20500, reward: { id: 'reward_13', type: 'tbd', description: 'TBD' } },
    { level: 14, xpRequired: 25000, reward: { id: 'reward_14', type: 'tbd', description: 'TBD' } },
    { level: 15, xpRequired: 30000, reward: { id: 'reward_15', type: 'tbd', description: 'TBD' } },
    { level: 16, xpRequired: 36000, reward: { id: 'reward_16', type: 'tbd', description: 'TBD' } },
    { level: 17, xpRequired: 43000, reward: { id: 'reward_17', type: 'tbd', description: 'TBD' } },
    { level: 18, xpRequired: 51000, reward: { id: 'reward_18', type: 'tbd', description: 'TBD' } },
    { level: 19, xpRequired: 60000, reward: { id: 'reward_19', type: 'tbd', description: 'TBD' } },
    { level: 20, xpRequired: 70000, reward: { id: 'reward_20', type: 'tbd', description: 'TBD' } },
];

const XP_AWARDS = {
    raceWin:        100,
    racePlace2:     50,
    racePlace3:     30,
    raceFinish:     10,
    seasonComplete: 200,
    trainingStat:   5,
    careQuality:    2,
    firstHorse:     50,
    firstWin:       150,
};

function awardXP(amount, source) {
    if (amount <= 0) return;
    GameState.xp += amount;
    const oldLevel = GameState.level;

    // Recalculate level
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (GameState.xp >= XP_LEVELS[i].xpRequired) {
            GameState.level = XP_LEVELS[i].level;
            break;
        }
    }

    if (GameState.level > oldLevel) {
        processNewRewards(oldLevel + 1, GameState.level);
        showLevelUpNotification(oldLevel, GameState.level);
    }

    updateXPDisplay();
}

function processNewRewards(fromLevel, toLevel) {
    for (let l = fromLevel; l <= toLevel; l++) {
        const levelDef = XP_LEVELS.find(x => x.level === l);
        if (levelDef?.reward && !GameState.unlockedRewards.includes(levelDef.reward.id)) {
            GameState.unlockedRewards.push(levelDef.reward.id);
            applyReward(levelDef.reward);
        }
    }
}

function applyReward(reward) {
    switch (reward.type) {
        case 'building':  /* unlock building visibility */ break;
        case 'vehicle':   /* unlock lorry upgrade etc */ break;
        case 'object':    /* unlock yard decoration */ break;
        case 'tbd':       /* placeholder - rewards to be defined later */ break;
    }
}

async function showLevelUpNotification(oldLevel, newLevel) {
    const levelDef = XP_LEVELS.find(x => x.level === newLevel);
    const rewardText = levelDef?.reward && levelDef.reward.type !== 'tbd'
        ? `\nReward: ${levelDef.reward.description}`
        : '';
    await gameAlert('Level Up!', `Congratulations! You've reached Level ${newLevel}!${rewardText}`);
}

function updateXPDisplay() {
    const xpBar = document.getElementById('xp-progress-bar');
    const xpText = document.getElementById('xp-level-text');
    const xpAmount = document.getElementById('xp-amount-text');

    if (!xpBar) return;

    const currentLevelDef = XP_LEVELS.find(x => x.level === GameState.level);
    const nextLevelDef = XP_LEVELS.find(x => x.level === GameState.level + 1);

    if (nextLevelDef) {
        const currentMin = currentLevelDef.xpRequired;
        const nextMin = nextLevelDef.xpRequired;
        const progress = ((GameState.xp - currentMin) / (nextMin - currentMin)) * 100;
        xpBar.style.width = `${Math.min(100, progress)}%`;
        if (xpAmount) xpAmount.textContent = `${GameState.xp - currentMin}/${nextMin - currentMin} XP`;
    } else {
        xpBar.style.width = '100%';
        if (xpAmount) xpAmount.textContent = 'MAX LEVEL';
    }

    if (xpText) xpText.textContent = `Lv.${GameState.level}`;
}

// ============================================
// YARD PETS SYSTEM
// ============================================

const PET_TYPES = {
    cat:    { label: 'Cat',    cost: 2000, counters: ['rats', 'pigeons'], moraleBonus: 0.05, emoji: '\u{1F431}' },
    dog:    { label: 'Dog',    cost: 3000, counters: ['foxes'],           moraleBonus: 0.05, emoji: '\u{1F436}' },
    rabbit: { label: 'Rabbit', cost: 1000, counters: [],                  moraleBonus: 0.05, emoji: '\u{1F430}' },
};

const PET_NAMES = {
    cat: ['Whiskers', 'Mittens', 'Shadow', 'Ginger', 'Smokey', 'Luna', 'Felix', 'Cleo'],
    dog: ['Rex', 'Buddy', 'Max', 'Bella', 'Charlie', 'Daisy', 'Duke', 'Molly'],
    rabbit: ['Thumper', 'Cotton', 'Flopsy', 'Hazel', 'Clover', 'Biscuit', 'Pippin', 'Cocoa'],
};

function buyPet(type) {
    if (!GameState.pets) GameState.pets = [];
    const petInfo = PET_TYPES[type];
    if (!petInfo) return;

    if (GameState.pets.length >= 3) {
        gameAlert('Pet Limit', 'You already have 3 pets. No extra benefit from more.');
        return;
    }

    if (GameState.budget < petInfo.cost) {
        gameAlert('Insufficient Funds', `You need £${formatMoney(petInfo.cost)} to buy a ${petInfo.label.toLowerCase()}.`);
        return;
    }

    GameState.budget -= petInfo.cost;
    const names = PET_NAMES[type];
    const usedNames = GameState.pets.map(p => p.name);
    const available = names.filter(n => !usedNames.includes(n));
    const name = available.length > 0 ? available[randomInt(0, available.length - 1)] : `${petInfo.label} ${GameState.pets.length + 1}`;

    const centre = getActiveCentre();
    const startR = centre.playerStart.r + randomInt(-2, 2);
    const startC = centre.playerStart.c + randomInt(-3, 3);

    GameState.pets.push({
        id: generateId(),
        type,
        name,
        r: startR,
        c: startC,
        state: 'idle'
    });

    updateYardHUD();
    handleSupplierInteract(); // Refresh panel
}

function checkPestSpawns() {
    if (!GameState.pestState) GameState.pestState = { rats: [], pigeons: [], foxes: [] };

    const hasCat = (GameState.pets || []).some(p => p.type === 'cat');
    const hasDog = (GameState.pets || []).some(p => p.type === 'dog');

    // Clear pests if countermeasure pet exists
    if (hasCat) {
        GameState.pestState.rats = [];
        GameState.pestState.pigeons = [];
    }
    if (hasDog) {
        GameState.pestState.foxes = [];
    }

    // Spawn new pests if no countermeasure
    if (!hasCat && Math.random() < 0.3 && GameState.pestState.rats.length < 3) {
        GameState.pestState.rats.push({ id: generateId(), r: randomInt(5, 25), c: randomInt(3, 35) });
    }
    if (!hasCat && Math.random() < 0.4 && GameState.pestState.pigeons.length < 4) {
        GameState.pestState.pigeons.push({ id: generateId(), r: randomInt(2, 15), c: randomInt(5, 35) });
    }
    if (!hasDog && Math.random() < 0.2 && GameState.pestState.foxes.length < 2) {
        const centre = getActiveCentre();
        const paddock = centre.paddock || { r1: 20, c1: 3, r2: 23, c2: 10 };
        GameState.pestState.foxes.push({
            id: generateId(),
            r: randomInt(paddock.r1, paddock.r2),
            c: randomInt(paddock.c1, paddock.c2)
        });
    }
}

function applyPestEffects() {
    if (!GameState.pestState) return;

    // Rats eat forage
    if (GameState.pestState.rats.length > 0 && GameState.forage) {
        const eaten = GameState.pestState.rats.length;
        GameState.forage.hay = Math.max(0, GameState.forage.hay - eaten);
    }

    // Foxes can injure paddocked horses
    if (GameState.pestState.foxes.length > 0) {
        const paddockHorses = GameState.horses.filter(h => h.paddockTurnedOut);
        GameState.pestState.foxes.forEach(() => {
            paddockHorses.forEach(h => {
                if (!h.isInjured && Math.random() < 0.10) {
                    h.condition = Math.max(h.condition - 10, 20);
                }
            });
        });
    }
}

function checkCatDogConflict() {
    if (!GameState.pets) return;
    const hasCat = GameState.pets.some(p => p.type === 'cat');
    const hasDog = GameState.pets.some(p => p.type === 'dog');

    if (hasCat && hasDog && Math.random() < 0.15) {
        // One staff member becomes temporarily busy
        const freeStaff = (GameState.staff || []).find(s => !s.busy);
        if (freeStaff) {
            freeStaff.busy = true;
            freeStaff.busyTask = 'pet-conflict';
            freeStaff.busyHorseIdx = null;
            setTimeout(() => {
                freeStaff.busy = false;
                freeStaff.busyTask = null;
            }, 10000);
        }
        gameAlert('Pet Conflict!', 'Your cat and dog got into a scuffle! A staff member had to break them up.');
    }
}

function getStaffMoraleModifier() {
    let morale = 1.0;
    const petCount = Math.min(3, (GameState.pets || []).length);
    morale += petCount * 0.05; // +5% per pet, max +15%
    return morale;
}

function getPetMoraleBonus() {
    return Math.min(3, (GameState.pets || []).length) * 3;
}

function renderPetsInYard(world) {
    if (!GameState.pets) return;
    GameState.pets.forEach(pet => {
        const petInfo = PET_TYPES[pet.type];
        const el = document.createElement('div');
        el.className = 'yard-decoration yard-pet';
        el.dataset.petId = pet.id;
        el.style.left = (pet.c * TILE_SIZE + 4) + 'px';
        el.style.top = (pet.r * TILE_SIZE + 2) + 'px';
        el.style.zIndex = 10;
        el.style.fontSize = '20px';
        el.style.transition = 'left 1s ease, top 1s ease';
        el.textContent = petInfo.emoji;
        el.title = `${pet.name} (${petInfo.label})`;
        world.appendChild(el);
    });
}

function renderPestsInYard(world) {
    if (!GameState.pestState) return;

    // Rats
    GameState.pestState.rats.forEach(pest => {
        const el = document.createElement('div');
        el.className = 'yard-decoration yard-pest';
        el.style.left = (pest.c * TILE_SIZE + 8) + 'px';
        el.style.top = (pest.r * TILE_SIZE + 6) + 'px';
        el.style.zIndex = 9;
        el.style.fontSize = '14px';
        el.title = 'Rat! Get a cat to deal with these.';
        el.textContent = '\u{1F400}';
        world.appendChild(el);
    });

    // Pigeons
    GameState.pestState.pigeons.forEach(pest => {
        const el = document.createElement('div');
        el.className = 'yard-decoration yard-pest';
        el.style.left = (pest.c * TILE_SIZE + 4) + 'px';
        el.style.top = (pest.r * TILE_SIZE) + 'px';
        el.style.zIndex = 9;
        el.style.fontSize = '14px';
        el.title = 'Pigeon! Get a cat to deal with these.';
        el.textContent = '\u{1F426}';
        world.appendChild(el);
    });

    // Foxes
    GameState.pestState.foxes.forEach(pest => {
        const el = document.createElement('div');
        el.className = 'yard-decoration yard-pest';
        el.style.left = (pest.c * TILE_SIZE + 2) + 'px';
        el.style.top = (pest.r * TILE_SIZE + 2) + 'px';
        el.style.zIndex = 9;
        el.style.fontSize = '18px';
        el.title = 'Fox! Get a dog to protect your horses.';
        el.textContent = '\u{1F98A}';
        world.appendChild(el);
    });
}

// Animate pets wandering on yard
function startPetAnimation() {
    if (YardState._petAnimInterval) clearInterval(YardState._petAnimInterval);
    YardState._petAnimInterval = setInterval(() => {
        if (!YardState.active || YardState.currentZone !== 'outdoor') {
            clearInterval(YardState._petAnimInterval);
            return;
        }
        (GameState.pets || []).forEach(pet => {
            // Random movement
            const dr = randomInt(-1, 1);
            const dc = randomInt(-1, 1);
            const newR = Math.max(2, Math.min(OUTDOOR_ROWS - 3, pet.r + dr));
            const newC = Math.max(2, Math.min(OUTDOOR_COLS - 3, pet.c + dc));

            // Check walkable
            const map = YardState.outdoorMap;
            if (map && map[newR] && TILE_WALK[map[newR][newC]]) {
                pet.r = newR;
                pet.c = newC;
                const el = document.querySelector(`[data-pet-id="${pet.id}"]`);
                if (el) {
                    el.style.left = (pet.c * TILE_SIZE + 4) + 'px';
                    el.style.top = (pet.r * TILE_SIZE + 2) + 'px';
                }
            }
        });
    }, 3000);
}

// ============================================
// OWNERS SYSTEM
// ============================================

const OWNER_NAMES = [
    'Sheikh Al-Rashid', 'Lady Whitworth', 'Sir Harold Dupont', 'Mrs. Patricia Chen',
    'Lord Devereux', 'Mr. James Hartley', 'Princess Zara', 'Dr. Emily Woodford',
    'Count Von Stetten', 'Mrs. Beatrice Lang', 'Mr. Aiden O\'Brien', 'Lady Somerville',
    'Sheikh Mohammed', 'Mr. Yuki Tanaka', 'Mrs. Catherine Holt', 'Baron De Rothberg'
];

function generateOwner() {
    const usedNames = (GameState.owners || []).map(o => o.name);
    const available = OWNER_NAMES.filter(n => !usedNames.includes(n));
    const name = available.length > 0 ? available[randomInt(0, available.length - 1)] : `Owner ${randomInt(100, 999)}`;

    // Better reputation attracts wealthier owners, who send better stock
    const reputation = getReputation();
    const wealthRoll = Math.random() + (reputation / 100) * 0.55;
    const wealth = wealthRoll > 0.92 ? 'high' : wealthRoll > 0.45 ? 'medium' : 'low';
    const maxHorses = wealth === 'high' ? randomInt(2, 3) : wealth === 'medium' ? randomInt(1, 2) : 1;
    const feePerHorse = wealth === 'high' ? randomInt(6000, 10000) : wealth === 'medium' ? randomInt(4000, 6000) : randomInt(2000, 4000);

    return {
        id: generateId(),
        name,
        wealth,
        patience: 80,
        satisfaction: 70,
        lowSatisfactionStreak: 0,
        horses: [],
        maxHorses,
        weeklyFeePerHorse: feePerHorse,
        joinedSeason: GameState.season,
        active: true
    };
}

function generateOwnerHorse(owner) {
    const horse = generateHorse(owner.wealth === 'high' ? 'high' : 'medium');
    horse.ownerId = owner.id;
    horse.ownerName = owner.name;
    return horse;
}

function calculateYardQuality() {
    let score = 0;

    // Barn upgrades
    if (GameState.barnUpgrades?.rubberMatting) score += 10;
    if (GameState.barnUpgrades?.autoWaterers) score += 10;
    if (GameState.barnUpgrades?.climateControl) score += 10;

    // Staff ratio
    if (!isStaffShortage()) score += 15;

    // Horse care quality
    const horses = GameState.horses;
    if (horses.length > 0) {
        const avgCare = horses.reduce((sum, h) => {
            const c = h.stallCare || {};
            return sum + ((c.feedLevel || 0) + (c.waterLevel || 0) + (c.hayLevel || 0) + (c.beddingQuality || 0)) / 4;
        }, 0) / horses.length;
        score += avgCare * 0.3;
    }

    // Forage stocks
    if (GameState.forage) {
        const totalForage = Object.values(GameState.forage).reduce((a, b) => a + b, 0);
        score += Math.min(15, totalForage / 3);
    }

    // Pet morale bonus
    score += getPetMoraleBonus();

    return Math.min(100, Math.round(score));
}

// ============================================
// REPUTATION
// ============================================

/**
 * Reputation is what the racing world thinks of you as a trainer. It is
 * earned by placing horses where they can win, not by taking shots in
 * races they have no business being in.
 */
const REPUTATION_TYPE_WEIGHT = { group: 2.6, conditions: 1.4, handicap: 1.0 };

function getReputation() {
    return Math.max(0, Math.min(100, GameState.reputation || 0));
}

function adjustReputation(delta, reason) {
    const before = getReputation();
    GameState.reputation = Math.max(0, Math.min(100, before + delta));
    if (delta !== 0 && reason) {
        GameState._reputationLog = GameState._reputationLog || [];
        GameState._reputationLog.push({ delta: Math.round((GameState.reputation - before) * 10) / 10, reason });
    }
    return GameState.reputation;
}

function getReputationTier() {
    const r = getReputation();
    if (r >= 85) return { label: 'Renowned',    className: 'renowned' };
    if (r >= 65) return { label: 'Respected',   className: 'respected' };
    if (r >= 40) return { label: 'Established', className: 'established' };
    if (r >= 18) return { label: 'Known',       className: 'known' };
    return { label: 'Unknown', className: 'unknown' };
}

/**
 * Score one horse's run. Winning a good race is worth most; being well
 * beaten in a race you had no business entering costs you.
 */
function applyRaceReputation(place, fieldSize, race) {
    const type = (race && race.type) || 'conditions';
    const weight = REPUTATION_TYPE_WEIGHT[type] || 1.0;
    // Harder bands count for more
    const bandBonus = race && race.ratingBand ? 1 + (race.ratingBand.min / 200) : 1;

    let delta = 0;
    let reason = '';

    if (place === 1) {
        delta = 0.85 * weight * bandBonus;
        reason = `Won a ${type} race`;
    } else if (place === 2) {
        delta = 0.3 * weight;
        reason = `Placed 2nd in a ${type} race`;
    } else if (place === 3) {
        delta = 0.16 * weight;
        reason = `Placed 3rd in a ${type} race`;
    } else if (type !== 'handicap' && fieldSize > 0 && place > Math.ceil(fieldSize * 0.75)) {
        // Only vanity entries cost you. A handicap is where a horse belongs,
        // so running mid-division there is just racing - but being tailed off
        // in a Group race you had no business entering is a bad look.
        delta = -0.7 * weight;
        reason = `Tailed off in a ${type} race`;
    }

    if (delta !== 0) adjustReputation(delta, reason);
    return delta;
}

/**
 * Reputation fades if you stop winning - it has to be maintained.
 */
function decayReputation() {
    const current = getReputation();
    if (current <= 0) return;
    // Proportional, so a big reputation takes real work to hold onto while a
    // yard still climbing isn't crushed by it.
    adjustReputation(-Math.max(0.5, current * 0.06), 'Season passed');
}

/**
 * A yard with a reputation gets shown the better lots; an unknown one is
 * offered what nobody else wanted. This is where the loop compounds.
 */
function getCatalogueQualities() {
    const reputation = getReputation();
    let qualities;
    if (reputation >= 70) {
        qualities = ['medium', 'medium', 'high', 'high', 'high', 'elite', 'elite', 'elite'];
    } else if (reputation >= 45) {
        qualities = ['low', 'medium', 'medium', 'high', 'high', 'high', 'elite', 'elite'];
    } else if (reputation >= 20) {
        qualities = ['low', 'low', 'medium', 'medium', 'medium', 'high', 'high', 'elite'];
    } else {
        qualities = ['low', 'low', 'low', 'medium', 'medium', 'medium', 'high', 'high'];
    }

    for (let i = qualities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qualities[i], qualities[j]] = [qualities[j], qualities[i]];
    }
    return qualities;
}

function evaluateOwnerAttraction() {
    if (!GameState.owners) GameState.owners = [];

    const yardQuality = calculateYardQuality();
    const playerLevel = GameState.level || 1;
    const reputation = getReputation();

    // Need at least level 3 and quality > 40 for owners to be interested -
    // though a strong reputation opens the door a little earlier.
    const levelGate = reputation >= 50 ? 2 : 3;
    const qualityGate = reputation >= 50 ? 30 : 40;
    if (playerLevel < levelGate || yardQuality < qualityGate) return;

    // Chance scales with quality, level and what the sport thinks of you
    const attractChance = (yardQuality / 100) * 0.15
                        + (playerLevel / 20) * 0.1
                        + (reputation / 100) * 0.22;

    // A good reputation brings a bigger string, not just more owners
    const ownerCap = reputation >= 70 ? 6 : reputation >= 40 ? 5 : 4;
    const activeOwners = GameState.owners.filter(o => o.active);
    if (activeOwners.length >= ownerCap) return;

    if (Math.random() < attractChance) {
        const newOwner = generateOwner();

        // Generate their horses
        const horseCount = randomInt(1, newOwner.maxHorses);
        for (let i = 0; i < horseCount; i++) {
            if (GameState.horses.length >= GameState.maxStalls) break;
            const horse = generateOwnerHorse(newOwner);
            newOwner.horses.push(horse.id);
            GameState.horses.push(horse);
        }

        GameState.owners.push(newOwner);
        gameAlert('New Owner!',
            `${newOwner.name} is impressed with your yard and has sent ${newOwner.horses.length} horse${newOwner.horses.length > 1 ? 's' : ''} for you to train!\n\nTraining fee: £${formatMoney(newOwner.weeklyFeePerHorse)} per horse per week.`
        );
    }
}

function collectOwnerFees() {
    if (!GameState.owners) return 0;
    let totalFees = 0;
    GameState.owners.forEach(owner => {
        if (!owner.active) return;
        const horseCount = owner.horses.filter(hid =>
            GameState.horses.some(h => h.id === hid)
        ).length;
        totalFees += horseCount * owner.weeklyFeePerHorse;
    });
    GameState.budget += totalFees;
    return totalFees;
}

function updateOwnerSatisfaction() {
    if (!GameState.owners) return;
    const yardQuality = calculateYardQuality();

    GameState.owners.forEach(owner => {
        if (!owner.active) return;

        // Yard quality contribution (target: 60+)
        let delta = (yardQuality - 60) * 0.2;

        // Race results for their horses
        const ownerHorses = GameState.horses.filter(h => h.ownerId === owner.id);
        ownerHorses.forEach(h => {
            if (h.form && h.form.length > 0) {
                const lastRace = h.form[h.form.length - 1];
                if (lastRace.position === 1) delta += 15;
                else if (lastRace.position <= 3) delta += 8;
                else delta -= 3;
            }
        });

        owner.satisfaction = Math.max(0, Math.min(100, owner.satisfaction + delta));

        // Track low satisfaction streak
        if (owner.satisfaction < 20) {
            owner.lowSatisfactionStreak++;
        } else {
            owner.lowSatisfactionStreak = 0;
        }

        // Owner departure: 3 consecutive racedays below 20
        if (owner.lowSatisfactionStreak >= 3) {
            ownerDeparts(owner);
        }
    });
}

function ownerDeparts(owner) {
    owner.active = false;

    // Remove owner's horses from stable
    const removedHorses = GameState.horses.filter(h => h.ownerId === owner.id);
    GameState.horses = GameState.horses.filter(h => h.ownerId !== owner.id);

    gameAlert('Owner Departure',
        `${owner.name} has removed their ${removedHorses.length} horse${removedHorses.length > 1 ? 's' : ''} from your stable due to dissatisfaction.`
    );
}

// ============================================
// BETTING SYSTEM
// ============================================

function calculateBettingOdds(race) {
    // Generate runners for odds calculation (including AI)
    const ratingBand = race.ratingBand;
    const distCat = getRaceDistanceCategory(race.distanceFurlongs);
    const raceGround = race.ground || 'Good';

    // Get all potential runners (player + AI)
    const playerHorses = GameState.horses.filter(h =>
        !h.isYearling && !h.isInjured && isHorseEligibleForBand(h, ratingBand)
    );
    const aiEntries = getAIEntriesForRace(ratingBand, 8 - Math.min(playerHorses.length, 4), new Set());

    const allRunners = [];

    playerHorses.slice(0, 4).forEach(h => {
        allRunners.push({ id: h.id, name: h.name, trainer: GameState.stableName, isPlayer: true, horse: h });
    });
    aiEntries.forEach(e => {
        allRunners.push({ id: e.horse.id, name: e.horse.name, trainer: e.trainer.name, isPlayer: false, horse: e.horse });
    });

    if (allRunners.length === 0) return {};

    // Calculate power scores
    const powers = allRunners.map(r => {
        const h = r.horse;
        const baseScore = (h.speed + h.stamina + h.acceleration + h.temperament) / 4;

        // Distance preference match
        const prefMatch = (h.distancePreference || 'mid') === distCat ? 1.0 : 0.92;

        // Ground preference match
        const groundIdx = GROUND_CONDITIONS.indexOf(h.groundPreference || 'Good');
        const raceGroundIdx = GROUND_CONDITIONS.indexOf(raceGround);
        const groundMatch = 1 - Math.abs(groundIdx - raceGroundIdx) * 0.03;

        // Tactical suitability bonus
        const suit = h.tacticalSuitability || { frontRunner: 50, stalker: 50, closer: 50 };
        const bestSuit = Math.max(suit.frontRunner, suit.stalker, suit.closer);
        const suitBonus = bestSuit / 100;

        return { ...r, power: baseScore * prefMatch * groundMatch * suitBonus };
    });

    // Normalize to probabilities
    const totalPower = powers.reduce((sum, p) => sum + p.power, 0);
    const odds = {};

    powers.forEach(p => {
        const prob = p.power / totalPower;
        // Apply overround (120%)
        const adjustedProb = prob * 1.2;
        // Convert to fractional odds (decimal - 1), rounded to nearest common fraction
        const decimal = Math.max(1.5, 1 / adjustedProb);
        const fractional = decimalToFractionalOdds(decimal);
        odds[p.id] = {
            name: p.name,
            trainer: p.trainer,
            isPlayer: p.isPlayer,
            decimal: Math.round(decimal * 10) / 10,
            fractional: fractional,
            probability: Math.round(prob * 100)
        };
    });

    return odds;
}

function decimalToFractionalOdds(decimal) {
    const d = decimal - 1;
    // Common racing odds
    const commonOdds = [
        [1, 5], [2, 5], [1, 2], [4, 7], [4, 6], [4, 5], [1, 1], [5, 4], [6, 4],
        [7, 4], [2, 1], [5, 2], [3, 1], [7, 2], [4, 1], [5, 1], [6, 1], [8, 1],
        [10, 1], [12, 1], [14, 1], [16, 1], [20, 1], [25, 1], [33, 1], [50, 1]
    ];
    let best = commonOdds[0];
    let bestDiff = Infinity;
    commonOdds.forEach(([num, den]) => {
        const diff = Math.abs(num / den - d);
        if (diff < bestDiff) { bestDiff = diff; best = [num, den]; }
    });
    return `${best[0]}/${best[1]}`;
}

function placeBet(raceId, horseId, horseName, betType, stake, odds) {
    if (stake <= 0 || stake > GameState.budget) return false;
    if (!GameState.activeBets) GameState.activeBets = [];

    GameState.budget -= stake;
    GameState.activeBets.push({
        raceId, horseId, horseName, betType, stake,
        odds: odds, settled: false, payout: 0
    });
    return true;
}

function settleBets(raceId, results) {
    if (!GameState.activeBets) return;
    if (!GameState.bettingHistory) GameState.bettingHistory = [];

    GameState.activeBets.forEach(bet => {
        if (bet.raceId !== raceId || bet.settled) return;
        bet.settled = true;

        const horseResult = results.find(r => r.name === bet.horseName || r.horseId === bet.horseId);
        const position = horseResult ? (horseResult.position || horseResult.finalPlace) : 99;

        let payout = 0;
        const decimalOdds = bet.odds;

        if (bet.betType === 'win') {
            if (position === 1) payout = Math.round(bet.stake * decimalOdds);
        } else if (bet.betType === 'place') {
            if (position <= 3) payout = Math.round(bet.stake * (1 + (decimalOdds - 1) / 4));
        } else if (bet.betType === 'each-way') {
            const halfStake = Math.round(bet.stake / 2);
            if (position === 1) {
                payout += Math.round(halfStake * decimalOdds); // win part
                payout += Math.round(halfStake * (1 + (decimalOdds - 1) / 4)); // place part
            } else if (position <= 3) {
                payout += Math.round(halfStake * (1 + (decimalOdds - 1) / 4)); // place part only
            }
        }

        bet.payout = payout;
        GameState.budget += payout;
        GameState.bettingHistory.push({ ...bet });
    });

    // Remove settled bets
    GameState.activeBets = GameState.activeBets.filter(b => !b.settled);
}

function showBettingPanel(raceday) {
    let html = `<div class="betting-panel">
        <h3>Place Your Bets</h3>
        <p class="betting-budget">Budget: \u00A3<span id="betting-budget">${formatMoney(GameState.budget)}</span></p>`;

    raceday.races.forEach((race, raceIdx) => {
        if (race.completed) return;
        const odds = calculateBettingOdds(race);
        const oddsEntries = Object.entries(odds);
        if (oddsEntries.length === 0) return;

        html += `<div class="betting-race-card">
            <h4>${race.name} (${race.distance}) \u2014 \u00A3${formatMoney(race.prize)}</h4>
            <table class="odds-table">
                <tr><th>Horse</th><th>Odds</th><th>Bet Type</th><th>Stake</th><th></th></tr>
                ${oddsEntries.map(([hid, o]) => `
                    <tr>
                        <td>${o.name} <small>(${o.trainer})</small></td>
                        <td><strong>${o.fractional}</strong></td>
                        <td>
                            <select id="bet-type-${raceIdx}-${hid}" class="bet-type-select">
                                <option value="win">Win</option>
                                <option value="place">Place (1-3)</option>
                                <option value="each-way">Each Way</option>
                            </select>
                        </td>
                        <td><input type="number" id="bet-stake-${raceIdx}-${hid}" class="bet-stake-input" placeholder="0" min="0" step="1000" value=""></td>
                        <td><button class="btn btn-small" onclick="placeBetFromUI('${race.id}','${hid}','${o.name.replace(/'/g, "\\'")}',${raceIdx},${o.decimal})">Bet</button></td>
                    </tr>
                `).join('')}
            </table>
        </div>`;
    });

    html += `<div class="betting-actions">
        <button class="btn btn-primary" onclick="closeBettingPanel()">Done Betting</button>
    </div></div>`;

    const overlay = document.getElementById('betting-overlay');
    if (overlay) {
        overlay.innerHTML = html;
        overlay.style.display = 'block';
    }
}

function placeBetFromUI(raceId, horseId, horseName, raceIdx, decimalOdds) {
    const typeEl = document.getElementById(`bet-type-${raceIdx}-${horseId}`);
    const stakeEl = document.getElementById(`bet-stake-${raceIdx}-${horseId}`);
    if (!typeEl || !stakeEl) return;

    const betType = typeEl.value;
    const stake = parseInt(stakeEl.value) || 0;

    if (stake <= 0) {
        gameAlert('Invalid Bet', 'Enter a stake amount.');
        return;
    }
    if (stake > GameState.budget) {
        gameAlert('Insufficient Funds', `You can only bet up to \u00A3${formatMoney(GameState.budget)}.`);
        return;
    }

    if (placeBet(raceId, horseId, horseName, betType, stake, decimalOdds)) {
        stakeEl.value = '';
        const budgetEl = document.getElementById('betting-budget');
        if (budgetEl) budgetEl.textContent = formatMoney(GameState.budget);
        gameAlert('Bet Placed!', `\u00A3${formatMoney(stake)} ${betType} on ${horseName} at ${decimalToFractionalOdds(decimalOdds)}`);
    }
}

function closeBettingPanel() {
    const overlay = document.getElementById('betting-overlay');
    if (overlay) overlay.style.display = 'none';
    // Continue with raceday after betting
    startRaceday();
}

const DISTANCE_PREFERENCES = ['sprint', 'mid', 'stayer'];
const GROUND_CONDITIONS = ['Soft', 'Good to Soft', 'Good', 'Good to Firm', 'Firm'];

const DISTANCE_PREF_LABELS = {
    'sprint': 'Sprint (5f-6f)',
    'mid': 'Mid (7f-1m)',
    'stayer': 'Stayer (1m2f-1m4f)'
};

/**
 * Get race distance category
 */
function getRaceDistanceCategory(furlongs) {
    if (furlongs <= 6) return 'sprint';
    if (furlongs <= 8) return 'mid';
    return 'stayer';
}

/**
 * Check if race uses oval track layout (mid and stayer distances)
 */
function isOvalRace(furlongs) {
    return furlongs > 6;
}

/**
 * Number of full circuits for an oval race
 */
function getOvalLaps(furlongs) {
    return furlongs > 8 ? 2 : 1;
}

/**
 * Calculate horse position on oval track (full elliptical path).
 * Returns { x (%), y (%), flipped (bool), scale (number), zIndex (number) }
 *
 * Ellipse centred at (50%, 50%), semi-axes a ≈ 38%, b ≈ 32%.
 * Start/finish angle ≈ 230° (bottom-right of home straight).
 * Clockwise traversal: home straight → right bend → far side → left bend.
 * progress 0-100 maps to laps full circuits.
 */
function getOvalPosition(progress, laps, runnerIndex, totalRunners) {
    laps = laps || 1;
    runnerIndex = runnerIndex || 0;
    totalRunners = totalRunners || 8;

    // Ellipse geometry — centred between the CSS inner/outer rails
    // Outer rail: a≈46%, b≈43%   Inner rail: a≈36%, b≈30%   Midpoint: a≈41%, b≈36.5%
    const cx = 50;
    const cy = 50;
    const baseA = 41;   // horizontal semi-axis (%)
    const baseB = 36;   // vertical semi-axis (%)

    // Lane staggering: spread runners across the track width
    const laneMid = (totalRunners - 1) / 2;
    const laneSpread = 0.4;  // % per lane index
    const laneOffset = (runnerIndex - laneMid) * laneSpread;
    const a = baseA + laneOffset;
    const b = baseB + laneOffset * 0.85;

    // Start angle (radians). 315° → bottom-right of home straight
    const startAngle = (315 / 180) * Math.PI;

    // Total angular distance: laps full counter-clockwise circuits (on screen)
    const totalAngle = laps * 2 * Math.PI;

    // Map progress (0-100) to angle (increasing = counter-clockwise on screen)
    const t = Math.min(Math.max(progress / 100, 0), 1);
    const angle = startAngle + t * totalAngle;

    // Parametric ellipse position
    const x = cx + a * Math.cos(angle);
    const y = cy - b * Math.sin(angle);

    // Facing direction: velocity dx/dt ∝ -sin(angle); flip when moving left
    const flipped = Math.sin(angle) > 0;

    // Perspective scale: smaller at top (far side), full size at bottom (home straight)
    // y ranges roughly from (cy - b) ≈ 14 at top to (cy + b) ≈ 86 at bottom
    const yNorm = (y - (cy - baseB)) / (2 * baseB); // 0 at top, 1 at bottom
    const scale = 0.6 + 0.4 * Math.max(0, Math.min(1, yNorm));

    // Depth sorting: higher y → drawn on top
    const zIndex = Math.round(y * 10);

    return { x, y, flipped, scale, zIndex };
}

// ============================================
// PHASE 1: GAME MODAL SYSTEM
// ============================================

function showGameModal(title, bodyHTML, buttons) {
    return new Promise(resolve => {
        const overlay = document.getElementById('game-modal');
        document.getElementById('game-modal-title').textContent = title;
        document.getElementById('game-modal-body').innerHTML = bodyHTML;

        const btnContainer = document.getElementById('game-modal-buttons');
        btnContainer.innerHTML = '';

        buttons.forEach(btn => {
            const el = document.createElement('button');
            el.className = `btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}`;
            el.textContent = btn.label;
            el.addEventListener('click', () => {
                overlay.style.display = 'none';
                resolve(btn.value);
            });
            btnContainer.appendChild(el);
        });

        overlay.style.display = 'flex';
    });
}

function gameAlert(title, message) {
    return showGameModal(title, message, [
        { label: 'OK', value: true, primary: true }
    ]);
}

function gameConfirm(title, message) {
    return showGameModal(title, message, [
        { label: 'Cancel', value: false, primary: false },
        { label: 'Confirm', value: true, primary: true }
    ]);
}

function gamePrompt(title, message, placeholder = '') {
    return new Promise(resolve => {
        const overlay = document.getElementById('game-modal');
        document.getElementById('game-modal-title').textContent = title;
        document.getElementById('game-modal-body').innerHTML = `
            <p>${message}</p>
            <input type="text" id="game-prompt-input" class="game-prompt-input" placeholder="${placeholder}" maxlength="30" style="width:100%;padding:8px;margin-top:8px;font-size:1rem;border:2px solid var(--color-border);border-radius:var(--radius);background:var(--color-bg);color:var(--color-text);">
        `;

        const btnContainer = document.getElementById('game-modal-buttons');
        btnContainer.innerHTML = '';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            resolve(null);
        });
        btnContainer.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.addEventListener('click', () => {
            const val = document.getElementById('game-prompt-input').value.trim();
            overlay.style.display = 'none';
            resolve(val || null);
        });
        btnContainer.appendChild(confirmBtn);

        overlay.style.display = 'flex';
        setTimeout(() => document.getElementById('game-prompt-input').focus(), 50);
    });
}

// ============================================
// PHASE 4: SOUND MANAGER
// ============================================

const SoundManager = {
    ctx: null,
    muted: false,
    _crowdStop: null,
    _hoofStop: null,

    _init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        document.querySelectorAll('.btn-mute').forEach(b => {
            b.textContent = this.muted ? '\u{1F507}' : '\u{1F50A}';
        });
    },

    playClick() {
        if (this.muted) return;
        try {
            this._init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.08);
        } catch(e) {}
    },

    playFanfare() {
        if (this.muted) return;
        try {
            this._init();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const t = this.ctx.currentTime + i * 0.2;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc.connect(gain).connect(this.ctx.destination);
                osc.start(t); osc.stop(t + 0.5);
            });
        } catch(e) {}
    },

    playGavel() {
        if (this.muted) return;
        try {
            this._init();
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            src.connect(filter).connect(gain).connect(this.ctx.destination);
            src.start();
        } catch(e) {}
    },

    playWhoosh() {
        if (this.muted) return;
        try {
            this._init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.4);
        } catch(e) {}
    },

    startCrowd() {
        if (this.muted) { return () => {}; }
        try {
            this._init();
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            filter.Q.value = 0.5;
            const gain = this.ctx.createGain();
            gain.gain.value = 0.03;
            src.connect(filter).connect(gain).connect(this.ctx.destination);
            src.start();
            this._crowdGain = gain;
            this._crowdFilter = filter;
            const stop = () => { try { src.stop(); } catch(e) {} };
            this._crowdStop = stop;
            return stop;
        } catch(e) { return () => {}; }
    },

    buildCrowd() {
        if (this._crowdGain) {
            this._crowdGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1);
        }
        if (this._crowdFilter) {
            this._crowdFilter.frequency.linearRampToValueAtTime(1600, this.ctx.currentTime + 1);
        }
    },

    startHoofbeats(bpm) {
        if (this.muted) { return () => {}; }
        try {
            this._init();
            const interval = 60000 / (bpm || 300);
            let running = true;
            const tick = () => {
                if (!running || this.muted) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 80;
                gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                osc.connect(gain).connect(this.ctx.destination);
                osc.start(); osc.stop(this.ctx.currentTime + 0.05);
                if (running) setTimeout(tick, interval);
            };
            tick();
            const stop = () => { running = false; };
            this._hoofStop = stop;
            return stop;
        } catch(e) { return () => {}; }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatMoney(amount) {
    return amount.toLocaleString('en-GB');
}

function generateHorseName() {
    const prefix = HORSE_NAME_PREFIXES[randomInt(0, HORSE_NAME_PREFIXES.length - 1)];
    const suffix = HORSE_NAME_SUFFIXES[randomInt(0, HORSE_NAME_SUFFIXES.length - 1)];
    return `${prefix} ${suffix}`;
}

function generateHorseAttributes(qualityTier = 'medium') {
    let baseMin, baseMax;

    switch (qualityTier) {
        case 'low':
            baseMin = 30; baseMax = 55;
            break;
        case 'medium':
            baseMin = 45; baseMax = 70;
            break;
        case 'high':
            baseMin = 60; baseMax = 85;
            break;
        case 'elite':
            baseMin = 75; baseMax = 95;
            break;
        default:
            baseMin = 45; baseMax = 70;
    }

    return {
        speed: randomInt(baseMin, baseMax),
        stamina: randomInt(baseMin, baseMax),
        acceleration: randomInt(baseMin, baseMax),
        temperament: randomInt(baseMin, baseMax)
    };
}

function calculateHorseValue(horse) {
    const avgAttr = (horse.speed + horse.stamina + horse.acceleration + horse.temperament) / 4;
    const ageMultiplier = horse.age <= 3 ? 1.2 : horse.age <= 5 ? 1.0 : 0.8;
    const baseValue = avgAttr * 2000;
    return Math.round(baseValue * ageMultiplier / 1000) * 1000;
}

// ============================================
// RATINGS & HANDICAP SYSTEM
// ============================================

/**
 * Calculate Official Rating (OR) from horse stats - simple average, 0-100 scale
 */
function calculateOfficialRating(horse) {
    return Math.max(0, Math.min(100, Math.round((horse.speed + horse.stamina + horse.acceleration + horse.temperament) / 4)));
}

// ============================================
// RATING BANDS & RACEDAY SYSTEM
// ============================================

const RATING_BANDS = [
    { label: '0-50',   min: 0,  max: 50 },
    { label: '51-60',  min: 51, max: 60 },
    { label: '61-70',  min: 61, max: 70 },
    { label: '71-80',  min: 71, max: 80 },
    { label: '81-90',  min: 81, max: 90 },
    { label: '91-100', min: 91, max: 100 }
];

function getRatingBand(or) {
    for (const band of RATING_BANDS) {
        if (or >= band.min && or <= band.max) return band;
    }
    return RATING_BANDS[0];
}

function isHorseEligibleForBand(horse, band) {
    const or = horse.officialRating != null ? horse.officialRating : calculateOfficialRating(horse);
    return or >= band.min && or <= band.max;
}

function getEligibleHorsesForBand(horses, band) {
    return horses.filter(h => isHorseEligibleForBand(h, band));
}

const RACE_NAME_POOL = [
    'Dorington Stakes', 'Pemberton Sprint', 'Thornfield Handicap',
    'Ashbury Cup', 'Kingswood Classic', 'Lightning Sprint',
    'Whitehall Gold Cup', 'Champion Stakes', 'Berkshire Trophy',
    'Newmarket Plate', 'Epsom Dash', 'Windsor Castle Stakes',
    'Ascot Gold Cup', 'Goodwood Cup', 'Chester Vase',
    'Doncaster Mile', 'Lingfield Sprint', 'Kempton Park Stakes',
    'York Handicap', 'Sandown Classic', 'Haydock Sprint',
    'Newbury Stakes', 'Chelmsford Cup', 'Wolverhampton Trophy',
    'Pontefract Plate', 'Ripon Stakes', 'Thirsk Sprint',
    'Catterick Handicap', 'Redcar Cup', 'Musselburgh Gold',
    'Hamilton Stakes', 'Ayr Gold Cup', 'Perth Plate',
    'Salisbury Cup', 'Bath Stakes', 'Nottingham Sprint',
    'Leicester Trophy', 'Warwick Handicap', 'Stratford Cup',
    'Beverley Stakes', 'Brighton Dash', 'Fontwell Sprint',
    'Market Rasen Cup', 'Hexham Stakes', 'Ludlow Trophy',
    'Taunton Handicap', 'Sedgefield Cup', 'Plumpton Stakes',
    'Wincanton Sprint', 'Bangor Stakes', 'Hereford Cup',
    'Ffos Las Trophy', 'Newton Abbot Plate', 'Exeter Stakes',
    'Towcester Sprint', 'Fakenham Cup', 'Huntingdon Trophy',
    'Carlisle Handicap', 'Kelso Stakes', 'Wetherby Gold Cup',
    'Aintree Trophy', 'Doncaster Cup', 'Chepstow Stakes',
    'Uttoxeter Sprint', 'Southwell Cup', 'Worcester Trophy',
    'Great Yarmouth Stakes', 'Folkestone Sprint', 'Royal Windsor Cup',
    'Salisbury Trophy', 'Lingfield Park Cup', 'Newmarket Gold',
    'Kempton Classic', 'Sandown Sprint', 'Haydock Gold Cup',
    'Goodwood Sprint', 'Chester Cup', 'York Classic',
    'Newcastle Stakes', 'Carlisle Cup', 'Kelso Sprint'
];

const RACE_DISTANCES = [
    { distance: '5 furlongs', distanceFurlongs: 5 },
    { distance: '6 furlongs', distanceFurlongs: 6 },
    { distance: '7 furlongs', distanceFurlongs: 7 },
    { distance: '1 mile', distanceFurlongs: 8 },
    { distance: '1m 2f', distanceFurlongs: 10 },
    { distance: '1m 4f', distanceFurlongs: 12 }
];

/**
 * Generate a single raceday with 8 races of random distances and rating bands
 */
function generateRaceday(racedayNumber) {
    const usedNames = new Set();
    const races = [];

    for (let i = 0; i < 8; i++) {
        // Random race name (no duplicates within a raceday)
        let name;
        do {
            name = RACE_NAME_POOL[randomInt(0, RACE_NAME_POOL.length - 1)];
        } while (usedNames.has(name));
        usedNames.add(name);

        // Random distance
        const dist = RACE_DISTANCES[randomInt(0, RACE_DISTANCES.length - 1)];

        // Random rating band
        const band = RATING_BANDS[randomInt(0, RATING_BANDS.length - 1)];

        // Random race type (weighted: 60% handicap, 25% conditions, 15% group)
        const typeRoll = Math.random();
        const type = typeRoll < 0.60 ? 'handicap' : typeRoll < 0.85 ? 'conditions' : 'group';

        // Prize money scaled by band and type
        const bandIndex = RATING_BANDS.indexOf(band);
        const basePrize = 15000 + bandIndex * 10000;
        const typeMultiplier = type === 'group' ? 2.0 : type === 'conditions' ? 1.3 : 1.0;
        const prize = Math.round(basePrize * typeMultiplier / 1000) * 1000;

        // ~25% chance of jump race (only for distances >= 8f)
        const isJumpRace = dist.distanceFurlongs >= 8 && Math.random() < 0.25;
        const jumps = isJumpRace
            ? Array.from({ length: Math.floor(dist.distanceFurlongs / 2) }, (_, j) => ({
                furlongPosition: (j + 1) * 2,
                tickPosition: Math.round(((j + 1) * 2 / dist.distanceFurlongs) * 100)
            }))
            : [];

        races.push({
            id: generateId(),
            raceNumber: i + 1,
            name: name,
            distance: dist.distance,
            distanceFurlongs: dist.distanceFurlongs,
            prize: prize,
            type: type,
            ground: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
            ratingBand: { ...band },
            isJumpRace: isJumpRace,
            jumps: jumps,
            completed: false,
            results: null,
            playerEntered: false,
            selectedHorseIds: [],
            horseStrategies: {}
        });
    }

    return {
        id: generateId(),
        racedayNumber: racedayNumber,
        completed: false,
        races: races
    };
}

/**
 * Generate AI stable for a trainer - creates 10-14 horses spread across rating bands
 */
function generateAIStable(trainer) {
    const horses = [];
    // Distribution varies by race difficulty setting
    const rd = GameState.settings?.raceDifficulty || 'medium';
    let tiers;
    if (rd === 'easy') {
        tiers = [
            { quality: 'low', count: 4 },
            { quality: 'medium', count: 4 },
            { quality: 'high', count: 2 },
            { quality: 'elite', count: 1 }
        ];
    } else if (rd === 'hard') {
        tiers = [
            { quality: 'low', count: 2 },
            { quality: 'medium', count: 2 },
            { quality: 'high', count: 4 },
            { quality: 'elite', count: randomInt(3, 4) }
        ];
    } else {
        tiers = [
            { quality: 'low', count: 3 },
            { quality: 'medium', count: 3 },
            { quality: 'high', count: 3 },
            { quality: 'elite', count: randomInt(2, 3) }
        ];
    }

    tiers.forEach(tier => {
        for (let i = 0; i < tier.count; i++) {
            const horse = generateHorse(tier.quality);
            horse.trainerId = trainer.id;
            horse.trainerName = trainer.name;
            horse.silkPrimary = trainer.silkPrimary;
            horse.silkSecondary = trainer.silkSecondary;
            horse.isAI = true;
            horse.form = [];
            horses.push(horse);
        }
    });

    return horses;
}

/**
 * Get AI entries for a race based on rating band - selects horses from AI stables
 * Excludes horses that have already run on this raceday
 */
function getAIEntriesForRace(band, maxEntries, excludeIds) {
    excludeIds = excludeIds || new Set();
    const eligible = [];

    GameState.competitors.forEach(trainer => {
        if (!trainer.horses) return;
        trainer.horses.forEach(horse => {
            if (excludeIds.has(horse.id)) return;
            if (horse.isInjured) return;
            if (isHorseEligibleForBand(horse, band)) {
                eligible.push({ horse, trainer });
            }
        });
    });

    // Shuffle and take up to maxEntries
    for (let i = eligible.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    return eligible.slice(0, maxEntries);
}

/**
 * Simulate a race that the player did not enter - quick result for AI horses only
 */
function simulateNonEnteredRace(race, usedAIHorseIds) {
    const entries = getAIEntriesForRace(race.ratingBand, 8, usedAIHorseIds);
    if (entries.length < 2) {
        race.completed = true;
        race.results = [];
        return;
    }

    // Mark these horses as used for this raceday
    entries.forEach(e => usedAIHorseIds.add(e.horse.id));

    // Simple simulation: score each horse based on stats + randomness
    const runners = entries.map(e => {
        const h = e.horse;
        const distCat = getRaceDistanceCategory(race.distanceFurlongs);
        const prefMatch = h.distancePreference === distCat ? 1.0 : 0.92;
        const baseScore = (h.speed + h.stamina + h.acceleration + h.temperament) / 4;
        const score = baseScore * prefMatch * (0.85 + Math.random() * 0.3);
        return {
            id: h.id,
            name: h.name,
            trainer: e.trainer.name,
            trainerId: e.trainer.id,
            isPlayer: false,
            score: score,
            officialRating: h.officialRating,
            horse: h
        };
    });

    // Sort by score descending (highest score = 1st place)
    runners.sort((a, b) => b.score - a.score);
    runners.forEach((r, idx) => { r.finalPlace = idx + 1; });

    // Apply handicapper adjustments to AI horses
    applyHandicapperToRunners(runners);

    // Record results
    race.completed = true;
    race.results = runners.map(r => ({
        name: r.name,
        trainer: r.trainer,
        position: r.finalPlace,
        isPlayer: false,
        officialRating: r.officialRating,
        weightDisplay: formatWeight(126)
    }));

    // Record form for AI horses
    runners.forEach(r => {
        if (r.horse && r.horse.form) {
            r.horse.form.push({
                raceId: race.id,
                raceName: race.name,
                distance: race.distance,
                position: r.finalPlace,
                orAtTime: r.officialRating,
                totalRunners: runners.length
            });
        }
    });

    // Award AI standings points
    runners.slice(0, 4).forEach((runner, idx) => {
        const aiStanding = GameState.standings.find(s => s.name === runner.trainer);
        if (aiStanding) {
            aiStanding.points += [18, 12, 8, 5][idx] || 2;
        }
    });

    // Record to global results database
    if (!GameState.raceResults) GameState.raceResults = [];
    GameState.raceResults.push({
        raceId: race.id,
        raceName: race.name,
        raceday: race._racedayNumber || 0,
        raceNumber: race.raceNumber,
        distance: race.distance,
        distanceFurlongs: race.distanceFurlongs,
        ratingBand: race.ratingBand,
        results: runners.map(r => ({
            horseId: r.id,
            horseName: r.name,
            trainerId: r.trainerId,
            trainerName: r.trainer,
            isPlayer: false,
            position: r.finalPlace,
            orAtTime: r.officialRating
        }))
    });
}

/**
 * Apply handicapper adjustments to all runners based on finishing position
 * Winner: +5, 2nd: +3, 3rd: +1, Last: -5, 2nd last: -3, 3rd last: -1
 */
function applyHandicapperToRunners(runners) {
    const total = runners.length;
    if (total < 2) return;

    runners.forEach(runner => {
        const pos = runner.finalPlace;
        let change = 0;

        // Top placings
        if (pos === 1) change = 5;
        else if (pos === 2) change = 3;
        else if (pos === 3) change = 1;

        // Bottom placings
        if (pos === total) change = -5;
        else if (pos === total - 1) change = -3;
        else if (pos === total - 2) change = -1;

        if (change === 0) return;

        // Find the actual horse object and update
        let horse = null;
        if (runner.isPlayer) {
            horse = GameState.horses.find(h => h.id === runner.id);
        } else if (runner.horse) {
            horse = runner.horse;
        } else {
            // Search AI stables
            for (const trainer of GameState.competitors) {
                if (!trainer.horses) continue;
                const found = trainer.horses.find(h => h.id === runner.id);
                if (found) { horse = found; break; }
            }
        }

        if (!horse) return;

        const oldRating = horse.officialRating;
        horse.officialRating = Math.max(0, Math.min(100, oldRating + change));

        if (!horse.ratingHistory) horse.ratingHistory = [];
        horse.ratingHistory.push({
            raceName: runner._raceName || '',
            oldRating: oldRating,
            newRating: horse.officialRating,
            change: horse.officialRating - oldRating,
            position: pos
        });

        runner._ratingChange = horse.officialRating - oldRating;
        runner._oldRating = oldRating;
        runner._newRating = horse.officialRating;
    });
}

/**
 * Get form guide HTML for a horse
 */
function renderFormGuide(horse) {
    if (!horse.form || horse.form.length === 0) {
        return '<p class="form-empty">No race history yet</p>';
    }
    const recent = horse.form.slice(-6).reverse();
    return `<div class="form-guide">
        ${recent.map(f => `
            <div class="form-entry">
                <span class="form-pos ${f.position <= 3 ? 'placed' : ''}">${getOrdinal(f.position)}</span>
                <span class="form-race">${f.raceName}</span>
                <span class="form-dist">${f.distance}</span>
                <span class="form-or">OR ${f.orAtTime}</span>
                <span class="form-field">/${f.totalRunners}</span>
            </div>
        `).join('')}
    </div>`;
}

/**
 * Convert weight in pounds to stones/pounds display string
 */
function formatWeight(lbs) {
    const stones = Math.floor(lbs / 14);
    const pounds = lbs % 14;
    return `${stones}st ${pounds}lb`;
}

/**
 * Speed multiplier based on weight carried.
 * Reference = 126 lbs (9st 0lb) = 1.0
 * 0.3% penalty per pound above reference, 0.3% bonus per pound below
 * Distance factor: sprints x0.8, mid x1.0, stayers x1.2
 */
function getWeightMultiplier(weightLbs, distanceFurlongs) {
    const reference = 126;
    const diff = weightLbs - reference;
    const distanceCategory = getRaceDistanceCategory(distanceFurlongs);
    const distanceFactor = distanceCategory === 'sprint' ? 0.8 : distanceCategory === 'stayer' ? 1.2 : 1.0;
    const multiplier = 1 - (diff * 0.003 * distanceFactor);
    return Math.max(0.958, Math.min(1.042, multiplier));
}

/**
 * Calculate handicap weights: top-rated carries 10st 0lb (140 lbs),
 * each OR point below = 1 lb less. Floor: 8st 0lb (112 lbs).
 */
function calculateHandicapWeights(runners) {
    const maxOR = Math.max(...runners.map(r => r.officialRating || 0));
    runners.forEach(runner => {
        const or = runner.officialRating || 0;
        const weightLbs = Math.max(112, 140 - (maxOR - or));
        runner.weightLbs = weightLbs;
        runner.weightDisplay = formatWeight(weightLbs);
    });
}

/**
 * Assign race weights based on race type.
 * Handicap: weighted by OR. Group/conditions: all carry 9st 0lb.
 */
function assignRaceWeights(runners, raceType) {
    if (raceType === 'handicap') {
        calculateHandicapWeights(runners);
    } else {
        runners.forEach(runner => {
            runner.weightLbs = 126;
            runner.weightDisplay = formatWeight(126);
        });
    }
}

/**
 * Adjust Official Ratings after a race for ALL horses (player and AI).
 * Winner: +5, 2nd: +3, 3rd: +1, Last: -5, 2nd last: -3, 3rd last: -1
 * Returns array of { horseId, horseName, oldRating, newRating, change }
 */
function adjustRatingsAfterRace(finalPositions, raceType) {
    // Tag runners with race name for history
    finalPositions.forEach(r => {
        r._raceName = RaceState.selectedRace ? RaceState.selectedRace.name : '';
    });

    applyHandicapperToRunners(finalPositions);

    const ratingChanges = [];

    finalPositions.forEach(runner => {
        if (runner._ratingChange === undefined) return;

        const horse = runner.isPlayer
            ? GameState.horses.find(h => h.id === runner.id)
            : null;

        ratingChanges.push({
            horseId: runner.id,
            horseName: runner.name,
            oldRating: runner._oldRating,
            newRating: runner._newRating,
            change: runner._ratingChange,
            isPlayer: runner.isPlayer
        });

        // Update player horse display properties
        if (horse) {
            horse._lastRatingChange = runner._ratingChange;
            horse._lastOldRating = runner._oldRating;
        }
    });

    return ratingChanges;
}

/**
 * Generate a horse for auction (Phase 2: now includes silk colours)
 */
function generateHorse(qualityTier = 'medium') {
    const attributes = generateHorseAttributes(qualityTier);
    const age = randomInt(2, 6);
    const silk = SILK_COLOURS[randomInt(0, SILK_COLOURS.length - 1)];

    const horse = {
        id: generateId(),
        name: generateHorseName(),
        age: age,
        ...attributes,
        sex: generateSex(false),
        condition: 100,
        trainingFocus: null,
        racesRun: 0,
        wins: 0,
        totalEarnings: 0,
        isInjured: false,
        injuryType: null,
        recoveryRacesLeft: 0,
        brewing: null,
        paddockTurnedOut: false,
        fedThisRound: false,
        tackedUp: { saddle: false, bridle: false },
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        pendingAuction: false,
        reservePrice: 0,
        stallCare: { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 }
    };

    // ~30% chance of being a jumper
    horse.isJumper = Math.random() < 0.3;
    horse.jumpAbility = horse.isJumper ? randomInt(40, 90) : 0;
    horse.flatRacesCompleted = 0;

    horse.estimatedValue = calculateHorseValue(horse);
    horse.officialRating = calculateOfficialRating(horse);
    horse.ratingHistory = [];
    horse.form = [];
    horse.tacticalSuitability = generateTacticalSuitability(horse);
    return horse;
}

// ============================================
// YEARLING GENERATION
// ============================================

function generateSireName() {
    const prefix = SIRE_NAME_PREFIXES[randomInt(0, SIRE_NAME_PREFIXES.length - 1)];
    const suffix = SIRE_NAME_SUFFIXES[randomInt(0, SIRE_NAME_SUFFIXES.length - 1)];
    return `${prefix} ${suffix}`;
}

function generateDamName() {
    const prefix = DAM_NAME_PREFIXES[randomInt(0, DAM_NAME_PREFIXES.length - 1)];
    const suffix = DAM_NAME_SUFFIXES[randomInt(0, DAM_NAME_SUFFIXES.length - 1)];
    return `${prefix} ${suffix}`;
}

function generateYearlingAttributes(sireStats, damStats) {
    const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
    const result = {};

    stats.forEach(stat => {
        const sireVal = sireStats[stat] * (0.75 + Math.random() * 0.5); // ±25%
        const damVal = damStats[stat] * (0.75 + Math.random() * 0.5);  // ±25%
        const avg = (sireVal + damVal) / 2;
        result[stat] = Math.round(Math.min(95, Math.max(20, avg)));
    });

    return result;
}

function calculateYearlingValue(sire, dam) {
    const sireAvg = (sire.speed + sire.stamina + sire.acceleration + sire.temperament) / 4;
    const damAvg = (dam.speed + dam.stamina + dam.acceleration + dam.temperament) / 4;
    const parentAvg = (sireAvg + damAvg) / 2;
    const baseValue = parentAvg * 1500;
    return Math.round(baseValue / 1000) * 1000;
}

function generateYearling(qualityTier = 'medium') {
    const sireStats = generateHorseAttributes(qualityTier);
    const damStats = generateHorseAttributes(qualityTier);

    const sire = {
        name: generateSireName(),
        ...sireStats
    };

    const dam = {
        name: generateDamName(),
        ...damStats
    };

    const derivedStats = generateYearlingAttributes(sireStats, damStats);
    const silk = SILK_COLOURS[randomInt(0, SILK_COLOURS.length - 1)];

    const yearling = {
        id: generateId(),
        name: 'Un-named',
        age: 1,
        ...derivedStats,
        sex: generateSex(true),
        condition: 100,
        trainingFocus: null,
        racesRun: 0,
        wins: 0,
        totalEarnings: 0,
        isInjured: false,
        injuryType: null,
        recoveryRacesLeft: 0,
        brewing: null,
        paddockTurnedOut: false,
        fedThisRound: false,
        tackedUp: { saddle: false, bridle: false },
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        isYearling: true,
        isRaceReady: false,
        sire: sire,
        dam: dam,
        pendingAuction: false,
        reservePrice: 0,
        stallCare: { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 }
    };

    yearling.isJumper = Math.random() < 0.3;
    yearling.jumpAbility = yearling.isJumper ? randomInt(30, 70) : 0;
    yearling.flatRacesCompleted = 0;

    yearling.estimatedValue = calculateYearlingValue(sire, dam);
    yearling.officialRating = null;
    yearling.ratingHistory = [];
    yearling.tacticalSuitability = generateTacticalSuitability(yearling);
    return yearling;
}

// Injury types and their properties
const INJURY_TYPES = [
    { name: 'Muscle strain', minRecovery: 1, maxRecovery: 2, statLossChance: 0.2, statLossAmount: [1, 3] },
    { name: 'Tendon injury', minRecovery: 2, maxRecovery: 4, statLossChance: 0.4, statLossAmount: [2, 5] },
    { name: 'Joint inflammation', minRecovery: 1, maxRecovery: 3, statLossChance: 0.3, statLossAmount: [1, 4] },
    { name: 'Ligament damage', minRecovery: 3, maxRecovery: 5, statLossChance: 0.5, statLossAmount: [3, 6] },
    { name: 'Minor knock', minRecovery: 1, maxRecovery: 1, statLossChance: 0.1, statLossAmount: [0, 2] }
];

function checkForInjury(horse, context) {
    let injuryChance = context === 'training' ? 0.04 : 0.06;

    if (horse.age >= 6) injuryChance += 0.03;
    if (horse.age >= 7) injuryChance += 0.05;

    if (horse.condition < 50) injuryChance += 0.05;
    if (horse.condition < 30) injuryChance += 0.05;

    if (Math.random() < injuryChance) {
        const injury = INJURY_TYPES[randomInt(0, INJURY_TYPES.length - 1)];
        const recoveryRaces = randomInt(injury.minRecovery, injury.maxRecovery);

        horse.isInjured = true;
        horse.injuryType = injury.name;
        horse.recoveryRacesLeft = recoveryRaces;

        if (Math.random() < injury.statLossChance) {
            const statLoss = randomInt(injury.statLossAmount[0], injury.statLossAmount[1]);
            applyStatLoss(horse, statLoss);
        }

        return {
            type: injury.name,
            recoveryRaces: recoveryRaces,
            context: context
        };
    }

    return null;
}

function checkTackBreakage() {
    const broke = [];
    // ~10% chance a saddle breaks, ~12% chance a bridle breaks
    if (GameState.tack.saddles > 0 && Math.random() < 0.10) {
        GameState.tack.saddles--;
        broke.push('Saddle');
    }
    if (GameState.tack.bridles > 0 && Math.random() < 0.12) {
        GameState.tack.bridles--;
        broke.push('Bridle');
    }
    return broke.length > 0 ? broke : null;
}

function applyStatLoss(horse, amount) {
    const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
    const statToReduce = stats[randomInt(0, stats.length - 1)];
    horse[statToReduce] = Math.max(horse[statToReduce] - amount, 20);
}

function processInjuryRecovery() {
    GameState.horses.forEach(horse => {
        horse.paddockTurnedOut = false;
        horse.fedThisRound = false;
        horse.tackedUp = { saddle: false, bridle: false };
        if (horse.isInjured && horse.recoveryRacesLeft > 0) {
            horse.recoveryRacesLeft--;
            if (horse.recoveryRacesLeft <= 0) {
                horse.isInjured = false;
                horse.injuryType = null;
            }
        }

        // Stall care decline each race day (scaled by careNeeds setting)
        const care = horse.stallCare;
        if (!care) return;

        const careMult = { low: 0.5, medium: 1.0, high: 1.5 }[GameState.settings?.careNeeds || 'medium'] || 1.0;
        care.feedLevel = Math.max(0, care.feedLevel - Math.round(20 * careMult));
        care.waterLevel = Math.max(0, care.waterLevel - Math.round(25 * careMult));
        care.hayLevel = Math.max(0, care.hayLevel - Math.round(15 * careMult));

        if (care.manurePiles < 4) care.manurePiles += 1;
        care.beddingQuality = Math.max(0, 100 - care.manurePiles * 25);

        let neglectScore = 0;
        if (care.feedLevel === 0) neglectScore += 2;
        if (care.waterLevel === 0) neglectScore += 3;
        if (care.hayLevel === 0) neglectScore += 1;
        if (care.beddingQuality <= 25) neglectScore += 1;

        if (neglectScore > 0) {
            const loss = Math.min(neglectScore, 3);
            horse.speed = Math.max(1, horse.speed - loss);
            horse.stamina = Math.max(1, horse.stamina - loss);
            horse.condition = Math.max(0, horse.condition - loss * 5);

            if (!horse.neglectCounter) horse.neglectCounter = 0;
            if (neglectScore >= 3) {
                horse.neglectCounter++;
                if (horse.neglectCounter >= 2 && !horse.isInjured) {
                    horse.isInjured = true;
                    horse.injuryType = 'Malnourishment';
                    horse.recoveryRacesLeft = 3;
                }
                if (horse.neglectCounter >= 5) {
                    horse.isDead = true;
                }
            }
        } else {
            horse.neglectCounter = 0;
        }
    });

    // Handle horse death from neglect
    const deadHorses = GameState.horses.filter(h => h.isDead);
    if (deadHorses.length > 0) {
        const names = deadHorses.map(h => h.name).join(', ');
        setTimeout(() => gameAlert('Horse Death', `The following horse${deadHorses.length > 1 ? 's have' : ' has'} died from neglect: ${names}`), 500);
        GameState.horses = GameState.horses.filter(h => !h.isDead);
    }
}

function applyAgingEffects() {
    GameState._graduatedYearlings = [];

    GameState.horses.forEach(horse => {
        horse.age++;

        // Graduate yearlings when they turn 2
        if (horse.isYearling && horse.age >= 2) {
            horse.isYearling = false;
            horse.isRaceReady = true;
            horse.officialRating = calculateOfficialRating(horse);
            GameState._graduatedYearlings.push(horse.name);
        }

        if (horse.age >= 5) {
            const declineChance = (horse.age - 4) * 0.15;

            if (Math.random() < declineChance) {
                const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
                const numStatsToDecline = randomInt(1, 2);

                for (let i = 0; i < numStatsToDecline; i++) {
                    const stat = stats[randomInt(0, stats.length - 1)];
                    const decline = randomInt(1, 4);
                    horse[stat] = Math.max(horse[stat] - decline, 20);
                }
            }
        }
    });
}

// ============================================
// RANDOM SETBACK SYSTEM
// ============================================

const SETBACK_TYPES = [
    {
        name: 'Mild illness',
        description: 'has been unwell and missed some training',
        statLoss: [1, 2], numStats: 1, chance: 0.08
    },
    {
        name: 'Viral infection',
        description: 'contracted a virus and needed rest',
        statLoss: [1, 3], numStats: 2, chance: 0.04
    },
    {
        name: 'Overtraining',
        description: 'showed signs of overtraining and needed to ease off',
        statLoss: [1, 2], numStats: 1, chance: 0.06
    },
    {
        name: 'Underperforming in training',
        description: 'has been flat in training - may need a change of routine',
        statLoss: [1, 2], numStats: 1, chance: 0.06
    },
    {
        name: 'Loss of appetite',
        description: 'went off their feed for a few days',
        statLoss: [1, 2], numStats: 1, chance: 0.05
    },
    {
        name: 'Travel stress',
        description: 'was unsettled after travelling and needed time to recover',
        statLoss: [1, 2], numStats: 1, chance: 0.04
    },
    {
        name: 'Teeth issues',
        description: 'had dental problems affecting their eating',
        statLoss: [1, 2], numStats: 1, chance: 0.03
    },
    {
        name: 'Behavioural issues',
        description: 'has become difficult to handle - temperament affected',
        statLoss: [1, 3], numStats: 1, affectedStat: 'temperament', chance: 0.04
    },
    {
        name: 'Weight gain',
        description: 'has put on too much weight',
        statLoss: [1, 2], numStats: 1, affectedStat: 'speed', chance: 0.04
    },
    {
        name: 'Muscle soreness',
        description: 'showing signs of muscle fatigue without injury',
        statLoss: [1, 2], numStats: 1, affectedStat: 'acceleration', chance: 0.05
    }
];

// ============================================
// STAFF PERCEPTION SYSTEM
// ============================================

/**
 * What a setback looks like to someone who knows what they're looking at.
 * Same underlying setback data - a good work rider reads it days early,
 * a yard hand only notices once the damage is done.
 */
const SETBACK_SIGNALS = {
    'Mild illness':                { precise: 'has a temperature and is off colour',                    advice: 'ease off and let it pass' },
    'Viral infection':             { precise: 'has a dirty nose and glands up - something is going round', advice: 'keep off the gallops' },
    'Overtraining':                { precise: 'has gone over the top - dull in the coat, flat in the work', advice: 'back off the work' },
    'Underperforming in training': { precise: 'has gone stale in the routine',                           advice: 'freshen up with an easy week' },
    'Loss of appetite':            { precise: 'is leaving feed in the manger',                           advice: 'lighten the work and tempt the appetite' },
    'Travel stress':               { precise: "hasn't let down since the last trip",                     advice: 'give a quiet week at home' },
    'Teeth issues':                { precise: 'is quidding and dropping half-chewed feed',               advice: 'get the teeth rasped' },
    'Behavioural issues':          { precise: 'is getting stroppy in the box and hard to handle',        advice: 'quiet handling and less pressure' },
    'Weight gain':                 { precise: 'is carrying too much condition',                          advice: 'adjust the feed' },
    'Muscle soreness':             { precise: 'is sore behind the saddle and not tracking up',           advice: 'ease off before it turns into a real injury' }
};

const VAGUE_OBSERVATIONS = [
    "wasn't quite right this morning",
    'left a bit of feed last night',
    'looked a shade dull on the gallops',
    'has been quiet in the box',
    "didn't take the bridle as keenly as usual",
    'seemed a bit flat coming back in',
    "hasn't been themselves the last day or two"
];

/**
 * Staff quality tiers. Wage buys you lead time and precision, not labour.
 */
const STAFF_TIERS = {
    1: { title: 'Yard Hand',         wage: 12000, detectChance: 0.08, leadTime: 0, horsesCovered: 2, signal: 'none' },
    2: { title: 'Groom',             wage: 18000, detectChance: 0.30, leadTime: 1, horsesCovered: 2, signal: 'vague' },
    3: { title: 'Work Rider',        wage: 26000, detectChance: 0.50, leadTime: 1, horsesCovered: 3, signal: 'vague' },
    4: { title: 'Head Lad',          wage: 36000, detectChance: 0.72, leadTime: 2, horsesCovered: 4, signal: 'precise' },
    5: { title: 'Assistant Trainer', wage: 50000, detectChance: 0.90, leadTime: 3, horsesCovered: 5, signal: 'precise' }
};

const BREWING_VET_COST = 2500;

function getStaffTier(member) {
    return STAFF_TIERS[member && member.skill] || STAFF_TIERS[3];
}

function getStaffWage(member) {
    return (member && member.wage) || getStaffTier(member).wage;
}

/**
 * Total horses the yard can keep a proper eye on.
 */
function getStaffCoverage() {
    return (GameState.staff || []).reduce((sum, s) => sum + getStaffTier(s).horsesCovered, 0);
}

/**
 * Share the stable out between staff, best eyes first.
 * Horses past the yard's coverage go unobserved - that's the shortage penalty.
 */
function assignObservationDuties() {
    const duties = new Map();
    const staff = [...(GameState.staff || [])].sort((a, b) => (b.skill || 3) - (a.skill || 3));
    const watchable = GameState.horses.filter(h => !h.isYearling && !h.isInjured);

    let idx = 0;
    staff.forEach(member => {
        const capacity = getStaffTier(member).horsesCovered;
        for (let i = 0; i < capacity && idx < watchable.length; i++, idx++) {
            duties.set(watchable[idx].id, member);
        }
    });
    return duties;
}

/**
 * Start new problems brewing quietly. Nothing visible happens yet.
 */
function rollBrewingIssues() {
    GameState.horses.forEach(horse => {
        if (horse.isInjured || horse.isYearling) return;
        if (horse.brewing) return; // one at a time

        for (const setback of SETBACK_TYPES) {
            if (Math.random() < setback.chance) {
                horse.brewing = {
                    type: setback.name,
                    roundsUntilOnset: randomInt(1, 3),
                    spotted: false,
                    spottedBy: null
                };
                break;
            }
        }
    });
}

/**
 * Mature any brewing issue whose time is up and apply the damage.
 * A horse left without a training focus while something brews is being
 * eased - it either shakes the problem off or gets off lightly.
 */
function resolveBrewingIssues() {
    const setbackReports = [];

    GameState.horses.forEach(horse => {
        const brewing = horse.brewing;
        if (!brewing) return;

        if (horse.isInjured || horse.isYearling) {
            horse.brewing = null;
            return;
        }

        brewing.roundsUntilOnset--;
        if (brewing.roundsUntilOnset > 0) return;

        const setback = SETBACK_TYPES.find(s => s.name === brewing.type);
        if (!setback) {
            horse.brewing = null;
            return;
        }

        const eased = !horse.trainingFocus;
        if (eased && Math.random() < 0.4) {
            setbackReports.push({
                horse: horse.name,
                setbackName: brewing.type,
                description: 'was eased off in time and has come right',
                affectedStats: [],
                averted: true,
                eased: true
            });
            horse.brewing = null;
            return;
        }

        const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
        const affectedStats = [];
        const applyLoss = (stat) => {
            let loss = randomInt(setback.statLoss[0], setback.statLoss[1]);
            if (eased) loss = Math.max(1, Math.floor(loss / 2));
            horse[stat] = Math.max(horse[stat] - loss, 20);
            affectedStats.push({ stat: stat, loss: loss });
        };

        if (setback.affectedStat) {
            applyLoss(setback.affectedStat);
        } else {
            for (let i = 0; i < setback.numStats; i++) {
                applyLoss(stats[randomInt(0, stats.length - 1)]);
            }
        }

        setbackReports.push({
            horse: horse.name,
            setbackName: setback.name,
            description: setback.description,
            affectedStats: affectedStats,
            averted: false,
            eased: eased
        });

        horse.brewing = null;
    });

    return setbackReports;
}

/**
 * Perception checks. The data is identical for every yard - only the
 * quality of the report changes.
 */
function generateStaffObservations() {
    const observations = [];
    const duties = assignObservationDuties();

    GameState.horses.forEach(horse => {
        const brewing = horse.brewing;
        if (!brewing) return;

        const member = duties.get(horse.id);
        if (!member) return;

        const tier = getStaffTier(member);
        if (tier.signal === 'none') return;
        if (brewing.roundsUntilOnset > tier.leadTime) return;

        // Report once when first noticed, then one last nudge the raceday
        // before it bites. Anything more just becomes noise.
        if (brewing.spotted && brewing.roundsUntilOnset > 1) return;
        if (Math.random() > tier.detectChance) return;

        brewing.spotted = true;
        brewing.spottedBy = member.name;

        const signal = SETBACK_SIGNALS[brewing.type];
        const text = (tier.signal === 'precise' && signal)
            ? `${horse.name} ${signal.precise}. I'd ${signal.advice}.`
            : `${horse.name} ${VAGUE_OBSERVATIONS[randomInt(0, VAGUE_OBSERVATIONS.length - 1)]}.`;

        observations.push({
            horseId: horse.id,
            horse: horse.name,
            staff: member.name,
            title: tier.title,
            signal: tier.signal,
            text: text,
            roundsUntilOnset: tier.signal === 'precise' ? brewing.roundsUntilOnset : null
        });
    });

    return observations;
}

/**
 * Horses the player has been warned about and can still act on.
 */
function getSpottedBrewingHorses() {
    return GameState.horses
        .map((h, i) => ({ horse: h, idx: i }))
        .filter(x => x.horse.brewing && x.horse.brewing.spotted && !x.horse.isInjured);
}

function checkForSetbacks() {
    const setbackReports = resolveBrewingIssues();
    rollBrewingIssues();
    return setbackReports;
}

// ============================================
// BLOODSTOCK & BREEDING
// ============================================

// Transient UI state for the Stud Farm panel (not persisted)
const StudFarmState = {
    view: 'band',
    selectedMareId: null
};

const BROODMARE_KEEP_PER_SEASON = 8000;
const FOAL_KEEP_PER_SEASON = 4000;
const BROODMARE_RETIREMENT_AGE = 7;
const MAX_BREEDING_AGE = 18;

/**
 * Colts and fillies. Yearlings aren't gelded yet; some older males are.
 */
function generateSex(isYearling) {
    const roll = Math.random();
    if (isYearling) return roll < 0.5 ? 'filly' : 'colt';
    if (roll < 0.45) return 'filly';
    if (roll < 0.82) return 'colt';
    return 'gelding';
}

function isBreedingFemale(horse) {
    return horse && horse.sex === 'filly';
}

/**
 * Fashion inflates the fee but never the foal. Overpaying for a name is
 * the player's mistake to make.
 */
function calculateStudFee(stats, fashion) {
    const merit = (stats.speed + stats.stamina + stats.acceleration + stats.temperament) / 4;
    const base = Math.pow(merit / 50, 3) * 9000;
    return Math.max(2000, Math.round(base * fashion / 500) * 500);
}

function generateStallion(tierRoll) {
    const tier = tierRoll < 0.35 ? 'medium' : tierRoll < 0.75 ? 'high' : 'elite';
    const stats = generateHorseAttributes(tier);
    // Fashion runs from unfashionable bargain to hyped-up first-season sire
    const fashion = 0.65 + Math.random() * 1.6;
    const stallion = {
        id: generateId(),
        name: generateSireName(),
        ...stats,
        fashion: fashion,
        isJumpSire: Math.random() < 0.3,
        firstSeason: Math.random() < 0.25
    };
    stallion.fee = calculateStudFee(stallion, fashion);
    return stallion;
}

function generateStallionRoster() {
    GameState.stallions = Array.from({ length: 6 }, () => generateStallion(Math.random()));
}

function getStallionBadge(stallion) {
    if (stallion.firstSeason) return 'First-season sire';
    if (stallion.fashion >= 1.75) return 'Fashionable';
    if (stallion.fashion <= 0.85) return 'Out of fashion';
    return '';
}

/**
 * A deliberately imprecise read of a young horse. The eye is not a
 * measuring tape - what you see is the truth plus noise.
 */
const CONFORMATION_GOOD = {
    speed:        ['is sharp and quick-looking', 'has a fast, low action'],
    stamina:      ['has plenty of scope and a good frame', 'is a great, rangy sort'],
    acceleration: ['is athletic and light on their feet', 'moves beautifully'],
    temperament:  ['has a lovely kind eye', 'takes it all in their stride']
};
const CONFORMATION_POOR = {
    speed:        ['looks a shade one-paced', 'is a bit heavy in front'],
    stamina:      ['is on the small side', 'looks a bit weak behind'],
    acceleration: ['is plain and a little flat-footed', 'is somewhat straight in front'],
    temperament:  ['is on their toes and a bit fizzy', 'is quite babyish and fretful']
};
const CONFORMATION_WALK = [
    'Walks well.', 'A bit plain, but correct.', 'Leggy and needs time.',
    'A straightforward, likeable sort.', 'Backward now, should make up into something.'
];

function generateConformationReport(stats) {
    const keys = ['speed', 'stamina', 'acceleration', 'temperament'];
    // The eye is out by up to 15 points either way
    const seen = keys.map(k => ({ key: k, value: stats[k] + randomInt(-15, 15) }));
    seen.sort((a, b) => b.value - a.value);

    const best = seen[0], worst = seen[seen.length - 1];
    const pick = (pool) => pool[randomInt(0, pool.length - 1)];

    const lines = [
        capitalizeFirst(pick(CONFORMATION_GOOD[best.key])) + '.',
        capitalizeFirst(pick(CONFORMATION_POOR[worst.key])) + '.',
        pick(CONFORMATION_WALK)
    ];
    return lines.join(' ');
}

/**
 * Retire a filly or mare to the broodmare band. She stops earning and
 * starts costing - the bet is on what she produces.
 */
function retireToStud(horseIdx) {
    const horse = GameState.horses[horseIdx];
    if (!horse || !isBreedingFemale(horse) || horse.isYearling) return false;

    GameState.broodmares = GameState.broodmares || [];
    GameState.broodmares.push({
        id: horse.id,
        name: horse.name,
        age: horse.age,
        speed: horse.speed,
        stamina: horse.stamina,
        acceleration: horse.acceleration,
        temperament: horse.temperament,
        isJumper: horse.isJumper,
        jumpAbility: horse.jumpAbility,
        distancePreference: horse.distancePreference,
        groundPreference: horse.groundPreference,
        silkPrimary: horse.silkPrimary,
        silkSecondary: horse.silkSecondary,
        sire: horse.sire || null,
        dam: horse.dam || null,
        careerWins: horse.wins || 0,
        retiredSeason: GameState.season,
        coveredBy: null,
        inFoal: false,
        dueSeason: null
    });

    GameState.horses.splice(horseIdx, 1);
    return true;
}

/**
 * Pay the nomination fee and send a mare to a stallion. The foal arrives
 * next season; what it's worth won't be clear for two more.
 */
function coverMare(mareId, stallionId) {
    GameState.broodmares = GameState.broodmares || [];
    const mare = GameState.broodmares.find(m => m.id === mareId);
    const stallion = (GameState.stallions || []).find(s => s.id === stallionId);
    if (!mare || !stallion || mare.inFoal) return false;
    if (mare.age > MAX_BREEDING_AGE) return false;
    if (GameState.budget < stallion.fee) return false;

    GameState.budget -= stallion.fee;
    mare.inFoal = true;
    mare.dueSeason = GameState.season + 1;
    mare.coveredBy = {
        id: stallion.id,
        name: stallion.name,
        speed: stallion.speed,
        stamina: stallion.stamina,
        acceleration: stallion.acceleration,
        temperament: stallion.temperament,
        isJumpSire: stallion.isJumpSire,
        feePaid: stallion.fee
    };
    return true;
}

/**
 * Season rollover for the bloodstock: foals are born, last year's foals
 * become yearlings and join the stable, and everything eats.
 */
function processBreedingSeason() {
    GameState.broodmares = GameState.broodmares || [];
    GameState.foals = GameState.foals || [];

    // Run at the season ceremony, which is the handover into the next season
    const newSeason = GameState.season + 1;
    const report = { born: [], weaned: [], pensioned: [], keepCost: 0 };

    // Last season's foals become yearlings and enter the stable un-named
    const graduating = GameState.foals.filter(f => newSeason >= f.bornSeason + 1);
    graduating.forEach(foal => {
        const yearling = buildYearlingFromFoal(foal);
        GameState.horses.push(yearling);
        report.weaned.push({ name: `${foal.sireName} x ${foal.damName}`, id: yearling.id });
    });
    GameState.foals = GameState.foals.filter(f => newSeason < f.bornSeason + 1);

    // Every mare in the band gets a year older, in foal or not
    GameState.broodmares.forEach(mare => { mare.age++; });

    // In-foal mares produce
    GameState.broodmares.forEach(mare => {
        if (!mare.inFoal || newSeason < mare.dueSeason) return;

        const sireStats = mare.coveredBy;
        const damStats = { speed: mare.speed, stamina: mare.stamina, acceleration: mare.acceleration, temperament: mare.temperament };
        const derived = generateYearlingAttributes(sireStats, damStats);

        const foal = {
            id: generateId(),
            sireName: mare.coveredBy.name,
            damName: mare.name,
            damId: mare.id,
            sire: { name: mare.coveredBy.name, speed: sireStats.speed, stamina: sireStats.stamina, acceleration: sireStats.acceleration, temperament: sireStats.temperament },
            dam: { name: mare.name, speed: mare.speed, stamina: mare.stamina, acceleration: mare.acceleration, temperament: mare.temperament },
            ...derived,
            sex: generateSex(true),
            bornSeason: newSeason,
            isJumper: (mare.coveredBy.isJumpSire || mare.isJumper) && Math.random() < 0.5,
            conformation: null
        };
        foal.jumpAbility = foal.isJumper ? randomInt(30, 70) : 0;
        foal.conformation = generateConformationReport(derived);

        GameState.foals.push(foal);
        report.born.push({ name: `${foal.sireName} x ${foal.damName}`, conformation: foal.conformation });

        mare.inFoal = false;
        mare.dueSeason = null;
        mare.coveredBy = null;
    });

    // Mares past breeding age are pensioned off and stop costing keep
    const pensioned = GameState.broodmares.filter(m => m.age > MAX_BREEDING_AGE && !m.inFoal);
    pensioned.forEach(m => report.pensioned.push(m.name));
    GameState.broodmares = GameState.broodmares.filter(m => !(m.age > MAX_BREEDING_AGE && !m.inFoal));

    report.keepCost = GameState.broodmares.length * BROODMARE_KEEP_PER_SEASON
                    + GameState.foals.length * FOAL_KEEP_PER_SEASON;
    GameState.budget -= report.keepCost;

    generateStallionRoster();
    generateBroodmareSaleCatalogue();
    return report;
}

/**
 * Turn a foal into a proper yearling in the stable. Stats stay hidden
 * behind the existing 'Un-named' flow until the player names it.
 */
function buildYearlingFromFoal(foal) {
    const silk = SILK_COLOURS[randomInt(0, SILK_COLOURS.length - 1)];
    const yearling = {
        id: foal.id,
        name: 'Un-named',
        age: 1,
        speed: foal.speed,
        stamina: foal.stamina,
        acceleration: foal.acceleration,
        temperament: foal.temperament,
        sex: foal.sex,
        condition: 100,
        trainingFocus: null,
        racesRun: 0,
        wins: 0,
        totalEarnings: 0,
        isInjured: false,
        injuryType: null,
        recoveryRacesLeft: 0,
        brewing: null,
        paddockTurnedOut: false,
        fedThisRound: false,
        tackedUp: { saddle: false, bridle: false },
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        isYearling: true,
        isRaceReady: false,
        sire: foal.sire,
        dam: foal.dam,
        isHomeBred: true,
        conformation: foal.conformation,
        pendingAuction: false,
        reservePrice: 0,
        stallCare: { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 }
    };
    yearling.isJumper = foal.isJumper;
    yearling.jumpAbility = foal.jumpAbility;
    yearling.flatRacesCompleted = 0;
    yearling.estimatedValue = calculateYearlingValue(foal.sire, foal.dam);
    yearling.officialRating = null;
    yearling.ratingHistory = [];
    yearling.tacticalSuitability = generateTacticalSuitability(yearling);
    return yearling;
}

// ============================================
// BROODMARE SALES RING
// ============================================

/**
 * What a mare is worth as a breeding prospect: ability, age, what she did
 * on the track, and whether she's carrying.
 */
function calculateBroodmareValue(mare) {
    const merit = (mare.speed + mare.stamina + mare.acceleration + mare.temperament) / 4;
    let value = Math.pow(merit / 50, 2.6) * 22000;

    // Young mares have more foals left in them; old ones are nearly done
    const age = mare.age || 8;
    if (age <= 5)      value *= 1.25;
    else if (age <= 9) value *= 1.0;
    else if (age <= 13) value *= 0.7;
    else                value *= 0.35;

    value *= 1 + Math.min(mare.careerWins || 0, 8) * 0.06;

    // A mare in foal carries the nomination fee and a season of waiting with her
    if (mare.inFoal && mare.coveredBy) {
        value += (mare.coveredBy.feePaid || 0) * 0.8;
    }

    return Math.max(3000, Math.round(value / 500) * 500);
}

function generateSaleBroodmare() {
    const tierRoll = Math.random();
    const tier = tierRoll < 0.4 ? 'medium' : tierRoll < 0.8 ? 'high' : 'elite';
    const stats = generateHorseAttributes(tier);
    const silk = SILK_COLOURS[randomInt(0, SILK_COLOURS.length - 1)];

    const mare = {
        id: generateId(),
        name: generateDamName(),
        age: randomInt(4, 14),
        ...stats,
        isJumper: Math.random() < 0.3,
        jumpAbility: 0,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        sire: { name: generateSireName() },
        dam: { name: generateDamName() },
        careerWins: randomInt(0, 9),
        retiredSeason: GameState.season,
        coveredBy: null,
        inFoal: false,
        dueSeason: null
    };
    mare.jumpAbility = mare.isJumper ? randomInt(30, 70) : 0;

    // Roughly a third of the ring is already in foal - you buy the covering too
    if (Math.random() < 0.35 && mare.age <= MAX_BREEDING_AGE - 1) {
        const sire = generateStallion(Math.random());
        mare.inFoal = true;
        mare.dueSeason = GameState.season + 1;
        mare.coveredBy = {
            id: sire.id,
            name: sire.name,
            speed: sire.speed,
            stamina: sire.stamina,
            acceleration: sire.acceleration,
            temperament: sire.temperament,
            isJumpSire: sire.isJumpSire,
            feePaid: sire.fee
        };
    }

    mare.askingPrice = calculateBroodmareValue(mare);
    return mare;
}

function generateBroodmareSaleCatalogue() {
    GameState.broodmareSale = Array.from({ length: 5 }, () => generateSaleBroodmare());
}

function buyBroodmare(mareId) {
    GameState.broodmareSale = GameState.broodmareSale || [];
    GameState.broodmares = GameState.broodmares || [];

    const idx = GameState.broodmareSale.findIndex(m => m.id === mareId);
    if (idx === -1) return false;
    const mare = GameState.broodmareSale[idx];
    if (GameState.budget < mare.askingPrice) return false;

    GameState.budget -= mare.askingPrice;
    const { askingPrice, ...band } = mare;
    GameState.broodmares.push(band);
    GameState.broodmareSale.splice(idx, 1);
    return true;
}

/**
 * The ring's bid for one of your mares. It varies either side of her real
 * worth, so selling is a small gamble of its own.
 */
function getBroodmareBid(mare) {
    const value = calculateBroodmareValue(mare);
    const swing = 0.85 + Math.random() * 0.3;
    return Math.max(2000, Math.round(value * swing / 500) * 500);
}

function sellBroodmare(mareId, bid) {
    GameState.broodmares = GameState.broodmares || [];
    const idx = GameState.broodmares.findIndex(m => m.id === mareId);
    if (idx === -1) return false;

    GameState.budget += bid;
    GameState.broodmares.splice(idx, 1);
    return true;
}

function getBloodstockKeepCost() {
    return (GameState.broodmares || []).length * BROODMARE_KEEP_PER_SEASON
         + (GameState.foals || []).length * FOAL_KEEP_PER_SEASON;
}

// ============================================
// SCREEN NAVIGATION
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

// ============================================
// GAME INITIALIZATION
// ============================================

/**
 * Initialize AI competitors (Phase 2: with silk colours)
 */
function initializeCompetitors() {
    GameState.competitors = [];

    const usedNames = new Set();
    const usedColours = new Set();

    for (let i = 0; i < 5; i++) {
        let name;
        do {
            name = AI_TRAINER_NAMES[randomInt(0, AI_TRAINER_NAMES.length - 1)];
        } while (usedNames.has(name));
        usedNames.add(name);

        // Assign unique colours to AI trainers
        let colourIdx;
        do {
            colourIdx = randomInt(0, SILK_COLOURS.length - 1);
        } while (usedColours.has(colourIdx));
        usedColours.add(colourIdx);
        const silk = SILK_COLOURS[colourIdx];

        const trainer = {
            id: generateId(),
            name: name,
            points: 0,
            isPlayer: false,
            silkPrimary: silk.primary,
            silkSecondary: silk.secondary,
            horses: []
        };

        // Generate persistent AI stable
        trainer.horses = generateAIStable(trainer);

        GameState.competitors.push(trainer);
    }

    GameState.standings = [
        { id: 'player', name: GameState.stableName, points: 0, isPlayer: true },
        ...GameState.competitors
    ];
}

function initializeRaceCalendar() {
    GameState.racedays = [];
    for (let i = 1; i <= 10; i++) {
        GameState.racedays.push(generateRaceday(i));
    }
    GameState.currentRaceday = 0;
    GameState.currentRacedayRaceIndex = 0;
    GameState.raceResults = GameState.raceResults || [];

    // Keep legacy references for compatibility
    GameState.races = GameState.racedays[0] ? GameState.racedays[0].races : [];
    GameState.currentRaceIndex = 0;
}

function startNewGame(stableName, budget, difficulty, trainingCentre, settings) {
    GameState.stableName = stableName || 'My Racing Stable';
    GameState.budget = budget;
    GameState.difficulty = difficulty;
    GameState.trainingCentre = trainingCentre || 'newmarket';
    GameState.settings = settings || { raceDifficulty: 'medium', careNeeds: 'medium', staffAutomation: false };
    GameState.season = 1;
    GameState.seasonPoints = 0;
    GameState.horses = [];

    initializeCompetitors();
    initializeRaceCalendar();

    openYardHub();
}

// ============================================
// PHASE 2: SILK COLOUR PICKER
// ============================================

function renderTrainingCentrePicker() {
    const container = document.getElementById('training-centre-picker');
    if (!container) return;

    container.innerHTML = Object.entries(TRAINING_CENTRES).map(([key, centre], i) => `
        <div class="centre-card ${i === 0 ? 'selected' : ''}"
             data-centre="${key}">
            <div class="centre-card-swatch" style="background:${centre.theme.grass}">
                <div class="centre-card-accent" style="background:${centre.theme.path}"></div>
            </div>
            <div class="centre-card-info">
                <div class="centre-card-name">${centre.name}</div>
                <div class="centre-card-desc">${centre.description}</div>
            </div>
        </div>
    `).join('');

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.centre-card');
        if (!card) return;
        container.querySelectorAll('.centre-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });
}

function renderSilkColourPicker() {
    const container = document.getElementById('silk-colour-picker');
    if (!container) return;

    container.innerHTML = SILK_COLOURS.map((c, i) => `
        <div class="silk-picker-swatch ${i === 0 ? 'selected' : ''}"
             data-index="${i}"
             style="--silk-primary:${c.primary};--silk-secondary:${c.secondary}"
             title="${c.name}">
        </div>
    `).join('');

    // Default to first
    GameState.silkPrimary = SILK_COLOURS[0].primary;
    GameState.silkSecondary = SILK_COLOURS[0].secondary;

    container.addEventListener('click', (e) => {
        const swatch = e.target.closest('.silk-picker-swatch');
        if (!swatch) return;
        container.querySelectorAll('.silk-picker-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const idx = parseInt(swatch.dataset.index);
        GameState.silkPrimary = SILK_COLOURS[idx].primary;
        GameState.silkSecondary = SILK_COLOURS[idx].secondary;
    });
}

/**
 * Build a silk swatch HTML snippet
 */
function silkSwatchHTML(primary, secondary, extraClass) {
    const cls = extraClass ? `silk-swatch ${extraClass}` : 'silk-swatch';
    return `<span class="${cls}" style="--silk-primary:${primary};--silk-secondary:${secondary}"></span>`;
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateDashboard() {
    document.getElementById('display-stable-name').textContent = GameState.stableName;
    document.getElementById('display-budget').textContent = formatMoney(GameState.budget);
    document.getElementById('display-season').textContent = GameState.season;
    document.getElementById('horse-count').textContent = GameState.horses.length;

    updateNextRaceDisplay();
    updateStandingsDisplay();
    updateXPDisplay();
}

function updateNextRaceDisplay() {
    const nextRaceContainer = document.getElementById('next-race-info');
    const currentRaceday = GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null;

    if (currentRaceday && !currentRaceday.completed) {
        // Count eligible horses for this raceday
        const raceEligible = GameState.horses.filter(h => !h.isYearling && !h.isInjured && !h.pendingAuction && h.tackedUp?.saddle && h.tackedUp?.bridle);
        let eligibleRaceCount = 0;
        currentRaceday.races.forEach(race => {
            const eligible = getEligibleHorsesForBand(raceEligible, race.ratingBand);
            if (eligible.length > 0) eligibleRaceCount++;
        });

        nextRaceContainer.innerHTML = `
            <div class="race-name">Raceday ${currentRaceday.racedayNumber} of 10</div>
            <div class="race-details">
                8 races on the card<br>
                You can enter ${eligibleRaceCount} race${eligibleRaceCount !== 1 ? 's' : ''}
            </div>
            <div class="race-prize" style="font-size:0.9em;color:var(--color-text-light);">Click Races to view the card</div>
        `;
        document.getElementById('next-race').textContent = `Raceday ${currentRaceday.racedayNumber}`;
    } else {
        nextRaceContainer.innerHTML = `
            <div class="race-name">Season Complete</div>
            <div class="race-details">All racedays finished!</div>
        `;
        document.getElementById('next-race').textContent = 'Complete';
    }
}

function updateStandingsDisplay() {
    const standingsList = document.getElementById('standings-list');
    const sorted = [...GameState.standings].sort((a, b) => b.points - a.points);

    standingsList.innerHTML = sorted.map((trainer, index) => `
        <div class="standing-item ${trainer.isPlayer ? 'you' : ''}">
            <span class="standing-position">${index + 1}.</span>
            <span class="standing-name">${trainer.name}${trainer.isPlayer ? ' (You)' : ''}</span>
            <span class="standing-points">${trainer.points} pts</span>
        </div>
    `).join('');
}

function updateContinueButton() {
    const savedGame = localStorage.getItem('championTrainer_save');
    const continueBtn = document.getElementById('btn-continue');
    continueBtn.disabled = !savedGame;
}

// ============================================
// SAVE / LOAD (Phase 2: migration for silks)
// ============================================

async function saveGame() {
    GameState.lastSaved = new Date().toISOString();
    const saveData = JSON.stringify(GameState);
    localStorage.setItem('championTrainer_save', saveData);
    await gameAlert('Game Saved', 'Your progress has been saved successfully.');
}

function loadGame() {
    const saveData = localStorage.getItem('championTrainer_save');
    if (saveData) {
        const loaded = JSON.parse(saveData);
        Object.assign(GameState, loaded);

        // Migration: add silk colours if missing
        if (!GameState.silkPrimary) {
            GameState.silkPrimary = SILK_COLOURS[0].primary;
            GameState.silkSecondary = SILK_COLOURS[0].secondary;
        }
        GameState.horses.forEach(h => {
            if (!h.silkPrimary) {
                h.silkPrimary = GameState.silkPrimary;
                h.silkSecondary = GameState.silkSecondary;
            }
        });
        if (GameState.competitors) {
            GameState.competitors.forEach((c, i) => {
                if (!c.silkPrimary) {
                    const silk = SILK_COLOURS[(i + 2) % SILK_COLOURS.length];
                    c.silkPrimary = silk.primary;
                    c.silkSecondary = silk.secondary;
                }
            });
        }

        // Migration: add distance/ground preferences if missing
        GameState.horses.forEach(h => {
            if (!h.distancePreference) {
                h.distancePreference = DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)];
            }
            if (!h.groundPreference) {
                h.groundPreference = GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)];
            }
        });
        if (GameState.races) {
            GameState.races.forEach((r, i) => {
                // Migration: reconstruct distance data from RACE_NAMES if missing
                if (!r.distanceFurlongs && RACE_NAMES[i]) {
                    r.distanceFurlongs = RACE_NAMES[i].distanceFurlongs;
                    r.distance = RACE_NAMES[i].distance;
                    r.name = r.name || RACE_NAMES[i].name;
                    r.prize = r.prize || RACE_NAMES[i].prize;
                }
                if (!r.ground) {
                    r.ground = GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)];
                }
            });
        }

        // Migration: add yearling properties if missing
        GameState.horses.forEach(h => {
            if (h.isYearling === undefined) h.isYearling = false;
            if (h.isRaceReady === undefined) h.isRaceReady = true;
        });

        // Migration: add official rating and rating history if missing
        GameState.horses.forEach(h => {
            if (h.officialRating === undefined) {
                h.officialRating = h.isYearling ? null : calculateOfficialRating(h);
            }
            if (!h.ratingHistory) {
                h.ratingHistory = [];
            }
        });
        // Migration: add race type if missing
        if (GameState.races) {
            GameState.races.forEach((r, i) => {
                if (!r.type && RACE_NAMES[i]) {
                    r.type = RACE_NAMES[i].type;
                }
            });
        }

        // Migration: add selling auction properties if missing
        GameState.horses.forEach(h => {
            if (h.pendingAuction === undefined) h.pendingAuction = false;
            if (h.reservePrice === undefined) h.reservePrice = 0;
        });

        // Migration: add yard economy fields if missing
        if (GameState.maxStalls === undefined) GameState.maxStalls = 10;
        if (GameState.feedSupply === undefined) GameState.feedSupply = 20;
        if (!GameState.tack) GameState.tack = { saddles: 2, bridles: 2, rugs: 4 };
        if (GameState.barnExpansions === undefined) GameState.barnExpansions = 0;

        // Migration: add forage & bedding if missing
        if (!GameState.forage) GameState.forage = { hay: 10, straw: 5, shavings: 5, carrots: 0 };
        if (GameState.forage && GameState.forage.carrots === undefined) GameState.forage.carrots = 0;

        // Migration: add barn upgrades if missing
        if (!GameState.barnUpgrades) GameState.barnUpgrades = { rubberMatting: false, autoWaterers: false, climateControl: false };

        // Migration: add lorry ownership if missing
        if (GameState.ownsLorry === undefined) GameState.ownsLorry = false;
        // Migration: add car ownership if missing
        if (GameState.ownsCar === undefined) GameState.ownsCar = false;

        // Migration: add fedThisRound if missing
        GameState.horses.forEach(h => {
            if (h.fedThisRound === undefined) h.fedThisRound = false;
        });

        // Migration: add tackedUp if missing
        GameState.horses.forEach(h => {
            if (!h.tackedUp) h.tackedUp = { saddle: false, bridle: false };
        });

        // Migration: add stallCare if missing
        GameState.horses.forEach(h => {
            if (!h.stallCare) h.stallCare = { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
            if (h.neglectCounter === undefined) h.neglectCounter = 0;
        });

        // Migration: add staff system
        if (!GameState.staff) GameState.staff = [];
        if (!GameState.staffWagePerSeason) GameState.staffWagePerSeason = 20000;

        // Migration: staff perception system - existing staff become Work Riders
        // but keep the flat rate they were already being paid.
        GameState.staff.forEach(s => {
            if (s.skill === undefined) s.skill = 3;
            if (s.wage === undefined) s.wage = GameState.staffWagePerSeason || 20000;
        });
        if (!GameState.staffCandidates) GameState.staffCandidates = [];

        // Migration: brewing setbacks
        GameState.horses.forEach(h => {
            if (h.brewing === undefined) h.brewing = null;
        });

        // Migration: bloodstock & breeding
        GameState.horses.forEach(h => {
            if (!h.sex) h.sex = generateSex(!!h.isYearling);
        });
        if (!GameState.broodmares) GameState.broodmares = [];
        if (!GameState.foals) GameState.foals = [];
        if (!GameState.stallions || GameState.stallions.length === 0) generateStallionRoster();
        if (!GameState.broodmareSale || GameState.broodmareSale.length === 0) generateBroodmareSaleCatalogue();

        // Migration: reputation. Seed from career record so an established
        // save doesn't start from nothing. Test the parsed save rather than
        // GameState - Object.assign leaves the default in place for a key
        // the old save never had.
        if (loaded.reputation === undefined || loaded.reputation === null) {
            const careerWins = GameState.horses.reduce((sum, h) => sum + (h.wins || 0), 0);
            const seasons = Math.max(0, (GameState.season || 1) - 1);
            GameState.reputation = Math.max(0, Math.min(100, careerWins * 3 + seasons * 5));
        }

        // Migration: add settings if missing
        if (!GameState.settings) {
            GameState.settings = {
                raceDifficulty: GameState.difficulty || 'medium',
                careNeeds: 'medium',
                staffAutomation: false
            };
        }

        // Migration: add training centre if missing
        if (!GameState.trainingCentre) GameState.trainingCentre = 'newmarket';

        // Migration: add XP/level system
        if (GameState.xp === undefined) GameState.xp = 0;
        if (GameState.level === undefined) GameState.level = 1;
        if (!GameState.unlockedRewards) GameState.unlockedRewards = [];

        // Migration: add owners system
        if (!GameState.owners) GameState.owners = [];

        // Migration: add pets and pest state
        if (!GameState.pets) GameState.pets = [];
        if (!GameState.pestState) GameState.pestState = { rats: [], pigeons: [], foxes: [] };

        // Migration: add betting system
        if (!GameState.activeBets) GameState.activeBets = [];
        if (!GameState.bettingHistory) GameState.bettingHistory = [];

        // Migration: add jump racing attributes
        GameState.horses.forEach(h => {
            if (h.isJumper === undefined) h.isJumper = false;
            if (h.jumpAbility === undefined) h.jumpAbility = 0;
            if (h.flatRacesCompleted === undefined) h.flatRacesCompleted = h.racesRun || 0;
        });
        GameState.horses.forEach(h => {
            if (h.ownerId === undefined) h.ownerId = null;
            if (h.ownerName === undefined) h.ownerName = null;
        });

        // Migration: add tactical suitability to horses
        GameState.horses.forEach(h => {
            if (!h.tacticalSuitability) {
                h.tacticalSuitability = generateTacticalSuitability(h);
            }
        });
        // Also add to AI stable horses
        if (GameState.competitors) {
            GameState.competitors.forEach(c => {
                if (c.horses) {
                    c.horses.forEach(h => {
                        if (!h.tacticalSuitability) {
                            h.tacticalSuitability = generateTacticalSuitability(h);
                        }
                    });
                }
            });
        }

        // Migration: recalculate OR on 0-100 scale (was 0-140)
        GameState.horses.forEach(h => {
            if (h.officialRating != null && !h.isYearling) {
                h.officialRating = calculateOfficialRating(h);
            }
            if (!h.form) h.form = [];
        });

        // Migration: add raceday system
        if (!GameState.racedays) {
            GameState.racedays = [];
            for (let i = 1; i <= 10; i++) {
                GameState.racedays.push(generateRaceday(i));
            }
            GameState.currentRaceday = 0;
            GameState.currentRacedayRaceIndex = 0;
        }
        if (GameState.currentRaceday === undefined) GameState.currentRaceday = 0;

        // Migration: add results database
        if (!GameState.raceResults) GameState.raceResults = [];

        // Migration: add AI stables
        if (GameState.competitors) {
            GameState.competitors.forEach(trainer => {
                if (!trainer.horses || trainer.horses.length === 0) {
                    trainer.horses = generateAIStable(trainer);
                }
                // Recalculate AI horse ORs on new 0-100 scale
                trainer.horses.forEach(h => {
                    if (h.officialRating != null) {
                        h.officialRating = calculateOfficialRating(h);
                    }
                    if (!h.form) h.form = [];
                });
            });
        }

        // Keep legacy references
        GameState.races = GameState.racedays[GameState.currentRaceday] ? GameState.racedays[GameState.currentRaceday].races : [];
        GameState.currentRaceIndex = 0;

        openYardHub();
        return true;
    }
    return false;
}

// ============================================
// AUCTION SYSTEM
// ============================================

const AuctionState = {
    catalogue: [],
    playerBids: {},
    currentLotIndex: 0,
    results: [],
    horsesWon: [],
    totalSpent: 0
};

const SellingAuctionState = {
    catalogue: [],
    currentLotIndex: 0,
    results: [],
    totalRevenue: 0,
    returnScreen: 'between-races'
};

function generateAuctionCatalogue() {
    AuctionState.catalogue = [];
    AuctionState.playerBids = {};
    AuctionState.currentLotIndex = 0;
    AuctionState.results = [];
    AuctionState.horsesWon = [];
    AuctionState.totalSpent = 0;

    const qualities = getCatalogueQualities();

    for (let i = 0; i < 8; i++) {
        const horse = generateHorse(qualities[i]);
        AuctionState.catalogue.push(horse);
    }
}

/**
 * Render horse card (Phase 2: with silk swatch)
 */
function renderHorseCard(horse) {
    const playerBid = AuctionState.playerBids[horse.id] || 0;
    const isSelected = playerBid > 0;
    const swatch = silkSwatchHTML(horse.silkPrimary, horse.silkSecondary);

    return `
        <div class="horse-card ${isSelected ? 'selected' : ''}" data-horse-id="${horse.id}">
            <div class="horse-card-header">
                <span class="horse-name">${swatch}${horse.name}</span>
                <span class="horse-age">${horse.age} yrs</span>
            </div>
            <div class="horse-stats">
                <div class="stat-row">
                    <span class="stat-label">Speed</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar speed" style="width: ${horse.speed}%"></div>
                    </div>
                    <span class="stat-value">${horse.speed}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Stamina</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar stamina" style="width: ${horse.stamina}%"></div>
                    </div>
                    <span class="stat-value">${horse.stamina}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Acceleration</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar acceleration" style="width: ${horse.acceleration}%"></div>
                    </div>
                    <span class="stat-value">${horse.acceleration}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Temperament</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar temperament" style="width: ${horse.temperament}%"></div>
                    </div>
                    <span class="stat-value">${horse.temperament}</span>
                </div>
            </div>
            <div class="horse-preferences">
                <span class="pref-tag pref-distance"><span class="pref-icon">\u{1F3C7}</span> ${DISTANCE_PREF_LABELS[horse.distancePreference] || horse.distancePreference}</span>
                <span class="pref-tag pref-ground"><span class="pref-icon">\u{1F33F}</span> ${horse.groundPreference}</span>
            </div>
            <div class="horse-value">
                <span class="value-label">Guide Price</span>
                <span class="value-amount">\u00A3${formatMoney(horse.estimatedValue)}</span>
            </div>
            <div class="bid-interest-group">
                <button class="interest-btn ${isSelected ? 'interested' : ''}" data-horse-id="${horse.id}" onclick="toggleAuctionInterest('${horse.id}')">
                    ${isSelected ? '\u2714 Interested' : 'Interested'}
                </button>
                <button class="skip-btn ${AuctionState.skippedLots?.has(horse.id) ? 'skipped' : ''}" data-horse-id="${horse.id}" onclick="toggleAuctionSkip('${horse.id}')">
                    ${AuctionState.skippedLots?.has(horse.id) ? '\u2717 Skipping' : 'Skip'}
                </button>
            </div>
        </div>
    `;
}

function renderAuctionCatalogue() {
    const container = document.getElementById('horse-catalogue');
    if (!AuctionState.skippedLots) AuctionState.skippedLots = new Set();
    container.innerHTML = AuctionState.catalogue.map(renderHorseCard).join('');

    document.getElementById('auction-budget').textContent = formatMoney(GameState.budget);

    updateStartAuctionButton();
}

function toggleAuctionInterest(horseId) {
    if (!AuctionState.skippedLots) AuctionState.skippedLots = new Set();
    if (AuctionState.playerBids[horseId]) {
        delete AuctionState.playerBids[horseId];
    } else {
        AuctionState.playerBids[horseId] = 1; // flag as interested
        AuctionState.skippedLots.delete(horseId);
    }
    renderAuctionCatalogue();
}

function toggleAuctionSkip(horseId) {
    if (!AuctionState.skippedLots) AuctionState.skippedLots = new Set();
    if (AuctionState.skippedLots.has(horseId)) {
        AuctionState.skippedLots.delete(horseId);
    } else {
        AuctionState.skippedLots.add(horseId);
        delete AuctionState.playerBids[horseId];
    }
    renderAuctionCatalogue();
}

function updateStartAuctionButton() {
    const btn = document.getElementById('btn-start-auction');
    const countText = document.querySelector('.bid-count');

    // Always allow starting auction (can skip all or bid live)
    btn.disabled = false;
    const interestedCount = Object.keys(AuctionState.playerBids).length;
    const skipCount = AuctionState.skippedLots ? AuctionState.skippedLots.size : 0;
    if (interestedCount > 0) {
        countText.textContent = `Interested in ${interestedCount} horse${interestedCount > 1 ? 's' : ''}, skipping ${skipCount}`;
    } else {
        countText.textContent = 'Mark horses as interested or start to browse all lots';
    }
}

function openAuction() {
    generateAuctionCatalogue();
    renderAuctionCatalogue();

    document.getElementById('auction-catalogue').style.display = 'block';
    document.getElementById('auction-live').style.display = 'none';
    document.getElementById('auction-results').style.display = 'none';

    showScreen('auction');
}

function startLiveAuction() {
    AuctionState.currentLotIndex = 0;
    AuctionState.results = [];
    AuctionState.horsesWon = [];
    AuctionState.totalSpent = 0;

    document.getElementById('auction-catalogue').style.display = 'none';
    document.getElementById('auction-live').style.display = 'block';

    document.getElementById('total-lots').textContent = AuctionState.catalogue.length;

    runAuctionLot();
}

function runAuctionLot() {
    const horse = AuctionState.catalogue[AuctionState.currentLotIndex];
    const playerMaxBid = AuctionState.playerBids[horse.id] || 0;

    document.getElementById('lot-number').textContent = AuctionState.currentLotIndex + 1;
    document.getElementById('lot-horse-name').textContent = horse.name;
    document.getElementById('lot-horse-age').textContent = horse.age;

    // Render horse in parade ring (no jockey - bare horse at sales)
    document.getElementById('parade-ring').innerHTML = `
        <div class="parade-horse">
          <svg class="horse-svg" viewBox="0 0 56 36" xmlns="http://www.w3.org/2000/svg">
            <!-- Tail -->
            <path class="h-tail" d="M9,16 Q5,13 3,9 Q2,6 4,4 Q4,7 5,10 Q6,13 8,15" fill="#3a1f0d"/>
            <!-- Hind legs -->
            <rect class="h-leg h-leg-hr" x="13" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
            <rect class="h-leg h-leg-hl" x="16" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
            <!-- Front legs -->
            <rect class="h-leg h-leg-fr" x="34" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
            <rect class="h-leg h-leg-fl" x="37" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
            <!-- Hooves -->
            <rect x="13" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hr"/>
            <rect x="16" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hl"/>
            <rect x="34" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fr"/>
            <rect x="37" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fl"/>
            <!-- Horse body -->
            <path d="
              M10,23 Q7,20 7,16 Q7,12 12,12 L22,11 L28,10.5
              Q32,9 35,6 Q37,3.5 40,3.5 L42,3.5
              Q44,3 45,4 Q47,4.5 48,6.5 Q48.5,8 47,9
              Q45,10.5 43,12 Q40,16 38,20 L36,23
              Q28,19 18,23 Z
            " fill="#6b3a1f"/>
            <!-- Belly shading -->
            <path d="M10,23 Q28,19 36,23 L36,23 Q28,21 18,23 Z" fill="#5a2e16" opacity="0.5"/>
            <!-- Hindquarter highlight -->
            <ellipse cx="14" cy="16" rx="4" ry="3" fill="#7a4525" opacity="0.4"/>
            <!-- Shoulder highlight -->
            <ellipse cx="33" cy="15" rx="3" ry="3.5" fill="#7a4525" opacity="0.35"/>
            <!-- Ear -->
            <polygon points="41,3.5 40,0.5 43,2.5" fill="#5a2e16"/>
            <!-- Eye -->
            <circle cx="45" cy="5.5" r="0.9" fill="#222"/>
            <circle cx="45.2" cy="5.3" r="0.3" fill="#555"/>
            <!-- Nostril -->
            <circle cx="47.5" cy="7.8" r="0.6" fill="#4a2512"/>
            <!-- Mane -->
            <path class="h-mane" d="M28,10.5 Q31,7 34,5 Q36,3.5 39,3.5" stroke="#3a1f0d" stroke-width="2" fill="none" stroke-linecap="round"/>
            <!-- Head collar -->
            <path d="M43,4 L46,5 L47,7.5 L45,9" stroke="#1a3a6c" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M44,6.5 L46.5,6" stroke="#1a3a6c" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <!-- Lead rope -->
            <path d="M45,9 Q43,12 40,14 Q38,16 36,15" stroke="#555" stroke-width="0.6" fill="none" stroke-dasharray="1.5,1"/>
          </svg>
        </div>
    `;

    document.getElementById('lot-stats').innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Speed</span>
            <div class="stat-bar-container">
                <div class="stat-bar speed" style="width: ${horse.speed}%"></div>
            </div>
            <span class="stat-value">${horse.speed}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Stamina</span>
            <div class="stat-bar-container">
                <div class="stat-bar stamina" style="width: ${horse.stamina}%"></div>
            </div>
            <span class="stat-value">${horse.stamina}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Acceleration</span>
            <div class="stat-bar-container">
                <div class="stat-bar acceleration" style="width: ${horse.acceleration}%"></div>
            </div>
            <span class="stat-value">${horse.acceleration}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Temperament</span>
            <div class="stat-bar-container">
                <div class="stat-bar temperament" style="width: ${horse.temperament}%"></div>
            </div>
            <span class="stat-value">${horse.temperament}</span>
        </div>
    `;

    const isSkipped = AuctionState.skippedLots?.has(horse.id);

    document.getElementById('your-max-bid').textContent = isSkipped ? 'Skipping' : 'Live Bidding';
    document.getElementById('btn-next-lot').style.display = 'none';

    startLiveBidding(horse, isSkipped);
}

function startLiveBidding(horse, isSkipped) {
    let currentBid = Math.round(horse.estimatedValue * (0.6 + Math.random() * 0.2) / 5000) * 5000;
    let leadingBidder = null;
    let playerIsLeading = false;
    let consecutivePasses = 0;

    const numAIBidders = randomInt(2, 4);
    const aiBidders = [];
    for (let i = 0; i < numAIBidders; i++) {
        const aiTrainer = GameState.competitors[randomInt(0, GameState.competitors.length - 1)];
        const aiMaxBid = Math.round(horse.estimatedValue * (0.7 + Math.random() * 0.5) / 5000) * 5000;
        aiBidders.push({ name: aiTrainer.name, maxBid: aiMaxBid, droppedOut: false });
    }

    const bidIncrement = 5000;
    AuctionState._liveBidState = { currentBid, leadingBidder, playerIsLeading, aiBidders, bidIncrement, horse, consecutivePasses };

    const bidStatus = document.getElementById('bid-status');
    const bidBtnGroup = document.getElementById('live-bid-buttons');

    document.getElementById('current-bid').textContent = formatMoney(currentBid);
    document.getElementById('leading-bidder').textContent = 'Opening bid';

    if (isSkipped) {
        // Fast AI-only bidding
        bidStatus.textContent = 'Skipping lot...';
        bidStatus.className = 'bid-status not-bidding';
        if (bidBtnGroup) bidBtnGroup.style.display = 'none';
        runAIOnlyBidding(horse, currentBid, aiBidders, bidIncrement);
        return;
    }

    // Show bid/pass buttons
    if (bidBtnGroup) bidBtnGroup.style.display = 'flex';
    bidStatus.textContent = 'Place your bid or pass';
    bidStatus.className = 'bid-status';

    // Start timer for player's first response
    startBidTimer();
}

function startBidTimer() {
    const timerBar = document.getElementById('bid-timer-bar');
    if (!timerBar) return;

    let timeLeft = 100;
    if (AuctionState._bidTimerInterval) clearInterval(AuctionState._bidTimerInterval);

    timerBar.style.width = '100%';
    AuctionState._bidTimerInterval = setInterval(() => {
        timeLeft -= 4; // 5 seconds total (100 / 4% per 200ms = 25 ticks = 5s)
        timerBar.style.width = `${Math.max(0, timeLeft)}%`;
        if (timeLeft <= 0) {
            clearInterval(AuctionState._bidTimerInterval);
            handlePlayerPass(); // Auto-pass on timeout
        }
    }, 200);
}

function handlePlayerBid() {
    if (AuctionState._bidTimerInterval) clearInterval(AuctionState._bidTimerInterval);

    const state = AuctionState._liveBidState;
    if (!state) return;

    const newBid = state.currentBid + state.bidIncrement;
    if ((GameState.budget - AuctionState.totalSpent) < newBid) {
        document.getElementById('bid-status').textContent = 'Cannot afford this bid!';
        startBidTimer();
        return;
    }

    state.currentBid = newBid;
    state.playerIsLeading = true;
    state.leadingBidder = GameState.stableName;
    state.consecutivePasses = 0;

    document.getElementById('current-bid').textContent = formatMoney(state.currentBid);
    document.getElementById('leading-bidder').textContent = state.leadingBidder;
    document.getElementById('bid-status').textContent = '\u2713 You are the leading bidder!';
    document.getElementById('bid-status').className = 'bid-status winning';

    // Update bid button text
    const bidBtn = document.getElementById('btn-live-bid');
    if (bidBtn) bidBtn.textContent = `Bid \u00A3${formatMoney(state.currentBid + state.bidIncrement)}`;

    // AI responds after a short delay
    setTimeout(() => processAIBidResponse(state), 500);
}

function handlePlayerPass() {
    if (AuctionState._bidTimerInterval) clearInterval(AuctionState._bidTimerInterval);

    const state = AuctionState._liveBidState;
    if (!state) return;

    state.consecutivePasses++;

    if (state.playerIsLeading) {
        // Player is leading and passed - they keep the lead, AI gets a turn
        setTimeout(() => processAIBidResponse(state), 300);
    } else {
        // Player passed while not leading - check if done
        if (state.consecutivePasses >= 2 || aiBidders_allDropped(state)) {
            finishLotBidding(state);
        } else {
            setTimeout(() => processAIBidResponse(state), 300);
        }
    }
}

function aiBidders_allDropped(state) {
    return state.aiBidders.every(ai => ai.droppedOut || ai.maxBid <= state.currentBid);
}

function processAIBidResponse(state) {
    const eligibleAI = state.aiBidders.filter(ai => !ai.droppedOut && ai.maxBid > state.currentBid);

    if (eligibleAI.length === 0) {
        // No AI can bid - lot goes to leader
        if (state.playerIsLeading) {
            // Going once, twice, sold!
            showGoingSequence(state);
        } else {
            finishLotBidding(state);
        }
        return;
    }

    // Random AI bids
    const bidder = eligibleAI[randomInt(0, eligibleAI.length - 1)];
    state.currentBid += state.bidIncrement;
    state.leadingBidder = bidder.name;
    state.playerIsLeading = false;
    state.consecutivePasses = 0;

    // Mark AIs that can't continue
    state.aiBidders.forEach(ai => {
        if (ai.maxBid <= state.currentBid) ai.droppedOut = true;
    });

    document.getElementById('current-bid').textContent = formatMoney(state.currentBid);
    document.getElementById('leading-bidder').textContent = state.leadingBidder;
    document.getElementById('bid-status').textContent = `${bidder.name} bids \u00A3${formatMoney(state.currentBid)}`;
    document.getElementById('bid-status').className = 'bid-status';

    const bidBtn = document.getElementById('btn-live-bid');
    if (bidBtn) bidBtn.textContent = `Bid \u00A3${formatMoney(state.currentBid + state.bidIncrement)}`;

    // Check if player can still afford
    if ((GameState.budget - AuctionState.totalSpent) < state.currentBid + state.bidIncrement) {
        document.getElementById('bid-status').textContent = 'Priced out - watching...';
        document.getElementById('bid-status').className = 'bid-status outbid';
        const bidBtnGroup = document.getElementById('live-bid-buttons');
        if (bidBtnGroup) bidBtnGroup.style.display = 'none';
        // Let remaining AI finish
        setTimeout(() => runRemainingAIBidding(state), 400);
        return;
    }

    // Player's turn again
    startBidTimer();
}

function showGoingSequence(state) {
    const bidStatus = document.getElementById('bid-status');
    const bidBtnGroup = document.getElementById('live-bid-buttons');
    if (bidBtnGroup) bidBtnGroup.style.display = 'none';

    bidStatus.textContent = 'Going once...';
    bidStatus.className = 'bid-status winning';
    setTimeout(() => {
        bidStatus.textContent = 'Going twice...';
        setTimeout(() => {
            bidStatus.textContent = 'SOLD!';
            SoundManager.playGavel();
            setTimeout(() => finishLotBidding(state), 800);
        }, 800);
    }, 800);
}

function runRemainingAIBidding(state) {
    const eligibleAI = state.aiBidders.filter(ai => !ai.droppedOut && ai.maxBid > state.currentBid);
    if (eligibleAI.length <= 1) {
        finishLotBidding(state);
        return;
    }

    const bidder = eligibleAI[randomInt(0, eligibleAI.length - 1)];
    state.currentBid += state.bidIncrement;
    state.leadingBidder = bidder.name;

    state.aiBidders.forEach(ai => {
        if (ai.maxBid <= state.currentBid) ai.droppedOut = true;
    });

    document.getElementById('current-bid').textContent = formatMoney(state.currentBid);
    document.getElementById('leading-bidder').textContent = state.leadingBidder;

    const remaining = state.aiBidders.filter(ai => !ai.droppedOut && ai.maxBid > state.currentBid);
    if (remaining.length === 0) {
        SoundManager.playGavel();
        setTimeout(() => finishLotBidding(state), 500);
    } else {
        setTimeout(() => runRemainingAIBidding(state), 300);
    }
}

function runAIOnlyBidding(horse, currentBid, aiBidders, bidIncrement) {
    // Fast AI-only bidding for skipped lots
    let bid = currentBid;
    let leader = null;

    while (true) {
        const eligible = aiBidders.filter(ai => ai.maxBid > bid);
        if (eligible.length === 0) break;
        const bidder = eligible[randomInt(0, eligible.length - 1)];
        bid += bidIncrement;
        leader = bidder.name;
        aiBidders.forEach(ai => { if (ai.maxBid <= bid) ai.droppedOut = true; });
    }

    document.getElementById('current-bid').textContent = formatMoney(bid);
    document.getElementById('leading-bidder').textContent = leader || 'Unsold';

    const result = { horse, finalPrice: bid, winner: leader, wonByPlayer: false };
    AuctionState.results.push(result);

    document.getElementById('bid-status').textContent = leader
        ? `Sold to ${leader} for \u00A3${formatMoney(bid)}` : 'Unsold';
    document.getElementById('bid-status').className = 'bid-status not-bidding';

    document.getElementById('btn-next-lot').style.display = 'block';
    if (AuctionState.currentLotIndex >= AuctionState.catalogue.length - 1) {
        document.getElementById('btn-next-lot').textContent = 'See Results';
    } else {
        document.getElementById('btn-next-lot').textContent = 'Next Lot \u2192';
    }
}

function finishLotBidding(state) {
    if (AuctionState._bidTimerInterval) clearInterval(AuctionState._bidTimerInterval);

    const bidBtnGroup = document.getElementById('live-bid-buttons');
    if (bidBtnGroup) bidBtnGroup.style.display = 'none';

    const result = {
        horse: state.horse,
        finalPrice: state.currentBid,
        winner: state.leadingBidder,
        wonByPlayer: state.playerIsLeading
    };
    AuctionState.results.push(result);

    const bidStatus = document.getElementById('bid-status');
    if (state.playerIsLeading) {
        AuctionState.horsesWon.push({...state.horse, purchasePrice: state.currentBid});
        AuctionState.totalSpent += state.currentBid;
        bidStatus.textContent = `\u2713 SOLD to you for \u00A3${formatMoney(state.currentBid)}!`;
        bidStatus.className = 'bid-status winning';
        if (!SoundManager._gavelPlayed) SoundManager.playGavel();
    } else {
        bidStatus.textContent = state.leadingBidder
            ? `Sold to ${state.leadingBidder} for \u00A3${formatMoney(state.currentBid)}`
            : 'Unsold';
        bidStatus.className = 'bid-status outbid';
        SoundManager.playGavel();
    }
    SoundManager._gavelPlayed = false;

    document.getElementById('btn-next-lot').style.display = 'block';
    if (AuctionState.currentLotIndex >= AuctionState.catalogue.length - 1) {
        document.getElementById('btn-next-lot').textContent = 'See Results';
    } else {
        document.getElementById('btn-next-lot').textContent = 'Next Lot \u2192';
    }
}

function nextAuctionLot() {
    AuctionState.currentLotIndex++;

    if (AuctionState.currentLotIndex >= AuctionState.catalogue.length) {
        showAuctionResults();
    } else {
        runAuctionLot();
    }
}

function showAuctionResults() {
    document.getElementById('auction-live').style.display = 'none';
    document.getElementById('auction-results').style.display = 'block';

    const summaryDiv = document.getElementById('results-summary');
    const horsesWonCount = AuctionState.horsesWon.length;

    summaryDiv.innerHTML = `
        <p>Horses purchased: <span class="highlight">${horsesWonCount}</span></p>
        <p>Total spent: <span class="highlight">\u00A3${formatMoney(AuctionState.totalSpent)}</span></p>
        <p>Remaining budget: <span class="highlight">\u00A3${formatMoney(GameState.budget - AuctionState.totalSpent)}</span></p>
    `;

    const horsesWonDiv = document.getElementById('horses-won');

    if (horsesWonCount > 0) {
        horsesWonDiv.innerHTML = `
            <h3>Your New Horses</h3>
            ${AuctionState.horsesWon.map(horse => `
                <div class="won-horse-card">
                    <div class="horse-name">${silkSwatchHTML(horse.silkPrimary, horse.silkSecondary)}${horse.name}</div>
                    <div class="purchase-price">Purchased for \u00A3${formatMoney(horse.purchasePrice)}</div>
                </div>
            `).join('')}
        `;
    } else {
        horsesWonDiv.innerHTML = `
            <div class="no-horses-won">
                <p>You didn't win any horses in this auction.</p>
                <p>Try setting higher maximum bids next time!</p>
            </div>
        `;
    }
}

/**
 * Finish auction (Phase 2: override silks to player colours)
 */
function finishAuction() {
    AuctionState.horsesWon.forEach(horse => {
        horse.silkPrimary = GameState.silkPrimary;
        horse.silkSecondary = GameState.silkSecondary;
        GameState.horses.push(horse);
    });

    GameState.budget -= AuctionState.totalSpent;

    returnToYard();
}

// ============================================
// YEARLING SALE SYSTEM
// ============================================

const YearlingAuctionState = {
    catalogue: [],
    playerBids: {},
    currentLotIndex: 0,
    results: [],
    horsesWon: [],
    totalSpent: 0
};

function generateYearlingCatalogue() {
    YearlingAuctionState.catalogue = [];
    YearlingAuctionState.playerBids = {};
    YearlingAuctionState.currentLotIndex = 0;
    YearlingAuctionState.results = [];
    YearlingAuctionState.horsesWon = [];
    YearlingAuctionState.totalSpent = 0;

    const qualities = getCatalogueQualities();

    for (let i = 0; i < 8; i++) {
        const yearling = generateYearling(qualities[i]);
        YearlingAuctionState.catalogue.push(yearling);
    }
}

function renderParentStats(parent, label) {
    return `
        <div class="parent-section">
            <div class="parent-header">
                <span class="parent-label">${label}</span>
                <span class="parent-name">${parent.name}</span>
            </div>
            <div class="parent-stats">
                <div class="stat-row">
                    <span class="stat-label">Speed</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar speed" style="width: ${parent.speed}%"></div>
                    </div>
                    <span class="stat-value">${parent.speed}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Stamina</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar stamina" style="width: ${parent.stamina}%"></div>
                    </div>
                    <span class="stat-value">${parent.stamina}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Acceleration</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar acceleration" style="width: ${parent.acceleration}%"></div>
                    </div>
                    <span class="stat-value">${parent.acceleration}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Temperament</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar temperament" style="width: ${parent.temperament}%"></div>
                    </div>
                    <span class="stat-value">${parent.temperament}</span>
                </div>
            </div>
        </div>
    `;
}

function renderYearlingCard(yearling) {
    const playerBid = YearlingAuctionState.playerBids[yearling.id] || 0;
    const isSelected = playerBid > 0;

    return `
        <div class="horse-card ${isSelected ? 'selected' : ''}" data-horse-id="${yearling.id}">
            <div class="horse-card-header">
                <span class="horse-name">Lot ${YearlingAuctionState.catalogue.indexOf(yearling) + 1}: ${yearling.sire.name} x ${yearling.dam.name}</span>
                <span class="horse-age">1 yr (Yearling)</span>
            </div>
            <div class="yearling-parentage">
                ${renderParentStats(yearling.sire, 'Sire')}
                ${renderParentStats(yearling.dam, 'Dam')}
            </div>
            <div class="yearling-hidden-stats-notice">
                Stats hidden until purchase
            </div>
            <div class="horse-value">
                <span class="value-label">Guide Price</span>
                <span class="value-amount">\u00A3${formatMoney(yearling.estimatedValue)}</span>
            </div>
            <div class="bid-input-group">
                <label>Your max bid: \u00A3</label>
                <input type="number"
                       class="yearling-bid-input"
                       data-horse-id="${yearling.id}"
                       value="${playerBid || ''}"
                       placeholder="0"
                       min="0"
                       max="${GameState.budget}"
                       step="5000">
            </div>
        </div>
    `;
}

function renderYearlingCatalogue() {
    const container = document.getElementById('yearling-catalogue-grid');
    container.innerHTML = YearlingAuctionState.catalogue.map(renderYearlingCard).join('');

    document.getElementById('yearling-budget').textContent = formatMoney(GameState.budget);

    container.querySelectorAll('.yearling-bid-input').forEach(input => {
        input.addEventListener('change', handleYearlingBidInput);
        input.addEventListener('input', handleYearlingBidInput);
    });

    updateStartYearlingSaleButton();
}

function handleYearlingBidInput(e) {
    const horseId = e.target.dataset.horseId;
    const bidValue = parseInt(e.target.value) || 0;

    if (bidValue > GameState.budget) {
        e.target.value = GameState.budget;
        YearlingAuctionState.playerBids[horseId] = GameState.budget;
    } else if (bidValue < 0) {
        e.target.value = 0;
        delete YearlingAuctionState.playerBids[horseId];
    } else if (bidValue === 0) {
        delete YearlingAuctionState.playerBids[horseId];
    } else {
        YearlingAuctionState.playerBids[horseId] = bidValue;
    }

    const card = e.target.closest('.horse-card');
    if (bidValue > 0) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }

    updateStartYearlingSaleButton();
}

function updateStartYearlingSaleButton() {
    const bidCount = Object.keys(YearlingAuctionState.playerBids).length;
    const btn = document.getElementById('btn-start-yearling-sale');
    const countText = document.getElementById('yearling-bid-count');

    if (bidCount > 0) {
        btn.disabled = false;
        countText.textContent = `You're bidding on ${bidCount} yearling${bidCount > 1 ? 's' : ''}`;
    } else {
        btn.disabled = true;
        countText.textContent = 'Select yearlings and set your max bids';
    }
}

function openYearlingSale() {
    generateYearlingCatalogue();
    renderYearlingCatalogue();

    document.getElementById('yearling-catalogue').style.display = 'block';
    document.getElementById('yearling-live').style.display = 'none';
    document.getElementById('yearling-results').style.display = 'none';

    showScreen('yearling-sale');
}

function startLiveYearlingSale() {
    YearlingAuctionState.currentLotIndex = 0;
    YearlingAuctionState.results = [];
    YearlingAuctionState.horsesWon = [];
    YearlingAuctionState.totalSpent = 0;

    document.getElementById('yearling-catalogue').style.display = 'none';
    document.getElementById('yearling-live').style.display = 'block';

    document.getElementById('yearling-total-lots').textContent = YearlingAuctionState.catalogue.length;

    runYearlingLot();
}

function runYearlingLot() {
    const yearling = YearlingAuctionState.catalogue[YearlingAuctionState.currentLotIndex];
    const playerMaxBid = YearlingAuctionState.playerBids[yearling.id] || 0;

    document.getElementById('yearling-lot-number').textContent = YearlingAuctionState.currentLotIndex + 1;
    document.getElementById('yearling-lot-name').textContent = `${yearling.sire.name} x ${yearling.dam.name}`;

    // Show parent stats in live view
    document.getElementById('yearling-lot-parents').innerHTML = `
        <div class="yearling-parentage">
            ${renderParentStats(yearling.sire, 'Sire')}
            ${renderParentStats(yearling.dam, 'Dam')}
        </div>
    `;

    if (playerMaxBid > 0) {
        document.getElementById('yearling-your-max-bid').textContent = `\u00A3${formatMoney(playerMaxBid)}`;
    } else {
        document.getElementById('yearling-your-max-bid').textContent = 'Not bidding';
    }

    document.getElementById('btn-next-yearling-lot').style.display = 'none';

    simulateYearlingBidding(yearling, playerMaxBid);
}

function simulateYearlingBidding(yearling, playerMaxBid) {
    let currentBid = Math.round(yearling.estimatedValue * (0.6 + Math.random() * 0.2) / 5000) * 5000;
    let leadingBidder = null;
    let playerIsLeading = false;

    const numAIBidders = randomInt(1, 3);
    const aiBidders = [];

    for (let i = 0; i < numAIBidders; i++) {
        const aiTrainer = GameState.competitors[randomInt(0, GameState.competitors.length - 1)];
        const aiMaxBid = Math.round(yearling.estimatedValue * (0.8 + Math.random() * 0.4) / 5000) * 5000;
        aiBidders.push({ name: aiTrainer.name, maxBid: aiMaxBid });
    }

    const bidIncrement = 5000;
    let bidRound = 0;

    const biddingInterval = setInterval(() => {
        bidRound++;

        const eligibleAI = aiBidders.filter(ai => ai.maxBid > currentBid);
        const playerCanBid = playerMaxBid > currentBid && (GameState.budget - YearlingAuctionState.totalSpent) >= currentBid + bidIncrement;

        let nextBidder = null;

        if (eligibleAI.length > 0 || playerCanBid) {
            const allEligible = [...eligibleAI];
            if (playerCanBid && !playerIsLeading) {
                allEligible.push({ name: 'PLAYER', maxBid: playerMaxBid });
            }

            if (allEligible.length > 0) {
                if (playerIsLeading) {
                    if (eligibleAI.length > 0) {
                        nextBidder = eligibleAI[randomInt(0, eligibleAI.length - 1)];
                    }
                } else {
                    nextBidder = allEligible[randomInt(0, allEligible.length - 1)];
                }
            }

            if (nextBidder) {
                const newBid = currentBid + bidIncrement;

                if (nextBidder.name === 'PLAYER') {
                    playerIsLeading = true;
                    leadingBidder = GameState.stableName;
                } else {
                    playerIsLeading = false;
                    leadingBidder = nextBidder.name;
                }

                currentBid = newBid;
            }
        }

        document.getElementById('yearling-current-bid').textContent = formatMoney(currentBid);
        document.getElementById('yearling-leading-bidder').textContent = leadingBidder || 'Opening bid';

        const bidStatus = document.getElementById('yearling-bid-status');
        if (playerMaxBid === 0) {
            bidStatus.textContent = 'You are not bidding on this yearling';
            bidStatus.className = 'bid-status not-bidding';
        } else if (playerIsLeading) {
            bidStatus.textContent = '\u2713 You are the leading bidder!';
            bidStatus.className = 'bid-status winning';
        } else if (currentBid >= playerMaxBid) {
            bidStatus.textContent = '\u2717 Outbid - exceeded your maximum';
            bidStatus.className = 'bid-status outbid';
        } else {
            bidStatus.textContent = 'Bidding in progress...';
            bidStatus.className = 'bid-status';
        }

        const stillEligible = aiBidders.filter(ai => ai.maxBid > currentBid);
        const playerStillEligible = playerMaxBid > currentBid && (GameState.budget - YearlingAuctionState.totalSpent) >= currentBid + bidIncrement;

        const biddingDone = (playerIsLeading && stillEligible.length === 0) ||
                           (!playerIsLeading && !playerStillEligible && stillEligible.length <= 1) ||
                           bidRound > 20;

        if (biddingDone || (!nextBidder && bidRound > 3)) {
            clearInterval(biddingInterval);

            const result = {
                horse: yearling,
                finalPrice: currentBid,
                winner: leadingBidder,
                wonByPlayer: playerIsLeading
            };
            YearlingAuctionState.results.push(result);

            if (playerIsLeading) {
                YearlingAuctionState.horsesWon.push({...yearling, purchasePrice: currentBid});
                YearlingAuctionState.totalSpent += currentBid;

                bidStatus.textContent = `\u2713 SOLD to you for \u00A3${formatMoney(currentBid)}!`;
                bidStatus.className = 'bid-status winning';
                SoundManager.playGavel();
            } else {
                bidStatus.textContent = `Sold to ${leadingBidder} for \u00A3${formatMoney(currentBid)}`;
                bidStatus.className = 'bid-status outbid';
                SoundManager.playGavel();
            }

            document.getElementById('btn-next-yearling-lot').style.display = 'block';
            if (YearlingAuctionState.currentLotIndex >= YearlingAuctionState.catalogue.length - 1) {
                document.getElementById('btn-next-yearling-lot').textContent = 'See Results';
            } else {
                document.getElementById('btn-next-yearling-lot').textContent = 'Next Lot \u2192';
            }
        }
    }, 600);
}

function nextYearlingLot() {
    YearlingAuctionState.currentLotIndex++;

    if (YearlingAuctionState.currentLotIndex >= YearlingAuctionState.catalogue.length) {
        showYearlingResults();
    } else {
        runYearlingLot();
    }
}

function showYearlingResults() {
    document.getElementById('yearling-live').style.display = 'none';
    document.getElementById('yearling-results').style.display = 'block';

    const summaryDiv = document.getElementById('yearling-results-summary');
    const horsesWonCount = YearlingAuctionState.horsesWon.length;

    summaryDiv.innerHTML = `
        <p>Yearlings purchased: <span class="highlight">${horsesWonCount}</span></p>
        <p>Total spent: <span class="highlight">\u00A3${formatMoney(YearlingAuctionState.totalSpent)}</span></p>
        <p>Remaining budget: <span class="highlight">\u00A3${formatMoney(GameState.budget - YearlingAuctionState.totalSpent)}</span></p>
    `;

    const horsesWonDiv = document.getElementById('yearlings-won');

    if (horsesWonCount > 0) {
        horsesWonDiv.innerHTML = `
            <h3>Your New Yearlings</h3>
            ${YearlingAuctionState.horsesWon.map(yearling => `
                <div class="won-horse-card">
                    <div class="yearling-naming">
                        <label class="yearling-name-label">Name your horse:</label>
                        <input type="text" class="yearling-name-input" data-horse-id="${yearling.id}" placeholder="Enter a name..." maxlength="30" style="width:100%;padding:6px 8px;font-size:1rem;border:2px solid var(--color-border);border-radius:var(--radius);background:var(--color-bg);color:var(--color-text);margin-bottom:6px;">
                    </div>
                    <div class="purchase-price">Purchased for \u00A3${formatMoney(yearling.purchasePrice)}</div>
                    <div class="stable-parentage-info">Sire: ${yearling.sire.name} | Dam: ${yearling.dam.name}</div>
                </div>
            `).join('')}
        `;
    } else {
        horsesWonDiv.innerHTML = `
            <div class="no-horses-won">
                <p>You didn't win any yearlings in this sale.</p>
                <p>Try setting higher maximum bids next time!</p>
            </div>
        `;
    }
}

function finishYearlingSale() {
    // Apply names from the input fields
    document.querySelectorAll('.yearling-name-input').forEach(input => {
        const horseId = input.dataset.horseId;
        const name = input.value.trim();
        if (name) {
            const yearling = YearlingAuctionState.horsesWon.find(y => y.id === horseId);
            if (yearling) yearling.name = name;
        }
    });

    YearlingAuctionState.horsesWon.forEach(yearling => {
        yearling.silkPrimary = GameState.silkPrimary;
        yearling.silkSecondary = GameState.silkSecondary;
        GameState.horses.push(yearling);
    });

    GameState.budget -= YearlingAuctionState.totalSpent;

    returnToYard();
}

// ============================================
// GALLOPS (YEARLING TRAINING) SYSTEM
// ============================================

const GallopsState = {
    selectedYearlingId: null,
    selectedFocus: null,
    hoofStop: null,
    isGalloping: false,
    gallopsInterval: null
};

async function openGallops(preselectedHorseId) {
    if (GameState.horses.length === 0) {
        await gameAlert('No Horses', 'You have no horses in your stable.');
        return;
    }

    GallopsState.selectedYearlingId = null;
    GallopsState.selectedFocus = null;
    GallopsState.isGalloping = false;

    document.getElementById('gallops-season').textContent = GameState.season;

    renderGallopsHorses();

    document.getElementById('gallops-select').style.display = '';
    document.getElementById('gallops-focus').style.display = 'none';
    document.getElementById('gallops-workout').style.display = 'none';
    document.getElementById('gallops-results').style.display = 'none';

    showScreen('gallops');

    if (preselectedHorseId) {
        const horse = GameState.horses.find(h => h.id === preselectedHorseId);
        if (horse && horse.condition >= 50 && !horse.isInjured) {
            selectGallopsHorse(preselectedHorseId);
        }
    }
}

function renderGallopsHorses() {
    const allHorses = GameState.horses;
    const grid = document.getElementById('gallops-yearling-grid');

    grid.innerHTML = allHorses.map(horse => {
        const conditionClass = horse.condition >= 70 ? '' : horse.condition >= 40 ? 'medium' : 'low';
        const notTackedUp = !horse.isYearling && (!horse.tackedUp?.saddle || !horse.tackedUp?.bridle);
        const isDisabled = horse.condition < 50 || horse.isInjured || notTackedUp;
        let warningText = '';
        if (horse.isInjured) {
            warningText = `\u{1F915} ${horse.injuryType} - Out for ${horse.recoveryRacesLeft} race${horse.recoveryRacesLeft > 1 ? 's' : ''}`;
        } else if (notTackedUp) {
            warningText = 'Not tacked up — visit the Tack Room in the yard';
        } else if (horse.condition < 50) {
            warningText = '\u26A0\uFE0F Too tired to train (condition below 50%)';
        }

        const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);
        const ageText = `${horse.age} yr${horse.age > 1 ? 's' : ''}`;

        return `
            <div class="gallops-yearling-card ${isDisabled ? 'disabled' : ''}" data-horse-id="${horse.id}" ${isDisabled ? '' : `onclick="selectGallopsHorse('${horse.id}')"`}>
                <div class="gallops-yearling-header">
                    <span class="horse-name">${swatch}${horse.name}</span>
                    <span class="horse-age">${ageText}</span>
                </div>
                <div class="stable-card-stats">
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Speed</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill speed" style="width: ${horse.speed}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.speed}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Stamina</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill stamina" style="width: ${horse.stamina}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.stamina}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Acceleration</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill acceleration" style="width: ${horse.acceleration}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.acceleration}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Temperament</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill temperament" style="width: ${horse.temperament}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.temperament}</span>
                    </div>
                </div>
                <div class="condition-mini">
                    <div class="condition-mini-bar">
                        <div class="condition-mini-fill ${conditionClass}" style="width: ${horse.condition}%"></div>
                    </div>
                    <span>${horse.condition}%</span>
                </div>
                ${warningText ? `<div class="gallops-yearling-warning">${warningText}</div>` : ''}
            </div>
        `;
    }).join('');
}

function selectGallopsHorse(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (!horse) return;

    GallopsState.selectedYearlingId = horseId;
    GallopsState.selectedFocus = null;

    document.getElementById('gallops-focus-horse-name').textContent = horse.name;

    // Reset focus buttons
    document.querySelectorAll('.gallops-focus-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('btn-start-gallops').disabled = true;

    document.getElementById('gallops-select').style.display = 'none';
    document.getElementById('gallops-focus').style.display = '';
}

function selectGallopsFocus(focus) {
    if (GallopsState.selectedFocus === focus) {
        GallopsState.selectedFocus = null;
        document.querySelectorAll('.gallops-focus-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('btn-start-gallops').disabled = true;
    } else {
        GallopsState.selectedFocus = focus;
        document.querySelectorAll('.gallops-focus-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.focus === focus);
        });
        document.getElementById('btn-start-gallops').disabled = false;
    }
}

function startGallopsWorkout() {
    const horse = GameState.horses.find(h => h.id === GallopsState.selectedYearlingId);
    if (!horse || !GallopsState.selectedFocus) return;

    GallopsState.isGalloping = true;

    document.getElementById('gallops-focus').style.display = 'none';
    document.getElementById('gallops-workout').style.display = '';

    // Inject horse sprite
    const lane = document.getElementById('gallops-horse-lane');
    lane.innerHTML = `
        <div class="horse-sprite galloping"
             style="--silk-primary:${horse.silkPrimary || GameState.silkPrimary};--silk-secondary:${horse.silkSecondary || GameState.silkSecondary}">
            ${horseSpriteSVG()}
        </div>
    `;

    const sprite = lane.querySelector('.horse-sprite');
    sprite.style.left = '0%';

    const commentaryEl = document.getElementById('gallops-commentary-text');
    commentaryEl.textContent = 'Warming up...';

    GallopsState.hoofStop = SoundManager.startHoofbeats(400);

    let tick = 0;
    const totalTicks = 60;

    GallopsState.gallopsInterval = setInterval(() => {
        tick++;

        // Move sprite
        const progress = (tick / totalTicks) * 90;
        sprite.style.left = `${progress}%`;

        // Update commentary through stages
        if (tick <= 12) {
            commentaryEl.textContent = 'Warming up... getting into stride';
        } else if (tick <= 24) {
            commentaryEl.textContent = 'Building speed... the yearling is finding a rhythm';
        } else if (tick <= 40) {
            commentaryEl.textContent = 'Full gallop! Stretching out nicely';
        } else if (tick <= 52) {
            commentaryEl.textContent = 'Pulling up... easing back down';
        } else {
            commentaryEl.textContent = 'Cooling down... workout nearly complete';
        }

        if (tick >= totalTicks) {
            clearInterval(GallopsState.gallopsInterval);
            GallopsState.gallopsInterval = null;

            if (GallopsState.hoofStop) {
                GallopsState.hoofStop();
                GallopsState.hoofStop = null;
            }

            GallopsState.isGalloping = false;
            finishGallopsWorkout();
        }
    }, 100);
}

function finishGallopsWorkout() {
    const horse = GameState.horses.find(h => h.id === GallopsState.selectedYearlingId);
    if (!horse) return;

    const focus = GallopsState.selectedFocus;

    // Check for injury (same 4% base as training)
    const injury = checkForInjury(horse, 'training');

    let improvement = 0;
    let resultType = 'improved';

    if (injury) {
        resultType = 'injury';
    } else {
        // Same diminishing returns as applyTrainingEffects
        const currentVal = horse[focus] || 50;
        const maxStat = 95;

        if (currentVal >= 90) {
            improvement = Math.random() < 0.3 ? 1 : 0;
        } else if (currentVal >= 80) {
            improvement = Math.random() < 0.6 ? 1 : 0;
        } else {
            improvement = Math.random() < 0.2 ? 2 : 1;
        }

        if (improvement > 0) {
            horse[focus] = Math.min(currentVal + improvement, maxStat);
        }

        if (improvement === 0) {
            resultType = 'plateau';
        }
    }

    // Deduct condition (25-35 points)
    const conditionCost = randomInt(25, 35);
    horse.condition = Math.max(horse.condition - conditionCost, 0);

    // Check for tack breakage during gallops workout
    const tackBreakage = checkTackBreakage();

    showGallopsResults(horse, focus, improvement, conditionCost, injury, resultType, tackBreakage);
}

function showGallopsResults(horse, focus, improvement, conditionCost, injury, resultType, tackBreakage) {
    document.getElementById('gallops-workout').style.display = 'none';
    document.getElementById('gallops-results').style.display = '';

    SoundManager.playWhoosh();

    const resultsBody = document.getElementById('gallops-results-body');
    let html = `<h3 style="text-align:center;color:var(--color-primary);margin-bottom:var(--space-lg)">${horse.name}</h3>`;

    if (resultType === 'injury') {
        html += `
            <div class="gallops-result-stat">
                <span class="gallops-result-label">Result</span>
                <span class="gallops-result-value injury">\u{1F915} Injured: ${injury.type}</span>
            </div>
            <div class="gallops-result-stat">
                <span class="gallops-result-label">Recovery</span>
                <span class="gallops-result-value injury">Out for ${injury.recoveryRaces} race${injury.recoveryRaces > 1 ? 's' : ''}</span>
            </div>
        `;
    } else if (resultType === 'improved') {
        html += `
            <div class="gallops-result-stat">
                <span class="gallops-result-label">${capitalizeFirst(focus)} Training</span>
                <span class="gallops-result-value improved">+${improvement}</span>
            </div>
        `;
    } else {
        html += `
            <div class="gallops-result-stat">
                <span class="gallops-result-label">${capitalizeFirst(focus)} Training</span>
                <span class="gallops-result-value plateau">No visible improvement (plateau)</span>
            </div>
        `;
    }

    html += `
        <div class="gallops-result-stat">
            <span class="gallops-result-label">Condition Cost</span>
            <span class="gallops-result-value condition-cost">-${conditionCost}%</span>
        </div>
        <div class="gallops-result-stat">
            <span class="gallops-result-label">Current Condition</span>
            <span class="gallops-result-value" style="color:${horse.condition >= 50 ? 'var(--color-success)' : 'var(--color-danger)'}">${horse.condition}%</span>
        </div>
    `;

    if (tackBreakage) {
        tackBreakage.forEach(item => {
            html += `
                <div class="gallops-result-stat">
                    <span class="gallops-result-label">\u26A0\uFE0F Tack Breakage</span>
                    <span class="gallops-result-value" style="color:var(--color-secondary-dark)">${item} broke during exercise!</span>
                </div>
            `;
        });
    }

    resultsBody.innerHTML = html;
}

// ============================================
// STABLE SYSTEM
// ============================================

let selectedHorseId = null;

function openStable() {
    document.getElementById('stable-budget').textContent = formatMoney(GameState.budget);

    if (GameState.horses.length === 0) {
        document.getElementById('stable-empty').style.display = 'flex';
        document.getElementById('stable-list').style.display = 'none';
    } else {
        document.getElementById('stable-empty').style.display = 'none';
        document.getElementById('stable-list').style.display = 'block';
        renderStableHorses();
    }

    showScreen('stable');
}

/**
 * Render stable horse card (Phase 2: with silk swatch)
 */
function renderStableHorseCard(horse) {
    const conditionClass = horse.condition >= 70 ? '' : horse.condition >= 40 ? 'medium' : 'low';
    const trainingText = horse.trainingFocus ? capitalizeFirst(horse.trainingFocus) : 'None';
    const trainingClass = horse.trainingFocus ? 'active' : '';
    const isInjured = horse.isInjured;
    const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);

    const injuryBadge = isInjured ? `
        <div class="injury-status-badge">
            \u{1F915} ${horse.injuryType} (${horse.recoveryRacesLeft} race${horse.recoveryRacesLeft > 1 ? 's' : ''} left)
        </div>
    ` : '';

    const yearlingBadge = horse.isYearling ? `
        <div class="yearling-status-badge">
            \u{1F3C7} Yearling - Not Race Ready
        </div>
    ` : '';

    const pendingSaleBadge = horse.pendingAuction ? `
        <div class="pending-sale-badge">
            \u{1F3F7}\uFE0F For Sale - Reserve: \u00A3${formatMoney(horse.reservePrice)}
        </div>
    ` : '';

    const ageDisplay = horse.isYearling ? '1 yr (Yearling)' : `${horse.age} yrs`;

    const parentageInfo = horse.sire && horse.dam ? `
        <div class="stable-parentage-info">Sire: ${horse.sire.name} | Dam: ${horse.dam.name}${horse.isHomeBred ? ' · Home-bred' : ''}</div>
        ${horse.isHomeBred && horse.conformation && horse.isYearling ? `<div class="foal-conformation">${horse.conformation}</div>` : ''}
    ` : '';

    const orDisplay = horse.officialRating != null ? horse.officialRating : '--';

    const cardClasses = ['stable-horse-card'];
    if (isInjured) cardClasses.push('injured');
    if (horse.pendingAuction) cardClasses.push('pending-sale');

    return `
        <div class="${cardClasses.join(' ')}" data-horse-id="${horse.id}">
            <div class="stable-card-header">
                <span class="horse-name">${swatch}${horse.name}</span>
                <span class="or-badge-stable">OR ${orDisplay}</span>
                <span class="horse-age">${ageDisplay}</span>
            </div>
            ${yearlingBadge}
            ${pendingSaleBadge}
            ${injuryBadge}
            ${parentageInfo}
            <div class="stable-card-stats">
                <div class="mini-stat-row">
                    <span class="mini-stat-label">Speed</span>
                    <div class="mini-stat-bar">
                        <div class="mini-stat-fill speed" style="width: ${horse.speed}%"></div>
                    </div>
                    <span class="mini-stat-value">${horse.speed}</span>
                </div>
                <div class="mini-stat-row">
                    <span class="mini-stat-label">Stamina</span>
                    <div class="mini-stat-bar">
                        <div class="mini-stat-fill stamina" style="width: ${horse.stamina}%"></div>
                    </div>
                    <span class="mini-stat-value">${horse.stamina}</span>
                </div>
                <div class="mini-stat-row">
                    <span class="mini-stat-label">Acceleration</span>
                    <div class="mini-stat-bar">
                        <div class="mini-stat-fill acceleration" style="width: ${horse.acceleration}%"></div>
                    </div>
                    <span class="mini-stat-value">${horse.acceleration}</span>
                </div>
                <div class="mini-stat-row">
                    <span class="mini-stat-label">Temperament</span>
                    <div class="mini-stat-bar">
                        <div class="mini-stat-fill temperament" style="width: ${horse.temperament}%"></div>
                    </div>
                    <span class="mini-stat-value">${horse.temperament}</span>
                </div>
            </div>
            <div class="horse-preferences compact">
                <span class="pref-tag pref-distance">\u{1F3C7} ${DISTANCE_PREF_LABELS[horse.distancePreference] || 'Mid'}</span>
                <span class="pref-tag pref-ground">\u{1F33F} ${horse.groundPreference || 'Good'}</span>
            </div>
            <div class="stable-card-footer">
                <div class="training-badge ${trainingClass} ${isInjured ? 'disabled' : ''}">
                    <span>\u{1F3AF}</span>
                    <span>Training: ${isInjured ? 'Injured' : trainingText}</span>
                </div>
                <div class="condition-mini">
                    <div class="condition-mini-bar">
                        <div class="condition-mini-fill ${conditionClass}" style="width: ${horse.condition}%"></div>
                    </div>
                    <span>${horse.condition}%</span>
                </div>
            </div>
        </div>
    `;
}

function renderStableHorses() {
    const grid = document.getElementById('horse-grid');
    document.getElementById('stable-horse-count').textContent = GameState.horses.length;

    grid.innerHTML = GameState.horses.map(horse => renderStableHorseCard(horse)).join('');

    grid.querySelectorAll('.stable-horse-card').forEach(card => {
        card.addEventListener('click', () => {
            openHorseDetail(card.dataset.horseId);
        });
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function openHorseDetail(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (!horse) return;

    selectedHorseId = horseId;

    document.getElementById('detail-horse-name').textContent = horse.name;
    const ageText = horse.isYearling ? '1 year old (Yearling)' : `${horse.age} years old`;
    document.getElementById('detail-horse-age').textContent = ageText;

    // Parentage section
    let parentageHTML = '';
    if (horse.sire && horse.dam) {
        parentageHTML = `
        <div class="detail-preferences" style="margin-top: 0; padding-top: 0; border-top: none;">
            <div class="detail-pref-item">
                <span class="detail-pref-label">Sire</span>
                <span class="detail-pref-value">${horse.sire.name}</span>
            </div>
            <div class="detail-pref-item">
                <span class="detail-pref-label">Dam</span>
                <span class="detail-pref-value">${horse.dam.name}</span>
            </div>
        </div>
        `;
    }

    document.getElementById('detail-stats').innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Speed</span>
            <div class="stat-bar-container">
                <div class="stat-bar speed" style="width: ${horse.speed}%"></div>
            </div>
            <span class="stat-value">${horse.speed}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Stamina</span>
            <div class="stat-bar-container">
                <div class="stat-bar stamina" style="width: ${horse.stamina}%"></div>
            </div>
            <span class="stat-value">${horse.stamina}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Acceleration</span>
            <div class="stat-bar-container">
                <div class="stat-bar acceleration" style="width: ${horse.acceleration}%"></div>
            </div>
            <span class="stat-value">${horse.acceleration}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Temperament</span>
            <div class="stat-bar-container">
                <div class="stat-bar temperament" style="width: ${horse.temperament}%"></div>
            </div>
            <span class="stat-value">${horse.temperament}</span>
        </div>
        ${parentageHTML}
        <div class="detail-preferences">
            <div class="detail-pref-item">
                <span class="detail-pref-label">\u{1F3C7} Optimal Trip</span>
                <span class="detail-pref-value">${DISTANCE_PREF_LABELS[horse.distancePreference] || 'Mid (7f-1m)'}</span>
            </div>
            <div class="detail-pref-item">
                <span class="detail-pref-label">\u{1F33F} Preferred Going</span>
                <span class="detail-pref-value">${horse.groundPreference || 'Good'}</span>
            </div>
        </div>
    `;

    const conditionClass = horse.condition >= 70 ? '' : horse.condition >= 40 ? 'medium' : 'low';
    document.getElementById('detail-condition-bar').style.width = `${horse.condition}%`;
    document.getElementById('detail-condition-bar').className = `condition-bar ${conditionClass}`;
    document.getElementById('detail-condition').textContent = `${horse.condition}%`;

    document.getElementById('detail-races').textContent = horse.racesRun || 0;
    document.getElementById('detail-wins').textContent = horse.wins || 0;
    document.getElementById('detail-earnings').textContent = `\u00A3${formatMoney(horse.totalEarnings || 0)}`;

    // Official Rating section
    let existingORSection = document.getElementById('detail-or-section');
    if (existingORSection) existingORSection.remove();

    const orSection = document.createElement('div');
    orSection.id = 'detail-or-section';
    orSection.className = 'detail-section';

    const orValue = horse.officialRating != null ? horse.officialRating : '--';
    let historyHTML = '';
    if (horse.ratingHistory && horse.ratingHistory.length > 0) {
        const recent = horse.ratingHistory.slice(-5).reverse();
        historyHTML = `<div class="rating-history">${recent.map(entry => {
            const changeClass = entry.change > 0 ? 'rating-up' : entry.change < 0 ? 'rating-down' : 'rating-same';
            const changeSign = entry.change > 0 ? '+' : '';
            return `<div class="rating-history-item">
                <span>${entry.raceName}</span>
                <span>${getOrdinal(entry.position)}</span>
                <span class="${changeClass}">${entry.oldRating} \u2192 ${entry.newRating} (${changeSign}${entry.change})</span>
            </div>`;
        }).join('')}</div>`;
    }

    // Show rating band
    const band = horse.officialRating != null ? getRatingBand(horse.officialRating) : null;
    const bandText = band ? `<span class="rating-band-badge">Band: OR ${band.label}</span>` : '';

    orSection.innerHTML = `
        <h3>Official Rating</h3>
        <div class="or-display">
            <span class="or-value-large">${orValue}</span>
            ${bandText}
        </div>
        ${historyHTML}
    `;

    const careerStatsSection = document.querySelector('#horse-detail-modal .detail-section:last-of-type');
    if (careerStatsSection && careerStatsSection.parentNode) {
        careerStatsSection.parentNode.insertBefore(orSection, careerStatsSection.nextSibling);
    }

    // Tactical Suitability section
    let existingTacticSection = document.getElementById('detail-tactic-section');
    if (existingTacticSection) existingTacticSection.remove();

    if (!horse.isYearling) {
        const suit = horse.tacticalSuitability || generateTacticalSuitability(horse);
        const tacticSection = document.createElement('div');
        tacticSection.id = 'detail-tactic-section';
        tacticSection.className = 'detail-section';

        const suitBar = (label, icon, val) => {
            const cls = val >= 70 ? 'suit-high' : val >= 45 ? 'suit-med' : 'suit-low';
            return `<div class="tactic-suit-row">
                <span class="tactic-suit-label">${icon} ${label}</span>
                <div class="tactic-suit-bar-bg">
                    <div class="tactic-suit-bar-fill ${cls}" style="width:${val}%"></div>
                </div>
                <span class="tactic-suit-val ${cls}">${val}%</span>
            </div>`;
        };

        tacticSection.innerHTML = `
            <h3>Tactical Suitability</h3>
            ${suitBar('Front Runner', '\u{1F3C3}', suit.frontRunner)}
            ${suitBar('Stalker', '\u{1F440}', suit.stalker)}
            ${suitBar('Closer', '\u26A1', suit.closer)}
        `;

        if (orSection.parentNode) {
            orSection.parentNode.insertBefore(tacticSection, orSection.nextSibling);
        }
    }

    // Form Guide section
    let existingFormSection = document.getElementById('detail-form-section');
    if (existingFormSection) existingFormSection.remove();

    if (!horse.isYearling) {
        const formSection = document.createElement('div');
        formSection.id = 'detail-form-section';
        formSection.className = 'detail-section';
        formSection.innerHTML = `<h3>Race Form</h3>${renderFormGuide(horse)}`;

        const tacticSectionEl = document.getElementById('detail-tactic-section');
        const insertAfter = tacticSectionEl || orSection;
        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(formSection, insertAfter.nextSibling);
        }
    }

    // Yearling: show gallops option instead of regular training
    const trainingOptions = document.getElementById('training-options');
    const trainingHelp = document.querySelector('.training-help');
    // Remove any previously added gallops button
    const existingGallopsBtn = document.getElementById('btn-send-to-gallops');
    if (existingGallopsBtn) existingGallopsBtn.remove();

    if (horse.isYearling) {
        trainingOptions.style.display = 'none';
        trainingHelp.textContent = 'Yearlings train through gallops sessions.';

        const gallopsBtn = document.createElement('button');
        gallopsBtn.id = 'btn-send-to-gallops';
        gallopsBtn.className = 'btn btn-primary';
        gallopsBtn.style.display = 'block';
        gallopsBtn.style.width = '100%';
        gallopsBtn.style.marginTop = 'var(--space-md)';

        if (horse.isInjured) {
            gallopsBtn.textContent = `Cannot train - ${horse.injuryType}`;
            gallopsBtn.disabled = true;
        } else if (horse.condition < 50) {
            gallopsBtn.textContent = 'Cannot train - Too tired (condition below 50%)';
            gallopsBtn.disabled = true;
        } else {
            gallopsBtn.textContent = '\u{1F3C7} Send to Gallops';
            gallopsBtn.addEventListener('click', () => {
                closeHorseDetail();
                openGallops(horse.id);
            });
        }

        trainingHelp.insertAdjacentElement('afterend', gallopsBtn);
    } else {
        trainingOptions.style.display = '';
        trainingHelp.textContent = 'Select an attribute to focus training on. This will gradually improve that stat.';
    }

    updateTrainingButtons(horse);
    document.getElementById('focus-display').textContent = horse.trainingFocus ? capitalizeFirst(horse.trainingFocus) : 'None';

    // Convert to jumper button
    const existingJumpBtn = document.getElementById('btn-convert-jumper');
    if (existingJumpBtn) existingJumpBtn.remove();

    if (!horse.isYearling && !horse.isJumper && (horse.flatRacesCompleted || horse.racesRun || 0) >= 5) {
        const jumpBtn = document.createElement('button');
        jumpBtn.id = 'btn-convert-jumper';
        jumpBtn.className = 'btn btn-secondary';
        jumpBtn.textContent = '\u{1F3C7} Convert to Jump Horse';
        jumpBtn.addEventListener('click', () => {
            horse.isJumper = true;
            horse.jumpAbility = Math.round((horse.acceleration * 0.4 + horse.stamina * 0.3 + horse.temperament * 0.3));
            gameAlert('Converted!', `${horse.name} has been converted to a jump horse! Jump ability: ${horse.jumpAbility}`);
            closeHorseDetail();
        });
        document.querySelector('.horse-detail-body').appendChild(jumpBtn);
    }

    // Sell at Tattersalls button (non-yearling horses only)
    const existingSellBtn = document.getElementById('btn-sell-horse');
    if (existingSellBtn) existingSellBtn.remove();

    if (!horse.isYearling) {
        const sellBtn = document.createElement('button');
        sellBtn.id = 'btn-sell-horse';

        if (horse.pendingAuction) {
            sellBtn.className = 'btn btn-cancel-sale';
            sellBtn.textContent = `Cancel Sale (Reserve: \u00A3${formatMoney(horse.reservePrice)})`;
            sellBtn.addEventListener('click', () => cancelHorseSale(horse.id));
        } else {
            sellBtn.className = 'btn btn-sell';
            sellBtn.textContent = '\u{1F3F7}\uFE0F Sell at Tattersalls';
            sellBtn.addEventListener('click', () => initiateHorseSale(horse.id));
        }

        document.querySelector('.horse-detail-body').appendChild(sellBtn);
    }

    document.getElementById('horse-detail-modal').style.display = 'flex';
}

function updateTrainingButtons(horse) {
    document.querySelectorAll('.training-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.focus === horse.trainingFocus) {
            btn.classList.add('selected');
        }
    });
}

function setTrainingFocus(focus) {
    if (!selectedHorseId) return;

    const horse = GameState.horses.find(h => h.id === selectedHorseId);
    if (!horse) return;

    if (horse.trainingFocus === focus) {
        horse.trainingFocus = null;
    } else {
        horse.trainingFocus = focus;
    }

    updateTrainingButtons(horse);
    document.getElementById('focus-display').textContent = horse.trainingFocus ? capitalizeFirst(horse.trainingFocus) : 'None';

    renderStableHorses();
}

function closeHorseDetail() {
    document.getElementById('horse-detail-modal').style.display = 'none';
    selectedHorseId = null;
}

// ============================================
// SELLING AUCTION SYSTEM
// ============================================

function showReservePriceModal(horseName, estimatedValue) {
    return new Promise(resolve => {
        const overlay = document.getElementById('game-modal');
        document.getElementById('game-modal-title').textContent = 'Set Reserve Price';
        document.getElementById('game-modal-body').innerHTML = `
            <p>Set the minimum price you'll accept for <strong>${horseName}</strong>.</p>
            <p style="margin-top: var(--space-sm); color: var(--color-text-light);">Estimated value: \u00A3${formatMoney(estimatedValue)}</p>
            <div class="reserve-input-group">
                <label>Reserve \u00A3</label>
                <input type="number" id="reserve-price-input" value="${estimatedValue}" min="5000" step="5000">
            </div>
        `;

        const btnContainer = document.getElementById('game-modal-buttons');
        btnContainer.innerHTML = '';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            resolve(null);
        });
        btnContainer.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = 'Set Reserve';
        confirmBtn.addEventListener('click', () => {
            const input = document.getElementById('reserve-price-input');
            const value = parseInt(input.value) || estimatedValue;
            overlay.style.display = 'none';
            resolve(Math.max(5000, Math.round(value / 5000) * 5000));
        });
        btnContainer.appendChild(confirmBtn);

        overlay.style.display = 'flex';
    });
}

async function initiateHorseSale(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (!horse) return;

    if (horse.ownerId) {
        await gameAlert('Cannot Sell', `${horse.name} belongs to ${horse.ownerName}. You cannot sell owner horses.`);
        return;
    }

    const confirmed = await gameConfirm('Sell at Tattersalls', `Enter ${horse.name} into the next Tattersalls sale?`);
    if (!confirmed) return;

    const estimatedValue = calculateHorseValue(horse);
    const reservePrice = await showReservePriceModal(horse.name, estimatedValue);
    if (reservePrice === null) return;

    horse.pendingAuction = true;
    horse.reservePrice = reservePrice;
    console.log('[Sell] Horse listed:', horse.name, 'pendingAuction:', horse.pendingAuction, 'reserve:', horse.reservePrice);

    closeHorseDetail();
    renderStableHorses();
    await gameAlert('Listed for Sale', `${horse.name} has been entered into the next Tattersalls sale with a reserve of \u00A3${formatMoney(reservePrice)}.`);
}

async function cancelHorseSale(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (!horse) return;

    const confirmed = await gameConfirm('Cancel Sale', `Remove ${horse.name} from the Tattersalls sale?`);
    if (!confirmed) return;

    horse.pendingAuction = false;
    horse.reservePrice = 0;

    closeHorseDetail();
    renderStableHorses();
}

function runSellingAuction() {
    const pendingHorses = GameState.horses.filter(h => h.pendingAuction);
    if (pendingHorses.length === 0) return;

    // Track which screen to return to after the sale
    SellingAuctionState.returnScreen = document.getElementById('season-ceremony').classList.contains('active')
        ? 'season-ceremony' : 'between-races';

    SellingAuctionState.catalogue = [...pendingHorses];
    SellingAuctionState.currentLotIndex = 0;
    SellingAuctionState.results = [];
    SellingAuctionState.totalRevenue = 0;

    document.getElementById('selling-auction-budget').textContent = formatMoney(GameState.budget);
    document.getElementById('selling-total-lots').textContent = SellingAuctionState.catalogue.length;

    document.getElementById('selling-auction-live').style.display = 'block';
    document.getElementById('selling-auction-results').style.display = 'none';

    showScreen('selling-auction');
    runSellingLot();
}

function runSellingLot() {
    const horse = SellingAuctionState.catalogue[SellingAuctionState.currentLotIndex];

    document.getElementById('selling-lot-number').textContent = SellingAuctionState.currentLotIndex + 1;
    document.getElementById('selling-lot-name').textContent = horse.name;
    document.getElementById('selling-lot-age').textContent = horse.age;

    // Parade ring SVG (bare horse at sales)
    document.getElementById('selling-parade-ring').innerHTML = `
        <div class="parade-horse">
          <svg class="horse-svg" viewBox="0 0 56 36" xmlns="http://www.w3.org/2000/svg">
            <path class="h-tail" d="M9,16 Q5,13 3,9 Q2,6 4,4 Q4,7 5,10 Q6,13 8,15" fill="#3a1f0d"/>
            <rect class="h-leg h-leg-hr" x="13" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
            <rect class="h-leg h-leg-hl" x="16" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
            <rect class="h-leg h-leg-fr" x="34" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
            <rect class="h-leg h-leg-fl" x="37" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
            <rect x="13" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hr"/>
            <rect x="16" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hl"/>
            <rect x="34" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fr"/>
            <rect x="37" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fl"/>
            <path d="
              M10,23 Q7,20 7,16 Q7,12 12,12 L22,11 L28,10.5
              Q32,9 35,6 Q37,3.5 40,3.5 L42,3.5
              Q44,3 45,4 Q47,4.5 48,6.5 Q48.5,8 47,9
              Q45,10.5 43,12 Q40,16 38,20 L36,23
              Q28,19 18,23 Z
            " fill="#6b3a1f"/>
            <path d="M10,23 Q28,19 36,23 L36,23 Q28,21 18,23 Z" fill="#5a2e16" opacity="0.5"/>
            <ellipse cx="14" cy="16" rx="4" ry="3" fill="#7a4525" opacity="0.4"/>
            <ellipse cx="33" cy="15" rx="3" ry="3.5" fill="#7a4525" opacity="0.35"/>
            <polygon points="41,3.5 40,0.5 43,2.5" fill="#5a2e16"/>
            <circle cx="45" cy="5.5" r="0.9" fill="#222"/>
            <circle cx="45.2" cy="5.3" r="0.3" fill="#555"/>
            <circle cx="47.5" cy="7.8" r="0.6" fill="#4a2512"/>
            <path class="h-mane" d="M28,10.5 Q31,7 34,5 Q36,3.5 39,3.5" stroke="#3a1f0d" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M43,4 L46,5 L47,7.5 L45,9" stroke="#1a3a6c" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M44,6.5 L46.5,6" stroke="#1a3a6c" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M45,9 Q43,12 40,14 Q38,16 36,15" stroke="#555" stroke-width="0.6" fill="none" stroke-dasharray="1.5,1"/>
          </svg>
        </div>
    `;

    // Stat bars
    document.getElementById('selling-lot-stats').innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Speed</span>
            <div class="stat-bar-container">
                <div class="stat-bar speed" style="width: ${horse.speed}%"></div>
            </div>
            <span class="stat-value">${horse.speed}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Stamina</span>
            <div class="stat-bar-container">
                <div class="stat-bar stamina" style="width: ${horse.stamina}%"></div>
            </div>
            <span class="stat-value">${horse.stamina}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Acceleration</span>
            <div class="stat-bar-container">
                <div class="stat-bar acceleration" style="width: ${horse.acceleration}%"></div>
            </div>
            <span class="stat-value">${horse.acceleration}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Temperament</span>
            <div class="stat-bar-container">
                <div class="stat-bar temperament" style="width: ${horse.temperament}%"></div>
            </div>
            <span class="stat-value">${horse.temperament}</span>
        </div>
    `;

    document.getElementById('selling-reserve-display').textContent = formatMoney(horse.reservePrice);
    document.getElementById('btn-next-selling-lot').style.display = 'none';

    simulateSellingBidding(horse);
}

function simulateSellingBidding(horse) {
    const estimatedValue = calculateHorseValue(horse);
    let currentBid = Math.round(estimatedValue * (0.5 + Math.random() * 0.2) / 5000) * 5000;
    currentBid = Math.max(5000, currentBid);

    // Select 2-4 AI bidders
    const numBidders = randomInt(2, 4);
    const shuffled = [...GameState.competitors].sort(() => Math.random() - 0.5);
    const bidders = shuffled.slice(0, numBidders).map(c => {
        const injuryMult = horse.isInjured ? 0.6 : 1.0;
        const maxBid = Math.round(estimatedValue * (0.7 + Math.random() * 0.6) * injuryMult / 5000) * 5000;
        return { name: c.name, maxBid: Math.max(5000, maxBid) };
    });

    const bidIncrement = 5000;
    let leadingBidder = bidders[0].name;
    let bidRound = 0;

    document.getElementById('selling-current-bid').textContent = formatMoney(currentBid);
    document.getElementById('selling-leading-bidder').textContent = leadingBidder;

    const reserveMet = currentBid >= horse.reservePrice;
    const statusEl = document.getElementById('selling-bid-status');
    statusEl.textContent = reserveMet ? 'Reserve met!' : 'Below reserve';
    statusEl.className = `bid-status ${reserveMet ? 'winning' : 'outbid'}`;

    const interval = setInterval(() => {
        // Find bidders willing to bid higher
        const activeBidders = bidders.filter(b => b.maxBid > currentBid && b.name !== leadingBidder);

        if (activeBidders.length === 0) {
            clearInterval(interval);
            SoundManager.playGavel();

            const sold = currentBid >= horse.reservePrice;
            const statusEl = document.getElementById('selling-bid-status');

            if (sold) {
                statusEl.textContent = `SOLD to ${leadingBidder} for \u00A3${formatMoney(currentBid)}!`;
                statusEl.className = 'bid-status winning';
            } else {
                statusEl.textContent = `Not sold - bidding did not reach reserve`;
                statusEl.className = 'bid-status outbid';
            }

            SellingAuctionState.results.push({
                horse: horse,
                sold: sold,
                finalPrice: sold ? currentBid : 0,
                buyer: sold ? leadingBidder : null
            });

            if (sold) {
                SellingAuctionState.totalRevenue += currentBid;
            }

            // Auto-advance after 2 seconds
            setTimeout(() => {
                nextSellingLot();
            }, 2000);
            return;
        }

        // Pick a random active bidder
        const bidder = activeBidders[randomInt(0, activeBidders.length - 1)];
        currentBid += bidIncrement;
        leadingBidder = bidder.name;
        bidRound++;

        document.getElementById('selling-current-bid').textContent = formatMoney(currentBid);
        document.getElementById('selling-leading-bidder').textContent = leadingBidder;

        const reserveNowMet = currentBid >= horse.reservePrice;
        const statusDisplay = document.getElementById('selling-bid-status');
        statusDisplay.textContent = reserveNowMet ? 'Reserve met!' : 'Below reserve';
        statusDisplay.className = `bid-status ${reserveNowMet ? 'winning' : 'outbid'}`;

    }, 600);
}

function nextSellingLot() {
    SellingAuctionState.currentLotIndex++;

    if (SellingAuctionState.currentLotIndex >= SellingAuctionState.catalogue.length) {
        showSellingResults();
    } else {
        runSellingLot();
    }
}

function showSellingResults() {
    document.getElementById('selling-auction-live').style.display = 'none';
    document.getElementById('selling-auction-results').style.display = 'block';

    const soldCount = SellingAuctionState.results.filter(r => r.sold).length;
    const unsoldCount = SellingAuctionState.results.filter(r => !r.sold).length;

    document.getElementById('selling-results-summary').innerHTML = `
        <p>Horses sold: <span class="highlight">${soldCount}</span></p>
        <p>Horses unsold: <span class="highlight">${unsoldCount}</span></p>
        <p>Total revenue: <span class="highlight">\u00A3${formatMoney(SellingAuctionState.totalRevenue)}</span></p>
    `;

    let horsesHTML = '';
    if (SellingAuctionState.results.length > 0) {
        horsesHTML = '<h3>Sale Results</h3>';
        SellingAuctionState.results.forEach(result => {
            if (result.sold) {
                horsesHTML += `
                    <div class="won-horse-card">
                        <div class="horse-name">${result.horse.name}</div>
                        <div class="purchase-price">Sold to ${result.buyer} for \u00A3${formatMoney(result.finalPrice)}</div>
                    </div>
                `;
            } else {
                horsesHTML += `
                    <div class="won-horse-card unsold">
                        <div class="horse-name">${result.horse.name}</div>
                        <div class="purchase-price">Not sold - reserve of \u00A3${formatMoney(result.horse.reservePrice)} not met</div>
                    </div>
                `;
            }
        });
    }

    document.getElementById('selling-results-horses').innerHTML = horsesHTML;
}

function finishSellingAuction() {
    // Apply results: remove sold horses, clear flags on unsold
    SellingAuctionState.results.forEach(result => {
        if (result.sold) {
            const idx = GameState.horses.findIndex(h => h.id === result.horse.id);
            if (idx !== -1) {
                GameState.horses.splice(idx, 1);
            }
            GameState.budget += result.finalPrice;
        } else {
            const horse = GameState.horses.find(h => h.id === result.horse.id);
            if (horse) {
                horse.pendingAuction = false;
                horse.reservePrice = 0;
            }
        }
    });

    // Remove the selling section from whichever screen we came from
    const betweenContent = document.getElementById('between-races-content');
    if (betweenContent) {
        const sellingSection = betweenContent.querySelector('.selling-auction-section');
        if (sellingSection) sellingSection.remove();
    }
    const ceremonyContent = document.getElementById('ceremony-content');
    if (ceremonyContent) {
        const sellingSection = ceremonyContent.querySelector('.selling-auction-section');
        if (sellingSection) sellingSection.remove();
    }

    showScreen(SellingAuctionState.returnScreen);
}

/**
 * Phase 5: Refactored applyTrainingEffects - returns data instead of alerting
 */
function getBarnUpgradeBonus() {
    const u = GameState.barnUpgrades;
    let bonus = 0;
    if (u.rubberMatting) bonus += 5;
    if (u.autoWaterers) bonus += 3;
    if (u.climateControl) bonus += 5;
    return bonus;
}

function applyTrainingEffects() {
    const trainingResults = [];
    const trainingInjuries = [];
    const upgradeBonus = getBarnUpgradeBonus();

    GameState.horses.forEach(horse => {
        if (horse.isYearling) {
            horse.condition = Math.min(horse.condition + randomInt(10, 20) + upgradeBonus, 100);
            trainingResults.push({ horse: horse.name, result: 'yearling', detail: 'Resting and recovering (yearling)' });
            return;
        }

        if (horse.isInjured) {
            horse.condition = Math.min(horse.condition + randomInt(5, 10) + upgradeBonus, 100);
            trainingResults.push({
                horse: horse.name,
                result: 'resting',
                detail: `Resting due to ${horse.injuryType}`
            });
            return;
        }

        if (horse.trainingFocus) {
            const injury = checkForInjury(horse, 'training');
            if (injury) {
                trainingInjuries.push({ horse: horse.name, injury: injury });
                trainingResults.push({
                    horse: horse.name,
                    result: 'injured',
                    detail: `Injured during training: ${injury.type}`
                });
                return;
            }

            const currentVal = horse[horse.trainingFocus] || 50;
            const maxStat = 95;

            // Diminishing returns: harder to improve above 80
            let improvement;
            if (currentVal >= 90) {
                // Very hard to improve at the top - 30% chance of +1, else 0
                improvement = Math.random() < 0.3 ? 1 : 0;
            } else if (currentVal >= 80) {
                // Tough to improve - usually +1, rarely +0
                improvement = Math.random() < 0.6 ? 1 : 0;
            } else {
                // Normal range: usually +1, small chance of +2
                improvement = Math.random() < 0.2 ? 2 : 1;
            }

            if (improvement > 0) {
                horse[horse.trainingFocus] = Math.min(currentVal + improvement, maxStat);
            }

            trainingResults.push({
                horse: horse.name,
                result: improvement > 0 ? 'improved' : 'plateau',
                detail: improvement > 0
                    ? `${capitalizeFirst(horse.trainingFocus)} +${improvement}`
                    : `${capitalizeFirst(horse.trainingFocus)} training - no visible improvement`,
                stat: horse.trainingFocus,
                amount: improvement
            });
        } else {
            trainingResults.push({
                horse: horse.name,
                result: 'none',
                detail: 'No training focus set'
            });
        }

        horse.condition = Math.min(horse.condition + randomInt(10, 20) + upgradeBonus, 100);
    });

    const setbackReports = checkForSetbacks();
    const staffObservations = generateStaffObservations();

    return { trainingResults, trainingInjuries, setbackReports, staffObservations };
}

function restHorse(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (horse) {
        horse.condition = Math.min(horse.condition + 30 + getBarnUpgradeBonus(), 100);
    }
}

// ============================================
// RACING SYSTEM
// ============================================

const RaceState = {
    selectedRace: null,
    selectedHorseIds: new Set(),   // multi-select horse IDs
    horseStrategies: {},           // horseId -> strategy
    racePositions: [],
    raceInterval: null,
    raceProgress: 0,
    isRacing: false,
    crowdStop: null,
    hoofStop: null,
    // Whip mechanic
    whipCount: {},               // runnerId -> total whip uses
    whipFinalFurlongs: {},       // runnerId -> uses in final 2 furlongs
    whipAvailable: false,        // becomes true at tick 75
    // Jump racing
    jumpTimingActive: false,
    jumpCurrentTick: null,       // tick of current jump
    jumpPressed: false,          // whether spacebar was pressed for current jump
    nextJumpIndex: 0,            // index into race jumps array
    fallenRunners: new Set()     // runners that have fallen
};

/**
 * Generate tactical suitability scores for a horse based on its stats.
 * High speed → front-runner, high acceleration → closer, balanced → stalker.
 */
function generateTacticalSuitability(horse) {
    const { speed, stamina, acceleration, temperament } = horse;
    return {
        frontRunner: Math.round(speed * 0.5 + temperament * 0.3 + stamina * 0.2),
        stalker: Math.round(stamina * 0.35 + speed * 0.3 + acceleration * 0.2 + temperament * 0.15),
        closer: Math.round(acceleration * 0.5 + stamina * 0.3 + temperament * 0.2)
    };
}

/**
 * Get draw position bonus based on draw, distance, and race phase.
 * Low draw = inside rail = advantage on shorter races (tighter turns).
 */
function getDrawBonus(draw, distanceFurlongs, phase) {
    if (!draw) return 0;
    if (distanceFurlongs <= 6) {
        // Sprint: low draw strongly favored early
        return phase === 'early' ? (8 - draw) * 0.015 : 0;
    } else if (distanceFurlongs <= 8) {
        // Mile: slight low draw advantage
        return phase === 'early' ? (8 - draw) * 0.008 : 0;
    }
    // Stayer: draw barely matters
    return 0;
}

/**
 * Open race calendar (Phase 1: uses gameAlert)
 */
async function openRaces() {
    if (GameState.horses.length === 0) {
        await gameAlert('No Horses', 'You need to buy a horse first! Visit Tattersalls auction.');
        return;
    }

    const raceEligibleHorses = GameState.horses.filter(h => !h.isYearling);
    if (raceEligibleHorses.length === 0) {
        await gameAlert('No Eligible Horses', 'Your yearlings are not old enough to race yet. They must turn 2 before entering races.');
        return;
    }

    // Check if all racedays are complete
    if (GameState.racedays && GameState.currentRaceday >= 10) {
        await gameAlert('Season Complete', 'All racedays have been completed for this season.');
        return;
    }

    // Staff shortage warning
    if (isStaffShortage()) {
        await gameAlert('Staff Shortage', `Your staff can only keep an eye on ${getStaffCoverage()} of your ${GameState.horses.length} horses. Unwatched horses get no early warning of problems. Visit the Racing School to hire more - or better - staff.`);
    }

    document.getElementById('race-season').textContent = GameState.season;

    document.getElementById('race-calendar').style.display = 'block';
    document.getElementById('race-horse-select').style.display = 'none';
    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-live').style.display = 'none';
    document.getElementById('race-results').style.display = 'none';

    RaceState.batchEntries = {};
    renderRaceCalendar();
    showScreen('race');
}

/**
 * Get the best tactic for a horse based on tactical suitability
 */
function getBestTactic(horse) {
    const suit = horse.tacticalSuitability || generateTacticalSuitability(horse);
    if (suit.frontRunner >= suit.stalker && suit.frontRunner >= suit.closer) return 'front-runner';
    if (suit.closer >= suit.stalker) return 'closer';
    return 'stalker';
}

/**
 * Quick-enter a horse into a race from the calendar inline view
 */
function quickEnterHorse(raceIndex, horseId) {
    if (!RaceState.batchEntries) RaceState.batchEntries = {};
    if (!RaceState.batchEntries[raceIndex]) {
        RaceState.batchEntries[raceIndex] = { horseIds: new Set(), strategies: {} };
    }

    const entry = RaceState.batchEntries[raceIndex];
    const horse = GameState.horses.find(h => h.id === horseId);
    if (!horse) return;

    if (entry.horseIds.has(horseId)) {
        // Toggle off
        entry.horseIds.delete(horseId);
        delete entry.strategies[horseId];
        if (entry.horseIds.size === 0) delete RaceState.batchEntries[raceIndex];
    } else {
        // Toggle on (max 4 per race)
        if (entry.horseIds.size >= 4) return;
        entry.horseIds.add(horseId);
        entry.strategies[horseId] = getBestTactic(horse);
    }

    renderRaceCalendar();
}

/**
 * Confirm all batch entries at once
 */
function confirmBatchEntries() {
    if (!RaceState.batchEntries) return;
    const currentRaceday = GameState.racedays[GameState.currentRaceday];
    if (!currentRaceday) return;

    Object.entries(RaceState.batchEntries).forEach(([raceIdx, entry]) => {
        const race = currentRaceday.races[parseInt(raceIdx)];
        if (!race || race.completed || race.playerEntered) return;
        if (entry.horseIds.size === 0) return;

        race.playerEntered = true;
        race.selectedHorseIds = [...entry.horseIds];
        race.horseStrategies = { ...entry.strategies };
    });

    RaceState.batchEntries = {};
    renderRaceCalendar();
}

function renderRaceCalendar() {
    const raceList = document.getElementById('race-list');
    const currentRaceday = GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null;

    if (!currentRaceday) {
        raceList.innerHTML = '<div class="no-races">No racedays available.</div>';
        return;
    }

    // Raceday overview header
    let html = `<div class="raceday-header">
        <h3>Raceday ${currentRaceday.racedayNumber} of 10</h3>
        <p class="raceday-subtitle">Select races to enter your horses. Only horses within the correct rating band can run.</p>
    </div>`;

    // Show all 8 races for this raceday
    const raceEligible = GameState.horses.filter(h => !h.isYearling && !h.isInjured && !h.pendingAuction);

    html += currentRaceday.races.map((race, index) => {
        const isCompleted = race.completed;
        const distanceCategory = getRaceDistanceCategory(race.distanceFurlongs);
        const categoryLabels = {
            'sprint': '\u{1F3C3} Sprint',
            'mid': '\u{1F3C7} Mid',
            'stayer': '\u{1F3D4}\uFE0F Stayer'
        };
        const categoryLabel = categoryLabels[distanceCategory];

        const raceType = race.type || 'conditions';
        const jumpBadge = race.isJumpRace ? ' <span class="race-type-badge jump">Jump</span>' : '';
        const raceTypeBadge = `<span class="race-type-badge ${raceType}">${raceType === 'handicap' ? 'Handicap' : raceType === 'group' ? 'Group Race' : 'Conditions'}</span>${jumpBadge}`;
        const groundText = race.ground || 'Good';
        const groundHTML = `<span class="ground-badge ground-${groundText.toLowerCase().replace(/ /g, '-')}">${groundText}</span>`;

        // Rating band badge
        const bandBadge = `<span class="rating-band-badge">OR ${race.ratingBand.label}</span>`;

        // Check if player has eligible horses
        let eligibleHorses = getEligibleHorsesForBand(raceEligible, race.ratingBand);
        // Jump races: only jumper horses; flat races: exclude jumpers optionally (jumpers can run flat)
        if (race.isJumpRace) {
            eligibleHorses = eligibleHorses.filter(h => h.isJumper);
        }
        const hasEligible = eligibleHorses.length > 0;
        const eligibleText = hasEligible ? `${eligibleHorses.length} eligible horse${eligibleHorses.length > 1 ? 's' : ''}` : 'No eligible horses';
        const eligibleClass = hasEligible ? 'eligible' : 'ineligible';

        let statusText = '';
        let cardClass = 'race-card';
        if (isCompleted) {
            const playerResult = race.results?.find(r => r.isPlayer);
            statusText = playerResult ? `Finished ${getOrdinal(playerResult.position)}` : (race.results?.length > 0 ? 'Completed (no runner)' : 'Void');
            cardClass += ' completed';
        } else if (race.playerEntered) {
            statusText = 'Entered';
            cardClass += ' entered';
        } else if (!hasEligible) {
            statusText = 'No eligible horses';
            cardClass += ' locked';
        } else {
            statusText = 'Click to enter';
            cardClass += ' next';
        }

        const canClick = !isCompleted && hasEligible && !race.playerEntered;
        const clickHandler = canClick ? `onclick="selectRacedayRace(${index})"` : '';

        // Collect horse IDs already entered in other races on this raceday
        const enteredElsewhere = new Set();
        currentRaceday.races.forEach((r, ri) => {
            if (ri !== index && r.playerEntered && r.selectedHorseIds) {
                r.selectedHorseIds.forEach(id => enteredElsewhere.add(id));
            }
        });
        // Also check batch entries
        if (RaceState.batchEntries) {
            Object.entries(RaceState.batchEntries).forEach(([ri, e]) => {
                if (parseInt(ri) !== index) e.horseIds.forEach(id => enteredElsewhere.add(id));
            });
        }

        // Inline eligible horse list for quick entry
        const batchEntry = RaceState.batchEntries?.[index];
        let inlineHorsesHTML = '';
        if (canClick && hasEligible) {
            const raceGround = race.ground || 'Good';
            const raceGroundIdx = GROUND_CONDITIONS.indexOf(raceGround);

            inlineHorsesHTML = `<div class="race-inline-horses">` + eligibleHorses.map(h => {
                const isInBatch = batchEntry?.horseIds.has(h.id);
                const isEnteredElsewhere = enteredElsewhere.has(h.id);
                const notTackedUp = !h.tackedUp?.saddle || !h.tackedUp?.bridle;
                const lowCondition = h.condition < 50;

                // Distance/ground warnings
                const horseDistPref = h.distancePreference || 'mid';
                const distMismatch = Math.abs(DISTANCE_PREFERENCES.indexOf(horseDistPref) - DISTANCE_PREFERENCES.indexOf(distanceCategory));
                const groundMismatch = Math.abs(GROUND_CONDITIONS.indexOf(h.groundPreference || 'Good') - raceGroundIdx);

                let warnings = [];
                if (notTackedUp) warnings.push('<span class="entry-warn-badge warn-tack">Not tacked</span>');
                if (lowCondition) warnings.push(`<span class="entry-warn-badge warn-cond">${h.condition}%</span>`);
                if (distMismatch >= 2) warnings.push('<span class="entry-warn-badge warn-dist">Wrong trip</span>');
                if (groundMismatch >= 2) warnings.push('<span class="entry-warn-badge warn-ground">Wrong going</span>');
                if (isEnteredElsewhere) warnings.push('<span class="entry-warn-badge warn-entered">Entered elsewhere</span>');

                const disabled = notTackedUp || isEnteredElsewhere;
                const btnClass = isInBatch ? 'quick-enter-btn entered' : 'quick-enter-btn';
                const btnText = isInBatch ? '\u2714 Entered' : 'Quick Enter';
                const btnClick = disabled ? '' : `onclick="event.stopPropagation();quickEnterHorse(${index},'${h.id}')"`;

                return `<div class="race-inline-horse ${disabled ? 'disabled' : ''}">
                    <span class="inline-horse-name">${h.name}</span>
                    <span class="inline-horse-or">OR ${h.officialRating || '--'}</span>
                    <span class="inline-horse-cond" style="color:${h.condition >= 70 ? 'var(--color-success)' : h.condition >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'};">${h.condition}%</span>
                    ${warnings.join('')}
                    <button class="${btnClass}" ${btnClick} ${disabled ? 'disabled' : ''}>${btnText}</button>
                </div>`;
            }).join('') + `</div>`;
        }

        return `
            <div class="${cardClass}" data-race-index="${index}" ${clickHandler}>
                <div class="race-card-left">
                    <div class="race-number">${race.raceNumber}</div>
                    <div class="race-card-info">
                        <h3>${race.name} ${raceTypeBadge}</h3>
                        <div class="race-card-meta">
                            ${race.distance} <span class="distance-category ${distanceCategory}">${categoryLabel}</span>
                            ${groundHTML}
                            ${bandBadge}
                        </div>
                        <div class="race-card-eligible ${eligibleClass}">${eligibleText}</div>
                    </div>
                </div>
                <div class="race-card-right">
                    <div class="race-card-prize">\u00A3${formatMoney(race.prize)}</div>
                    <div class="race-card-status">${statusText}</div>
                </div>
                ${inlineHorsesHTML}
            </div>
        `;
    }).join('');

    // Batch entry confirmation bar
    if (RaceState.batchEntries && Object.keys(RaceState.batchEntries).length > 0) {
        let totalHorses = 0;
        let totalRaces = 0;
        Object.values(RaceState.batchEntries).forEach(e => {
            if (e.horseIds.size > 0) { totalHorses += e.horseIds.size; totalRaces++; }
        });
        if (totalHorses > 0) {
            html += `<div class="batch-entry-bar">
                <span>${totalHorses} horse${totalHorses > 1 ? 's' : ''} across ${totalRaces} race${totalRaces > 1 ? 's' : ''}</span>
                <button class="btn btn-primary" onclick="confirmBatchEntries()">Confirm Entries</button>
            </div>`;
        }
    }

    // Add "Start Raceday" button to run all entered races + simulate non-entered
    const enteredRaces = currentRaceday.races.filter(r => r.playerEntered && !r.completed);
    const anyEntered = enteredRaces.length > 0;
    const allCompleted = currentRaceday.races.every(r => r.completed);

    if (!allCompleted) {
        const startLabel = anyEntered
            ? `Start Raceday (${enteredRaces.length} race${enteredRaces.length > 1 ? 's' : ''} entered)`
            : 'Start Raceday (no entries)';
        html += `<div class="raceday-actions">
            <button class="btn btn-primary" onclick="startRaceday()">
                ${startLabel}
            </button>
            <p class="raceday-hint">Races you don't enter will be simulated and results shown after.</p>
        </div>`;
    } else {
        html += `<div class="raceday-actions">
            <button class="btn btn-primary" onclick="finishRacedayView()">View Raceday Results</button>
        </div>`;
    }

    raceList.innerHTML = html;
}

/**
 * Select a race within the current raceday for horse entry
 */
function selectRacedayRace(raceIndex) {
    const currentRaceday = GameState.racedays[GameState.currentRaceday];
    if (!currentRaceday) return;

    const race = currentRaceday.races[raceIndex];
    if (!race || race.completed || race.playerEntered) return;

    RaceState.selectedRace = race;
    RaceState.selectedRaceday = currentRaceday;
    RaceState.selectedRacedayRaceIndex = raceIndex;
    RaceState.selectedHorseIds = new Set();
    RaceState.horseStrategies = {};

    const distanceCategory = getRaceDistanceCategory(race.distanceFurlongs);
    const categoryInfo = {
        'sprint': { label: '\u{1F3C3} Sprint', tip: 'Speed is key - fast horses excel' },
        'mid': { label: '\u{1F3C7} Mid Distance', tip: 'Balanced horses perform well' },
        'stayer': { label: '\u{1F3D4}\uFE0F Stayer', tip: 'Stamina is crucial for this distance' }
    };
    const info = categoryInfo[distanceCategory];
    const groundText = race.ground || 'Good';

    const raceType = race.type || 'conditions';
    const raceTypeBadge = `<span class="race-type-badge ${raceType}">${raceType === 'handicap' ? 'Handicap' : raceType === 'group' ? 'Group Race' : 'Conditions'}</span>`;
    const bandBadge = `<span class="rating-band-badge">OR ${race.ratingBand.label}</span>`;

    document.getElementById('selected-race-name').textContent = race.name;
    document.getElementById('selected-race-distance').innerHTML = `
        ${race.distance}
        <span class="distance-category ${distanceCategory}">${info.label}</span>
        <span class="ground-badge ground-${groundText.toLowerCase().replace(/ /g, '-')}">${groundText}</span>
        ${raceTypeBadge}
        ${bandBadge}
        <br><small class="distance-tip">${info.tip}</small>
    `;
    document.getElementById('selected-race-prize').textContent = formatMoney(race.prize);

    renderHorseOptions();
    updateEnterRaceButton();

    document.getElementById('race-calendar').style.display = 'none';
    document.getElementById('race-horse-select').style.display = 'block';
}

/**
 * Start running the raceday - processes player-entered races live, simulates the rest
 */
function autoAssignStaffTasks() {
    if (!GameState.settings?.staffAutomation) return;
    if (!GameState.staff || !GameState.horses) return;

    const freeStaff = GameState.staff.filter(s => !s.busy);
    if (freeStaff.length === 0) return;

    // Build list of horses needing care, sorted by worst care first
    const needsCare = GameState.horses
        .map((h, idx) => {
            if (h.paddockTurnedOut || h.isYearling) return null;
            const care = h.stallCare || {};
            const tasks = [];
            if ((care.waterLevel || 0) < 50) tasks.push({ task: 'water', priority: 100 - (care.waterLevel || 0) });
            if ((care.feedLevel || 0) < 50) tasks.push({ task: 'feed', priority: 100 - (care.feedLevel || 0) });
            if ((care.hayLevel || 0) < 50) tasks.push({ task: 'hay', priority: 100 - (care.hayLevel || 0) });
            if ((care.manurePiles || 0) >= 2) tasks.push({ task: 'muck-out', priority: (care.manurePiles || 0) * 20 });
            return tasks.length > 0 ? { horseIdx: idx, tasks } : null;
        })
        .filter(Boolean)
        .sort((a, b) => Math.max(...b.tasks.map(t => t.priority)) - Math.max(...a.tasks.map(t => t.priority)));

    // Assign free staff to highest priority tasks
    let staffIdx = 0;
    for (const entry of needsCare) {
        if (staffIdx >= freeStaff.length) break;
        const bestTask = entry.tasks.sort((a, b) => b.priority - a.priority)[0];
        const staff = freeStaff[staffIdx];
        staff.busy = true;
        staff.busyTask = bestTask.task;
        staff.busyHorseIdx = entry.horseIdx;

        // Auto-complete after a short delay
        setTimeout(() => {
            if (typeof applyStaffTaskEffect === 'function') {
                applyStaffTaskEffect(staff, entry.horseIdx, bestTask.task);
            }
            staff.busy = false;
            staff.busyTask = null;
            staff.busyHorseIdx = null;
        }, 2000);

        staffIdx++;
    }
}

function startRaceday() {
    // Auto-assign staff if automation is enabled
    autoAssignStaffTasks();

    const currentRaceday = GameState.racedays[GameState.currentRaceday];
    if (!currentRaceday) return;

    // Show betting panel before raceday starts
    const bettingOverlay = document.getElementById('betting-overlay');
    if (bettingOverlay && !currentRaceday._bettingDone) {
        currentRaceday._bettingDone = true;
        showBettingPanel(currentRaceday);
        return; // Will continue when player closes betting panel
    }

    // Gather the player-entered races that haven't been completed
    RaceState.racedayPlayerRaces = currentRaceday.races.filter(r => r.playerEntered && !r.completed);
    RaceState.racedayCurrentIndex = 0;

    if (RaceState.racedayPlayerRaces.length === 0) {
        // No player races - simulate all and show results
        simulateEntireRaceday(currentRaceday);
        return;
    }

    // Start the first player race
    startNextRacedayRace();
}

function startNextRacedayRace() {
    if (RaceState.racedayCurrentIndex >= RaceState.racedayPlayerRaces.length) {
        // All player races done, simulate remaining non-entered races
        const currentRaceday = GameState.racedays[GameState.currentRaceday];
        simulateRemainingRaces(currentRaceday);
        return;
    }

    const race = RaceState.racedayPlayerRaces[RaceState.racedayCurrentIndex];
    RaceState.selectedRace = race;

    // Restore selected horse IDs and strategies from the race entry
    RaceState.selectedHorseIds = new Set(race.selectedHorseIds || []);
    RaceState.horseStrategies = race.horseStrategies || {};

    startRace();
}

/**
 * Simulate all non-player races on a raceday
 */
function simulateRemainingRaces(raceday) {
    const usedAIHorseIds = new Set();

    // Mark AI horses used in player-entered races as unavailable
    raceday.races.forEach(race => {
        if (race.results) {
            race.results.forEach(r => {
                if (!r.isPlayer) {
                    // Find the horse ID from results
                    GameState.competitors.forEach(t => {
                        if (t.horses) {
                            t.horses.forEach(h => {
                                if (h.name === r.name) usedAIHorseIds.add(h.id);
                            });
                        }
                    });
                }
            });
        }
    });

    // Simulate non-entered, non-completed races
    raceday.races.forEach(race => {
        if (!race.completed && !race.playerEntered) {
            race._racedayNumber = raceday.racedayNumber;
            simulateNonEnteredRace(race, usedAIHorseIds);
        }
    });

    raceday.completed = true;
    showRacedayResults(raceday);
}

function simulateEntireRaceday(raceday) {
    const usedAIHorseIds = new Set();
    raceday.races.forEach(race => {
        if (!race.completed) {
            race._racedayNumber = raceday.racedayNumber;
            simulateNonEnteredRace(race, usedAIHorseIds);
        }
    });
    raceday.completed = true;
    showRacedayResults(raceday);
}

/**
 * Show raceday results summary
 */
function showRacedayResults(raceday) {
    document.getElementById('race-calendar').style.display = 'none';
    document.getElementById('race-horse-select').style.display = 'none';
    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-live').style.display = 'none';
    document.getElementById('race-results').style.display = 'block';

    document.getElementById('result-race-name').textContent = `Raceday ${raceday.racedayNumber} Results`;

    // Build comprehensive results
    let podiumHTML = '';
    let yourResultHTML = '';
    let breakdownHTML = '';

    raceday.races.forEach((race, idx) => {
        const results = race.results || [];
        const playerResult = results.find(r => r.isPlayer);
        const winner = results[0];

        let raceResultClass = playerResult ? (playerResult.position <= 3 ? 'race-result-placed' : 'race-result-ran') : 'race-result-norunner';

        breakdownHTML += `
            <div class="raceday-result-card ${raceResultClass}">
                <div class="raceday-result-header">
                    <span class="race-number">${race.raceNumber}</span>
                    <span class="race-name">${race.name}</span>
                    <span class="rating-band-badge">OR ${race.ratingBand.label}</span>
                    <span class="race-distance">${race.distance}</span>
                </div>
                <div class="raceday-result-places">
                    ${results.slice(0, 3).map((r, i) => `
                        <span class="result-place ${r.isPlayer ? 'player-result' : ''}">
                            ${i + 1}. ${r.name} (${r.trainer})
                        </span>
                    `).join('')}
                    ${results.length === 0 ? '<span class="result-place void">Race void - insufficient runners</span>' : ''}
                </div>
                ${playerResult ? `<div class="player-race-result">Your runner: ${playerResult.name} - ${getOrdinal(playerResult.position)}</div>` : '<div class="player-race-result no-runner">No runner entered</div>'}
            </div>
        `;
    });

    // Player summary for this raceday
    let totalPrize = 0;
    let totalPoints = 0;
    raceday.races.forEach(race => {
        if (!race.results) return;
        race.results.forEach(r => {
            if (r.isPlayer) {
                const reward = getRacePlaceReward(r.position, race.prize);
                totalPrize += reward.prize;
                totalPoints += reward.points;
            }
        });
    });

    document.getElementById('results-podium').innerHTML = '';

    document.getElementById('your-result').innerHTML = `
        <h3>Raceday ${raceday.racedayNumber} Summary</h3>
        <div class="result-details">
            <div class="result-detail">
                <span class="result-detail-value">\u00A3${formatMoney(totalPrize)}</span>
                <span class="result-detail-label">Prize Money Today</span>
            </div>
            <div class="result-detail">
                <span class="result-detail-value">+${totalPoints}</span>
                <span class="result-detail-label">Points Today</span>
            </div>
        </div>
    `;

    document.getElementById('results-breakdown').innerHTML = breakdownHTML;

    const isSeasonEnd = GameState.currentRaceday >= 9 && raceday.completed;
    document.getElementById('btn-finish-race').textContent = isSeasonEnd ? 'View Season Results' : 'Continue';
    document.getElementById('btn-finish-race').onclick = function() {
        if (isSeasonEnd) {
            showSeasonCeremony();
        } else {
            finishRacedayView();
        }
    };
}

function getRacePlaceReward(place, prize) {
    switch (place) {
        case 1: return { prize: prize, points: 25 };
        case 2: return { prize: Math.round(prize * 0.4), points: 18 };
        case 3: return { prize: Math.round(prize * 0.2), points: 12 };
        case 4: return { prize: Math.round(prize * 0.1), points: 8 };
        case 5: return { prize: Math.round(prize * 0.05), points: 5 };
        default: return { prize: 0, points: 2 };
    }
}

function finishRacedayView() {
    GameState.currentRaceday++;

    // Owner system: collect fees, update satisfaction, check for new owners
    const ownerFees = collectOwnerFees();
    updateOwnerSatisfaction();
    evaluateOwnerAttraction();

    // Pest and pet system
    checkPestSpawns();
    applyPestEffects();
    checkCatDogConflict();

    if (GameState.currentRaceday >= 10) {
        showSeasonCeremony();
    } else {
        // Apply training between racedays
        const trainingData = applyTrainingEffects();
        showBetweenRaces(trainingData);
    }
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function selectRace(raceIndex) {
    // Legacy function - redirect to raceday flow
    selectRacedayRace(raceIndex);
}

/**
 * Render horse options for race entry - multi-select toggle
 */
function renderHorseOptions() {
    const horseList = document.getElementById('entry-horse-list');

    const raceEligible = GameState.horses.filter(h => !h.isYearling);
    // Filter by rating band if available
    const ratingBand = RaceState.selectedRace?.ratingBand;
    const bandFiltered = ratingBand ? raceEligible.filter(h => isHorseEligibleForBand(h, ratingBand)) : raceEligible;

    // Collect horse IDs already entered in other races on this raceday (for availability check)
    const enteredElsewhereCheck = new Set();
    const rdCheck = RaceState.selectedRaceday || (GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null);
    if (rdCheck) {
        rdCheck.races.forEach(race => {
            if (race.playerEntered && race.id !== RaceState.selectedRace?.id && race.selectedHorseIds) {
                race.selectedHorseIds.forEach(id => enteredElsewhereCheck.add(id));
            }
        });
    }

    const availableHorses = bandFiltered.filter(h => !h.isInjured && !h.pendingAuction && !enteredElsewhereCheck.has(h.id));
    if (availableHorses.length === 0) {
        const hasYearlings = GameState.horses.some(h => h.isYearling);
        const hasPendingSale = GameState.horses.some(h => h.pendingAuction);
        let msg1 = 'All your horses are currently injured!';
        let msg2 = "You'll need to skip this race or wait for them to recover.";
        if (hasYearlings) {
            msg1 = 'Your yearlings are not old enough to race yet!';
            msg2 = 'Yearlings must turn 2 before they can enter races.';
        } else if (hasPendingSale) {
            msg1 = 'All your horses are listed for sale or injured!';
            msg2 = 'Cancel a sale from the stable to make a horse available.';
        }
        horseList.innerHTML = `
            <div class="no-horses-available">
                <p>\u26A0\uFE0F ${msg1}</p>
                <p>${msg2}</p>
            </div>
        `;
        return;
    }

    const maxEntries = 4; // Max horses per race

    // Collect horse IDs already entered in OTHER races on this raceday
    const alreadyEnteredIds = new Set();
    const currentRaceday = RaceState.selectedRaceday || (GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null);
    if (currentRaceday) {
        currentRaceday.races.forEach(race => {
            if (race.playerEntered && race.id !== RaceState.selectedRace?.id && race.selectedHorseIds) {
                race.selectedHorseIds.forEach(id => alreadyEnteredIds.add(id));
            }
        });
    }

    horseList.innerHTML = bandFiltered.map(horse => {
        const isInjured = horse.isInjured;
        const isSelected = RaceState.selectedHorseIds.has(horse.id);
        const isEnteredElsewhere = alreadyEnteredIds.has(horse.id);
        const conditionClass = isInjured ? 'injured' : horse.condition >= 70 ? 'good' : horse.condition >= 40 ? 'medium' : 'low';
        const conditionText = isInjured ? 'Injured' : horse.condition >= 70 ? 'Ready' : horse.condition >= 40 ? 'Tired' : 'Exhausted';
        const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);

        // Suitability indicators for distance and ground
        const raceCategory = getRaceDistanceCategory(RaceState.selectedRace.distanceFurlongs);
        const horsePrefIdx = DISTANCE_PREFERENCES.indexOf(horse.distancePreference || 'mid');
        const raceCatIdx = DISTANCE_PREFERENCES.indexOf(raceCategory);
        const distMismatch = Math.abs(horsePrefIdx - raceCatIdx);
        const distSuit = distMismatch === 0 ? '\u2705' : distMismatch === 1 ? '\u{1F7E1}' : '\u274C';

        const raceGround = RaceState.selectedRace.ground || 'Good';
        const horseGroundIdx = GROUND_CONDITIONS.indexOf(horse.groundPreference || 'Good');
        const raceGroundIdx = GROUND_CONDITIONS.indexOf(raceGround);
        const groundMismatch = Math.abs(horseGroundIdx - raceGroundIdx);
        const groundSuit = groundMismatch === 0 ? '\u2705' : groundMismatch <= 1 ? '\u{1F7E1}' : '\u274C';

        const isPendingSale = horse.pendingAuction;
        const notTackedUp = !horse.tackedUp?.saddle || !horse.tackedUp?.bridle;
        let warningText = '';
        if (isInjured) {
            warningText = `\u{1F6AB} ${horse.injuryType} - Out for ${horse.recoveryRacesLeft} more race${horse.recoveryRacesLeft > 1 ? 's' : ''}`;
        } else if (isPendingSale) {
            warningText = '\u{1F6AB} Listed for sale at Tattersalls';
        } else if (isEnteredElsewhere) {
            warningText = '\u{1F6AB} Already entered in another race today';
        } else if (notTackedUp) {
            warningText = 'Not tacked up — visit the Tack Room in the yard';
        } else if (horse.condition < 70) {
            warningText = 'Low condition will affect performance';
        }

        const isDisabled = isInjured || isPendingSale || notTackedUp || isEnteredElsewhere;
        const atMax = RaceState.selectedHorseIds.size >= maxEntries && !isSelected;
        const cardClass = isDisabled ? 'entry-horse-card injured disabled' :
                         atMax ? 'entry-horse-card disabled' :
                         isSelected ? 'entry-horse-card selected' :
                         horse.condition < 70 ? 'entry-horse-card low-condition' : 'entry-horse-card';
        const clickHandler = (isDisabled || atMax) ? '' : `onclick="toggleHorseForRace('${horse.id}')"`;

        return `
            <div class="${cardClass}" data-horse-id="${horse.id}" ${clickHandler}>
                <div class="entry-horse-header">
                    <span class="horse-name">${swatch}${horse.name}</span>
                    <span class="condition-badge ${conditionClass}">${conditionText}${!isDisabled ? ' ' + horse.condition + '%' : ''}</span>
                    ${!isDisabled ? `<span class="select-indicator">${isSelected ? '\u2714' : ''}</span>` : ''}
                </div>
                <div class="stable-card-stats">
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Speed</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill speed" style="width: ${horse.speed}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.speed}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Stamina</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill stamina" style="width: ${horse.stamina}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.stamina}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Acceleration</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill acceleration" style="width: ${horse.acceleration}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.acceleration}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">Temperament</span>
                        <div class="mini-stat-bar">
                            <div class="mini-stat-fill temperament" style="width: ${horse.temperament}%"></div>
                        </div>
                        <span class="mini-stat-value">${horse.temperament}</span>
                    </div>
                </div>
                ${!isDisabled ? (() => {
                    const or = horse.officialRating;
                    const orDisplay = or != null ? or : '--';
                    const selectedRaceType = RaceState.selectedRace.type || 'conditions';
                    let weightNote = '';
                    if (selectedRaceType === 'handicap' && or != null) {
                        weightNote = `<span class="weight-badge">Est. ${formatWeight(Math.max(112, 140 - (Math.max(...GameState.horses.filter(h => !h.isYearling && !h.isInjured).map(h => h.officialRating || 0)) - or)))}</span>`;
                    } else {
                        weightNote = `<span class="weight-badge">${formatWeight(126)}</span>`;
                    }
                    return `<div class="entry-rating-info">
                        <span class="or-badge">OR ${orDisplay}</span>
                        ${weightNote}
                    </div>
                    <div class="entry-suitability">
                        <span class="suit-item">${distSuit} Trip: ${DISTANCE_PREF_LABELS[horse.distancePreference] || 'Mid'}</span>
                        <span class="suit-item">${groundSuit} Going: ${horse.groundPreference || 'Good'}</span>
                    </div>`;
                })() : ''}
                ${!isDisabled && RaceState.selectedRace.type === 'handicap' ? '<div class="entry-weight-note"><em>Final weights depend on all runners</em></div>' : ''}
                ${warningText ? `<div class="entry-warning">${isDisabled ? '' : '\u26A0\uFE0F '}${warningText}</div>` : ''}
            </div>
        `;
    }).join('');
}

function toggleHorseForRace(horseId) {
    if (RaceState.selectedHorseIds.has(horseId)) {
        RaceState.selectedHorseIds.delete(horseId);
        delete RaceState.horseStrategies[horseId];
    } else {
        RaceState.selectedHorseIds.add(horseId);
    }
    renderHorseOptions();
    updateEnterRaceButton();
}

function updateEnterRaceButton() {
    const btn = document.getElementById('btn-enter-race');
    const count = RaceState.selectedHorseIds.size;
    btn.disabled = count === 0;
    btn.textContent = count === 0 ? 'Enter Race' : `Enter Race (${count} horse${count > 1 ? 's' : ''})`;
}

function proceedToStrategy() {
    document.getElementById('strategy-race-name').textContent = RaceState.selectedRace.name;
    renderStrategyEntries();

    document.getElementById('race-horse-select').style.display = 'none';
    document.getElementById('race-strategy').style.display = 'block';

    // In raceday mode, update the "Start Race" button to "Confirm Entry"
    const btn = document.getElementById('btn-start-race');
    if (RaceState.selectedRaceday) {
        btn.textContent = 'Confirm Entry';
        btn.onclick = function() {
            confirmRacedayEntry();
        };
    } else {
        btn.textContent = 'Start Race';
        btn.onclick = function() {
            startRace();
        };
    }
}

function confirmRacedayEntry() {
    // Save selections to the race object for later execution
    const race = RaceState.selectedRace;
    race.playerEntered = true;
    race.selectedHorseIds = [...RaceState.selectedHorseIds];
    race.horseStrategies = { ...RaceState.horseStrategies };

    // Reset the start race button for normal use
    const btn = document.getElementById('btn-start-race');
    btn.textContent = 'Start Race';
    btn.onclick = function() { startRace(); };

    // Return to race calendar
    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-calendar').style.display = 'block';
    renderRaceCalendar();
}

function renderStrategyEntries() {
    const container = document.getElementById('strategy-entries');
    const selectedHorses = GameState.horses.filter(h => RaceState.selectedHorseIds.has(h.id));

    // Auto-suggest best tactic for horses without a strategy set
    selectedHorses.forEach(horse => {
        if (!RaceState.horseStrategies[horse.id]) {
            RaceState.horseStrategies[horse.id] = getBestTactic(horse);
        }
    });

    container.innerHTML = selectedHorses.map(horse => {
        const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);
        const currentStrategy = RaceState.horseStrategies[horse.id] || '';
        const suit = horse.tacticalSuitability || generateTacticalSuitability(horse);

        const suitClass = (val) => val >= 70 ? 'suit-high' : val >= 45 ? 'suit-med' : 'suit-low';

        return `
            <div class="strategy-entry-card" data-horse-id="${horse.id}">
                <div class="strategy-entry-header">
                    ${swatch}<span class="strategy-horse-name">${horse.name}</span>
                </div>
                <div class="strategy-buttons">
                    <button class="strategy-btn ${currentStrategy === 'front-runner' ? 'selected' : ''}"
                            onclick="setHorseStrategy('${horse.id}', 'front-runner')">
                        <span class="strategy-icon">\u{1F3C3}</span>
                        <span class="strategy-label">Front Runner</span>
                        <span class="strategy-desc">Fast start, may tire</span>
                        <span class="strategy-suit ${suitClass(suit.frontRunner)}">${suit.frontRunner}% suited</span>
                    </button>
                    <button class="strategy-btn ${currentStrategy === 'stalker' ? 'selected' : ''}"
                            onclick="setHorseStrategy('${horse.id}', 'stalker')">
                        <span class="strategy-icon">\u{1F440}</span>
                        <span class="strategy-label">Stalker</span>
                        <span class="strategy-desc">Track leaders, kick late</span>
                        <span class="strategy-suit ${suitClass(suit.stalker)}">${suit.stalker}% suited</span>
                    </button>
                    <button class="strategy-btn ${currentStrategy === 'closer' ? 'selected' : ''}"
                            onclick="setHorseStrategy('${horse.id}', 'closer')">
                        <span class="strategy-icon">\u26A1</span>
                        <span class="strategy-label">Closer</span>
                        <span class="strategy-desc">Hold back, strong finish</span>
                        <span class="strategy-suit ${suitClass(suit.closer)}">${suit.closer}% suited</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    updateStartRaceButton();
}

function setHorseStrategy(horseId, strategy) {
    RaceState.horseStrategies[horseId] = strategy;
    renderStrategyEntries();
}

function updateStartRaceButton() {
    const btn = document.getElementById('btn-start-race');
    const allSet = [...RaceState.selectedHorseIds].every(id => RaceState.horseStrategies[id]);
    btn.disabled = !allSet;
}

/**
 * Start race (Phase 3: CSS sprites, Phase 4: sounds, Phase 2: silk colours)
 * Supports multiple player horses
 */
function startRace() {
    RaceState.raceProgress = 0;
    RaceState.isRacing = true;
    RaceState.racePositions = [];
    RaceState.playerInjuredDuringRace = {};
    RaceState._finishCount = 0;
    RaceState.whipCount = {};
    RaceState.whipFinalFurlongs = {};
    RaceState.whipAvailable = false;
    RaceState.jumpTimingActive = false;
    RaceState.jumpCurrentTick = null;
    RaceState.jumpPressed = false;
    RaceState.nextJumpIndex = 0;
    RaceState.fallenRunners = new Set();

    const totalRunners = 8;
    const runners = [];

    const raceType = RaceState.selectedRace.type || 'conditions';

    // Add player horses
    const playerHorses = GameState.horses.filter(h => RaceState.selectedHorseIds.has(h.id));
    playerHorses.forEach(horse => {
        const playerForm = 0.75 + Math.random() * 0.45;
        runners.push({
            id: horse.id,
            name: horse.name,
            trainer: GameState.stableName,
            isPlayer: true,
            stats: { ...horse },
            strategy: RaceState.horseStrategies[horse.id],
            position: 0,
            energy: 100,
            score: 0,
            formFactor: playerForm,
            silkPrimary: horse.silkPrimary || GameState.silkPrimary,
            silkSecondary: horse.silkSecondary || GameState.silkSecondary,
            distancePreference: horse.distancePreference || 'mid',
            groundPreference: horse.groundPreference || 'Good',
            officialRating: horse.officialRating || calculateOfficialRating(horse),
            tacticalSuitability: horse.tacticalSuitability || generateTacticalSuitability(horse)
        });
    });

    // Fill remaining slots with AI horses from persistent stables matching rating band
    const aiSlots = totalRunners - runners.length;
    const ratingBand = RaceState.selectedRace?.ratingBand;
    const excludeIds = new Set(runners.map(r => r.id));

    let aiEntries = [];
    if (ratingBand) {
        aiEntries = getAIEntriesForRace(ratingBand, aiSlots, excludeIds);
    }

    // If not enough AI horses in band, generate temporary ones to fill
    while (aiEntries.length < aiSlots) {
        const tempHorse = generateHorse('medium');
        if (ratingBand) {
            // Force stats to fit within band
            const targetOR = randomInt(ratingBand.min, ratingBand.max);
            const diff = targetOR - calculateOfficialRating(tempHorse);
            tempHorse.speed = Math.max(1, Math.min(100, tempHorse.speed + diff));
            tempHorse.officialRating = calculateOfficialRating(tempHorse);
        }
        const tempTrainer = GameState.competitors[aiEntries.length % GameState.competitors.length];
        aiEntries.push({ horse: tempHorse, trainer: tempTrainer });
    }

    aiEntries.forEach(entry => {
        const aiHorse = entry.horse;
        const aiTrainer = entry.trainer;

        // AI picks tactic based on suitability
        const aiSuit = aiHorse.tacticalSuitability || generateTacticalSuitability(aiHorse);
        let aiStrategy;
        if (aiSuit.frontRunner >= aiSuit.stalker && aiSuit.frontRunner >= aiSuit.closer) {
            aiStrategy = 'front-runner';
        } else if (aiSuit.closer >= aiSuit.stalker) {
            aiStrategy = 'closer';
        } else {
            aiStrategy = 'stalker';
        }

        const aiForm = 0.85 + Math.random() * 0.4;

        runners.push({
            id: aiHorse.id,
            name: aiHorse.name,
            trainer: aiTrainer.name,
            isPlayer: false,
            stats: { ...aiHorse },
            strategy: aiStrategy,
            position: 0,
            energy: 100,
            score: 0,
            formFactor: aiForm,
            silkPrimary: aiTrainer.silkPrimary || aiHorse.silkPrimary,
            silkSecondary: aiTrainer.silkSecondary || aiHorse.silkSecondary,
            distancePreference: aiHorse.distancePreference || 'mid',
            groundPreference: aiHorse.groundPreference || 'Good',
            officialRating: aiHorse.officialRating || calculateOfficialRating(aiHorse),
            tacticalSuitability: aiSuit,
            horse: aiHorse  // reference to actual horse for handicapper updates
        });
    });

    // Assign weights based on race type
    assignRaceWeights(runners, raceType);

    // Shuffle and assign draw positions (1 = inside rail)
    const drawOrder = runners.map((_, i) => i);
    for (let i = drawOrder.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [drawOrder[i], drawOrder[j]] = [drawOrder[j], drawOrder[i]];
    }
    drawOrder.forEach((runnerIdx, draw) => {
        runners[runnerIdx].drawPosition = draw + 1;
    });

    RaceState.racePositions = runners;

    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-live').style.display = 'block';

    document.getElementById('live-race-name').textContent = RaceState.selectedRace.name;
    document.getElementById('race-stage').textContent = 'Starting...';
    document.getElementById('commentary-text').textContent = 'The horses are loading into the stalls...';

    // Reset whip UI
    const whipBtn = document.getElementById('btn-use-whip');
    if (whipBtn) {
        whipBtn.style.display = 'none';
        whipBtn.classList.remove('whip-warning', 'whip-danger');
    }
    const whipCounter = document.getElementById('whip-count');
    if (whipCounter) whipCounter.textContent = '0/7';
    const dqWarning = document.getElementById('dq-warning');
    if (dqWarning) dqWarning.style.display = 'none';

    renderRaceTrack();

    // Phase 4: Start sounds
    RaceState.crowdStop = SoundManager.startCrowd();
    RaceState.hoofStop = SoundManager.startHoofbeats(300);

    setTimeout(() => {
        document.getElementById('race-stage').textContent = "They're off!";
        document.getElementById('commentary-text').textContent = "And they're off! The field breaks from the gate!";
        runRaceSimulation();
    }, 2000);
}

/**
 * Horse SVG template (shared between race track and auction parade ring)
 */
function horseSpriteSVG() {
    return `<svg class="horse-svg" viewBox="0 0 56 36" xmlns="http://www.w3.org/2000/svg">
        <path class="h-tail" d="M9,16 Q5,13 3,9 Q2,6 4,4 Q4,7 5,10 Q6,13 8,15" fill="#3a1f0d"/>
        <path class="h-tail" d="M8,15 Q4,12 2,8" stroke="#2a150a" stroke-width="0.8" fill="none" opacity="0.5"/>
        <rect class="h-leg h-leg-hr" x="13" y="22" width="2.4" height="12" rx="1" fill="#4a2512"/>
        <rect class="h-leg h-leg-hl" x="16" y="22" width="2.4" height="12" rx="1" fill="#3d200f"/>
        <rect class="h-leg h-leg-fr" x="34" y="22" width="2.4" height="12" rx="1" fill="#4a2512"/>
        <rect class="h-leg h-leg-fl" x="37" y="22" width="2.4" height="12" rx="1" fill="#3d200f"/>
        <circle class="h-leg h-leg-hr" cx="14.2" cy="22" r="1.2" fill="#5a3018" opacity="0.5"/>
        <circle class="h-leg h-leg-fr" cx="35.2" cy="22" r="1.2" fill="#5a3018" opacity="0.5"/>
        <rect x="13" y="33" width="2.4" height="1.8" rx="0.6" fill="#1a0a04" class="h-leg h-leg-hr"/>
        <rect x="16" y="33" width="2.4" height="1.8" rx="0.6" fill="#1a0a04" class="h-leg h-leg-hl"/>
        <rect x="34" y="33" width="2.4" height="1.8" rx="0.6" fill="#1a0a04" class="h-leg h-leg-fr"/>
        <rect x="37" y="33" width="2.4" height="1.8" rx="0.6" fill="#1a0a04" class="h-leg h-leg-fl"/>
        <path d="M10,23 Q7,20 7,16 Q7,12 12,12 L22,11 L28,10.5 Q32,9 35,6 Q37,3.5 40,3.5 L42,3.5 Q44,3 45,4 Q47,4.5 48,6.5 Q48.5,8 47,9 Q45,10.5 43,12 Q40,16 38,20 L36,23 Q28,19 18,23 Z" fill="#6b3a1f"/>
        <path d="M10,23 Q28,19 36,23 L36,23 Q28,21 18,23 Z" fill="#5a2e16" opacity="0.5"/>
        <ellipse cx="14" cy="16" rx="4.5" ry="3.2" fill="#7a4525" opacity="0.35"/>
        <ellipse cx="33" cy="14.5" rx="3.5" ry="4" fill="#7a4525" opacity="0.3"/>
        <ellipse cx="22" cy="18" rx="5" ry="2.5" fill="#5a2e16" opacity="0.15"/>
        <polygon points="41,3.5 40,0.5 43,2.5" fill="#5a2e16"/>
        <polygon points="42,3.5 41.5,1.5 43.5,3" fill="#4a2010" opacity="0.5"/>
        <circle cx="45" cy="5.5" r="1" fill="#222"/>
        <circle cx="45.3" cy="5.2" r="0.35" fill="#666"/>
        <ellipse cx="47.5" cy="7.8" rx="0.7" ry="0.5" fill="#4a2512"/>
        <path d="M47,8 Q47.5,8.5 48,8" stroke="#3a1f0d" stroke-width="0.4" fill="none"/>
        <path class="h-mane" d="M28,10.5 Q31,7 34,5 Q36,3.5 39,3.5" stroke="#3a1f0d" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path class="h-mane" d="M30,9.5 Q33,6.5 36,4.5" stroke="#2a150a" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.4"/>
        <path d="M20,11.5 L28,10.5 Q30,14 28,17 L20,18 Q18,14 20,11.5 Z" fill="var(--silk-primary, #1a5f3c)" opacity="0.85"/>
        <ellipse cx="25" cy="7.5" rx="4.5" ry="3.5" fill="var(--silk-primary, #1a5f3c)"/>
        <line x1="29" y1="8" x2="36" y2="7" stroke="var(--silk-primary, #1a5f3c)" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M36,7 Q40,8 43,9" stroke="#222" stroke-width="0.6" fill="none"/>
        <ellipse cx="26.5" cy="4" rx="3.5" ry="2" fill="var(--silk-secondary, #ffd700)"/>
        <path d="M29.5,4.5 L31,5 L29,5.5" fill="var(--silk-secondary, #ffd700)"/>
        <line x1="24" y1="5" x2="29" y2="4.5" stroke="#fff" stroke-width="0.4" opacity="0.5"/>
    </svg>`;
}

/**
 * Render race track - straight for sprints, oval for mid/stayer
 */
function renderRaceTrack() {
    const container = document.getElementById('race-horses');
    const track = document.querySelector('.race-track');
    const furlongs = RaceState.selectedRace?.distanceFurlongs || 8;
    const oval = isOvalRace(furlongs);

    // Toggle oval class on the track
    track.classList.toggle('oval-track', oval);

    // Move finish line for oval (bottom-right) vs straight (right)
    const finishLine = document.querySelector('.finish-line');
    if (finishLine) {
        finishLine.classList.toggle('oval-finish', oval);
    }

    if (oval) {
        // Oval layout: absolute-positioned horses on a full elliptical path
        const laps = getOvalLaps(furlongs);
        const totalRunners = RaceState.racePositions.length;

        container.innerHTML = RaceState.racePositions.map((runner, idx) => {
            const pos = getOvalPosition(runner.position, laps, idx, totalRunners);

            return `
                <div class="oval-runner" data-runner-id="${runner.id}"
                     style="left:${pos.x}%;top:${pos.y}%;--oval-scale:${pos.scale};z-index:${pos.zIndex};${pos.flipped ? 'transform:scaleX(-1);' : ''}">
                    <div class="horse-sprite galloping ${runner.isPlayer ? 'player' : ''}"
                         style="--silk-primary:${runner.silkPrimary};--silk-secondary:${runner.silkSecondary}">
                        ${horseSpriteSVG()}
                    </div>
                    <span class="position-badge oval-badge"></span>
                    <span class="race-horse-label oval-label ${runner.isPlayer ? 'player' : ''}">${runner.name}</span>
                </div>
            `;
        }).join('');
    } else {
        // Straight layout: rows
        container.innerHTML = RaceState.racePositions.map((runner) => {
            const leftPos = (runner.position / 100) * 90;

            return `
                <div class="race-horse-row" data-runner-id="${runner.id}">
                    <div class="horse-sprite galloping ${runner.isPlayer ? 'player' : ''}"
                         style="left:${leftPos}%;--silk-primary:${runner.silkPrimary};--silk-secondary:${runner.silkSecondary}">
                        ${horseSpriteSVG()}
                    </div>
                    <span class="position-badge" style="left:${leftPos}%"></span>
                    <span class="race-horse-label ${runner.isPlayer ? 'player' : ''}">${runner.name}</span>
                </div>
            `;
        }).join('');
    }
}

/**
 * Update track positions - handles both straight and oval
 */
function updateRaceTrack() {
    const sorted = [...RaceState.racePositions].sort((a, b) => {
        // Finished horses rank by finish order; others by position
        if (a.finishOrder && b.finishOrder) return a.finishOrder - b.finishOrder;
        if (a.finishOrder) return -1;
        if (b.finishOrder) return 1;
        return b.position - a.position;
    });
    const furlongs = RaceState.selectedRace?.distanceFurlongs || 8;
    const oval = isOvalRace(furlongs);

    const laps = oval ? getOvalLaps(furlongs) : 1;
    const totalRunners = RaceState.racePositions.length;

    RaceState.racePositions.forEach((runner, idx) => {
        if (oval) {
            const el = document.querySelector(`.oval-runner[data-runner-id="${runner.id}"]`);
            if (!el) return;

            const pos = getOvalPosition(runner.position, laps, idx, totalRunners);
            el.style.left = `${pos.x}%`;
            el.style.top = `${pos.y}%`;
            el.style.transform = pos.flipped ? 'scaleX(-1)' : '';
            el.style.setProperty('--oval-scale', pos.scale);
            el.style.zIndex = pos.zIndex;

            const badge = el.querySelector('.position-badge');
            const place = sorted.findIndex(r => r.id === runner.id) + 1;
            if (badge) {
                badge.textContent = getOrdinal(place);
                badge.className = `position-badge oval-badge${place <= 3 ? ` pos-${place}` : ''}`;
            }
        } else {
            const row = document.querySelector(`[data-runner-id="${runner.id}"]`);
            if (!row) return;

            const sprite = row.querySelector('.horse-sprite');
            const badge = row.querySelector('.position-badge');

            const leftPos = Math.min((runner.position / 100) * 90, 90);
            if (sprite) sprite.style.left = `${leftPos}%`;

            const place = sorted.findIndex(r => r.id === runner.id) + 1;
            if (badge) {
                badge.textContent = getOrdinal(place);
                badge.className = `position-badge${place <= 3 ? ` pos-${place}` : ''}`;
                badge.style.left = `${leftPos}%`;
            }
        }
    });
}

function runRaceSimulation() {
    let tick = RaceState.raceProgress || 0;
    let injuryChecked = tick >= 40;

    RaceState.raceInterval = setInterval(() => {
        tick++;
        RaceState.raceProgress = tick;

        const raceFurlongs = RaceState.selectedRace?.distanceFurlongs || 8;
        const raceLaps = isOvalRace(raceFurlongs) ? getOvalLaps(raceFurlongs) : 1;

        if (raceLaps === 2) {
            if (tick < 12) {
                document.getElementById('race-stage').textContent = 'First circuit (Lap 1/2)';
            } else if (tick < 25) {
                document.getElementById('race-stage').textContent = 'Back straight (Lap 1/2)';
            } else if (tick < 38) {
                document.getElementById('race-stage').textContent = 'Turning for home (Lap 1/2)';
            } else if (tick < 50) {
                document.getElementById('race-stage').textContent = 'Passing the post (Lap 1/2)';
            } else if (tick < 62) {
                document.getElementById('race-stage').textContent = 'Final circuit (Lap 2/2)';
            } else if (tick < 75) {
                document.getElementById('race-stage').textContent = 'Back straight (Lap 2/2)';
            } else if (tick < 88) {
                document.getElementById('race-stage').textContent = 'Turning for home (Lap 2/2)';
            } else {
                document.getElementById('race-stage').textContent = 'Final stretch!';
            }
        } else {
            if (tick < 25) {
                document.getElementById('race-stage').textContent = 'Early pace';
            } else if (tick < 50) {
                document.getElementById('race-stage').textContent = 'Midway';
            } else if (tick < 75) {
                document.getElementById('race-stage').textContent = 'Turning for home';
            } else {
                document.getElementById('race-stage').textContent = 'Final stretch!';
            }
        }

        // Phase 4: build crowd in final stretch
        if (tick === 75) {
            SoundManager.buildCrowd();
        }

        // Show whip button in final 2 furlongs (tick >= 75)
        if (tick === 75) {
            RaceState.whipAvailable = true;
            const whipBtn = document.getElementById('btn-use-whip');
            if (whipBtn && RaceState.racePositions.some(r => r.isPlayer)) {
                whipBtn.style.display = 'inline-flex';
            }
        }

        if (!injuryChecked && tick === 40) {
            injuryChecked = true;
            const playerRunners = RaceState.racePositions.filter(r => r.isPlayer);
            playerRunners.forEach(pr => {
                if (!RaceState.playerInjuredDuringRace[pr.id] && Math.random() < 0.04) {
                    RaceState.playerInjuredDuringRace[pr.id] = true;
                    pr.formFactor *= 0.6;
                    document.getElementById('commentary-text').textContent =
                        `Oh no! ${pr.name} seems to be struggling! Something's not right!`;
                }
            });
        }

        // Jump racing: check for upcoming jumps
        const isJumpRace = RaceState.selectedRace?.isJumpRace;
        const jumps = RaceState.selectedRace?.jumps || [];
        if (isJumpRace && RaceState.nextJumpIndex < jumps.length) {
            const nextJump = jumps[RaceState.nextJumpIndex];
            const jumpIndicator = document.getElementById('jump-indicator');

            // Show jump approaching indicator 3 ticks before
            if (tick === nextJump.tickPosition - 3 && jumpIndicator) {
                jumpIndicator.style.display = 'block';
                jumpIndicator.textContent = 'JUMP APPROACHING! Press SPACE';
                jumpIndicator.className = 'jump-indicator approaching';
                RaceState.jumpTimingActive = true;
                RaceState.jumpCurrentTick = nextJump.tickPosition;
                RaceState.jumpPressed = false;
            }

            // Process jump at the jump tick
            if (tick === nextJump.tickPosition) {
                processJumpForAllRunners(tick, nextJump);
                RaceState.nextJumpIndex++;
                RaceState.jumpTimingActive = false;
                if (jumpIndicator) {
                    setTimeout(() => { jumpIndicator.style.display = 'none'; }, 500);
                }
            }
        }

        RaceState.racePositions.forEach(runner => {
            if (runner.position >= 100) return;
            if (RaceState.fallenRunners.has(runner.id)) return; // Skip fallen runners

            let baseSpeed = calculateRunnerSpeed(runner, tick);

            if (runner.isPlayer) {
                const horse = GameState.horses.find(h => h.id === runner.id);
                const conditionMultiplier = (horse ? horse.condition : 100) / 100;
                baseSpeed *= (0.5 + conditionMultiplier * 0.5);
            }

            baseSpeed += (Math.random() - 0.5) * 0.25;

            runner.position += baseSpeed;

            if (runner.position >= 100 && !runner.finishOrder) {
                runner.position = 100;
                if (!RaceState._finishCount) RaceState._finishCount = 0;
                RaceState._finishCount++;
                runner.finishOrder = RaceState._finishCount;
            }
        });

        updateRaceTrack();
        updateCommentary(tick);

        // Race ends when every horse has crossed the finish line
        if (RaceState.racePositions.every(r => r.position >= 100)) {
            clearInterval(RaceState.raceInterval);
            const whipBtn = document.getElementById('btn-use-whip');
            if (whipBtn) whipBtn.style.display = 'none';
            finishRace();
        }
    }, 150);
}

function calculateRunnerSpeed(runner, tick) {
    const { speed, stamina, acceleration, temperament } = runner.stats;
    let baseSpeed = 0;

    const phase = tick < 30 ? 'early' : tick < 70 ? 'mid' : 'late';

    const distanceFurlongs = RaceState.selectedRace?.distanceFurlongs || 8;
    const distanceCategory = getRaceDistanceCategory(distanceFurlongs);

    let effectiveSpeed = speed;
    let effectiveStamina = stamina;

    if (distanceCategory === 'sprint') {
        effectiveSpeed = speed * 1.4;
        effectiveStamina = stamina * 0.7;
    } else if (distanceCategory === 'stayer') {
        effectiveSpeed = speed * 0.7;
        effectiveStamina = stamina * 1.4;
    }

    effectiveSpeed = Math.min(effectiveSpeed, 100);
    effectiveStamina = Math.min(effectiveStamina, 100);

    // --- Tactical suitability modifier ---
    const suitability = runner.tacticalSuitability || { frontRunner: 50, stalker: 50, closer: 50 };
    const tacticKeys = { 'front-runner': 'frontRunner', 'stalker': 'stalker', 'closer': 'closer' };
    const tacticFit = (suitability[tacticKeys[runner.strategy]] || 50) / 100;

    // Distance preference modifier
    const horsePref = runner.distancePreference || 'mid';
    const prefIdx = DISTANCE_PREFERENCES.indexOf(horsePref);
    const raceIdx = DISTANCE_PREFERENCES.indexOf(distanceCategory);
    const distanceMismatch = Math.abs(prefIdx - raceIdx);
    const distancePrefModifier = distanceMismatch === 0 ? 1.0 : distanceMismatch === 1 ? 0.95 : 0.88;

    // Ground preference modifier
    const horseGround = runner.groundPreference || 'Good';
    const raceGround = RaceState.selectedRace?.ground || 'Good';
    const horseGroundIdx = GROUND_CONDITIONS.indexOf(horseGround);
    const raceGroundIdx = GROUND_CONDITIONS.indexOf(raceGround);
    const groundMismatch = Math.abs(horseGroundIdx - raceGroundIdx);
    const groundModifiers = [1.0, 0.97, 0.94, 0.90, 0.85];
    const groundPrefModifier = groundModifiers[groundMismatch] || 0.78;

    const form = runner.formFactor || 1.0;
    const consistencyFactor = 0.5 + (temperament / 100) * 0.5;
    const variance = (1 - consistencyFactor) * (Math.random() - 0.5) * 0.4;

    // Rebalanced tactic speed curves - front-runners fade hard without stamina,
    // closers need acceleration to close, stalkers are consistent but rarely spectacular
    switch (runner.strategy) {
        case 'front-runner':
            if (phase === 'early') {
                baseSpeed = 0.70 + (effectiveSpeed / 100) * 0.35;
            } else if (phase === 'mid') {
                baseSpeed = 0.50 + (effectiveSpeed / 100) * 0.25;
            } else {
                // Late phase: front-runners fade hard without stamina
                baseSpeed = 0.30 + (effectiveStamina / 100) * 0.30;
            }
            break;

        case 'stalker':
            if (phase === 'early') {
                baseSpeed = 0.48 + (effectiveSpeed / 100) * 0.25;
            } else if (phase === 'mid') {
                const midStat = (effectiveSpeed + effectiveStamina + acceleration) / 3;
                baseSpeed = 0.55 + (midStat / 100) * 0.30;
            } else {
                baseSpeed = 0.55 + (acceleration / 100) * 0.30;
            }
            break;

        case 'closer':
            if (phase === 'early') {
                // Closers hold back significantly
                baseSpeed = 0.32 + (effectiveStamina / 100) * 0.20;
            } else if (phase === 'mid') {
                baseSpeed = 0.48 + (effectiveStamina / 100) * 0.25;
            } else {
                // Explosive late run - needs high acceleration
                baseSpeed = 0.75 + (acceleration / 100) * 0.40;
            }
            break;
    }

    // Apply tactic fit multiplier: 0.8 (0% fit) to 1.2 (100% fit)
    baseSpeed *= (0.8 + tacticFit * 0.4);

    // Draw position effect
    const drawBonus = getDrawBonus(runner.drawPosition, distanceFurlongs, phase);
    baseSpeed += drawBonus;

    // Whip boost (8% for the tick after whip was used)
    if (runner.whipActive) {
        baseSpeed *= 1.08;
        runner.whipActive = false;
    }

    const weightMultiplier = getWeightMultiplier(runner.weightLbs || 126, distanceFurlongs);
    baseSpeed = baseSpeed * form * distancePrefModifier * groundPrefModifier * weightMultiplier + variance;
    return Math.max(baseSpeed, 0.2);
}

function updateCommentary(tick) {
    const sortedRunners = [...RaceState.racePositions].sort((a, b) => {
        if (a.finishOrder && b.finishOrder) return a.finishOrder - b.finishOrder;
        if (a.finishOrder) return -1;
        if (b.finishOrder) return 1;
        return b.position - a.position;
    });
    const leader = sortedRunners[0];

    // Find best-placed player horse for commentary
    const bestPlayerIdx = sortedRunners.findIndex(r => r.isPlayer);
    const bestPlayer = sortedRunners[bestPlayerIdx];
    const bestPlayerPos = bestPlayerIdx + 1;

    if (!bestPlayer) return;

    let commentary = '';

    if (tick < 20) {
        commentary = `${leader.name} breaks well and leads the field early.`;
    } else if (tick < 40) {
        if (bestPlayerPos <= 2) {
            commentary = `${bestPlayer.name} is sitting nicely in ${getOrdinal(bestPlayerPos)} place.`;
        } else {
            commentary = `${leader.name} continues to lead. ${bestPlayer.name} is back in ${getOrdinal(bestPlayerPos)}.`;
        }
    } else if (tick < 60) {
        commentary = `They're into the back straight. ${leader.name} has the lead with ${bestPlayer.name} in ${getOrdinal(bestPlayerPos)}.`;
    } else if (tick < 80) {
        if (bestPlayerPos <= 3) {
            commentary = `${bestPlayer.name} is making a move! Now in ${getOrdinal(bestPlayerPos)} place!`;
        } else {
            commentary = `${leader.name} turning for home. ${bestPlayer.name} needs to find more!`;
        }
    } else {
        if (bestPlayerPos === 1) {
            commentary = `${bestPlayer.name} hits the front! Can they hold on?!`;
        } else if (bestPlayerPos <= 3) {
            commentary = `${bestPlayer.name} is charging! It's going to be close!`;
        } else {
            commentary = `${leader.name} is pulling away. ${bestPlayer.name} struggling in ${getOrdinal(bestPlayerPos)}.`;
        }
    }

    document.getElementById('commentary-text').textContent = commentary;
}

/**
 * Process a jump for all runners in a jump race.
 * Player horses use spacebar timing; AI horses auto-jump based on jumpAbility.
 */
function processJumpForAllRunners(tick, jump) {
    RaceState.racePositions.forEach(runner => {
        if (RaceState.fallenRunners.has(runner.id)) return;
        if (runner.position >= 100) return;

        const jumpAbility = runner.stats?.jumpAbility || (runner.isPlayer ? 50 : randomInt(40, 80));

        if (runner.isPlayer) {
            // Player timing: check if spacebar was pressed and when
            const pressed = RaceState.jumpPressed;
            const pressedTick = RaceState._jumpPressTick || 0;
            const delta = pressed ? Math.abs(pressedTick - jump.tickPosition) : 99;

            if (delta === 0) {
                // Perfect jump
                document.getElementById('commentary-text').textContent = `Clean jump by ${runner.name}!`;
            } else if (delta <= 1) {
                // Slight mistake
                runner.position -= randomInt(2, 3);
                document.getElementById('commentary-text').textContent = `${runner.name} makes a slight mistake at the fence!`;
            } else {
                // Bad timing or missed - fall risk
                const fallChance = 1 - (jumpAbility / 100) * 0.7;
                if (Math.random() < fallChance) {
                    // FALL
                    RaceState.fallenRunners.add(runner.id);
                    runner.fell = true;
                    runner.position = -1;
                    document.getElementById('commentary-text').textContent =
                        `${runner.name} HAS FALLEN at the ${getOrdinal(RaceState.nextJumpIndex + 1)} fence!`;
                    // Injury risk
                    const horse = GameState.horses.find(h => h.id === runner.id);
                    if (horse && Math.random() < 0.3) {
                        RaceState.playerInjuredDuringRace[runner.id] = true;
                    }
                } else {
                    // Heavy mistake but stayed up
                    runner.position -= randomInt(4, 6);
                    document.getElementById('commentary-text').textContent =
                        `${runner.name} nearly falls! Loses a lot of ground!`;
                }
            }
        } else {
            // AI horses: auto-jump based on jumpAbility
            const success = Math.random() * 100 < jumpAbility;
            if (!success) {
                if (Math.random() < 0.15) {
                    // AI fall (rare)
                    RaceState.fallenRunners.add(runner.id);
                    runner.fell = true;
                    runner.position = -1;
                } else {
                    runner.position -= randomInt(1, 3);
                }
            }
        }
    });
}

/**
 * Handle spacebar press during jump race
 */
function handleJumpPress() {
    if (!RaceState.isRacing || !RaceState.jumpTimingActive) return;
    if (RaceState.jumpPressed) return; // Only count first press per jump

    RaceState.jumpPressed = true;
    RaceState._jumpPressTick = RaceState.raceProgress;

    const jumpIndicator = document.getElementById('jump-indicator');
    if (jumpIndicator) {
        jumpIndicator.textContent = 'JUMP!';
        jumpIndicator.className = 'jump-indicator jumped';
    }
}

/**
 * Use whip on best-placed player horse. Gives 8% speed boost for next tick.
 * DQ if used >5 times in final 2 furlongs or >7 times total.
 */
function useWhip() {
    if (!RaceState.isRacing) return;

    // Find best-placed player horse that hasn't finished
    const sortedRunners = [...RaceState.racePositions].sort((a, b) => {
        if (a.finishOrder && b.finishOrder) return a.finishOrder - b.finishOrder;
        if (a.finishOrder) return -1;
        if (b.finishOrder) return 1;
        return b.position - a.position;
    });
    const bestPlayer = sortedRunners.find(r => r.isPlayer && !r.finishOrder);
    if (!bestPlayer) return;

    const id = bestPlayer.id;

    // Increment whip counts
    if (!RaceState.whipCount[id]) RaceState.whipCount[id] = 0;
    if (!RaceState.whipFinalFurlongs[id]) RaceState.whipFinalFurlongs[id] = 0;

    RaceState.whipCount[id]++;
    if (RaceState.raceProgress >= 75) {
        RaceState.whipFinalFurlongs[id]++;
    }

    // Apply whip boost
    bestPlayer.whipActive = true;

    // Play whoosh sound
    SoundManager.playWhoosh();

    // Update UI
    const totalWhips = RaceState.whipCount[id];
    const finalWhips = RaceState.whipFinalFurlongs[id];
    const whipCounter = document.getElementById('whip-count');
    if (whipCounter) whipCounter.textContent = `${totalWhips}/7`;

    const whipBtn = document.getElementById('btn-use-whip');
    const dqWarning = document.getElementById('dq-warning');

    // Warning states
    if (whipBtn) {
        whipBtn.classList.remove('whip-warning', 'whip-danger');
        if (totalWhips >= 6 || finalWhips >= 4) {
            whipBtn.classList.add('whip-danger');
        } else if (totalWhips >= 5 || finalWhips >= 3) {
            whipBtn.classList.add('whip-warning');
        }
    }

    // Show DQ warning if approaching limits
    if (dqWarning) {
        if (finalWhips >= 5 || totalWhips >= 7) {
            dqWarning.style.display = 'block';
            dqWarning.textContent = 'DISQUALIFICATION RISK!';
            dqWarning.classList.add('dq-active');
        } else if (finalWhips >= 4 || totalWhips >= 6) {
            dqWarning.style.display = 'block';
            dqWarning.textContent = 'Warning: approaching whip limit';
            dqWarning.classList.remove('dq-active');
        }
    }

    // Commentary
    document.getElementById('commentary-text').textContent =
        `The jockey gives ${bestPlayer.name} a crack of the whip!`;
}

/**
 * Finish race (Phase 3: photo finish, Phase 4: stop sounds/fanfare)
 * Supports multiple player horses
 */
function finishRace() {
    RaceState.isRacing = false;

    // Phase 4: Stop sounds
    if (RaceState.crowdStop) { RaceState.crowdStop(); RaceState.crowdStop = null; }
    if (RaceState.hoofStop) { RaceState.hoofStop(); RaceState.hoofStop = null; }

    const finalPositions = [...RaceState.racePositions].sort((a, b) => {
        // Sort by finish order (who crossed the line first)
        if (a.finishOrder && b.finishOrder) return a.finishOrder - b.finishOrder;
        if (a.finishOrder) return -1;
        if (b.finishOrder) return 1;
        return b.position - a.position;
    });

    finalPositions.forEach((runner, index) => {
        runner.finalPlace = index + 1;
    });

    // Phase 3: Photo finish detection
    if (finalPositions.length >= 3) {
        const margin = finalPositions[0].position - finalPositions[2].position;
        if (margin < 3) {
            const track = document.querySelector('.race-track');
            const overlay = document.createElement('div');
            overlay.className = 'photo-finish-overlay';
            overlay.innerHTML = '<div class="photo-finish-text">PHOTO FINISH!</div>';
            track.appendChild(overlay);
            setTimeout(() => overlay.remove(), 2500);
        }
    }

    // Process each player horse
    const playerResults = finalPositions.filter(r => r.isPlayer);
    let totalPrizeMoney = 0;
    let totalPoints = 0;
    let bestPlace = 99;
    const playerHorseResults = [];
    const raceInjuries = {};

    function placeReward(place) {
        const race = RaceState.selectedRace;
        switch (place) {
            case 1: return { prize: race.prize, points: 25 };
            case 2: return { prize: Math.round(race.prize * 0.4), points: 18 };
            case 3: return { prize: Math.round(race.prize * 0.2), points: 12 };
            case 4: return { prize: Math.round(race.prize * 0.1), points: 8 };
            case 5: return { prize: Math.round(race.prize * 0.05), points: 5 };
            default: return { prize: 0, points: 2 };
        }
    }

    // Check for whip disqualification before awarding prizes
    const disqualifiedIds = new Set();
    playerResults.forEach(pr => {
        const totalWhips = RaceState.whipCount[pr.id] || 0;
        const finalWhips = RaceState.whipFinalFurlongs[pr.id] || 0;
        if (finalWhips > 5 || totalWhips > 7) {
            disqualifiedIds.add(pr.id);
            pr.disqualified = true;
            pr.finalPlace = finalPositions.length; // moved to last
        }
    });

    // Re-sort if any DQs occurred
    if (disqualifiedIds.size > 0) {
        let place = 1;
        finalPositions.forEach(r => {
            if (!r.disqualified) {
                r.finalPlace = place++;
            }
        });
        // DQ'd horses go to the end
        finalPositions.forEach(r => {
            if (r.disqualified) {
                r.finalPlace = place++;
            }
        });
    }

    playerResults.forEach(pr => {
        const horse = GameState.horses.find(h => h.id === pr.id);
        if (!horse) return;

        // DQ'd horses get no prize money or points
        const { prize, points } = pr.disqualified ? { prize: 0, points: 0 } : placeReward(pr.finalPlace);
        totalPrizeMoney += prize;
        totalPoints += points;

        horse.totalEarnings += prize;
        horse.racesRun++;
        if (!RaceState.selectedRace?.isJumpRace) {
            horse.flatRacesCompleted = (horse.flatRacesCompleted || 0) + 1;
        }
        if (pr.finalPlace === 1 && !pr.disqualified) horse.wins++;
        horse.condition = Math.max(horse.condition - randomInt(20, 35), 10);

        if (pr.finalPlace < bestPlace) {
            bestPlace = pr.finalPlace;
        }

        // Check for race injury
        if (RaceState.playerInjuredDuringRace[pr.id]) {
            let injury = checkForInjury(horse, 'race');
            if (!injury) {
                const injType = INJURY_TYPES[randomInt(0, INJURY_TYPES.length - 1)];
                horse.isInjured = true;
                horse.injuryType = injType.name;
                horse.recoveryRacesLeft = randomInt(injType.minRecovery, injType.maxRecovery);
                injury = { type: injType.name, recoveryRaces: horse.recoveryRacesLeft };
            }
            raceInjuries[pr.id] = injury;
        }

        playerHorseResults.push({
            id: pr.id,
            name: pr.name,
            place: pr.finalPlace,
            prize: prize,
            points: points,
            injury: raceInjuries[pr.id] || null,
            weightDisplay: pr.weightDisplay || formatWeight(126),
            officialRating: pr.officialRating || 0,
            disqualified: pr.disqualified || false,
            whipCount: RaceState.whipCount[pr.id] || 0
        });
    });

    // Adjust official ratings after race
    const raceType = RaceState.selectedRace.type || 'conditions';
    const ratingChanges = adjustRatingsAfterRace(finalPositions, raceType);
    RaceState._lastRatingChanges = ratingChanges;

    // Attach rating change info to playerHorseResults
    playerHorseResults.forEach(hr => {
        const rc = ratingChanges.find(r => r.horseId === hr.id);
        if (rc) {
            hr.ratingChange = rc.change;
            hr.newRating = rc.newRating;
            hr.oldRating = rc.oldRating;
        }
    });

    // Phase 4: Fanfare if any player horse won
    if (bestPlace === 1) {
        SoundManager.playFanfare();
    }

    // Reputation: judged on where you put the horse, not just whether it won
    GameState._reputationLog = [];
    const repFieldSize = finalPositions ? finalPositions.length : 8;
    playerHorseResults.forEach(hr => {
        if (hr.disqualified) return;
        applyRaceReputation(hr.place, repFieldSize, RaceState.selectedRace);
    });

    // Award XP for race results
    playerHorseResults.forEach(hr => {
        if (hr.disqualified) return;
        if (hr.place === 1) {
            awardXP(XP_AWARDS.raceWin, 'raceWin');
            // First win bonus
            if (!GameState._firstWinAwarded) {
                GameState._firstWinAwarded = true;
                awardXP(XP_AWARDS.firstWin, 'firstWin');
            }
        } else if (hr.place === 2) {
            awardXP(XP_AWARDS.racePlace2, 'racePlace2');
        } else if (hr.place === 3) {
            awardXP(XP_AWARDS.racePlace3, 'racePlace3');
        } else {
            awardXP(XP_AWARDS.raceFinish, 'raceFinish');
        }
    });

    GameState.budget += totalPrizeMoney;

    // Award championship points for every player horse finish
    const playerStanding = GameState.standings.find(s => s.isPlayer);
    if (playerStanding) {
        playerStanding.points += totalPoints;
    }

    // AI standings - only count AI horses (not player horses)
    finalPositions.filter(r => !r.isPlayer).slice(0, 4).forEach((runner, idx) => {
        const aiStanding = GameState.standings.find(s => s.name === runner.trainer);
        if (aiStanding) {
            aiStanding.points += [18, 12, 8, 5][idx] || 2;
        }
    });

    RaceState.selectedRace.completed = true;
    RaceState.selectedRace.results = finalPositions.map(r => ({
        name: r.name,
        trainer: r.trainer,
        position: r.finalPlace,
        isPlayer: r.isPlayer,
        officialRating: r.officialRating || 0,
        weightDisplay: r.weightDisplay || formatWeight(126)
    }));

    // Record form for all horses
    finalPositions.forEach(r => {
        let horse = null;
        if (r.isPlayer) {
            horse = GameState.horses.find(h => h.id === r.id);
        } else if (r.horse) {
            horse = r.horse;
        } else {
            for (const trainer of GameState.competitors) {
                if (!trainer.horses) continue;
                const found = trainer.horses.find(h => h.id === r.id);
                if (found) { horse = found; break; }
            }
        }
        if (horse) {
            if (!horse.form) horse.form = [];
            horse.form.push({
                raceId: RaceState.selectedRace.id,
                raceName: RaceState.selectedRace.name,
                distance: RaceState.selectedRace.distance,
                position: r.finalPlace,
                orAtTime: r.officialRating || horse.officialRating,
                totalRunners: finalPositions.length
            });
        }
    });

    // Record to global results database
    if (!GameState.raceResults) GameState.raceResults = [];
    GameState.raceResults.push({
        raceId: RaceState.selectedRace.id,
        raceName: RaceState.selectedRace.name,
        raceday: GameState.currentRaceday + 1,
        raceNumber: RaceState.selectedRace.raceNumber,
        distance: RaceState.selectedRace.distance,
        distanceFurlongs: RaceState.selectedRace.distanceFurlongs,
        ratingBand: RaceState.selectedRace.ratingBand,
        results: finalPositions.map(r => ({
            horseId: r.id,
            horseName: r.name,
            trainerId: r.isPlayer ? 'player' : '',
            trainerName: r.trainer,
            isPlayer: r.isPlayer,
            position: r.finalPlace,
            orAtTime: r.officialRating || 0
        }))
    });

    processInjuryRecovery();

    // Settle bets for this race
    settleBets(RaceState.selectedRace.id, finalPositions.map(r => ({
        horseId: r.id, name: r.name, position: r.finalPlace
    })));

    // Check for tack breakage (one roll per race)
    RaceState._tackBreakage = checkTackBreakage();

    showRaceResults(finalPositions, bestPlace, totalPrizeMoney, totalPoints, playerHorseResults);
}

/**
 * Show race results (Phase 2: silk swatches on podium)
 * playerHorseResults: array of { id, name, place, prize, injury }
 */
function showRaceResults(positions, bestPlace, totalPrizeMoney, points, playerHorseResults) {
    document.getElementById('race-live').style.display = 'none';
    document.getElementById('race-results').style.display = 'block';

    document.getElementById('result-race-name').textContent = RaceState.selectedRace.name;

    const podiumHTML = positions.slice(0, 3).map((runner, idx) => {
        const placeClass = ['first', 'second', 'third'][idx];
        const swatch = silkSwatchHTML(runner.silkPrimary, runner.silkSecondary, 'podium-silk');
        return `
            <div class="podium-place ${placeClass} ${runner.isPlayer ? 'player' : ''}">
                <div class="podium-position">${getOrdinal(idx + 1)}</div>
                ${swatch}
                <div class="podium-horse">${runner.name}</div>
                <div class="podium-trainer">${runner.trainer}</div>
                <div class="weight-badge">${runner.weightDisplay || formatWeight(126)}</div>
            </div>
        `;
    }).join('');

    document.getElementById('results-podium').innerHTML = podiumHTML;

    const resultDiv = document.getElementById('your-result');
    const hasInjury = playerHorseResults.some(r => r.injury);
    resultDiv.className = `your-result ${bestPlace === 1 ? 'winner' : ''}`;

    let resultTitle = '';
    if (hasInjury && bestPlace > 3) {
        resultTitle = '\u{1F915} Injury!';
    } else if (bestPlace === 1) {
        resultTitle = '\u{1F3C6} Victory!';
    } else if (bestPlace <= 3) {
        resultTitle = '\u{1F389} Great Result!';
    } else if (bestPlace <= 4) {
        resultTitle = 'Solid Effort';
    } else {
        resultTitle = 'Better Luck Next Time';
    }

    // Build per-horse result summaries
    const horseResultsHTML = playerHorseResults.map(hr => {
        let injuryLine = '';
        if (hr.injury) {
            injuryLine = `<div class="injury-alert">
                <p><strong>\u26A0\uFE0F ${hr.name} suffered a ${hr.injury.type}!</strong></p>
                <p>Out for ${hr.injury.recoveryRaces} race${hr.injury.recoveryRaces > 1 ? 's' : ''}</p>
            </div>`;
        }
        const prizeText = hr.prize > 0 ? ` \u2014 \u00A3${formatMoney(hr.prize)}` : '';
        let ratingLine = '';
        if (hr.ratingChange !== undefined) {
            const changeClass = hr.ratingChange > 0 ? 'rating-up' : hr.ratingChange < 0 ? 'rating-down' : 'rating-same';
            const changeSign = hr.ratingChange > 0 ? '+' : '';
            ratingLine = `<p class="${changeClass}"><span class="weight-badge">${hr.weightDisplay}</span> OR ${hr.oldRating} \u2192 ${hr.newRating} (${changeSign}${hr.ratingChange})</p>`;
        }
        let dqLine = '';
        if (hr.disqualified) {
            dqLine = `<div class="injury-alert" style="border-left:4px solid #cc0000;background:rgba(220,50,50,0.08);">
                <p><strong>DISQUALIFIED - Excessive use of the whip (${hr.whipCount} uses)</strong></p>
                <p>Placed last. No prize money or points awarded.</p>
            </div>`;
        }
        return `
            <div class="player-horse-result">
                <p>${hr.name}: <strong>${hr.disqualified ? 'DISQUALIFIED' : getOrdinal(hr.place) + ' place'}</strong>${prizeText} (+${hr.points} pts)</p>
                ${ratingLine}
                ${dqLine}
                ${injuryLine}
            </div>
        `;
    }).join('');

    let tackBreakageHTML = '';
    if (RaceState._tackBreakage) {
        const items = RaceState._tackBreakage.map(item =>
            item === 'Saddle' ? 'Your saddle broke during the race!' : 'A bridle snapped!'
        ).join('<br>');
        tackBreakageHTML = `<div class="injury-alert" style="border-left:4px solid var(--color-secondary);background:rgba(201,162,39,0.08);">
            <p><strong>\u26A0\uFE0F Tack Breakage</strong></p>
            <p>${items}</p>
            <p style="margin-top:4px;font-size:0.9em;color:var(--color-text-light);">Saddles: ${GameState.tack.saddles} | Bridles: ${GameState.tack.bridles}</p>
        </div>`;
    }

    resultDiv.innerHTML = `
        <h3>${resultTitle}</h3>
        ${horseResultsHTML}
        ${tackBreakageHTML}
        <div class="result-details">
            <div class="result-detail">
                <span class="result-detail-value">\u00A3${formatMoney(totalPrizeMoney)}</span>
                <span class="result-detail-label">Total Prize Money</span>
            </div>
            <div class="result-detail">
                <span class="result-detail-value">+${points}</span>
                <span class="result-detail-label">Points</span>
            </div>
        </div>
    `;

    // In raceday mode, button always says "Continue" since we process raceday flow
    document.getElementById('btn-finish-race').textContent = 'Continue';
    document.getElementById('btn-finish-race').onclick = finishRaceView;
}

// ============================================
// PHASE 5: BETWEEN-RACES INTERSTITIAL
// ============================================

function showBetweenRaces(trainingData) {
    const { trainingResults, trainingInjuries, setbackReports, staffObservations = [] } = trainingData;

    // Consume feed between races
    const feedResult = consumeFeed();

    document.getElementById('between-season').textContent = GameState.season;

    let html = '';

    // Feed status warning
    if (feedResult.shortage) {
        html += `<div class="between-section" style="border-left:4px solid var(--color-danger);background:rgba(220,50,50,0.06);">
            <h3>Feed Shortage!</h3>
            <p>${feedResult.missing} horse(s) were not fed this round. Unfed horses lost 15% condition.</p>
            <p style="color:var(--color-danger);font-weight:600;">Use the Feed Room in the barn to mix and deliver feed!</p>
        </div>`;
    } else if (feedResult.consumed > 0) {
        html += `<div class="between-section">
            <h3>Feed Report</h3>
            <p>All ${feedResult.consumed} horse(s) were fed this round.</p>
        </div>`;
    }

    // Tattersalls Sale section - at the top if any horses are listed for sale
    const pendingSaleHorses = GameState.horses.filter(h => h.pendingAuction);
    console.log('[BetweenRaces] Pending sale horses:', pendingSaleHorses.length, GameState.horses.map(h => ({name: h.name, pending: h.pendingAuction})));
    if (pendingSaleHorses.length > 0) {
        html += '<div class="between-section selling-auction-section" style="border-left: 4px solid var(--color-secondary); background: rgba(201,162,39,0.06);"><h3>\u{1F3F7}\uFE0F Tattersalls Sale</h3>';
        html += '<p style="margin-bottom: var(--space-md); color: var(--color-text-light);">The following horses are entered in the upcoming sale:</p>';
        pendingSaleHorses.forEach(horse => {
            html += `<div class="selling-preview-item">
                <span class="horse-name">${horse.name}</span>
                <span class="reserve-info">Reserve: \u00A3${formatMoney(horse.reservePrice)}</span>
            </div>`;
        });
        html += `<button class="btn btn-primary" style="margin-top: var(--space-md); width: 100%;" onclick="runSellingAuction()">Watch the Sale</button>`;
        html += '</div>';
    }

    // Training report
    html += '<div class="between-section"><h3>Training Report</h3>';
    trainingResults.forEach(r => {
        let detail = '';
        if (r.result === 'improved') {
            detail = `<span class="improvement">${r.detail}</span>`;
        } else if (r.result === 'yearling') {
            detail = `<span style="color:var(--color-secondary-dark)">${r.detail}</span>`;
        } else if (r.result === 'resting') {
            detail = `<span style="color:var(--color-danger)">${r.detail}</span>`;
        } else if (r.result === 'injured') {
            detail = `<span style="color:var(--color-danger)">${r.detail}</span>`;
        } else {
            detail = `<span style="color:var(--color-text-muted)">${r.detail}</span>`;
        }
        html += `<div class="training-report-item">
            <span class="training-report-horse">${r.horse}</span>
            <span class="training-report-detail">${detail}</span>
        </div>`;
    });
    html += '</div>';

    // Injuries
    if (trainingInjuries.length > 0) {
        html += '<div class="between-section"><h3>Training Injuries</h3>';
        trainingInjuries.forEach(i => {
            html += `<div class="injury-card">
                <strong>${i.horse}</strong>: ${i.injury.type} - out for ${i.injury.recoveryRaces} race${i.injury.recoveryRaces > 1 ? 's' : ''}
            </div>`;
        });
        html += '</div>';
    }

    // Staff observations - early warnings from the people who ride the horses
    if (staffObservations.length > 0) {
        html += '<div class="between-section staff-report-section"><h3>Word From the Yard</h3>';
        staffObservations.forEach(o => {
            const lead = o.roundsUntilOnset !== null
                ? `<span class="staff-report-lead">${o.roundsUntilOnset} raceday${o.roundsUntilOnset === 1 ? '' : 's'} to act</span>`
                : '';
            html += `<div class="staff-report-card ${o.signal}">
                <div class="staff-report-who">${o.staff} <small>(${o.title})</small>${lead}</div>
                <div class="staff-report-text">"${o.text}"</div>
            </div>`;
        });
        html += `<p class="staff-report-hint">Leaving a horse on <strong>None</strong> below eases it off - a brewing problem may pass off entirely, or at least do half the damage. The Vet's Office can head one off for £${formatMoney(BREWING_VET_COST)}.</p>`;
        html += '</div>';
    }

    // Setbacks
    if (setbackReports.length > 0) {
        html += '<div class="between-section"><h3>Stable Updates</h3>';
        setbackReports.forEach(s => {
            if (s.averted) {
                html += `<div class="setback-card averted">
                    <strong>${s.horse}</strong>: ${s.setbackName} avoided<br>
                    <small>${s.horse} ${s.description}.</small>
                </div>`;
                return;
            }
            const statsText = s.affectedStats.map(a => `${capitalizeFirst(a.stat)} -${a.loss}`).join(', ');
            const easedNote = s.eased ? ' <em>Caught early - damage limited.</em>' : '';
            html += `<div class="setback-card${s.eased ? ' eased' : ''}">
                <strong>${s.horse}</strong>: ${s.setbackName}<br>
                <small>${s.horse} ${s.description} (${statsText})${easedNote}</small>
            </div>`;
        });
        html += '</div>';
    }

    // Tack breakage report
    if (RaceState._tackBreakage) {
        const barnHorses = GameState.horses.length;
        const saddleShort = GameState.tack.saddles < barnHorses;
        const bridleShort = GameState.tack.bridles < barnHorses;
        const isShort = saddleShort || bridleShort;
        html += `<div class="between-section" style="border-left:4px solid var(--color-secondary);background:rgba(201,162,39,0.06);">
            <h3>Tack Report</h3>
            <p>${RaceState._tackBreakage.map(item => item === 'Saddle' ? 'A saddle broke during the race!' : 'A bridle snapped during the race!').join('<br>')}</p>
            <p>Stock: ${GameState.tack.saddles} saddle${GameState.tack.saddles !== 1 ? 's' : ''}, ${GameState.tack.bridles} bridle${GameState.tack.bridles !== 1 ? 's' : ''}</p>
            ${isShort ? `<p style="color:var(--color-danger);font-weight:600;">You need ${barnHorses} of each to race. Visit the Tack Store!</p>` : ''}
        </div>`;
    }

    // Handicapper's Report - show OR changes for player horses that raced
    if (RaceState._lastRatingChanges && RaceState._lastRatingChanges.length > 0) {
        const playerChanges = RaceState._lastRatingChanges.filter(rc => rc.isPlayer);
        if (playerChanges.length > 0) {
            html += '<div class="between-section"><h3>Handicapper\'s Report</h3>';
            playerChanges.forEach(rc => {
                const changeClass = rc.change > 0 ? 'rating-up' : rc.change < 0 ? 'rating-down' : 'rating-same';
                const arrow = rc.change > 0 ? '\u2191' : rc.change < 0 ? '\u2193' : '\u2192';
                const changeSign = rc.change > 0 ? '+' : '';
                html += `<div class="rating-change-item">
                    <span class="rating-change-horse">${rc.horseName}</span>
                    <span class="${changeClass}">${arrow} ${rc.oldRating} \u2192 ${rc.newRating} (${changeSign}${rc.change})</span>
                </div>`;
            });
            html += '</div>';
        }
    }

    // Next raceday preview
    const nextRaceday = GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null;
    if (nextRaceday && !nextRaceday.completed) {
        const raceEligible = GameState.horses.filter(h => !h.isYearling && !h.isInjured && !h.pendingAuction);
        let eligibleCount = 0;
        nextRaceday.races.forEach(race => {
            if (getEligibleHorsesForBand(raceEligible, race.ratingBand).length > 0) eligibleCount++;
        });
        html += `<div class="between-section">
            <h3>Next Raceday</h3>
            <div class="next-race-preview">
                <div class="race-name">Raceday ${nextRaceday.racedayNumber} of 10</div>
                <div class="race-details">
                    8 races on the card<br>
                    You can enter ${eligibleCount} race${eligibleCount !== 1 ? 's' : ''}
                </div>
            </div>
        </div>`;
    }

    // Quick training adjustment
    const nonInjuredHorses = GameState.horses.filter(h => !h.isInjured && !h.isYearling);
    if (nonInjuredHorses.length > 0) {
        html += '<div class="between-section"><h3>Adjust Training</h3>';
        html += '<div class="quick-training-grid">';
        nonInjuredHorses.forEach(horse => {
            const flagged = horse.brewing && horse.brewing.spotted;
            html += `<div class="quick-training-row${flagged ? ' flagged' : ''}">
                <span class="horse-name">${horse.name}${flagged ? ' <span class="brewing-flag" title="Staff have flagged a concern">⚠</span>' : ''}</span>
                <select data-horse-id="${horse.id}" onchange="quickSetTraining(this)">
                    <option value="" ${!horse.trainingFocus ? 'selected' : ''}>None</option>
                    <option value="speed" ${horse.trainingFocus === 'speed' ? 'selected' : ''}>Speed</option>
                    <option value="stamina" ${horse.trainingFocus === 'stamina' ? 'selected' : ''}>Stamina</option>
                    <option value="acceleration" ${horse.trainingFocus === 'acceleration' ? 'selected' : ''}>Acceleration</option>
                    <option value="temperament" ${horse.trainingFocus === 'temperament' ? 'selected' : ''}>Temperament</option>
                </select>
            </div>`;
        });
        html += '</div></div>';
    }

    html += '<button class="btn btn-primary" onclick="continueToDashboard()">Return to Yard</button>';

    document.getElementById('between-races-content').innerHTML = html;
    showScreen('between-races');
}

function quickSetTraining(selectEl) {
    const horseId = selectEl.dataset.horseId;
    const focus = selectEl.value || null;
    const horse = GameState.horses.find(h => h.id === horseId);
    if (horse) horse.trainingFocus = focus;
}

function continueToDashboard() {
    returnToYard();
}

// ============================================
// PHASE 5: FINISH RACE VIEW (refactored flow)
// ============================================

function finishRaceView() {
    // In raceday mode, advance to next race within the raceday
    if (RaceState.racedayPlayerRaces && RaceState.racedayCurrentIndex !== undefined) {
        RaceState.racedayCurrentIndex++;
        if (RaceState.racedayCurrentIndex < RaceState.racedayPlayerRaces.length) {
            // More player races on this raceday
            startNextRacedayRace();
            return;
        } else {
            // All player races done on this raceday - simulate remaining and show results
            const currentRaceday = GameState.racedays[GameState.currentRaceday];
            simulateRemainingRaces(currentRaceday);
            return;
        }
    }

    // Fallback for legacy flow
    if (GameState.currentRaceday >= 10) {
        showSeasonCeremony();
    } else {
        const trainingData = applyTrainingEffects();
        showBetweenRaces(trainingData);
    }
}

// ============================================
// PHASE 6: SEASON CEREMONY
// ============================================

function spawnConfetti() {
    const colours = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bda', '#ff9f43', '#a855f7', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.width = `${6 + Math.random() * 8}px`;
        el.style.height = `${6 + Math.random() * 8}px`;
        el.style.background = colours[Math.floor(Math.random() * colours.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.animationDuration = `${2 + Math.random() * 3}s`;
        el.style.animationDelay = `${Math.random() * 1.5}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 6000);
    }
}

function showSeasonCeremony() {
    // Apply aging effects before showing
    applyAgingEffects();

    // Bloodstock rolls over with the season: foals arrive, yearlings come in
    GameState._breedingReport = processBreedingSeason();

    // Reputation fades a little each year if it isn't renewed
    const repBefore = getReputation();
    decayReputation();
    GameState._reputationSeasonStart = repBefore;

    // Collect aging horse info
    const agingHorses = GameState.horses.filter(h => h.age >= 5);

    // Clear injuries at season end
    GameState.horses.forEach(horse => {
        horse.isInjured = false;
        horse.injuryType = null;
        horse.recoveryRacesLeft = 0;
        horse.condition = 100;
    });

    // Apply training one more time
    applyTrainingEffects();

    const sorted = [...GameState.standings].sort((a, b) => b.points - a.points);
    const playerRank = sorted.findIndex(s => s.isPlayer) + 1;
    const isChampion = playerRank === 1;
    const playerStanding = sorted.find(s => s.isPlayer);

    // Calculate season stats
    let totalWins = 0;
    let totalEarnings = 0;
    let bestHorse = null;
    let bestHorseWins = 0;
    GameState.horses.forEach(h => {
        totalWins += h.wins || 0;
        totalEarnings += h.totalEarnings || 0;
        if ((h.wins || 0) > bestHorseWins) {
            bestHorseWins = h.wins;
            bestHorse = h.name;
        }
    });

    let html = '';

    if (isChampion) {
        html += '<div class="ceremony-trophy">\u{1F3C6}</div>';
        html += `<h2 class="ceremony-title">Season ${GameState.season} Champion!</h2>`;
        html += `<p class="ceremony-subtitle">Congratulations, ${GameState.stableName}!</p>`;
        SoundManager.playFanfare();
        setTimeout(() => spawnConfetti(), 300);
    } else {
        html += '<div class="ceremony-flag">\u{1F3C1}</div>';
        html += `<h2 class="ceremony-title non-champion">Season ${GameState.season} Complete</h2>`;
        html += `<p class="ceremony-subtitle">${GameState.stableName} finished in ${getOrdinal(playerRank)} place</p>`;
    }

    // Stats
    html += '<div class="ceremony-stats">';
    html += `<div class="ceremony-stat"><span class="ceremony-stat-value">${totalWins}</span><span class="ceremony-stat-label">Races Won</span></div>`;
    html += `<div class="ceremony-stat"><span class="ceremony-stat-value">\u00A3${formatMoney(totalEarnings)}</span><span class="ceremony-stat-label">Earnings</span></div>`;
    html += `<div class="ceremony-stat"><span class="ceremony-stat-value">${playerStanding?.points || 0}</span><span class="ceremony-stat-label">Points</span></div>`;
    if (bestHorse) {
        html += `<div class="ceremony-stat"><span class="ceremony-stat-value">${bestHorse}</span><span class="ceremony-stat-label">Best Horse</span></div>`;
    }
    html += '</div>';

    // Standings
    html += '<div class="ceremony-standings"><h3>Final Standings</h3>';
    sorted.forEach((t, i) => {
        html += `<div class="ceremony-standing-item ${t.isPlayer ? 'you' : ''}">
            <span>${i + 1}. ${t.name}${t.isPlayer ? ' (You)' : ''}</span>
            <span>${t.points} pts</span>
        </div>`;
    });
    html += '</div>';

    // Yearling graduation report
    const graduatedYearlings = GameState._graduatedYearlings || [];
    if (graduatedYearlings.length > 0) {
        html += '<div class="ceremony-aging"><h3>Yearling Graduates</h3>';
        html += '<p>The following yearlings have turned 2 and are now ready to race!</p>';
        graduatedYearlings.forEach(name => {
            html += `<p>\u{1F3C7} ${name} is now race-ready!</p>`;
        });
        html += '</div>';
    }

    // Off-season / aging report
    if (agingHorses.length > 0) {
        html += '<div class="ceremony-aging"><h3>Off-Season Report</h3>';
        html += '<p>Your horses are now a year older. Older horses (5+) may show signs of declining performance.</p>';
        agingHorses.forEach(h => {
            html += `<p>\u{1F434} ${h.name} (now ${h.age} years old)</p>`;
        });
        html += '</div>';
    }

    // Tattersalls Sale at season end - if any horses are listed for sale
    const pendingSaleHorses = GameState.horses.filter(h => h.pendingAuction);
    if (pendingSaleHorses.length > 0) {
        html += '<div class="ceremony-aging selling-auction-section"><h3>Tattersalls End-of-Season Sale</h3>';
        html += '<p style="margin-bottom: var(--space-md);">The following horses are entered in the sale:</p>';
        pendingSaleHorses.forEach(horse => {
            html += `<div class="selling-preview-item">
                <span class="horse-name">${horse.name}</span>
                <span class="reserve-info">Reserve: \u00A3${formatMoney(horse.reservePrice)}</span>
            </div>`;
        });
        html += `<button class="btn btn-primary" style="margin-top: var(--space-md); width: 100%;" onclick="runSellingAuction()">Watch the Sale</button>`;
        html += '</div>';
    }

    // Reputation standing
    const repTier = getReputationTier();
    html += `<div class="ceremony-aging"><h3>Reputation</h3>
        <p>The sport regards ${GameState.stableName} as <strong class="rep-${repTier.className}">${repTier.label}</strong> (${Math.round(getReputation())}/100).</p>
        <div class="rep-bar"><div class="rep-bar-fill" style="width:${getReputation()}%;"></div></div>
        <p style="font-size:0.8rem;color:var(--color-text-muted);">Win races your horses are well placed in to build it. It fades a little every season.</p>
        ${getReputation() >= 45 ? `<p style="font-size:0.8rem;">Better owners are taking an interest, and the sales companies are showing you stronger catalogues.</p>` : ''}
    </div>`;

    // Bloodstock report - foals born, yearlings weaned into the stable
    const breeding = GameState._breedingReport;
    if (breeding && (breeding.born.length || breeding.weaned.length || breeding.keepCost > 0)) {
        html += '<div class="ceremony-aging"><h3>Bloodstock</h3>';
        breeding.born.forEach(b => {
            html += `<p>\u{1F40E} <strong>${b.name}</strong> foaled.</p>
                     <p style="font-style:italic;color:var(--color-text-light);margin-left:var(--space-md);">${b.conformation}</p>`;
        });
        breeding.weaned.forEach(w => {
            html += `<p>\u{1F3E1} <strong>${w.name}</strong> has come into the yard as a yearling — she needs naming.</p>`;
        });
        (breeding.pensioned || []).forEach(name => {
            html += `<p>\u{1F33E} <strong>${name}</strong> is too old to breed and has been pensioned off.</p>`;
        });
        if (breeding.keepCost > 0) {
            html += `<p>Keep for mares and foals: <strong>£${formatMoney(breeding.keepCost)}</strong></p>`;
        }
        html += '</div>';
    }

    // Staff wages for next season
    if (GameState.staff && GameState.staff.length > 0) {
        const totalWages = GameState.staff.reduce((sum, s) => sum + getStaffWage(s), 0);
        html += `<div class="ceremony-aging"><h3>Staff Wages</h3>
            <p>${GameState.staff.length} staff member${GameState.staff.length > 1 ? 's' : ''} employed.</p>
            <p>Wages for next season: <strong>\u00A3${formatMoney(totalWages)}</strong></p>
            ${isStaffShortage() ? `<p style="color:var(--color-danger);font-weight:600;">Warning: your staff can only watch over ${getStaffCoverage()} of ${GameState.horses.length} horses!</p>` : ''}
        </div>`;
    }

    html += `<button class="btn btn-primary" onclick="startNextSeason()">Continue to Season ${GameState.season + 1}</button>`;

    document.getElementById('ceremony-content').innerHTML = html;
    showScreen('season-ceremony');
}

function startNextSeason() {
    // Award XP for completing a season
    awardXP(XP_AWARDS.seasonComplete, 'seasonComplete');

    // Award care quality XP for well-maintained horses
    GameState.horses.forEach(h => {
        if (h.stallCare) {
            const avgCare = (h.stallCare.feedLevel + h.stallCare.waterLevel + h.stallCare.hayLevel + h.stallCare.beddingQuality) / 4;
            if (avgCare >= 80) {
                awardXP(XP_AWARDS.careQuality, 'careQuality');
            }
        }
    });

    GameState.season++;

    // Regenerate AI stables for new season (fresh horses, different ratings)
    GameState.competitors.forEach(trainer => {
        trainer.horses = generateAIStable(trainer);
    });

    initializeRaceCalendar();
    GameState.standings.forEach(s => s.points = 0);

    // Reset per-season stats for horses
    GameState.horses.forEach(h => {
        h.racesRun = 0;
        h.wins = 0;
        h.totalEarnings = 0;
        h.pendingAuction = false;
        h.reservePrice = 0;
    });

    // Deduct staff wages for new season
    if (GameState.staff && GameState.staff.length > 0) {
        deductStaffWages();
    }

    returnToYard();
}

// ============================================
// THE YARD - Top-Down 2D Hub World
// ============================================

const TILE_SIZE = 32;
const OUTDOOR_ROWS = 30;
const OUTDOOR_COLS = 40;
const BARN_COLS = 14;

// Outdoor tile types
const T_GRASS = 0, T_PATH = 1, T_COBBLE = 2, T_BLDG = 3, T_FENCE = 4, T_PADDOCK = 5, T_WATER = 6;
const TILE_CSS = ['grass','path','cobble','building-floor','fence','paddock','water'];
const TILE_WALK = [true, true, true, false, false, true, false];

// Barn tile types
const B_WALL = 0, B_FLOOR = 1, B_STALL = 2, B_DOOR = 3, B_ROOM = 4;
const BARN_CSS = ['wall','building-floor','stall-floor','door','building-floor'];
const BARN_WALK = [false, true, true, true, true];

// Feed room tile types
const F_WALL = 0, F_FLOOR = 1, F_DOOR = 2;
const FEEDROOM_CSS = ['wall', 'building-floor', 'door'];
const FEEDROOM_WALK = [false, true, true];

const FEEDROOM_ROWS = 12;
const FEEDROOM_COLS = 10;

// Stall interior tile types
const S_WALL = 0, S_FLOOR = 1, S_DOOR = 2, S_BEDDING = 3, S_FEEDPOT = 4, S_WATERBKT = 5, S_HAYRACK = 6, S_MANURE = 7;
const STALL_CSS = ['wall', 'building-floor', 'door', 'stall-bedding', 'stall-feedpot', 'stall-waterbkt', 'stall-hayrack', 'stall-manure'];
const STALL_WALK = [false, true, true, true, false, false, false, true];
const STALL_ROWS = 8, STALL_COLS = 8;

const FEED_TYPES = {
    linseed:   { label: 'Linseed',    category: 'High-Fat',     color: '#8B6914', stat: 'stamina',      bonus: [1,2], penalty: 'acceleration', penaltyRange: [0,1] },
    sugarbeet: { label: 'Sugar Beet', category: 'High-Fat',     color: '#A0522D', stat: 'stamina',      bonus: [1,2], penalty: 'acceleration', penaltyRange: [0,1] },
    oats:      { label: 'Oats',       category: 'High-Protein', color: '#DAA520', stat: 'speed',        bonus: [1,2], penalty: 'temperament',  penaltyRange: [0,1] },
    barley:    { label: 'Barley',     category: 'High-Protein', color: '#D4A76A', stat: 'speed',        bonus: [1,2], penalty: 'temperament',  penaltyRange: [0,1] },
    bran:      { label: 'Bran',       category: 'Balanced',     color: '#C4A265', stat: 'temperament',  bonus: [0,1], penalty: 'speed',        penaltyRange: [0,1] },
    chaff:     { label: 'Chaff',      category: 'Balanced',     color: '#9ACD32', stat: 'acceleration', bonus: [0,1], penalty: 'stamina',      penaltyRange: [0,1] },
};
const FEED_TYPE_KEYS = ['linseed', 'sugarbeet', 'oats', 'barley', 'bran', 'chaff'];

// Building handler/prompt mapping for auto-generating interactables
const BUILDING_INTERACT_MAP = {
    'barn':          { prompt: 'Enter the Barn',         handler: 'enter-barn',    entrance: 'south' },
    'tack-store':    { prompt: 'Visit Tack Store',       handler: 'tack-store',    entrance: 'south' },
    'feed-mill':     { prompt: 'Visit Feed Mill',        handler: 'feed-mill',     entrance: 'south' },
    'tattersalls':   { prompt: "Enter Tattersall's",     handler: 'tattersalls',   entrance: 'south' },
    'gallops':       { prompt: 'Head to the Gallops',    handler: 'gallops',       entrance: 'south' },
    'racecourse':    { prompt: 'Go to Racecourse',       handler: 'racecourse',    entrance: 'north' },
    'forage':        { prompt: 'Visit Forage & Bedding', handler: 'forage',        entrance: 'north' },
    'supplier':      { prompt: 'Visit Stable Supplier',  handler: 'supplier',      entrance: 'north' },
    'trainer-house': { prompt: "Enter Trainer's House",  handler: 'trainer-house', entrance: 'south' },
    'vet':           { prompt: "Visit the Vet",          handler: 'vet',           entrance: 'south' },
    'mechanics':     { prompt: 'Visit Mechanics',        handler: 'mechanics',     entrance: 'south' },
    'racing-school': { prompt: 'Visit Racing School',    handler: 'racing-school', entrance: 'north' },
};

/**
 * Auto-generate interactable positions from a buildings array + extra interactables.
 * Each building gets 2 interactable tiles at its entrance edge.
 */
function generateInteractablesFromCentre(centre) {
    const list = [];
    centre.buildings.forEach(b => {
        const info = BUILDING_INTERACT_MAP[b.id];
        if (!info) return;
        let r, c1, c2;
        if (info.entrance === 'south') {
            r = b.r + b.h;
            c1 = b.c + Math.floor(b.w / 2) - 1;
            c2 = b.c + Math.floor(b.w / 2);
        } else {
            r = b.r - 1;
            c1 = b.c + Math.floor(b.w / 2) - 1;
            c2 = b.c + Math.floor(b.w / 2);
        }
        list.push({ id: `${b.id}-e1`, r, c: c1, prompt: info.prompt, handler: info.handler });
        list.push({ id: `${b.id}-e2`, r, c: c2, prompt: info.prompt, handler: info.handler });
    });
    // Extra interactables (paddock, lorry)
    if (centre.extras) {
        centre.extras.forEach(e => list.push(e));
    }
    // Stud Farm office sits on the corner of the broodmare paddock, so every
    // centre gets one without needing its own building plot.
    if (centre.paddock) {
        const p = centre.paddock;
        list.push({ id: 'stud-1', r: p.r2, c: p.c1,     prompt: 'Stud Farm Office', handler: 'stud-farm' });
        list.push({ id: 'stud-2', r: p.r2, c: p.c1 + 1, prompt: 'Stud Farm Office', handler: 'stud-farm' });
    }
    return list;
}

// ============================================
// TRAINING CENTRES - 5 Maps
// ============================================

const TRAINING_CENTRES = {
    newmarket: {
        name: 'Newmarket',
        description: 'Historic headquarters of British flat racing. Open heathland.',
        theme: { grass: '#4a8c3f', path: '#c4a868', accent: '#d4c89a', sky: 'flat' },
        buildings: [
            { id: 'barn',        label: 'The Barn',           r: 10, c: 15, w: 10, h: 6, css: 'barn' },
            { id: 'tack-store',  label: 'Tack Store',         r: 12, c: 3,  w: 5,  h: 4, css: 'tack-store' },
            { id: 'feed-mill',   label: 'Feed Mill',          r: 12, c: 32, w: 5,  h: 4, css: 'feed-mill' },
            { id: 'tattersalls', label: "Tattersall's",       r: 3,  c: 2,  w: 7,  h: 4, css: 'tattersalls' },
            { id: 'gallops',     label: 'The Gallops',        r: 3,  c: 31, w: 7,  h: 4, css: 'gallops-bldg' },
            { id: 'racecourse',  label: 'Racecourse',         r: 24, c: 28, w: 9,  h: 4, css: 'racecourse' },
            { id: 'forage',      label: 'Forage & Bedding',   r: 25, c: 3,  w: 6,  h: 3, css: 'forage' },
            { id: 'supplier',    label: 'Stable Supplier',    r: 25, c: 14, w: 6,  h: 3, css: 'supplier' },
            { id: 'trainer-house', label: "Trainer's House",  r: 3,  c: 16, w: 7,  h: 4, css: 'trainer-house' },
            { id: 'vet',         label: "Vet's Office",       r: 3,  c: 25, w: 5,  h: 4, css: 'vet' },
            { id: 'mechanics',   label: 'Mechanics',          r: 3,  c: 10, w: 5,  h: 4, css: 'mechanics' },
            { id: 'racing-school', label: 'Racing School',    r: 20, c: 26, w: 6,  h: 3, css: 'racing-school' },
        ],
        paths: [
            { type: 'hline', r1: 16, r2: 17, c1: 1, c2: 38 },           // Main E-W
            { type: 'vline', r1: 8, r2: 16, c1: 9, c2: 10 },            // NW vertical
            { type: 'hline', r1: 8, r2: 8, c1: 5, c2: 12 },             // NW horizontal
            { type: 'vline', r1: 7, r2: 8, c1: 5, c2: 6 },              // Tattersalls stub
            { type: 'vline', r1: 7, r2: 8, c1: 11, c2: 12 },            // Mechanics stub
            { type: 'vline', r1: 8, r2: 16, c1: 29, c2: 30 },           // NE vertical
            { type: 'hline', r1: 8, r2: 8, c1: 29, c2: 34 },            // NE horizontal
            { type: 'vline', r1: 7, r2: 8, c1: 33, c2: 34 },            // Gallops stub
            { type: 'vline', r1: 18, r2: 24, c1: 19, c2: 20 },          // South from barn
            { type: 'hline', r1: 24, r2: 25, c1: 5, c2: 20 },           // SW branch
            { type: 'hline', r1: 22, r2: 23, c1: 20, c2: 32 },          // SE branch
            { type: 'hline', r1: 7, r2: 7, c1: 19, c2: 28 },            // North to trainer/vet
        ],
        courtyard: { r1: 8, c1: 12, r2: 18, c2: 26 },
        paddock: { r1: 20, c1: 3, r2: 23, c2: 10 },
        pond: { r1: 20, c1: 25, r2: 22, c2: 26 },
        trees: [
            {r:1,c:12},{r:1,c:20},{r:1,c:25},{r:1,c:38},
            {r:28,c:2},{r:28,c:14},{r:28,c:22},{r:28,c:38},
            {r:8,c:1},{r:14,c:1},{r:22,c:1},{r:8,c:38},{r:14,c:38},
        ],
        playerStart: { r: 18, c: 19 },
        lorryPos: { r: 17, c: 22 },
        extras: [
            { id: 'pad-1', r: 23, c: 7, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'pad-2', r: 23, c: 8, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'lorry-1', r: 18, c: 22, prompt: 'Horse Lorry', handler: 'lorry' },
            { id: 'lorry-2', r: 18, c: 23, prompt: 'Horse Lorry', handler: 'lorry' },
        ],
        visualFeatures: {
            fenceStyle: 'post-rail',
            buildingTint: 'tint-brick',
            treeStyle: 'windswept',
            terrainPatches: [
                { type: 'heath', r1: 2, c1: 8, r2: 6, c2: 14 },
                { type: 'heath', r1: 18, c1: 28, r2: 22, c2: 36 },
                { type: 'heath', r1: 6, c1: 26, r2: 8, c2: 30 },
            ],
            landmarks: [
                { type: 'clock-tower', r: 9, c: 28 }
            ],
            extraDecos: [
                { type: 'haybale', r: 19, c: 2 },
                { type: 'haybale', r: 19, c: 4 },
            ]
        }
    },
    lambourn: {
        name: 'Lambourn',
        description: 'Valley of the Racehorse. Sheltered training grounds in the Berkshire Downs.',
        theme: { grass: '#3d7a35', path: '#b8a060', accent: '#8a9a6a', sky: 'valley' },
        buildings: [
            { id: 'barn',        label: 'The Barn',           r: 12, c: 14, w: 10, h: 6, css: 'barn' },
            { id: 'tack-store',  label: 'Tack Store',         r: 10, c: 5,  w: 5,  h: 4, css: 'tack-store' },
            { id: 'feed-mill',   label: 'Feed Mill',          r: 10, c: 28, w: 5,  h: 4, css: 'feed-mill' },
            { id: 'tattersalls', label: "Tattersall's",       r: 3,  c: 4,  w: 7,  h: 4, css: 'tattersalls' },
            { id: 'gallops',     label: 'The Gallops',        r: 3,  c: 28, w: 7,  h: 4, css: 'gallops-bldg' },
            { id: 'racecourse',  label: 'Racecourse',         r: 24, c: 24, w: 9,  h: 4, css: 'racecourse' },
            { id: 'forage',      label: 'Forage & Bedding',   r: 24, c: 2,  w: 6,  h: 3, css: 'forage' },
            { id: 'supplier',    label: 'Stable Supplier',    r: 24, c: 10, w: 6,  h: 3, css: 'supplier' },
            { id: 'trainer-house', label: "Trainer's House",  r: 3,  c: 14, w: 7,  h: 4, css: 'trainer-house' },
            { id: 'vet',         label: "Vet's Office",       r: 3,  c: 22, w: 5,  h: 4, css: 'vet' },
            { id: 'mechanics',   label: 'Mechanics',          r: 20, c: 2,  w: 5,  h: 3, css: 'mechanics' },
            { id: 'racing-school', label: 'Racing School',    r: 20, c: 32, w: 6,  h: 3, css: 'racing-school' },
        ],
        paths: [
            { type: 'hline', r1: 18, r2: 19, c1: 1, c2: 38 },           // Main E-W
            { type: 'vline', r1: 8, r2: 18, c1: 7, c2: 8 },             // NW vertical
            { type: 'hline', r1: 8, r2: 8, c1: 7, c2: 14 },             // North connector W
            { type: 'vline', r1: 7, r2: 8, c1: 7, c2: 8 },              // Tattersalls stub
            { type: 'vline', r1: 8, r2: 18, c1: 30, c2: 31 },           // NE vertical
            { type: 'hline', r1: 8, r2: 8, c1: 24, c2: 31 },            // North connector E
            { type: 'vline', r1: 7, r2: 8, c1: 30, c2: 31 },            // Gallops stub
            { type: 'vline', r1: 19, r2: 24, c1: 18, c2: 19 },          // South from barn
            { type: 'hline', r1: 23, r2: 23, c1: 4, c2: 19 },           // SW branch
            { type: 'hline', r1: 23, r2: 23, c1: 19, c2: 28 },          // SE branch
            { type: 'hline', r1: 7, r2: 7, c1: 17, c2: 24 },            // North to trainer/vet
        ],
        courtyard: { r1: 10, c1: 11, r2: 20, c2: 25 },
        paddock: { r1: 20, c1: 9, r2: 23, c2: 16 },
        pond: { r1: 8, c1: 36, r2: 10, c2: 37 },
        trees: [
            {r:1,c:1},{r:1,c:12},{r:1,c:36},{r:1,c:38},
            {r:28,c:1},{r:28,c:18},{r:28,c:35},{r:28,c:38},
            {r:10,c:1},{r:15,c:38},{r:22,c:38},{r:6,c:38},
            {r:15,c:1},{r:26,c:20},
        ],
        playerStart: { r: 20, c: 18 },
        lorryPos: { r: 19, c: 22 },
        extras: [
            { id: 'pad-1', r: 23, c: 12, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'pad-2', r: 23, c: 13, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'lorry-1', r: 20, c: 22, prompt: 'Horse Lorry', handler: 'lorry' },
            { id: 'lorry-2', r: 20, c: 23, prompt: 'Horse Lorry', handler: 'lorry' },
        ],
        visualFeatures: {
            fenceStyle: 'hedge',
            buildingTint: 'tint-stone',
            treeStyle: 'lush',
            terrainPatches: [
                { type: 'chalk', r1: 1, c1: 1, r2: 3, c2: 3 },
                { type: 'chalk', r1: 26, c1: 36, r2: 28, c2: 38 },
            ],
            landmarks: [
                { type: 'cottage', r: 6, c: 18 }
            ],
            extraDecos: [
                { type: 'wildflower', r: 15, c: 3 },
                { type: 'wildflower', r: 16, c: 6 },
                { type: 'wildflower', r: 24, c: 20 },
                { type: 'wildflower', r: 12, c: 36 },
            ]
        }
    },
    epsom: {
        name: 'Epsom',
        description: 'Home of the Derby. Famous for its undulating terrain and downhill finish.',
        theme: { grass: '#52944a', path: '#c8b878', accent: '#7aaa6a', sky: 'hilly' },
        buildings: [
            { id: 'barn',        label: 'The Barn',           r: 13, c: 15, w: 10, h: 6, css: 'barn' },
            { id: 'tack-store',  label: 'Tack Store',         r: 14, c: 4,  w: 5,  h: 4, css: 'tack-store' },
            { id: 'feed-mill',   label: 'Feed Mill',          r: 14, c: 30, w: 5,  h: 4, css: 'feed-mill' },
            { id: 'tattersalls', label: "Tattersall's",       r: 4,  c: 2,  w: 7,  h: 4, css: 'tattersalls' },
            { id: 'gallops',     label: 'The Gallops',        r: 2,  c: 30, w: 7,  h: 4, css: 'gallops-bldg' },
            { id: 'racecourse',  label: 'Racecourse',         r: 26, c: 28, w: 9,  h: 3, css: 'racecourse' },
            { id: 'forage',      label: 'Forage & Bedding',   r: 26, c: 2,  w: 6,  h: 3, css: 'forage' },
            { id: 'supplier',    label: 'Stable Supplier',    r: 26, c: 12, w: 6,  h: 3, css: 'supplier' },
            { id: 'trainer-house', label: "Trainer's House",  r: 4,  c: 15, w: 7,  h: 4, css: 'trainer-house' },
            { id: 'vet',         label: "Vet's Office",       r: 4,  c: 24, w: 5,  h: 4, css: 'vet' },
            { id: 'mechanics',   label: 'Mechanics',          r: 4,  c: 10, w: 5,  h: 4, css: 'mechanics' },
            { id: 'racing-school', label: 'Racing School',    r: 21, c: 30, w: 6,  h: 3, css: 'racing-school' },
        ],
        paths: [
            { type: 'hline', r1: 19, r2: 20, c1: 1, c2: 38 },           // Main E-W
            { type: 'vline', r1: 9, r2: 19, c1: 8, c2: 9 },             // NW vertical
            { type: 'hline', r1: 9, r2: 9, c1: 5, c2: 14 },             // North connector W
            { type: 'vline', r1: 8, r2: 9, c1: 5, c2: 6 },              // Tattersalls stub
            { type: 'vline', r1: 8, r2: 9, c1: 12, c2: 13 },            // Mechanics stub
            { type: 'vline', r1: 7, r2: 19, c1: 32, c2: 33 },           // NE vertical
            { type: 'hline', r1: 7, r2: 7, c1: 28, c2: 33 },            // North connector E
            { type: 'vline', r1: 6, r2: 7, c1: 32, c2: 33 },            // Gallops stub
            { type: 'vline', r1: 20, r2: 25, c1: 19, c2: 20 },          // South from barn
            { type: 'hline', r1: 25, r2: 25, c1: 4, c2: 20 },           // SW branch
            { type: 'hline', r1: 25, r2: 25, c1: 20, c2: 32 },          // SE branch
            { type: 'hline', r1: 8, r2: 8, c1: 18, c2: 26 },            // North to trainer/vet
        ],
        courtyard: { r1: 11, c1: 12, r2: 21, c2: 27 },
        paddock: { r1: 21, c1: 2, r2: 24, c2: 9 },
        pond: { r1: 10, c1: 35, r2: 12, c2: 37 },
        trees: [
            {r:1,c:10},{r:1,c:24},{r:1,c:38},{r:2,c:1},
            {r:28,c:2},{r:28,c:20},{r:28,c:38},{r:11,c:1},
            {r:17,c:1},{r:22,c:1},{r:10,c:38},{r:16,c:38},
            {r:27,c:22},
        ],
        playerStart: { r: 21, c: 19 },
        lorryPos: { r: 20, c: 23 },
        extras: [
            { id: 'pad-1', r: 24, c: 5, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'pad-2', r: 24, c: 6, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'lorry-1', r: 21, c: 23, prompt: 'Horse Lorry', handler: 'lorry' },
            { id: 'lorry-2', r: 21, c: 24, prompt: 'Horse Lorry', handler: 'lorry' },
        ],
        visualFeatures: {
            fenceStyle: 'post-rail',
            buildingTint: 'tint-light',
            treeStyle: 'mixed-hill',
            terrainPatches: [
                { type: 'chalk', r1: 1, c1: 30, r2: 4, c2: 38 },
                { type: 'chalk', r1: 26, c1: 1, r2: 28, c2: 8 },
            ],
            landmarks: [
                { type: 'clock-tower', r: 14, c: 36 }
            ],
            extraDecos: [
                { type: 'skyline', r: 28, c: 10 },
            ]
        }
    },
    middleham: {
        name: 'Middleham',
        description: 'Castle town on the Yorkshire moors. Windswept gallops with stunning views.',
        theme: { grass: '#5a8a4a', path: '#a09070', accent: '#8a8070', sky: 'moor' },
        buildings: [
            { id: 'barn',        label: 'The Barn',           r: 11, c: 16, w: 10, h: 6, css: 'barn' },
            { id: 'tack-store',  label: 'Tack Store',         r: 11, c: 5,  w: 5,  h: 4, css: 'tack-store' },
            { id: 'feed-mill',   label: 'Feed Mill',          r: 11, c: 30, w: 5,  h: 4, css: 'feed-mill' },
            { id: 'tattersalls', label: "Tattersall's",       r: 2,  c: 2,  w: 7,  h: 4, css: 'tattersalls' },
            { id: 'gallops',     label: 'The Gallops',        r: 2,  c: 32, w: 7,  h: 4, css: 'gallops-bldg' },
            { id: 'racecourse',  label: 'Racecourse',         r: 25, c: 26, w: 9,  h: 3, css: 'racecourse' },
            { id: 'forage',      label: 'Forage & Bedding',   r: 25, c: 4,  w: 6,  h: 3, css: 'forage' },
            { id: 'supplier',    label: 'Stable Supplier',    r: 25, c: 14, w: 6,  h: 3, css: 'supplier' },
            { id: 'trainer-house', label: "Trainer's House",  r: 2,  c: 10, w: 7,  h: 4, css: 'trainer-house' },
            { id: 'vet',         label: "Vet's Office",       r: 2,  c: 24, w: 5,  h: 4, css: 'vet' },
            { id: 'mechanics',   label: 'Mechanics',          r: 2,  c: 18, w: 5,  h: 4, css: 'mechanics' },
            { id: 'racing-school', label: 'Racing School',    r: 21, c: 30, w: 6,  h: 3, css: 'racing-school' },
        ],
        paths: [
            { type: 'hline', r1: 17, r2: 18, c1: 1, c2: 38 },           // Main E-W
            { type: 'vline', r1: 7, r2: 17, c1: 7, c2: 8 },             // NW vertical
            { type: 'hline', r1: 7, r2: 7, c1: 5, c2: 20 },             // North connector
            { type: 'vline', r1: 6, r2: 7, c1: 5, c2: 6 },              // Tattersalls stub
            { type: 'vline', r1: 6, r2: 7, c1: 13, c2: 14 },            // Trainer stub
            { type: 'vline', r1: 6, r2: 7, c1: 19, c2: 20 },            // Mechanics stub
            { type: 'vline', r1: 7, r2: 17, c1: 33, c2: 34 },           // NE vertical
            { type: 'hline', r1: 7, r2: 7, c1: 26, c2: 34 },            // North connector E
            { type: 'vline', r1: 6, r2: 7, c1: 26, c2: 27 },            // Vet stub
            { type: 'vline', r1: 6, r2: 7, c1: 34, c2: 35 },            // Gallops stub
            { type: 'vline', r1: 18, r2: 25, c1: 20, c2: 21 },          // South from barn
            { type: 'hline', r1: 24, r2: 24, c1: 6, c2: 21 },           // SW branch
            { type: 'hline', r1: 24, r2: 24, c1: 21, c2: 30 },          // SE branch
        ],
        courtyard: { r1: 9, c1: 13, r2: 19, c2: 28 },
        paddock: { r1: 20, c1: 3, r2: 23, c2: 11 },
        pond: { r1: 21, c1: 24, r2: 23, c2: 25 },
        trees: [
            {r:1,c:1},{r:1,c:30},{r:1,c:38},
            {r:28,c:2},{r:28,c:12},{r:28,c:24},{r:28,c:38},
            {r:9,c:1},{r:14,c:1},{r:20,c:1},{r:9,c:38},{r:20,c:38},
        ],
        playerStart: { r: 19, c: 20 },
        lorryPos: { r: 18, c: 24 },
        extras: [
            { id: 'pad-1', r: 23, c: 7, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'pad-2', r: 23, c: 8, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'lorry-1', r: 19, c: 24, prompt: 'Horse Lorry', handler: 'lorry' },
            { id: 'lorry-2', r: 19, c: 25, prompt: 'Horse Lorry', handler: 'lorry' },
        ],
        visualFeatures: {
            fenceStyle: 'stone-wall',
            buildingTint: 'tint-stone',
            treeStyle: 'sparse-moor',
            terrainPatches: [
                { type: 'moor', r1: 2, c1: 8, r2: 6, c2: 18 },
                { type: 'moor', r1: 8, c1: 28, r2: 12, c2: 36 },
                { type: 'rock', r1: 15, c1: 1, r2: 16, c2: 3 },
                { type: 'rock', r1: 4, c1: 36, r2: 5, c2: 38 },
            ],
            landmarks: [
                { type: 'castle', r: 8, c: 2 }
            ],
            extraDecos: [
                { type: 'heather', r: 4, c: 12 },
                { type: 'heather', r: 6, c: 30 },
                { type: 'heather', r: 10, c: 34 },
                { type: 'heather', r: 18, c: 36 },
                { type: 'rock', r: 14, c: 2 },
                { type: 'rock', r: 22, c: 36 },
            ]
        }
    },
    malton: {
        name: 'Malton',
        description: 'Yorkshire racing town. Traditional northern training centre with wide open gallops.',
        theme: { grass: '#4a8040', path: '#baa868', accent: '#9aaa78', sky: 'pastoral' },
        buildings: [
            { id: 'barn',        label: 'The Barn',           r: 10, c: 14, w: 10, h: 6, css: 'barn' },
            { id: 'tack-store',  label: 'Tack Store',         r: 12, c: 4,  w: 5,  h: 4, css: 'tack-store' },
            { id: 'feed-mill',   label: 'Feed Mill',          r: 12, c: 33, w: 5,  h: 4, css: 'feed-mill' },
            { id: 'tattersalls', label: "Tattersall's",       r: 3,  c: 3,  w: 7,  h: 4, css: 'tattersalls' },
            { id: 'gallops',     label: 'The Gallops',        r: 3,  c: 32, w: 7,  h: 4, css: 'gallops-bldg' },
            { id: 'racecourse',  label: 'Racecourse',         r: 25, c: 2,  w: 9,  h: 3, css: 'racecourse' },
            { id: 'forage',      label: 'Forage & Bedding',   r: 25, c: 30, w: 6,  h: 3, css: 'forage' },
            { id: 'supplier',    label: 'Stable Supplier',    r: 25, c: 20, w: 6,  h: 3, css: 'supplier' },
            { id: 'trainer-house', label: "Trainer's House",  r: 3,  c: 12, w: 7,  h: 4, css: 'trainer-house' },
            { id: 'vet',         label: "Vet's Office",       r: 3,  c: 25, w: 5,  h: 4, css: 'vet' },
            { id: 'mechanics',   label: 'Mechanics',          r: 20, c: 33, w: 5,  h: 3, css: 'mechanics' },
            { id: 'racing-school', label: 'Racing School',    r: 20, c: 3,  w: 6,  h: 3, css: 'racing-school' },
        ],
        paths: [
            { type: 'hline', r1: 16, r2: 17, c1: 1, c2: 38 },           // Main E-W
            { type: 'vline', r1: 8, r2: 16, c1: 8, c2: 9 },             // NW vertical
            { type: 'hline', r1: 8, r2: 8, c1: 6, c2: 14 },             // North connector W
            { type: 'vline', r1: 7, r2: 8, c1: 6, c2: 7 },              // Tattersalls stub
            { type: 'vline', r1: 7, r2: 8, c1: 15, c2: 16 },            // Trainer stub
            { type: 'vline', r1: 8, r2: 16, c1: 34, c2: 35 },           // NE vertical
            { type: 'hline', r1: 8, r2: 8, c1: 27, c2: 35 },            // North connector E
            { type: 'vline', r1: 7, r2: 8, c1: 27, c2: 28 },            // Vet stub
            { type: 'vline', r1: 7, r2: 8, c1: 34, c2: 35 },            // Gallops stub
            { type: 'vline', r1: 17, r2: 25, c1: 18, c2: 19 },          // South from barn
            { type: 'hline', r1: 24, r2: 24, c1: 6, c2: 19 },           // SW branch
            { type: 'hline', r1: 24, r2: 24, c1: 19, c2: 33 },          // SE branch
        ],
        courtyard: { r1: 8, c1: 11, r2: 18, c2: 26 },
        paddock: { r1: 20, c1: 14, r2: 23, c2: 22 },
        pond: { r1: 21, c1: 27, r2: 23, c2: 28 },
        trees: [
            {r:1,c:1},{r:1,c:20},{r:1,c:30},{r:1,c:38},
            {r:28,c:1},{r:28,c:15},{r:28,c:28},{r:28,c:38},
            {r:9,c:1},{r:15,c:1},{r:9,c:38},{r:26,c:38},
            {r:22,c:1},
        ],
        playerStart: { r: 18, c: 18 },
        lorryPos: { r: 17, c: 22 },
        extras: [
            { id: 'pad-1', r: 23, c: 17, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'pad-2', r: 23, c: 18, prompt: 'Turn Out to Paddock', handler: 'paddock' },
            { id: 'lorry-1', r: 18, c: 22, prompt: 'Horse Lorry', handler: 'lorry' },
            { id: 'lorry-2', r: 18, c: 23, prompt: 'Horse Lorry', handler: 'lorry' },
        ],
        visualFeatures: {
            fenceStyle: 'wood-hedge',
            buildingTint: 'tint-brick',
            treeStyle: 'oak',
            terrainPatches: [
                { type: 'river', r1: 8, c1: 38, r2: 28, c2: 38 },
                { type: 'field', r1: 24, c1: 12, r2: 26, c2: 18 },
            ],
            landmarks: [
                { type: 'spire', r: 8, c: 20 }
            ],
            extraDecos: [
                { type: 'haybale', r: 24, c: 14 },
                { type: 'haybale', r: 25, c: 16 },
                { type: 'haybale', r: 10, c: 2 },
                { type: 'wildflower', r: 18, c: 12 },
            ]
        }
    }
};

/** Get active training centre config */
function getActiveCentre() {
    return TRAINING_CENTRES[GameState.trainingCentre || 'newmarket'];
}

/** Get buildings for active centre */
function getOutdoorBldgs() {
    return getActiveCentre().buildings;
}

/** Get interactables for active centre */
function getOutdoorInteract() {
    const list = generateInteractablesFromCentre(getActiveCentre());
    // Add car interactables if car owned
    if (GameState.ownsCar) {
        const trainerBldg = getActiveCentre().buildings.find(b => b.id === 'trainer-house');
        if (trainerBldg) {
            const carR = trainerBldg.r + trainerBldg.h;
            const carC = trainerBldg.c + trainerBldg.w - 2;
            list.push({ id: 'car-1', r: carR, c: carC, prompt: 'Get in Car', handler: 'car' });
            list.push({ id: 'car-2', r: carR, c: carC + 1, prompt: 'Get in Car', handler: 'car' });
        }
    }
    return list;
}

// Legacy references for backward compatibility
const OUTDOOR_BLDGS = TRAINING_CENTRES.newmarket.buildings;
const OUTDOOR_INTERACT = generateInteractablesFromCentre(TRAINING_CENTRES.newmarket);

const YardState = {
    active: false,
    currentZone: 'outdoor',
    playerR: 18,
    playerC: 19,
    keyHandler: null,
    walkingTimeout: null,
    panelOpen: false,
    _currentInteractable: null,
    outdoorMap: null,
    barnMap: null,
    barnInteractables: [],
    lorryMode: false,
    lorryHorseIdx: null,
    bucketPile: [],
    carryingBucket: null,
    carryingTack: null,
    leadingHorse: null,
    inCar: false,
    carryingWaterBucket: false,
    carryingHay: false,
    carryingWheelbarrow: false,
    stallZoneHorseIdx: null,
    stallMap: null,
    stallInteractables: [],
    stallEntryR: null,
    stallEntryC: null,
};

const FeedRoomState = {
    hasScoop: false,
    scoopFeedType: null,
    buckets: [],
    interactables: [],
    map: null,
};

// --- Map Generation ---

function generateOutdoorMap() {
    const R = OUTDOOR_ROWS, C = OUTDOOR_COLS;
    const map = Array.from({length: R}, () => new Array(C).fill(T_GRASS));
    const fill = (r1, c1, r2, c2, t) => {
        for (let r = Math.max(0, r1); r <= Math.min(R-1, r2); r++)
            for (let c = Math.max(0, c1); c <= Math.min(C-1, c2); c++)
                map[r][c] = t;
    };

    const centre = getActiveCentre();

    // Fence border
    fill(0, 0, 0, C-1, T_FENCE);
    fill(R-1, 0, R-1, C-1, T_FENCE);
    for (let r = 0; r < R; r++) { map[r][0] = T_FENCE; map[r][C-1] = T_FENCE; }

    // Cobblestone courtyard
    if (centre.courtyard) {
        fill(centre.courtyard.r1, centre.courtyard.c1, centre.courtyard.r2, centre.courtyard.c2, T_COBBLE);
    }

    // Paths from centre definition
    if (centre.paths) {
        centre.paths.forEach(p => {
            if (p.type === 'hline') {
                for (let r = p.r1; r <= p.r2; r++)
                    for (let c = Math.max(1, p.c1); c <= Math.min(C-2, p.c2); c++)
                        map[r][c] = T_PATH;
            } else if (p.type === 'vline') {
                for (let r = Math.max(1, p.r1); r <= Math.min(R-2, p.r2); r++)
                    for (let c = p.c1; c <= p.c2; c++)
                        map[r][c] = T_PATH;
            }
        });
    }

    // Paddock area
    if (centre.paddock) {
        fill(centre.paddock.r1, centre.paddock.c1, centre.paddock.r2, centre.paddock.c2, T_PADDOCK);
    }

    // Pond
    if (centre.pond) {
        fill(centre.pond.r1, centre.pond.c1, centre.pond.r2, centre.pond.c2, T_WATER);
    }

    // Buildings (solid, placed last to overwrite)
    centre.buildings.forEach(b => fill(b.r, b.c, b.r + b.h - 1, b.c + b.w - 1, T_BLDG));

    return map;
}

function generateBarnMap() {
    const stallsPerSide = Math.floor(GameState.maxStalls / 2);
    const roomHeight = 4;
    const roomStart = stallsPerSide * 3 + 1;       // +1 so wall gap at stallsPerSide*3 stays intact
    const rows = roomStart + roomHeight + 1;        // rooms + exit row
    const cols = BARN_COLS;
    const map = Array.from({length: rows}, () => new Array(cols).fill(B_WALL));
    const lastRow = rows - 1;

    // Central aisle (cols 5-8) from row 1 to lastRow-1
    for (let r = 1; r < lastRow; r++)
        for (let c = 5; c <= 8; c++) map[r][c] = B_FLOOR;

    // Stalls (top section, 3 rows per stall: 2 stall rows + 1 wall gap)
    for (let s = 0; s < stallsPerSide; s++) {
        const baseRow = 1 + s * 3;
        // Left stall (cols 1-3)
        for (let c = 1; c <= 3; c++) {
            map[baseRow][c] = B_STALL;
            map[baseRow + 1][c] = B_STALL;
        }
        map[baseRow + 1][4] = B_DOOR;  // door into aisle
        // Right stall (cols 10-12)
        for (let c = 10; c <= 12; c++) {
            map[baseRow][c] = B_STALL;
            map[baseRow + 1][c] = B_STALL;
        }
        map[baseRow + 1][9] = B_DOOR;  // door into aisle
        // Row baseRow+2 stays B_WALL at stall cols (containment gap)
    }

    // Tack Room (left, 4 rows)
    for (let r = roomStart; r < roomStart + roomHeight; r++)
        for (let c = 1; c <= 3; c++) map[r][c] = B_ROOM;
    map[roomStart + roomHeight - 1][4] = B_DOOR;

    // Feed Room (right, 4 rows)
    for (let r = roomStart; r < roomStart + roomHeight; r++)
        for (let c = 10; c <= 12; c++) map[r][c] = B_ROOM;
    map[roomStart + roomHeight - 1][9] = B_DOOR;

    // Exit doors at south wall
    for (let c = 5; c <= 8; c++) map[lastRow][c] = B_DOOR;

    return map;
}

function generateBarnInteractables() {
    const stallsPerSide = Math.floor(GameState.maxStalls / 2);
    const roomStart = stallsPerSide * 3 + 1;
    const lastRow = roomStart + 4;
    const horses = GameState.horses;
    const list = [];

    // Tack/Feed room interactables (near entrance, south end)
    list.push({ id: 'tack-room', r: roomStart + 3, c: 4, prompt: 'Look in Tack Room', handler: 'tack-room' });
    list.push({ id: 'feed-room', r: roomStart + 3, c: 9, prompt: 'Enter Feed Room', handler: 'feed-room' });

    // Bucket pile (if any filled buckets waiting)
    if (YardState.bucketPile.length > 0) {
        list.push({ id: 'bucket-pile', r: roomStart + 2, c: 8, prompt: 'Pick Up Feed Bucket', handler: 'bucket-pile' });
    }

    // Stall interactables INSIDE each stall (not at the door)
    for (let s = 0; s < stallsPerSide; s++) {
        const baseRow = 1 + s * 3;
        const leftIdx = s;
        const rightIdx = s + stallsPerSide;
        const leftHorse = leftIdx < horses.length ? horses[leftIdx] : null;
        list.push({
            id: `stall-L${s}`, r: baseRow, c: 2,
            prompt: leftHorse ? leftHorse.name : 'Empty Stall',
            handler: 'stall', stallIdx: leftIdx
        });
        const rightHorse = rightIdx < horses.length ? horses[rightIdx] : null;
        list.push({
            id: `stall-R${s}`, r: baseRow, c: 11,
            prompt: rightHorse ? rightHorse.name : 'Empty Stall',
            handler: 'stall', stallIdx: rightIdx
        });
    }

    // Water Hose, Hay Store, Wheelbarrow in aisle near rooms
    list.push({ id: 'water-hose', r: roomStart + 1, c: 5, prompt: 'Water Hose', handler: 'water-hose' });
    list.push({ id: 'hay-store', r: roomStart + 1, c: 7, prompt: 'Hay Store', handler: 'hay-store' });
    list.push({ id: 'wheelbarrow', r: roomStart + 2, c: 5, prompt: 'Wheelbarrow', handler: 'wheelbarrow' });

    // Exit doors
    for (let c = 5; c <= 8; c++) {
        list.push({ id: `barn-exit-${c}`, r: lastRow, c, prompt: 'Exit the Barn', handler: 'exit-barn' });
    }

    // Expand barn (near exit, on aisle)
    if (GameState.maxStalls < 20) {
        list.push({ id: 'expand', r: lastRow - 1, c: 8, prompt: 'Expand Barn (\u00A3100,000)', handler: 'expand-barn' });
    }

    return list;
}

// --- Feed Room ---

function generateFeedRoomMap() {
    const R = FEEDROOM_ROWS, C = FEEDROOM_COLS;
    const map = Array.from({length: R}, () => new Array(C).fill(F_FLOOR));
    // Walls: top, bottom, left, right
    for (let c = 0; c < C; c++) { map[0][c] = F_WALL; map[R-1][c] = F_WALL; }
    for (let r = 0; r < R; r++) { map[r][0] = F_WALL; map[r][C-1] = F_WALL; }
    // Door at bottom center (row 10, cols 4-5)
    map[10][4] = F_DOOR;
    map[10][5] = F_DOOR;
    return map;
}

function getBucketPositions(count) {
    const positions = [];
    const cols = [2, 3, 4, 5, 6, 7];
    const rows = [7, 8];
    for (let i = 0; i < count && i < 12; i++) {
        const row = rows[Math.floor(i / cols.length)];
        const col = cols[i % cols.length];
        positions.push({ r: row, c: col });
    }
    return positions;
}

function generateFeedRoomInteractables() {
    const horses = GameState.horses;
    const list = [];

    // Scoop rack (top-left area)
    list.push({ id: 'scoop', r: 2, c: 1, prompt: 'Pick Up Scoop', handler: 'scoop-rack' });

    // 6 feed bags along right wall
    const bagPositions = [
        { r: 1, c: 7, key: 'linseed' },
        { r: 1, c: 8, key: 'sugarbeet' },
        { r: 2, c: 7, key: 'oats' },
        { r: 2, c: 8, key: 'barley' },
        { r: 3, c: 7, key: 'bran' },
        { r: 3, c: 8, key: 'chaff' },
    ];
    bagPositions.forEach(bp => {
        const ft = FEED_TYPES[bp.key];
        list.push({
            id: `bag-${bp.key}`, r: bp.r, c: bp.c,
            prompt: `${ft.label} (${ft.category})`,
            handler: 'feed-bag', feedTypeKey: bp.key
        });
    });

    // Buckets (one per non-yearling horse)
    const bucketPos = getBucketPositions(horses.length);
    for (let i = 0; i < horses.length; i++) {
        list.push({
            id: `bucket-${i}`, r: bucketPos[i].r, c: bucketPos[i].c,
            prompt: `${horses[i].name}'s Bucket`,
            handler: 'feed-bucket', bucketIdx: i
        });
    }

    // Exit door
    list.push({ id: 'feedroom-exit-1', r: 10, c: 4, prompt: 'Exit Feed Room', handler: 'exit-feedroom' });
    list.push({ id: 'feedroom-exit-2', r: 10, c: 5, prompt: 'Exit Feed Room', handler: 'exit-feedroom' });

    return list;
}

function buildFeedRoomContents() {
    const world = document.getElementById('yard-world');
    const horses = GameState.horses;

    // Room title
    const titleEl = document.createElement('div');
    titleEl.className = 'yard-building-label';
    titleEl.textContent = 'FEED ROOM';
    titleEl.style.left = (3.5 * TILE_SIZE) + 'px';
    titleEl.style.top = (0.15 * TILE_SIZE) + 'px';
    world.appendChild(titleEl);

    // EXIT label
    addBarnLabel(world, 'EXIT', 4.2, 10.5);

    // Scoop rack SVG
    const scoopEl = document.createElement('div');
    scoopEl.className = 'yard-decoration';
    scoopEl.id = 'feedroom-scoop';
    scoopEl.style.left = (1.1 * TILE_SIZE) + 'px';
    scoopEl.style.top = (1.3 * TILE_SIZE) + 'px';
    scoopEl.style.zIndex = 8;
    scoopEl.innerHTML = `<svg viewBox="0 0 36 36" width="28" height="28">
        <rect x="4" y="20" width="28" height="4" rx="1" fill="#8b7340" stroke="#5a4420" stroke-width="1"/>
        <rect x="6" y="10" width="8" height="14" rx="2" fill="#c0c0c0" stroke="#888" stroke-width="1"/>
        <rect x="10" y="4" width="3" height="8" rx="1" fill="#666"/>
        <text x="18" y="32" font-size="5" fill="#5a4420" font-weight="bold">SCOOP</text>
    </svg>`;
    world.appendChild(scoopEl);

    // 6 feed bag SVGs
    const bagPositions = [
        { r: 1, c: 7, key: 'linseed' },
        { r: 1, c: 8, key: 'sugarbeet' },
        { r: 2, c: 7, key: 'oats' },
        { r: 2, c: 8, key: 'barley' },
        { r: 3, c: 7, key: 'bran' },
        { r: 3, c: 8, key: 'chaff' },
    ];
    bagPositions.forEach(bp => {
        const ft = FEED_TYPES[bp.key];
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (bp.c * TILE_SIZE + 2) + 'px';
        el.style.top = (bp.r * TILE_SIZE + 2) + 'px';
        el.style.zIndex = 8;
        el.innerHTML = `<svg viewBox="0 0 32 38" width="22" height="26">
            <rect x="2" y="6" width="28" height="30" rx="3" fill="${ft.color}"/>
            <rect x="2" y="6" width="28" height="30" rx="3" fill="none" stroke="#5a4420" stroke-width="1.5"/>
            <path d="M6,6 Q16,1 26,6" fill="${ft.color}" stroke="#5a4420" stroke-width="1"/>
            <text x="16" y="20" text-anchor="middle" font-size="5" fill="#fff" font-weight="bold">${ft.label.toUpperCase()}</text>
            <text x="16" y="28" text-anchor="middle" font-size="4" fill="rgba(255,255,255,0.7)">${ft.category}</text>
        </svg>`;
        world.appendChild(el);
    });

    // Bucket SVGs
    const bucketPos = getBucketPositions(horses.length);
    for (let i = 0; i < horses.length; i++) {
        const bucket = FeedRoomState.buckets[i];
        const hasFeed = bucket && bucket.feeds.length > 0;
        const fillColor = hasFeed ? FEED_TYPES[bucket.feeds[bucket.feeds.length - 1]].color : '#888';
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.id = `feedroom-bucket-${i}`;
        el.style.left = (bucketPos[i].c * TILE_SIZE + 4) + 'px';
        el.style.top = (bucketPos[i].r * TILE_SIZE + 2) + 'px';
        el.style.zIndex = 8;
        const fillHeight = hasFeed ? bucket.feeds.length * 6 : 0;
        const fillY = 26 - fillHeight;
        el.innerHTML = `<svg viewBox="0 0 28 32" width="20" height="24">
            <path d="M4,8 L2,28 Q2,30 4,30 L24,30 Q26,30 26,28 L24,8 Z" fill="${fillColor}" stroke="#555" stroke-width="1.5"/>
            <rect x="3" y="6" width="22" height="4" rx="1" fill="#aaa" stroke="#777" stroke-width="1"/>
            <path d="M8,4 Q14,0 20,4" fill="none" stroke="#777" stroke-width="1.5"/>
            ${hasFeed ? `<rect class="bucket-fill" x="4" y="${fillY}" width="20" height="${fillHeight}" rx="1" fill="${fillColor}" opacity="0.8"/>
            <text class="bucket-count" x="14" y="22" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">${bucket.feeds.length}</text>` : ''}
        </svg>
        <div style="font-size:5px;text-align:center;color:#444;margin-top:-2px;white-space:nowrap;overflow:hidden;max-width:${TILE_SIZE}px">${horses[i].name.split(' ')[0]}</div>`;
        world.appendChild(el);
    }
}

// --- Rendering ---

function getCurrentMap() {
    if (YardState.currentZone === 'feedroom') return FeedRoomState.map;
    if (YardState.currentZone === 'stall') return YardState.stallMap;
    if (YardState.currentZone === 'racecourse') return YardState._racecourseMap;
    return YardState.currentZone === 'outdoor' ? YardState.outdoorMap : YardState.barnMap;
}

function buildZoneMap() {
    const world = document.getElementById('yard-world');
    const map = getCurrentMap();
    if (!map) return;
    const rows = map.length;
    const cols = map[0].length;
    const isOutdoor = YardState.currentZone === 'outdoor';
    const names = isOutdoor ? TILE_CSS
        : YardState.currentZone === 'feedroom' ? FEEDROOM_CSS
        : YardState.currentZone === 'stall' ? STALL_CSS
        : YardState.currentZone === 'racecourse' ? RC_CSS
        : BARN_CSS;

    world.style.width = (cols * TILE_SIZE) + 'px';
    world.style.height = (rows * TILE_SIZE) + 'px';

    let html = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = map[r][c];
            if (isOutdoor && t === T_BLDG) continue;
            let css = names[t] || 'grass';
            // Apply centre-specific fence style
            if (isOutdoor && t === T_FENCE) {
                const fenceStyle = getActiveCentre().visualFeatures?.fenceStyle;
                if (fenceStyle) css += ` fence-${fenceStyle}`;
            }
            html += `<div class="yard-tile ${css}" style="left:${c * TILE_SIZE}px;top:${r * TILE_SIZE}px"></div>`;
        }
    }
    world.innerHTML = html;
}

function buildOutdoorBuildings() {
    const world = document.getElementById('yard-world');
    getOutdoorBldgs().forEach(b => {
        const el = document.createElement('div');
        const buildingTint = getActiveCentre().visualFeatures?.buildingTint || '';
        el.className = `yard-building-2d ${b.css} ${buildingTint}`;
        el.style.left = (b.c * TILE_SIZE) + 'px';
        el.style.top = (b.r * TILE_SIZE) + 'px';
        el.style.width = (b.w * TILE_SIZE) + 'px';
        el.style.height = (b.h * TILE_SIZE) + 'px';
        world.appendChild(el);

        const label = document.createElement('div');
        label.className = 'yard-building-label';
        label.textContent = b.label;
        label.style.left = ((b.c + b.w / 2) * TILE_SIZE) + 'px';
        label.style.top = ((b.r + b.h / 2) * TILE_SIZE) + 'px';
        label.style.transform = 'translate(-50%, -50%)';
        world.appendChild(label);
    });
}

// ============================================
// CENTRE-SPECIFIC VISUAL HELPERS
// ============================================

function getTreeSVG(style) {
    const s = 0.8 + Math.random() * 0.3;
    const w = Math.round(32 * s);
    const h = Math.round(48 * s);

    if (style === 'windswept') {
        // Newmarket: bent by wind, sparse
        return `<svg viewBox="0 0 40 60" width="${w}" height="${h}">
            <rect x="15" y="35" width="5" height="25" rx="2" fill="#7a5030"/>
            <path d="M5,38 Q8,26 14,20 Q18,12 22,8 Q28,4 34,6 Q38,10 36,18 Q34,26 38,34 Q28,40 18,40 Q10,40 5,38 Z" fill="#3a7a28"/>
            <path d="M10,36 Q14,24 20,16 Q26,10 32,12 Q36,16 34,24 Q30,36 20,38 Q14,38 10,36 Z" fill="#4a8a34" opacity="0.6"/>
        </svg>`;
    } else if (style === 'lush') {
        // Lambourn: full, dense canopy
        return `<svg viewBox="0 0 44 60" width="${Math.round(36*s)}" height="${h}">
            <rect x="18" y="36" width="7" height="24" rx="3" fill="#5a3a1a"/>
            <ellipse cx="22" cy="24" rx="18" ry="20" fill="#2a6a1e"/>
            <ellipse cx="22" cy="22" rx="15" ry="17" fill="#3a7a28" opacity="0.7"/>
            <ellipse cx="18" cy="18" rx="8" ry="10" fill="#4a8a34" opacity="0.5"/>
        </svg>`;
    } else if (style === 'sparse-moor') {
        // Middleham: short, twisted, windswept moorland
        return `<svg viewBox="0 0 36 50" width="${Math.round(28*s)}" height="${Math.round(38*s)}">
            <path d="M16,28 Q14,35 15,45 Q16,48 18,48 Q20,48 19,45 Q21,35 18,28" fill="#6a4a2a"/>
            <path d="M4,30 Q8,20 12,18 Q16,14 18,10 Q20,14 24,18 Q28,22 32,28 Q26,34 18,34 Q10,34 4,30 Z" fill="#4a7a30"/>
            <path d="M8,28 Q12,20 18,16 Q24,20 28,28 Q22,32 18,32 Q12,32 8,28 Z" fill="#5a8a3a" opacity="0.6"/>
        </svg>`;
    } else if (style === 'oak') {
        // Malton: large, mature, wide-spreading
        return `<svg viewBox="0 0 50 60" width="${Math.round(40*s)}" height="${h}">
            <rect x="21" y="34" width="8" height="26" rx="3" fill="#5a3818"/>
            <path d="M4,36 Q6,22 12,16 Q16,10 20,6 Q25,3 30,6 Q34,10 38,16 Q44,22 46,36 Q36,42 25,42 Q14,42 4,36 Z" fill="#3a6a22"/>
            <path d="M8,34 Q12,20 18,14 Q24,8 32,14 Q38,20 42,34 Q34,38 25,38 Q16,38 8,34 Z" fill="#4a7a2e" opacity="0.6"/>
            <path d="M14,30 Q20,16 30,16 Q36,20 38,30" fill="#5a8a3a" opacity="0.3"/>
        </svg>`;
    } else {
        // mixed-hill (Epsom): angled on hillside
        const lean = Math.random() > 0.5 ? 2 : -2;
        return `<svg viewBox="0 0 40 60" width="${w}" height="${h}">
            <rect x="${17+lean}" y="35" width="6" height="25" rx="2" fill="#6b4226" transform="rotate(${lean*2}, 20, 48)"/>
            <path d="M${3+lean},36 Q${6+lean},28 ${10+lean},22 Q${14+lean},14 ${18+lean},8 Q${22+lean},4 ${26+lean},8 Q${30+lean},14 ${34+lean},22 Q${38+lean},28 ${39+lean},36 Q${30+lean},40 ${20+lean},40 Q${10+lean},40 ${3+lean},36 Z" fill="#3a7a28"/>
        </svg>`;
    }
}

function getLandmarkSVG(type) {
    switch (type) {
        case 'clock-tower':
            return `<svg viewBox="0 0 32 64" width="32" height="64">
                <rect x="10" y="20" width="12" height="44" fill="#8b4422" stroke="#6b3418" stroke-width="1"/>
                <rect x="8" y="18" width="16" height="4" fill="#9a5a32"/>
                <polygon points="16,2 6,18 26,18" fill="#6b3418"/>
                <circle cx="16" cy="30" r="5" fill="#f0e8d0" stroke="#8b4422" stroke-width="1"/>
                <line x1="16" y1="26" x2="16" y2="30" stroke="#333" stroke-width="0.8"/>
                <line x1="16" y1="30" x2="19" y2="31" stroke="#333" stroke-width="0.6"/>
            </svg>`;
        case 'castle':
            return `<svg viewBox="0 0 64 56" width="64" height="56">
                <rect x="8" y="20" width="48" height="36" fill="#8a8070" stroke="#6a6050" stroke-width="1"/>
                <rect x="4" y="16" width="12" height="40" fill="#9a9080" stroke="#6a6050" stroke-width="1"/>
                <rect x="48" y="16" width="12" height="40" fill="#9a9080" stroke="#6a6050" stroke-width="1"/>
                <rect x="4" y="12" width="3" height="6" fill="#7a7060"/>
                <rect x="9" y="12" width="3" height="6" fill="#7a7060"/>
                <rect x="48" y="12" width="3" height="6" fill="#7a7060"/>
                <rect x="53" y="12" width="3" height="6" fill="#7a7060"/>
                <rect x="26" y="36" width="12" height="20" rx="6" fill="#5a5040"/>
                <rect x="18" y="26" width="6" height="8" fill="#4a5a6a" opacity="0.5"/>
                <rect x="40" y="26" width="6" height="8" fill="#4a5a6a" opacity="0.5"/>
            </svg>`;
        case 'cottage':
            return `<svg viewBox="0 0 48 44" width="40" height="36">
                <rect x="6" y="18" width="36" height="26" fill="#c8b896" stroke="#8a7a60" stroke-width="1"/>
                <polygon points="24,2 2,20 46,20" fill="#8a7840"/>
                <polygon points="24,4 4,20 44,20" fill="#a09050" opacity="0.6"/>
                <rect x="18" y="30" width="12" height="14" rx="1" fill="#6b4226"/>
                <rect x="10" y="24" width="6" height="6" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.5"/>
                <rect x="32" y="24" width="6" height="6" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.5"/>
            </svg>`;
        case 'spire':
            return `<svg viewBox="0 0 28 64" width="24" height="56">
                <rect x="8" y="24" width="12" height="40" fill="#9a8a7a" stroke="#7a6a5a" stroke-width="1"/>
                <polygon points="14,2 6,24 22,24" fill="#7a6a5a"/>
                <rect x="10" y="32" width="3" height="5" fill="#4a5a6a" opacity="0.5"/>
                <rect x="15" y="32" width="3" height="5" fill="#4a5a6a" opacity="0.5"/>
                <rect x="11" y="48" width="6" height="10" rx="3" fill="#5a4a3a"/>
            </svg>`;
        default: return '';
    }
}

function getExtraDecoSVG(type) {
    switch (type) {
        case 'heather':
            return `<svg viewBox="0 0 24 16" width="20" height="12">
                <ellipse cx="12" cy="10" rx="10" ry="5" fill="#7a5a7a" opacity="0.7"/>
                <ellipse cx="8" cy="8" rx="4" ry="3" fill="#9a6a9a" opacity="0.6"/>
                <ellipse cx="16" cy="9" rx="5" ry="3" fill="#8a5a8a" opacity="0.5"/>
            </svg>`;
        case 'wildflower':
            return `<svg viewBox="0 0 20 14" width="16" height="10">
                <circle cx="4" cy="6" r="2" fill="#e8e040" opacity="0.7"/>
                <circle cx="10" cy="4" r="2" fill="#e06090" opacity="0.6"/>
                <circle cx="16" cy="8" r="2" fill="#9070d0" opacity="0.6"/>
                <circle cx="8" cy="10" r="1.5" fill="#e08040" opacity="0.5"/>
            </svg>`;
        case 'haybale':
            return `<svg viewBox="0 0 28 20" width="24" height="16">
                <ellipse cx="14" cy="12" rx="12" ry="7" fill="#c4a840" stroke="#8a7820" stroke-width="1"/>
                <line x1="4" y1="12" x2="24" y2="12" stroke="#8a7820" stroke-width="0.8"/>
                <line x1="14" y1="5" x2="14" y2="19" stroke="#8a7820" stroke-width="0.6"/>
            </svg>`;
        case 'rock':
            return `<svg viewBox="0 0 22 14" width="18" height="10">
                <path d="M2,12 Q4,6 8,4 Q12,2 16,4 Q20,6 20,12 Z" fill="#8a8a8a" stroke="#6a6a6a" stroke-width="0.5"/>
                <path d="M4,10 Q6,6 10,5 Q14,4 18,6" fill="#9a9a9a" opacity="0.4"/>
            </svg>`;
        case 'skyline':
            return `<svg viewBox="0 0 120 24" width="120" height="24">
                <rect x="10" y="8" width="8" height="16" fill="#888" opacity="0.2"/>
                <rect x="22" y="4" width="6" height="20" fill="#888" opacity="0.15"/>
                <rect x="32" y="10" width="10" height="14" fill="#888" opacity="0.2"/>
                <rect x="48" y="6" width="5" height="18" fill="#888" opacity="0.15"/>
                <rect x="58" y="12" width="12" height="12" fill="#888" opacity="0.18"/>
                <rect x="76" y="8" width="7" height="16" fill="#888" opacity="0.15"/>
                <rect x="88" y="14" width="10" height="10" fill="#888" opacity="0.12"/>
            </svg>`;
        default: return '';
    }
}

function buildOutdoorDecorations() {
    const world = document.getElementById('yard-world');
    const centre = getActiveCentre();
    const treePositions = centre.trees || [];

    // Apply visual theme via CSS variables
    const yardEl = document.getElementById('yard');
    if (yardEl && centre.theme) {
        yardEl.style.setProperty('--centre-grass', centre.theme.grass);
        yardEl.style.setProperty('--centre-path', centre.theme.path);
        yardEl.style.setProperty('--centre-accent', centre.theme.accent);
    }

    const treeStyle = centre.visualFeatures?.treeStyle || 'windswept';
    treePositions.forEach(t => {
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (t.c * TILE_SIZE) + 'px';
        el.style.top = (t.r * TILE_SIZE - 30) + 'px';
        el.style.zIndex = 3;
        el.innerHTML = getTreeSVG(treeStyle);
        world.appendChild(el);
    });

    // Centre-specific visual features
    const vf = centre.visualFeatures;
    if (vf) {
        // Terrain patches (overlay divs on grass areas)
        if (vf.terrainPatches) {
            vf.terrainPatches.forEach(patch => {
                for (let r = patch.r1; r <= patch.r2; r++) {
                    for (let c = patch.c1; c <= Math.min(patch.c2, OUTDOOR_COLS - 1); c++) {
                        const el = document.createElement('div');
                        el.className = `yard-tile terrain-patch terrain-${patch.type}`;
                        el.style.left = (c * TILE_SIZE) + 'px';
                        el.style.top = (r * TILE_SIZE) + 'px';
                        el.style.zIndex = 1;
                        el.style.pointerEvents = 'none';
                        world.appendChild(el);
                    }
                }
            });
        }

        // Landmarks
        if (vf.landmarks) {
            vf.landmarks.forEach(lm => {
                const el = document.createElement('div');
                el.className = 'yard-decoration landmark';
                el.style.left = (lm.c * TILE_SIZE) + 'px';
                el.style.top = (lm.r * TILE_SIZE - 20) + 'px';
                el.style.zIndex = 4;
                el.innerHTML = getLandmarkSVG(lm.type);
                world.appendChild(el);
            });
        }

        // Extra decorations (heather, wildflowers, hay bales, rocks, skyline)
        if (vf.extraDecos) {
            vf.extraDecos.forEach(deco => {
                const el = document.createElement('div');
                el.className = 'yard-decoration extra-deco';
                el.style.left = (deco.c * TILE_SIZE) + 'px';
                el.style.top = (deco.r * TILE_SIZE) + 'px';
                el.style.zIndex = 3;
                el.innerHTML = getExtraDecoSVG(deco.type);
                world.appendChild(el);
            });
        }
    }

    // Horses in paddock: all turned-out horses
    const paddockArea = centre.paddock || { r1: 20, c1: 3, r2: 23, c2: 10 };
    const paddockHorses = GameState.horses.filter(h => h.paddockTurnedOut);
    paddockHorses.forEach((h, i) => {
        const paddockW = paddockArea.c2 - paddockArea.c1;
        const col = paddockArea.c1 + (i % paddockW);
        const row = paddockArea.r1 + Math.floor(i / paddockW);
        const isAdult = !h.isYearling;
        const svgW = isAdult ? 36 : 28;
        const svgH = isAdult ? 24 : 18;
        const bodyColor = h.silkPrimary || '#8b6a4a';
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (col * TILE_SIZE) + 'px';
        el.style.top = (row * TILE_SIZE - 6) + 'px';
        el.style.zIndex = 4;
        el.innerHTML = `<svg viewBox="0 0 60 40" width="${svgW}" height="${svgH}">
            <path d="M12,20 Q9,17 9,13 Q9,9 14,9 L30,8 Q34,9 38,12 Q40,14 42,18 L44,22 Q48,24 50,28 L48,29 Q44,26 40,24 Q32,20 16,24 Z" fill="${bodyColor}"/>
            ${isAdult ? `<path d="M14,9 L30,8 Q34,9 38,12" fill="${h.silkSecondary || '#c9a227'}" opacity="0.5"/>` : ''}
            <path d="M34,10 Q32,8 31,11 Q29,9 28,12" stroke="#6b4a2a" stroke-width="1" fill="none" stroke-linecap="round"/>
            <path d="M12,20 Q8,18 6,20 Q4,23 7,25" stroke="#6b4a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
            <line x1="34" y1="22" x2="35" y2="30" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
            <line x1="30" y1="22" x2="31" y2="30" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="23" x2="19" y2="30" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="23" x2="15" y2="30" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="46" cy="25" r="0.7" fill="#222"/>
        </svg>`;
        world.appendChild(el);
    });

    // Parked lorry (if owned)
    if (GameState.ownsLorry) {
        const lorryPos = centre.lorryPos || { r: 17, c: 22 };
        const lorryEl = document.createElement('div');
        lorryEl.id = 'yard-parked-lorry';
        lorryEl.className = 'yard-decoration';
        lorryEl.style.left = (lorryPos.c * TILE_SIZE) + 'px';
        lorryEl.style.top = (lorryPos.r * TILE_SIZE - 8) + 'px';
        lorryEl.style.zIndex = 6;
        lorryEl.innerHTML = `<svg viewBox="0 0 64 48" width="64" height="48">
            <rect x="1" y="8" width="40" height="28" rx="3" fill="#4a8a3a" stroke="#2e6a24" stroke-width="1.5"/>
            <rect x="4" y="11" width="34" height="22" rx="1" fill="#5a9a4a"/>
            <path d="M14,16 Q17,13 20,16 L20,24 Q17,27 14,24 Z" fill="#3a7a2a" opacity="0.6"/>
            <rect x="41" y="14" width="20" height="22" rx="3" fill="#3a7a2a" stroke="#2e6a24" stroke-width="1.5"/>
            <rect x="46" y="17" width="11" height="8" rx="1" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.8"/>
            <circle cx="14" cy="39" r="4" fill="#333" stroke="#555" stroke-width="1"/>
            <circle cx="32" cy="39" r="4" fill="#333" stroke="#555" stroke-width="1"/>
            <circle cx="54" cy="39" r="4" fill="#333" stroke="#555" stroke-width="1"/>
        </svg>`;
        world.appendChild(lorryEl);
    }

    // Parked car (if owned) near trainer's house
    if (GameState.ownsCar) {
        const trainerBldg = centre.buildings.find(b => b.id === 'trainer-house');
        if (trainerBldg) {
            const carR = trainerBldg.r + trainerBldg.h;
            const carC = trainerBldg.c + trainerBldg.w - 2;
            const carEl = document.createElement('div');
            carEl.id = 'yard-parked-car';
            carEl.className = 'yard-decoration';
            carEl.style.left = (carC * TILE_SIZE) + 'px';
            carEl.style.top = (carR * TILE_SIZE - 4) + 'px';
            carEl.style.zIndex = 6;
            carEl.innerHTML = `<svg viewBox="0 0 48 28" width="40" height="24">
                <rect x="4" y="12" width="40" height="14" rx="3" fill="#3a5a8a" stroke="#2a4a7a" stroke-width="1"/>
                <path d="M12,12 Q14,4 22,4 L32,4 Q38,4 40,12" fill="#4a6a9a" stroke="#2a4a7a" stroke-width="1"/>
                <rect x="16" y="5" width="8" height="6" rx="1" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.5"/>
                <rect x="26" y="5" width="8" height="6" rx="1" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.5"/>
                <circle cx="12" cy="26" r="3.5" fill="#333" stroke="#555" stroke-width="1"/>
                <circle cx="36" cy="26" r="3.5" fill="#333" stroke="#555" stroke-width="1"/>
                <rect x="2" y="16" width="4" height="2" rx="1" fill="#ffcc00"/>
                <rect x="42" y="16" width="4" height="2" rx="1" fill="#ff3333"/>
            </svg>`;
            world.appendChild(carEl);
        }
    }

    // Render pets and pests
    renderPetsInYard(world);
    renderPestsInYard(world);

    // Weather overlay based on next raceday ground conditions
    let existingWeather = document.getElementById('weather-overlay');
    if (existingWeather) existingWeather.remove();
    const currentRaceday = GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null;
    if (currentRaceday && currentRaceday.races && currentRaceday.races.length > 0) {
        const ground = currentRaceday.races[0].ground || 'Good';
        const weatherEl = document.createElement('div');
        weatherEl.id = 'weather-overlay';
        weatherEl.className = 'weather-overlay';
        if (ground === 'Soft' || ground === 'Good to Soft') {
            weatherEl.classList.add('weather-rain');
        } else if (ground === 'Good to Firm' || ground === 'Firm') {
            weatherEl.classList.add('weather-sun');
        }
        world.appendChild(weatherEl);
    }
}

function buildBarnContents() {
    const world = document.getElementById('yard-world');
    const horses = GameState.horses;
    const stallsPerSide = Math.floor(GameState.maxStalls / 2);
    const roomStart = stallsPerSide * 3 + 1;
    const lastRow = roomStart + 4;

    for (let s = 0; s < stallsPerSide; s++) {
        const baseRow = 1 + s * 3;
        const leftIdx = s;
        const leadingIdx = YardState.leadingHorse ? YardState.leadingHorse.horseIdx : -1;
        if (leftIdx < horses.length && !horses[leftIdx].paddockTurnedOut && leftIdx !== leadingIdx) placeHorseInBarnStall(world, horses[leftIdx], baseRow, 1);
        const rightIdx = s + stallsPerSide;
        if (rightIdx < horses.length && !horses[rightIdx].paddockTurnedOut && rightIdx !== leadingIdx) placeHorseInBarnStall(world, horses[rightIdx], baseRow, 10);
    }

    addBarnLabel(world, 'Tack Room', 2, roomStart + 1);
    addBarnLabel(world, 'Feed Room', 11, roomStart + 1);

    addBarnLabel(world, 'EXIT', 6.2, lastRow - 0.5);

    // Feed Room decorations — feed sacks
    const feedSacks = [
        { r: roomStart + 0.3, c: 10.3 },
        { r: roomStart + 1.5, c: 11.5 },
        { r: roomStart + 2.5, c: 10.8 }
    ];
    feedSacks.forEach(pos => {
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (pos.c * TILE_SIZE) + 'px';
        el.style.top = (pos.r * TILE_SIZE) + 'px';
        el.style.zIndex = 8;
        el.innerHTML = `<svg viewBox="0 0 30 36" width="20" height="24">
            <rect x="3" y="6" width="24" height="28" rx="3" fill="#c4a265"/>
            <rect x="3" y="6" width="24" height="28" rx="3" fill="none" stroke="#8b7340" stroke-width="1.5"/>
            <line x1="7" y1="6" x2="7" y2="34" stroke="#8b7340" stroke-width="0.8" opacity="0.5"/>
            <line x1="23" y1="6" x2="23" y2="34" stroke="#8b7340" stroke-width="0.8" opacity="0.5"/>
            <path d="M8,6 Q15,2 22,6" fill="#c4a265" stroke="#8b7340" stroke-width="1"/>
            <text x="15" y="22" text-anchor="middle" font-size="6" fill="#5a4420" font-weight="bold">FEED</text>
        </svg>`;
        world.appendChild(el);
    });

    // Tack Room decorations — saddle on rack and bridle hook
    const saddleEl = document.createElement('div');
    saddleEl.className = 'yard-decoration';
    saddleEl.style.left = (1.3 * TILE_SIZE) + 'px';
    saddleEl.style.top = ((roomStart + 0.4) * TILE_SIZE) + 'px';
    saddleEl.style.zIndex = 8;
    saddleEl.innerHTML = `<svg viewBox="0 0 40 36" width="26" height="23">
        <rect x="10" y="28" width="20" height="6" rx="1" fill="#6b4226"/>
        <rect x="8" y="26" width="24" height="4" rx="1" fill="#8b5a2e"/>
        <path d="M12,26 Q20,10 28,26" fill="#5a3018" stroke="#3e2010" stroke-width="1"/>
        <path d="M14,24 Q20,14 26,24" fill="#6b3a1f" stroke="#3e2010" stroke-width="0.8"/>
        <rect x="18" y="16" width="4" height="6" rx="1" fill="#8b5a2e"/>
    </svg>`;
    world.appendChild(saddleEl);

    const bridleEl = document.createElement('div');
    bridleEl.className = 'yard-decoration';
    bridleEl.style.left = (2.5 * TILE_SIZE) + 'px';
    bridleEl.style.top = ((roomStart + 2) * TILE_SIZE) + 'px';
    bridleEl.style.zIndex = 8;
    bridleEl.innerHTML = `<svg viewBox="0 0 30 40" width="18" height="24">
        <circle cx="15" cy="6" r="4" fill="#555" stroke="#333" stroke-width="1.5"/>
        <path d="M15,10 L15,18 Q10,22 8,28 Q6,34 10,36" fill="none" stroke="#5a3018" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M15,18 Q20,22 22,28 Q24,34 20,36" fill="none" stroke="#5a3018" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="10" cy="36" r="2" fill="#888" stroke="#555" stroke-width="1"/>
        <circle cx="20" cy="36" r="2" fill="#888" stroke="#555" stroke-width="1"/>
    </svg>`;
    world.appendChild(bridleEl);

    // Bucket pile near feed room door
    if (YardState.bucketPile.length > 0) {
        const pileEl = document.createElement('div');
        pileEl.className = 'yard-decoration';
        pileEl.style.left = (8 * TILE_SIZE) + 'px';
        pileEl.style.top = ((roomStart + 1.8) * TILE_SIZE) + 'px';
        pileEl.style.zIndex = 8;
        const count = YardState.bucketPile.length;
        pileEl.innerHTML = `<svg viewBox="0 0 32 36" width="24" height="28">
            <path d="M4,10 L2,30 Q2,32 4,32 L28,32 Q30,32 30,30 L28,10 Z" fill="#8B7340" stroke="#555" stroke-width="1.5"/>
            <rect x="3" y="8" width="26" height="4" rx="1" fill="#aaa" stroke="#777" stroke-width="1"/>
            <path d="M8,6 Q16,2 24,6" fill="none" stroke="#777" stroke-width="1.5"/>
            <text x="16" y="24" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">${count}</text>
        </svg>
        <div style="font-size:6px;text-align:center;color:#444;margin-top:-2px">BUCKETS</div>`;
        world.appendChild(pileEl);
    }

    // Water hose decoration
    const hoseEl = document.createElement('div');
    hoseEl.className = 'yard-decoration';
    hoseEl.style.left = (5.1 * TILE_SIZE) + 'px';
    hoseEl.style.top = ((roomStart + 0.6) * TILE_SIZE) + 'px';
    hoseEl.style.zIndex = 8;
    hoseEl.innerHTML = `<svg viewBox="0 0 32 32" width="22" height="22">
        <circle cx="16" cy="14" r="8" fill="none" stroke="#4a90c0" stroke-width="3"/>
        <path d="M16,22 L16,28 L22,28" stroke="#4a90c0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="22" cy="28" r="2" fill="#888"/>
        <text x="16" y="8" text-anchor="middle" font-size="4" fill="#3a7aaa" font-weight="bold">HOSE</text>
    </svg>`;
    world.appendChild(hoseEl);

    // Hay store decoration
    const hayEl = document.createElement('div');
    hayEl.className = 'yard-decoration';
    hayEl.style.left = (7.1 * TILE_SIZE) + 'px';
    hayEl.style.top = ((roomStart + 0.6) * TILE_SIZE) + 'px';
    hayEl.style.zIndex = 8;
    hayEl.innerHTML = `<svg viewBox="0 0 32 32" width="22" height="22">
        <rect x="2" y="8" width="28" height="20" rx="2" fill="#c4a840" stroke="#8a7820" stroke-width="1.5"/>
        <line x1="2" y1="18" x2="30" y2="18" stroke="#8a7820" stroke-width="1"/>
        <line x1="16" y1="8" x2="16" y2="28" stroke="#8a7820" stroke-width="0.8"/>
        <text x="16" y="16" text-anchor="middle" font-size="5" fill="#5a4420" font-weight="bold">HAY</text>
    </svg>`;
    world.appendChild(hayEl);

    // Wheelbarrow decoration
    const wbEl = document.createElement('div');
    wbEl.className = 'yard-decoration';
    wbEl.style.left = (5.1 * TILE_SIZE) + 'px';
    wbEl.style.top = ((roomStart + 1.8) * TILE_SIZE) + 'px';
    wbEl.style.zIndex = 8;
    wbEl.innerHTML = `<svg viewBox="0 0 36 28" width="24" height="18">
        <path d="M6,10 L4,22 Q4,24 6,24 L26,24 Q28,24 28,22 L26,10 Z" fill="#6a6a6a" stroke="#444" stroke-width="1.5"/>
        <circle cx="30" cy="22" r="4" fill="#555" stroke="#333" stroke-width="1"/>
        <line x1="6" y1="10" x2="2" y2="4" stroke="#888" stroke-width="2" stroke-linecap="round"/>
        <line x1="26" y1="10" x2="2" y2="4" stroke="#888" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
    world.appendChild(wbEl);
}

function addBarnLabel(world, text, col, row) {
    const label = document.createElement('div');
    label.className = 'yard-building-label';
    label.textContent = text;
    label.style.left = (col * TILE_SIZE) + 'px';
    label.style.top = (row * TILE_SIZE + 8) + 'px';
    label.style.zIndex = 15;
    world.appendChild(label);
}

function createBarnStatusBoard() {
    let board = document.getElementById('barn-status-board');
    if (board) board.remove();
    board = document.createElement('div');
    board.id = 'barn-status-board';
    board.className = 'barn-status-board';
    document.getElementById('yard').appendChild(board);
    updateBarnStatusBoard();
}

function removeBarnStatusBoard() {
    const board = document.getElementById('barn-status-board');
    if (board) board.remove();
}

function updateBarnStatusBoard() {
    const board = document.getElementById('barn-status-board');
    if (!board) return;

    const horses = GameState.horses;
    if (horses.length === 0) {
        board.innerHTML = '<h4>Stable Board</h4><p style="color:#888;font-size:10px;">No horses</p>';
        return;
    }

    let html = '<h4>Stable Board</h4>';
    horses.forEach((horse, idx) => {
        if (horse.paddockTurnedOut) return;
        const care = horse.stallCare || { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
        const tack = horse.tackedUp || { saddle: false, bridle: false };

        function statClass(val, low, med) { return val <= low ? 'stat-danger' : val <= med ? 'stat-warn' : 'stat-ok'; }
        function manureClass(piles) { return piles >= 3 ? 'stat-danger' : piles >= 1 ? 'stat-warn' : 'stat-ok'; }

        const feedCls = statClass(care.feedLevel, 25, 60);
        const waterCls = statClass(care.waterLevel, 25, 60);
        const hayCls = statClass(care.hayLevel, 25, 60);
        const manureCls = manureClass(care.manurePiles);
        const saddleCls = tack.saddle ? 'stat-ok' : 'stat-warn';
        const bridleCls = tack.bridle ? 'stat-ok' : 'stat-warn';

        html += `<div class="barn-horse-row">
            <span class="barn-horse-name" title="${horse.name}">${horse.name}</span>
            <span class="barn-stat-icons">
                <span class="barn-stat-icon ${feedCls}" title="Feed: ${care.feedLevel}%">🌾${care.feedLevel}</span>
                <span class="barn-stat-icon ${waterCls}" title="Water: ${care.waterLevel}%">💧${care.waterLevel}</span>
                <span class="barn-stat-icon ${hayCls}" title="Hay: ${care.hayLevel}%">🌿${care.hayLevel}</span>
                <span class="barn-stat-icon ${manureCls}" title="Manure: ${care.manurePiles} piles">💩${care.manurePiles}</span>
                <span class="barn-stat-icon ${saddleCls}" title="Saddle: ${tack.saddle ? 'On' : 'Off'}">🪑${tack.saddle ? '✓' : '✗'}</span>
                <span class="barn-stat-icon ${bridleCls}" title="Bridle: ${tack.bridle ? 'On' : 'Off'}">🔗${tack.bridle ? '✓' : '✗'}</span>
            </span>
        </div>`;
    });

    board.innerHTML = html;
}

function placeHorseInBarnStall(world, horse, stallRow, stallCol) {
    const body = horse.silkPrimary || '#6b3a1f';
    const accent = horse.silkSecondary || '#5a2e16';
    const el = document.createElement('div');
    el.className = 'yard-decoration';
    el.style.left = ((stallCol + 0.5) * TILE_SIZE) + 'px';
    el.style.top = ((stallRow + 0.3) * TILE_SIZE) + 'px';
    el.style.zIndex = 8;
    el.innerHTML = `<svg viewBox="0 0 60 40" width="30" height="20">
        <path d="M12,22 Q9,18 9,14 Q9,10 14,10 L30,9 Q34,7 37,4 Q39,2 42,2 Q46,1.5 47,3 Q49,3.5 50,6 Q50.5,8 49,9 L44,14 Q42,17 40,21 L38,24 Q28,20 16,24 Z" fill="${body}"/>
        <path d="M36,5 Q34,3 33,6 Q31,4 30,7" stroke="${accent}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M12,22 Q8,20 6,22 Q4,25 7,27" stroke="${accent}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <line x1="34" y1="23" x2="35" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="30" y1="23" x2="31" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="20" y1="24" x2="19" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="16" y1="24" x2="15" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="47" cy="4.5" r="1" fill="#222"/>
    </svg>`;
    world.appendChild(el);

    const plate = document.createElement('div');
    plate.className = 'yard-stall-nameplate';
    plate.textContent = horse.name;
    plate.style.left = (stallCol * TILE_SIZE) + 'px';
    plate.style.top = ((stallRow - 0.4) * TILE_SIZE) + 'px';
    world.appendChild(plate);
}

// --- Movement & Camera ---

function isWalkable2D(r, c) {
    const map = getCurrentMap();
    if (!map || r < 0 || r >= map.length || c < 0 || c >= map[0].length) return false;
    const t = map[r][c];
    if (YardState.currentZone === 'feedroom') return FEEDROOM_WALK[t];
    if (YardState.currentZone === 'stall') return STALL_WALK[t];
    if (YardState.currentZone === 'racecourse') return RC_WALK[t];
    return YardState.currentZone === 'outdoor' ? TILE_WALK[t] : BARN_WALK[t];
}

function movePlayer2D(dr, dc) {
    if (YardState.panelOpen) closeYardPanel();
    const nr = YardState.playerR + dr;
    const nc = YardState.playerC + dc;
    if (!isWalkable2D(nr, nc)) return;

    YardState.playerR = nr;
    YardState.playerC = nc;

    // 2x speed when in car: take a second step if walkable
    if (YardState.inCar) {
        const nr2 = YardState.playerR + dr;
        const nc2 = YardState.playerC + dc;
        if (isWalkable2D(nr2, nc2)) {
            YardState.playerR = nr2;
            YardState.playerC = nc2;
        }
    }

    const player = document.getElementById('yard-player');
    player.classList.add('walking');
    clearTimeout(YardState.walkingTimeout);
    YardState.walkingTimeout = setTimeout(() => player.classList.remove('walking'), 300);

    updatePlayerPosition2D();
    updateCamera2D();
    checkInteractable2D();
}

function updatePlayerPosition2D() {
    const player = document.getElementById('yard-player');
    const viewport = document.querySelector('.yard-viewport');
    if (!viewport) return;
    // Player stays centered in the viewport; camera scrolls the world around them
    const halfW = YardState.lorryMode ? 24 : 12;
    const halfH = YardState.lorryMode ? 16 : 18;
    player.style.left = (viewport.clientWidth / 2 - halfW) + 'px';
    player.style.top = (viewport.clientHeight / 2 - halfH) + 'px';
    player.style.zIndex = 50;
    player.style.setProperty('--silk-primary', GameState.silkPrimary);
    player.style.setProperty('--silk-secondary', GameState.silkSecondary);
}

function updateCamera2D() {
    const viewport = document.querySelector('.yard-viewport');
    if (!viewport) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const px = YardState.playerC * TILE_SIZE + TILE_SIZE / 2;
    const py = YardState.playerR * TILE_SIZE + TILE_SIZE / 2;
    const tx = vw / 2 - px;
    const ty = vh / 2 - py;
    document.getElementById('yard-world').style.transform = `translate(${tx}px, ${ty}px)`;
}

function checkInteractable2D() {
    const prompt = document.getElementById('yard-interact-prompt');
    const pr = YardState.playerR;
    const pc = YardState.playerC;
    const interactables = YardState.currentZone === 'outdoor'
        ? getOutdoorInteract()
        : YardState.currentZone === 'racecourse'
            ? (YardState._racecourseInteractables || [])
        : YardState.currentZone === 'feedroom'
            ? FeedRoomState.interactables
            : YardState.currentZone === 'stall'
                ? YardState.stallInteractables
                : YardState.barnInteractables;

    // In lorry mode, only racecourse interaction points matter
    if (YardState.lorryMode) {
        const viewport = document.querySelector('.yard-viewport');
        prompt.style.left = (viewport.clientWidth / 2 - 40) + 'px';
        prompt.style.top = (viewport.clientHeight / 2 - 54) + 'px';
        prompt.style.zIndex = 60;
        const checks = [{r:pr,c:pc},{r:pr-1,c:pc},{r:pr+1,c:pc},{r:pr,c:pc-1},{r:pr,c:pc+1}];
        for (const pos of checks) {
            const ia = interactables.find(i => i.r === pos.r && i.c === pos.c);
            if (ia && ia.handler === 'racecourse') {
                document.getElementById('yard-prompt-text').textContent = 'Deliver to Racecourse';
                prompt.style.display = 'flex';
                YardState._currentInteractable = ia;
                return;
            }
        }
        document.getElementById('yard-prompt-text').textContent = 'Press E to stop';
        prompt.style.display = 'flex';
        YardState._currentInteractable = null;
        return;
    }

    const checks = [{r:pr,c:pc},{r:pr-1,c:pc},{r:pr+1,c:pc},{r:pr,c:pc-1},{r:pr,c:pc+1}];
    for (const pos of checks) {
        const ia = interactables.find(i => i.r === pos.r && i.c === pos.c);
        if (ia) {
            const viewport = document.querySelector('.yard-viewport');
            prompt.style.left = (viewport.clientWidth / 2 - 40) + 'px';
            prompt.style.top = (viewport.clientHeight / 2 - 54) + 'px';
            prompt.style.zIndex = 60;
            document.getElementById('yard-prompt-text').textContent = ia.prompt;
            prompt.style.display = 'flex';
            YardState._currentInteractable = ia;
            return;
        }
    }
    prompt.style.display = 'none';
    YardState._currentInteractable = null;
}

// --- Input ---

function onYardKeyDown(e) {
    if (!YardState.active) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    switch (e.key) {
        case 'w': case 'W': case 'ArrowUp':    e.preventDefault(); movePlayer2D(-1, 0); break;
        case 's': case 'S': case 'ArrowDown':  e.preventDefault(); movePlayer2D(1, 0); break;
        case ' ':
            e.preventDefault();
            // Spacebar in barn opens staff task menu
            if (YardState.currentZone === 'barn' && !YardState.panelOpen && GameState.staff.length > 0) {
                openStaffTaskMenu();
            }
            break;
        case 'a': case 'A': case 'ArrowLeft':   e.preventDefault(); movePlayer2D(0, -1); break;
        case 'd': case 'D': case 'ArrowRight':  e.preventDefault(); movePlayer2D(0, 1); break;
        case 'e': case 'E':
            e.preventDefault();
            if (YardState.panelOpen) closeYardPanel();
            else if (YardState.lorryMode) handleLorryExit();
            else interactYard();
            break;
        case 'Escape':
            e.preventDefault();
            if (YardState.panelOpen) closeYardPanel();
            break;
    }
}

// --- Interaction Dispatcher ---

function interactYard() {
    const ia = YardState._currentInteractable;
    if (!ia) return;

    // Block building entry while in car (except getting out of car)
    if (YardState.inCar && ia.handler !== 'car') {
        showYardPanel(`<h3>In Car</h3><p>Get out of the car first! (Press E near the car)</p>`);
        return;
    }

    switch (ia.handler) {
        case 'enter-barn':   enterBarn(); break;
        case 'exit-barn':    exitBarn(); break;
        case 'stall':
            if (YardState.carryingTack) handleStallTackInteract(ia);
            else if (YardState.carryingBucket) handleStallFeedInteract(ia);
            else if (YardState.leadingHorse && YardState.leadingHorse.returning) handleStallReturnHorse(ia);
            else handleStallInteract2D(ia);
            break;
        case 'tack-room':    handleTackRoomInteract(); break;
        case 'feed-room':    enterFeedRoom(); break;
        case 'tack-store':   handleTackStoreInteract(); break;
        case 'feed-mill':    handleFeedMillInteract(); break;
        case 'tattersalls':  handleTattersallsInteract(); break;
        case 'gallops':      leaveYardForScreen(); openGallops(); break;
        case 'racecourse':   enterRacecourse(); break;
        case 'rc-parade-ring': showYardPanel(`<h3>Parade Ring</h3><p>The entered horses are being shown in the parade ring.</p>`); break;
        case 'rc-owners-area': showYardPanel(`<h3>Owners & Trainers Area</h3><p>Mingle with owners and trainers before the racing starts.</p>`); break;
        case 'rc-grandstand': showYardPanel(`<h3>Grandstand</h3><p>Find a seat and watch the races from here.</p>`); break;
        case 'rc-racestart': leaveYardForScreen(); openRaces(); break;
        case 'rc-exit': exitRacecourse(); break;
        case 'expand-barn':  handleExpandBarn(); break;
        case 'forage':       handleForageInteract(); break;
        case 'supplier':     handleSupplierInteract(); break;
        case 'trainer-house': handleTrainerHouseInteract(); break;
        case 'vet':          handleVetInteract(); break;
        case 'stud-farm':    handleStudFarmInteract(); break;
        case 'paddock':
            if (YardState.leadingHorse && !YardState.leadingHorse.returning) handlePaddockDeliverHorse();
            else handlePaddockInteract();
            break;
        case 'mechanics':    handleMechanicsInteract(); break;
        case 'lorry':        handleLorryInteract(); break;
        case 'car':          handleCarInteract(); break;
        case 'racing-school': handleRacingSchoolInteract(); break;
        case 'scoop-rack':    handleScoopRackInteract(); break;
        case 'feed-bag':      handleFeedBagInteract(ia); break;
        case 'feed-bucket':   handleBucketInteract(ia); break;
        case 'exit-feedroom': handleFeedRoomDoorInteract(); break;
        case 'bucket-pile':   handleBucketPileInteract(); break;
        case 'water-hose':    handleWaterHoseInteract(); break;
        case 'hay-store':     handleHayStoreInteract(); break;
        case 'wheelbarrow':   handleWheelbarrowInteract(); break;
        case 'stall-feedpot':     handleStallFeedPotInteract(); break;
        case 'stall-waterbucket': handleStallWaterBucketInteract(); break;
        case 'stall-hayrack':     handleStallHayRackInteract(); break;
        case 'stall-manure':      handleStallManureInteract(); break;
        case 'exit-stall':        exitStall(); break;
    }
}

// --- Zone Transitions ---

// ============================================
// RACECOURSE INTERIOR ZONE
// ============================================

const RC_GRASS = 0, RC_FLOOR = 1, RC_WALL = 2, RC_TRACK = 3, RC_RAIL = 4, RC_DOOR = 5;
const RC_CSS = ['grass', 'rc-floor', 'rc-wall', 'rc-track', 'rc-rail', 'door'];
const RC_WALK = [true, true, false, false, false, true];

const RC_ROWS = 25, RC_COLS = 35;

function generateRacecourseMap() {
    const map = Array.from({ length: RC_ROWS }, () => new Array(RC_COLS).fill(RC_GRASS));
    const fill = (r1, c1, r2, c2, t) => {
        for (let r = Math.max(0, r1); r <= Math.min(RC_ROWS - 1, r2); r++)
            for (let c = Math.max(0, c1); c <= Math.min(RC_COLS - 1, c2); c++)
                map[r][c] = t;
    };

    // Walls border
    fill(0, 0, 0, RC_COLS - 1, RC_WALL);
    fill(RC_ROWS - 1, 0, RC_ROWS - 1, RC_COLS - 1, RC_WALL);
    for (let r = 0; r < RC_ROWS; r++) { map[r][0] = RC_WALL; map[r][RC_COLS - 1] = RC_WALL; }

    // Owners & Trainers Area (top-left)
    fill(1, 1, 5, 12, RC_FLOOR);
    fill(1, 1, 1, 12, RC_WALL); // back wall

    // Grandstand (top-right)
    fill(1, 20, 5, RC_COLS - 2, RC_FLOOR);
    fill(1, 20, 1, RC_COLS - 2, RC_WALL); // back wall
    fill(2, 22, 2, RC_COLS - 4, RC_WALL); // bench row 1
    fill(4, 22, 4, RC_COLS - 4, RC_WALL); // bench row 2

    // Parade Ring (center, open area)
    fill(7, 10, 12, 24, RC_FLOOR);
    fill(7, 10, 7, 24, RC_RAIL); // rail around parade ring
    fill(12, 10, 12, 24, RC_RAIL);
    for (let r = 7; r <= 12; r++) { map[r][10] = RC_RAIL; map[r][24] = RC_RAIL; }
    fill(8, 11, 11, 23, RC_FLOOR); // inside walkable

    // Track (bottom half, oval)
    fill(15, 3, 22, RC_COLS - 4, RC_TRACK);
    // Rail around track
    fill(14, 3, 14, RC_COLS - 4, RC_RAIL);
    fill(23, 3, 23, RC_COLS - 4, RC_RAIL);
    for (let r = 14; r <= 23; r++) { map[r][3] = RC_RAIL; map[r][RC_COLS - 4] = RC_RAIL; }

    // Walkable paths
    fill(6, 1, 6, RC_COLS - 2, RC_FLOOR); // main concourse
    fill(13, 1, 13, RC_COLS - 2, RC_FLOOR); // path between parade ring and track

    // Exit at bottom center
    map[RC_ROWS - 1][16] = RC_DOOR;
    map[RC_ROWS - 1][17] = RC_DOOR;
    map[RC_ROWS - 1][18] = RC_DOOR;

    return map;
}

function generateRacecourseInteractables() {
    const list = [];
    // Parade Ring
    list.push({ id: 'rc-parade', r: 9, c: 17, prompt: 'View Parade Ring', handler: 'rc-parade-ring' });
    // Owners & Trainers Area
    list.push({ id: 'rc-owners', r: 3, c: 6, prompt: 'Owners & Trainers Area', handler: 'rc-owners-area' });
    // Grandstand
    list.push({ id: 'rc-grand', r: 3, c: 26, prompt: 'View from Grandstand', handler: 'rc-grandstand' });
    // Start Race (from the concourse near track)
    list.push({ id: 'rc-start', r: 13, c: 17, prompt: 'Go to Races', handler: 'rc-racestart' });
    // Exit
    list.push({ id: 'rc-exit1', r: RC_ROWS - 1, c: 16, prompt: 'Exit Racecourse', handler: 'rc-exit' });
    list.push({ id: 'rc-exit2', r: RC_ROWS - 1, c: 17, prompt: 'Exit Racecourse', handler: 'rc-exit' });
    list.push({ id: 'rc-exit3', r: RC_ROWS - 1, c: 18, prompt: 'Exit Racecourse', handler: 'rc-exit' });
    return list;
}

function buildRacecourseContents() {
    const world = document.getElementById('yard-world');

    // Labels
    const addLabel = (text, col, row) => {
        const label = document.createElement('div');
        label.className = 'yard-building-label';
        label.textContent = text;
        label.style.left = (col * TILE_SIZE) + 'px';
        label.style.top = (row * TILE_SIZE + 8) + 'px';
        label.style.zIndex = 15;
        world.appendChild(label);
    };

    addLabel('OWNERS & TRAINERS', 3, 2.5);
    addLabel('GRANDSTAND', 24, 2.5);
    addLabel('PARADE RING', 14, 9);
    addLabel('TRACK', 15, 18);
    addLabel('EXIT', 16, RC_ROWS - 1.5);

    // Parade ring horses (show entered horses with silks)
    const currentRaceday = GameState.racedays ? GameState.racedays[GameState.currentRaceday] : null;
    if (currentRaceday) {
        const enteredRaces = currentRaceday.races.filter(r => r.playerEntered && !r.completed);
        const enteredHorseIds = new Set();
        enteredRaces.forEach(r => {
            if (r.selectedHorseIds) r.selectedHorseIds.forEach(id => enteredHorseIds.add(id));
        });

        let col = 12;
        enteredHorseIds.forEach(id => {
            const horse = GameState.horses.find(h => h.id === id);
            if (!horse || col > 22) return;

            const el = document.createElement('div');
            el.className = 'yard-decoration parade-ring-horse';
            el.style.left = (col * TILE_SIZE) + 'px';
            el.style.top = (9 * TILE_SIZE) + 'px';
            el.style.zIndex = 12;
            el.style.setProperty('--silk-primary', horse.silkPrimary || GameState.silkPrimary);
            el.style.setProperty('--silk-secondary', horse.silkSecondary || GameState.silkSecondary);
            el.innerHTML = `<div style="transform:scale(0.8);">${horseSpriteSVG()}</div>
                <div style="font-size:5px;text-align:center;color:#333;white-space:nowrap;">${horse.name}</div>`;
            world.appendChild(el);
            col += 3;
        });
    }
}

function enterRacecourse() {
    if (YardState.inCar) {
        showYardPanel(`<h3>Racecourse</h3><p>Get out of the car first!</p>`);
        return;
    }
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        YardState.currentZone = 'racecourse';
        YardState._racecourseMap = generateRacecourseMap();
        YardState._racecourseInteractables = generateRacecourseInteractables();
        YardState.playerR = RC_ROWS - 2;
        YardState.playerC = 17;
        buildZoneMap();
        buildRacecourseContents();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function exitRacecourse() {
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        YardState.currentZone = 'outdoor';
        const rcBldg = getOutdoorBldgs().find(b => b.id === 'racecourse');
        YardState.playerR = rcBldg ? rcBldg.r - 1 : 23;
        YardState.playerC = rcBldg ? rcBldg.c + Math.floor(rcBldg.w / 2) : 31;
        buildZoneMap();
        buildOutdoorBuildings();
        buildOutdoorDecorations();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function enterBarn() {
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        YardState.currentZone = 'barn';
        YardState.barnMap = generateBarnMap();
        YardState.barnInteractables = generateBarnInteractables();
        const lastRow = YardState.barnMap.length - 1;
        YardState.playerR = lastRow - 1;
        YardState.playerC = 6;
        buildZoneMap();
        buildBarnContents();
        createBarnStatusBoard();
        // Show staff key hint if staff employed
        const hint = document.getElementById('yard-controls-hint');
        if (hint && GameState.staff && GameState.staff.length > 0) {
            hint.textContent = 'WASD · E interact · SPACE staff';
        }
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function exitBarn() {
    removeBarnStatusBoard();
    // Reset controls hint
    const hint = document.getElementById('yard-controls-hint');
    if (hint) hint.textContent = 'WASD \u00B7 E interact';
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        YardState.currentZone = 'outdoor';
        const barnBldg = getOutdoorBldgs().find(b => b.id === 'barn');
        YardState.playerR = barnBldg ? barnBldg.r + barnBldg.h + 1 : 17;
        YardState.playerC = barnBldg ? barnBldg.c + Math.floor(barnBldg.w / 2) : 19;
        buildZoneMap();
        buildOutdoorBuildings();
        buildOutdoorDecorations();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function enterFeedRoom() {
    removeBarnStatusBoard();
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        FeedRoomState.hasScoop = false;
        FeedRoomState.scoopFeedType = null;
        const horses = GameState.horses;
        FeedRoomState.buckets = horses.map((h, i) => ({
            horseIdx: i, horseName: h.name, feeds: []
        }));
        YardState.currentZone = 'feedroom';
        FeedRoomState.map = generateFeedRoomMap();
        FeedRoomState.interactables = generateFeedRoomInteractables();
        YardState.playerR = 9;
        YardState.playerC = 4;
        buildZoneMap();
        buildFeedRoomContents();
        updateFeedRoomHUD();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function exitFeedRoom() {
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        // Transfer filled buckets to bucket pile
        const filled = FeedRoomState.buckets.filter(b => b.feeds.length > 0);
        filled.forEach(b => {
            YardState.bucketPile.push({
                horseIdx: b.horseIdx, horseName: b.horseName, feeds: [...b.feeds]
            });
        });
        YardState.currentZone = 'barn';
        YardState.barnMap = generateBarnMap();
        YardState.barnInteractables = generateBarnInteractables();
        const stallsPerSide = Math.floor(GameState.maxStalls / 2);
        const roomStart = stallsPerSide * 3 + 1;
        YardState.playerR = roomStart + 2;
        YardState.playerC = 9;
        buildZoneMap();
        buildBarnContents();
        createBarnStatusBoard();
        removeFeedRoomHUD();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

// --- Stall Interior Zone ---

const STALL_MANURE_POSITIONS = [[3,3],[4,5],[2,4],[5,4]];

function generateStallMap(horseIdx) {
    const horse = GameState.horses[horseIdx];
    const map = Array.from({length: STALL_ROWS}, () => new Array(STALL_COLS).fill(S_WALL));
    // Fill interior with bedding
    for (let r = 1; r < STALL_ROWS - 1; r++)
        for (let c = 1; c < STALL_COLS - 1; c++) map[r][c] = S_BEDDING;
    // Floor tiles near door
    map[6][3] = S_FLOOR; map[6][4] = S_FLOOR;
    // Door at bottom
    map[7][3] = S_DOOR; map[7][4] = S_DOOR;
    // Fixed furniture
    map[2][1] = S_FEEDPOT;
    map[5][1] = S_WATERBKT;
    map[2][6] = S_HAYRACK;
    // Manure piles based on horse care state
    if (horse && horse.stallCare) {
        const piles = Math.min(horse.stallCare.manurePiles, STALL_MANURE_POSITIONS.length);
        for (let i = 0; i < piles; i++) {
            const [mr, mc] = STALL_MANURE_POSITIONS[i];
            map[mr][mc] = S_MANURE;
        }
    }
    return map;
}

function generateStallInteractables(horseIdx) {
    const horse = GameState.horses[horseIdx];
    const list = [];
    list.push({ r: 2, c: 1, handler: 'stall-feedpot', prompt: 'Feed Pot' });
    list.push({ r: 5, c: 1, handler: 'stall-waterbucket', prompt: 'Water Bucket' });
    list.push({ r: 2, c: 6, handler: 'stall-hayrack', prompt: 'Hay Rack' });
    // Manure piles
    if (horse && horse.stallCare) {
        const piles = Math.min(horse.stallCare.manurePiles, STALL_MANURE_POSITIONS.length);
        for (let i = 0; i < piles; i++) {
            const [mr, mc] = STALL_MANURE_POSITIONS[i];
            list.push({ r: mr, c: mc, handler: 'stall-manure', prompt: 'Manure Pile' });
        }
    }
    // Exit doors
    list.push({ r: 7, c: 3, handler: 'exit-stall', prompt: 'Exit Stall' });
    list.push({ r: 7, c: 4, handler: 'exit-stall', prompt: 'Exit Stall' });
    return list;
}

function enterStall(horseIdx) {
    // Block entry if carrying barn-level items
    if (YardState.carryingTack || YardState.leadingHorse) {
        showYardPanel('<h3>Cannot Enter</h3><p>Put that down first before entering the stall.</p>');
        return;
    }
    removeBarnStatusBoard();
    closeYardPanel();
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        // Save barn position for return
        YardState.stallEntryR = YardState.playerR;
        YardState.stallEntryC = YardState.playerC;
        YardState.currentZone = 'stall';
        YardState.stallZoneHorseIdx = horseIdx;
        YardState.stallMap = generateStallMap(horseIdx);
        YardState.stallInteractables = generateStallInteractables(horseIdx);
        YardState.playerR = 6;
        YardState.playerC = 3;
        buildZoneMap();
        buildStallContents(horseIdx);
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function exitStall() {
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        // Drop stall-only items when leaving
        YardState.carryingWheelbarrow = false;
        YardState.currentZone = 'barn';
        YardState.stallZoneHorseIdx = null;
        YardState.stallMap = null;
        YardState.stallInteractables = [];
        YardState.playerR = YardState.stallEntryR || 6;
        YardState.playerC = YardState.stallEntryC || 6;
        YardState.barnMap = generateBarnMap();
        YardState.barnInteractables = generateBarnInteractables();
        buildZoneMap();
        buildBarnContents();
        createBarnStatusBoard();
        updateCarryingIndicator();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function buildStallContents(horseIdx) {
    const world = document.getElementById('yard-world');
    const horse = GameState.horses[horseIdx];
    if (!horse) return;
    const care = horse.stallCare || { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
    const body = horse.silkPrimary || '#6b3a1f';
    const accent = horse.silkSecondary || '#5a2e16';

    // Horse name label
    const nameEl = document.createElement('div');
    nameEl.className = 'yard-building-label';
    nameEl.textContent = horse.name;
    nameEl.style.left = (4 * TILE_SIZE) + 'px';
    nameEl.style.top = (0.2 * TILE_SIZE) + 'px';
    nameEl.style.transform = 'translateX(-50%)';
    nameEl.style.zIndex = '12';
    world.appendChild(nameEl);

    // Care levels HUD
    const hudEl = document.createElement('div');
    hudEl.className = 'yard-decoration';
    hudEl.style.left = (0.5 * TILE_SIZE) + 'px';
    hudEl.style.top = (0.1 * TILE_SIZE) + 'px';
    hudEl.style.zIndex = '15';
    hudEl.style.pointerEvents = 'none';
    const makeBar = (label, level) => {
        const color = level >= 60 ? '#4a4' : level >= 30 ? '#aa4' : '#a44';
        const filled = Math.round(level / 12.5);
        return `<span style="font-size:6px;color:#fff;display:flex;gap:2px;align-items:center;"><span>${label}</span><span style="background:#333;padding:0 1px;">${'\u2588'.repeat(filled)}${'\u2591'.repeat(8-filled)}</span><span>${level}%</span></span>`;
    };
    hudEl.innerHTML = `<div style="background:rgba(0,0,0,0.6);padding:2px 4px;border-radius:3px;display:flex;flex-direction:column;gap:1px;">
        ${makeBar('Feed', care.feedLevel)}
        ${makeBar('Water', care.waterLevel)}
        ${makeBar('Hay', care.hayLevel)}
        ${makeBar('Bed', care.beddingQuality)}
    </div>`;
    world.appendChild(hudEl);

    // Horse SVG centered in stall
    const horseEl = document.createElement('div');
    horseEl.className = 'yard-decoration';
    horseEl.style.left = (3 * TILE_SIZE) + 'px';
    horseEl.style.top = (3.2 * TILE_SIZE) + 'px';
    horseEl.style.zIndex = 8;
    horseEl.innerHTML = `<svg viewBox="0 0 60 40" width="48" height="32">
        <path d="M12,22 Q9,18 9,14 Q9,10 14,10 L30,9 Q34,7 37,4 Q39,2 42,2 Q46,1.5 47,3 Q49,3.5 50,6 Q50.5,8 49,9 L44,14 Q42,17 40,21 L38,24 Q28,20 16,24 Z" fill="${body}"/>
        <path d="M36,5 Q34,3 33,6 Q31,4 30,7" stroke="${accent}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M12,22 Q8,20 6,22 Q4,25 7,27" stroke="${accent}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <line x1="34" y1="23" x2="35" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="30" y1="23" x2="31" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="20" y1="24" x2="19" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="16" y1="24" x2="15" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="47" cy="4.5" r="1" fill="#222"/>
    </svg>`;
    world.appendChild(horseEl);

    // Feed Pot SVG at (2,1)
    const feedH = Math.round(care.feedLevel / 100 * 14);
    const feedEl = document.createElement('div');
    feedEl.className = 'yard-decoration';
    feedEl.style.left = (1.1 * TILE_SIZE) + 'px';
    feedEl.style.top = (2.1 * TILE_SIZE) + 'px';
    feedEl.style.zIndex = 8;
    feedEl.innerHTML = `<svg viewBox="0 0 28 22" width="24" height="18">
        <rect x="2" y="4" width="24" height="16" rx="2" fill="#6a4a20" stroke="#4a3010" stroke-width="1"/>
        <rect x="4" y="${20-feedH}" width="20" height="${feedH}" rx="1" fill="#c4a040" opacity="0.8"/>
    </svg>`;
    world.appendChild(feedEl);

    // Water Bucket SVG at (5,1)
    const waterH = Math.round(care.waterLevel / 100 * 14);
    const waterEl = document.createElement('div');
    waterEl.className = 'yard-decoration';
    waterEl.style.left = (1.1 * TILE_SIZE) + 'px';
    waterEl.style.top = (5.1 * TILE_SIZE) + 'px';
    waterEl.style.zIndex = 8;
    waterEl.innerHTML = `<svg viewBox="0 0 28 22" width="24" height="18">
        <path d="M4,4 L2,20 Q2,22 4,22 L24,22 Q26,22 26,20 L24,4 Z" fill="#3a6a90" stroke="#2a4a60" stroke-width="1"/>
        <rect x="4" y="${20-waterH}" width="20" height="${waterH}" rx="1" fill="#5ab0e0" opacity="0.7"/>
    </svg>`;
    world.appendChild(waterEl);

    // Hay Rack SVG at (2,6)
    const hayH = Math.round(care.hayLevel / 100 * 14);
    const hayEl = document.createElement('div');
    hayEl.className = 'yard-decoration';
    hayEl.style.left = (6.1 * TILE_SIZE) + 'px';
    hayEl.style.top = (2.1 * TILE_SIZE) + 'px';
    hayEl.style.zIndex = 8;
    hayEl.innerHTML = `<svg viewBox="0 0 28 22" width="24" height="18">
        <rect x="2" y="2" width="24" height="18" rx="2" fill="#5a7a30" stroke="#3a5a10" stroke-width="1"/>
        <rect x="4" y="${18-hayH}" width="20" height="${hayH}" rx="1" fill="#8aba50" opacity="0.8"/>
        <line x1="2" y1="10" x2="26" y2="10" stroke="#3a5a10" stroke-width="0.5"/>
    </svg>`;
    world.appendChild(hayEl);

    // Manure pile SVGs
    const piles = Math.min(care.manurePiles, STALL_MANURE_POSITIONS.length);
    for (let i = 0; i < piles; i++) {
        const [mr, mc] = STALL_MANURE_POSITIONS[i];
        const mEl = document.createElement('div');
        mEl.className = 'yard-decoration';
        mEl.style.left = ((mc + 0.2) * TILE_SIZE) + 'px';
        mEl.style.top = ((mr + 0.2) * TILE_SIZE) + 'px';
        mEl.style.zIndex = 8;
        mEl.innerHTML = `<svg viewBox="0 0 24 18" width="20" height="14">
            <ellipse cx="12" cy="14" rx="10" ry="4" fill="#5a4a20"/>
            <ellipse cx="12" cy="10" rx="7" ry="4" fill="#6a5a30"/>
            <ellipse cx="12" cy="7" rx="4" ry="3" fill="#7a6a40"/>
        </svg>`;
        world.appendChild(mEl);
    }

    // Exit label
    addBarnLabel(world, 'EXIT', 3.5, 7.3);
}

// --- Barn Aisle Item Handlers ---

function isCarryingAnything() {
    return YardState.carryingBucket || YardState.carryingTack || YardState.leadingHorse || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow;
}

function handleWaterHoseInteract() {
    if (isCarryingAnything()) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    YardState.carryingWaterBucket = true;
    closeYardPanel();
    updateCarryingIndicator();
    showYardPanel('<h3>Water Hose</h3><p>Filled a water bucket from the hose. Take it to a horse\'s stall.</p>');
}

function handleHayStoreInteract() {
    if (isCarryingAnything()) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    YardState.carryingHay = true;
    closeYardPanel();
    updateCarryingIndicator();
    showYardPanel('<h3>Hay Store</h3><p>Picked up some hay. Take it to a horse\'s stall.</p>');
}

function handleWheelbarrowInteract() {
    if (YardState.carryingWheelbarrow) {
        YardState.carryingWheelbarrow = false;
        updateCarryingIndicator();
        showYardPanel('<h3>Wheelbarrow</h3><p>Put the wheelbarrow back.</p>');
        return;
    }
    if (isCarryingAnything()) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    YardState.carryingWheelbarrow = true;
    closeYardPanel();
    updateCarryingIndicator();
    showYardPanel('<h3>Wheelbarrow</h3><p>Picked up the wheelbarrow. Use it to muck out stalls.</p>');
}

// --- Stall Interior Interaction Handlers ---

function stallCareColorStyle(level) {
    if (level >= 60) return 'color:var(--color-success)';
    if (level >= 30) return 'color:var(--color-warning)';
    return 'color:var(--color-danger)';
}

function stallCareBar(level) {
    const filled = Math.round(level / 12.5);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(8 - filled);
    return `<span style="${stallCareColorStyle(level)}">${bar} ${level}%</span>`;
}

function handleStallFeedPotInteract() {
    const idx = YardState.stallZoneHorseIdx;
    const horse = GameState.horses[idx];
    if (!horse) return;
    const care = horse.stallCare;

    if (YardState.carryingBucket) {
        const bucket = YardState.carryingBucket;
        if (bucket.horseIdx !== idx) {
            showYardPanel(`<h3>Feed Pot</h3><p>This bucket is for <strong>${bucket.horseName}</strong>, not ${horse.name}.</p>`);
            return;
        }
        bucket.feeds.forEach(feedTypeKey => applyFeedEffect(horse, feedTypeKey));
        care.feedLevel = Math.min(100, care.feedLevel + 30 * bucket.feeds.length);
        horse.fedThisRound = true;
        YardState.carryingBucket = null;
        updateCarryingIndicator();
        rebuildStallView(idx);
        const feedNames = bucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
        showYardPanel(`<h3>Fed ${horse.name}!</h3><p>Fed <strong>${feedNames}</strong></p><p>Feed level: <strong>${care.feedLevel}%</strong></p>`);
        return;
    }
    showYardPanel(`<h3>Feed Pot</h3><p>${horse.name}'s feed trough.</p>
        <div class="yard-stat-row"><span class="stat-label">Feed Level</span>${stallCareBar(care.feedLevel)}</div>
        <p style="margin-top:var(--space-xs);color:var(--color-text-muted);font-size:0.8rem">Bring a filled feed bucket from the Feed Room to top up.</p>`);
}

function handleStallWaterBucketInteract() {
    const idx = YardState.stallZoneHorseIdx;
    const horse = GameState.horses[idx];
    if (!horse) return;
    const care = horse.stallCare;

    if (YardState.carryingWaterBucket) {
        care.waterLevel = 100;
        YardState.carryingWaterBucket = false;
        updateCarryingIndicator();
        rebuildStallView(idx);
        showYardPanel(`<h3>Water Filled!</h3><p>Filled ${horse.name}'s water bucket.</p><p>Water level: <strong>100%</strong></p>`);
        return;
    }
    showYardPanel(`<h3>Water Bucket</h3><p>${horse.name}'s water supply.</p>
        <div class="yard-stat-row"><span class="stat-label">Water Level</span>${stallCareBar(care.waterLevel)}</div>
        <p style="margin-top:var(--space-xs);color:var(--color-text-muted);font-size:0.8rem">Fill a water bucket from the hose in the barn aisle.</p>`);
}

function handleStallHayRackInteract() {
    const idx = YardState.stallZoneHorseIdx;
    const horse = GameState.horses[idx];
    if (!horse) return;
    const care = horse.stallCare;

    if (YardState.carryingHay) {
        care.hayLevel = 100;
        YardState.carryingHay = false;
        updateCarryingIndicator();
        rebuildStallView(idx);
        showYardPanel(`<h3>Hay Topped Up!</h3><p>Topped up ${horse.name}'s hay rack.</p><p>Hay level: <strong>100%</strong></p>`);
        return;
    }
    showYardPanel(`<h3>Hay Rack</h3><p>${horse.name}'s hay supply.</p>
        <div class="yard-stat-row"><span class="stat-label">Hay Level</span>${stallCareBar(care.hayLevel)}</div>
        <p style="margin-top:var(--space-xs);color:var(--color-text-muted);font-size:0.8rem">Pick up hay from the hay store in the barn aisle.</p>`);
}

function handleStallManureInteract() {
    const idx = YardState.stallZoneHorseIdx;
    const horse = GameState.horses[idx];
    if (!horse) return;
    const care = horse.stallCare;

    if (YardState.carryingWheelbarrow) {
        care.manurePiles = Math.max(0, care.manurePiles - 1);
        care.beddingQuality = Math.max(0, 100 - care.manurePiles * 25);
        // Rebuild the map and interactables
        YardState.stallMap = generateStallMap(idx);
        YardState.stallInteractables = generateStallInteractables(idx);
        rebuildStallView(idx);
        const remaining = care.manurePiles;
        showYardPanel(`<h3>Mucked Out!</h3><p>Cleaned up a manure pile.</p><p>${remaining > 0 ? remaining + ' pile' + (remaining > 1 ? 's' : '') + ' remaining.' : 'Stall is clean! Bedding quality restored.'}</p>`);
        return;
    }
    showYardPanel('<h3>Manure Pile</h3><p>Need a wheelbarrow to clean this up. Pick one up from the barn aisle.</p>');
}

function rebuildStallView(horseIdx) {
    buildZoneMap();
    buildStallContents(horseIdx);
    requestAnimationFrame(() => {
        updatePlayerPosition2D();
        updateCamera2D();
        checkInteractable2D();
    });
}

// --- Interaction Handlers ---

function handleStallInteract2D(ia) {
    const idx = ia.stallIdx;
    const horses = GameState.horses;
    if (idx >= horses.length) {
        showYardPanel('<h3>Empty Stall</h3><p>This stall is unoccupied. Buy more horses at Tattersalls!</p>');
        return;
    }
    const h = horses[idx];
    const condClass = h.condition >= 70 ? 'color:var(--color-success)' : h.condition >= 40 ? 'color:var(--color-warning)' : 'color:var(--color-danger)';
    const trainingText = h.trainingFocus ? capitalizeFirst(h.trainingFocus) : 'None';
    const carrotCount = GameState.forage.carrots || 0;
    const care = h.stallCare || { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
    const canEnterStall = !YardState.carryingTack && !YardState.leadingHorse;
    const nameHorseBtn = h.name === 'Un-named' ? `
        <div class="yard-buy-row" style="margin-bottom:var(--space-sm)">
            <span style="color:var(--color-warning);font-style:italic;">Un-named</span>
            <button class="yard-buy-btn" onclick="nameHorseFromStall(${idx})">Name Horse</button>
        </div>` : '';
    showYardPanel(`
        <h3>${h.name}</h3>
        ${nameHorseBtn}
        <div class="yard-horse-info">
            <span style="font-size:0.85rem;color:var(--color-text-light)">${h.age} yr${h.age > 1 ? 's' : ''}${h.sex ? ' ' + h.sex : ''}${h.isYearling ? ' (Yearling)' : ''} \u00B7 OR ${h.officialRating || '--'}</span>
        </div>
        <div class="yard-stat-row"><span class="stat-label">Speed</span><span class="stat-value">${h.speed}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Stamina</span><span class="stat-value">${h.stamina}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Acceleration</span><span class="stat-value">${h.acceleration}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Temperament</span><span class="stat-value">${h.temperament}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Condition</span><span class="stat-value" style="${condClass}">${h.condition}%</span></div>
        <div class="yard-stat-row"><span class="stat-label">Training</span><span class="stat-value">${trainingText}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Wins / Races</span><span class="stat-value">${h.wins} / ${h.racesRun}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Fed</span><span class="stat-value" style="color:${h.fedThisRound ? 'var(--color-success)' : 'var(--color-warning)'}">${h.fedThisRound ? 'Yes' : 'Not yet'}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Tack</span><span class="stat-value">Saddle: <span style="color:${h.tackedUp?.saddle ? 'var(--color-success)' : 'var(--color-warning)'}">${h.tackedUp?.saddle ? 'Y' : 'N'}</span> | Bridle: <span style="color:${h.tackedUp?.bridle ? 'var(--color-success)' : 'var(--color-warning)'}">${h.tackedUp?.bridle ? 'Y' : 'N'}</span></span></div>
        ${h.isInjured ? `<p style="color:var(--color-danger);margin-top:var(--space-sm);">Injured: ${h.injuryType} (${h.recoveryRacesLeft} races left)</p>` : ''}
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div style="margin-bottom:var(--space-xs);font-weight:600;font-size:0.85rem;">Stall Care:</div>
        <div class="yard-stat-row"><span class="stat-label">Feed</span>${stallCareBar(care.feedLevel)}</div>
        <div class="yard-stat-row"><span class="stat-label">Water</span>${stallCareBar(care.waterLevel)}</div>
        <div class="yard-stat-row"><span class="stat-label">Hay</span>${stallCareBar(care.hayLevel)}</div>
        <div class="yard-stat-row"><span class="stat-label">Bedding</span>${stallCareBar(care.beddingQuality)}${care.manurePiles > 0 ? ` <span style="color:var(--color-text-muted);font-size:0.75rem">(${care.manurePiles} manure)</span>` : ''}</div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-buy-row">
            <span>Carrots: ${carrotCount}</span>
            <button class="yard-buy-btn" onclick="feedCarrot(${idx})" ${carrotCount <= 0 ? 'disabled' : ''}>Feed Carrot</button>
        </div>
        ${!h.paddockTurnedOut && !h.isInjured ? `<div class="yard-buy-row" style="margin-top:var(--space-xs)">
            <span>Paddock</span>
            <button class="yard-buy-btn" onclick="leadHorseFromStall(${idx})">Lead to Paddock</button>
        </div>` : ''}
        <div class="yard-buy-row" style="margin-top:var(--space-xs)">
            <span>Stall Interior</span>
            <button class="yard-buy-btn" onclick="enterStall(${idx})" ${!canEnterStall ? 'disabled title="Put down items first"' : ''}>Enter Stall</button>
        </div>
    `);
}

async function nameHorseFromStall(stallIdx) {
    const horse = GameState.horses[stallIdx];
    if (!horse) return;
    const newName = await gamePrompt('Name Your Horse', 'Choose a name for your horse:', 'Enter name...');
    if (newName) {
        horse.name = newName;
        // Refresh the stall panel
        const ia = YardState._currentInteractable;
        if (ia) handleStallInteract2D(ia);
        // Update stall name label if inside the stall
        if (YardState.currentZone === 'stall') {
            rebuildStallView(stallIdx);
        }
    }
}

function feedCarrot(stallIdx) {
    if (GameState.forage.carrots <= 0) return;
    GameState.forage.carrots--;
    const horses = GameState.horses;
    if (stallIdx < horses.length) {
        const boost = randomInt(0, 1);
        horses[stallIdx].condition = Math.min(100, horses[stallIdx].condition + boost);
    }
    // Refresh the stall panel
    const ia = YardState._currentInteractable;
    if (ia) handleStallInteract2D(ia);
}

function handleTackRoomInteract() {
    if (YardState.carryingBucket) {
        showYardPanel('<h3>Tack Room</h3><p>Put down the feed bucket first!</p>');
        return;
    }
    if (YardState.leadingHorse) {
        showYardPanel('<h3>Tack Room</h3><p>You\'re leading a horse! Deliver it first.</p>');
        return;
    }
    if (YardState.carryingTack) {
        const type = YardState.carryingTack.type;
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        showYardPanel(`
            <h3>Tack Room</h3>
            <p>You're carrying a <strong>${label}</strong>.</p>
            <button class="yard-buy-btn" style="margin-top:var(--space-sm);width:100%" onclick="putBackTack()">Put Back ${label}</button>
        `);
        return;
    }
    const t = GameState.tack;
    showYardPanel(`
        <h3>Tack Room</h3>
        <p>Pick up tack to carry to a horse's stall.</p>
        <div class="yard-stat-row"><span class="stat-label">Saddles</span><span class="stat-value">${t.saddles}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Bridles</span><span class="stat-value">${t.bridles}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Rugs</span><span class="stat-value">${t.rugs}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-buy-row" style="margin-top:var(--space-xs)">
            <span>Saddle</span>
            <button class="yard-buy-btn" onclick="pickUpTack('saddle')" ${t.saddles <= 0 ? 'disabled' : ''}>Pick Up</button>
        </div>
        <div class="yard-buy-row" style="margin-top:var(--space-xs)">
            <span>Bridle</span>
            <button class="yard-buy-btn" onclick="pickUpTack('bridle')" ${t.bridles <= 0 ? 'disabled' : ''}>Pick Up</button>
        </div>
        <p style="margin-top:var(--space-md);font-style:italic;color:var(--color-text-muted)">Visit the Tack Store outside to buy more.</p>
    `);
}

// --- Feed Room Interaction Handlers ---

function handleScoopRackInteract() {
    if (!FeedRoomState.hasScoop) {
        FeedRoomState.hasScoop = true;
        FeedRoomState.scoopFeedType = null;
        showYardPanel(`<h3>Scoop Rack</h3><p>Picked up the feed scoop.</p><p style="color:var(--color-text-muted);font-style:italic">Now walk to a feed bag and press E to scoop feed.</p>`);
    } else {
        FeedRoomState.hasScoop = false;
        FeedRoomState.scoopFeedType = null;
        showYardPanel(`<h3>Scoop Rack</h3><p>Put the scoop back on the rack.</p>`);
    }
    updateFeedRoomHUD();
}

function pickUpTack(type) {
    if (YardState.carryingBucket || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    if (YardState.leadingHorse) {
        showYardPanel('<h3>Hands Full</h3><p>You\'re leading a horse! Deliver it first.</p>');
        return;
    }
    const key = type + 's'; // 'saddles' or 'bridles'
    if (GameState.tack[key] <= 0) {
        showYardPanel(`<h3>Tack Room</h3><p>No ${type}s available! Visit the Tack Store to buy more.</p>`);
        return;
    }
    GameState.tack[key]--;
    YardState.carryingTack = { type };
    closeYardPanel();
    updateCarryingIndicator();
}

function putBackTack() {
    if (!YardState.carryingTack) return;
    const key = YardState.carryingTack.type + 's';
    GameState.tack[key]++;
    YardState.carryingTack = null;
    closeYardPanel();
    updateCarryingIndicator();
}

function handleStallTackInteract(ia) {
    const idx = ia.stallIdx;
    const horses = GameState.horses;
    if (idx >= horses.length) {
        showYardPanel('<h3>Empty Stall</h3><p>No horse here.</p>');
        // Return tack to inventory
        const key = YardState.carryingTack.type + 's';
        GameState.tack[key]++;
        YardState.carryingTack = null;
        updateCarryingIndicator();
        return;
    }
    const horse = horses[idx];
    const type = YardState.carryingTack.type;
    const label = type.charAt(0).toUpperCase() + type.slice(1);

    if (horse.tackedUp[type]) {
        showYardPanel(`<h3>${horse.name}</h3><p>${horse.name} already has a ${type}.</p>`);
        // Return tack to inventory
        const key = type + 's';
        GameState.tack[key]++;
        YardState.carryingTack = null;
        updateCarryingIndicator();
        return;
    }

    horse.tackedUp[type] = true;
    YardState.carryingTack = null;

    const saddleStatus = horse.tackedUp.saddle ? 'Yes' : 'No';
    const bridleStatus = horse.tackedUp.bridle ? 'Yes' : 'No';
    const fullyTacked = horse.tackedUp.saddle && horse.tackedUp.bridle;
    showYardPanel(`<h3>${horse.name}</h3>
        <p style="color:var(--color-success);font-weight:600">${label} fitted!</p>
        <div class="yard-stat-row"><span class="stat-label">Saddle</span><span class="stat-value" style="color:${horse.tackedUp.saddle ? 'var(--color-success)' : 'var(--color-warning)'}">${saddleStatus}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Bridle</span><span class="stat-value" style="color:${horse.tackedUp.bridle ? 'var(--color-success)' : 'var(--color-warning)'}">${bridleStatus}</span></div>
        ${fullyTacked ? '<p style="margin-top:var(--space-sm);color:var(--color-success);font-weight:600">Fully tacked up and ready!</p>' : '<p style="margin-top:var(--space-sm);color:var(--color-warning)">Still needs more tack.</p>'}`);
    updateCarryingIndicator();
}

function handleFeedBagInteract(ia) {
    const ft = FEED_TYPES[ia.feedTypeKey];
    if (!FeedRoomState.hasScoop) {
        showYardPanel(`<h3>${ft.label}</h3>
            <p><strong>${ft.category}</strong></p>
            <p>Boosts <strong>${ft.stat}</strong> (+${ft.bonus[0]}-${ft.bonus[1]})</p>
            <p style="color:var(--color-text-muted)">May reduce ${ft.penalty} (-${ft.penaltyRange[0]}-${ft.penaltyRange[1]})</p>
            <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
            <p style="color:var(--color-warning);font-weight:600">Pick up the scoop first!</p>`);
        return;
    }
    if (FeedRoomState.scoopFeedType !== null) {
        showYardPanel(`<h3>${ft.label}</h3><p>Your scoop already has <strong>${FEED_TYPES[FeedRoomState.scoopFeedType].label}</strong> in it.</p><p>Empty it into a bucket first!</p>`);
        return;
    }
    if (GameState.feedSupply <= 0) {
        showYardPanel(`<h3>${ft.label}</h3><p style="color:var(--color-danger);font-weight:600">No feed supply left!</p><p>Buy more at the Feed Mill outside.</p>`);
        return;
    }
    GameState.feedSupply--;
    FeedRoomState.scoopFeedType = ia.feedTypeKey;
    showYardPanel(`<h3>${ft.label}</h3>
        <p>Scooped <strong>${ft.label}</strong> from the bag.</p>
        <p style="color:var(--color-text-muted)">Feed remaining: ${GameState.feedSupply} units</p>
        <p style="margin-top:var(--space-sm);font-style:italic">Now walk to a horse's bucket and press E to fill it.</p>`);
    updateYardHUD();
    updateFeedRoomHUD();
}

function handleBucketInteract(ia) {
    const bucket = FeedRoomState.buckets[ia.bucketIdx];
    if (!bucket) return;
    if (bucket.feeds.length >= 3) {
        const feedNames = bucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
        showYardPanel(`<h3>${bucket.horseName}'s Bucket</h3><p>Bucket is full (3/3 scoops).</p><p><strong>Contents:</strong> ${feedNames}</p>`);
        return;
    }
    if (!FeedRoomState.hasScoop || FeedRoomState.scoopFeedType === null) {
        if (bucket.feeds.length > 0) {
            const feedNames = bucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
            showYardPanel(`<h3>${bucket.horseName}'s Bucket</h3><p><strong>Contents (${bucket.feeds.length}/3):</strong> ${feedNames}</p><p style="color:var(--color-warning);font-weight:600">Scoop more feed to add!</p>`);
        } else {
            showYardPanel(`<h3>${bucket.horseName}'s Bucket</h3><p>This bucket is empty.</p><p style="color:var(--color-warning);font-weight:600">Scoop some feed first!</p>`);
        }
        return;
    }
    bucket.feeds.push(FeedRoomState.scoopFeedType);
    const ft = FEED_TYPES[FeedRoomState.scoopFeedType];
    FeedRoomState.scoopFeedType = null;

    // Update bucket visual
    const bucketEl = document.getElementById(`feedroom-bucket-${ia.bucketIdx}`);
    if (bucketEl) {
        const svg = bucketEl.querySelector('svg');
        if (svg) {
            const path = svg.querySelector('path');
            if (path) path.setAttribute('fill', ft.color);
            // Add/update fill indicator
            const existing = svg.querySelector('.bucket-fill');
            if (existing) existing.remove();
            const fillRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            fillRect.setAttribute('class', 'bucket-fill');
            fillRect.setAttribute('x', '4');
            fillRect.setAttribute('y', String(26 - bucket.feeds.length * 6));
            fillRect.setAttribute('width', '20');
            fillRect.setAttribute('height', String(bucket.feeds.length * 6));
            fillRect.setAttribute('rx', '1');
            fillRect.setAttribute('fill', ft.color);
            fillRect.setAttribute('opacity', '0.8');
            svg.appendChild(fillRect);
            // Add count label
            const existingText = svg.querySelector('.bucket-count');
            if (existingText) existingText.remove();
            const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            countText.setAttribute('class', 'bucket-count');
            countText.setAttribute('x', '14');
            countText.setAttribute('y', '22');
            countText.setAttribute('text-anchor', 'middle');
            countText.setAttribute('font-size', '10');
            countText.setAttribute('fill', '#fff');
            countText.setAttribute('font-weight', 'bold');
            countText.textContent = String(bucket.feeds.length);
            svg.appendChild(countText);
        }
    }

    const feedNames = bucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
    const filledCount = FeedRoomState.buckets.filter(b => b.feeds.length > 0).length;
    const totalCount = FeedRoomState.buckets.length;
    showYardPanel(`<h3>${bucket.horseName}'s Bucket</h3>
        <p>Added <strong>${ft.label}</strong>! (${bucket.feeds.length}/3 scoops)</p>
        <p><strong>Contents:</strong> ${feedNames}</p>
        <p style="margin-top:var(--space-sm);color:var(--color-success)">${filledCount}/${totalCount} buckets filled</p>`);
    updateFeedRoomHUD();
}

function handleFeedRoomDoorInteract() {
    const filledCount = FeedRoomState.buckets.filter(b => b.feeds.length > 0).length;
    const totalCount = FeedRoomState.buckets.length;
    if (filledCount === 0) {
        showYardPanel(`<h3>Exit Feed Room</h3>
            <p>No buckets have been filled yet.</p>
            <button class="yard-buy-btn" style="margin-top:var(--space-sm);width:100%" onclick="closeYardPanel();exitFeedRoom()">Leave Anyway</button>`);
    } else {
        showYardPanel(`<h3>Exit Feed Room</h3>
            <p><strong>${filledCount}/${totalCount}</strong> buckets filled and ready to deliver.</p>
            <button class="yard-buy-btn" style="margin-top:var(--space-sm);width:100%" onclick="closeYardPanel();exitFeedRoom()">Exit with Buckets</button>`);
    }
}

function updateFeedRoomHUD() {
    let hud = document.querySelector('.feedroom-status');
    if (YardState.currentZone !== 'feedroom') {
        if (hud) hud.remove();
        updateCarryingIndicator();
        return;
    }
    const viewport = document.querySelector('.yard-viewport');
    if (!viewport) return;
    if (!hud) {
        hud = document.createElement('div');
        hud.className = 'feedroom-status';
        viewport.appendChild(hud);
    }
    let scoopText = 'No scoop';
    if (FeedRoomState.hasScoop) {
        scoopText = FeedRoomState.scoopFeedType
            ? `Scoop: ${FEED_TYPES[FeedRoomState.scoopFeedType].label}`
            : 'Empty Scoop';
    }
    const filledCount = FeedRoomState.buckets.filter(b => b.feeds.length > 0).length;
    const totalCount = FeedRoomState.buckets.length;
    hud.innerHTML = `<span>${scoopText}</span><span>${filledCount}/${totalCount} buckets</span>`;
}

function removeFeedRoomHUD() {
    const hud = document.querySelector('.feedroom-status');
    if (hud) hud.remove();
}

function updateCarryingIndicator() {
    let ind = document.querySelector('.carrying-indicator');
    const hasCarrying = YardState.carryingBucket || YardState.carryingTack || YardState.leadingHorse || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow;
    if (!hasCarrying) {
        if (ind) ind.remove();
        return;
    }
    const viewport = document.querySelector('.yard-viewport');
    if (!viewport) return;
    if (!ind) {
        ind = document.createElement('div');
        ind.className = 'carrying-indicator';
        viewport.appendChild(ind);
    }
    if (YardState.carryingTack) {
        const type = YardState.carryingTack.type;
        ind.textContent = `Carrying: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    } else if (YardState.carryingBucket) {
        const feedNames = YardState.carryingBucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
        ind.textContent = `Carrying: ${YardState.carryingBucket.horseName}'s bucket (${feedNames})`;
    } else if (YardState.leadingHorse) {
        const suffix = YardState.leadingHorse.returning ? ' (returning)' : '';
        ind.textContent = `Leading: ${YardState.leadingHorse.horseName}${suffix}`;
    } else if (YardState.carryingWaterBucket) {
        ind.textContent = 'Carrying: Water Bucket';
    } else if (YardState.carryingHay) {
        ind.textContent = 'Carrying: Hay';
    } else if (YardState.carryingWheelbarrow) {
        ind.textContent = 'Carrying: Wheelbarrow';
    }
}

// --- Bucket Pile & Delivery ---

function handleBucketPileInteract() {
    if (YardState.carryingBucket) {
        showYardPanel(`<h3>Bucket Pile</h3><p>Deliver your current bucket to <strong>${YardState.carryingBucket.horseName}</strong>'s stall first!</p>`);
        return;
    }
    if (YardState.bucketPile.length === 0) {
        showYardPanel(`<h3>Bucket Pile</h3><p>No buckets here.</p>`);
        return;
    }
    let html = `<h3>Feed Buckets</h3><p>Pick up a bucket to deliver to its horse's stall.</p>`;
    YardState.bucketPile.forEach((b, i) => {
        const feedNames = b.feeds.map(f => FEED_TYPES[f].label).join(', ');
        const lastColor = FEED_TYPES[b.feeds[b.feeds.length - 1]].color;
        html += `<div class="yard-buy-row" style="margin-top:var(--space-xs)">
            <span>${b.horseName} <small style="color:${lastColor}">(${feedNames})</small></span>
            <button class="yard-buy-btn" onclick="pickUpBucket(${i})">Pick Up</button>
        </div>`;
    });
    showYardPanel(html);
}

function pickUpBucket(idx) {
    if (idx < 0 || idx >= YardState.bucketPile.length) return;
    if (YardState.carryingTack || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    if (YardState.leadingHorse) {
        showYardPanel('<h3>Hands Full</h3><p>You\'re leading a horse! Deliver it first.</p>');
        return;
    }
    YardState.carryingBucket = YardState.bucketPile[idx];
    YardState.bucketPile.splice(idx, 1);
    YardState.barnInteractables = generateBarnInteractables();
    // Rebuild barn contents to update bucket pile visual
    buildZoneMap();
    buildBarnContents();
    requestAnimationFrame(() => {
        updatePlayerPosition2D();
        updateCamera2D();
    });
    closeYardPanel();
    updateCarryingIndicator();
}

function handleStallFeedInteract(ia) {
    const idx = ia.stallIdx;
    const horses = GameState.horses;
    if (idx >= horses.length) {
        showYardPanel('<h3>Empty Stall</h3><p>No horse here to feed.</p>');
        return;
    }
    const horse = horses[idx];
    const bucket = YardState.carryingBucket;

    if (bucket.horseIdx !== idx) {
        showYardPanel(`<h3>${horse.name}</h3><p>This bucket is for <strong>${bucket.horseName}</strong>, not ${horse.name}.</p><p>Find the right stall!</p>`);
        return;
    }
    if (horse.fedThisRound) {
        showYardPanel(`<h3>${horse.name}</h3><p>${horse.name} has already been fed this round.</p>`);
        YardState.carryingBucket = null;
        updateCarryingIndicator();
        return;
    }

    // Apply all feed effects from the multi-scoop bucket
    bucket.feeds.forEach(feedTypeKey => applyFeedEffect(horse, feedTypeKey));
    horse.fedThisRound = true;
    YardState.carryingBucket = null;

    let feedDetails = '';
    bucket.feeds.forEach(feedTypeKey => {
        const ft = FEED_TYPES[feedTypeKey];
        const bonus = ft.bonus[1] > 0 ? `+${ft.bonus[0]}-${ft.bonus[1]}` : '+0';
        feedDetails += `<div class="yard-stat-row"><span class="stat-label">${ft.label}: ${capitalizeFirst(ft.stat)} boost</span><span class="stat-value" style="color:var(--color-success)">${bonus}</span></div>
        <div class="yard-stat-row"><span class="stat-label" style="padding-left:var(--space-sm)">${capitalizeFirst(ft.penalty)} risk</span><span class="stat-value" style="color:var(--color-warning)">-${ft.penaltyRange[0]}-${ft.penaltyRange[1]}</span></div>`;
    });
    const feedNames = bucket.feeds.map(f => FEED_TYPES[f].label).join(', ');
    showYardPanel(`<h3>${horse.name} Fed!</h3>
        <p>Fed <strong>${feedNames}</strong> (${bucket.feeds.length} scoop${bucket.feeds.length > 1 ? 's' : ''})</p>
        ${feedDetails}
        <p style="margin-top:var(--space-sm);color:var(--color-success);font-weight:600">Horse fed successfully!</p>`);

    YardState.barnInteractables = generateBarnInteractables();
    updateCarryingIndicator();
}

function applyFeedEffect(horse, feedTypeKey) {
    const feed = FEED_TYPES[feedTypeKey];
    const bonus = randomInt(feed.bonus[0], feed.bonus[1]);
    const penalty = randomInt(feed.penaltyRange[0], feed.penaltyRange[1]);
    horse[feed.stat] = Math.min(99, horse[feed.stat] + bonus);
    if (penalty > 0) horse[feed.penalty] = Math.max(1, horse[feed.penalty] - penalty);
}

function handleTackStoreInteract() {
    const t = GameState.tack;
    const budget = GameState.budget;
    const required = GameState.horses.length;
    const saddleShort = t.saddles < required;
    const bridleShort = t.bridles < required;
    const reqWarning = required > 0 ? `<div class="yard-stat-row" style="color:${saddleShort || bridleShort ? 'var(--color-danger)' : 'var(--color-text-light)'};">
        <span class="stat-label">Required</span>
        <span class="stat-value">${required} of each for your ${required} horse${required !== 1 ? 's' : ''}</span>
    </div>` : '';
    showYardPanel(`
        <h3>Tack Store</h3>
        <p>Purchase equipment for your horses.</p>
        <div class="yard-stat-row"><span class="stat-label">Your Budget</span><span class="stat-value">\u00A3${formatMoney(budget)}</span></div>
        ${reqWarning}
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-buy-row">
            <span>Saddle (\u00A32,000) \u2014 Own: <span style="color:${saddleShort ? 'var(--color-danger);font-weight:600' : 'inherit'}">${t.saddles}</span></span>
            <button class="yard-buy-btn" onclick="buyTack('saddles',1)" ${budget < 2000 ? 'disabled' : ''}>Buy</button>
        </div>
        <div class="yard-buy-row">
            <span>Bridle (\u00A3800) \u2014 Own: <span style="color:${bridleShort ? 'var(--color-danger);font-weight:600' : 'inherit'}">${t.bridles}</span></span>
            <button class="yard-buy-btn" onclick="buyTack('bridles',1)" ${budget < 800 ? 'disabled' : ''}>Buy</button>
        </div>
        <div class="yard-buy-row">
            <span>Rug (\u00A3400) \u2014 Own: ${t.rugs}</span>
            <button class="yard-buy-btn" onclick="buyTack('rugs',1)" ${budget < 400 ? 'disabled' : ''}>Buy</button>
        </div>
    `);
}

function handleFeedMillInteract() {
    const budget = GameState.budget;
    const unitPrice = 500;
    showYardPanel(`
        <h3>Feed Mill</h3>
        <p>Buy feed for your horses. Current supply: <strong>${GameState.feedSupply} units</strong></p>
        <div class="yard-stat-row"><span class="stat-label">Price per Unit</span><span class="stat-value">\u00A3${formatMoney(unitPrice)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Your Budget</span><span class="stat-value">\u00A3${formatMoney(budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-buy-row">
            <span>10 units (\u00A3${formatMoney(10 * unitPrice)})</span>
            <button class="yard-buy-btn" onclick="buyFeed(10)" ${budget < 10 * unitPrice ? 'disabled' : ''}>Buy</button>
        </div>
        <div class="yard-buy-row">
            <span>20 units (\u00A3${formatMoney(20 * unitPrice)})</span>
            <button class="yard-buy-btn" onclick="buyFeed(20)" ${budget < 20 * unitPrice ? 'disabled' : ''}>Buy</button>
        </div>
        <div class="yard-buy-row">
            <span>50 units (\u00A3${formatMoney(50 * unitPrice)})</span>
            <button class="yard-buy-btn" onclick="buyFeed(50)" ${budget < 50 * unitPrice ? 'disabled' : ''}>Buy</button>
        </div>
    `);
}

function handleTattersallsInteract() {
    showYardPanel(`
        <h3>Tattersall's</h3>
        <p>The famous bloodstock sales ring. What are you here for?</p>
        <div style="display:flex;gap:var(--space-md);margin-top:var(--space-lg);">
            <button class="btn btn-primary" onclick="closeYardPanel();leaveYardForScreen();openAuction();" style="flex:1;">Horse Auction</button>
            <button class="btn btn-secondary" onclick="closeYardPanel();leaveYardForScreen();openYearlingSale();" style="flex:1;">Yearling Sale</button>
        </div>
    `);
}

function handleExpandBarn() {
    const cost = 100000;
    const canExpand = GameState.maxStalls < 20;
    const canAfford = GameState.budget >= cost;
    if (!canExpand) {
        showYardPanel('<h3>Barn Expansion</h3><p>The barn is already at maximum capacity (20 stalls).</p>');
        return;
    }
    showYardPanel(`
        <h3>Barn Expansion</h3>
        <p>Add 2 more stalls to your barn.</p>
        <div class="yard-stat-row"><span class="stat-label">Current Stalls</span><span class="stat-value">${GameState.maxStalls}</span></div>
        <div class="yard-stat-row"><span class="stat-label">After Expansion</span><span class="stat-value">${GameState.maxStalls + 2}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Cost</span><span class="stat-value">\u00A3${formatMoney(cost)}</span></div>
        <button class="btn btn-primary" onclick="expandBarn()" style="width:100%;margin-top:var(--space-md);" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Expand Barn' : 'Insufficient Funds'}
        </button>
    `);
}

function handleForageInteract() {
    const f = GameState.forage;
    const budget = GameState.budget;
    const items = [
        { key: 'hay',      label: 'Hay',      price: 300 },
        { key: 'straw',    label: 'Straw',    price: 200 },
        { key: 'shavings', label: 'Shavings', price: 250 },
        { key: 'carrots',  label: 'Carrots',  price: 100 },
    ];
    const rows = items.map(it => {
        const buyBtns = [10, 20, 50].map(amt =>
            `<button class="yard-buy-btn" onclick="buyForage('${it.key}',${amt})" ${budget < amt * it.price ? 'disabled' : ''}>Buy ${amt}</button>`
        ).join(' ');
        return `
            <div class="yard-buy-row" style="flex-wrap:wrap;gap:var(--space-xs);">
                <span style="width:100%;">${it.label} (\u00A3${formatMoney(it.price)}/bale) \u2014 Stock: ${f[it.key]}</span>
                ${buyBtns}
            </div>`;
    }).join('');
    showYardPanel(`
        <h3>Forage & Bedding Store</h3>
        <p>Buy hay, straw, and shavings for your horses.</p>
        <div class="yard-stat-row"><span class="stat-label">Your Budget</span><span class="stat-value">\u00A3${formatMoney(budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${rows}
    `);
}

function handleSupplierInteract() {
    const budget = GameState.budget;
    const u = GameState.barnUpgrades;
    const upgrades = [
        { key: 'rubberMatting',  label: 'Rubber Matting',  cost: 50000,  desc: '+5% condition recovery' },
        { key: 'autoWaterers',   label: 'Auto Waterers',   cost: 75000,  desc: '+3% condition recovery' },
        { key: 'climateControl', label: 'Climate Control', cost: 150000, desc: '+5% condition recovery' },
    ];
    const upgradeRows = upgrades.map(up => {
        if (u[up.key]) {
            return `<div class="yard-buy-row"><span>${up.label} \u2014 ${up.desc}</span><span style="color:var(--color-success);font-weight:600;">Purchased</span></div>`;
        }
        return `<div class="yard-buy-row">
            <span>${up.label} (\u00A3${formatMoney(up.cost)}) \u2014 ${up.desc}</span>
            <button class="yard-buy-btn" onclick="buyBarnUpgrade('${up.key}')" ${budget < up.cost ? 'disabled' : ''}>Buy</button>
        </div>`;
    }).join('');

    const canExpand = GameState.maxStalls < 20;
    const expandCost = 100000;
    const expandRow = canExpand
        ? `<div class="yard-buy-row">
            <span>Barn Expansion (+2 stalls, \u00A3${formatMoney(expandCost)}) \u2014 Current: ${GameState.maxStalls}</span>
            <button class="yard-buy-btn" onclick="expandBarn()" ${budget < expandCost ? 'disabled' : ''}>Buy</button>
           </div>`
        : `<div class="yard-buy-row"><span>Barn Expansion</span><span style="color:var(--color-text-muted);">Max (20 stalls)</span></div>`;

    // Pets section
    const pets = GameState.pets || [];
    const petCount = pets.length;
    const petRows = Object.entries(PET_TYPES).map(([key, pt]) => {
        const owned = pets.filter(p => p.type === key);
        const ownedText = owned.length > 0 ? ` (${owned.map(p => p.name).join(', ')})` : '';
        return `<div class="yard-buy-row">
            <span>${pt.emoji} ${pt.label} (\u00A3${formatMoney(pt.cost)})${ownedText}</span>
            <button class="yard-buy-btn" onclick="buyPet('${key}')" ${budget < pt.cost || petCount >= 3 ? 'disabled' : ''}>Buy</button>
        </div>`;
    }).join('');
    const petNote = petCount >= 3 ? '<p style="font-size:0.8em;color:var(--color-text-muted);">Max 3 pets (no extra benefit beyond 3)</p>' : '';
    const conflictNote = pets.some(p => p.type === 'cat') && pets.some(p => p.type === 'dog')
        ? '<p style="font-size:0.8em;color:var(--color-warning);">Warning: cats and dogs may fight!</p>' : '';

    showYardPanel(`
        <h3>Stable Supplier</h3>
        <p>Barn expansions, upgrades, and yard pets.</p>
        <div class="yard-stat-row"><span class="stat-label">Your Budget</span><span class="stat-value">\u00A3${formatMoney(budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <h4 style="margin:var(--space-sm) 0;">Expansion</h4>
        ${expandRow}
        <h4 style="margin:var(--space-sm) 0;">Upgrades</h4>
        ${upgradeRows}
        <h4 style="margin:var(--space-sm) 0;">Yard Pets</h4>
        <p style="font-size:0.8em;color:var(--color-text-light);">Cats deter rats & pigeons. Dogs deter foxes. All boost staff morale.</p>
        ${petRows}
        ${petNote}
        ${conflictNote}
    `);
}

function handleTrainerHouseInteract() {
    GameState.lastSaved = new Date().toISOString();
    const saveData = JSON.stringify(GameState);
    localStorage.setItem('championTrainer_save', saveData);
    const horses = GameState.horses;

    // Owner section
    const owners = (GameState.owners || []).filter(o => o.active);
    const yardQuality = calculateYardQuality();
    let ownerHTML = '';

    if (owners.length > 0) {
        ownerHTML = owners.map(o => {
            const ownerHorses = horses.filter(h => h.ownerId === o.id);
            const satColor = o.satisfaction >= 60 ? 'var(--color-success)' : o.satisfaction >= 30 ? 'var(--color-warning)' : 'var(--color-danger)';
            const horseNames = ownerHorses.map(h => h.name).join(', ') || 'None';
            return `<div style="background:var(--color-bg);padding:var(--space-sm);border-radius:var(--radius-sm);margin-bottom:var(--space-xs);">
                <div style="font-weight:700;">${o.name} <span style="font-size:0.8em;color:var(--color-text-light);">(${o.wealth})</span></div>
                <div style="font-size:0.85em;">Horses: ${horseNames}</div>
                <div style="font-size:0.85em;">Fee: £${formatMoney(o.weeklyFeePerHorse)}/horse/week</div>
                <div style="font-size:0.85em;">Satisfaction: <span style="color:${satColor};font-weight:600;">${Math.round(o.satisfaction)}%</span></div>
            </div>`;
        }).join('');
    } else {
        const minLevel = GameState.level >= 3 ? '' : ' Reach Level 3 to attract owners.';
        ownerHTML = `<p style="color:var(--color-text-light);font-size:0.9em;">No owners yet. Maintain a high-quality yard to attract them.${minLevel}</p>`;
    }

    showYardPanel(`
        <h3>Trainer's House</h3>
        <p style="color:var(--color-success);font-weight:600;">Game saved!</p>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-stat-row"><span class="stat-label">Stable</span><span class="stat-value">${GameState.stableName}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Season</span><span class="stat-value">${GameState.season}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Horses</span><span class="stat-value">${horses.length} (${horses.filter(h => !h.ownerId).length} owned, ${horses.filter(h => h.ownerId).length} for owners)</span></div>
        <div class="yard-stat-row"><span class="stat-label">Yard Quality</span><span class="stat-value">${yardQuality}%</span></div>
        <div class="yard-stat-row"><span class="stat-label">Level</span><span class="stat-value">${GameState.level}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <h4 style="margin-bottom:var(--space-xs);">Owners</h4>
        ${ownerHTML}
    `);
}

function handleVetInteract() {
    const injured = GameState.horses
        .map((h, i) => ({ horse: h, idx: i }))
        .filter(x => x.horse.isInjured);
    const cost = 5000;
    let rows = '';
    if (injured.length === 0) {
        rows = '<p style="color:var(--color-success);">No injured horses — all fit and healthy!</p>';
    } else {
        rows = injured.map(x => {
            const h = x.horse;
            const canAfford = GameState.budget >= cost;
            return `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                <span class="stat-label">${h.name} — ${h.injuryType} (${h.recoveryRacesLeft} races left)</span>
                <button class="btn btn-small" ${canAfford ? '' : 'disabled'} onclick="treatHorseAtVet(${x.idx})">Treat (£${formatMoney(cost)})</button>
            </div>`;
        }).join('');
    }
    // Precautionary work on horses the staff have flagged but that haven't broken down yet
    const flagged = getSpottedBrewingHorses();
    let brewingRows = '';
    if (flagged.length > 0) {
        const canAffordCheck = GameState.budget >= BREWING_VET_COST;
        brewingRows = `<hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
            <p style="font-weight:600;margin-bottom:var(--space-xs);">Flagged by your staff</p>` +
            flagged.map(x => `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                <span class="stat-label">${x.horse.name} — ${x.horse.brewing.spottedBy} is concerned</span>
                <button class="btn btn-small" ${canAffordCheck ? '' : 'disabled'} onclick="treatBrewingIssue(${x.idx})">Check Over (£${formatMoney(BREWING_VET_COST)})</button>
            </div>`).join('') +
            `<p style="font-size:0.75rem;color:var(--color-text-muted);">Heads the problem off before it costs you any ability.</p>`;
    }

    showYardPanel(`
        <h3>Vet's Office</h3>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${rows}
        ${brewingRows}
    `);
}

/**
 * Pay to head off a brewing problem the staff spotted. This is the payoff
 * that makes a good work rider's wage worth paying.
 */
function treatBrewingIssue(horseIdx) {
    if (GameState.budget < BREWING_VET_COST) {
        gameAlert('Insufficient Funds', `You need £${formatMoney(BREWING_VET_COST)} for a precautionary examination.`);
        return;
    }
    const horse = GameState.horses[horseIdx];
    if (!horse || !horse.brewing) return;

    GameState.budget -= BREWING_VET_COST;
    horse.brewing = null;
    updateYardHUD();
    handleVetInteract();
}

function treatHorseAtVet(horseIdx) {
    const cost = 5000;
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `You need £${formatMoney(cost)} for veterinary treatment.`);
        return;
    }
    const horse = GameState.horses[horseIdx];
    if (!horse || !horse.isInjured) return;
    GameState.budget -= cost;
    horse.recoveryRacesLeft = Math.max(0, horse.recoveryRacesLeft - 2);
    if (horse.recoveryRacesLeft <= 0) {
        horse.isInjured = false;
        horse.injuryType = null;
    }
    updateYardHUD();
    handleVetInteract();
}

/**
 * The Stud Farm: broodmare band, the stallion roster, and the foals you're
 * paying to keep while you wait to find out what they are.
 */
function handleStudFarmInteract(view) {
    StudFarmState.view = view || StudFarmState.view || 'band';
    GameState.broodmares = GameState.broodmares || [];
    GameState.foals = GameState.foals || [];
    if (!GameState.stallions || GameState.stallions.length === 0) generateStallionRoster();

    const tab = (id, label, count) => `<button class="stud-tab ${StudFarmState.view === id ? 'active' : ''}"
        onclick="handleStudFarmInteract('${id}')">${label}${count ? ` (${count})` : ''}</button>`;

    GameState.broodmareSale = GameState.broodmareSale || [];
    if (GameState.broodmareSale.length === 0) generateBroodmareSaleCatalogue();

    const tabs = `<div class="stud-tabs">
        ${tab('band', 'Broodmares', GameState.broodmares.length)}
        ${tab('sale', 'Sales Ring', GameState.broodmareSale.length)}
        ${tab('stallions', 'Stallions', 0)}
        ${tab('foals', 'Foals', GameState.foals.length)}
        ${tab('retire', 'Retire a Mare', 0)}
    </div>`;

    let body = '';
    if (StudFarmState.view === 'band')      body = renderBroodmareBand();
    else if (StudFarmState.view === 'sale')      body = renderBroodmareSale();
    else if (StudFarmState.view === 'stallions') body = renderStallionRoster();
    else if (StudFarmState.view === 'foals')     body = renderFoalList();
    else                                          body = renderRetirementList();

    showYardPanel(`
        <h3>Stud Farm</h3>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Keep / Season</span><span class="stat-value">£${formatMoney(getBloodstockKeepCost())}</span></div>
        ${tabs}
        ${body}
    `);
}

function renderBroodmareBand() {
    if (GameState.broodmares.length === 0) {
        return `<p style="color:var(--color-text-muted);">No broodmares. Retire a filly or mare from your stable to start a band.</p>`;
    }
    return GameState.broodmares.map(m => {
        const status = m.inFoal
            ? `<span style="color:var(--color-success);">In foal to ${m.coveredBy.name} — due season ${m.dueSeason}</span>`
            : m.age > MAX_BREEDING_AGE
                ? `<span style="color:var(--color-text-muted);">Too old to breed</span>`
                : `<span style="color:var(--color-text-muted);">Barren / not covered</span>`;
        const tooOld = m.age > MAX_BREEDING_AGE;
        const coverBtn = (m.inFoal || tooOld) ? '' :
            `<button class="btn btn-small" onclick="openCoveringFor('${m.id}')">Send to Stud</button>`;
        const sellBtn = `<button class="btn btn-small" style="background:var(--color-secondary);" onclick="offerBroodmareForSale('${m.id}')">Sell</button>`;
        return `<div class="stud-card">
            <div class="stud-card-head">
                <span class="stud-card-name">${m.name}</span>
                <span class="stud-card-meta">${m.age} yrs · ${m.careerWins} career win${m.careerWins === 1 ? '' : 's'}</span>
            </div>
            <div class="stud-card-line">${status}</div>
            <div class="stud-card-line" style="color:var(--color-text-muted);font-size:0.75rem;">
                Keep £${formatMoney(BROODMARE_KEEP_PER_SEASON)}/season
            </div>
            <div class="yard-buy-row">
                <span style="font-size:0.75rem;color:var(--color-text-muted);">Valued around £${formatMoney(calculateBroodmareValue(m))}</span>
                ${coverBtn}${sellBtn}
            </div>
        </div>`;
    }).join('');
}

function renderBroodmareSale() {
    if (GameState.broodmareSale.length === 0) {
        return `<p style="color:var(--color-text-muted);">The ring is empty. A fresh catalogue comes up each season.</p>`;
    }
    return `<p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Mares offered this season. A mare in foal comes with her covering — you're buying two gambles at once.</p>` +
        GameState.broodmareSale.map(m => {
            const canAfford = GameState.budget >= m.askingPrice;
            const inFoalLine = m.inFoal
                ? `<div class="stud-card-line" style="color:var(--color-success);">In foal to ${m.coveredBy.name} — due season ${m.dueSeason}</div>`
                : '';
            const tooOld = m.age > MAX_BREEDING_AGE;
            return `<div class="stud-card sale">
                <div class="stud-card-head">
                    <span class="stud-card-name">${m.name}</span>
                    <span class="stud-card-meta">${m.age} yrs · ${m.careerWins} win${m.careerWins === 1 ? '' : 's'}</span>
                </div>
                <div class="stud-card-line" style="font-size:0.75rem;color:var(--color-text-muted);">
                    ${m.sire.name} x ${m.dam.name}
                </div>
                <div class="stud-stats">
                    <span>Speed ${m.speed}</span><span>Stamina ${m.stamina}</span>
                    <span>Accel ${m.acceleration}</span><span>Temp ${m.temperament}</span>
                </div>
                ${inFoalLine}
                ${tooOld ? `<div class="stud-card-line" style="color:var(--color-warning);font-size:0.75rem;">Past breeding age — she'll never produce for you.</div>` : ''}
                <div class="yard-buy-row">
                    <span style="font-weight:600;">£${formatMoney(m.askingPrice)}</span>
                    <button class="yard-buy-btn" ${canAfford ? '' : 'disabled'} onclick="confirmBuyBroodmare('${m.id}')">Buy</button>
                </div>
            </div>`;
        }).join('');
}

function confirmBuyBroodmare(mareId) {
    const mare = (GameState.broodmareSale || []).find(m => m.id === mareId);
    if (!mare) return;
    if (GameState.budget < mare.askingPrice) {
        gameAlert('Insufficient Funds', `${mare.name} is priced at £${formatMoney(mare.askingPrice)}.`);
        return;
    }
    if (buyBroodmare(mareId)) {
        updateYardHUD();
        handleStudFarmInteract('band');
    }
}

/**
 * Take the ring's bid for one of your own mares - or turn it down.
 */
async function offerBroodmareForSale(mareId) {
    const mare = (GameState.broodmares || []).find(m => m.id === mareId);
    if (!mare) return;

    const bid = getBroodmareBid(mare);
    const carrying = mare.inFoal ? ` She is in foal to ${mare.coveredBy.name}, and the foal goes with her.` : '';
    const ok = await gameConfirm('Sell in the Ring',
        `The ring bids £${formatMoney(bid)} for ${mare.name}.${carrying} Accept?`);
    if (!ok) return;

    if (sellBroodmare(mareId, bid)) {
        updateYardHUD();
        handleStudFarmInteract('band');
    }
}

function renderStallionRoster() {
    const mare = StudFarmState.selectedMareId
        ? GameState.broodmares.find(m => m.id === StudFarmState.selectedMareId)
        : null;
    const header = mare
        ? `<p style="margin-bottom:var(--space-sm);">Choosing a stallion for <strong>${mare.name}</strong>.</p>`
        : `<p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">This season's roster. Pick a mare from the Broodmares tab to make a booking.</p>`;

    return header + GameState.stallions.map(s => {
        const badge = getStallionBadge(s);
        const canAfford = GameState.budget >= s.fee;
        const bookBtn = mare
            ? `<button class="yard-buy-btn" ${canAfford ? '' : 'disabled'} onclick="confirmCovering('${mare.id}','${s.id}')">Book — £${formatMoney(s.fee)}</button>`
            : `<span style="font-weight:600;">£${formatMoney(s.fee)}</span>`;
        return `<div class="stud-card stallion">
            <div class="stud-card-head">
                <span class="stud-card-name">${s.name}</span>
                ${badge ? `<span class="stud-badge ${s.firstSeason ? 'first' : s.fashion >= 1.75 ? 'hot' : 'cold'}">${badge}</span>` : ''}
            </div>
            <div class="stud-stats">
                <span>Speed ${s.speed}</span><span>Stamina ${s.stamina}</span>
                <span>Accel ${s.acceleration}</span><span>Temp ${s.temperament}</span>
            </div>
            ${s.isJumpSire ? `<div class="stud-card-line" style="font-size:0.75rem;color:var(--color-text-muted);">Sire of jumpers</div>` : ''}
            <div class="yard-buy-row">${bookBtn}</div>
        </div>`;
    }).join('');
}

function renderFoalList() {
    if (GameState.foals.length === 0) {
        return `<p style="color:var(--color-text-muted);">No foals on the ground. A mare covered this season will foal next season, and that foal joins the stable as a yearling the season after.</p>`;
    }
    return GameState.foals.map(f => `<div class="stud-card foal">
        <div class="stud-card-head">
            <span class="stud-card-name">${f.sireName} x ${f.damName}</span>
            <span class="stud-card-meta">${capitalizeFirst(f.sex)}, foaled season ${f.bornSeason}</span>
        </div>
        <div class="foal-conformation">${f.conformation}</div>
        <div class="stud-card-line" style="font-size:0.75rem;color:var(--color-text-muted);">
            Ability unknown until they're old enough to tell you · Keep £${formatMoney(FOAL_KEEP_PER_SEASON)}/season
        </div>
    </div>`).join('');
}

function renderRetirementList() {
    const eligible = GameState.horses
        .map((h, i) => ({ horse: h, idx: i }))
        .filter(x => isBreedingFemale(x.horse) && !x.horse.isYearling);

    if (eligible.length === 0) {
        return `<p style="color:var(--color-text-muted);">No fillies or mares in the stable to retire. Only fillies can go to the paddocks.</p>`;
    }
    return `<p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Retiring a mare ends her racing career for good. She stops earning and starts costing £${formatMoney(BROODMARE_KEEP_PER_SEASON)} a season.</p>` +
        eligible.map(x => {
            const h = x.horse;
            const young = h.age < BROODMARE_RETIREMENT_AGE;
            return `<div class="stud-card">
                <div class="stud-card-head">
                    <span class="stud-card-name">${h.name}</span>
                    <span class="stud-card-meta">${h.age} yrs · OR ${h.officialRating || '--'} · ${h.wins || 0} win${h.wins === 1 ? '' : 's'}</span>
                </div>
                ${young ? `<div class="stud-card-line" style="color:var(--color-warning);font-size:0.75rem;">Still of racing age — she may have more to give on the track.</div>` : ''}
                <div class="yard-buy-row">
                    <button class="yard-buy-btn" onclick="confirmRetireToStud(${x.idx})">Retire to Paddocks</button>
                </div>
            </div>`;
        }).join('');
}

function openCoveringFor(mareId) {
    StudFarmState.selectedMareId = mareId;
    handleStudFarmInteract('stallions');
}

function confirmCovering(mareId, stallionId) {
    const stallion = (GameState.stallions || []).find(s => s.id === stallionId);
    if (!stallion) return;
    if (GameState.budget < stallion.fee) {
        gameAlert('Insufficient Funds', `The nomination fee for ${stallion.name} is £${formatMoney(stallion.fee)}.`);
        return;
    }
    if (coverMare(mareId, stallionId)) {
        StudFarmState.selectedMareId = null;
        updateYardHUD();
        handleStudFarmInteract('band');
    }
}

async function confirmRetireToStud(horseIdx) {
    const horse = GameState.horses[horseIdx];
    if (!horse) return;
    const ok = await gameConfirm('Retire to the Paddocks',
        `${horse.name} will never race again. She joins the broodmare band at £${formatMoney(BROODMARE_KEEP_PER_SEASON)} a season. Continue?`);
    if (!ok) return;
    if (retireToStud(horseIdx)) {
        updateYardHUD();
        handleStudFarmInteract('band');
    }
}

function handlePaddockInteract() {
    const eligible = GameState.horses
        .map((h, i) => ({ horse: h, idx: i }));
    const turnedOut = eligible.filter(x => x.horse.paddockTurnedOut);
    const notOut = eligible.filter(x => !x.horse.paddockTurnedOut);

    let rows = '';
    if (turnedOut.length > 0) {
        rows += '<p style="font-weight:600;margin-bottom:var(--space-xs)">Currently turned out:</p>';
        rows += turnedOut.map(x => {
            const h = x.horse;
            const condColor = h.condition >= 70 ? 'var(--color-success)' : h.condition >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
            return `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                <span class="stat-label">${h.name} — <span style="color:${condColor};">${h.condition}%</span></span>
                <button class="btn btn-small" onclick="bringInHorse(${x.idx})">Bring In</button>
            </div>`;
        }).join('');
    }
    if (notOut.length > 0 || eligible.length === 0) {
        if (eligible.length === 0) {
            rows += '<p>You have no horses to turn out.</p>';
        } else if (notOut.length > 0) {
            rows += `<p style="font-weight:600;margin-top:var(--space-sm);margin-bottom:var(--space-xs)">In barn:</p>`;
            rows += notOut.map(x => {
                const h = x.horse;
                const condColor = h.condition >= 70 ? 'var(--color-success)' : h.condition >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
                const injuryInfo = h.isInjured ? ` — <span style="color:var(--color-danger);">Injured</span>` : '';
                return `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                    <span class="stat-label">${h.name} — <span style="color:${condColor};">${h.condition}%</span>${injuryInfo}</span>
                    <span class="stat-value" style="color:var(--color-text-muted);font-size:0.8rem">Lead from stall</span>
                </div>`;
            }).join('');
        }
    }
    showYardPanel(`
        <h3>Paddock</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Lead horses from their stall to turn them out. +15-20 condition, -1 injury recovery race.</p>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${rows}
    `);
}

function leadHorseFromStall(stallIdx) {
    if (YardState.carryingTack || YardState.carryingBucket || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow) {
        showYardPanel('<h3>Hands Full</h3><p>Put that down first!</p>');
        return;
    }
    const horses = GameState.horses;
    if (stallIdx >= horses.length) return;
    const horse = horses[stallIdx];
    if (horse.paddockTurnedOut || horse.isInjured) return;
    YardState.leadingHorse = { horseIdx: stallIdx, horseName: horse.name, returning: false };
    closeYardPanel();
    updateCarryingIndicator();
    // Rebuild barn so the horse disappears from its stall
    if (YardState.currentZone === 'barn') {
        buildZoneMap();
        buildBarnContents();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
        });
    }
}

function handlePaddockDeliverHorse() {
    const leading = YardState.leadingHorse;
    if (!leading) return;
    const horse = GameState.horses[leading.horseIdx];
    if (!horse) {
        YardState.leadingHorse = null;
        updateCarryingIndicator();
        return;
    }

    horse.paddockTurnedOut = true;
    const condGain = randomInt(15, 20);
    horse.condition = Math.min(100, horse.condition + condGain);
    if (horse.isInjured) {
        horse.recoveryRacesLeft = Math.max(0, horse.recoveryRacesLeft - 1);
        if (horse.recoveryRacesLeft <= 0) {
            horse.isInjured = false;
            horse.injuryType = null;
        }
    }

    YardState.leadingHorse = null;
    updateCarryingIndicator();
    updateYardHUD();

    // Rebuild outdoor decorations to show horse in paddock
    if (YardState.currentZone === 'outdoor') {
        buildZoneMap();
        buildOutdoorBuildings();
        buildOutdoorDecorations();
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
        });
    }

    showYardPanel(`<h3>Paddock Turnout</h3>
        <p><strong>${horse.name}</strong> has been turned out!</p>
        <div class="yard-stat-row"><span class="stat-label">Condition</span><span class="stat-value" style="color:var(--color-success)">+${condGain}%</span></div>
        ${horse.isInjured === false && horse.injuryType === null ? '' : horse.isInjured ? `<div class="yard-stat-row"><span class="stat-label">Recovery</span><span class="stat-value" style="color:var(--color-success)">-1 race</span></div>` : ''}
        <p style="margin-top:var(--space-sm);color:var(--color-success);font-weight:600">Enjoying the paddock!</p>`);
}

function bringInHorse(horseIdx) {
    if (YardState.carryingTack) {
        showYardPanel('<h3>Hands Full</h3><p>Put down the tack first!</p>');
        return;
    }
    if (YardState.carryingBucket) {
        showYardPanel('<h3>Hands Full</h3><p>Put down the bucket first!</p>');
        return;
    }
    if (YardState.leadingHorse) {
        showYardPanel('<h3>Already Leading</h3><p>You\'re already leading a horse!</p>');
        return;
    }
    const horse = GameState.horses[horseIdx];
    if (!horse || !horse.paddockTurnedOut) return;
    const stallIdx = horseIdx;
    YardState.leadingHorse = { horseIdx: stallIdx, horseName: horse.name, returning: true };
    closeYardPanel();
    updateCarryingIndicator();
}

function handleStallReturnHorse(ia) {
    const leading = YardState.leadingHorse;
    if (!leading || !leading.returning) return;
    const stallIdx = ia.stallIdx;
    if (stallIdx !== leading.horseIdx) {
        showYardPanel(`<h3>Wrong Stall</h3><p>This isn't ${leading.horseName}'s stall. Find the right one!</p>`);
        return;
    }
    const horse = GameState.horses[stallIdx];
    if (horse) {
        horse.paddockTurnedOut = false;
    }
    YardState.leadingHorse = null;
    updateCarryingIndicator();
    // Rebuild barn so the horse reappears in its stall
    buildZoneMap();
    buildBarnContents();
    requestAnimationFrame(() => {
        updatePlayerPosition2D();
        updateCamera2D();
    });
    showYardPanel(`<h3>${leading.horseName}</h3><p>${leading.horseName} has been returned to the stall.</p>`);
}

// --- Mechanics & Lorry ---

function handleMechanicsInteract() {
    const lorryRow = GameState.ownsLorry
        ? `<div class="yard-buy-row"><span>Horse Lorry</span><span style="color:var(--color-success);font-weight:600;">Purchased</span></div>`
        : `<div class="yard-buy-row"><span>Horse Lorry (\u00A3${formatMoney(70000)})</span>
           <button class="yard-buy-btn" ${GameState.budget >= 70000 ? '' : 'disabled'} onclick="buyLorry()">Buy</button></div>`;

    const carRow = GameState.ownsCar
        ? `<div class="yard-buy-row"><span>Car (2x yard speed)</span><span style="color:var(--color-success);font-weight:600;">Purchased</span></div>`
        : `<div class="yard-buy-row"><span>Car (\u00A3${formatMoney(30000)}) \u2014 2x yard speed</span>
           <button class="yard-buy-btn" ${GameState.budget >= 30000 ? '' : 'disabled'} onclick="buyCar()">Buy</button></div>`;

    showYardPanel(`
        <h3>Mechanics</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Vehicles for getting around.</p>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">\u00A3${formatMoney(GameState.budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${lorryRow}
        ${carRow}
    `);
}

function buyLorry() {
    if (GameState.budget < 70000) return;
    GameState.ownsLorry = true;
    GameState.budget -= 70000;
    updateYardHUD();
    // Refresh outdoor decorations to show parked lorry
    document.querySelectorAll('#yard-world .yard-decoration').forEach(el => el.remove());
    const parked = document.getElementById('yard-parked-lorry');
    if (parked) parked.remove();
    buildOutdoorDecorations();
    // Re-show panel with confirmation
    showYardPanel(`
        <h3>Mechanics</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-success);">Congratulations! Your new horse lorry has been delivered and is parked outside the barn.</p>
    `);
}

function handleCarInteract() {
    if (!GameState.ownsCar) {
        showYardPanel(`<h3>Car</h3><p>You don't own a car. Visit the Mechanics to buy one.</p>`);
        return;
    }
    if (YardState.inCar) {
        // Get out of car
        YardState.inCar = false;
        const player = document.getElementById('yard-player');
        if (player) {
            player.classList.remove('car-mode');
            player.style.width = '';
            player.style.height = '';
        }
        updateCarryingIndicator();
    } else {
        // Get in car - block if carrying anything
        if (YardState.carryingBucket || YardState.carryingTack || YardState.leadingHorse || YardState.carryingWaterBucket || YardState.carryingHay || YardState.carryingWheelbarrow) {
            showYardPanel(`<h3>Car</h3><p>Put down what you're carrying first!</p>`);
            return;
        }
        YardState.inCar = true;
        const player = document.getElementById('yard-player');
        if (player) {
            player.classList.add('car-mode');
            player.style.width = '36px';
            player.style.height = '24px';
        }
        updateCarryingIndicator();
    }
}

function buyCar() {
    if (GameState.budget < 30000) return;
    GameState.ownsCar = true;
    GameState.budget -= 30000;
    updateYardHUD();
    // Refresh outdoor to show parked car
    document.querySelectorAll('#yard-world .yard-decoration').forEach(el => el.remove());
    buildOutdoorDecorations();
    handleMechanicsInteract();
}

function handleLorryInteract() {
    if (!GameState.ownsLorry) {
        showYardPanel(`
            <h3>Horse Lorry</h3>
            <p>You don't own a lorry. Visit the Mechanics to buy one.</p>
        `);
        return;
    }
    const eligible = GameState.horses
        .map((h, i) => ({ horse: h, idx: i }))
        .filter(x => !x.horse.isYearling && !x.horse.isInjured);
    let rows = '';
    if (eligible.length === 0) {
        rows = '<p>No eligible horses to transport. Yearlings and injured horses cannot travel.</p>';
    } else {
        rows = eligible.map(x => {
            const h = x.horse;
            const condColor = h.condition >= 70 ? 'var(--color-success)' : h.condition >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
            return `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                <span class="stat-label">${h.name} — <span style="color:${condColor};">${h.condition}%</span></span>
                <button class="btn btn-small" onclick="loadHorseInLorry(${x.idx})">Load & Drive</button>
            </div>`;
        }).join('');
    }
    showYardPanel(`
        <h3>Horse Lorry</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Select a horse to load into the lorry and drive to the racecourse.</p>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${rows}
    `);
}

function loadHorseInLorry(horseIdx) {
    closeYardPanel();
    YardState.lorryMode = true;
    YardState.lorryHorseIdx = horseIdx;
    // Swap player SVG to lorry
    const player = document.getElementById('yard-player');
    player.classList.add('lorry-mode');
    player.innerHTML = `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" class="player-svg">
        <rect x="1" y="4" width="30" height="22" rx="2" fill="#4a8a3a" stroke="#2e6a24" stroke-width="1.5"/>
        <rect x="3" y="6" width="26" height="18" rx="1" fill="#5a9a4a"/>
        <path d="M10,10 Q12,8 14,10 L14,16 Q12,18 10,16 Z" fill="#3a7a2a" opacity="0.6"/>
        <rect x="31" y="8" width="16" height="18" rx="2" fill="#3a7a2a" stroke="#2e6a24" stroke-width="1.5"/>
        <rect x="35" y="10" width="8" height="6" rx="1" fill="#8ad0f0" stroke="#5aa0c0" stroke-width="0.8"/>
        <circle cx="10" cy="28" r="3" fill="#333" stroke="#555" stroke-width="1"/>
        <circle cx="24" cy="28" r="3" fill="#333" stroke="#555" stroke-width="1"/>
        <circle cx="40" cy="28" r="3" fill="#333" stroke="#555" stroke-width="1"/>
    </svg>`;
    // Hide parked lorry decoration
    const parked = document.getElementById('yard-parked-lorry');
    if (parked) parked.style.display = 'none';
    updatePlayerPosition2D();
    checkInteractable2D();
}

function handleLorryExit() {
    if (YardState._currentInteractable && YardState._currentInteractable.handler === 'racecourse') {
        RaceState._lorryHorseIdx = YardState.lorryHorseIdx;
        exitLorryMode();
        leaveYardForScreen();
        openRaces();
    } else {
        exitLorryMode();
    }
}

function exitLorryMode() {
    YardState.lorryMode = false;
    YardState.lorryHorseIdx = null;
    // Restore player SVG
    const player = document.getElementById('yard-player');
    player.classList.remove('lorry-mode');
    player.innerHTML = `<svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" class="player-svg">
        <ellipse cx="12" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.15)"/>
        <rect x="9" y="18" width="2.5" height="10" rx="1" fill="#3a3028"/>
        <rect x="12.5" y="18" width="2.5" height="10" rx="1" fill="#332a22"/>
        <rect x="9" y="27" width="2.5" height="2" rx="0.5" fill="#1a1208"/>
        <rect x="12.5" y="27" width="2.5" height="2" rx="0.5" fill="#1a1208"/>
        <path d="M7,18 Q7,12 12,10 Q17,12 17,18 Z" class="yard-player-jacket"/>
        <rect x="5" y="12" width="3" height="8" rx="1.5" class="yard-player-arm-l"/>
        <rect x="16" y="12" width="3" height="8" rx="1.5" class="yard-player-arm-r"/>
        <circle cx="12" cy="8" r="3.5" fill="#f0d0a0"/>
        <path d="M8,7 Q8,3 12,2 Q16,3 16,7 Q16,5.5 14,5 Q10,5 8,7 Z" class="yard-player-cap"/>
        <circle cx="13.5" cy="7.8" r="0.5" fill="#333"/>
    </svg>`;
    // Show parked lorry again
    const parked = document.getElementById('yard-parked-lorry');
    if (parked) parked.style.display = '';
    updatePlayerPosition2D();
    checkInteractable2D();
}

// --- Panel ---

// ============================================
// STAFF SYSTEM
// ============================================

const STAFF_FIRST_NAMES = [
    'Jack', 'Tom', 'Ben', 'Sam', 'Will', 'Charlie', 'Harry', 'Alfie',
    'Emily', 'Sarah', 'Lucy', 'Megan', 'Kate', 'Alice', 'Rachel', 'Hannah',
    'James', 'George', 'Oliver', 'Daniel', 'Sophie', 'Emma', 'Chloe', 'Isla'
];
const STAFF_LAST_NAMES = [
    'Smith', 'Jones', 'Taylor', 'Wilson', 'Brown', 'Evans', 'Thomas', 'Roberts',
    'Walker', 'Wright', 'Turner', 'Hill', 'Clarke', 'Ward', 'Murray', 'Bell'
];

function generateStaffName() {
    return `${STAFF_FIRST_NAMES[randomInt(0, STAFF_FIRST_NAMES.length - 1)]} ${STAFF_LAST_NAMES[randomInt(0, STAFF_LAST_NAMES.length - 1)]}`;
}

function getRequiredStaffCount() {
    const horseCount = GameState.horses.length;
    if (horseCount < 3) return 0;
    return Math.ceil(horseCount / 3);
}

/**
 * Shortage is now about coverage, not headcount - two good staff can watch
 * over more horses than four poor ones.
 */
function isStaffShortage() {
    if (GameState.horses.length < 3) return false;
    return getStaffCoverage() < GameState.horses.length;
}

/**
 * Candidates on the books at the Racing School. Refreshed as they're hired.
 */
function generateStaffCandidate() {
    const roll = Math.random();
    const skill = roll < 0.28 ? 1 : roll < 0.56 ? 2 : roll < 0.80 ? 3 : roll < 0.94 ? 4 : 5;
    return {
        id: generateId(),
        name: generateStaffName(),
        skill: skill
    };
}

function getStaffCandidates() {
    if (!GameState.staffCandidates || GameState.staffCandidates.length < 3) {
        GameState.staffCandidates = GameState.staffCandidates || [];
        while (GameState.staffCandidates.length < 3) {
            GameState.staffCandidates.push(generateStaffCandidate());
        }
    }
    return GameState.staffCandidates;
}

function handleRacingSchoolInteract() {
    const current = GameState.staff.length;
    const horseCount = GameState.horses.length;
    const shortage = isStaffShortage();
    const coverage = getStaffCoverage();
    const totalWages = GameState.staff.reduce((sum, s) => sum + getStaffWage(s), 0);

    let staffListHTML = '';
    if (current > 0) {
        staffListHTML = '<p style="font-weight:600;margin-bottom:var(--space-xs);">On the payroll</p><div style="margin-bottom:var(--space-sm);">';
        GameState.staff.forEach((s, i) => {
            const tier = getStaffTier(s);
            const busyText = s.busy ? `<span style="color:var(--color-secondary)">Busy: ${s.busyTask}</span>` : '<span style="color:var(--color-success)">Available</span>';
            staffListHTML += `<div class="yard-stat-row" style="margin-bottom:var(--space-xs);">
                <span class="stat-label">${s.name}<br><small style="color:var(--color-text-muted);">${tier.title} \u00B7 ${'\u2605'.repeat(s.skill || 3)}${'\u2606'.repeat(5 - (s.skill || 3))} \u00B7 watches ${tier.horsesCovered}</small></span>
                <span class="stat-value">\u00A3${formatMoney(getStaffWage(s))}<br><small>${busyText}</small></span>
                <button class="btn btn-small" style="margin-left:4px;background:var(--color-danger);font-size:0.7rem;" onclick="dismissStaff(${i})">Dismiss</button>
            </div>`;
        });
        staffListHTML += '</div>';
    }

    const candidateHTML = getStaffCandidates().map(c => {
        const tier = STAFF_TIERS[c.skill];
        const canAfford = GameState.budget >= tier.wage;
        const signalBlurb = tier.signal === 'none'
            ? 'Will not spot a problem before it bites'
            : tier.signal === 'vague'
                ? `Notices when a horse isn't right, ${tier.leadTime} raceday${tier.leadTime === 1 ? '' : 's'} ahead`
                : `Names the problem up to ${tier.leadTime} racedays ahead`;
        return `<div class="staff-candidate">
            <div class="staff-candidate-head">
                <span class="staff-candidate-name">${c.name}</span>
                <span class="staff-candidate-stars">${'\u2605'.repeat(c.skill)}${'\u2606'.repeat(5 - c.skill)}</span>
            </div>
            <div class="staff-candidate-role">${tier.title}</div>
            <div class="staff-candidate-blurb">${signalBlurb} \u00B7 watches over ${tier.horsesCovered} horses</div>
            <div class="yard-buy-row">
                <span>\u00A3${formatMoney(tier.wage)}/season</span>
                <button class="yard-buy-btn" ${canAfford ? '' : 'disabled'} onclick="hireStaff('${c.id}')">Hire</button>
            </div>
        </div>`;
    }).join('');

    const shortageWarning = shortage ? `<p style="color:var(--color-danger);font-weight:600;margin-top:var(--space-sm);">
        Your staff can only keep an eye on ${coverage} of ${horseCount} horses. The rest go unwatched.</p>` : '';

    showYardPanel(`
        <h3>Racing School</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Hire staff to run the yard. Better staff spot trouble in a horse before it costs you anything.</p>
        <div class="yard-stat-row"><span class="stat-label">Horses</span><span class="stat-value">${horseCount}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Horses Watched</span><span class="stat-value" style="color:${shortage ? 'var(--color-danger)' : 'var(--color-success)'}">${Math.min(coverage, horseCount)} / ${horseCount}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Staff Employed</span><span class="stat-value">${current}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Wages / Season</span><span class="stat-value">\u00A3${formatMoney(totalWages)}</span></div>
        ${shortageWarning}
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${staffListHTML}
        <p style="font-weight:600;margin-bottom:var(--space-xs);">Available for hire</p>
        ${candidateHTML}
        <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:var(--space-xs);">Press SPACE in the barn to assign tasks.</p>
    `);
}

function hireStaff(candidateId) {
    const candidates = getStaffCandidates();
    const candidate = candidateId
        ? candidates.find(c => c.id === candidateId)
        : candidates[0];
    if (!candidate) return;

    const tier = STAFF_TIERS[candidate.skill];
    if (GameState.budget < tier.wage) return;
    GameState.budget -= tier.wage;

    GameState.staff.push({
        id: candidate.id,
        name: candidate.name,
        skill: candidate.skill,
        wage: tier.wage,
        busy: false,
        busyTask: null,
        busyHorseIdx: null
    });

    GameState.staffCandidates = candidates.filter(c => c.id !== candidate.id);
    getStaffCandidates(); // top the pool back up

    updateYardHUD();
    handleRacingSchoolInteract(); // Refresh panel
}

function dismissStaff(staffIdx) {
    if (staffIdx < 0 || staffIdx >= GameState.staff.length) return;
    GameState.staff.splice(staffIdx, 1);
    handleRacingSchoolInteract(); // Refresh panel
}

/**
 * Staff wages deducted at season start
 */
function deductStaffWages() {
    const totalWages = GameState.staff.reduce((sum, s) => sum + getStaffWage(s), 0);
    GameState.budget -= totalWages;
    return totalWages;
}

/**
 * Open the staff task assignment menu (triggered by pressing SPACE in barn)
 */
function openStaffTaskMenu() {
    const availableStaff = GameState.staff.filter(s => !s.busy);
    if (availableStaff.length === 0) {
        showYardPanel(`<h3>Staff</h3><p>All staff are currently busy with tasks.</p>`);
        return;
    }

    const horses = GameState.horses;
    if (horses.length === 0) {
        showYardPanel(`<h3>Staff</h3><p>No horses in the barn to assign tasks for.</p>`);
        return;
    }

    // Build task selection panel with dropdowns
    let html = `<h3>Assign Staff Task</h3>
        <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Select a task and horse for your staff member.</p>`;

    html += `<div style="margin-bottom:var(--space-sm);">
        <label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:4px;">Task:</label>
        <select id="staff-task-select" style="width:100%;padding:6px 8px;border:1px solid var(--color-bg-dark);border-radius:var(--radius-sm);font-size:0.9rem;" onchange="updateStaffTaskPreview()">
            <option value="">-- Select task --</option>
            <option value="feed">Feed horse</option>
            <option value="water">Water horse</option>
            <option value="hay">Hay horse</option>
            <option value="muck-out">Muck out stall</option>
            <option value="tack-saddle">Tack up (saddle)</option>
            <option value="tack-bridle">Tack up (bridle)</option>
        </select>
    </div>`;

    html += `<div style="margin-bottom:var(--space-sm);">
        <label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:4px;">Horse:</label>
        <select id="staff-horse-select" style="width:100%;padding:6px 8px;border:1px solid var(--color-bg-dark);border-radius:var(--radius-sm);font-size:0.9rem;">
            <option value="">-- Select horse --</option>
            ${horses.map((h, i) => `<option value="${i}">${h.name}${h.isYearling ? ' (Yearling)' : ''}</option>`).join('')}
        </select>
    </div>`;

    html += `<div id="staff-task-preview" style="margin-bottom:var(--space-sm);min-height:20px;"></div>`;

    html += `<button class="btn btn-primary" style="width:100%;" onclick="assignStaffTask()">Send Staff</button>`;

    showYardPanel(html);
}

function updateStaffTaskPreview() {
    const preview = document.getElementById('staff-task-preview');
    if (!preview) return;
    const task = document.getElementById('staff-task-select')?.value;
    const horseIdx = parseInt(document.getElementById('staff-horse-select')?.value);

    if (!task || isNaN(horseIdx)) {
        preview.innerHTML = '';
        return;
    }

    const horse = GameState.horses[horseIdx];
    if (!horse) { preview.innerHTML = ''; return; }

    const care = horse.stallCare || {};
    let info = '';
    switch (task) {
        case 'feed':
            info = `Feed level: <strong style="color:${care.feedLevel >= 50 ? 'var(--color-success)' : 'var(--color-danger)'}">${care.feedLevel || 0}%</strong>`;
            break;
        case 'water':
            info = `Water level: <strong style="color:${care.waterLevel >= 50 ? 'var(--color-success)' : 'var(--color-danger)'}">${care.waterLevel || 0}%</strong>`;
            break;
        case 'hay':
            info = `Hay level: <strong style="color:${care.hayLevel >= 50 ? 'var(--color-success)' : 'var(--color-danger)'}">${care.hayLevel || 0}%</strong>`;
            break;
        case 'muck-out':
            info = `Manure piles: <strong style="color:${care.manurePiles > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">${care.manurePiles || 0}</strong>`;
            break;
        case 'tack-saddle':
            info = `Saddle: <strong style="color:${horse.tackedUp?.saddle ? 'var(--color-success)' : 'var(--color-warning)'}">${horse.tackedUp?.saddle ? 'Already on' : 'Not equipped'}</strong> (Stock: ${GameState.tack.saddles})`;
            break;
        case 'tack-bridle':
            info = `Bridle: <strong style="color:${horse.tackedUp?.bridle ? 'var(--color-success)' : 'var(--color-warning)'}">${horse.tackedUp?.bridle ? 'Already on' : 'Not equipped'}</strong> (Stock: ${GameState.tack.bridles})`;
            break;
    }
    preview.innerHTML = `<span style="font-size:0.8rem;">${info}</span>`;
}

function assignStaffTask() {
    const taskSelect = document.getElementById('staff-task-select');
    const horseSelect = document.getElementById('staff-horse-select');
    if (!taskSelect || !horseSelect) return;

    const task = taskSelect.value;
    const horseIdx = parseInt(horseSelect.value);
    if (!task || isNaN(horseIdx)) {
        showYardPanel(`<h3>Staff</h3><p style="color:var(--color-danger);">Please select both a task and a horse.</p>
            <button class="btn btn-secondary" style="margin-top:var(--space-sm);" onclick="openStaffTaskMenu()">Back</button>`);
        return;
    }

    const horse = GameState.horses[horseIdx];
    if (!horse) return;

    const availableStaff = GameState.staff.filter(s => !s.busy);
    if (availableStaff.length === 0) {
        showYardPanel(`<h3>Staff</h3><p>No available staff! Wait for current tasks to finish.</p>`);
        return;
    }

    // Validate task
    let validationError = null;
    switch (task) {
        case 'feed':
            if ((horse.stallCare?.feedLevel || 0) >= 100) validationError = `${horse.name}'s feed is already full.`;
            if (GameState.feedSupply <= 0) validationError = 'No feed supply! Visit the Feed Mill.';
            break;
        case 'water':
            if ((horse.stallCare?.waterLevel || 0) >= 100) validationError = `${horse.name}'s water is already full.`;
            break;
        case 'hay':
            if ((horse.stallCare?.hayLevel || 0) >= 100) validationError = `${horse.name}'s hay is already full.`;
            if ((GameState.forage?.hay || 0) <= 0) validationError = 'No hay in stock! Visit Forage & Bedding.';
            break;
        case 'muck-out':
            if ((horse.stallCare?.manurePiles || 0) <= 0) validationError = `${horse.name}'s stall is clean.`;
            break;
        case 'tack-saddle':
            if (horse.tackedUp?.saddle) validationError = `${horse.name} already has a saddle on.`;
            else if (GameState.tack.saddles <= 0) validationError = 'No saddles available! Visit the Tack Store.';
            break;
        case 'tack-bridle':
            if (horse.tackedUp?.bridle) validationError = `${horse.name} already has a bridle on.`;
            else if (GameState.tack.bridles <= 0) validationError = 'No bridles available! Visit the Tack Store.';
            break;
    }

    if (validationError) {
        showYardPanel(`<h3>Staff</h3><p style="color:var(--color-warning);">${validationError}</p>
            <button class="btn btn-secondary" style="margin-top:var(--space-sm);" onclick="openStaffTaskMenu()">Back</button>`);
        return;
    }

    // Assign the first available staff member
    const staffMember = availableStaff[0];
    staffMember.busy = true;
    staffMember.busyTask = getTaskLabel(task);
    staffMember.busyHorseIdx = horseIdx;

    const taskLabels = {
        'feed': 'making feed for',
        'water': 'watering',
        'hay': 'haying',
        'muck-out': 'mucking out the stall of',
        'tack-saddle': 'saddling up',
        'tack-bridle': 'bridling up'
    };

    closeYardPanel();

    // Spawn staff NPC animation in barn
    spawnStaffAnimation(staffMember, task, horseIdx, horse);
}

function getTaskLabel(task) {
    const labels = {
        'feed': 'Feeding',
        'water': 'Watering',
        'hay': 'Haying',
        'muck-out': 'Mucking Out',
        'tack-saddle': 'Saddling',
        'tack-bridle': 'Bridling'
    };
    return labels[task] || task;
}

function getStaffTaskBeforeValues(horse, task) {
    const care = horse.stallCare || { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
    switch (task) {
        case 'feed': return { label: 'Feed', value: care.feedLevel, unit: '%' };
        case 'water': return { label: 'Water', value: care.waterLevel, unit: '%' };
        case 'hay': return { label: 'Hay', value: care.hayLevel, unit: '%' };
        case 'muck-out': return { label: 'Manure', value: care.manurePiles, unit: ' piles' };
        case 'tack-saddle': return { label: 'Saddle', value: horse.tackedUp?.saddle ? 'On' : 'Off', unit: '' };
        case 'tack-bridle': return { label: 'Bridle', value: horse.tackedUp?.bridle ? 'On' : 'Off', unit: '' };
        default: return { label: task, value: 0, unit: '' };
    }
}

function getStaffTaskAfterValues(horse, task) {
    const care = horse.stallCare || { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };
    switch (task) {
        case 'feed': return { label: 'Feed', value: care.feedLevel, unit: '%' };
        case 'water': return { label: 'Water', value: care.waterLevel, unit: '%' };
        case 'hay': return { label: 'Hay', value: care.hayLevel, unit: '%' };
        case 'muck-out': return { label: 'Manure', value: care.manurePiles, unit: ' piles' };
        case 'tack-saddle': return { label: 'Saddle', value: horse.tackedUp?.saddle ? 'On' : 'Off', unit: '' };
        case 'tack-bridle': return { label: 'Bridle', value: horse.tackedUp?.bridle ? 'On' : 'Off', unit: '' };
        default: return { label: task, value: 0, unit: '' };
    }
}

function showStaffTaskStatChange(npc, horseName, task, before, after) {
    const popup = document.createElement('div');
    popup.style.cssText = 'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;z-index:100;pointer-events:none;animation:staffStatPopup 3s ease forwards;';
    const changeText = (typeof before.value === 'number' && typeof after.value === 'number')
        ? `${before.label}: ${before.value}${before.unit} → ${after.value}${after.unit}`
        : `${before.label}: ${before.value} → ${after.value}`;
    popup.innerHTML = `<strong>${horseName}</strong><br>${changeText}`;
    npc.appendChild(popup);

    // Also update the barn status board if visible
    if (YardState.currentZone === 'barn') {
        updateBarnStatusBoard();
    }
}

/**
 * Spawn a staff NPC in the barn that walks to the task location, performs the task,
 * then disappears. Applies the task effect.
 */
function spawnStaffAnimation(staffMember, task, horseIdx, horse) {
    const world = document.getElementById('yard-world');
    if (!world || YardState.currentZone !== 'barn') {
        // If not in barn, just apply the effect immediately
        applyStaffTaskEffect(staffMember, task, horseIdx, horse);
        return;
    }

    // Calculate stall position in barn grid
    // Left stalls: horseIdx 0..stallsPerSide-1, Right stalls: horseIdx stallsPerSide..maxStalls-1
    const stallsPerSide = Math.floor(GameState.maxStalls / 2);
    const isLeftStall = horseIdx < stallsPerSide;
    const stallSlot = isLeftStall ? horseIdx : horseIdx - stallsPerSide;

    // Staff NPC starting position (bottom of barn aisle)
    const lastRow = YardState.barnMap ? YardState.barnMap.length - 1 : 20;
    const startCol = 7;

    // Target position (the stall door row)
    const baseRow = 1 + stallSlot * 3;
    const targetRow = baseRow + 1;         // door row
    const targetCol = isLeftStall ? 4 : 9; // door col

    // Create staff NPC element
    const npc = document.createElement('div');
    npc.className = 'staff-npc';
    npc.style.position = 'absolute';
    npc.style.left = `${startCol * TILE_SIZE}px`;
    npc.style.top = `${lastRow * TILE_SIZE}px`;
    npc.style.width = `${TILE_SIZE}px`;
    npc.style.height = `${TILE_SIZE * 1.2}px`;
    npc.style.zIndex = '50';
    npc.style.transition = 'left 0.3s ease, top 0.3s ease';
    npc.innerHTML = `
        <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
            <ellipse cx="12" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.15)"/>
            <rect x="9" y="18" width="2.5" height="10" rx="1" fill="#2a4a6a"/>
            <rect x="12.5" y="18" width="2.5" height="10" rx="1" fill="#24406a"/>
            <rect x="9" y="27" width="2.5" height="2" rx="0.5" fill="#1a1208"/>
            <rect x="12.5" y="27" width="2.5" height="2" rx="0.5" fill="#1a1208"/>
            <path d="M7,18 Q7,12 12,10 Q17,12 17,18 Z" fill="#3a7a4a"/>
            <rect x="5" y="12" width="3" height="8" rx="1.5" fill="#3a7a4a"/>
            <rect x="16" y="12" width="3" height="8" rx="1.5" fill="#3a7a4a"/>
            <circle cx="12" cy="8" r="3.5" fill="#f0d0a0"/>
            <path d="M8,7 Q8,3 12,2 Q16,3 16,7 Q16,5.5 14,5 Q10,5 8,7 Z" fill="#2a5a3a"/>
            <circle cx="13.5" cy="7.8" r="0.5" fill="#333"/>
        </svg>
    `;

    // Add name label
    const label = document.createElement('div');
    label.className = 'staff-npc-label';
    label.textContent = staffMember.name.split(' ')[0];
    label.style.cssText = 'position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-size:8px;color:#fff;background:rgba(0,0,0,0.6);padding:1px 4px;border-radius:2px;white-space:nowrap;';
    npc.appendChild(label);

    world.appendChild(npc);

    // Animate: walk up the aisle to the stall, pause, then walk back and disappear
    const stepDelay = 300;
    const steps = [];

    // Walk up the aisle
    const aisleCol = 7;
    for (let r = lastRow - 1; r >= targetRow; r--) {
        steps.push({ r, c: aisleCol });
    }
    // Turn to stall door
    if (targetCol < aisleCol) {
        for (let c = aisleCol - 1; c >= targetCol; c--) {
            steps.push({ r: targetRow, c });
        }
    } else {
        for (let c = aisleCol + 1; c <= targetCol; c++) {
            steps.push({ r: targetRow, c });
        }
    }

    let stepIdx = 0;

    function animateStep() {
        if (stepIdx < steps.length) {
            const step = steps[stepIdx];
            npc.style.left = `${step.c * TILE_SIZE}px`;
            npc.style.top = `${step.r * TILE_SIZE}px`;
            stepIdx++;
            setTimeout(animateStep, stepDelay);
        } else {
            // At the stall - perform task (pause)
            npc.style.opacity = '0.8';
            label.textContent = getTaskLabel(task) + '...';
            setTimeout(() => {
                // Capture before values
                const before = getStaffTaskBeforeValues(horse, task);

                // Apply the effect
                applyStaffTaskEffect(staffMember, task, horseIdx, horse);

                // Capture after values and show floating stat change
                const after = getStaffTaskAfterValues(horse, task);
                showStaffTaskStatChange(npc, horse.name, task, before, after);

                // Walk back down
                label.textContent = 'Done!';
                npc.style.opacity = '1';

                const returnSteps = [...steps].reverse();
                let retIdx = 0;

                function animateReturn() {
                    if (retIdx < returnSteps.length) {
                        const step = returnSteps[retIdx];
                        npc.style.left = `${step.c * TILE_SIZE}px`;
                        npc.style.top = `${step.r * TILE_SIZE}px`;
                        retIdx++;
                        setTimeout(animateReturn, stepDelay / 2);
                    } else {
                        npc.remove();
                        // Rebuild barn contents to reflect changes
                        if (YardState.currentZone === 'barn') {
                            buildBarnContents();
                        }
                    }
                }
                setTimeout(animateReturn, 500);
            }, 2000);
        }
    }

    setTimeout(animateStep, 300);
}

/**
 * Apply the actual effect of a staff task
 */
function applyStaffTaskEffect(staffMember, task, horseIdx, horse) {
    if (!horse.stallCare) horse.stallCare = { feedLevel: 100, waterLevel: 100, hayLevel: 100, manurePiles: 0, beddingQuality: 100 };

    switch (task) {
        case 'feed':
            horse.stallCare.feedLevel = Math.min(100, horse.stallCare.feedLevel + 50);
            if (GameState.feedSupply > 0) GameState.feedSupply--;
            horse.fedThisRound = true;
            break;
        case 'water':
            horse.stallCare.waterLevel = 100;
            break;
        case 'hay':
            horse.stallCare.hayLevel = 100;
            if (GameState.forage && GameState.forage.hay > 0) GameState.forage.hay--;
            break;
        case 'muck-out':
            if (horse.stallCare.manurePiles > 0) {
                horse.stallCare.manurePiles--;
                horse.stallCare.beddingQuality = Math.max(0, 100 - horse.stallCare.manurePiles * 25);
            }
            break;
        case 'tack-saddle':
            if (!horse.tackedUp) horse.tackedUp = { saddle: false, bridle: false };
            if (!horse.tackedUp.saddle && GameState.tack.saddles > 0) {
                horse.tackedUp.saddle = true;
                GameState.tack.saddles--;
            }
            break;
        case 'tack-bridle':
            if (!horse.tackedUp) horse.tackedUp = { saddle: false, bridle: false };
            if (!horse.tackedUp.bridle && GameState.tack.bridles > 0) {
                horse.tackedUp.bridle = true;
                GameState.tack.bridles--;
            }
            break;
    }

    // Mark staff member as available again
    staffMember.busy = false;
    staffMember.busyTask = null;
    staffMember.busyHorseIdx = null;

    updateYardHUD();
}

function showYardPanel(contentHTML) {
    document.getElementById('yard-panel-content').innerHTML = contentHTML;
    document.getElementById('yard-panel').style.display = 'block';
    YardState.panelOpen = true;
}

function closeYardPanel() {
    const panel = document.getElementById('yard-panel');
    if (panel) panel.style.display = 'none';
    YardState.panelOpen = false;
}

// --- Economy Functions ---

function buyFeed(amount) {
    const unitPrice = 500;
    const cost = amount * unitPrice;
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `You need \u00A3${formatMoney(cost)} to buy ${amount} units of feed.`);
        return;
    }
    GameState.budget -= cost;
    GameState.feedSupply += amount;
    updateYardHUD();
    handleFeedMillInteract();
}

function buyTack(type, qty) {
    const prices = { saddles: 2000, bridles: 800, rugs: 400 };
    const cost = qty * prices[type];
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `You need \u00A3${formatMoney(cost)}.`);
        return;
    }
    GameState.budget -= cost;
    GameState.tack[type] += qty;
    updateYardHUD();
    handleTackStoreInteract();
}

function consumeFeed() {
    const horses = GameState.horses;
    if (horses.length === 0) return { consumed: 0, shortage: false };
    const fed = horses.filter(h => h.fedThisRound);
    const unfed = horses.filter(h => !h.fedThisRound);
    if (unfed.length > 0) {
        unfed.forEach(h => { h.condition = Math.max(0, h.condition - 15); });
        return { consumed: fed.length, shortage: true, missing: unfed.length };
    }
    return { consumed: horses.length, shortage: false };
}

function expandBarn() {
    const cost = 100000;
    if (GameState.maxStalls >= 20) {
        gameAlert('Maximum Size', 'The barn is already at maximum capacity (20 stalls).');
        return;
    }
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `Barn expansion costs \u00A3${formatMoney(cost)}.`);
        return;
    }
    GameState.budget -= cost;
    GameState.maxStalls += 2;
    GameState.barnExpansions++;
    updateYardHUD();
    if (YardState.currentZone === 'barn') {
        YardState.barnMap = generateBarnMap();
        YardState.barnInteractables = generateBarnInteractables();
        buildZoneMap();
        buildBarnContents();
        updatePlayerPosition2D();
        updateCamera2D();
        checkInteractable2D();
    }
    handleExpandBarn();
}

function buyForage(type, amount) {
    const prices = { hay: 300, straw: 200, shavings: 250, carrots: 100 };
    const cost = amount * prices[type];
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `You need \u00A3${formatMoney(cost)} to buy ${amount} bales of ${type}.`);
        return;
    }
    GameState.budget -= cost;
    GameState.forage[type] += amount;
    updateYardHUD();
    handleForageInteract();
}

function buyBarnUpgrade(upgrade) {
    const costs = { rubberMatting: 50000, autoWaterers: 75000, climateControl: 150000 };
    const labels = { rubberMatting: 'Rubber Matting', autoWaterers: 'Auto Waterers', climateControl: 'Climate Control' };
    const cost = costs[upgrade];
    if (GameState.barnUpgrades[upgrade]) {
        gameAlert('Already Purchased', `${labels[upgrade]} has already been installed.`);
        return;
    }
    if (GameState.budget < cost) {
        gameAlert('Insufficient Funds', `${labels[upgrade]} costs \u00A3${formatMoney(cost)}.`);
        return;
    }
    GameState.budget -= cost;
    GameState.barnUpgrades[upgrade] = true;
    updateYardHUD();
    handleSupplierInteract();
}

// --- Hub Routing ---

function openYardHub() {
    const centre = getActiveCentre();
    YardState.active = true;
    YardState.currentZone = 'outdoor';
    YardState.playerR = centre.playerStart.r;
    YardState.playerC = centre.playerStart.c;
    YardState.panelOpen = false;
    YardState._currentInteractable = null;
    YardState.lorryMode = false;
    YardState.lorryHorseIdx = null;
    YardState.inCar = false;
    YardState.bucketPile = [];
    YardState.carryingBucket = null;
    YardState.carryingTack = null;
    YardState.leadingHorse = null;
    YardState.carryingWaterBucket = false;
    YardState.carryingHay = false;
    YardState.carryingWheelbarrow = false;
    YardState.stallZoneHorseIdx = null;
    YardState.stallMap = null;
    YardState.stallInteractables = [];

    YardState.outdoorMap = generateOutdoorMap();
    YardState.barnMap = generateBarnMap();
    YardState.barnInteractables = generateBarnInteractables();

    // Check for pest spawns on yard entry
    checkPestSpawns();

    buildZoneMap();
    buildOutdoorBuildings();
    buildOutdoorDecorations();
    updateYardHUD();

    showScreen('yard');
    window.scrollTo(0, 0);

    // Start pet animation
    startPetAnimation();

    // Position player and camera after screen is visible (so viewport has dimensions)
    requestAnimationFrame(() => {
        updatePlayerPosition2D();
        updateCamera2D();
        checkInteractable2D();
    });

    if (YardState.keyHandler) {
        document.removeEventListener('keydown', YardState.keyHandler);
    }
    YardState.keyHandler = onYardKeyDown;
    document.addEventListener('keydown', YardState.keyHandler);
}

function returnToYard() {
    openYardHub();
}

function leaveYardForScreen() {
    YardState.active = false;
    closeYardPanel();
    if (YardState.keyHandler) {
        document.removeEventListener('keydown', YardState.keyHandler);
        YardState.keyHandler = null;
    }
}

function updateYardHUD() {
    const horses = GameState.horses;
    const el = id => document.getElementById(id);
    if (el('yard-stable-name')) el('yard-stable-name').textContent = GameState.stableName;
    if (el('yard-budget')) el('yard-budget').textContent = formatMoney(GameState.budget);
    if (el('yard-season')) el('yard-season').textContent = GameState.season;
    if (el('yard-feed-count')) el('yard-feed-count').textContent = GameState.feedSupply;
    if (el('yard-horse-count')) el('yard-horse-count').textContent = horses.length;
    if (el('yard-stall-count')) el('yard-stall-count').textContent = GameState.maxStalls;
    if (el('yard-reputation')) {
        const tier = getReputationTier();
        const repEl = el('yard-reputation');
        repEl.textContent = `${tier.label} ${Math.round(getReputation())}`;
        repEl.className = `rep-${tier.className}`;
    }
}

// Make functions globally available
window.selectRace = selectRace;
window.toggleHorseForRace = toggleHorseForRace;
window.setHorseStrategy = setHorseStrategy;
window.useWhip = useWhip;
window.buyPet = buyPet;
window.buyCar = buyCar;
window.quickEnterHorse = quickEnterHorse;
window.confirmBatchEntries = confirmBatchEntries;
window.toggleAuctionInterest = toggleAuctionInterest;
window.toggleAuctionSkip = toggleAuctionSkip;
window.handlePlayerBid = handlePlayerBid;
window.handlePlayerPass = handlePlayerPass;
window.placeBetFromUI = placeBetFromUI;
window.closeBettingPanel = closeBettingPanel;
window.quickSetTraining = quickSetTraining;
window.continueToDashboard = continueToDashboard;
window.startNextSeason = startNextSeason;
window.openGallops = openGallops;
window.selectGallopsHorse = selectGallopsHorse;
window.selectGallopsFocus = selectGallopsFocus;
window.runSellingAuction = runSellingAuction;
window.buyFeed = buyFeed;
window.buyTack = buyTack;
window.expandBarn = expandBarn;
window.buyForage = buyForage;
window.buyBarnUpgrade = buyBarnUpgrade;
window.feedCarrot = feedCarrot;
window.leaveYardForScreen = leaveYardForScreen;
window.closeYardPanel = closeYardPanel;
window.openAuction = openAuction;
window.openYearlingSale = openYearlingSale;
window.buyLorry = buyLorry;
window.loadHorseInLorry = loadHorseInLorry;
window.pickUpBucket = pickUpBucket;
window.exitFeedRoom = exitFeedRoom;
window.pickUpTack = pickUpTack;
window.putBackTack = putBackTack;
window.leadHorseFromStall = leadHorseFromStall;
window.bringInHorse = bringInHorse;
window.enterStall = enterStall;
window.exitStall = exitStall;
window.nameHorseFromStall = nameHorseFromStall;
window.selectRacedayRace = selectRacedayRace;
window.startRaceday = startRaceday;
window.finishRacedayView = finishRacedayView;
window.hireStaff = hireStaff;
window.dismissStaff = dismissStaff;
window.treatBrewingIssue = treatBrewingIssue;
window.handleStudFarmInteract = handleStudFarmInteract;
window.confirmBuyBroodmare = confirmBuyBroodmare;
window.offerBroodmareForSale = offerBroodmareForSale;
window.buyBroodmare = buyBroodmare;
window.sellBroodmare = sellBroodmare;
window.calculateBroodmareValue = calculateBroodmareValue;
window.generateBroodmareSaleCatalogue = generateBroodmareSaleCatalogue;
window.getReputation = getReputation;
window.getReputationTier = getReputationTier;
window.adjustReputation = adjustReputation;
window.applyRaceReputation = applyRaceReputation;
window.decayReputation = decayReputation;
window.getCatalogueQualities = getCatalogueQualities;
window.openCoveringFor = openCoveringFor;
window.confirmCovering = confirmCovering;
window.confirmRetireToStud = confirmRetireToStud;
window.retireToStud = retireToStud;
window.coverMare = coverMare;
window.processBreedingSeason = processBreedingSeason;
window.generateStallionRoster = generateStallionRoster;
window.generateConformationReport = generateConformationReport;
window.getBloodstockKeepCost = getBloodstockKeepCost;
window.generateSex = generateSex;
window.STAFF_TIERS = STAFF_TIERS;
window.getStaffTier = getStaffTier;
window.getStaffWage = getStaffWage;
window.getStaffCoverage = getStaffCoverage;
window.getStaffCandidates = getStaffCandidates;
window.getSpottedBrewingHorses = getSpottedBrewingHorses;
window.generateStaffObservations = generateStaffObservations;
window.openStaffTaskMenu = openStaffTaskMenu;
window.assignStaffTask = assignStaffTask;
window.updateStaffTaskPreview = updateStaffTaskPreview;
window.confirmRacedayEntry = confirmRacedayEntry;


// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateContinueButton();

    // Phase 2: Render colour picker on setup screen
    renderSilkColourPicker();
    // Render training centre picker on setup screen
    renderTrainingCentrePicker();

    // Phase 4: Lazy-init AudioContext on first click
    document.getElementById('game-container').addEventListener('click', (e) => {
        SoundManager._init();
        if (e.target.closest('.btn, .nav-card, .strategy-btn, .decision-btn, .difficulty-btn, .race-card:not(.completed):not(.locked), .entry-horse-card:not(.injured), .training-btn, .gallops-focus-btn, .gallops-yearling-card:not(.disabled)')) {
            SoundManager.playClick();
        }
    });

    // Main Menu buttons
    document.getElementById('btn-new-game').addEventListener('click', () => {
        showScreen('new-game-setup');
        renderSilkColourPicker();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
        loadGame();
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
        showScreen('how-to-play');
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
        showScreen('main-menu');
    });

    // New Game Setup
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Settings toggle buttons
    document.querySelectorAll('.setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const setting = btn.dataset.setting;
            document.querySelectorAll(`.setting-btn[data-setting="${setting}"]`).forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    document.getElementById('btn-back-from-setup').addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.getElementById('btn-start-career').addEventListener('click', () => {
        const stableName = document.getElementById('trainer-name').value.trim();
        const selectedDifficulty = document.querySelector('.difficulty-btn.selected');
        const budget = parseInt(selectedDifficulty.dataset.budget);
        const difficulty = selectedDifficulty.dataset.difficulty;
        const selectedCentre = document.querySelector('.centre-card.selected');
        const trainingCentre = selectedCentre ? selectedCentre.dataset.centre : 'newmarket';

        // Read settings
        const raceDiffEl = document.querySelector('.setting-btn[data-setting="raceDifficulty"].selected');
        const careNeedsEl = document.querySelector('.setting-btn[data-setting="careNeeds"].selected');
        const staffAutoEl = document.getElementById('setting-staff-automation');
        const settings = {
            raceDifficulty: raceDiffEl ? raceDiffEl.dataset.value : 'medium',
            careNeeds: careNeedsEl ? careNeedsEl.dataset.value : 'medium',
            staffAutomation: staffAutoEl ? staffAutoEl.checked : false
        };

        startNewGame(stableName, budget, difficulty, trainingCentre, settings);
    });

    // Dashboard buttons
    document.getElementById('btn-save-game').addEventListener('click', saveGame);

    // Phase 1: Replace confirm with gameConfirm
    document.getElementById('btn-main-menu').addEventListener('click', async () => {
        const confirmed = await gameConfirm('Return to Menu', "Make sure you've saved your game!");
        if (confirmed) {
            showScreen('main-menu');
            updateContinueButton();
        }
    });

    // Navigation cards
    document.getElementById('nav-auction').addEventListener('click', openAuction);
    document.getElementById('nav-stable').addEventListener('click', openStable);
    document.getElementById('nav-races').addEventListener('click', openRaces);

    // Auction buttons (Phase 1: replace confirm with gameConfirm)
    document.getElementById('btn-back-dashboard').addEventListener('click', async () => {
        const confirmed = await gameConfirm('Leave Auction', 'Any bids set will be lost.');
        if (confirmed) {
            returnToYard();
        }
    });

    document.getElementById('btn-start-auction').addEventListener('click', startLiveAuction);
    document.getElementById('btn-next-lot').addEventListener('click', nextAuctionLot);
    document.getElementById('btn-finish-auction').addEventListener('click', finishAuction);

    // Yearling Sale buttons
    document.getElementById('nav-yearling-sale').addEventListener('click', openYearlingSale);

    document.getElementById('btn-yearling-back-dashboard').addEventListener('click', async () => {
        const confirmed = await gameConfirm('Leave Yearling Sale', 'Any bids set will be lost.');
        if (confirmed) {
            returnToYard();
        }
    });

    document.getElementById('btn-start-yearling-sale').addEventListener('click', startLiveYearlingSale);
    document.getElementById('btn-next-yearling-lot').addEventListener('click', nextYearlingLot);
    document.getElementById('btn-finish-yearling-sale').addEventListener('click', finishYearlingSale);

    // Gallops buttons
    document.getElementById('nav-gallops').addEventListener('click', () => openGallops());

    // The Yard buttons
    document.getElementById('btn-yard-back').addEventListener('click', async () => {
        const confirmed = await gameConfirm('Return to Menu', "Make sure you've saved your game!");
        if (confirmed) {
            leaveYardForScreen();
            showScreen('main-menu');
            updateContinueButton();
        }
    });

    document.getElementById('btn-yard-panel-close').addEventListener('click', () => closeYardPanel());

    document.getElementById('btn-gallops-back').addEventListener('click', async () => {
        if (GallopsState.isGalloping) {
            const confirmed = await gameConfirm('Leave Gallops', 'A workout is in progress. Leave anyway?');
            if (confirmed) {
                if (GallopsState.gallopsInterval) { clearInterval(GallopsState.gallopsInterval); GallopsState.gallopsInterval = null; }
                if (GallopsState.hoofStop) { GallopsState.hoofStop(); GallopsState.hoofStop = null; }
                GallopsState.isGalloping = false;
                returnToYard();
            }
        } else {
            returnToYard();
        }
    });

    document.getElementById('btn-gallops-back-select').addEventListener('click', () => {
        document.getElementById('gallops-focus').style.display = 'none';
        document.getElementById('gallops-select').style.display = '';
        renderGallopsHorses();
    });

    document.querySelectorAll('.gallops-focus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectGallopsFocus(btn.dataset.focus);
        });
    });

    document.getElementById('btn-start-gallops').addEventListener('click', startGallopsWorkout);

    document.getElementById('btn-gallops-another').addEventListener('click', () => {
        document.getElementById('gallops-results').style.display = 'none';
        document.getElementById('gallops-select').style.display = '';
        renderGallopsHorses();
    });

    document.getElementById('btn-gallops-dashboard').addEventListener('click', () => {
        returnToYard();
    });

    // Selling auction buttons
    document.getElementById('btn-next-selling-lot').addEventListener('click', nextSellingLot);
    document.getElementById('btn-finish-selling-auction').addEventListener('click', finishSellingAuction);

    // Stable buttons
    document.getElementById('btn-stable-back').addEventListener('click', () => {
        returnToYard();
    });

    document.getElementById('btn-go-to-auction').addEventListener('click', () => {
        openAuction();
    });

    document.getElementById('btn-close-horse-detail').addEventListener('click', closeHorseDetail);

    // Training buttons
    document.querySelectorAll('.training-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTrainingFocus(btn.dataset.focus);
        });
    });

    // Close modal on backdrop click
    document.getElementById('horse-detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'horse-detail-modal') {
            closeHorseDetail();
        }
    });

    // Race buttons (Phase 1: replace confirm with gameConfirm)
    document.getElementById('btn-race-back').addEventListener('click', async () => {
        if (RaceState.isRacing) {
            const confirmed = await gameConfirm('Leave Race', 'Leave during a race? Progress will be lost!');
            if (confirmed) {
                clearInterval(RaceState.raceInterval);
                if (RaceState.crowdStop) { RaceState.crowdStop(); RaceState.crowdStop = null; }
                if (RaceState.hoofStop) { RaceState.hoofStop(); RaceState.hoofStop = null; }
                RaceState.isRacing = false;
                returnToYard();
            }
        } else {
            returnToYard();
        }
    });

    document.getElementById('btn-back-to-calendar').addEventListener('click', () => {
        document.getElementById('race-horse-select').style.display = 'none';
        document.getElementById('race-calendar').style.display = 'block';
        renderRaceCalendar();
    });

    document.getElementById('btn-back-to-horses').addEventListener('click', () => {
        document.getElementById('race-strategy').style.display = 'none';
        document.getElementById('race-horse-select').style.display = 'block';
    });

    // Spacebar handler for jump racing
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && RaceState.isRacing && RaceState.jumpTimingActive) {
            e.preventDefault();
            handleJumpPress();
        }
    });

    // Multi-horse: Enter Race and Start Race buttons
    document.getElementById('btn-enter-race').addEventListener('click', proceedToStrategy);
    // btn-start-race onclick is set dynamically by proceedToStrategy/confirmRacedayEntry

    // btn-finish-race onclick is set dynamically by showRaceResults/showRacedayResults

    // Phase 4: Mute buttons
    document.getElementById('btn-mute').addEventListener('click', () => SoundManager.toggleMute());
    document.getElementById('btn-mute-menu').addEventListener('click', () => SoundManager.toggleMute());
    document.getElementById('btn-mute-yard').addEventListener('click', () => SoundManager.toggleMute());
});

// Debug
window.GameState = GameState;
window.generateHorse = generateHorse;
