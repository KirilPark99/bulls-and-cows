import { describe, expect, it } from 'vitest';
import { createDigitValidator, isValidGuess } from '../src/logic.js';

describe('createDigitValidator', () => {
  it.each([
    [2, '0', true],
    [2, '1', true],
    [2, '2', false],
    [8, '7', true],
    [8, '8', false],
    [10, '9', true],
    [10, 'a', false],
    [16, 'a', true],
    [16, 'F', true],
    [16, 'g', false],
    [16, '', false],
    [16, '12', false],
    [16, ' ', false],
    [16, '-', false],
  ])('checks base %s, digit %s', (base, digit, valid) => {
    expect(createDigitValidator(base)(digit)).toBe(valid);
  });

  it.each([0, 1, 17, 2.5, NaN])('rejects invalid base %s', (base) => {
    expect(() => createDigitValidator(base)).toThrow(RangeError);
  });
});

describe('isValidGuess', () => {
  it.each([
    ['01', 2, 2, true],
    ['10', 2, 2, true],
    ['02', 2, 2, false],
    ['0123', 4, 10, true],
    ['012', 4, 10, false],
    ['01234', 4, 10, false],
    ['0012', 4, 10, false],
    ['12a3', 4, 10, false],
    [' 123', 4, 10, false],
    ['7654', 4, 8, true],
    ['8765', 4, 8, false],
    ['AbF0', 4, 16, true],
    ['Aa01', 4, 16, false],
    ['ABG0', 4, 16, false],
    ['', 2, 10, false],
    ['012', 3, 2, false],
    ['01', 2.5, 10, false],
  ])('validates %s in base %s', (guess, length, base, valid) => {
    expect(isValidGuess(guess, length, base)).toBe(valid);
  });
});
