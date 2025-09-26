import { describe, it, expect } from 'vitest';

// Performance-Test für Array-Operationen
function generateLargeArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

function sumArray(arr: number[]): number {
  return arr.reduce((sum, num) => sum + num, 0);
}

describe('Performance Tests', () => {
  it('should handle large arrays efficiently', () => {
    const largeArray = generateLargeArray(10000);
    const start = performance.now();
    const result = sumArray(largeArray);
    const end = performance.now();
    
    expect(result).toBe(49995000); // Sum of 0 to 9999
    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should handle empty arrays', () => {
    expect(sumArray([])).toBe(0);
  });

  it('should handle single element arrays', () => {
    expect(sumArray([42])).toBe(42);
  });
});
