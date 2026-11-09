import { describe, expect, it } from 'vitest';
import { createDigitValidator, isValidGuess, generateSecret } from '../src/logic.js';

describe('generateSecret', () => {
  it('keeps leading zeroes and removes selected digits from the pool', () => {
    expect(generateSecret(4, 10, () => 0)).toBe('0123');
    expect(generateSecret(4, 16, () => 0.999)).toBe('fedc');
    expect(generateSecret(2, 2, () => 0)).toBe('01');
  });

  it.each([2, 8, 10, 16])('generates unique valid digits for base %s', (base) => {
    const length = Math.min(6, base);
    const secret = generateSecret(length, base, () => 0.5);
    expect(isValidGuess(secret, length, base)).toBe(true);
    expect(generateSecret(length, base, () => 0.5)).toBe(secret);
  });

  it.each([
    [3, 2],
    [0, 10],
    [-1, 10],
    [2.5, 10],
    [2, 17],
  ])('rejects impossible settings %s / %s', (length, base) => {
    expect(() => generateSecret(length, base, () => 0)).toThrow(RangeError);
  });

  it.each([-0.1, 1, NaN])('rejects random value %s', (value) => {
    expect(() => generateSecret(2, 10, () => value)).toThrow(RangeError);
  });
});

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
