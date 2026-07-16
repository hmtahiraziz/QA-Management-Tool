"use client";

import { useMemo, useState } from "react";
import {
  TestCaseFormModal,
  emptyTestCaseForm,
  type TestCaseFormState,
} from "@/components/forms";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  PriorityBadge,
  formatDate,
} from "@/components/ui";
import {
  ChipList,
  DetailDrawer,
  DetailGrid,
  Toolbar,
} from "@/components/workspace-ui";
import { useConfirm } from "@/components/confirm-dialog";
import { useAuth } from "@/components/auth-provider";
import { useCollection } from "@/lib/hooks";
import { formatStepsForSave } from "@/components/numbered-steps-input";
import type { Bug, Project, TestCase } from "@/lib/types";
import { testTypeUsesSteps } from "@/lib/types";
import { buildLookup, matchesQuery, resolveIds } from "@/lib/utils";

export function TestCasesView() {
  const { isFullAccess } = useAuth();
  const testCases = useCollection<TestCase>("/api/test-cases");
  const projects = useCollection<Project>("/api/projects");
  const bugs = useCollection<Bug>("/api/bugs");
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TestCase | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestCase | null>(null);
  const [form, setForm] = useState<TestCaseFormState>(emptyTestCaseForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const projectMap = useMemo(
    () => buildLookup(projects.data.map((p) => ({ id: p.id, label: p.name }))),
    [projects.data],
  );
  const bugMap = useMemo(
    () => buildLookup(bugs.data.map((b) => ({ id: b.id, label: b.title }))),
    [bugs.data],
  );

  const filtered = testCases.data.filter((t) =>
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
      ...resolveIds(t.bugIds, bugMap),
    ]),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyTestCaseForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(item: TestCase) {
    setEditing(item);
    setForm({
      title: item.title,
      testId: item.testId,
      description: item.description,
      steps: item.steps,
      expectedResults: item.expectedResults,
      category: item.category,
      priority: item.priority,
      type: item.type,
      testRuns: item.testRuns,
      projectIds: item.projectIds,
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        steps: testTypeUsesSteps(form.type) ? formatStepsForSave(form.steps) : "",
      };
      const saved = editing
        ? await testCases.update(editing.id, payload)
        : await testCases.create(payload);
      setSelected(saved);
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Test cases"
        description="Every field from your Test cases table — steps, expected results, links, and more."
        action={
          isFullAccess ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Add test case
            </button>
          ) : undefined
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        count={filtered.length}
        placeholder="Search test ID, title, category, steps…"
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => void testCases.refresh()}>
            Refresh
          </button>
        }
      />

      {testCases.error ? (
        <ErrorBanner message={testCases.error} onRetry={testCases.refresh} />
      ) : null}

      {testCases.loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No test cases" hint="Add a case or clear your search." />
      ) : (
        <div className="table-wrap db-table">
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
                <th>Bugs</th>
                {isFullAccess ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`clickable-row ${selected?.id === item.id ? "selected" : ""}`}
                  onClick={() => setSelected(item)}
                >
                  <td>
                    <code>{item.testId || "—"}</code>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="muted clamp">{item.description}</div>
                  </td>
                  <td>{item.category || "—"}</td>
                  <td>
                    <PriorityBadge value={item.priority} />
                  </td>
                  <td>{item.type || "—"}</td>
                  <td>{item.testRuns || "—"}</td>
                  <td>
                    <ChipList items={resolveIds(item.projectIds, projectMap)} />
                  </td>
                  <td>{item.bugIds.length}</td>
                  {isFullAccess ? (
                    <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn-ghost" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({
                            title: "Delete test case",
                            message: `Delete “${item.title}”? This cannot be undone.`,
                            confirmLabel: "Delete",
                          });
                          if (!ok) return;
                          void testCases.remove(item.id).then(() => {
                            if (selected?.id === item.id) setSelected(null);
                          });
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <DetailDrawer
          title={selected.title || "Untitled test case"}
          subtitle={`Airtable record ${selected.id}`}
          onClose={() => setSelected(null)}
          footer={
            isFullAccess ? (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => openEdit(selected)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete test case",
                      message: `Delete “${selected.title}”? This cannot be undone.`,
                      confirmLabel: "Delete",
                    });
                    if (!ok) return;
                    void testCases.remove(selected.id).then(() => setSelected(null));
                  }}
                >
                  Delete
                </button>
              </>
            ) : undefined
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.id },
              { label: "Test ID", value: selected.testId || "—" },
              { label: "Title", value: selected.title },
              { label: "Description", value: selected.description },
              ...(testTypeUsesSteps(selected.type)
                ? [
                    {
                      label: "Steps",
                      value: selected.steps ? (
                        <pre className="detail-pre">{selected.steps}</pre>
                      ) : (
                        "—"
                      ),
                    },
                  ]
                : []),
              { label: "Expected Results", value: selected.expectedResults },
              { label: "Category", value: selected.category },
              { label: "Priority", value: <PriorityBadge value={selected.priority} /> },
              { label: "Type", value: selected.type },
              { label: "Test Runs", value: selected.testRuns },
              {
                label: "Projects",
                value: <ChipList items={resolveIds(selected.projectIds, projectMap)} />,
              },
              {
                label: "Linked bugs",
                value: <ChipList items={resolveIds(selected.bugIds, bugMap)} />,
              },
              { label: "Created", value: formatDate(selected.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {open ? (
        <TestCaseFormModal
          title={editing ? "Edit test case" : "Add test case"}
          form={form}
          setForm={setForm}
          projects={projects.data}
          saving={saving}
          error={formError}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
        />
      ) : null}
      {confirmDialog}
    </>
  );
}
