import { describe, expect, it } from 'vitest';
import { createGame, submitGuess, addRecord, parseRecords } from '../src/game.js';
import type { GameRecord } from '../src/game.js';

describe('immutable game state', () => {
  it('copies settings and leaves the previous state and history unchanged', () => {
    const settings = Object.freeze({ length: 4, base: 10 });
    const game = createGame(settings, '0123', 1000);
    Object.freeze(game.history);
    Object.freeze(game);
    const next = submitGuess(game, '0132', 2000);
    expect(game.history).toEqual([]);
    expect(next).not.toBe(game);
    expect(next.settings).not.toBe(settings);
    expect(next.history).toEqual([{ guess: '0132', bulls: 2, cows: 2 }]);
    const lastEntry = Object.freeze(next.history[0]);
    const won = submitGuess(next, '0123', 4000);
    expect(won.status).toBe('won');
    expect(won.finishedAt).toBe(4000);
    expect(won.history).toHaveLength(2);
    expect(won.history[0]).toBe(lastEntry);
    expect(next.status).toBe('playing');
    expect(next.finishedAt).toBeNull();
    expect(submitGuess(won, '4567', 5000)).toBe(won);
  });

  it('normalizes hex input and rejects duplicate or invalid attempts', () => {
    const game = createGame({ length: 4, base: 16 }, 'a0bf', 0);
    expect(submitGuess(game, 'AAAA', 10)).toBe(game);
    expect(submitGuess(game, 'g012', 10)).toBe(game);
    const next = submitGuess(game, 'AB01', 20);
    expect(next.history[0].guess).toBe('ab01');
    expect(submitGuess(next, 'ab01', 30)).toBe(next);
    expect(submitGuess(next, 'A0BF', 40).status).toBe('won');
  });

  it.each([
    { length: 3, base: 2 },
    { length: 7, base: 10 },
    { length: 2, base: 3 },
  ])('rejects unsupported game settings', (settings) => {
    expect(() => createGame(settings, '01', 0)).toThrow(RangeError);
  });
});

describe('records', () => {
  const record: GameRecord = {
    length: 4,
    base: 10,
    attempts: 3,
    durationMs: 5000,
    finishedAt: 10000,
  };

  it('sorts by attempts, then time, without mutating records', () => {
    const slow = Object.freeze({ ...record, durationMs: 9000 });
    const previous = Object.freeze([slow, record]);
    const next = addRecord(previous, { ...record, attempts: 2, durationMs: 20000 });
    expect(next.map((item) => item.attempts)).toEqual([2, 3, 3]);
    expect(next[1]).toBe(record);
    expect(previous).toEqual([slow, record]);
  });

  it('keeps only ten results with their length and base', () => {
    const previous = Array.from({ length: 10 }, (_, i) => ({ ...record, attempts: i + 2 }));
    const next = addRecord(previous, { ...record, attempts: 1, length: 2, base: 2 });
    expect(next).toHaveLength(10);
    expect(next[0]).toMatchObject({ attempts: 1, length: 2, base: 2 });
  });

  it('reads saved results and tolerates absent, invalid or unrelated data', () => {
    expect(parseRecords(JSON.stringify([record]))).toEqual([record]);
    for (const text of [null, '{', '{}', 'null', '[1, null, {}]']) {
      expect(parseRecords(text)).toEqual([]);
    }
    expect(
      parseRecords(
        JSON.stringify([
          record,
          { ...record, attempts: -1 },
          { ...record, base: 2 },
          { ...record, durationMs: '5' },
        ]),
      ),
    ).toEqual([record]);
  });
});
