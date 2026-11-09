export const DIGITS = '0123456789abcdef';

export function generateSecret(
  _length: number,
  _base: number,
  _random: () => number = Math.random,
): string {
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
