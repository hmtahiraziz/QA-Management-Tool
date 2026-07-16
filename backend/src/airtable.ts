import Airtable, { type FieldSet, type Records } from "airtable";
import { withNetworkRetry } from "./dns-fix";
import { requireEnv } from "./env";
import { TABLES } from "./types";

function getConfig() {
  const apiKey = requireEnv("AIRTABLE_PAT");
  const baseId =
    process.env.AIRTABLE_BASE_ID?.trim() || process.env.BASE_ID?.trim();

  if (!baseId) {
    throw new Error("Missing AIRTABLE_BASE_ID environment variable");
  }

  return { apiKey, baseId };
}

export function getAirtableBase() {
  const { apiKey, baseId } = getConfig();
  return new Airtable({ apiKey }).base(baseId);
}

export function getTable(name: (typeof TABLES)[keyof typeof TABLES]) {
  return getAirtableBase()(name);
}

export async function listRecords(tableName: (typeof TABLES)[keyof typeof TABLES]) {
  return withNetworkRetry(async () => {
    const table = getTable(tableName);
    const records: Records<FieldSet> = await table.select().all();
    return records;
  });
}

export async function getRecord(
  tableName: (typeof TABLES)[keyof typeof TABLES],
  id: string,
) {
  return withNetworkRetry(() => getTable(tableName).find(id));
}

export async function createRecord(
  tableName: (typeof TABLES)[keyof typeof TABLES],
  fields: FieldSet,
) {
  return withNetworkRetry(() => getTable(tableName).create([{ fields }]));
}

export async function updateRecord(
  tableName: (typeof TABLES)[keyof typeof TABLES],
  id: string,
  fields: FieldSet,
) {
  return withNetworkRetry(() => getTable(tableName).update([{ id, fields }]));
}

export async function deleteRecord(
  tableName: (typeof TABLES)[keyof typeof TABLES],
  id: string,
) {
  return withNetworkRetry(() => getTable(tableName).destroy([id]));
}

export async function testAirtableConnection() {
  const { apiKey, baseId } = getConfig();
  const results: {
    table: string;
    ok: boolean;
    count?: number;
    error?: string;
  }[] = [];

  for (const table of Object.values(TABLES)) {
    try {
      await withNetworkRetry(async () => {
        await getTable(table).select({ maxRecords: 1 }).firstPage();
        return getTable(table).select({ fields: [] }).all();
      });
      const countPage = await withNetworkRetry(() =>
        getTable(table).select({ fields: [] }).all(),
      );
      results.push({ table, ok: true, count: countPage.length });
    } catch (error) {
      results.push({
        table,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    connected: results.every((r) => r.ok),
    baseId,
    tokenPresent: Boolean(apiKey),
    tables: results,
    checkedAt: new Date().toISOString(),
  };
}
