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
    ownsLorry: false
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
        name: 'Un-named',
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

        // Stall care decline each race day
        const care = horse.stallCare;
        if (!care) return;

        care.feedLevel = Math.max(0, care.feedLevel - 20);
        care.waterLevel = Math.max(0, care.waterLevel - 25);
        care.hayLevel = Math.max(0, care.hayLevel - 15);

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

    openYardHub();
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

    return { trainingResults, trainingInjuries, setbackReports };
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

    // Pre-select horse delivered by lorry
    if (RaceState._lorryHorseIdx != null) {
        const lorryHorse = GameState.horses[RaceState._lorryHorseIdx];
        if (lorryHorse && !lorryHorse.isYearling && !lorryHorse.isInjured) {
            RaceState.selectedHorseIds.add(lorryHorse.id);
        }
        RaceState._lorryHorseIdx = null;
    }

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
        const notTackedUp = !horse.tackedUp?.saddle || !horse.tackedUp?.bridle;
        let warningText = '';
        if (isInjured) {
            warningText = `\u{1F6AB} ${horse.injuryType} - Out for ${horse.recoveryRacesLeft} more race${horse.recoveryRacesLeft > 1 ? 's' : ''}`;
        } else if (isPendingSale) {
            warningText = '\u{1F6AB} Listed for sale at Tattersalls';
        } else if (notTackedUp) {
            warningText = 'Not tacked up — visit the Tack Room in the yard';
        } else if (horse.condition < 70) {
            warningText = 'Low condition will affect performance';
        }

        const isDisabled = isInjured || isPendingSale || notTackedUp;
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
        return `
            <div class="player-horse-result">
                <p>${hr.name}: <strong>${getOrdinal(hr.place)} place</strong>${prizeText} (+${hr.points} pts)</p>
                ${ratingLine}
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

// Building definitions
const OUTDOOR_BLDGS = [
    { id: 'barn',        label: 'The Barn',      r: 10, c: 15, w: 10, h: 6, css: 'barn' },
    { id: 'tack-store',  label: 'Tack Store',    r: 12, c: 3,  w: 5,  h: 4, css: 'tack-store' },
    { id: 'feed-mill',   label: 'Feed Mill',     r: 12, c: 32, w: 5,  h: 4, css: 'feed-mill' },
    { id: 'tattersalls', label: "Tattersall's",   r: 3,  c: 2,  w: 7,  h: 4, css: 'tattersalls' },
    { id: 'gallops',     label: 'The Gallops',   r: 3,  c: 31, w: 7,  h: 4, css: 'gallops-bldg' },
    { id: 'racecourse',  label: 'Racecourse',    r: 24, c: 28, w: 9,  h: 4, css: 'racecourse' },
    { id: 'forage',      label: 'Forage & Bedding', r: 25, c: 3,  w: 6, h: 3, css: 'forage' },
    { id: 'supplier',    label: 'Stable Supplier',  r: 25, c: 14, w: 6, h: 3, css: 'supplier' },
    { id: 'trainer-house', label: "Trainer's House", r: 3, c: 16, w: 7, h: 4, css: 'trainer-house' },
    { id: 'vet', label: "Vet's Office", r: 3, c: 25, w: 5, h: 4, css: 'vet' },
    { id: 'mechanics', label: 'Mechanics', r: 3, c: 10, w: 5, h: 4, css: 'mechanics' },
];

// Outdoor interactables
const OUTDOOR_INTERACT = [
    { id: 'barn-e1',  r: 16, c: 19, prompt: 'Enter the Barn',      handler: 'enter-barn' },
    { id: 'barn-e2',  r: 16, c: 20, prompt: 'Enter the Barn',      handler: 'enter-barn' },
    { id: 'tack-s1',  r: 16, c: 5,  prompt: 'Visit Tack Store',    handler: 'tack-store' },
    { id: 'tack-s2',  r: 16, c: 6,  prompt: 'Visit Tack Store',    handler: 'tack-store' },
    { id: 'feed-m1',  r: 16, c: 33, prompt: 'Visit Feed Mill',     handler: 'feed-mill' },
    { id: 'feed-m2',  r: 16, c: 34, prompt: 'Visit Feed Mill',     handler: 'feed-mill' },
    { id: 'tatt-1',   r: 7,  c: 5,  prompt: "Enter Tattersall's",  handler: 'tattersalls' },
    { id: 'tatt-2',   r: 7,  c: 6,  prompt: "Enter Tattersall's",  handler: 'tattersalls' },
    { id: 'gall-1',   r: 7,  c: 33, prompt: 'Head to the Gallops', handler: 'gallops' },
    { id: 'gall-2',   r: 7,  c: 34, prompt: 'Head to the Gallops', handler: 'gallops' },
    { id: 'race-1',   r: 23, c: 31, prompt: 'Go to Racecourse',    handler: 'racecourse' },
    { id: 'race-2',   r: 23, c: 32, prompt: 'Go to Racecourse',    handler: 'racecourse' },
    { id: 'for-1',    r: 24, c: 5,  prompt: 'Visit Forage & Bedding', handler: 'forage' },
    { id: 'for-2',    r: 24, c: 6,  prompt: 'Visit Forage & Bedding', handler: 'forage' },
    { id: 'sup-1',    r: 24, c: 16, prompt: 'Visit Stable Supplier',  handler: 'supplier' },
    { id: 'sup-2',    r: 24, c: 17, prompt: 'Visit Stable Supplier',  handler: 'supplier' },
    { id: 'th-1',     r: 7,  c: 19, prompt: "Enter Trainer's House",  handler: 'trainer-house' },
    { id: 'th-2',     r: 7,  c: 20, prompt: "Enter Trainer's House",  handler: 'trainer-house' },
    { id: 'vet-1',    r: 7,  c: 27, prompt: "Visit the Vet",         handler: 'vet' },
    { id: 'vet-2',    r: 7,  c: 28, prompt: "Visit the Vet",         handler: 'vet' },
    { id: 'pad-1',    r: 23, c: 7,  prompt: 'Turn Out to Paddock',   handler: 'paddock' },
    { id: 'pad-2',    r: 23, c: 8,  prompt: 'Turn Out to Paddock',   handler: 'paddock' },
    { id: 'mech-1',   r: 7,  c: 11, prompt: 'Visit Mechanics',       handler: 'mechanics' },
    { id: 'mech-2',   r: 7,  c: 12, prompt: 'Visit Mechanics',       handler: 'mechanics' },
    { id: 'lorry-1',  r: 18, c: 22, prompt: 'Horse Lorry',           handler: 'lorry' },
    { id: 'lorry-2',  r: 18, c: 23, prompt: 'Horse Lorry',           handler: 'lorry' },
];

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

    // Fence border
    fill(0, 0, 0, C-1, T_FENCE);
    fill(R-1, 0, R-1, C-1, T_FENCE);
    for (let r = 0; r < R; r++) { map[r][0] = T_FENCE; map[r][C-1] = T_FENCE; }

    // Cobblestone courtyard around barn
    fill(8, 12, 18, 26, T_COBBLE);

    // Main east-west path (rows 16-17)
    for (let c = 1; c < C-1; c++) { map[16][c] = T_PATH; map[17][c] = T_PATH; }

    // NW path to Tattersalls (L-shaped, avoids Tack Store cols 3-7)
    for (let r = 8; r <= 16; r++) { map[r][9] = T_PATH; map[r][10] = T_PATH; }   // vertical segment east of Tack Store
    for (let c = 5; c <= 12; c++) { map[8][c] = T_PATH; }                          // horizontal connector at row 8
    for (let r = 7; r <= 8; r++) { map[r][5] = T_PATH; map[r][6] = T_PATH; }      // short stub to Tattersalls entrance
    for (let r = 7; r <= 8; r++) { map[r][11] = T_PATH; map[r][12] = T_PATH; }    // stub to Mechanics entrance

    // NE path to Gallops (L-shaped, avoids Feed Mill cols 32-36)
    for (let r = 8; r <= 16; r++) { map[r][29] = T_PATH; map[r][30] = T_PATH; }   // vertical segment west of Feed Mill
    for (let c = 29; c <= 34; c++) { map[8][c] = T_PATH; }                          // horizontal connector at row 8
    for (let r = 7; r <= 8; r++) { map[r][33] = T_PATH; map[r][34] = T_PATH; }    // short stub to Gallops entrance

    // South path from barn (cols 19-20, rows 18-24)
    for (let r = 18; r <= 24; r++) { map[r][19] = T_PATH; map[r][20] = T_PATH; }

    // West branch connecting Forage & Supplier (rows 24-25, cols 5-20)
    for (let c = 5; c <= 20; c++) { map[24][c] = T_PATH; map[25][c] = T_PATH; }

    // SE branch to Racecourse (rows 22-23, cols 20-32)
    for (let c = 20; c <= 32; c++) { map[22][c] = T_PATH; map[23][c] = T_PATH; }

    // Paddock area (SW)
    fill(20, 3, 23, 10, T_PADDOCK);

    // Small pond
    fill(20, 25, 22, 26, T_WATER);

    // North path to Trainer's House and Vet's Office (row 7)
    for (let c = 19; c <= 28; c++) { map[7][c] = T_PATH; }

    // Buildings (solid, placed last to overwrite)
    OUTDOOR_BLDGS.forEach(b => fill(b.r, b.c, b.r + b.h - 1, b.c + b.w - 1, T_BLDG));

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
    return YardState.currentZone === 'outdoor' ? YardState.outdoorMap : YardState.barnMap;
}

function buildZoneMap() {
    const world = document.getElementById('yard-world');
    const map = getCurrentMap();
    if (!map) return;
    const rows = map.length;
    const cols = map[0].length;
    const isOutdoor = YardState.currentZone === 'outdoor';
    const names = isOutdoor ? TILE_CSS : YardState.currentZone === 'feedroom' ? FEEDROOM_CSS : YardState.currentZone === 'stall' ? STALL_CSS : BARN_CSS;

    world.style.width = (cols * TILE_SIZE) + 'px';
    world.style.height = (rows * TILE_SIZE) + 'px';

    let html = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = map[r][c];
            if (isOutdoor && t === T_BLDG) continue;
            const css = names[t] || 'grass';
            html += `<div class="yard-tile ${css}" style="left:${c * TILE_SIZE}px;top:${r * TILE_SIZE}px"></div>`;
        }
    }
    world.innerHTML = html;
}

function buildOutdoorBuildings() {
    const world = document.getElementById('yard-world');
    OUTDOOR_BLDGS.forEach(b => {
        const el = document.createElement('div');
        el.className = `yard-building-2d ${b.css}`;
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

function buildOutdoorDecorations() {
    const world = document.getElementById('yard-world');
    const treePositions = [
        {r:1,c:12},{r:1,c:20},{r:1,c:25},{r:1,c:38},
        {r:28,c:2},{r:28,c:14},{r:28,c:22},{r:28,c:38},
        {r:8,c:1},{r:14,c:1},{r:22,c:1},{r:8,c:38},{r:14,c:38},
    ];
    treePositions.forEach(t => {
        const el = document.createElement('div');
        el.className = 'yard-decoration';
        const s = 0.8 + Math.random() * 0.3;
        el.style.left = (t.c * TILE_SIZE) + 'px';
        el.style.top = (t.r * TILE_SIZE - 30 * s) + 'px';
        el.style.zIndex = 3;
        el.innerHTML = `<svg viewBox="0 0 40 60" width="${Math.round(32*s)}" height="${Math.round(48*s)}">
            <rect x="17" y="35" width="6" height="25" rx="2" fill="#6b4226"/>
            <path d="M1,36 Q4,28 8,24 Q12,18 14,10 Q16,4 20,2 Q24,4 26,10 Q28,18 32,24 Q36,28 39,36 Q30,40 20,40 Q10,40 1,36 Z" fill="#3a7a28"/>
            <path d="M6,34 Q10,26 14,20 Q17,12 20,8 Q23,12 26,20 Q30,26 34,34 Q27,37 20,37 Q13,37 6,34 Z" fill="#4a8a34" opacity="0.7"/>
        </svg>`;
        world.appendChild(el);
    });

    // Horses in paddock: all turned-out horses
    const paddockHorses = GameState.horses.filter(h => h.paddockTurnedOut);
    paddockHorses.forEach((h, i) => {
        const col = 3 + (i % 8);
        const row = 20 + Math.floor(i / 8);
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
        const lorryEl = document.createElement('div');
        lorryEl.id = 'yard-parked-lorry';
        lorryEl.className = 'yard-decoration';
        lorryEl.style.left = (22 * TILE_SIZE) + 'px';
        lorryEl.style.top = (17 * TILE_SIZE - 8) + 'px';
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
    return YardState.currentZone === 'outdoor' ? TILE_WALK[t] : BARN_WALK[t];
}

function movePlayer2D(dr, dc) {
    if (YardState.panelOpen) closeYardPanel();
    const nr = YardState.playerR + dr;
    const nc = YardState.playerC + dc;
    if (!isWalkable2D(nr, nc)) return;

    YardState.playerR = nr;
    YardState.playerC = nc;

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
        ? OUTDOOR_INTERACT
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
    switch (e.key) {
        case 'w': case 'W': case 'ArrowUp':    e.preventDefault(); movePlayer2D(-1, 0); break;
        case 's': case 'S': case 'ArrowDown':   e.preventDefault(); movePlayer2D(1, 0); break;
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
        case 'racecourse':   leaveYardForScreen(); openRaces(); break;
        case 'expand-barn':  handleExpandBarn(); break;
        case 'forage':       handleForageInteract(); break;
        case 'supplier':     handleSupplierInteract(); break;
        case 'trainer-house': handleTrainerHouseInteract(); break;
        case 'vet':          handleVetInteract(); break;
        case 'paddock':
            if (YardState.leadingHorse && !YardState.leadingHorse.returning) handlePaddockDeliverHorse();
            else handlePaddockInteract();
            break;
        case 'mechanics':    handleMechanicsInteract(); break;
        case 'lorry':        handleLorryInteract(); break;
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
        requestAnimationFrame(() => {
            updatePlayerPosition2D();
            updateCamera2D();
            checkInteractable2D();
            fade.classList.remove('active');
        });
    }, 200);
}

function exitBarn() {
    const fade = document.getElementById('yard-zone-fade');
    fade.classList.add('active');
    setTimeout(() => {
        YardState.currentZone = 'outdoor';
        YardState.playerR = 17;
        YardState.playerC = 19;
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
            <span style="font-size:0.85rem;color:var(--color-text-light)">${h.age} yr${h.age > 1 ? 's' : ''}${h.isYearling ? ' (Yearling)' : ''} \u00B7 OR ${h.officialRating || '--'}</span>
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

    showYardPanel(`
        <h3>Stable Supplier</h3>
        <p>Barn expansions and upgrades for passive bonuses.</p>
        <div class="yard-stat-row"><span class="stat-label">Your Budget</span><span class="stat-value">\u00A3${formatMoney(budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <h4 style="margin:var(--space-sm) 0;">Expansion</h4>
        ${expandRow}
        <h4 style="margin:var(--space-sm) 0;">Upgrades</h4>
        ${upgradeRows}
    `);
}

function handleTrainerHouseInteract() {
    GameState.lastSaved = new Date().toISOString();
    const saveData = JSON.stringify(GameState);
    localStorage.setItem('championTrainer_save', saveData);
    const horses = GameState.horses;
    showYardPanel(`
        <h3>Trainer's House</h3>
        <p style="color:var(--color-success);font-weight:600;">Game saved!</p>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        <div class="yard-stat-row"><span class="stat-label">Stable</span><span class="stat-value">${GameState.stableName}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Season</span><span class="stat-value">${GameState.season}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
        <div class="yard-stat-row"><span class="stat-label">Horses</span><span class="stat-value">${horses.length}</span></div>
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
    showYardPanel(`
        <h3>Vet's Office</h3>
        <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
        <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
        ${rows}
    `);
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
    if (GameState.ownsLorry) {
        showYardPanel(`
            <h3>Mechanics</h3>
            <p style="margin-bottom:var(--space-sm);color:var(--color-success);">You already own a horse lorry! It's parked outside the barn.</p>
        `);
    } else {
        const canAfford = GameState.budget >= 70000;
        showYardPanel(`
            <h3>Mechanics</h3>
            <p style="margin-bottom:var(--space-sm);color:var(--color-text-muted);">Need to transport your horses to the racecourse? Buy a horse lorry and drive them there yourself.</p>
            <div class="yard-stat-row"><span class="stat-label">Budget</span><span class="stat-value">£${formatMoney(GameState.budget)}</span></div>
            <hr style="margin:var(--space-sm) 0;border-color:var(--color-bg-dark);">
            <div class="yard-stat-row">
                <span class="stat-label">Horse Lorry</span>
                <button class="btn btn-small" ${canAfford ? '' : 'disabled'} onclick="buyLorry()">Buy (£${formatMoney(70000)})</button>
            </div>
        `);
    }
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
    YardState.active = true;
    YardState.currentZone = 'outdoor';
    YardState.playerR = 18;
    YardState.playerC = 19;
    YardState.panelOpen = false;
    YardState._currentInteractable = null;
    YardState.lorryMode = false;
    YardState.lorryHorseIdx = null;
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

    buildZoneMap();
    buildOutdoorBuildings();
    buildOutdoorDecorations();
    updateYardHUD();

    showScreen('yard');
    window.scrollTo(0, 0);

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
                clearInterval(RaceState.decisionTimer);
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
    document.getElementById('btn-mute-yard').addEventListener('click', () => SoundManager.toggleMute());
});

// Debug
window.GameState = GameState;
window.generateHorse = generateHorse;
