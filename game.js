import { evaluateGuess, isValidGuess } from './logic.js';
export function createGame(settings, secret, now) {
    if (![2, 8, 10, 16].includes(settings.base) ||
        settings.length < 2 ||
        settings.length > 6 ||
        !isValidGuess(secret, settings.length, settings.base)) {
        throw new RangeError('Invalid settings or secret');
    }
    return {
        settings: { ...settings },
        secret: secret.toLowerCase(),
        history: [],
        status: 'playing',
        startedAt: now,
        finishedAt: null,
    };
}
export function submitGuess(state, guess, now) {
    const normalized = guess.toLowerCase();
    if (state.status !== 'playing' ||
        !isValidGuess(normalized, state.settings.length, state.settings.base) ||
        state.history.some((attempt) => attempt.guess === normalized)) {
        return state;
    }
    const result = evaluateGuess(state.secret, normalized);
    const won = result.bulls === state.settings.length;
    return {
        ...state,
        history: [...state.history, { guess: normalized, ...result }],
        status: won ? 'won' : 'playing',
        finishedAt: won ? now : null,
    };
}
export function addRecord(records, record) {
    return [...records, record]
        .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
        .slice(0, 10);
}
function isRecord(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    return ('base' in value &&
        typeof value.base === 'number' &&
        [2, 8, 10, 16].includes(value.base) &&
        'length' in value &&
        typeof value.length === 'number' &&
        Number.isInteger(value.length) &&
        value.length >= 2 &&
        value.length <= 6 &&
        value.length <= value.base &&
        'attempts' in value &&
        typeof value.attempts === 'number' &&
        Number.isInteger(value.attempts) &&
        value.attempts >= 1 &&
        'durationMs' in value &&
        typeof value.durationMs === 'number' &&
        Number.isFinite(value.durationMs) &&
        value.durationMs >= 0 &&
        'finishedAt' in value &&
        typeof value.finishedAt === 'number' &&
        Number.isFinite(value.finishedAt) &&
        value.finishedAt >= 0);
}
export function parseRecords(text) {
    try {
        const value = JSON.parse(text ?? '[]');
        return Array.isArray(value)
            ? value
                .filter(isRecord)
                .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
                .slice(0, 10)
            : [];
    }
    catch {
        return [];
    }
}
