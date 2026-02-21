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

    // Stable colours (Phase 2)
    silkPrimary: '#1a5f3c',
    silkSecondary: '#c9a227',

    // Save timestamp
    lastSaved: null
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
 * Calculate Official Rating (OR) from horse stats, mapped to 0-140 scale
 */
function calculateOfficialRating(horse) {
    const weightedAvg = (horse.speed * 0.30 + horse.stamina * 0.30 + horse.acceleration * 0.25 + horse.temperament * 0.15);
    return Math.max(0, Math.min(140, Math.round(weightedAvg * 1.1 + 15)));
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
 * Adjust Official Ratings after a race for player horses.
 * Returns array of { horseId, oldRating, newRating, change }
 */
function adjustRatingsAfterRace(finalPositions, raceType) {
    const baseChanges = { 1: 6, 2: 3, 3: 1, 4: 0, 5: -1, 6: -2, 7: -3, 8: -4 };
    const typeMultiplier = raceType === 'group' ? 1.6 : raceType === 'conditions' ? 1.3 : 1.0;

    const ratingChanges = [];

    finalPositions.forEach(runner => {
        if (!runner.isPlayer) return;

        const horse = GameState.horses.find(h => h.id === runner.id);
        if (!horse || horse.officialRating == null) return;

        const oldRating = horse.officialRating;
        let baseChange = baseChanges[runner.finalPlace] !== undefined ? baseChanges[runner.finalPlace] : -4;
        let change = Math.round(baseChange * typeMultiplier);

        // Bonus: impressive winner (big margin)
        if (runner.finalPlace === 1) {
            const secondPlace = finalPositions.find(r => r.finalPlace === 2);
            if (secondPlace) {
                const margin = runner.position - secondPlace.position;
                if (margin > 8) change += 4;
                else if (margin > 4) change += 2;
            }
        }

        // Bonus: winning off top weight in handicap
        if (runner.finalPlace === 1 && raceType === 'handicap') {
            const maxWeight = Math.max(...finalPositions.map(r => r.weightLbs || 126));
            if ((runner.weightLbs || 126) >= maxWeight) {
                change += 2;
            }
        }

        const newRating = Math.max(30, Math.min(140, oldRating + change));
        horse.officialRating = newRating;
        horse._lastRatingChange = newRating - oldRating;
        horse._lastOldRating = oldRating;

        if (!horse.ratingHistory) horse.ratingHistory = [];
        horse.ratingHistory.push({
            raceName: RaceState.selectedRace.name,
            oldRating: oldRating,
            newRating: newRating,
            change: newRating - oldRating,
            position: runner.finalPlace
        });

        ratingChanges.push({
            horseId: horse.id,
            horseName: horse.name,
            oldRating: oldRating,
            newRating: newRating,
            change: newRating - oldRating
        });
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
        condition: 100,
        trainingFocus: null,
        racesRun: 0,
        wins: 0,
        totalEarnings: 0,
        isInjured: false,
        injuryType: null,
        recoveryRacesLeft: 0,
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        pendingAuction: false,
        reservePrice: 0
    };

    horse.estimatedValue = calculateHorseValue(horse);
    horse.officialRating = calculateOfficialRating(horse);
    horse.ratingHistory = [];
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
        name: generateHorseName(),
        age: 1,
        ...derivedStats,
        condition: 100,
        trainingFocus: null,
        racesRun: 0,
        wins: 0,
        totalEarnings: 0,
        isInjured: false,
        injuryType: null,
        recoveryRacesLeft: 0,
        silkPrimary: silk.primary,
        silkSecondary: silk.secondary,
        distancePreference: DISTANCE_PREFERENCES[randomInt(0, DISTANCE_PREFERENCES.length - 1)],
        groundPreference: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)],
        isYearling: true,
        isRaceReady: false,
        sire: sire,
        dam: dam,
        pendingAuction: false,
        reservePrice: 0
    };

    yearling.estimatedValue = calculateYearlingValue(sire, dam);
    yearling.officialRating = null;
    yearling.ratingHistory = [];
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

function applyStatLoss(horse, amount) {
    const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
    const statToReduce = stats[randomInt(0, stats.length - 1)];
    horse[statToReduce] = Math.max(horse[statToReduce] - amount, 20);
}

function processInjuryRecovery() {
    GameState.horses.forEach(horse => {
        if (horse.isInjured && horse.recoveryRacesLeft > 0) {
            horse.recoveryRacesLeft--;
            if (horse.recoveryRacesLeft <= 0) {
                horse.isInjured = false;
                horse.injuryType = null;
            }
        }
    });
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

function checkForSetbacks() {
    const setbackReports = [];

    GameState.horses.forEach(horse => {
        if (horse.isInjured) return;
        if (horse.isYearling) return;

        for (const setback of SETBACK_TYPES) {
            if (Math.random() < setback.chance) {
                const stats = ['speed', 'stamina', 'acceleration', 'temperament'];
                let affectedStats = [];

                if (setback.affectedStat) {
                    const loss = randomInt(setback.statLoss[0], setback.statLoss[1]);
                    horse[setback.affectedStat] = Math.max(horse[setback.affectedStat] - loss, 20);
                    affectedStats.push({ stat: setback.affectedStat, loss: loss });
                } else {
                    for (let i = 0; i < setback.numStats; i++) {
                        const stat = stats[randomInt(0, stats.length - 1)];
                        const loss = randomInt(setback.statLoss[0], setback.statLoss[1]);
                        horse[stat] = Math.max(horse[stat] - loss, 20);
                        affectedStats.push({ stat: stat, loss: loss });
                    }
                }

                setbackReports.push({
                    horse: horse.name,
                    setbackName: setback.name,
                    description: setback.description,
                    affectedStats: affectedStats
                });

                break;
            }
        }
    });

    return setbackReports;
}

// ============================================
// SCREEN NAVIGATION
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
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

        GameState.competitors.push({
            id: generateId(),
            name: name,
            points: 0,
            isPlayer: false,
            silkPrimary: silk.primary,
            silkSecondary: silk.secondary
        });
    }

    GameState.standings = [
        { id: 'player', name: GameState.stableName, points: 0, isPlayer: true },
        ...GameState.competitors
    ];
}

function initializeRaceCalendar() {
    GameState.races = RACE_NAMES.map((race, index) => ({
        id: generateId(),
        ...race,
        raceNumber: index + 1,
        completed: false,
        results: null,
        ground: GROUND_CONDITIONS[randomInt(0, GROUND_CONDITIONS.length - 1)]
    }));
    GameState.currentRaceIndex = 0;
}

function startNewGame(stableName, budget, difficulty) {
    GameState.stableName = stableName || 'My Racing Stable';
    GameState.budget = budget;
    GameState.difficulty = difficulty;
    GameState.season = 1;
    GameState.seasonPoints = 0;
    GameState.horses = [];

    initializeCompetitors();
    initializeRaceCalendar();

    updateDashboard();
    showScreen('dashboard');
}

// ============================================
// PHASE 2: SILK COLOUR PICKER
// ============================================

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
}

function updateNextRaceDisplay() {
    const nextRaceContainer = document.getElementById('next-race-info');
    const nextRace = GameState.races[GameState.currentRaceIndex];

    if (nextRace && !nextRace.completed) {
        const raceIdx = GameState.races.indexOf(nextRace);
        const groundVisible = raceIdx === 0 || (GameState.races[raceIdx - 1] && GameState.races[raceIdx - 1].completed);
        const groundText = nextRace.ground || 'Good';
        const groundHTML = groundVisible
            ? `<br>Going: <span class="ground-badge ground-${groundText.toLowerCase().replace(/ /g, '-')}">${groundText}</span>`
            : '';
        const dashRaceType = nextRace.type || 'conditions';
        const dashTypeBadge = `<span class="race-type-badge ${dashRaceType}">${dashRaceType === 'handicap' ? 'Handicap' : dashRaceType === 'group' ? 'Group Race' : 'Conditions'}</span>`;
        nextRaceContainer.innerHTML = `
            <div class="race-name">${nextRace.name} ${dashTypeBadge}</div>
            <div class="race-details">
                Race ${nextRace.raceNumber} of ${GameState.races.length}<br>
                Distance: ${nextRace.distance}
                ${groundHTML}
            </div>
            <div class="race-prize">Prize: \u00A3${formatMoney(nextRace.prize)}</div>
        `;
        document.getElementById('next-race').textContent = nextRace.name;
    } else {
        nextRaceContainer.innerHTML = `
            <div class="race-name">Season Complete</div>
            <div class="race-details">All races finished!</div>
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

        updateDashboard();
        showScreen('dashboard');
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

    const qualities = ['low', 'low', 'medium', 'medium', 'medium', 'high', 'high', 'elite'];

    for (let i = qualities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qualities[i], qualities[j]] = [qualities[j], qualities[i]];
    }

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
            <div class="bid-input-group">
                <label>Your max bid: \u00A3</label>
                <input type="number"
                       class="bid-input"
                       data-horse-id="${horse.id}"
                       value="${playerBid || ''}"
                       placeholder="0"
                       min="0"
                       max="${GameState.budget}"
                       step="5000">
            </div>
        </div>
    `;
}

function renderAuctionCatalogue() {
    const container = document.getElementById('horse-catalogue');
    container.innerHTML = AuctionState.catalogue.map(renderHorseCard).join('');

    document.getElementById('auction-budget').textContent = formatMoney(GameState.budget);

    container.querySelectorAll('.bid-input').forEach(input => {
        input.addEventListener('change', handleBidInput);
        input.addEventListener('input', handleBidInput);
    });

    updateStartAuctionButton();
}

function handleBidInput(e) {
    const horseId = e.target.dataset.horseId;
    const bidValue = parseInt(e.target.value) || 0;

    if (bidValue > GameState.budget) {
        e.target.value = GameState.budget;
        AuctionState.playerBids[horseId] = GameState.budget;
    } else if (bidValue < 0) {
        e.target.value = 0;
        delete AuctionState.playerBids[horseId];
    } else if (bidValue === 0) {
        delete AuctionState.playerBids[horseId];
    } else {
        AuctionState.playerBids[horseId] = bidValue;
    }

    const card = e.target.closest('.horse-card');
    if (bidValue > 0) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }

    updateStartAuctionButton();
}

