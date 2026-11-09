import { countPossibleSecrets, createDigitValidator, DIGITS, generateSecret, isValidGuess, } from './logic.js';
import { addRecord, createGame, parseRecords, submitGuess } from './game.js';
function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
}
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
const baseNames = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };
const storageKey = 'bulls-and-cows.records';
let game = null;
let timer;
let records = [];
const header = element('header', '', 'site-header');
const brand = element('a', 'BC', 'brand');
brand.href = '#main';
brand.setAttribute('aria-label', 'Bulls and Cows home');
header.append(brand, element('span', 'A LITTLE LOGIC GOES A LONG WAY', 'header-note'));
const main = element('main');
main.id = 'main';
const intro = element('section', '', 'intro');
intro.append(element('p', 'THE CLASSIC CODE-BREAKING GAME', 'eyebrow'), element('h1', 'Bulls & Cows'));
intro.append(element('p', 'One secret. A few good guesses. All you need is logic.', 'intro-copy'));
const layout = element('div', '', 'layout');
const panel = element('section', '', 'panel game-panel');
panel.setAttribute('aria-labelledby', 'game-heading');
const panelHeading = element('div', '', 'panel-heading');
const heading = element('h2', 'Crack the code');
heading.id = 'game-heading';
const status = element('span', 'READY', 'status');
panelHeading.append(heading, status);
const settingsForm = element('form', '', 'settings-form');
const settingsFieldset = element('fieldset', '', 'settings-fields');
settingsFieldset.append(element('legend', 'Set up your round'));
const baseLabel = element('label', 'Number system');
const baseSelect = element('select');
baseSelect.id = 'base';
baseLabel.htmlFor = baseSelect.id;
for (const base of [2, 8, 10, 16]) {
    const option = element('option', `${baseNames[base]} · Base ${base}`);
    option.value = String(base);
    baseSelect.append(option);
}
baseSelect.value = '10';
const lengthLabel = element('label', 'Code length');
const lengthSelect = element('select');
lengthSelect.id = 'length';
lengthLabel.htmlFor = lengthSelect.id;
for (const length of [2, 3, 4, 5, 6]) {
    const option = element('option', `${length} digits`);
    option.value = String(length);
    lengthSelect.append(option);
}
lengthSelect.value = '4';
const baseField = element('div', '', 'field');
baseField.append(baseLabel, baseSelect);
const lengthField = element('div', '', 'field');
lengthField.append(lengthLabel, lengthSelect);
settingsFieldset.append(baseField, lengthField);
const possibilities = element('p', '', 'possibilities');
const startButton = element('button', 'Start a round', 'button primary');
startButton.type = 'submit';
settingsForm.append(settingsFieldset, possibilities, startButton);
const playArea = element('div', '', 'play-area');
playArea.hidden = true;
const secretSlots = element('div', '', 'secret-slots');
secretSlots.setAttribute('aria-label', 'Hidden secret code');
const stats = element('div', '', 'stats');
const attemptsStat = element('p');
const attemptsCount = element('strong', '0');
attemptsStat.append(attemptsCount, element('span', 'ATTEMPTS'));
const timeStat = element('p');
const timeCount = element('strong', '00:00');
timeStat.append(timeCount, element('span', 'TIME'));
stats.append(attemptsStat, timeStat);
const guessForm = element('form', '', 'guess-form');
const guessLabel = element('label', 'Your guess');
const input = element('input');
input.id = 'guess';
input.name = 'guess';
input.type = 'text';
input.autocomplete = 'off';
input.spellcheck = false;
input.setAttribute('autocapitalize', 'off');
input.setAttribute('aria-describedby', 'alphabet feedback');
guessLabel.htmlFor = input.id;
const submitButton = element('button', 'Check guess', 'button primary');
submitButton.type = 'submit';
const guessControls = element('div', '', 'guess-controls');
guessControls.append(input, submitButton);
const alphabet = element('p', '', 'input-hint');
alphabet.id = 'alphabet';
const feedback = element('p', 'Your first guess starts the trail.', 'feedback');
feedback.id = 'feedback';
feedback.setAttribute('role', 'status');
guessForm.append(guessLabel, guessControls, alphabet, feedback);
const historyHeading = element('h3', 'Your trail', 'history-heading');
const history = element('ol', '', 'history');
history.setAttribute('aria-label', 'Guess history');
const newGameButton = element('button', 'New game', 'button secondary');
newGameButton.type = 'button';
playArea.append(secretSlots, stats, guessForm, historyHeading, history, newGameButton);
panel.append(panelHeading, settingsForm, playArea);
const aside = element('aside');
const rules = element('section', '', 'panel rules');
rules.append(element('p', 'A QUICK FIELD GUIDE', 'eyebrow'), element('h2', 'How to play'));
rules.append(element('p', 'Guess the secret code. Every digit is different, and zero can come first.'));
const bullRule = element('p', '', 'rule');
bullRule.append(element('span', 'BULL', 'badge bull'), element('span', 'Right digit, right place.'));
const cowRule = element('p', '', 'rule');
cowRule.append(element('span', 'COW', 'badge cow'), element('span', 'Right digit, different place.'));
rules.append(bullRule, cowRule);
const example = element('div', '', 'example');
example.append(element('p', 'For example'), element('p', 'Secret 4271 · Guess 4710', 'example-code'));
example.append(element('p', '1 bull · 2 cows'));
rules.append(example, element('p', 'No attempt limit. Fewer guesses win; time breaks a tie.', 'muted'));
const recordsPanel = element('section', '', 'panel records-panel');
recordsPanel.append(element('p', 'PERSONAL BESTS', 'eyebrow'), element('h2', 'The top ten'));
recordsPanel.append(element('p', 'Ranked by attempts, then time. Each result shows its settings.', 'muted'));
const recordsList = element('ol', '', 'records');
const recordsEmpty = element('p', 'A clean slate. Solve a code to put your name on the board.', 'empty');
const storageNotice = element('p', '', 'storage-notice');
storageNotice.setAttribute('role', 'status');
recordsPanel.append(recordsEmpty, recordsList, storageNotice);
aside.append(rules, recordsPanel);
layout.append(panel, aside);
main.append(intro, layout);
const footer = element('footer');
const github = element('a', 'Kiril on GitHub ↗');
github.href = 'https://github.com/KirilPark99';
github.target = '_blank';
github.rel = 'noopener noreferrer';
footer.append(element('span', '© 2026 · Built for curious minds'), github);
document.body.append(header, main, footer);
function readSettings() {
    return { base: Number(baseSelect.value), length: Number(lengthSelect.value) };
}
function updateSettings() {
    const base = Number(baseSelect.value);
    for (const option of lengthSelect.options) {
        option.disabled = Number(option.value) > base;
    }
    if (Number(lengthSelect.value) > base)
        lengthSelect.value = String(base);
    const count = countPossibleSecrets(Number(lengthSelect.value), base);
    possibilities.textContent = `${count.toLocaleString('en-US')} possible codes. One is yours to find.`;
}
function renderRecords() {
    recordsList.replaceChildren();
    recordsEmpty.hidden = records.length > 0;
    for (const record of records) {
        const item = element('li');
        const result = element('div', '', 'record-result');
        result.append(element('strong', `${record.attempts} ${record.attempts === 1 ? 'guess' : 'guesses'}`));
        result.append(element('span', `${baseNames[record.base]} · ${record.length} digits`, 'muted'));
        item.append(result, element('span', formatTime(record.durationMs), 'record-time'));
        recordsList.append(item);
    }
}
function saveWin(state) {
    records = addRecord(records, {
        ...state.settings,
        attempts: state.history.length,
        durationMs: Math.max(0, (state.finishedAt ?? state.startedAt) - state.startedAt),
        finishedAt: Date.now(),
    });
    try {
        localStorage.setItem(storageKey, JSON.stringify(records));
        storageNotice.textContent = '';
    }
    catch {
        storageNotice.textContent =
            'Browser storage is unavailable. This result will not survive a reload.';
    }
    renderRecords();
}
function updateTimer() {
    if (!game)
        return;
    timeCount.textContent = formatTime((game.finishedAt ?? performance.now()) - game.startedAt);
}
settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (game)
        return;
    const settings = readSettings();
    game = createGame(settings, generateSecret(settings.length, settings.base), performance.now());
    settingsFieldset.disabled = true;
    startButton.hidden = true;
    playArea.hidden = false;
    status.textContent = 'PLAYING';
    secretSlots.replaceChildren(...Array.from({ length: settings.length }, () => element('span', '?')));
    input.inputMode = settings.base === 16 ? 'text' : 'numeric';
    input.placeholder = `${settings.length} unique digits`;
    alphabet.textContent = `Allowed: ${DIGITS.slice(0, settings.base).split('').join(' ')} · No repeated digits.`;
    timer = window.setInterval(updateTimer, 250);
    input.focus();
});
input.addEventListener('input', () => {
    if (!game)
        return;
    const { base, length } = game.settings;
    const isDigit = createDigitValidator(base);
    const cursor = input.selectionStart ?? input.value.length;
    const clean = (text) => text.toLowerCase().split('').filter(isDigit).join('').slice(0, length);
    const nextCursor = clean(input.value.slice(0, cursor)).length;
    input.value = clean(input.value);
    input.setSelectionRange(nextCursor, nextCursor);
});
guessForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!game || game.status !== 'playing')
        return;
    const guess = input.value.toLowerCase();
    if (!isValidGuess(guess, game.settings.length, game.settings.base)) {
        feedback.textContent = `Use exactly ${game.settings.length} different digits from the allowed set.`;
        input.setAttribute('aria-invalid', 'true');
        return;
    }
    const next = submitGuess(game, guess, performance.now());
    if (next === game) {
        feedback.textContent = 'You already tried that code. Try a different combination.';
        input.select();
        return;
    }
    game = next;
    input.removeAttribute('aria-invalid');
    const attempt = game.history[game.history.length - 1];
    const row = element('li');
    row.append(element('strong', attempt.guess, 'guess-code'));
    row.append(element('span', `${attempt.bulls} bulls`, 'badge bull'));
    row.append(element('span', `${attempt.cows} cows`, 'badge cow'));
    history.append(row);
    attemptsCount.textContent = String(game.history.length);
    input.value = '';
    if (game.status === 'won') {
        window.clearInterval(timer);
        updateTimer();
        status.textContent = 'SOLVED';
        status.classList.add('solved');
        feedback.textContent = `Code cracked! ${game.secret.toUpperCase()} in ${game.history.length} guesses and ${timeCount.textContent}.`;
        input.disabled = true;
        submitButton.disabled = true;
        secretSlots.replaceChildren(...game.secret
            .toUpperCase()
            .split('')
            .map((digit) => element('span', digit)));
        secretSlots.setAttribute('aria-label', `Solved code: ${game.secret}`);
        saveWin(game);
        newGameButton.focus();
    }
    else {
        feedback.textContent = `${attempt.bulls} bulls, ${attempt.cows} cows. Keep going!`;
        input.focus();
    }
});
newGameButton.addEventListener('click', () => {
    window.clearInterval(timer);
    game = null;
    settingsFieldset.disabled = false;
    startButton.hidden = false;
    playArea.hidden = true;
    input.disabled = false;
    input.value = '';
    input.removeAttribute('aria-invalid');
    submitButton.disabled = false;
    history.replaceChildren();
    attemptsCount.textContent = '0';
    timeCount.textContent = '00:00';
    feedback.textContent = 'Your first guess starts the trail.';
    status.textContent = 'READY';
    status.classList.remove('solved');
    secretSlots.setAttribute('aria-label', 'Hidden secret code');
    updateSettings();
    baseSelect.focus();
});
baseSelect.addEventListener('change', updateSettings);
lengthSelect.addEventListener('change', updateSettings);
try {
    records = parseRecords(localStorage.getItem(storageKey));
}
catch {
    storageNotice.textContent =
        'Browser storage is unavailable. Records can only be kept for this visit.';
}
updateSettings();
renderRecords();
