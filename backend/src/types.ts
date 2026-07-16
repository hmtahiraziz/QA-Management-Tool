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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdTime?: string;
}

export interface AuthUserRecord extends AuthUser {
  passwordHash: string;
}

export type AccessLevel = "readonly" | "full";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  access: AccessLevel;
}

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const TABLES = {
  projects: "projects",
  testCases: "Test cases",
  teamMembers: "Team members",
  bugs: "bugs",
  users: "Users",
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

/** Known Category choices (extend as Airtable options grow). */
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

export const MEMBER_ROLES: MemberRole[] = [
  "QA Engineer",
  "Developer",
  "Project Manager",
  "Product Owner",
  "Designer",
  "Other",
];
