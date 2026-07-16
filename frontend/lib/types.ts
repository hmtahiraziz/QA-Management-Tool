export type BugStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type BugPriority = "Critical" | "High" | "Medium" | "Low";
export type BugSeverity = "Critical" | "High" | "Medium" | "Low";
export type TestPriority = "High" | "Medium" | "Low";
export type TestType =
  | "Manual"
  | "Automated"
  | "Functional"
  | "Negative"
  | "Security"
  | "Usability"
  | "Smoke"
  | "Performance";
export type MemberRole =
  | "QA Engineer"
  | "Developer"
  | "Project Manager"
  | "Product Owner"
  | "Designer"
  | "Other";

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: string | null;
  endDate: string | null;
  /** Airtable field "Status" — linked Test case record IDs */
  linkedTestCaseIds: string[];
  createdTime?: string;
}

export interface TestCase {
  id: string;
  testId: string;
  title: string;
  description: string;
  steps: string;
  expectedResults: string;
  category: string;
  priority: TestPriority | string;
  type: TestType | string;
  testRuns: string;
  projectIds: string[];
  bugIds: string[];
  createdTime?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole | string;
  testRuns: string;
  bugIds: string[];
  deleted: boolean;
  createdTime?: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: BugStatus | string;
  priority: BugPriority | string;
  severity: BugSeverity | string;
  testCaseIds: string[];
  assigneeIds: string[];
  createdBy: { id: string; email: string; name: string } | null;
  createdTime?: string;
}

export interface ProjectInput {
  name: string;
  client?: string;
  startDate?: string | null;
  endDate?: string | null;
  linkedTestCaseIds?: string[];
}

export interface TestCaseInput {
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
}

export interface TeamMemberInput {
  name: string;
  email?: string;
  role?: string;
  testRuns?: string;
}

export interface BugInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  severity?: string;
  testCaseIds?: string[];
  assigneeIds?: string[];
}

export const TABLES = {
  projects: "projects",
  testCases: "Test cases",
  teamMembers: "Team members",
  bugs: "bugs",
} as const;

export const BUG_STATUSES: BugStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
export const BUG_PRIORITIES: BugPriority[] = ["Critical", "High", "Medium", "Low"];
export const BUG_SEVERITIES: BugSeverity[] = ["Critical", "High", "Medium", "Low"];
export const TEST_PRIORITIES: TestPriority[] = ["High", "Medium", "Low"];
export const TEST_TYPES: TestType[] = [
  "Manual",
  "Automated",
  "Functional",
  "Negative",
  "Security",
  "Usability",
  "Smoke",
  "Performance",
];

export const TEST_CATEGORIES = [
  "Product Search",
  "Shopping Cart",
  "Authentication",
  "User Profile",
  "Checkout",
  "API",
  "UI",
  "Other",
] as const;

/** Smoke and Performance cases do not use step-by-step instructions. */
export function testTypeUsesSteps(type: string | undefined | null) {
  const normalized = (type || "").trim().toLowerCase();
  return normalized !== "smoke" && normalized !== "performance";
}

export const MEMBER_ROLES: MemberRole[] = [
  "QA Engineer",
  "Developer",
  "Project Manager",
  "Product Owner",
  "Designer",
  "Other",
];

/** Select options from Airtable (seeded defaults + values already in records). */
export type AppChoices = {
  testCaseTypes: string[];
  testCasePriorities: string[];
  testCaseCategories: string[];
  bugStatuses: string[];
  bugPriorities: string[];
  bugSeverities: string[];
  memberRoles: string[];
  refreshedAt?: string;
};

export const DEFAULT_CHOICES: AppChoices = {
  testCaseTypes: [...TEST_TYPES],
  testCasePriorities: [...TEST_PRIORITIES],
  testCaseCategories: [...TEST_CATEGORIES],
  bugStatuses: [...BUG_STATUSES],
  bugPriorities: [...BUG_PRIORITIES],
  bugSeverities: [...BUG_SEVERITIES],
  memberRoles: [...MEMBER_ROLES],
};

/** Keep the current value selectable when editing older/unknown options. */
export function withCurrentOption(options: string[], current?: string | null) {
  const value = (current || "").trim();
  if (!value || options.includes(value)) return options;
  return [...options, value];
}
