export interface DuplicateResult {
  value: string;
  count: number;
  indices: number[];
}

export function findDuplicates(values: string[]): DuplicateResult[] {
  const map = new Map<string, number[]>();

  values.forEach((val, idx) => {
    const normalized = val.toString().trim();
    if (!map.has(normalized)) {
      map.set(normalized, []);
    }
    map.get(normalized)!.push(idx);
  });

  const results: DuplicateResult[] = [];
  map.forEach((indices, value) => {
    if (indices.length > 1) {
      results.push({ value, count: indices.length, indices });
    }
  });

  return results.sort((a, b) => b.count - a.count);
}
