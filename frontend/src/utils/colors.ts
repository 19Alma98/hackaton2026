/**
 * Genera un linear-gradient deterministico da un indirizzo Ethereum.
 * Stesso indirizzo → stesso gradient (utile per avatar).
 */
export function addressToGradient(address: string): string {
  const h1 = parseInt(address.slice(2, 6) || '0000', 16) % 360
  const h2 = (h1 + 60) % 360
  return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 70%, 50%))`
}
