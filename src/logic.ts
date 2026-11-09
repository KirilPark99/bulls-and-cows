export const DIGITS = '0123456789abcdef';

export function createDigitValidator(base: number): (char: string) => boolean {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError('Base must be an integer from 2 to 16');
  }

  const allowedDigits = DIGITS.slice(0, base);
  return (char) => char.length === 1 && allowedDigits.includes(char.toLowerCase());
}

export function isValidGuess(_guess: string, _length: number, _base: number): boolean {
  throw new Error('Not implemented');
}
