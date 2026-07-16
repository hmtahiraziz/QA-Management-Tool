export function buildLookup(items: { id: string; label: string }[]) {
  const map = new Map<string, string>();
  for (const item of items) map.set(item.id, item.label);
  return map;
}

export function resolveIds(ids: string[] | null | undefined, map: Map<string, string>) {
  return (ids || []).map((id) => map.get(id) || id.slice(0, 10));
}

export function matchesQuery(query: string, values: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => (value || "").toLowerCase().includes(q));
}

export function shortId(id: string) {
  return id.slice(0, 10);
}

/** Newest Airtable records first (by createdTime). */
export function sortByNewest<T extends { createdTime?: string }>(items: T[]) {
  return [...items].sort((a, b) =>
    (b.createdTime || "").localeCompare(a.createdTime || ""),
  );
}

/** Display label for a test case: Test ID first when present. */
export function testCaseLabel(item: { testId?: string; title?: string }) {
  const testId = (item.testId || "").trim();
  const title = (item.title || "").trim() || "Untitled";
  return testId ? `${testId} · ${title}` : title;
}
