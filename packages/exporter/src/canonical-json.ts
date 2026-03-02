function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortRecursively(entry));
  }

  if (isPlainObject(value)) {
    const next: Record<string, unknown> = {};
    const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));

    for (const key of keys) {
      next[key] = sortRecursively(value[key]);
    }

    return next;
  }

  return value;
}

export function canonicalJSONStringify(value: unknown, indent = 2): string {
  return `${JSON.stringify(sortRecursively(value), null, indent)}\n`;
}
