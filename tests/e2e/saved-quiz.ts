import { type Page } from "@playwright/test";
import {
  createSession,
  emptyProgress,
  selectSession,
  type LearningMode,
  type LearningTopicId,
} from "../../src/lib/learning";
import { getLearningCatalog } from "../../src/lib/learning-content";

export async function resumeSavedQuiz(
  page: Page,
  topicId: LearningTopicId,
  mode: LearningMode,
) {
  const progress = emptyProgress();
  const session = createSession(
    getLearningCatalog().questions,
    progress,
    mode,
    topicId,
    Date.now(),
  );
  if (!session) throw new Error("Missing saved quiz fixture");
  await page.goto("/ucenje");
  await page.evaluate(
    (saved) =>
      localStorage.setItem("pravo-na-dlanu.learning.v1", JSON.stringify(saved)),
    selectSession(progress, session),
  );
  await page.goto(`/ucenje?tema=${topicId}`);
}
