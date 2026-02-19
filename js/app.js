// Color Blindness Test - Game Logic
;(function() {
'use strict';

const _t = (k, fb) => (window.i18n && window.i18n.t(k) !== k ? window.i18n.t(k) : fb);

// === Game Config ===
const LEVELS = [
    { grid: 2, diff: 40 },  // Level 1: 2x2, big diff
    { grid: 2, diff: 30 },  // Level 2
    { grid: 3, diff: 28 },  // Level 3: 3x3
    { grid: 3, diff: 24 },  // Level 4
    { grid: 3, diff: 20 },  // Level 5
    { grid: 4, diff: 18 },  // Level 6: 4x4
    { grid: 4, diff: 16 },  // Level 7
    { grid: 4, diff: 14 },  // Level 8
    { grid: 5, diff: 12 },  // Level 9: 5x5
    { grid: 5, diff: 10 },  // Level 10
    { grid: 5, diff: 9 },   // Level 11
    { grid: 6, diff: 8 },   // Level 12: 6x6
    { grid: 6, diff: 7 },   // Level 13
    { grid: 6, diff: 6 },   // Level 14
    { grid: 6, diff: 5 },   // Level 15
    { grid: 7, diff: 5 },   // Level 16: 7x7
    { grid: 7, diff: 4 },   // Level 17
    { grid: 7, diff: 4 },   // Level 18
    { grid: 8, diff: 3 },   // Level 19: 8x8
    { grid: 8, diff: 3 },   // Level 20
    { grid: 8, diff: 2 },   // Level 21
    { grid: 9, diff: 2 },   // Level 22: 9x9
    { grid: 9, diff: 2 },   // Level 23
    { grid: 10, diff: 2 },  // Level 24: 10x10
    { grid: 10, diff: 1 },  // Level 25: final boss
];

const MAX_LIVES = 3;
const TIMER_DURATION = 10000; // 10 seconds
const BASE_SCORE = 100;

// === Game State ===
let state = {
    level: 0,
    score: 0,
    lives: MAX_LIVES,
    correctCount: 0,
    timerStart: 0,
    timerInterval: null,
    isPlaying: false,
    differentIndex: -1,
};

// === DOM References ===
const $ = id => document.getElementById(id);
const startScreen = $('start-screen');
const gameScreen = $('game-screen');
const resultScreen = $('result-screen');
const gridContainer = $('grid-container');
const levelDisplay = $('level-display');
const scoreDisplay = $('score-display');
const livesDisplay = $('lives-display');
const timerFill = $('timer-fill');
const gameInstruction = $('game-instruction');
const levelIndicator = $('level-indicator');

// === Utility: Generate random HSL color ===
function randomHSL() {
    const h = Math.floor(Math.random() * 360);
    const s = 50 + Math.floor(Math.random() * 30); // 50-80%
    const l = 40 + Math.floor(Math.random() * 20); // 40-60%
    return { h, s, l };
}

// === Utility: Create different color ===
function getDifferentColor(base, diff) {
    // Shift hue by diff, randomly + or -
    const direction = Math.random() > 0.5 ? 1 : -1;
    let newH = (base.h + diff * direction + 360) % 360;
    // Also slightly shift lightness for extra subtlety at high levels
    let newL = base.l + (Math.random() > 0.5 ? 2 : -2);
    newL = Math.max(25, Math.min(75, newL));
    return { h: newH, s: base.s, l: newL };
}

function hslStr(c) {
    return `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
}

// === Show Screen ===
function showScreen(screen) {
    [startScreen, gameScreen, resultScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// === Update HUD ===
function updateHUD() {
    levelDisplay.textContent = state.level + 1;
    scoreDisplay.textContent = state.score;
    const hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
        hearts.push(i < state.lives ? '\u2764' : '\u{1F5A4}');
    }
    livesDisplay.innerHTML = hearts.join(' ');
}

// === Timer ===
function startTimer() {
    state.timerStart = Date.now();
    timerFill.style.width = '100%';
    timerFill.classList.remove('warning', 'danger');

    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        const elapsed = Date.now() - state.timerStart;
        const remaining = Math.max(0, TIMER_DURATION - elapsed);
        const pct = (remaining / TIMER_DURATION) * 100;
        timerFill.style.width = pct + '%';

        if (pct < 30) {
            timerFill.classList.add('danger');
            timerFill.classList.remove('warning');
        } else if (pct < 50) {
            timerFill.classList.add('warning');
            timerFill.classList.remove('danger');
        }

        if (remaining <= 0) {
            clearInterval(state.timerInterval);
            handleTimeout();
        }
    }, 50);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// === Generate Level ===
function generateLevel() {
    const config = LEVELS[Math.min(state.level, LEVELS.length - 1)];
    const gridSize = config.grid;
    const diff = config.diff;
    const totalTiles = gridSize * gridSize;

    // Set grid template
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridContainer.innerHTML = '';

    // Generate base color
    const baseColor = randomHSL();
    const diffColor = getDifferentColor(baseColor, diff);

    // Pick random different tile
    state.differentIndex = Math.floor(Math.random() * totalTiles);

    // Create tiles
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'color-tile';
        tile.style.background = i === state.differentIndex ? hslStr(diffColor) : hslStr(baseColor);
        tile.dataset.index = i;
        tile.addEventListener('click', () => handleTileTap(i, tile));
        gridContainer.appendChild(tile);
    }

    // Update instruction
    gameInstruction.textContent = _t('game.instruction', 'Tap the different color!');

    updateHUD();
    startTimer();
}

// === Show Level Indicator ===
function showLevelIndicator() {
    const lvlText = _t('game.levelUp', 'Level') + ' ' + (state.level + 1);
    levelIndicator.textContent = lvlText;
    levelIndicator.classList.remove('show');
    void levelIndicator.offsetWidth; // force reflow
    levelIndicator.classList.add('show');
}

// === Handle Tile Tap ===
function handleTileTap(index, tile) {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    stopTimer();

    if (index === state.differentIndex) {
        // Correct!
        tile.classList.add('correct');
        state.correctCount++;

        // Calculate score: base + speed bonus
        const elapsed = Date.now() - state.timerStart;
        const timeBonus = Math.max(0, Math.floor((TIMER_DURATION - elapsed) / TIMER_DURATION * 50));
        const levelBonus = (state.level + 1) * 5;
        const roundScore = BASE_SCORE + timeBonus + levelBonus;
        state.score += roundScore;

        // Show feedback
        gameInstruction.textContent = _t('game.correct', 'Correct!') + ' +' + roundScore;
        gameInstruction.style.color = 'var(--success)';

        // Advance level
        setTimeout(() => {
            gameInstruction.style.color = '';
            state.level++;
            if (state.level >= LEVELS.length) {
                // Won the game!
                endGame();
            } else {
                showLevelIndicator();
                setTimeout(() => {
                    state.isPlaying = true;
                    generateLevel();
                }, 600);
            }
        }, 500);
    } else {
        // Wrong!
        tile.classList.add('wrong');
        // Highlight the correct tile
        const correctTile = gridContainer.children[state.differentIndex];
        if (correctTile) correctTile.classList.add('correct');

        state.lives--;
        updateHUD();

        gameInstruction.textContent = _t('game.wrong', 'Wrong!');
        gameInstruction.style.color = 'var(--danger)';

        if (state.lives <= 0) {
            setTimeout(() => endGame(), 800);
        } else {
            setTimeout(() => {
                gameInstruction.style.color = '';
                state.isPlaying = true;
                generateLevel();
            }, 800);
        }
    }
}

// === Handle Timeout ===
function handleTimeout() {
    if (!state.isPlaying) return;
    state.isPlaying = false;

    // Highlight the correct tile
    const correctTile = gridContainer.children[state.differentIndex];
    if (correctTile) correctTile.classList.add('correct');

    state.lives--;
    updateHUD();

    gameInstruction.textContent = _t('game.timeUp', "Time's up!");
    gameInstruction.style.color = 'var(--warning)';

    if (state.lives <= 0) {
        setTimeout(() => endGame(), 800);
    } else {
        setTimeout(() => {
            gameInstruction.style.color = '';
            state.isPlaying = true;
            generateLevel();
        }, 800);
    }
}

// === Calculate Sensitivity Score ===
function calculateSensitivity() {
    // Score 0-100 based on level reached and correct answers
    const maxLevel = LEVELS.length;
    const levelPct = Math.min(state.level / maxLevel, 1);
    const correctPct = state.correctCount / Math.max(state.level, 1);

    // Weighted: 70% level progress, 30% accuracy
    let sensitivity = Math.round(levelPct * 70 + correctPct * 30);
    sensitivity = Math.max(0, Math.min(100, sensitivity));
    return sensitivity;
}

// === Get Grade Data ===
function getGradeData(score) {
    if (score >= 90) return {
        emoji: '\u{1F451}',
        titleKey: 'result.grade.legendary.title',
        titleFb: 'Legendary Color Vision!',
        descKey: 'result.grade.legendary.desc',
        descFb: 'Your color sensitivity is at the top 1%! You can distinguish extremely subtle color differences that most people cannot see.'
    };
    if (score >= 75) return {
        emoji: '\u{1F31F}',
        titleKey: 'result.grade.excellent.title',
        titleFb: 'Excellent Color Vision!',
        descKey: 'result.grade.excellent.desc',
        descFb: 'Your color perception is outstanding! You have a keen eye for color differences.'
    };
    if (score >= 60) return {
        emoji: '\u{1F60E}',
        titleKey: 'result.grade.great.title',
        titleFb: 'Great Color Vision!',
        descKey: 'result.grade.great.desc',
        descFb: 'Above average color sensitivity. You can spot most color differences with ease.'
    };
    if (score >= 40) return {
        emoji: '\u{1F440}',
        titleKey: 'result.grade.good.title',
        titleFb: 'Good Color Vision',
        descKey: 'result.grade.good.desc',
        descFb: 'Your color perception is normal. You can distinguish common color differences well.'
    };
    if (score >= 20) return {
        emoji: '\u{1F9D0}',
        titleKey: 'result.grade.average.title',
        titleFb: 'Average Color Vision',
        descKey: 'result.grade.average.desc',
        descFb: 'Your color sensitivity is average. Some subtle differences may be hard to spot.'
    };
    return {
        emoji: '\u{1F50D}',
        titleKey: 'result.grade.developing.title',
        titleFb: 'Developing Color Vision',
        descKey: 'result.grade.developing.desc',
        descFb: 'Keep practicing! Color sensitivity can improve with training.'
    };
}

// === End Game - Show Results ===
function endGame() {
    stopTimer();
    showScreen(resultScreen);

    const sensitivity = calculateSensitivity();
    const grade = getGradeData(sensitivity);

    // Animate score ring
    const scoreCircle = $('score-circle');
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (sensitivity / 100) * circumference;
    setTimeout(() => {
        scoreCircle.style.strokeDashoffset = offset;
    }, 100);

    // Animate score number
    animateNumber($('score-number'), 0, sensitivity, 1500);

    // Set result text
    $('result-title').textContent = grade.emoji + ' ' + _t(grade.titleKey, grade.titleFb);
    $('result-desc').textContent = _t(grade.descKey, grade.descFb);

    // Stats
    $('stat-level').textContent = state.level;
    $('stat-correct').textContent = state.correctCount;
    $('stat-total-score').textContent = state.score;

    // Grade detail
    const gradeEl = $('result-grade');
    const gradeLines = [];
    if (sensitivity >= 75) {
        gradeLines.push(_t('result.gradeDetail.top', 'You are in the top tier of color perception!'));
    }
    gradeLines.push(
        _t('result.gradeDetail.level', 'You reached level') + ' ' + state.level + ' ' +
        _t('result.gradeDetail.outOf', 'out of') + ' ' + LEVELS.length
    );
    gradeLines.push(
        _t('result.gradeDetail.accuracy', 'Accuracy') + ': ' +
        Math.round((state.correctCount / Math.max(state.level, 1)) * 100) + '%'
    );
    gradeEl.innerHTML = gradeLines.join('<br>');

    // GA4 event
    if (typeof gtag === 'function') {
        gtag('event', 'color_test_complete', {
            score: sensitivity,
            level_reached: state.level,
            total_score: state.score
        });
    }
}

// === Animate Number ===
function animateNumber(el, start, end, duration) {
    const startTime = Date.now();
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (end - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// === Share Functions ===
function getShareText() {
    const sensitivity = calculateSensitivity();
    return _t('share.text', 'My color sensitivity score is') + ' ' + sensitivity + '/100! ' +
           _t('share.challenge', 'Can you beat me?') + ' ' +
           'https://dopabrain.com/color-blindness/';
}

function shareTwitter() {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function copyURL() {
    const url = 'https://dopabrain.com/color-blindness/';
    navigator.clipboard.writeText(url).then(() => {
        const btn = $('btn-copy');
        const original = btn.textContent;
        btn.textContent = _t('share.copied', 'Copied!');
        setTimeout(() => { btn.textContent = original; }, 2000);
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = 'https://dopabrain.com/color-blindness/';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

// === Start Game ===
function startGame() {
    state = {
        level: 0,
        score: 0,
        lives: MAX_LIVES,
        correctCount: 0,
        timerStart: 0,
        timerInterval: null,
        isPlaying: true,
        differentIndex: -1,
    };

    showScreen(gameScreen);
    showLevelIndicator();
    setTimeout(() => {
        generateLevel();
    }, 600);
}

// === Theme Toggle ===
function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'dark'); // default dark
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = $('theme-toggle');
    btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
}

// === Language Setup ===
function initLanguage() {
    const langToggle = $('lang-toggle');
    const langMenu = $('lang-menu');

    langToggle.addEventListener('click', () => {
        langMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', async () => {
            const lang = btn.dataset.lang;
            if (window.i18n) {
                await window.i18n.setLanguage(lang);
                updateActiveLang(lang);
                // Re-update game instruction if playing
                if (state.isPlaying) {
                    gameInstruction.textContent = _t('game.instruction', 'Tap the different color!');
                }
            }
            langMenu.classList.add('hidden');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) {
            langMenu.classList.add('hidden');
        }
    });

    // Set initial active
    if (window.i18n) {
        updateActiveLang(window.i18n.getCurrentLanguage());
    }
}

function updateActiveLang(lang) {
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// === Init ===
async function init() {
    initTheme();

    // Load i18n
    if (window.i18n) {
        await window.i18n.loadTranslations(window.i18n.currentLang);
        window.i18n.updateUI();
    }

    initLanguage();

    // Event listeners
    $('btn-start').addEventListener('click', startGame);
    $('btn-retry').addEventListener('click', startGame);
    $('btn-twitter').addEventListener('click', shareTwitter);
    $('btn-copy').addEventListener('click', copyURL);
    $('theme-toggle').addEventListener('click', toggleTheme);

    // Hide loader
    const loader = $('app-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Wait for DOM + i18n
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
} else {
    setTimeout(init, 100);
}

})();
