import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
} from "./airtable";
import {
  mapBug,
  mapProject,
  mapTeamMember,
  mapTestCase,
  toBugFields,
  toProjectFields,
  toTeamMemberFields,
  toTestCaseFields,
} from "./mappers";
import {
  TABLES,
  type BugInput,
  type ProjectInput,
  type TeamMemberInput,
  type TestCaseInput,
} from "./types";

function byNewest<T extends { createdTime?: string }>(items: T[]) {
  return [...items].sort((a, b) =>
    (b.createdTime || "").localeCompare(a.createdTime || ""),
  );
}

export async function getProjects() {
  const records = await listRecords(TABLES.projects);
  return byNewest(records.map(mapProject).filter((p) => p.name));
}

export async function getProject(id: string) {
  return mapProject(await getRecord(TABLES.projects, id));
}

export async function createProject(input: ProjectInput) {
  if (!input.name?.trim()) throw new Error("Project name is required");
  const [record] = await createRecord(
    TABLES.projects,
    toProjectFields({ ...input, name: input.name.trim() }),
  );
  return mapProject(record);
}

export async function updateProject(id: string, input: ProjectInput) {
  if (!input.name?.trim()) throw new Error("Project name is required");
  const [record] = await updateRecord(
    TABLES.projects,
    id,
    toProjectFields({ ...input, name: input.name.trim() }),
  );
  return mapProject(record);
}

export async function removeProject(id: string) {
  await deleteRecord(TABLES.projects, id);
  return { id };
}

export async function getTestCases() {
  const records = await listRecords(TABLES.testCases);
  return byNewest(records.map(mapTestCase).filter((t) => t.title));
}

export async function getTestCase(id: string) {
  return mapTestCase(await getRecord(TABLES.testCases, id));
}

export async function createTestCase(input: TestCaseInput) {
  if (!input.title?.trim()) throw new Error("Test case title is required");
  const [record] = await createRecord(
    TABLES.testCases,
    toTestCaseFields({ ...input, title: input.title.trim() }),
  );
  return mapTestCase(record);
}

export async function updateTestCase(id: string, input: TestCaseInput) {
  if (!input.title?.trim()) throw new Error("Test case title is required");
  const [record] = await updateRecord(
    TABLES.testCases,
    id,
    toTestCaseFields({ ...input, title: input.title.trim() }),
  );
  return mapTestCase(record);
}

export async function removeTestCase(id: string) {
  await deleteRecord(TABLES.testCases, id);
  return { id };
}

export async function getTeamMembers() {
  const records = await listRecords(TABLES.teamMembers);
  return byNewest(
    records
      .map(mapTeamMember)
      .filter((m) => m.name && !m.deleted),
  );
}

export async function getTeamMember(id: string) {
  return mapTeamMember(await getRecord(TABLES.teamMembers, id));
}

export async function createTeamMember(input: TeamMemberInput) {
  if (!input.name?.trim()) throw new Error("Name is required");
  const email = (input.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("A valid email is required to invite a member");
  }

  const existing = await getTeamMembers();
  if (existing.some((m) => m.email === email)) {
    throw Object.assign(new Error("This email is already on the team"), {
      statusCode: 409,
    });
  }

  const [record] = await createRecord(
    TABLES.teamMembers,
    toTeamMemberFields({
      ...input,
      name: input.name.trim(),
      email,
    }),
  );
  return mapTeamMember(record);
}

export async function updateTeamMember(id: string, input: TeamMemberInput) {
  if (!input.name?.trim()) throw new Error("Name is required");
  const [record] = await updateRecord(
    TABLES.teamMembers,
    id,
    toTeamMemberFields({ ...input, name: input.name.trim() }),
  );
  return mapTeamMember(record);
}

export async function removeTeamMember(id: string) {
  try {
    const [record] = await updateRecord(TABLES.teamMembers, id, {
      Deleted: true,
    });
    return mapTeamMember(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/UNKNOWN_FIELD_NAME|Unknown field|Deleted/i.test(message)) {
      throw new Error(
        'Soft delete needs a Checkbox field named "Deleted" on the Team members table in Airtable. Add it, then try again.',
      );
    }
    throw error;
  }
}

export async function getBugs() {
  const records = await listRecords(TABLES.bugs);
  return byNewest(records.map(mapBug).filter((b) => b.title));
}

export async function getBug(id: string) {
  return mapBug(await getRecord(TABLES.bugs, id));
}

export async function createBug(input: BugInput) {
  if (!input.title?.trim()) throw new Error("Bug title is required");
  const [record] = await createRecord(
    TABLES.bugs,
    toBugFields({
      ...input,
      title: input.title.trim(),
      status: input.status || "Open",
    }),
  );
  return mapBug(record);
}

export async function updateBug(id: string, input: BugInput) {
  if (!input.title?.trim()) throw new Error("Bug title is required");
  const [record] = await updateRecord(
    TABLES.bugs,
    id,
    toBugFields({ ...input, title: input.title.trim() }),
  );
  return mapBug(record);
}

export async function removeBug(id: string) {
  await deleteRecord(TABLES.bugs, id);
  return { id };
}
