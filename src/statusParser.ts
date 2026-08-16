export type DependencyStatus = "found" | "fallback" | "failed" | "unknown";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function parseCMakeOutputForStatus(output: string): Record<string, DependencyStatus> {
  const status: Record<string, DependencyStatus> = {};

  const fallbackRegex = /([A-Za-z0-9_.+-]+)\s+not found; using FetchContent fallback/gi;
  const foundRegex = /(?:--\s*)?Found\s+([A-Za-z0-9_.+-]+)/gi;
  const failedRegex = /Could NOT find\s+([A-Za-z0-9_.+-]+)/gi;

  let match;
  while ((match = fallbackRegex.exec(output))) {
    status[normalizeName(match[1])] = "fallback";
  }
  while ((match = foundRegex.exec(output))) {
    const name = normalizeName(match[1]);
    if (!status[name] || status[name] === "failed") {
      status[name] = "found";
    }
  }
  while ((match = failedRegex.exec(output))) {
    const name = normalizeName(match[1]);
    if (!status[name]) {
      status[name] = "failed";
    }
  }

  return status;
}
