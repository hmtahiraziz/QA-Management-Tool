"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BugFormModal,
  MemberFormModal,
  ProjectFormModal,
  TestCaseFormModal,
  emptyBugForm,
  emptyMemberForm,
  emptyProjectForm,
  emptyTestCaseForm,
  type BugFormState,
  type MemberFormState,
  type ProjectFormState,
  type TestCaseFormState,
} from "@/components/forms";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  PriorityBadge,
  StatusBadge,
  formatDate,
} from "@/components/ui";
import {
  ChipList,
  DetailDrawer,
  DetailGrid,
  QuickAddMenu,
  Toolbar,
} from "@/components/workspace-ui";
import { useAuth } from "@/components/auth-provider";
import { useCollection } from "@/lib/hooks";
import { formatStepsForSave } from "@/components/numbered-steps-input";
import { saveProjectWithTestCases } from "@/lib/project-save";
import type { Bug, Project, TeamMember, TestCase } from "@/lib/types";
import { testTypeUsesSteps } from "@/lib/types";
import { buildLookup, matchesQuery, resolveIds, shortId, testCaseLabel } from "@/lib/utils";

type TabKey = "projects" | "test-cases" | "bugs" | "team";
type AddType = "project" | "test-case" | "bug" | "member";

const allTabs: { key: TabKey; label: string; href: string; fullOnly?: boolean }[] = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "test-cases", label: "Test cases", href: "/test-cases" },
  { key: "bugs", label: "Bugs", href: "/bugs" },
  { key: "team", label: "Team members", href: "/team", fullOnly: true },
];

