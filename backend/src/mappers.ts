import type { FieldSet, Record as AirtableRecord } from "airtable";
import { setChoiceField } from "./choices";
import type { Bug, Project, TeamMember, TestCase, AuthUserRecord } from "./types";
import {
  BUG_PRIORITIES,
  BUG_SEVERITIES,
  BUG_STATUSES,
  MEMBER_ROLES,
  TEST_CATEGORIES,
  TEST_PRIORITIES,
  TEST_TYPES,
} from "./types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return value.slice(0, 10);
}

function asIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asCollaborator(
  value: unknown,
): { id: string; email: string; name: string } | null {
  if (!value || typeof value !== "object") return null;
  const c = value as { id?: string; email?: string; name?: string };
  if (!c.id) return null;
  return {
    id: c.id,
    email: c.email ?? "",
    name: c.name ?? "",
  };
}

export function mapProject(record: AirtableRecord<FieldSet>): Project {
  const f = record.fields;
  return {
    id: record.id,
    name: asString(f["Project Name"]),
    client: asString(f.Client),
    startDate: asStringOrNull(f["Start Date"]),
    endDate: asStringOrNull(f["End Date"]),
    linkedTestCaseIds: asIds(f.Status),
    createdTime: record._rawJson?.createdTime,
  };
}

export function toProjectFields(input: {
  name: string;
  client?: string;
  startDate?: string | null;
  endDate?: string | null;
  linkedTestCaseIds?: string[];
}): FieldSet {
  const fields: FieldSet = {
    "Project Name": input.name,
  };
  if (input.client?.trim()) fields.Client = input.client.trim();
  if (input.startDate) fields["Start Date"] = input.startDate;
  if (input.endDate) fields["End Date"] = input.endDate;
  if (input.linkedTestCaseIds !== undefined) {
    fields.Status = input.linkedTestCaseIds;
  }
  return fields;
}

export function mapTestCase(record: AirtableRecord<FieldSet>): TestCase {
  const f = record.fields;
  return {
    id: record.id,
    testId: asString(f["Test ID"]),
    title: asString(f.Title),
    description: asString(f.Description),
    steps: asString(f.Steps),
    expectedResults: asString(f["Expected Results"]),
    category: asString(f.Category),
    priority: asString(f.Priority) || "Medium",
    type: asString(f.Type) || "Functional",
    testRuns: asString(f["Test Runs"]),
    projectIds: asIds(f.Project),
    bugIds: asIds(f.Bugs),
    createdTime: record._rawJson?.createdTime,
  };
}

export function toTestCaseFields(input: {
  title: string;
  testId?: string;
  description?: string;
  steps?: string;
  expectedResults?: string;
  category?: string;
  priority?: string;
  type?: string;
  testRuns?: string;
  projectIds?: string[];
  bugIds?: string[];
}): FieldSet {
  const fields: FieldSet = { Title: input.title };

  if (input.testId?.trim()) fields["Test ID"] = input.testId.trim();
  if (input.description?.trim()) fields.Description = input.description.trim();
  if (input.steps?.trim()) fields.Steps = input.steps.trim();
  if (input.expectedResults?.trim()) {
    fields["Expected Results"] = input.expectedResults.trim();
  }
  if (input.testRuns?.trim()) fields["Test Runs"] = input.testRuns.trim();

  // Select fields: match Airtable options case-insensitively; omit if unknown.
  setChoiceField(fields, "Category", input.category, TEST_CATEGORIES);
  setChoiceField(fields, "Priority", input.priority, TEST_PRIORITIES);
  setChoiceField(fields, "Type", input.type, TEST_TYPES);

  if (input.projectIds !== undefined) fields.Project = input.projectIds;
  if (input.bugIds !== undefined) fields.Bugs = input.bugIds;
  return fields;
}

export function mapAuthUser(record: AirtableRecord<FieldSet>): AuthUserRecord {
  const f = record.fields;
  return {
    id: record.id,
    email: asString(f.Email).trim().toLowerCase(),
    name: asString(f.Name),
    passwordHash: asString(f["Password Hash"]),
    createdTime: record._rawJson?.createdTime,
  };
}

export function toAuthUserFields(input: {
  email: string;
  name: string;
  passwordHash: string;
}): FieldSet {
  return {
    Email: input.email,
    Name: input.name,
    "Password Hash": input.passwordHash,
  };
}

export function mapTeamMember(record: AirtableRecord<FieldSet>): TeamMember {
  const f = record.fields;
  return {
    id: record.id,
    name: asString(f.Name),
    email: asString(f.Email).trim().toLowerCase(),
    role: asString(f.Role) || "Other",
    testRuns: asString(f["Test Runs"]),
    bugIds: asIds(f.Bugs),
    deleted: Boolean(f.Deleted),
    createdTime: record._rawJson?.createdTime,
  };
}

export function toTeamMemberFields(input: {
  name: string;
  email?: string;
  role?: string;
  testRuns?: string;
  deleted?: boolean;
}): FieldSet {
  const fields: FieldSet = { Name: input.name };
  if (input.email?.trim()) fields.Email = input.email.trim();
  if (input.testRuns?.trim()) fields["Test Runs"] = input.testRuns.trim();
  if (input.deleted !== undefined) fields.Deleted = input.deleted;
  setChoiceField(fields, "Role", input.role, MEMBER_ROLES);
  return fields;
}

export function mapBug(record: AirtableRecord<FieldSet>): Bug {
  const f = record.fields;
  return {
    id: record.id,
    title: asString(f.Title),
    description: asString(f.Description),
    status: asString(f.Status) || "Open",
    priority: asString(f.Priority) || "Medium",
    severity: asString(f.Severity) || "Medium",
    testCaseIds: asIds(f["Test Case(s)"]),
    assigneeIds: asIds(f["Assigned To"]),
    createdBy: asCollaborator(f["Created By"]),
    createdTime: record._rawJson?.createdTime,
  };
}

export function toBugFields(input: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  severity?: string;
  testCaseIds?: string[];
  assigneeIds?: string[];
}): FieldSet {
  const fields: FieldSet = { Title: input.title };
  if (input.description?.trim()) fields.Description = input.description.trim();
  setChoiceField(fields, "Status", input.status, BUG_STATUSES);
  setChoiceField(fields, "Priority", input.priority, BUG_PRIORITIES);
  setChoiceField(fields, "Severity", input.severity, BUG_SEVERITIES);
  if (input.testCaseIds !== undefined) fields["Test Case(s)"] = input.testCaseIds;
  if (input.assigneeIds !== undefined) fields["Assigned To"] = input.assigneeIds;
  return fields;
}
