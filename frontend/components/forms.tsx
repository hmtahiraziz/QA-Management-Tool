"use client";

import { CustomSelect } from "@/components/custom-select";
import { NumberedStepsInput } from "@/components/numbered-steps-input";
import { Field, Modal } from "@/components/ui";
import { useChoices } from "@/lib/hooks";
import {
  testTypeUsesSteps,
  withCurrentOption,
  type Project,
  type TeamMember,
  type TestCase,
} from "@/lib/types";

function optionList(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

export type NewTestCaseDraft = {
  key: string;
  title: string;
  testId: string;
  description: string;
  steps: string;
  expectedResults: string;
  category: string;
  priority: string;
  type: string;
};

export type ProjectFormState = {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  linkedTestCaseIds: string[];
  newTestCases: NewTestCaseDraft[];
};

export type TestCaseFormState = {
  title: string;
  testId: string;
  description: string;
  steps: string;
  expectedResults: string;
  category: string;
  priority: string;
  type: string;
  testRuns: string;
  projectIds: string[];
};

export type BugFormState = {
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  testCaseIds: string[];
  assigneeIds: string[];
};

export type MemberFormState = {
  name: string;
  email: string;
  role: string;
  testRuns: string;
};

export function createEmptyTestCaseDraft(): NewTestCaseDraft {
  return {
    key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    testId: "",
    description: "",
    steps: "",
    expectedResults: "",
    category: "",
    priority: "Medium",
    type: "Functional",
  };
}

export const emptyProjectForm: ProjectFormState = {
  name: "",
  client: "",
  startDate: "",
  endDate: "",
  linkedTestCaseIds: [],
  newTestCases: [],
};

export const emptyTestCaseForm: TestCaseFormState = {
  title: "",
  testId: "",
  description: "",
  steps: "",
  expectedResults: "",
  category: "",
  priority: "Medium",
  type: "Functional",
  testRuns: "",
  projectIds: [],
};

export const emptyBugForm: BugFormState = {
  title: "",
  description: "",
  status: "Open",
  priority: "Medium",
  severity: "Medium",
  testCaseIds: [],
  assigneeIds: [],
};

export const emptyMemberForm: MemberFormState = {
  name: "",
  email: "",
  role: "QA Engineer",
  testRuns: "",
};

type CommonProps = {
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function ProjectFormModal({
  title,
  form,
  setForm,
  testCases,
  saving,
  error,
  onClose,
  onSubmit,
}: CommonProps & {
  title: string;
  form: ProjectFormState;
  setForm: (value: ProjectFormState) => void;
  testCases: TestCase[];
}) {
  const { choices } = useChoices();

  function updateDraft(key: string, patch: Partial<NewTestCaseDraft>) {
    setForm({
      ...form,
      newTestCases: form.newTestCases.map((draft) =>
        draft.key === key ? { ...draft, ...patch } : draft,
      ),
    });
  }

  function removeDraft(key: string) {
    setForm({
      ...form,
      newTestCases: form.newTestCases.filter((draft) => draft.key !== key),
    });
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <Field label="Project name *">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Website Redesign"
          />
        </Field>
        <Field label="Client">
          <input
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
            placeholder="Client name"
          />
        </Field>
        <div className="form-grid">
          <Field label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Select existing test cases">
          <CustomSelect
            multiple
            value={form.linkedTestCaseIds}
            onChange={(linkedTestCaseIds) => setForm({ ...form, linkedTestCaseIds })}
            options={testCases.map((tc) => ({
              value: tc.id,
              label: tc.testId ? `${tc.testId} · ${tc.title || "Untitled"}` : tc.title || "Untitled",
            }))}
            placeholder="Select test cases…"
          />
          <span className="field-hint">Optional — click options to link existing cases</span>
        </Field>

        <div className="inline-create">
          <div className="inline-create-header">
            <div>
              <strong>Create new test cases</strong>
              <p className="field-hint">
                Add one or more cases for this project. They will be created and linked on save.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setForm({
                  ...form,
                  newTestCases: [...form.newTestCases, createEmptyTestCaseDraft()],
                })
              }
            >
              + Add test case
            </button>
          </div>

          {form.newTestCases.length === 0 ? (
            <p className="inline-create-empty">No new cases yet — use the button above to add some.</p>
          ) : (
            <div className="draft-list">
              {form.newTestCases.map((draft, index) => (
                <div key={draft.key} className="draft-card">
                  <div className="draft-card-header">
                    <span>New case {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeDraft(draft.key)}
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="Title *">
                    <input
                      required
                      value={draft.title}
                      onChange={(e) => updateDraft(draft.key, { title: e.target.value })}
                      placeholder="Verify checkout with valid card"
                    />
                  </Field>
                  <Field label="Test ID">
                    <input
                      value={draft.testId}
                      onChange={(e) => updateDraft(draft.key, { testId: e.target.value })}
                      placeholder="TC001"
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Priority">
                      <CustomSelect
                        value={draft.priority}
                        onChange={(priority) => updateDraft(draft.key, { priority })}
                        options={optionList(
                          withCurrentOption(choices.testCasePriorities, draft.priority),
                        )}
                      />
                    </Field>
                    <Field label="Type">
                      <CustomSelect
                        value={draft.type}
                        onChange={(type) =>
                          updateDraft(draft.key, {
                            type,
                            steps: testTypeUsesSteps(type) ? draft.steps : "",
                          })
                        }
                        options={optionList(
                          withCurrentOption(choices.testCaseTypes, draft.type),
                        )}
                      />
                    </Field>
                  </div>
                  <Field label="Category">
                    <CustomSelect
                      value={draft.category}
                      onChange={(category) => updateDraft(draft.key, { category })}
                      options={[
                        { value: "", label: "None" },
                        ...optionList(
                          withCurrentOption(choices.testCaseCategories, draft.category),
                        ),
                      ]}
                      placeholder="None"
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      rows={2}
                      value={draft.description}
                      onChange={(e) => updateDraft(draft.key, { description: e.target.value })}
                    />
                  </Field>
                  {testTypeUsesSteps(draft.type) ? (
                    <Field label="Steps">
                      <NumberedStepsInput
                        value={draft.steps}
                        onChange={(steps) => updateDraft(draft.key, { steps })}
                        placeholder="Open checkout page"
                      />
                    </Field>
                  ) : (
                    <p className="field-hint">
                      Steps are not used for Smoke or Performance tests.
                    </p>
                  )}
                  <Field label="Expected results">
                    <textarea
                      rows={2}
                      value={draft.expectedResults}
                      onChange={(e) =>
                        updateDraft(draft.key, { expectedResults: e.target.value })
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function TestCaseFormModal({
  title,
  form,
  setForm,
  projects,
  saving,
  error,
  onClose,
  onSubmit,
}: CommonProps & {
  title: string;
  form: TestCaseFormState;
  setForm: (value: TestCaseFormState) => void;
  projects: Project[];
}) {
  const { choices } = useChoices();

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <Field label="Title *">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Verify login with valid credentials"
          />
        </Field>
        <Field label="Test ID">
          <input
            value={form.testId}
            onChange={(e) => setForm({ ...form, testId: e.target.value })}
            placeholder="TC001"
          />
        </Field>
        <div className="form-grid">
          <Field label="Type">
            <CustomSelect
              value={form.type}
              onChange={(type) =>
                setForm({
                  ...form,
                  type,
                  steps: testTypeUsesSteps(type) ? form.steps : "",
                })
              }
              options={optionList(withCurrentOption(choices.testCaseTypes, form.type))}
            />
          </Field>
          <Field label="Priority">
            <CustomSelect
              value={form.priority}
              onChange={(priority) => setForm({ ...form, priority })}
              options={optionList(
                withCurrentOption(choices.testCasePriorities, form.priority),
              )}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        {testTypeUsesSteps(form.type) ? (
          <Field label="Steps">
            <NumberedStepsInput
              value={form.steps}
              onChange={(steps) => setForm({ ...form, steps })}
              placeholder="Open login page"
            />
          </Field>
        ) : (
          <p className="field-hint">Steps are not used for Smoke or Performance tests.</p>
        )}
        <Field label="Expected results">
          <textarea
            rows={2}
            value={form.expectedResults}
            onChange={(e) => setForm({ ...form, expectedResults: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <CustomSelect
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
              options={[
                { value: "", label: "None" },
                ...optionList(withCurrentOption(choices.testCaseCategories, form.category)),
              ]}
              placeholder="None"
            />
          </Field>
          <Field label="Test run">
            <input
              value={form.testRuns}
              onChange={(e) => setForm({ ...form, testRuns: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Projects">
          <CustomSelect
            multiple
            value={form.projectIds}
            onChange={(projectIds) => setForm({ ...form, projectIds })}
            options={projects.map((p) => ({ value: p.id, label: p.name || "Untitled" }))}
            placeholder="Select projects…"
          />
        </Field>
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function BugFormModal({
  title,
  form,
  setForm,
  testCases,
  members,
  saving,
  error,
  onClose,
  onSubmit,
}: CommonProps & {
  title: string;
  form: BugFormState;
  setForm: (value: BugFormState) => void;
  testCases: TestCase[];
  members: TeamMember[];
}) {
  const { choices } = useChoices();

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <Field label="Title *">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Login button unresponsive"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Status">
            <CustomSelect
              value={form.status}
              onChange={(status) => setForm({ ...form, status })}
              options={optionList(withCurrentOption(choices.bugStatuses, form.status))}
            />
          </Field>
          <Field label="Priority">
            <CustomSelect
              value={form.priority}
              onChange={(priority) => setForm({ ...form, priority })}
              options={optionList(withCurrentOption(choices.bugPriorities, form.priority))}
            />
          </Field>
          <Field label="Severity">
            <CustomSelect
              value={form.severity}
              onChange={(severity) => setForm({ ...form, severity })}
              options={optionList(withCurrentOption(choices.bugSeverities, form.severity))}
            />
          </Field>
        </div>
        <Field label="Related test cases">
          <CustomSelect
            multiple
            value={form.testCaseIds}
            onChange={(testCaseIds) => setForm({ ...form, testCaseIds })}
            options={testCases.map((tc) => ({
              value: tc.id,
              label: (tc.testId || "").trim() || tc.title || "Untitled",
            }))}
            placeholder="Select test cases…"
          />
        </Field>
        <Field label="Assignees">
          <CustomSelect
            multiple
            value={form.assigneeIds}
            onChange={(assigneeIds) => setForm({ ...form, assigneeIds })}
            options={members.map((m) => ({ value: m.id, label: m.name || "Untitled" }))}
            placeholder="Select assignees…"
          />
        </Field>
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

export function MemberFormModal({
  title,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: CommonProps & {
  title: string;
  form: MemberFormState;
  setForm: (value: MemberFormState) => void;
}) {
  const { choices } = useChoices();

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <Field label="Name *">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Alex Rivera"
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="alex@company.com"
          />
        </Field>
        <p className="field-hint">
          Inviting this email grants full platform access once they sign up or
          sign in with the same address.
        </p>
        <Field label="Role">
          <CustomSelect
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
            options={optionList(withCurrentOption(choices.memberRoles, form.role))}
          />
        </Field>
        {/* <Field label="Test runs">
          <input
            value={form.testRuns}
            onChange={(e) => setForm({ ...form, testRuns: e.target.value })}
          />
        </Field> */}
        {error ? <p className="form-error">{error}</p> : null}
        <FormActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

function FormActions({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <div className="form-actions">
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