export function DashboardView() {
  const { isFullAccess } = useAuth();
  const projects = useCollection<Project>("/api/projects");
  const testCases = useCollection<TestCase>("/api/test-cases");
  const bugs = useCollection<Bug>("/api/bugs");
  const members = useCollection<TeamMember>("/api/team-members", {
    enabled: isFullAccess,
  });

  const tabs = allTabs.filter((t) => !t.fullOnly || isFullAccess);
  const [tab, setTab] = useState<TabKey>("projects");

  useEffect(() => {
    if (!isFullAccess && tab === "team") setTab("projects");
  }, [isFullAccess, tab]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<
    | { type: "project"; item: Project }
    | { type: "test-case"; item: TestCase }
    | { type: "bug"; item: Bug }
    | { type: "member"; item: TeamMember }
    | null
  >(null);

  const [addType, setAddType] = useState<AddType | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProjectForm);
  const [caseForm, setCaseForm] = useState<TestCaseFormState>(emptyTestCaseForm);
  const [bugForm, setBugForm] = useState<BugFormState>(emptyBugForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const projectMap = useMemo(
    () => buildLookup(projects.data.map((p) => ({ id: p.id, label: p.name }))),
    [projects.data],
  );
  const caseMap = useMemo(
    () =>
      buildLookup(
        testCases.data.map((t) => ({ id: t.id, label: testCaseLabel(t) })),
      ),
    [testCases.data],
  );
  const memberMap = useMemo(
    () => buildLookup(members.data.map((m) => ({ id: m.id, label: m.name }))),
    [members.data],
  );
  const bugMap = useMemo(
    () => buildLookup(bugs.data.map((b) => ({ id: b.id, label: b.title }))),
    [bugs.data],
  );

  const loading =
    projects.loading || testCases.loading || bugs.loading || members.loading;
  const error =
    projects.error || testCases.error || bugs.error || members.error;

  const filteredProjects = projects.data.filter((p) =>
    matchesQuery(search, [p.name, p.client, p.id, ...resolveIds(p.linkedTestCaseIds, caseMap)]),
  );
  const filteredCases = testCases.data.filter((t) =>
    matchesQuery(search, [
      t.testId,
      t.title,
      t.description,
      t.category,
      t.priority,
      t.type,
      t.testRuns,
      t.steps,
      t.expectedResults,
      ...resolveIds(t.projectIds, projectMap),
    ]),
  );
  const filteredBugs = bugs.data.filter((b) =>
    matchesQuery(search, [
      b.title,
      b.description,
      b.status,
      b.priority,
      b.severity,
      b.createdBy?.name,
      ...resolveIds(b.assigneeIds, memberMap),
      ...resolveIds(b.testCaseIds, caseMap),
    ]),
  );
  const filteredMembers = members.data.filter((m) =>
    matchesQuery(search, [m.name, m.email, m.role, m.testRuns, m.id]),
  );

  const openBugs = bugs.data.filter(
    (b) => b.status === "Open" || b.status === "In Progress",
  );

  function openAdd(type: AddType) {
    setFormError(null);
    setAddType(type);
    setProjectForm(emptyProjectForm);
    setCaseForm(emptyTestCaseForm);
    setBugForm(emptyBugForm);
    setMemberForm(emptyMemberForm);
    if (type === "project") setTab("projects");
    if (type === "test-case") setTab("test-cases");
    if (type === "bug") setTab("bugs");
    if (type === "member") setTab("team");
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await saveProjectWithTestCases({
        form: projectForm,
        editing: null,
        projects,
        testCases,
      });
      setAddType(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveCase(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await testCases.create({
        ...caseForm,
        steps: testTypeUsesSteps(caseForm.type)
          ? formatStepsForSave(caseForm.steps)
          : "",
      });
      setAddType(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveBug(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await bugs.create(bugForm);
      setAddType(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await members.create(memberForm);
      setAddType(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const currentCount =
    tab === "projects"
      ? filteredProjects.length
      : tab === "test-cases"
        ? filteredCases.length
        : tab === "bugs"
          ? filteredBugs.length
          : filteredMembers.length;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Browse every Airtable table in one place — inspect full record fields, search, and add new rows."
      />

      {isFullAccess ? <QuickAddMenu onSelect={openAdd} /> : null}

      <div className="stats-grid compact">
        <button type="button" className="stat-card" onClick={() => setTab("projects")}>
          <span>Projects</span>
          <strong>{projects.data.length}</strong>
        </button>
        <button type="button" className="stat-card" onClick={() => setTab("test-cases")}>
          <span>Test cases</span>
          <strong>{testCases.data.length}</strong>
        </button>
        <button type="button" className="stat-card" onClick={() => setTab("bugs")}>
          <span>Open bugs</span>
          <strong>{openBugs.length}</strong>
        </button>
        {isFullAccess ? (
          <button type="button" className="stat-card" onClick={() => setTab("team")}>
            <span>Team</span>
            <strong>{members.data.length}</strong>
          </button>
        ) : null}
      </div>

      {error ? (
        <ErrorBanner
          message={error}
          onRetry={() => {
            void projects.refresh();
            void testCases.refresh();
            void bugs.refresh();
            void members.refresh();
          }}
        />
      ) : null}

      <section className="db-browser">
        <div className="db-tabs" role="tablist" aria-label="Airtable tables">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`db-tab${tab === item.key ? " active" : ""}`}
              onClick={() => {
                setTab(item.key);
                setSearch("");
                setSelected(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Toolbar
          search={search}
          onSearch={setSearch}
          count={currentCount}
          placeholder={`Search ${tabs.find((t) => t.key === tab)?.label.toLowerCase()}…`}
          actions={
            <>
              <Link className="btn btn-ghost" href={tabs.find((t) => t.key === tab)?.href || "/"}>
                Open full page
              </Link>
              {isFullAccess ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    openAdd(
                      tab === "projects"
                        ? "project"
                        : tab === "test-cases"
                          ? "test-case"
                          : tab === "bugs"
                            ? "bug"
                            : "member",
                    )
                  }
                >
                  Add
                </button>
              ) : null}
            </>
          }
        />

        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="table-wrap db-table">
            {tab === "projects" && (
              <ProjectsTable
                rows={filteredProjects}
                caseMap={caseMap}
                onSelect={(item) => setSelected({ type: "project", item })}
              />
            )}
            {tab === "test-cases" && (
              <TestCasesTable
                rows={filteredCases}
                projectMap={projectMap}
                onSelect={(item) => setSelected({ type: "test-case", item })}
              />
            )}
            {tab === "bugs" && (
              <BugsTable
                rows={filteredBugs}
                caseMap={caseMap}
                memberMap={memberMap}
                onSelect={(item) => setSelected({ type: "bug", item })}
              />
            )}
            {tab === "team" && (
              <TeamTable
                rows={filteredMembers}
                onSelect={(item) => setSelected({ type: "member", item })}
              />
            )}
          </div>
        )}
      </section>

      {selected?.type === "project" ? (
        <DetailDrawer
          title={selected.item.name || "Untitled project"}
          subtitle={`Record ${shortId(selected.item.id)}`}
          onClose={() => setSelected(null)}
          footer={
            <Link className="btn btn-primary" href="/projects">
              Manage in Projects
            </Link>
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.item.id },
              { label: "Project Name", value: selected.item.name },
              { label: "Client", value: selected.item.client },
              { label: "Start Date", value: formatDate(selected.item.startDate) },
              { label: "End Date", value: formatDate(selected.item.endDate) },
              {
                label: "Linked test cases",
                value: <ChipList items={resolveIds(selected.item.linkedTestCaseIds, caseMap)} />,
              },
              { label: "Created", value: formatDate(selected.item.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {selected?.type === "test-case" ? (
        <DetailDrawer
          title={selected.item.title || "Untitled test case"}
          subtitle={`Record ${shortId(selected.item.id)}`}
          onClose={() => setSelected(null)}
          footer={
            <Link className="btn btn-primary" href="/test-cases">
              Manage in Test cases
            </Link>
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.item.id },
              { label: "Test ID", value: selected.item.testId || "—" },
              { label: "Title", value: selected.item.title },
              { label: "Description", value: selected.item.description },
              ...(testTypeUsesSteps(selected.item.type)
                ? [{ label: "Steps", value: <Pre value={selected.item.steps} /> }]
                : []),
              { label: "Expected Results", value: selected.item.expectedResults },
              { label: "Category", value: selected.item.category },
              { label: "Priority", value: <PriorityBadge value={selected.item.priority} /> },
              { label: "Type", value: selected.item.type },
              { label: "Test Runs", value: selected.item.testRuns },
              {
                label: "Projects",
                value: <ChipList items={resolveIds(selected.item.projectIds, projectMap)} />,
              },
              {
                label: "Bugs",
                value: <ChipList items={resolveIds(selected.item.bugIds, bugMap)} />,
              },
              { label: "Created", value: formatDate(selected.item.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {selected?.type === "bug" ? (
        <DetailDrawer
          title={selected.item.title || "Untitled bug"}
          subtitle={`Record ${shortId(selected.item.id)}`}
          onClose={() => setSelected(null)}
          footer={
            <Link className="btn btn-primary" href="/bugs">
              Manage in Bugs
            </Link>
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.item.id },
              { label: "Title", value: selected.item.title },
              { label: "Description", value: selected.item.description },
              { label: "Status", value: <StatusBadge value={selected.item.status} /> },
              { label: "Priority", value: <PriorityBadge value={selected.item.priority} /> },
              { label: "Severity", value: <PriorityBadge value={selected.item.severity} /> },
              {
                label: "Test cases",
                value: <ChipList items={resolveIds(selected.item.testCaseIds, caseMap)} />,
              },
              {
                label: "Assigned To",
                value: <ChipList items={resolveIds(selected.item.assigneeIds, memberMap)} />,
              },
              {
                label: "Created By",
                value: selected.item.createdBy
                  ? `${selected.item.createdBy.name} (${selected.item.createdBy.email})`
                  : "—",
              },
              { label: "Created", value: formatDate(selected.item.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {selected?.type === "member" ? (
        <DetailDrawer
          title={selected.item.name || "Untitled member"}
          subtitle={`Record ${shortId(selected.item.id)}`}
          onClose={() => setSelected(null)}
          footer={
            <Link className="btn btn-primary" href="/team">
              Manage in Team
            </Link>
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.item.id },
              { label: "Name", value: selected.item.name },
              { label: "Email", value: selected.item.email },
              { label: "Role", value: selected.item.role },
              { label: "Test Runs", value: selected.item.testRuns },
              {
                label: "Linked bugs",
                value: <ChipList items={resolveIds(selected.item.bugIds, bugMap)} />,
              },
              { label: "Created", value: formatDate(selected.item.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {addType === "project" ? (
        <ProjectFormModal
          title="Add project"
          form={projectForm}
          setForm={setProjectForm}
          testCases={testCases.data}
          saving={saving}
          error={formError}
          onClose={() => setAddType(null)}
          onSubmit={saveProject}
        />
      ) : null}
      {addType === "test-case" ? (
        <TestCaseFormModal
          title="Add test case"
          form={caseForm}
          setForm={setCaseForm}
          projects={projects.data}
          saving={saving}
          error={formError}
          onClose={() => setAddType(null)}
          onSubmit={saveCase}
        />
      ) : null}
      {addType === "bug" ? (
        <BugFormModal
          title="Add bug"
          form={bugForm}
          setForm={setBugForm}
          testCases={testCases.data}
          members={members.data}
          saving={saving}
          error={formError}
          onClose={() => setAddType(null)}
          onSubmit={saveBug}
        />
      ) : null}
      {addType === "member" ? (
        <MemberFormModal
          title={addType === "member" ? "Invite team member" : "Add team member"}
          form={memberForm}
          setForm={setMemberForm}
          saving={saving}
          error={formError}
          onClose={() => setAddType(null)}
          onSubmit={saveMember}
        />
      ) : null}
    </>
  );
}

function Pre({ value }: { value: string }) {
  if (!value) return <span className="muted">—</span>;
  return <pre className="detail-pre">{value}</pre>;
}

function ProjectsTable({
  rows,
  caseMap,
  onSelect,
}: {
  rows: Project[];
  caseMap: Map<string, string>;
  onSelect: (item: Project) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No projects found" hint="Try another search or add a project." />;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Project Name</th>
          <th>Client</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Linked test cases</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="clickable-row" onClick={() => onSelect(row)}>
            <td>
              <strong>{row.name}</strong>
            </td>
            <td>{row.client || "—"}</td>
            <td>{formatDate(row.startDate)}</td>
            <td>{formatDate(row.endDate)}</td>
            <td>
              <ChipList items={resolveIds(row.linkedTestCaseIds, caseMap)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TestCasesTable({
  rows,
  projectMap,
  onSelect,
}: {
  rows: TestCase[];
  projectMap: Map<string, string>;
  onSelect: (item: TestCase) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No test cases found" hint="Try another search or add a test case." />;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Title</th>
          <th>Category</th>
          <th>Priority</th>
          <th>Type</th>
          <th>Test Runs</th>
          <th>Projects</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="clickable-row" onClick={() => onSelect(row)}>
            <td>
              <code>{row.testId || "—"}</code>
            </td>
            <td>
              <strong>{row.title}</strong>
            </td>
            <td>{row.category || "—"}</td>
            <td>
              <PriorityBadge value={row.priority} />
            </td>
            <td>{row.type || "—"}</td>
            <td>{row.testRuns || "—"}</td>
            <td>
              <ChipList items={resolveIds(row.projectIds, projectMap)} />
            </td>
            <td>
              <div className="muted clamp">{row.description || "—"}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BugsTable({
  rows,
  caseMap,
  memberMap,
  onSelect,
}: {
  rows: Bug[];
  caseMap: Map<string, string>;
  memberMap: Map<string, string>;
  onSelect: (item: Bug) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No bugs found" hint="Try another search or add a bug." />;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Severity</th>
          <th>Assignees</th>
          <th>Test cases</th>
          <th>Created By</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="clickable-row" onClick={() => onSelect(row)}>
            <td>
              <strong>{row.title}</strong>
            </td>
            <td>
              <StatusBadge value={row.status} />
            </td>
            <td>
              <PriorityBadge value={row.priority} />
            </td>
            <td>
              <PriorityBadge value={row.severity} />
            </td>
            <td>
              <ChipList items={resolveIds(row.assigneeIds, memberMap)} />
            </td>
            <td>
              <ChipList items={resolveIds(row.testCaseIds, caseMap)} />
            </td>
            <td>{row.createdBy?.name || "—"}</td>
            <td>
              <div className="muted clamp">{row.description || "—"}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamTable({
  rows,
  onSelect,
}: {
  rows: TeamMember[];
  onSelect: (item: TeamMember) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No team members found" hint="Try another search or add a member." />;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Test Runs</th>
          <th>Bugs</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="clickable-row" onClick={() => onSelect(row)}>
            <td>
              <strong>{row.name}</strong>
            </td>
            <td>{row.email || "—"}</td>
            <td>{row.role || "—"}</td>
            <td>{row.testRuns || "—"}</td>
            <td>{row.bugIds.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
