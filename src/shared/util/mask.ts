export function mask(str: string, lastNDigits: number = 4): string {
  return `***...${str.slice(-1 * lastNDigits)}`;
}
