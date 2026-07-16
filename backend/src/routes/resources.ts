import { createCrudRouter } from "./helpers";
import {
  createBug,
  createProject,
  createTeamMember,
  createTestCase,
  getBug,
  getBugs,
  getProject,
  getProjects,
  getTeamMember,
  getTeamMembers,
  getTestCase,
  getTestCases,
  removeBug,
  removeProject,
  removeTeamMember,
  removeTestCase,
  updateBug,
  updateProject,
  updateTeamMember,
  updateTestCase,
} from "../services";
import type {
  BugInput,
  ProjectInput,
  TeamMemberInput,
  TestCaseInput,
} from "../types";

export const projectsRouter = createCrudRouter<
  Awaited<ReturnType<typeof getProject>>,
  ProjectInput,
  ProjectInput
>({
  list: getProjects,
  get: getProject,
  create: createProject,
  update: updateProject,
  remove: removeProject,
});

export const testCasesRouter = createCrudRouter<
  Awaited<ReturnType<typeof getTestCase>>,
  TestCaseInput,
  TestCaseInput
>({
  list: getTestCases,
  get: getTestCase,
  create: createTestCase,
  update: updateTestCase,
  remove: removeTestCase,
});

export const teamMembersRouter = createCrudRouter<
  Awaited<ReturnType<typeof getTeamMember>>,
  TeamMemberInput,
  TeamMemberInput
>({
  list: getTeamMembers,
  get: getTeamMember,
  create: createTeamMember,
  update: updateTeamMember,
  remove: removeTeamMember,
});

export const bugsRouter = createCrudRouter<
  Awaited<ReturnType<typeof getBug>>,
  BugInput,
  BugInput
>({
  list: getBugs,
  get: getBug,
  create: createBug,
  update: updateBug,
  remove: removeBug,
});
