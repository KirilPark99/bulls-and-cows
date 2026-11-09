export const DIGITS = '0123456789abcdef';

export function generateSecret(
  length: number,
  base: number,
  random: () => number = Math.random,
): string {
  createDigitValidator(base);
  if (!Number.isInteger(length) || length < 1 || length > base) {
    throw new RangeError('Length must be between 1 and the base');
  }

  let available = DIGITS.slice(0, base).split('');
  return Array.from({ length }, () => {
    const value = random();
    if (!(value >= 0 && value < 1)) {
      throw new RangeError('Random must return a number from 0 up to but not including 1');
    }
    const index = Math.floor(value * available.length);
    const digit = available[index];
    available = available.filter((_, digitIndex) => digitIndex !== index);
    return digit;
  }).join('');
}

export interface GuessResult {
  readonly bulls: number;
  readonly cows: number;
}

export function evaluateGuess(_secret: string, _guess: string): GuessResult {
  throw new Error('Not implemented');
}

export function createDigitValidator(base: number): (char: string) => boolean {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError('Base must be an integer from 2 to 16');
  }

  const allowedDigits = DIGITS.slice(0, base);
  return (char) => char.length === 1 && allowedDigits.includes(char.toLowerCase());
}

export function isValidGuess(guess: string, length: number, base: number): boolean {
  const isDigit = createDigitValidator(base);
  const digits = guess.toLowerCase().split('');

  return (
    Number.isInteger(length) &&
    length >= 1 &&
    length <= base &&
    digits.length === length &&
    digits.every(isDigit) &&
    new Set(digits).size === length
  );
}
