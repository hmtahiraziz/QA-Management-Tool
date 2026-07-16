"use client";

import { useMemo, useState } from "react";
import {
  BugFormModal,
  emptyBugForm,
  type BugFormState,
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
  Toolbar,
} from "@/components/workspace-ui";
import { CustomSelect } from "@/components/custom-select";
import { useConfirm } from "@/components/confirm-dialog";
import { useAuth } from "@/components/auth-provider";
import { useChoices, useCollection } from "@/lib/hooks";
import type { Bug, TeamMember, TestCase } from "@/lib/types";
import { buildLookup, matchesQuery, resolveIds, shortId } from "@/lib/utils";

export function BugsView() {
  const { isFullAccess } = useAuth();
  const bugs = useCollection<Bug>("/api/bugs");
  const testCases = useCollection<TestCase>("/api/test-cases");
  const members = useCollection<TeamMember>("/api/team-members", {
    enabled: isFullAccess,
  });
  const { choices } = useChoices();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Bug | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bug | null>(null);
  const [form, setForm] = useState<BugFormState>(emptyBugForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const caseMap = useMemo(
    () =>
      buildLookup(
        testCases.data.map((t) => ({
          id: t.id,
          label: (t.testId || "").trim() || shortId(t.id),
        })),
      ),
    [testCases.data],
  );
  const memberMap = useMemo(
    () => buildLookup(members.data.map((m) => ({ id: m.id, label: m.name }))),
    [members.data],
  );

  const filtered = bugs.data.filter((b) => {
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return (
      matchesStatus &&
      matchesQuery(search, [
        b.title,
        b.description,
        b.status,
        b.priority,
        b.severity,
        b.createdBy?.name,
        ...resolveIds(b.assigneeIds, memberMap),
        ...resolveIds(b.testCaseIds, caseMap),
      ])
    );
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyBugForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(item: Bug) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      severity: item.severity,
      testCaseIds: item.testCaseIds,
      assigneeIds: item.assigneeIds,
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing ? await bugs.update(editing.id, form) : await bugs.create(form);
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
        title="Bugs"
        description="Track defects with full Airtable fields — status, severity, assignees, and linked cases."
        action={
          isFullAccess ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Add bug
            </button>
          ) : undefined
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        count={filtered.length}
        placeholder="Search title, assignee, status…"
        actions={
          <>
            <CustomSelect
              className="filter-select"
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="Filter by status"
              options={[
                { value: "All", label: "All statuses" },
                ...choices.bugStatuses.map((status) => ({
                  value: status,
                  label: status,
                })),
              ]}
            />
            <button type="button" className="btn btn-ghost" onClick={() => void bugs.refresh()}>
              Refresh
            </button>
          </>
        }
      />

      {bugs.error ? <ErrorBanner message={bugs.error} onRetry={bugs.refresh} /> : null}

      {bugs.loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No bugs" hint="Add a bug or adjust filters." />
      ) : (
        <div className="table-wrap db-table">
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
                    <strong>{item.title}</strong>
                    <div className="muted clamp">{item.description}</div>
                  </td>
                  <td>
                    <StatusBadge value={item.status} />
                  </td>
                  <td>
                    <PriorityBadge value={item.priority} />
                  </td>
                  <td>
                    <PriorityBadge value={item.severity} />
                  </td>
                  <td>
                    <ChipList items={resolveIds(item.assigneeIds, memberMap)} />
                  </td>
                  <td>
                    <ChipList items={resolveIds(item.testCaseIds, caseMap)} />
                  </td>
                  <td>{item.createdBy?.name || "—"}</td>
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
                            title: "Delete bug",
                            message: `Delete “${item.title}”? This cannot be undone.`,
                            confirmLabel: "Delete",
                          });
                          if (!ok) return;
                          void bugs.remove(item.id).then(() => {
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
          title={selected.title || "Untitled bug"}
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
                      title: "Delete bug",
                      message: `Delete “${selected.title}”? This cannot be undone.`,
                      confirmLabel: "Delete",
                    });
                    if (!ok) return;
                    void bugs.remove(selected.id).then(() => setSelected(null));
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
              { label: "Title", value: selected.title },
              { label: "Description", value: selected.description },
              { label: "Status", value: <StatusBadge value={selected.status} /> },
              { label: "Priority", value: <PriorityBadge value={selected.priority} /> },
              { label: "Severity", value: <PriorityBadge value={selected.severity} /> },
              {
                label: "Test cases",
                value: <ChipList items={resolveIds(selected.testCaseIds, caseMap)} />,
              },
              {
                label: "Assigned To",
                value: <ChipList items={resolveIds(selected.assigneeIds, memberMap)} />,
              },
              {
                label: "Created By",
                value: selected.createdBy
                  ? `${selected.createdBy.name} (${selected.createdBy.email})`
                  : "—",
              },
              { label: "Created", value: formatDate(selected.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {open ? (
        <BugFormModal
          title={editing ? "Edit bug" : "Add bug"}
          form={form}
          setForm={setForm}
          testCases={testCases.data}
          members={members.data}
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
