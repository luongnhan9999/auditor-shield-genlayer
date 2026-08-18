/**
 * Safely converts string / bigint wei values into formatted GEN amount
 * Prevents BigInt SyntaxErrors from crashing React rendering
 */
export function safeFormatGen(rewardAmount: string | number | undefined): string {
  if (!rewardAmount) return '0';

  try {
    const cleanStr = String(rewardAmount).split('.')[0].trim();
    if (!cleanStr || cleanStr === '0') return '0';

    // If it's pure digits, parse BigInt
    if (/^\d+$/.test(cleanStr)) {
      const bn = BigInt(cleanStr);
      // If it's in Wei (>= 1e14), divide by 10^18
      if (bn >= BigInt(10 ** 14)) {
        return (bn / BigInt(10 ** 18)).toLocaleString();
      }
      return bn.toLocaleString();
    }

    return cleanStr;
  } catch (e) {
    return '0';
  }
}
