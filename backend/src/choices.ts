/**
 * Map free-typed select values to Airtable's exact option names (case-insensitive).
 * Returns undefined when empty or when no option matches, so we can omit the field
 * instead of triggering INVALID_MULTIPLE_CHOICE_OPTIONS.
 */
export function canonicalizeChoice(
  value: string | undefined | null,
  options: readonly string[],
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const exact = options.find((opt) => opt === trimmed);
  if (exact) return exact;

  const lowered = trimmed.toLowerCase();
  const ci = options.find((opt) => opt.toLowerCase() === lowered);
  if (ci) return ci;

  // Allow compact forms like "inprogress" -> "In Progress"
  const compact = lowered.replace(/[\s_-]+/g, "");
  const compactMatch = options.find(
    (opt) => opt.toLowerCase().replace(/[\s_-]+/g, "") === compact,
  );
  return compactMatch;
}

export function setChoiceField(
  fields: Record<string, unknown>,
  key: string,
  value: string | undefined | null,
  options: readonly string[],
) {
  const matched = canonicalizeChoice(value, options);
  if (matched) fields[key] = matched;
}