function updateStartAuctionButton() {
    const bidCount = Object.keys(AuctionState.playerBids).length;
    const btn = document.getElementById('btn-start-auction');
    const countText = document.querySelector('.bid-count');

    if (bidCount > 0) {
        btn.disabled = false;
        countText.textContent = `You're bidding on ${bidCount} horse${bidCount > 1 ? 's' : ''}`;
    } else {
        btn.disabled = true;
        countText.textContent = 'Select horses and set your max bids';
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

    if (playerMaxBid > 0) {
        document.getElementById('your-max-bid').textContent = `\u00A3${formatMoney(playerMaxBid)}`;
    } else {
        document.getElementById('your-max-bid').textContent = 'Not bidding';
    }

    document.getElementById('btn-next-lot').style.display = 'none';

    simulateAuctionBidding(horse, playerMaxBid);
}

function simulateAuctionBidding(horse, playerMaxBid) {
    let currentBid = Math.round(horse.estimatedValue * (0.6 + Math.random() * 0.2) / 5000) * 5000;
    let leadingBidder = null;
    let playerIsLeading = false;

    const numAIBidders = randomInt(1, 3);
    const aiBidders = [];

    for (let i = 0; i < numAIBidders; i++) {
        const aiTrainer = GameState.competitors[randomInt(0, GameState.competitors.length - 1)];
        const aiMaxBid = Math.round(horse.estimatedValue * (0.8 + Math.random() * 0.4) / 5000) * 5000;
        aiBidders.push({ name: aiTrainer.name, maxBid: aiMaxBid });
    }

    const bidIncrement = 5000;
    let bidRound = 0;

    const biddingInterval = setInterval(() => {
        bidRound++;

        const eligibleAI = aiBidders.filter(ai => ai.maxBid > currentBid);
        const playerCanBid = playerMaxBid > currentBid && (GameState.budget - AuctionState.totalSpent) >= currentBid + bidIncrement;

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

        document.getElementById('current-bid').textContent = formatMoney(currentBid);
        document.getElementById('leading-bidder').textContent = leadingBidder || 'Opening bid';

        const bidStatus = document.getElementById('bid-status');
        if (playerMaxBid === 0) {
            bidStatus.textContent = 'You are not bidding on this horse';
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
        const playerStillEligible = playerMaxBid > currentBid && (GameState.budget - AuctionState.totalSpent) >= currentBid + bidIncrement;

        const biddingDone = (playerIsLeading && stillEligible.length === 0) ||
                           (!playerIsLeading && !playerStillEligible && stillEligible.length <= 1) ||
                           bidRound > 20;

        if (biddingDone || (!nextBidder && bidRound > 3)) {
            clearInterval(biddingInterval);

            const result = {
                horse: horse,
                finalPrice: currentBid,
                winner: leadingBidder,
                wonByPlayer: playerIsLeading
            };
            AuctionState.results.push(result);

            if (playerIsLeading) {
                AuctionState.horsesWon.push({...horse, purchasePrice: currentBid});
                AuctionState.totalSpent += currentBid;

                bidStatus.textContent = `\u2713 SOLD to you for \u00A3${formatMoney(currentBid)}!`;
                bidStatus.className = 'bid-status winning';
                SoundManager.playGavel();
            } else {
                bidStatus.textContent = `Sold to ${leadingBidder} for \u00A3${formatMoney(currentBid)}`;
                bidStatus.className = 'bid-status outbid';
                SoundManager.playGavel();
            }

            document.getElementById('btn-next-lot').style.display = 'block';
            if (AuctionState.currentLotIndex >= AuctionState.catalogue.length - 1) {
                document.getElementById('btn-next-lot').textContent = 'See Results';
            } else {
                document.getElementById('btn-next-lot').textContent = 'Next Lot \u2192';
            }
        }
    }, 600);
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

    updateDashboard();
    showScreen('dashboard');
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

    const qualities = ['low', 'low', 'medium', 'medium', 'medium', 'high', 'high', 'elite'];

    for (let i = qualities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qualities[i], qualities[j]] = [qualities[j], qualities[i]];
    }

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
                <span class="horse-name">${yearling.name}</span>
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
    document.getElementById('yearling-lot-name').textContent = yearling.name;

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
                    <div class="horse-name">${yearling.name}</div>
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
    YearlingAuctionState.horsesWon.forEach(yearling => {
        yearling.silkPrimary = GameState.silkPrimary;
        yearling.silkSecondary = GameState.silkSecondary;
        GameState.horses.push(yearling);
    });

    GameState.budget -= YearlingAuctionState.totalSpent;

    updateDashboard();
    showScreen('dashboard');
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
    const yearlings = GameState.horses.filter(h => h.isYearling);
    if (yearlings.length === 0) {
        await gameAlert('No Yearlings', 'You have no yearlings in your stable. Visit the Yearling Sale to buy one.');
        return;
    }

    GallopsState.selectedYearlingId = null;
    GallopsState.selectedFocus = null;
    GallopsState.isGalloping = false;

    document.getElementById('gallops-season').textContent = GameState.season;

    renderGallopsYearlings();

    document.getElementById('gallops-select').style.display = '';
    document.getElementById('gallops-focus').style.display = 'none';
    document.getElementById('gallops-workout').style.display = 'none';
    document.getElementById('gallops-results').style.display = 'none';

    showScreen('gallops');

    if (preselectedHorseId) {
        const horse = yearlings.find(h => h.id === preselectedHorseId);
        if (horse && horse.condition >= 50 && !horse.isInjured) {
            selectGallopsYearling(preselectedHorseId);
        }
    }
}

function renderGallopsYearlings() {
    const yearlings = GameState.horses.filter(h => h.isYearling);
    const grid = document.getElementById('gallops-yearling-grid');

    grid.innerHTML = yearlings.map(horse => {
        const conditionClass = horse.condition >= 70 ? '' : horse.condition >= 40 ? 'medium' : 'low';
        const isDisabled = horse.condition < 50 || horse.isInjured;
        let warningText = '';
        if (horse.isInjured) {
            warningText = `\u{1F915} ${horse.injuryType} - Out for ${horse.recoveryRacesLeft} race${horse.recoveryRacesLeft > 1 ? 's' : ''}`;
        } else if (horse.condition < 50) {
            warningText = '\u26A0\uFE0F Too tired to train (condition below 50%)';
        }

        const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);

        return `
            <div class="gallops-yearling-card ${isDisabled ? 'disabled' : ''}" data-horse-id="${horse.id}" ${isDisabled ? '' : `onclick="selectGallopsYearling('${horse.id}')"`}>
                <div class="gallops-yearling-header">
                    <span class="horse-name">${swatch}${horse.name}</span>
                    <span class="horse-age">1 yr</span>
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

function selectGallopsYearling(horseId) {
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

    showGallopsResults(horse, focus, improvement, conditionCost, injury, resultType);
}

function showGallopsResults(horse, focus, improvement, conditionCost, injury, resultType) {
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
        <div class="stable-parentage-info">Sire: ${horse.sire.name} | Dam: ${horse.dam.name}</div>
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

    orSection.innerHTML = `
        <h3>Official Rating</h3>
        <div class="or-display">
            <span class="or-value-large">${orValue}</span>
        </div>
        ${historyHTML}
    `;

    const careerStatsSection = document.querySelector('#horse-detail-modal .detail-section:last-of-type');
    if (careerStatsSection && careerStatsSection.parentNode) {
        careerStatsSection.parentNode.insertBefore(orSection, careerStatsSection.nextSibling);
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
function applyTrainingEffects() {
    const trainingResults = [];
    const trainingInjuries = [];

    GameState.horses.forEach(horse => {
        if (horse.isYearling) {
            horse.condition = Math.min(horse.condition + randomInt(10, 20), 100);
            trainingResults.push({ horse: horse.name, result: 'yearling', detail: 'Resting and recovering (yearling)' });
            return;
        }

        if (horse.isInjured) {
            horse.condition = Math.min(horse.condition + randomInt(5, 10), 100);
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

        horse.condition = Math.min(horse.condition + randomInt(10, 20), 100);
    });

    const setbackReports = checkForSetbacks();

    return { trainingResults, trainingInjuries, setbackReports };
}

function restHorse(horseId) {
    const horse = GameState.horses.find(h => h.id === horseId);
    if (horse) {
        horse.condition = Math.min(horse.condition + 30, 100);
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
    currentDecision: null,
    decisionTimer: null,
    raceInterval: null,
    raceProgress: 0,
    isRacing: false,
    crowdStop: null,
    hoofStop: null
};

const RACE_DECISIONS = [
    {
        id: 'gap_opens',
        prompt: 'A gap opens on the rail!',
        options: [
            { text: 'Push through', attribute: 'acceleration', risk: 0.3 },
            { text: 'Hold steady', attribute: 'temperament', risk: 0.1 }
        ]
    },
    {
        id: 'leader_tires',
        prompt: 'The leader is starting to tire...',
        options: [
            { text: 'Make your move now', attribute: 'speed', risk: 0.2 },
            { text: 'Wait for the stretch', attribute: 'stamina', risk: 0.1 }
        ]
    },
    {
        id: 'tight_pack',
        prompt: 'The pack is bunching up ahead!',
        options: [
            { text: 'Go wide', attribute: 'stamina', risk: 0.2 },
            { text: 'Stay in tight', attribute: 'temperament', risk: 0.25 }
        ]
    },
    {
        id: 'final_push',
        prompt: 'Final furlong - your horse has energy left!',
        options: [
            { text: 'All out sprint', attribute: 'speed', risk: 0.3 },
            { text: 'Controlled finish', attribute: 'acceleration', risk: 0.1 }
        ]
    }
];

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

    document.getElementById('race-season').textContent = GameState.season;

    document.getElementById('race-calendar').style.display = 'block';
    document.getElementById('race-horse-select').style.display = 'none';
    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-live').style.display = 'none';
    document.getElementById('race-results').style.display = 'none';

    renderRaceCalendar();
    showScreen('race');
}

function renderRaceCalendar() {
    const raceList = document.getElementById('race-list');

    raceList.innerHTML = GameState.races.map((race, index) => {
        const isCompleted = race.completed;
        const isNext = index === GameState.currentRaceIndex && !isCompleted;
        const isLocked = index > GameState.currentRaceIndex;

        const distanceCategory = getRaceDistanceCategory(race.distanceFurlongs);
        const categoryLabels = {
            'sprint': '\u{1F3C3} Sprint',
            'mid': '\u{1F3C7} Mid',
            'stayer': '\u{1F3D4}\uFE0F Stayer'
        };
        const categoryLabel = categoryLabels[distanceCategory];

        // Race type badge
        const raceType = race.type || 'conditions';
        const raceTypeBadge = `<span class="race-type-badge ${raceType}">${raceType === 'handicap' ? 'Handicap' : raceType === 'group' ? 'Group Race' : 'Conditions'}</span>`;

        // Ground is visible for race 0 always, and for any race where the previous race is completed
        const groundVisible = index === 0 || (GameState.races[index - 1] && GameState.races[index - 1].completed);
        const groundHTML = groundVisible
            ? `<span class="ground-badge ground-${race.ground.toLowerCase().replace(/ /g, '-')}">${race.ground}</span>`
            : `<span class="ground-badge ground-unknown">Ground TBC</span>`;

        let statusText = '';
        if (isCompleted) {
            const playerResult = race.results?.find(r => r.isPlayer);
            statusText = playerResult ? `Finished ${getOrdinal(playerResult.position)}` : 'Completed';
        } else if (isNext) {
            statusText = 'Next race';
        } else if (isLocked) {
            statusText = 'Upcoming';
        }

        return `
            <div class="race-card ${isCompleted ? 'completed' : ''} ${isNext ? 'next' : ''} ${isLocked ? 'locked' : ''}"
                 data-race-index="${index}" ${isLocked || isCompleted ? '' : 'onclick="selectRace(' + index + ')"'}>
                <div class="race-card-left">
                    <div class="race-number">${race.raceNumber}</div>
                    <div class="race-card-info">
                        <h3>${race.name} ${raceTypeBadge}</h3>
                        <div class="race-card-meta">
                            ${race.distance} <span class="distance-category ${distanceCategory}">${categoryLabel}</span>
                            ${groundHTML}
                        </div>
                    </div>
                </div>
                <div class="race-card-right">
                    <div class="race-card-prize">\u00A3${formatMoney(race.prize)}</div>
                    <div class="race-card-status">${statusText}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function selectRace(raceIndex) {
    RaceState.selectedRace = GameState.races[raceIndex];
    RaceState.selectedHorseIds = new Set();
    RaceState.horseStrategies = {};

    const distanceCategory = getRaceDistanceCategory(RaceState.selectedRace.distanceFurlongs);
    const categoryInfo = {
        'sprint': { label: '\u{1F3C3} Sprint', tip: 'Speed is key - fast horses excel' },
        'mid': { label: '\u{1F3C7} Mid Distance', tip: 'Balanced horses perform well' },
        'stayer': { label: '\u{1F3D4}\uFE0F Stayer', tip: 'Stamina is crucial for this distance' }
    };
    const info = categoryInfo[distanceCategory];
    const groundText = RaceState.selectedRace.ground || 'Good';

    const raceType = RaceState.selectedRace.type || 'conditions';
    const raceTypeBadge = `<span class="race-type-badge ${raceType}">${raceType === 'handicap' ? 'Handicap' : raceType === 'group' ? 'Group Race' : 'Conditions'}</span>`;

    document.getElementById('selected-race-name').textContent = RaceState.selectedRace.name;
    document.getElementById('selected-race-distance').innerHTML = `
        ${RaceState.selectedRace.distance}
        <span class="distance-category ${distanceCategory}">${info.label}</span>
        <span class="ground-badge ground-${groundText.toLowerCase().replace(/ /g, '-')}">${groundText}</span>
        ${raceTypeBadge}
        <br><small class="distance-tip">${info.tip}</small>
    `;
    document.getElementById('selected-race-prize').textContent = formatMoney(RaceState.selectedRace.prize);

    renderHorseOptions();
    updateEnterRaceButton();

    document.getElementById('race-calendar').style.display = 'none';
    document.getElementById('race-horse-select').style.display = 'block';
}

/**
 * Render horse options for race entry - multi-select toggle
 */
function renderHorseOptions() {
    const horseList = document.getElementById('entry-horse-list');

    const raceEligible = GameState.horses.filter(h => !h.isYearling);
    const availableHorses = raceEligible.filter(h => !h.isInjured && !h.pendingAuction);
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

    horseList.innerHTML = raceEligible.map(horse => {
        const isInjured = horse.isInjured;
        const isSelected = RaceState.selectedHorseIds.has(horse.id);
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
        let warningText = '';
        if (isInjured) {
            warningText = `\u{1F6AB} ${horse.injuryType} - Out for ${horse.recoveryRacesLeft} more race${horse.recoveryRacesLeft > 1 ? 's' : ''}`;
        } else if (isPendingSale) {
            warningText = '\u{1F6AB} Listed for sale at Tattersalls';
        } else if (horse.condition < 70) {
            warningText = 'Low condition will affect performance';
        }

        const isDisabled = isInjured || isPendingSale;
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
}

function renderStrategyEntries() {
    const container = document.getElementById('strategy-entries');
    const selectedHorses = GameState.horses.filter(h => RaceState.selectedHorseIds.has(h.id));

    container.innerHTML = selectedHorses.map(horse => {
        const swatch = silkSwatchHTML(horse.silkPrimary || GameState.silkPrimary, horse.silkSecondary || GameState.silkSecondary);
        const currentStrategy = RaceState.horseStrategies[horse.id] || '';

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
                    </button>
                    <button class="strategy-btn ${currentStrategy === 'stalker' ? 'selected' : ''}"
                            onclick="setHorseStrategy('${horse.id}', 'stalker')">
                        <span class="strategy-icon">\u{1F440}</span>
                        <span class="strategy-label">Stalker</span>
                        <span class="strategy-desc">Track leaders, kick late</span>
                    </button>
                    <button class="strategy-btn ${currentStrategy === 'closer' ? 'selected' : ''}"
                            onclick="setHorseStrategy('${horse.id}', 'closer')">
                        <span class="strategy-icon">\u26A1</span>
                        <span class="strategy-label">Closer</span>
                        <span class="strategy-desc">Hold back, strong finish</span>
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
            officialRating: horse.officialRating || calculateOfficialRating(horse)
        });
    });

    // Fill remaining slots with AI - quality varies by race type
    const aiSlots = totalRunners - runners.length;
    const aiQualities = raceType === 'group'
        ? ['high', 'high', 'elite', 'elite', 'elite', 'elite']
        : ['medium', 'medium', 'high', 'high', 'high', 'elite'];

    for (let i = 0; i < aiSlots; i++) {
        const quality = aiQualities[i % aiQualities.length];
        const aiHorse = generateHorse(quality);
        const aiTrainer = GameState.competitors[i % GameState.competitors.length];

        // Compute AI OR with random variance
        let aiOR = calculateOfficialRating(aiHorse) + randomInt(-8, 8);
        if (raceType === 'group') {
            aiOR = Math.max(85, Math.min(115, aiOR));
        }
        aiOR = Math.max(0, Math.min(140, aiOR));

        let aiStrategy;
        if (aiHorse.speed > aiHorse.stamina && aiHorse.speed > aiHorse.acceleration) {
            aiStrategy = 'front-runner';
        } else if (aiHorse.acceleration > aiHorse.speed) {
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
            stats: aiHorse,
            strategy: aiStrategy,
            position: 0,
            energy: 100,
            score: 0,
            formFactor: aiForm,
            silkPrimary: aiTrainer.silkPrimary || aiHorse.silkPrimary,
            silkSecondary: aiTrainer.silkSecondary || aiHorse.silkSecondary,
            distancePreference: aiHorse.distancePreference || 'mid',
            groundPreference: aiHorse.groundPreference || 'Good',
            officialRating: aiOR
        });
    }

    // Assign weights based on race type
    assignRaceWeights(runners, raceType);

    RaceState.racePositions = runners;

    document.getElementById('race-strategy').style.display = 'none';
    document.getElementById('race-live').style.display = 'block';

    document.getElementById('live-race-name').textContent = RaceState.selectedRace.name;
    document.getElementById('race-stage').textContent = 'Starting...';
    document.getElementById('commentary-text').textContent = 'The horses are loading into the stalls...';
    document.getElementById('decision-moment').style.display = 'none';

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
        <rect class="h-leg h-leg-hr" x="13" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
        <rect class="h-leg h-leg-hl" x="16" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
        <rect class="h-leg h-leg-fr" x="34" y="22" width="2.2" height="12" rx="1" fill="#4a2512"/>
        <rect class="h-leg h-leg-fl" x="37" y="22" width="2.2" height="12" rx="1" fill="#3d200f"/>
        <rect x="13" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hr"/>
        <rect x="16" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-hl"/>
        <rect x="34" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fr"/>
        <rect x="37" y="33" width="2.2" height="1.5" rx="0.5" fill="#1a0a04" class="h-leg h-leg-fl"/>
        <path d="M10,23 Q7,20 7,16 Q7,12 12,12 L22,11 L28,10.5 Q32,9 35,6 Q37,3.5 40,3.5 L42,3.5 Q44,3 45,4 Q47,4.5 48,6.5 Q48.5,8 47,9 Q45,10.5 43,12 Q40,16 38,20 L36,23 Q28,19 18,23 Z" fill="#6b3a1f"/>
        <path d="M10,23 Q28,19 36,23 L36,23 Q28,21 18,23 Z" fill="#5a2e16" opacity="0.5"/>
        <ellipse cx="14" cy="16" rx="4" ry="3" fill="#7a4525" opacity="0.4"/>
        <ellipse cx="33" cy="15" rx="3" ry="3.5" fill="#7a4525" opacity="0.35"/>
        <polygon points="41,3.5 40,0.5 43,2.5" fill="#5a2e16"/>
        <circle cx="45" cy="5.5" r="0.9" fill="#222"/>
        <circle cx="45.2" cy="5.3" r="0.3" fill="#555"/>
        <circle cx="47.5" cy="7.8" r="0.6" fill="#4a2512"/>
        <path class="h-mane" d="M28,10.5 Q31,7 34,5 Q36,3.5 39,3.5" stroke="#3a1f0d" stroke-width="2" fill="none" stroke-linecap="round"/>
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
    const totalTicks = 100;
    const decisionPoints = [25, 50, 75];
    let decisionIndex = decisionPoints.filter(p => p <= tick).length;
    let injuryChecked = tick >= 40;

    RaceState.raceInterval = setInterval(() => {
        tick++;
        RaceState.raceProgress = tick;

        const raceFurlongs = RaceState.selectedRace?.distanceFurlongs || 8;
        const raceLaps = isOvalRace(raceFurlongs) ? getOvalLaps(raceFurlongs) : 1;

        if (raceLaps === 2) {
            // Two-circuit race: show lap indicators
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

        RaceState.racePositions.forEach(runner => {
            // Don't advance runners that have already finished
            if (runner.position >= 100) return;

            let baseSpeed = calculateRunnerSpeed(runner, tick);

            if (runner.isPlayer) {
                const horse = GameState.horses.find(h => h.id === runner.id);
                const conditionMultiplier = (horse ? horse.condition : 100) / 100;
                baseSpeed *= (0.5 + conditionMultiplier * 0.5);
            }

            baseSpeed += (Math.random() - 0.5) * 0.25;

            runner.position += baseSpeed;

            // Record finish order when crossing the line
            if (runner.position >= 100 && !runner.finishOrder) {
                runner.position = 100;
                if (!RaceState._finishCount) RaceState._finishCount = 0;
                RaceState._finishCount++;
                runner.finishOrder = RaceState._finishCount;
            }
        });

        updateRaceTrack();
        updateCommentary(tick);

        if (decisionIndex < decisionPoints.length && tick === decisionPoints[decisionIndex]) {
            clearInterval(RaceState.raceInterval);
            showDecisionMoment(decisionIndex);
            decisionIndex++;
            return;
        }

        // Race ends when every horse has crossed the finish line
        if (RaceState.racePositions.every(r => r.position >= 100)) {
            clearInterval(RaceState.raceInterval);
            finishRace();
        }
    }, 150);
}

function calculateRunnerSpeed(runner, tick) {
    const { speed, stamina, acceleration, temperament } = runner.stats;
    let baseSpeed = 0;

    const earlyRace = tick < 30;
    const midRace = tick >= 30 && tick < 70;
    const lateRace = tick >= 70;

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

    switch (runner.strategy) {
        case 'front-runner':
            if (earlyRace) {
                baseSpeed = 0.65 + (effectiveSpeed / 100) * 0.35;
            } else if (midRace) {
                baseSpeed = 0.5 + (effectiveSpeed / 100) * 0.3;
            } else {
                baseSpeed = 0.35 + (effectiveStamina / 100) * 0.35;
            }
            break;

        case 'stalker':
            if (earlyRace) {
                baseSpeed = 0.5 + (effectiveSpeed / 100) * 0.3;
            } else if (midRace) {
                const midStat = (effectiveSpeed + effectiveStamina) / 2;
                baseSpeed = 0.55 + (midStat / 100) * 0.3;
            } else {
                baseSpeed = 0.55 + (acceleration / 100) * 0.35;
            }
            break;

        case 'closer':
            if (earlyRace) {
                baseSpeed = 0.35 + (effectiveStamina / 100) * 0.25;
            } else if (midRace) {
                baseSpeed = 0.5 + (effectiveStamina / 100) * 0.3;
            } else {
                baseSpeed = 0.7 + (acceleration / 100) * 0.4;
            }
            break;
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
 * Show decision moment (Phase 4: whoosh sound)
 */
function showDecisionMoment(decisionIndex) {
    const decision = RACE_DECISIONS[randomInt(0, RACE_DECISIONS.length - 1)];
    RaceState.currentDecision = decision;

    SoundManager.playWhoosh();

    document.getElementById('decision-prompt').textContent = decision.prompt;
    document.getElementById('decision-options').innerHTML = decision.options.map((opt, i) => `
        <button class="decision-btn" onclick="makeDecision(${i})">${opt.text}</button>
    `).join('');

    document.getElementById('decision-moment').style.display = 'block';

    let timeLeft = 100;
    const timerBar = document.getElementById('decision-timer-bar');

    RaceState.decisionTimer = setInterval(() => {
        timeLeft -= 2;
        timerBar.style.width = `${timeLeft}%`;

        if (timeLeft <= 0) {
            clearInterval(RaceState.decisionTimer);
            makeDecision(0);
        }
    }, 100);
}

function makeDecision(optionIndex) {
    clearInterval(RaceState.decisionTimer);
    document.getElementById('decision-moment').style.display = 'none';

    const decision = RaceState.currentDecision;
    const option = decision.options[optionIndex];

    // Apply decision to best-placed player horse
    const sortedRunners = [...RaceState.racePositions].sort((a, b) => b.position - a.position);
    const bestPlayer = sortedRunners.find(r => r.isPlayer);
    if (!bestPlayer) { setTimeout(() => runRaceSimulation(), 1500); return; }

    const attributeValue = bestPlayer.stats[option.attribute];
    const successChance = (attributeValue / 100) * (1 - option.risk);

    if (Math.random() < successChance) {
        bestPlayer.position += randomInt(3, 8);
        document.getElementById('commentary-text').textContent =
            `Great decision! ${bestPlayer.name} gains ground!`;
    } else {
        bestPlayer.position -= randomInt(2, 5);
        document.getElementById('commentary-text').textContent =
            `That didn't work out! ${bestPlayer.name} loses a bit of ground.`;
    }

    setTimeout(() => {
        runRaceSimulation();
    }, 1500);
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

    playerResults.forEach(pr => {
        const horse = GameState.horses.find(h => h.id === pr.id);
        if (!horse) return;

        const { prize, points } = placeReward(pr.finalPlace);
        totalPrizeMoney += prize;
        totalPoints += points;

        horse.totalEarnings += prize;
        horse.racesRun++;
        if (pr.finalPlace === 1) horse.wins++;
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
            officialRating: pr.officialRating || 0
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

    GameState.currentRaceIndex++;

    processInjuryRecovery();

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
        return `
            <div class="player-horse-result">
                <p>${hr.name}: <strong>${getOrdinal(hr.place)} place</strong>${prizeText} (+${hr.points} pts)</p>
                ${ratingLine}
                ${injuryLine}
            </div>
        `;
    }).join('');

    resultDiv.innerHTML = `
        <h3>${resultTitle}</h3>
        ${horseResultsHTML}
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

    if (GameState.currentRaceIndex >= GameState.races.length) {
        document.getElementById('btn-finish-race').textContent = 'View Season Results';
    } else {
        document.getElementById('btn-finish-race').textContent = 'Continue';
    }
}

// ============================================
// PHASE 5: BETWEEN-RACES INTERSTITIAL
// ============================================

function showBetweenRaces(trainingData) {
    const { trainingResults, trainingInjuries, setbackReports } = trainingData;

    document.getElementById('between-season').textContent = GameState.season;

    let html = '';

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

    // Setbacks
    if (setbackReports.length > 0) {
        html += '<div class="between-section"><h3>Stable Updates</h3>';
        setbackReports.forEach(s => {
            const statsText = s.affectedStats.map(a => `${capitalizeFirst(a.stat)} -${a.loss}`).join(', ');
            html += `<div class="setback-card">
                <strong>${s.horse}</strong>: ${s.setbackName}<br>
                <small>${s.horse} ${s.description} (${statsText})</small>
            </div>`;
        });
        html += '</div>';
    }

    // Handicapper's Report - show OR changes for horses that raced
    if (RaceState._lastRatingChanges && RaceState._lastRatingChanges.length > 0) {
        html += '<div class="between-section"><h3>Handicapper\'s Report</h3>';
        RaceState._lastRatingChanges.forEach(rc => {
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

    // Next race preview
    const nextRace = GameState.races[GameState.currentRaceIndex];
    if (nextRace) {
        const cat = getRaceDistanceCategory(nextRace.distanceFurlongs);
        const catLabel = {'sprint': 'Sprint', 'mid': 'Mid', 'stayer': 'Stayer'}[cat];
        const groundText = nextRace.ground || 'Good';
        const nextRaceType = nextRace.type || 'conditions';
        const nextTypeBadge = `<span class="race-type-badge ${nextRaceType}">${nextRaceType === 'handicap' ? 'Handicap' : nextRaceType === 'group' ? 'Group Race' : 'Conditions'}</span>`;
        html += `<div class="between-section">
            <h3>Next Race</h3>
            <div class="next-race-preview">
                <div class="race-name">${nextRace.name} ${nextTypeBadge}</div>
                <div class="race-details">
                    ${nextRace.distance}
                    <span class="distance-category ${cat}">${catLabel}</span>
                    <span class="ground-badge ground-${groundText.toLowerCase().replace(/ /g, '-')}">${groundText}</span>
                </div>
                <div class="race-prize">Prize: \u00A3${formatMoney(nextRace.prize)}</div>
            </div>
        </div>`;
    }

    // Quick training adjustment
    const nonInjuredHorses = GameState.horses.filter(h => !h.isInjured && !h.isYearling);
    if (nonInjuredHorses.length > 0) {
        html += '<div class="between-section"><h3>Adjust Training</h3>';
        html += '<div class="quick-training-grid">';
        nonInjuredHorses.forEach(horse => {
            html += `<div class="quick-training-row">
                <span class="horse-name">${horse.name}</span>
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

    html += '<button class="btn btn-primary" onclick="continueToDashboard()">Continue to Dashboard</button>';

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
    updateDashboard();
    showScreen('dashboard');
}

// ============================================
// PHASE 5: FINISH RACE VIEW (refactored flow)
// ============================================

function finishRaceView() {
    if (GameState.currentRaceIndex >= GameState.races.length) {
        // Final race: go to season ceremony
        showSeasonCeremony();
    } else {
        // Non-final race: apply training and show between-races
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

    html += `<button class="btn btn-primary" onclick="startNextSeason()">Continue to Season ${GameState.season + 1}</button>`;

    document.getElementById('ceremony-content').innerHTML = html;
    showScreen('season-ceremony');
}

function startNextSeason() {
    GameState.season++;
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

    updateDashboard();
    showScreen('dashboard');
}

// ============================================
// THE YARD - Isometric Walkable Training Yard
// ============================================

const YARD_COLS = 20;
const YARD_ROWS = 16;
const TILE_W = 64;
const TILE_H = 32;
const YARD_ORIGIN_X = 640;
const YARD_ORIGIN_Y = 40;

// Tile types: 0=grass, 1=path, 2=cobble, 3=dirt, 4=paddock, 5=fence, 6=solid, 7=gate
const YARD_TILE_NAMES = ['grass','path','cobble','dirt','paddock','fence','solid','gate'];

// Yard layout map: row-major [row][col]
const YARD_MAP = [
    [5,5,5,5,5,5,5,0,0,0,0,0,5,5,5,5,5,5,5,5],
    [5,4,4,4,4,4,5,0,0,0,0,0,5,3,3,3,3,3,5,0],
    [5,4,4,4,4,4,5,0,0,0,0,0,5,3,3,3,3,3,5,0],
    [5,4,4,4,4,4,5,0,0,0,0,0,5,3,3,3,3,3,5,0],
    [5,5,5,5,5,5,5,0,0,0,0,0,5,5,5,5,5,5,5,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0],
    [0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,6,6,6,2,6,6,6,2,2,1,1,1,2,6,6,6,6,2],
    [2,2,6,6,6,2,6,6,6,2,2,1,1,1,2,6,6,6,6,2],
    [2,2,2,2,2,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2],
    [5,5,5,5,5,5,5,5,5,7,7,7,7,5,5,5,5,5,5,5],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Walkable check: 0=grass, 1=path, 2=cobble, 3=dirt, 4=paddock are walkable; 5=fence, 6=solid blocked; 7=gate=interactable+walkable
function isWalkable(r, c) {
    if (r < 0 || r >= YARD_ROWS || c < 0 || c >= YARD_COLS) return false;
    const t = YARD_MAP[r][c];
    return t !== 5 && t !== 6;
}

// Buildings definition: { id, type, label, gridR, gridC, gridW, gridH, wallH }
const YARD_BUILDINGS = [
    { id: 'stable',  type: 'stable',  label: 'Stables',       gridR: 6, gridC: 2, gridW: 16, gridH: 2, wallH: 48 },
    { id: 'tack',    type: 'tack',    label: 'Tack Room',     gridR: 11, gridC: 2, gridW: 3, gridH: 2, wallH: 36 },
    { id: 'feed',    type: 'feed',    label: 'Feed Store',    gridR: 11, gridC: 6, gridW: 3, gridH: 2, wallH: 36 },
    { id: 'office',  type: 'office',  label: 'Office',        gridR: 11, gridC: 15, gridW: 4, gridH: 2, wallH: 40 },
    { id: 'ring',    type: 'ring',    label: 'Training Ring', gridR: 1, gridC: 13, gridW: 5, gridH: 3, wallH: 4 },
    { id: 'paddock', type: 'paddock-area', label: 'Paddock',  gridR: 1, gridC: 1, gridW: 5, gridH: 3, wallH: 4 },
];

// Stall positions (row=8 = south face of stable, 6 stalls)
const YARD_STALLS = [
    { idx: 0, gridR: 8, gridC: 3 },
    { idx: 1, gridR: 8, gridC: 5 },
    { idx: 2, gridR: 8, gridC: 7 },
    { idx: 3, gridR: 8, gridC: 10 },
    { idx: 4, gridR: 8, gridC: 12 },
    { idx: 5, gridR: 8, gridC: 14 },
];

// Interactable spots: { id, gridR, gridC, prompt, handler }
const YARD_INTERACTABLES = [
    // Stall doors - generated dynamically
    { id: 'tack',    gridR: 11, gridC: 3, prompt: 'Look in Tack Room',   handler: 'tack' },
    { id: 'tack2',   gridR: 11, gridC: 4, prompt: 'Look in Tack Room',   handler: 'tack' },
    { id: 'feed',    gridR: 11, gridC: 7, prompt: 'Look in Feed Store',   handler: 'feed' },
    { id: 'feed2',   gridR: 11, gridC: 8, prompt: 'Look in Feed Store',   handler: 'feed' },
    { id: 'office',  gridR: 11, gridC: 16, prompt: 'Enter Office',        handler: 'office' },
    { id: 'office2', gridR: 11, gridC: 17, prompt: 'Enter Office',        handler: 'office' },
    { id: 'ring',    gridR: 4, gridC: 14, prompt: 'Watch Training Ring',  handler: 'ring' },
    { id: 'ring2',   gridR: 4, gridC: 15, prompt: 'Watch Training Ring',  handler: 'ring' },
    { id: 'paddock', gridR: 4, gridC: 2,  prompt: 'Look at Paddock',      handler: 'paddock' },
    { id: 'paddock2',gridR: 4, gridC: 3,  prompt: 'Look at Paddock',      handler: 'paddock' },
    { id: 'gate',    gridR: 14, gridC: 10, prompt: 'Leave the Yard',      handler: 'gate' },
    { id: 'gate2',   gridR: 14, gridC: 11, prompt: 'Leave the Yard',      handler: 'gate' },
];

const YardState = {
    active: false,
    playerR: 9,
    playerC: 10,
    facing: 'down',
    openDoors: {},     // stallIdx -> true
    keyHandler: null,
    keyUpHandler: null,
    walkingTimeout: null,
    panelOpen: false,
};

function yardIsoX(c, r) {
    return (c - r) * (TILE_W / 2) + YARD_ORIGIN_X;
}

function yardIsoY(c, r) {
    return (c + r) * (TILE_H / 2) + YARD_ORIGIN_Y;
}

function yardIsoZ(c, r) {
    return c + r;
}

function buildYardTiles() {
    const world = document.getElementById('yard-world');
    let tilesHTML = '';
    for (let r = 0; r < YARD_ROWS; r++) {
        for (let c = 0; c < YARD_COLS; c++) {
            const t = YARD_MAP[r][c];
            if (t === 6) continue; // solid = building occupies
            const tName = YARD_TILE_NAMES[t] || 'grass';
            const x = yardIsoX(c, r);
            const y = yardIsoY(c, r);
            const z = yardIsoZ(c, r);
            tilesHTML += `<div class="yard-tile ${tName}" style="left:${x}px;top:${y}px;z-index:${z};"></div>`;
        }
    }
    world.innerHTML = tilesHTML;
}

function buildYardBuildings() {
    const world = document.getElementById('yard-world');

    YARD_BUILDINGS.forEach(bldg => {
        const el = document.createElement('div');
        el.className = `yard-building ${bldg.type}`;
        el.dataset.id = bldg.id;

        // Top face position (isometric diamond)
        const topX = yardIsoX(bldg.gridC, bldg.gridR);
        const topY = yardIsoY(bldg.gridC, bldg.gridR);
        const topW = bldg.gridW * (TILE_W / 2) + bldg.gridH * (TILE_W / 2);
        const topH = bldg.gridW * (TILE_H / 2) + bldg.gridH * (TILE_H / 2);

        el.style.left = topX + 'px';
        el.style.top = (topY - bldg.wallH) + 'px';
        el.style.zIndex = yardIsoZ(bldg.gridC + bldg.gridW, bldg.gridR + bldg.gridH) + 1;

        // Top face
        const top = document.createElement('div');
        top.className = 'bldg-top';
        top.style.width = topW + 'px';
        top.style.height = topH + 'px';
        top.style.left = '0px';
        top.style.top = '0px';
        el.appendChild(top);

        // Left face (front-left wall)
        if (bldg.wallH > 8) {
            const leftW = bldg.gridH * (TILE_W / 2);
            const left = document.createElement('div');
            left.className = 'bldg-left';
            left.style.width = leftW + 'px';
            left.style.height = bldg.wallH + 'px';
            left.style.left = '0px';
            left.style.top = (topH / 2) + 'px';
            el.appendChild(left);

            // Right face (front-right wall)
            const rightW = bldg.gridW * (TILE_W / 2);
            const right = document.createElement('div');
            right.className = 'bldg-right';
            right.style.width = rightW + 'px';
            right.style.height = bldg.wallH + 'px';
            right.style.left = (topW / 2) + 'px';
            right.style.top = (topH / 2) + 'px';
            el.appendChild(right);
        }

        // Label
        const label = document.createElement('div');
        label.className = 'yard-building-label';
        label.textContent = bldg.label;
        label.style.left = (topW / 2 - 20) + 'px';
        label.style.top = (bldg.wallH > 8 ? -14 : topH / 2 - 8) + 'px';
        el.appendChild(label);

        world.appendChild(el);
    });
}

function buildYardStalls() {
    const world = document.getElementById('yard-world');

    YARD_STALLS.forEach((stall, idx) => {
        const x = yardIsoX(stall.gridC, stall.gridR);
        const y = yardIsoY(stall.gridC, stall.gridR);
        const z = yardIsoZ(stall.gridC, stall.gridR) + 5;

        // Door element
        const door = document.createElement('div');
        door.className = 'yard-stall-door';
        door.dataset.stallIdx = idx;
        door.style.left = (x + 22) + 'px';
        door.style.top = (y - 14) + 'px';
        door.style.zIndex = z;
        world.appendChild(door);

        // Horse inside (hidden until door opens)
        const horseInside = document.createElement('div');
        horseInside.className = 'yard-stall-horse';
        horseInside.dataset.stallIdx = idx;
        horseInside.style.left = (x + 17) + 'px';
        horseInside.style.top = (y - 24) + 'px';
        horseInside.style.zIndex = z - 1;
        world.appendChild(horseInside);

        // Name plate above occupied stalls
        const horses = GameState.horses.filter(h => !h.isYearling);
        if (idx < horses.length) {
            const plate = document.createElement('div');
            plate.className = 'yard-stall-nameplate';
            plate.textContent = horses[idx].name;
            plate.style.left = (x + 16) + 'px';
            plate.style.top = (y - 32) + 'px';
            plate.style.zIndex = z + 1;
            world.appendChild(plate);
        }
    });
}

function placeHorsesInStalls() {
    const horses = GameState.horses.filter(h => !h.isYearling);
    YARD_STALLS.forEach((stall, idx) => {
        const horseEl = document.querySelector(`.yard-stall-horse[data-stall-idx="${idx}"]`);
        if (!horseEl) return;
        if (idx < horses.length) {
            const h = horses[idx];
            const body = h.silkPrimary || '#6b3a1f';
            const accent = h.silkSecondary || '#5a2e16';
            horseEl.innerHTML = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" style="width:30px;height:20px;">
                <!-- Body -->
                <path d="M12,22 Q9,18 9,14 Q9,10 14,10 L30,9 Q34,7 37,4 Q39,2 42,2 Q46,1.5 47,3 Q49,3.5 50,6 Q50.5,8 49,9 L44,14 Q42,17 40,21 L38,24 Q28,20 16,24 Z" fill="${body}"/>
                <!-- Mane -->
                <path d="M36,5 Q34,3 33,6 Q31,4 30,7 Q28,5.5 27,8 Q26,7 25,9.5" stroke="${accent}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <!-- Tail -->
                <path d="M12,22 Q8,20 6,22 Q4,25 7,27 Q5,28 6,30" stroke="${accent}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
                <!-- Front legs -->
                <line x1="34" y1="23" x2="35" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
                <line x1="30" y1="23" x2="31" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
                <!-- Back legs -->
                <line x1="20" y1="24" x2="19" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
                <line x1="16" y1="24" x2="15" y2="32" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/>
                <!-- Hooves -->
                <rect x="34" y="31" width="2.5" height="2" rx="0.5" fill="#333"/>
                <rect x="30" y="31" width="2.5" height="2" rx="0.5" fill="#333"/>
                <rect x="18" y="31" width="2.5" height="2" rx="0.5" fill="#333"/>
                <rect x="14" y="31" width="2.5" height="2" rx="0.5" fill="#333"/>
                <!-- Eye -->
                <circle cx="47" cy="4.5" r="1" fill="#222"/>
                <circle cx="47.3" cy="4.2" r="0.3" fill="#fff"/>
                <!-- Ears -->
                <polygon points="44,2 42,0 44,1" fill="${accent}"/>
                <polygon points="46,1.5 44.5,0 46.5,0.8" fill="${accent}"/>
                <!-- Nostril -->
                <circle cx="50" cy="7" r="0.5" fill="#3a1a0a"/>
            </svg>`;
        } else {
            horseEl.innerHTML = '';
        }
    });

    // Add stall interactables
    YARD_STALLS.forEach((stall, idx) => {
        // Interactable on the row in front of the stall (row 8 is stall, player stands on row 8 path)
        if (!YARD_INTERACTABLES.find(ia => ia.id === `stall${idx}`)) {
            YARD_INTERACTABLES.push({
                id: `stall${idx}`,
                gridR: stall.gridR,
                gridC: stall.gridC,
                prompt: idx < GameState.horses.filter(h => !h.isYearling).length ? 'Open stable door' : 'Empty stall',
                handler: 'stall',
                stallIdx: idx
            });
        }
    });
}

function placeYardExtras() {
    const world = document.getElementById('yard-world');

    // Yearlings in paddock
    const yearlings = GameState.horses.filter(h => h.isYearling);
    yearlings.slice(0, 3).forEach((h, i) => {
        const pr = 2 + Math.floor(i / 2);
        const pc = 2 + (i % 3);
        const x = yardIsoX(pc, pr);
        const y = yardIsoY(pc, pr);
        const el = document.createElement('div');
        el.className = 'yard-grazing-horse';
        el.style.left = (x + 10 + i * 8) + 'px';
        el.style.top = (y - 6) + 'px';
        el.style.zIndex = yardIsoZ(pc, pr) + 2;
        el.innerHTML = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <!-- Grazing body - head lowered -->
            <path d="M12,20 Q9,17 9,13 Q9,9 14,9 L30,8 Q34,9 38,12 Q40,14 42,18 L44,22 Q48,24 50,28 L48,29 Q44,26 40,24 Q32,20 16,24 Z" fill="#8b6a4a"/>
            <!-- Mane -->
            <path d="M34,10 Q32,8 31,11 Q29,9 28,12" stroke="#6b4a2a" stroke-width="1" fill="none" stroke-linecap="round"/>
            <!-- Tail -->
            <path d="M12,20 Q8,18 6,20 Q4,23 7,25" stroke="#6b4a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
            <!-- Legs -->
            <line x1="34" y1="22" x2="35" y2="30" stroke="#8b6a4a" stroke-width="2" stroke-linecap="round"/>
            <line x1="30" y1="22" x2="31" y2="30" stroke="#8b6a4a" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="23" x2="19" y2="30" stroke="#8b6a4a" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="23" x2="15" y2="30" stroke="#8b6a4a" stroke-width="2" stroke-linecap="round"/>
            <!-- Hooves -->
            <rect x="34" y="29" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="30" y="29" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="18" y="29" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="14" y="29" width="2" height="1.5" rx="0.5" fill="#333"/>
            <!-- Eye -->
            <circle cx="46" cy="25" r="0.7" fill="#222"/>
            <!-- Ear -->
            <polygon points="42,17 40,15 42.5,16" fill="#7b5a3a"/>
        </svg>`;
        world.appendChild(el);
    });

    // Horses in training ring
    const trainingHorses = GameState.horses.filter(h => h.trainingFocus && !h.isYearling);
    trainingHorses.slice(0, 2).forEach((h, i) => {
        const pr = 2 + i;
        const pc = 14 + i;
        const x = yardIsoX(pc, pr);
        const y = yardIsoY(pc, pr);
        const el = document.createElement('div');
        el.className = 'yard-training-horse trotting';
        el.style.left = (x + 10) + 'px';
        el.style.top = (y - 4) + 'px';
        el.style.zIndex = yardIsoZ(pc, pr) + 2;
        const tBody = h.silkPrimary || '#6b3a1f';
        const tAccent = h.silkSecondary || '#5a2e16';
        el.innerHTML = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <!-- Trotting body -->
            <path d="M12,22 Q9,18 9,14 Q9,10 14,10 L30,9 Q34,7 37,4 Q39,2 42,2 Q46,1.5 47,3 Q49,3.5 50,6 Q50.5,8 49,9 L44,14 Q42,17 40,21 L38,24 Q28,20 16,24 Z" fill="${tBody}"/>
            <!-- Mane -->
            <path d="M36,5 Q34,3 33,6 Q31,4.5 30,7" stroke="${tAccent}" stroke-width="1" fill="none" stroke-linecap="round"/>
            <!-- Tail -->
            <path d="M12,22 Q8,20 7,23 Q6,25 8,26" stroke="${tAccent}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
            <!-- Legs (trotting pose) -->
            <line x1="34" y1="23" x2="37" y2="31" stroke="${tBody}" stroke-width="2" stroke-linecap="round"/>
            <line x1="30" y1="23" x2="28" y2="31" stroke="${tBody}" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="24" x2="22" y2="31" stroke="${tBody}" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="24" x2="13" y2="31" stroke="${tBody}" stroke-width="2" stroke-linecap="round"/>
            <!-- Hooves -->
            <rect x="36" y="30" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="27" y="30" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="21" y="30" width="2" height="1.5" rx="0.5" fill="#333"/>
            <rect x="12" y="30" width="2" height="1.5" rx="0.5" fill="#333"/>
            <!-- Eye -->
            <circle cx="47" cy="4.5" r="0.8" fill="#222"/>
            <!-- Ear -->
            <polygon points="44,2 42.5,0 44.5,1" fill="${tAccent}"/>
        </svg>`;
        world.appendChild(el);
    });

    // --- Environmental Decorations ---

    // Trees along grass edges
    const treeDefs = [
        { r: 0, c: 8, scale: 1.0 },
        { r: 0, c: 10, scale: 0.85 },
        { r: 15, c: 2, scale: 0.9 },
    ];
    treeDefs.forEach(t => {
        const x = yardIsoX(t.c, t.r);
        const y = yardIsoY(t.c, t.r);
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (x + 10) + 'px';
        el.style.top = (y - 50 * t.scale) + 'px';
        el.style.zIndex = yardIsoZ(t.c, t.r) + 3;
        const s = t.scale;
        el.innerHTML = `<svg viewBox="0 0 40 60" width="${40*s}" height="${60*s}" xmlns="http://www.w3.org/2000/svg">
            <rect x="17" y="35" width="6" height="25" rx="2" fill="#6b4226"/>
            <path d="M1,36 Q4,28 8,24 Q12,18 14,10 Q16,4 20,2 Q24,4 26,10 Q28,18 32,24 Q36,28 39,36 Q30,40 20,40 Q10,40 1,36 Z" fill="#3a7a28"/>
            <path d="M6,34 Q10,26 14,20 Q17,12 20,8 Q23,12 26,20 Q30,26 34,34 Q27,37 20,37 Q13,37 6,34 Z" fill="#4a8a34" opacity="0.7"/>
        </svg>`;
        world.appendChild(el);
    });

    // Hay bales near feed store
    const hayDefs = [
        { r: 13, c: 6, rot: 0 },
        { r: 13, c: 7, rot: 15 },
    ];
    hayDefs.forEach(h => {
        const x = yardIsoX(h.c, h.r);
        const y = yardIsoY(h.c, h.r);
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        el.style.left = (x + 14) + 'px';
        el.style.top = (y - 10) + 'px';
        el.style.zIndex = yardIsoZ(h.c, h.r) + 3;
        el.innerHTML = `<svg viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${h.rot}deg)">
            <rect x="1" y="2" width="18" height="10" rx="2" fill="#c8a84e"/>
            <line x1="4" y1="2" x2="4" y2="12" stroke="#b09030" stroke-width="0.5"/>
            <line x1="10" y1="2" x2="10" y2="12" stroke="#b09030" stroke-width="0.5"/>
            <line x1="16" y1="2" x2="16" y2="12" stroke="#b09030" stroke-width="0.5"/>
            <rect x="1" y="2" width="18" height="10" rx="2" fill="none" stroke="#a08028" stroke-width="0.8"/>
        </svg>`;
        world.appendChild(el);
    });

    // Water trough near stables
    const troughX = yardIsoX(16, 8);
    const troughY = yardIsoY(16, 8);
    const trough = document.createElement('div');
    trough.className = 'yard-decoration';
    trough.style.left = (troughX + 12) + 'px';
    trough.style.top = (troughY - 8) + 'px';
    trough.style.zIndex = yardIsoZ(16, 8) + 3;
    trough.innerHTML = `<svg viewBox="0 0 28 14" width="28" height="14" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="3" width="26" height="10" rx="2" fill="#7a6a5a"/>
        <rect x="2" y="4" width="24" height="8" rx="1.5" fill="#5a8ab0"/>
        <rect x="2" y="4" width="24" height="3" rx="1" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="2" width="3" height="12" rx="1" fill="#6a5a4a"/>
        <rect x="25" y="2" width="3" height="12" rx="1" fill="#6a5a4a"/>
    </svg>`;
    world.appendChild(trough);

    // Flower boxes on the office
    const flowerX = yardIsoX(16, 11);
    const flowerY = yardIsoY(16, 11);
    const flowers = document.createElement('div');
    flowers.className = 'yard-decoration';
    flowers.style.left = (flowerX + 20) + 'px';
    flowers.style.top = (flowerY - 48) + 'px';
    flowers.style.zIndex = yardIsoZ(16, 11) + 4;
    flowers.innerHTML = `<svg viewBox="0 0 24 16" width="24" height="16" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="9" width="20" height="6" rx="1" fill="#6b4226"/>
        <rect x="3" y="10" width="18" height="4" rx="0.5" fill="#5a3518"/>
        <circle cx="5" cy="7" r="2.5" fill="#e84040"/>
        <circle cx="9" cy="6" r="2" fill="#e8d040"/>
        <circle cx="14" cy="7" r="2.5" fill="#d050a0"/>
        <circle cx="19" cy="6" r="2" fill="#e84040"/>
        <line x1="5" y1="9" x2="5" y2="7" stroke="#3a8020" stroke-width="0.8"/>
        <line x1="9" y1="9" x2="9" y2="6" stroke="#3a8020" stroke-width="0.8"/>
        <line x1="14" y1="9" x2="14" y2="7" stroke="#3a8020" stroke-width="0.8"/>
        <line x1="19" y1="9" x2="19" y2="6" stroke="#3a8020" stroke-width="0.8"/>
    </svg>`;
    world.appendChild(flowers);

    // Wheelbarrow near tack room
    const wbX = yardIsoX(5, 13);
    const wbY = yardIsoY(5, 13);
    const wheelbarrow = document.createElement('div');
    wheelbarrow.className = 'yard-decoration';
    wheelbarrow.style.left = (wbX + 12) + 'px';
    wheelbarrow.style.top = (wbY - 12) + 'px';
    wheelbarrow.style.zIndex = yardIsoZ(5, 13) + 3;
    wheelbarrow.innerHTML = `<svg viewBox="0 0 30 20" width="26" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M6,8 L12,4 L26,4 L28,10 L8,14 Z" fill="#7a8a7a" stroke="#5a6a5a" stroke-width="0.8"/>
        <path d="M8,14 L6,8 L4,10" stroke="#6a5a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M28,10 L26,14" stroke="#6a5a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <circle cx="4" cy="14" r="3" fill="none" stroke="#5a4a3a" stroke-width="1.5"/>
        <circle cx="4" cy="14" r="0.8" fill="#5a4a3a"/>
    </svg>`;
    world.appendChild(wheelbarrow);

    // Weathervane on stable roof
    const wvX = yardIsoX(9, 6);
    const wvY = yardIsoY(9, 6);
    const weathervane = document.createElement('div');
    weathervane.className = 'yard-decoration';
    weathervane.style.left = (wvX + 28) + 'px';
    weathervane.style.top = (wvY - 68) + 'px';
    weathervane.style.zIndex = yardIsoZ(9, 6) + 6;
    weathervane.innerHTML = `<svg viewBox="0 0 24 30" width="18" height="24" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="30" x2="12" y2="6" stroke="#444" stroke-width="1.2"/>
        <line x1="4" y1="10" x2="20" y2="10" stroke="#444" stroke-width="0.8"/>
        <text x="3" y="9" font-size="4" fill="#444" font-weight="bold">W</text>
        <text x="18" y="9" font-size="4" fill="#444" font-weight="bold">E</text>
        <!-- Horse silhouette -->
        <path d="M7,6 Q8,3 10,2 Q11,1 12,1 Q13,1.5 14,3 Q15,2 16,2 Q17,2.5 17,4 Q16,5 14,5.5 L10,6 Q8,6.5 7,6 Z" fill="#444"/>
        <polygon points="20,6 17,5 17,7" fill="#444"/>
    </svg>`;
    world.appendChild(weathervane);
}

function updatePlayerPosition() {
    const player = document.getElementById('yard-player');
    const x = yardIsoX(YardState.playerC, YardState.playerR);
    const y = yardIsoY(YardState.playerC, YardState.playerR);
    player.style.left = (x + 20) + 'px';
    player.style.top = (y - 20) + 'px';
    player.style.zIndex = yardIsoZ(YardState.playerC, YardState.playerR) + 10;

    // Set silk colours on player
    player.style.setProperty('--silk-primary', GameState.silkPrimary);
    player.style.setProperty('--silk-secondary', GameState.silkSecondary);
}

function updateYardCamera() {
    const viewport = document.querySelector('.yard-viewport');
    if (!viewport) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const px = yardIsoX(YardState.playerC, YardState.playerR) + 32;
    const py = yardIsoY(YardState.playerC, YardState.playerR) + 16;
    const tx = vw / 2 - px;
    const ty = vh / 2 - py;
    const world = document.getElementById('yard-world');
    world.style.transform = `translate(${tx}px, ${ty}px)`;
}

function checkYardInteractable() {
    const prompt = document.getElementById('yard-interact-prompt');
    const pr = YardState.playerR;
    const pc = YardState.playerC;

    // Check adjacent + current tile
    const checkPositions = [
        { r: pr, c: pc },
        { r: pr - 1, c: pc },
        { r: pr + 1, c: pc },
        { r: pr, c: pc - 1 },
        { r: pr, c: pc + 1 },
    ];

    for (const pos of checkPositions) {
        const ia = YARD_INTERACTABLES.find(i => i.gridR === pos.r && i.gridC === pos.c);
        if (ia) {
            const x = yardIsoX(YardState.playerC, YardState.playerR);
            const y = yardIsoY(YardState.playerC, YardState.playerR);
            prompt.style.left = (x + 10) + 'px';
            prompt.style.top = (y - 40) + 'px';
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

function moveYardPlayer(dr, dc) {
    if (YardState.panelOpen) return;
    const nr = YardState.playerR + dr;
    const nc = YardState.playerC + dc;
    if (!isWalkable(nr, nc)) return;

    YardState.playerR = nr;
    YardState.playerC = nc;

    // Walking animation
    const player = document.getElementById('yard-player');
    player.classList.add('walking');
    clearTimeout(YardState.walkingTimeout);
    YardState.walkingTimeout = setTimeout(() => player.classList.remove('walking'), 400);

    updatePlayerPosition();
    updateYardCamera();
    checkYardInteractable();
}

function interactAtPlayer() {
    const ia = YardState._currentInteractable;
    if (!ia) return;

    switch (ia.handler) {
        case 'stall': handleStallInteract(ia); break;
        case 'tack': handleTackInteract(); break;
        case 'feed': handleFeedInteract(); break;
        case 'office': handleOfficeInteract(); break;
        case 'ring': handleRingInteract(); break;
        case 'paddock': handlePaddockInteract(); break;
        case 'gate': exitYard(); break;
    }
}

function handleStallInteract(ia) {
    const idx = ia.stallIdx;
    const horses = GameState.horses.filter(h => !h.isYearling);

    // Toggle door
    const door = document.querySelector(`.yard-stall-door[data-stall-idx="${idx}"]`);
    if (door) {
        if (door.classList.contains('open')) {
            door.classList.remove('open');
            YardState.openDoors[idx] = false;
            closeYardPanel();
            return;
        }
        door.classList.add('open');
        YardState.openDoors[idx] = true;
    }

    if (idx >= horses.length) {
        showYardPanel('<h3>Empty Stall</h3><p>This stall is unoccupied. Buy more horses at Tattersalls!</p>');
        return;
    }

    const h = horses[idx];
    const condClass = h.condition >= 70 ? 'color:var(--color-success)' : h.condition >= 40 ? 'color:var(--color-warning)' : 'color:var(--color-danger)';
    const trainingText = h.trainingFocus ? capitalizeFirst(h.trainingFocus) : 'None';

    showYardPanel(`
        <h3>${h.name}</h3>
        <div class="yard-horse-info">
            <div>
                <span style="font-size:0.85rem;color:var(--color-text-light)">${h.age} yrs · OR ${h.officialRating || '--'}</span>
            </div>
        </div>
        <div class="yard-stat-row"><span class="stat-label">Speed</span><span class="stat-value">${h.speed}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Stamina</span><span class="stat-value">${h.stamina}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Acceleration</span><span class="stat-value">${h.acceleration}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Temperament</span><span class="stat-value">${h.temperament}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Condition</span><span class="stat-value" style="${condClass}">${h.condition}%</span></div>
        <div class="yard-stat-row"><span class="stat-label">Training</span><span class="stat-value">${trainingText}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Wins / Races</span><span class="stat-value">${h.wins} / ${h.racesRun}</span></div>
        ${h.isInjured ? `<p style="color:var(--color-danger);margin-top:var(--space-sm);">Injured: ${h.injuryType} (${h.recoveryRacesLeft} races left)</p>` : ''}
    `);
}

function handleTackInteract() {
    const count = GameState.horses.length;
    showYardPanel(`
        <h3>Tack Room</h3>
        <p>Saddles hung neatly on racks, bridles polished and ready.</p>
        <div class="yard-stat-row"><span class="stat-label">Saddles</span><span class="stat-value">${count}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Bridles</span><span class="stat-value">${count}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Horse Rugs</span><span class="stat-value">${count * 2}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Girths</span><span class="stat-value">${count}</span></div>
        <p style="margin-top:var(--space-md);font-style:italic;color:var(--color-text-muted)">Everything is in order. The lads keep a tidy ship.</p>
    `);
}

function handleFeedInteract() {
    const count = GameState.horses.length;
    const weeklyCost = count * 350;
    showYardPanel(`
        <h3>Feed Store</h3>
        <p>Bags of oats, hay bales, and supplements stacked high.</p>
        <div class="yard-stat-row"><span class="stat-label">Horses to Feed</span><span class="stat-value">${count}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Weekly Feed Cost</span><span class="stat-value">\u00A3${formatMoney(weeklyCost)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Hay Bales</span><span class="stat-value">${count * 4}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Oats (bags)</span><span class="stat-value">${count * 2}</span></div>
        <p style="margin-top:var(--space-md);font-style:italic;color:var(--color-text-muted)">Supplies are well stocked for the season ahead.</p>
    `);
}

function handleOfficeInteract() {
    const sorted = [...GameState.standings].sort((a, b) => b.points - a.points);
    const playerRank = sorted.findIndex(s => s.isPlayer) + 1;
    const playerPts = sorted.find(s => s.isPlayer)?.points || 0;
    const nextRace = GameState.races[GameState.currentRaceIndex];
    const nextRaceText = nextRace && !nextRace.completed ? nextRace.name : 'Season complete';

    let standingsHTML = sorted.slice(0, 5).map((s, i) =>
        `<div class="yard-stat-row"><span class="stat-label">${i + 1}. ${s.name}${s.isPlayer ? ' (You)' : ''}</span><span class="stat-value">${s.points} pts</span></div>`
    ).join('');

    showYardPanel(`
        <h3>Trainer's Office</h3>
        <div class="yard-stat-row"><span class="stat-label">Season</span><span class="stat-value">${GameState.season}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">\u00A3${formatMoney(GameState.budget)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Standing</span><span class="stat-value">${getOrdinal(playerRank)} (${playerPts} pts)</span></div>
        <div class="yard-stat-row"><span class="stat-label">Next Race</span><span class="stat-value">${nextRaceText}</span></div>
        <h3 style="margin-top:var(--space-md)">Standings</h3>
        ${standingsHTML}
    `);
}

function handleRingInteract() {
    const trainingHorses = GameState.horses.filter(h => h.trainingFocus && !h.isYearling);
    let listHTML;
    if (trainingHorses.length === 0) {
        listHTML = '<p>The training ring is empty. Set a training focus for your horses in the stable screen.</p>';
    } else {
        listHTML = trainingHorses.map(h =>
            `<div class="yard-stat-row"><span class="stat-label">${h.name}</span><span class="stat-value">${capitalizeFirst(h.trainingFocus)}</span></div>`
        ).join('');
    }
    showYardPanel(`<h3>Training Ring</h3><p>Horses currently in training:</p>${listHTML}`);
}

function handlePaddockInteract() {
    const yearlings = GameState.horses.filter(h => h.isYearling);
    let listHTML;
    if (yearlings.length === 0) {
        listHTML = '<p>The paddock is empty. Buy yearlings at the yearling sale to see them grazing here.</p>';
    } else {
        listHTML = yearlings.map(h =>
            `<div class="yard-stat-row"><span class="stat-label">${h.name}</span><span class="stat-value">Yearling</span></div>`
        ).join('');
    }
    showYardPanel(`<h3>Paddock</h3><p>Yearlings grazing peacefully:</p>${listHTML}`);
}

function showYardPanel(contentHTML) {
    const panel = document.getElementById('yard-panel');
    document.getElementById('yard-panel-content').innerHTML = contentHTML;
    panel.style.display = 'block';
    YardState.panelOpen = true;
}

function closeYardPanel() {
    document.getElementById('yard-panel').style.display = 'none';
    YardState.panelOpen = false;

    // Close all open doors
    document.querySelectorAll('.yard-stall-door.open').forEach(d => d.classList.remove('open'));
    YardState.openDoors = {};
}

function onYardKeyDown(e) {
    if (!YardState.active) return;

    switch (e.key) {
        case 'w': case 'W': case 'ArrowUp':    e.preventDefault(); moveYardPlayer(-1, 0); break;
        case 's': case 'S': case 'ArrowDown':   e.preventDefault(); moveYardPlayer(1, 0); break;
        case 'a': case 'A': case 'ArrowLeft':   e.preventDefault(); moveYardPlayer(0, -1); break;
        case 'd': case 'D': case 'ArrowRight':  e.preventDefault(); moveYardPlayer(0, 1); break;
        case 'e': case 'E':
            e.preventDefault();
            if (YardState.panelOpen) {
                closeYardPanel();
            } else {
                interactAtPlayer();
            }
            break;
        case 'Escape':
            e.preventDefault();
            if (YardState.panelOpen) {
                closeYardPanel();
            } else {
                exitYard();
            }
            break;
    }
}

function openYard() {
    if (GameState.horses.length === 0) {
        gameAlert('The Yard', 'Your yard is empty! Buy some horses first.');
        return;
    }

    YardState.active = true;
    YardState.playerR = 9;
    YardState.playerC = 10;
    YardState.openDoors = {};
    YardState.panelOpen = false;

    buildYardTiles();
    buildYardBuildings();
    buildYardStalls();
    placeHorsesInStalls();
    placeYardExtras();
    updatePlayerPosition();

    showScreen('yard');

    // Delay camera update to after layout
    requestAnimationFrame(() => {
        updateYardCamera();
        checkYardInteractable();
    });

    // Add keyboard listeners
    YardState.keyHandler = onYardKeyDown;
    document.addEventListener('keydown', YardState.keyHandler);
}

function exitYard() {
    YardState.active = false;
    closeYardPanel();

    if (YardState.keyHandler) {
        document.removeEventListener('keydown', YardState.keyHandler);
        YardState.keyHandler = null;
    }

    // Clean up stall interactables (remove dynamic ones)
    for (let i = YARD_INTERACTABLES.length - 1; i >= 0; i--) {
        if (YARD_INTERACTABLES[i].id.startsWith('stall')) {
            YARD_INTERACTABLES.splice(i, 1);
        }
    }

    updateDashboard();
    showScreen('dashboard');
}

// Make functions globally available
window.selectRace = selectRace;
window.toggleHorseForRace = toggleHorseForRace;
window.setHorseStrategy = setHorseStrategy;
window.makeDecision = makeDecision;
window.quickSetTraining = quickSetTraining;
window.continueToDashboard = continueToDashboard;
window.startNextSeason = startNextSeason;
window.openGallops = openGallops;
window.selectGallopsYearling = selectGallopsYearling;
window.selectGallopsFocus = selectGallopsFocus;
window.runSellingAuction = runSellingAuction;

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateContinueButton();

    // Phase 2: Render colour picker on setup screen
    renderSilkColourPicker();

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
        if (loadGame()) {
            showScreen('dashboard');
        }
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

    document.getElementById('btn-back-from-setup').addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.getElementById('btn-start-career').addEventListener('click', () => {
        const stableName = document.getElementById('trainer-name').value.trim();
        const selectedDifficulty = document.querySelector('.difficulty-btn.selected');
        const budget = parseInt(selectedDifficulty.dataset.budget);
        const difficulty = selectedDifficulty.dataset.difficulty;

        startNewGame(stableName, budget, difficulty);
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
            showScreen('dashboard');
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
            showScreen('dashboard');
        }
    });

    document.getElementById('btn-start-yearling-sale').addEventListener('click', startLiveYearlingSale);
    document.getElementById('btn-next-yearling-lot').addEventListener('click', nextYearlingLot);
    document.getElementById('btn-finish-yearling-sale').addEventListener('click', finishYearlingSale);

    // Gallops buttons
    document.getElementById('nav-gallops').addEventListener('click', () => openGallops());

    // The Yard buttons
    document.getElementById('nav-yard').addEventListener('click', () => openYard());

    document.getElementById('btn-yard-back').addEventListener('click', () => exitYard());

    document.getElementById('btn-yard-panel-close').addEventListener('click', () => closeYardPanel());

    document.getElementById('btn-gallops-back').addEventListener('click', async () => {
        if (GallopsState.isGalloping) {
            const confirmed = await gameConfirm('Leave Gallops', 'A workout is in progress. Leave anyway?');
            if (confirmed) {
                if (GallopsState.gallopsInterval) { clearInterval(GallopsState.gallopsInterval); GallopsState.gallopsInterval = null; }
                if (GallopsState.hoofStop) { GallopsState.hoofStop(); GallopsState.hoofStop = null; }
                GallopsState.isGalloping = false;
                showScreen('dashboard');
            }
        } else {
            showScreen('dashboard');
        }
    });

    document.getElementById('btn-gallops-back-select').addEventListener('click', () => {
        document.getElementById('gallops-focus').style.display = 'none';
        document.getElementById('gallops-select').style.display = '';
        renderGallopsYearlings();
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
        renderGallopsYearlings();
    });

    document.getElementById('btn-gallops-dashboard').addEventListener('click', () => {
        updateDashboard();
        showScreen('dashboard');
    });

    // Selling auction buttons
    document.getElementById('btn-next-selling-lot').addEventListener('click', nextSellingLot);
    document.getElementById('btn-finish-selling-auction').addEventListener('click', finishSellingAuction);

    // Stable buttons
    document.getElementById('btn-stable-back').addEventListener('click', () => {
        showScreen('dashboard');
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
                clearInterval(RaceState.decisionTimer);
                if (RaceState.crowdStop) { RaceState.crowdStop(); RaceState.crowdStop = null; }
                if (RaceState.hoofStop) { RaceState.hoofStop(); RaceState.hoofStop = null; }
                RaceState.isRacing = false;
                showScreen('dashboard');
            }
        } else {
            showScreen('dashboard');
        }
    });

    document.getElementById('btn-back-to-calendar').addEventListener('click', () => {
        document.getElementById('race-horse-select').style.display = 'none';
        document.getElementById('race-calendar').style.display = 'block';
    });

    document.getElementById('btn-back-to-horses').addEventListener('click', () => {
        document.getElementById('race-strategy').style.display = 'none';
        document.getElementById('race-horse-select').style.display = 'block';
    });

    // Multi-horse: Enter Race and Start Race buttons
    document.getElementById('btn-enter-race').addEventListener('click', proceedToStrategy);
    document.getElementById('btn-start-race').addEventListener('click', startRace);

    document.getElementById('btn-finish-race').addEventListener('click', finishRaceView);

    // Phase 4: Mute buttons
    document.getElementById('btn-mute').addEventListener('click', () => SoundManager.toggleMute());
    document.getElementById('btn-mute-menu').addEventListener('click', () => SoundManager.toggleMute());
});

// Debug
window.GameState = GameState;
window.generateHorse = generateHorse;
