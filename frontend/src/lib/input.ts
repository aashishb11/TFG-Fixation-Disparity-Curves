type ParseYValuesResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string };

export function parseYValues(yValues: string[]): ParseYValuesResult {
  const parsed = yValues.map((value) => Number(value));

  if (parsed.some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    return {
      ok: false,
      error: "Please ensure all inputs contain valid numbers.",
    };
  }

  return { ok: true, values: parsed };
}
