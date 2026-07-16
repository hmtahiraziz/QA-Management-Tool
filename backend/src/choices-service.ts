import { getTable } from "./airtable";
import { withNetworkRetry } from "./dns-fix";
import {
  BUG_PRIORITIES,
  BUG_SEVERITIES,
  BUG_STATUSES,
  MEMBER_ROLES,
  TABLES,
  TEST_CATEGORIES,
  TEST_PRIORITIES,
  TEST_TYPES,
} from "./types";

export type AppChoices = {
  testCaseTypes: string[];
  testCasePriorities: string[];
  testCaseCategories: string[];
  bugStatuses: string[];
  bugPriorities: string[];
  bugSeverities: string[];
  memberRoles: string[];
  refreshedAt: string;
};

function uniqueSorted(values: Iterable<string>) {
  return [...new Set([...values].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function collectFieldValues(
  records: { fields: Record<string, unknown> }[],
  fieldName: string,
) {
  const values: string[] = [];
  for (const record of records) {
    const value = record.fields[fieldName];
    if (typeof value === "string" && value.trim()) values.push(value.trim());
  }
  return values;
}

function mergeChoices(seed: readonly string[], discovered: string[]) {
  return uniqueSorted([...seed, ...discovered]);
}

function seededChoices(): AppChoices {
  return {
    testCaseTypes: [...TEST_TYPES],
    testCasePriorities: [...TEST_PRIORITIES],
    testCaseCategories: [...TEST_CATEGORIES],
    bugStatuses: [...BUG_STATUSES],
    bugPriorities: [...BUG_PRIORITIES],
    bugSeverities: [...BUG_SEVERITIES],
    memberRoles: [...MEMBER_ROLES],
    refreshedAt: new Date().toISOString(),
  };
}

async function listFieldPage(
  tableName: (typeof TABLES)[keyof typeof TABLES],
  fields: string[],
) {
  return withNetworkRetry(() => getTable(tableName).select({ fields }).all());
}

async function loadFromAirtable(): Promise<AppChoices> {
  const [testCases, bugs, members] = await Promise.all([
    listFieldPage(TABLES.testCases, ["Type", "Priority", "Category"]),
    listFieldPage(TABLES.bugs, ["Status", "Priority", "Severity"]),
    listFieldPage(TABLES.teamMembers, ["Role"]),
  ]);

  return {
    testCaseTypes: mergeChoices(
      TEST_TYPES,
      collectFieldValues(testCases, "Type"),
    ),
    testCasePriorities: mergeChoices(
      TEST_PRIORITIES,
      collectFieldValues(testCases, "Priority"),
    ),
    testCaseCategories: mergeChoices(
      TEST_CATEGORIES,
      collectFieldValues(testCases, "Category"),
    ),
    bugStatuses: mergeChoices(BUG_STATUSES, collectFieldValues(bugs, "Status")),
    bugPriorities: mergeChoices(
      BUG_PRIORITIES,
      collectFieldValues(bugs, "Priority"),
    ),
    bugSeverities: mergeChoices(
      BUG_SEVERITIES,
      collectFieldValues(bugs, "Severity"),
    ),
    memberRoles: mergeChoices(MEMBER_ROLES, collectFieldValues(members, "Role")),
    refreshedAt: new Date().toISOString(),
  };
}

let cache: { expiresAt: number; data: AppChoices } | null = null;
const CACHE_MS = 60_000;
const LOAD_TIMEOUT_MS = 20_000;

export async function getAppChoices(force = false): Promise<AppChoices> {
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  try {
    const data = await Promise.race([
      loadFromAirtable(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Timed out loading select options from Airtable")),
          LOAD_TIMEOUT_MS,
        );
      }),
    ]);
    cache = { data, expiresAt: Date.now() + CACHE_MS };
    return data;
  } catch (error) {
    console.warn("Falling back to seeded choice options:", error);
    const data = seededChoices();
    // Short cache so a later request can retry Airtable soon.
    cache = { data, expiresAt: Date.now() + 15_000 };
    return data;
  }
}

export function invalidateChoicesCache() {
  cache = null;
}
