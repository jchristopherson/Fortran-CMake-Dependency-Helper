export type DependencyStatus = "found" | "fallback" | "failed" | "unknown";

export function parseCMakeOutputForStatus(output: string): Record<string, DependencyStatus> {
  const status: Record<string, DependencyStatus> = {};

  const fallbackRegex = /(\w+)\s+not found; using FetchContent fallback/gi;
  const foundRegex = /Found\s+(\w+)/gi;

  let match;
  while ((match = fallbackRegex.exec(output))) {
    status[match[1]] = "fallback";
  }
  while ((match = foundRegex.exec(output))) {
    const name = match[1];
    if (!status[name]) {
      status[name] = "found";
    }
  }

  return status;
}
