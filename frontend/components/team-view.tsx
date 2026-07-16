"use client";

import { useState } from "react";
import {
  MemberFormModal,
  emptyMemberForm,
  type MemberFormState,
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
import { useCollection } from "@/lib/hooks";
import type { TeamMember } from "@/lib/types";
import { matchesQuery, shortId } from "@/lib/utils";

export function TeamView() {
  const members = useCollection<TeamMember>("/api/team-members");
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberFormState>(emptyMemberForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = members.data.filter((m) =>
    matchesQuery(search, [m.name, m.email, m.role, m.testRuns, m.id]),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyMemberForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(item: TeamMember) {
    setEditing(item);
    setForm({
      name: item.name,
      email: item.email,
      role: item.role,
      testRuns: item.testRuns,
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await members.update(editing.id, form)
        : await members.create(form);
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
        title="Team"
        description="Invite people by email. Invited users get full edit access; others stay read-only."
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Invite member
          </button>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        count={filtered.length}
        placeholder="Search name, email, or role…"
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => void members.refresh()}>
            Refresh
          </button>
        }
      />

      {members.error ? (
        <ErrorBanner message={members.error} onRetry={members.refresh} />
      ) : null}

      {members.loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No team members" hint="Invite a teammate by email to grant full access." />
      ) : (
        <div className="table-wrap db-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Test Runs</th>
                <th>Linked bugs</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  className={`clickable-row ${selected?.id === member.id ? "selected" : ""}`}
                  onClick={() => setSelected(member)}
                >
                  <td>
                    <div className="name-cell">
                      <span className="avatar sm">{member.name.slice(0, 1).toUpperCase()}</span>
                      <strong>{member.name}</strong>
                    </div>
                  </td>
                  <td>{member.email || "—"}</td>
                  <td>{member.role || "—"}</td>
                  <td>{member.testRuns || "—"}</td>
                  <td>{member.bugIds.length}</td>
                  <td>{formatDate(member.createdTime || null)}</td>
                  <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => openEdit(member)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await confirm({
                          title: "Remove member",
                          message: `Remove “${member.name}” from the active team? They will be deactivated (soft deleted), not permanently erased.`,
                          confirmLabel: "Remove",
                        });
                        if (!ok) return;
                        void members.remove(member.id).then(() => {
                          if (selected?.id === member.id) setSelected(null);
                        });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <DetailDrawer
          title={selected.name || "Untitled member"}
          subtitle={`Airtable record ${selected.id}`}
          onClose={() => setSelected(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => openEdit(selected)}>
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Remove member",
                    message: `Remove “${selected.name}” from the active team? They will be deactivated (soft deleted), not permanently erased.`,
                    confirmLabel: "Remove",
                  });
                  if (!ok) return;
                  void members.remove(selected.id).then(() => setSelected(null));
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <DetailGrid
            rows={[
              { label: "Record ID", value: selected.id },
              { label: "Name", value: selected.name },
              { label: "Email", value: selected.email },
              { label: "Role", value: selected.role },
              { label: "Test Runs", value: selected.testRuns },
              {
                label: "Linked bugs",
                value: <ChipList items={selected.bugIds.map(shortId)} />,
              },
              { label: "Created", value: formatDate(selected.createdTime || null) },
            ]}
          />
        </DetailDrawer>
      ) : null}

      {open ? (
        <MemberFormModal
          title={editing ? "Edit member" : "Invite team member"}
          form={form}
          setForm={setForm}
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
