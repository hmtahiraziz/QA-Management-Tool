"use client";

import { useMemo, useState } from "react";
import {
  ProjectFormModal,
  emptyProjectForm,
  type ProjectFormState,
} from "@/components/forms";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
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
import { saveProjectWithTestCases } from "@/lib/project-save";
import type { Project, TestCase } from "@/lib/types";
import { buildLookup, matchesQuery, resolveIds, testCaseLabel } from "@/lib/utils";

export function ProjectsView() {
  const { isFullAccess } = useAuth();
  const projects = useCollection<Project>("/api/projects");
  const testCases = useCollection<TestCase>("/api/test-cases");
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const caseMap = useMemo(
    () =>
      buildLookup(
        testCases.data.map((t) => ({ id: t.id, label: testCaseLabel(t) })),
      ),
    [testCases.data],
  );

  const filtered = projects.data.filter((p) =>
    matchesQuery(search, [
      p.name,
      p.client,
      p.id,
      ...resolveIds(p.linkedTestCaseIds, caseMap),
    ]),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyProjectForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({
      name: project.name,
      client: project.client,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      linkedTestCaseIds: project.linkedTestCaseIds,
      newTestCases: [],
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const saved = await saveProjectWithTestCases({
        form,
        editing,
        projects,
        testCases,
      });
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
        title="Projects"
        description="Full project table from Airtable — click any row to inspect every field."
        action={
          isFullAccess ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Add project
            </button>
          ) : undefined
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        count={filtered.length}
        placeholder="Search by name, client, or linked case…"
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => void projects.refresh()}>
            Refresh
          </button>
        }
      />

      {projects.error ? (
        <ErrorBanner message={projects.error} onRetry={projects.refresh} />
      ) : null}

      {projects.loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects" hint="Add a project or clear your search." />
      ) : (
        <div className="table-wrap db-table">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Linked test cases</th>
                <th>Created</th>
                {isFullAccess ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  className={`clickable-row ${selected?.id === project.id ? "selected" : ""}`}
                  onClick={() => setSelected(project)}
                >
                  <td>
                    <strong>{project.name}</strong>
                  </td>
                  <td>{project.client || "—"}</td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatDate(project.endDate)}</td>
                  <td>
                    <ChipList items={resolveIds(project.linkedTestCaseIds, caseMap)} />
                  </td>
                  <td>{formatDate(project.createdTime || null)}</td>
                  {isFullAccess ? (
                    <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => openEdit(project)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({
                            title: "Delete project",
                            message: `Delete “${project.name}”? This cannot be undone.`,
                            confirmLabel: "Delete",
                          });
                          if (!ok) return;
                          void projects.remove(project.id).then(() => {
                            if (selected?.id === project.id) setSelected(null);
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
          title={selected.name || "Untitled project"}
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
                      title: "Delete project",
                      message: `Delete “${selected.name}”? This cannot be undone.`,
                      confirmLabel: "Delete",
                    });
                    if (!ok) return;
                    void projects.remove(selected.id).then(() => setSelected(null));
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
              { label: "Project Name", value: selected.name },
              { label: "Client", value: selected.client },
              { label: "Start Date", value: formatDate(selected.startDate) },
              { label: "End Date", value: formatDate(selected.endDate) },
              {
                label: "Linked test cases",
                value: <ChipList items={resolveIds(selected.linkedTestCaseIds, caseMap)} />,
              },
              { label: "Created", value: formatDate(selected.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {open ? (
        <ProjectFormModal
          title={editing ? "Edit project" : "Add project"}
          form={form}
          setForm={setForm}
          testCases={testCases.data}
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
