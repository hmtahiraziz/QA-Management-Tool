import type { ProjectFormState } from "@/components/forms";
import { formatStepsForSave } from "@/components/numbered-steps-input";
import type { Project, TestCase } from "@/lib/types";
import { testTypeUsesSteps } from "@/lib/types";

type ProjectApi = {
  create: (body: unknown) => Promise<Project>;
  update: (id: string, body: unknown) => Promise<Project>;
};

type TestCaseApi = {
  create: (body: unknown) => Promise<TestCase>;
  refresh: () => Promise<void>;
};

export async function saveProjectWithTestCases(options: {
  form: ProjectFormState;
  editing: Project | null;
  projects: ProjectApi;
  testCases: TestCaseApi;
}) {
  const { form, editing, projects, testCases } = options;
  const drafts = form.newTestCases.filter((draft) => draft.title.trim());

  for (const draft of drafts) {
    if (!draft.title.trim()) {
      throw new Error("Each new test case needs a title");
    }
  }

  const basePayload = {
    name: form.name,
    client: form.client,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    linkedTestCaseIds: form.linkedTestCaseIds,
  };

  let project = editing
    ? await projects.update(editing.id, basePayload)
    : await projects.create(basePayload);

  const createdIds: string[] = [];
  for (const draft of drafts) {
    const created = await testCases.create({
      title: draft.title.trim(),
      testId: draft.testId.trim() || undefined,
      description: draft.description,
      steps: testTypeUsesSteps(draft.type) ? formatStepsForSave(draft.steps) : "",
      expectedResults: draft.expectedResults,
      category: draft.category,
      priority: draft.priority,
      type: draft.type,
      projectIds: [project.id],
    });
    createdIds.push(created.id);
  }

  if (createdIds.length > 0) {
    const linkedTestCaseIds = Array.from(
      new Set([...form.linkedTestCaseIds, ...createdIds]),
    );
    project = await projects.update(project.id, {
      ...basePayload,
      linkedTestCaseIds,
    });
    await testCases.refresh();
  }

  return project;
}
