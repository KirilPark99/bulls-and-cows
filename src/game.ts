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

export function createGame(_settings: Settings, _secret: string, _now: number): GameState {
  throw new Error('Not implemented');
}

export function submitGuess(_state: GameState, _guess: string, _now: number): GameState {
  throw new Error('Not implemented');
}

export function addRecord(_records: readonly GameRecord[], _record: GameRecord): GameRecord[] {
  throw new Error('Not implemented');
}

export function parseRecords(_text: string | null): GameRecord[] {
  throw new Error('Not implemented');
}
