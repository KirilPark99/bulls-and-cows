import { evaluateGuess, isValidGuess } from './logic.js';
import type { GuessResult } from './logic.js';

export interface Settings {
  readonly length: number;
  readonly base: number;
}

export interface Attempt extends GuessResult {
  readonly guess: string;
}

export interface GameState {
  readonly settings: Settings;
  readonly secret: string;
  readonly history: readonly Attempt[];
  readonly status: 'playing' | 'won';
  readonly startedAt: number;
  readonly finishedAt: number | null;
}

export interface GameRecord extends Settings {
  readonly attempts: number;
  readonly durationMs: number;
  readonly finishedAt: number;
}

export function createGame(settings: Settings, secret: string, now: number): GameState {
  if (
    ![2, 8, 10, 16].includes(settings.base) ||
    settings.length < 2 ||
    settings.length > 6 ||
    !isValidGuess(secret, settings.length, settings.base)
  ) {
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

export function submitGuess(state: GameState, guess: string, now: number): GameState {
  const normalized = guess.toLowerCase();
  if (
    state.status !== 'playing' ||
    !isValidGuess(normalized, state.settings.length, state.settings.base) ||
    state.history.some((attempt) => attempt.guess === normalized)
  ) {
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

export function addRecord(records: readonly GameRecord[], record: GameRecord): GameRecord[] {
  return [...records, record]
    .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
    .slice(0, 10);
}

function isRecord(value: unknown): value is GameRecord {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'base' in value &&
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
    value.finishedAt >= 0
  );
}

export function parseRecords(text: string | null): GameRecord[] {
  try {
    const value: unknown = JSON.parse(text ?? '[]');
    return Array.isArray(value)
      ? value
          .filter(isRecord)
          .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
          .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
