import { describe, expect, it } from 'vitest';
import { createDigitValidator } from '../src/logic.js';

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
