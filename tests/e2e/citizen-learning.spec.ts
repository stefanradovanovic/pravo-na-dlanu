import { resumeSavedQuiz } from "./saved-quiz";
import { test, expect, type Page } from "@playwright/test";
import { getLearningCatalog } from "../../src/lib/learning-content";
import type { LearningTopicId } from "../../src/lib/learning";

const questions = getLearningCatalog().questions;

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function answerWithKeyboard(
  page: Page,
  topicId: LearningTopicId,
  correct = true,
) {
  const title = page.locator("#question-title");
  await expect(title).toBeFocused();
  const titleText = await title.textContent();
  const question = questions.find(
    (q) => q.topicId === topicId && q.title === titleText,
  )!;
  const choice = question.choices.find(
    (candidate) => (candidate.id === question.correctChoiceId) === correct,
  )!;
  const button = page
    .getByRole("group", { name: "Понуђени одговори" })
    .getByRole("button")
    .filter({ hasText: choice.text });
  await button.focus();
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  const confirm = page.getByRole("button", {
    name: "Провери одговор",
    exact: true,
  });
  await confirm.focus();
  await confirm.press("Enter");
  await expect(page.getByLabel("Објашњење одговора")).toBeFocused();
  await expect(page.getByLabel("Објашњење одговора")).toContainText(
    choice.explanation,
  );
  return question;
}

test("only the answered question exposes its related lesson", async ({
  page,
}) => {
  const catalog = getLearningCatalog();
  for (const id of ["ustav", "potrosaci"] as const) {
    await page.goto(`/ucenje?tema=${id}`);
    await expect(page.locator("#question-title")).toBeFocused();
    const lesson = page.locator(".learning-answer-lesson");
    await expect(lesson).toHaveCount(0);
    const question = await answerWithKeyboard(page, id);
    await lesson.locator("summary").click();
    await expect(lesson.locator("p")).toHaveText(
      catalog.lessons.find((l) => l.source.href === question.source.href)!.text,
    );
    await page.getByRole("button", { name: "Следеће питање" }).click();
    await expect(lesson).toHaveCount(0);
    await expectNoOverflow(page);
  }
});

test("constitutional practice works with a keyboard and allows mistakes to be reviewed", async ({
  page,
}) => {
  await page.goto("/ucenje?tema=ustav");
  const first = await answerWithKeyboard(page, "ustav", false);
  const trigger = page.getByRole("button", {
    name: `Прочитај члан ${first.source.article}`,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const frame = dialog.frameLocator("iframe");
  const heading = frame.locator(`#clan-${first.source.article}`);
  await expect(heading).toBeInViewport();
  await heading.focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  for (let i = 1; i < 5; i++) {
    await answerWithKeyboard(page, "ustav");
    await page
      .getByRole("button", {
        name: i === 4 ? "Погледај резултат" : "Следеће питање",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Сесија је завршена." }),
  ).toBeFocused();
  await expect(page.locator(".learning-score")).toHaveText("4 / 5");
  await expectNoOverflow(page);
  await page
    .getByRole("button", { name: "Понови питања која су била тешка" })
    .click();
  await expect(page.locator("#question-title")).toHaveText(first.title);
  await answerWithKeyboard(page, "ustav");
  await page
    .getByRole("button", { name: "Погледај резултат", exact: true })
    .click();
  await expect(page.locator(".learning-score")).toHaveText("1 / 1");
});

test("consumer what-if practice explains how a changed fact changes the rule", async ({
  page,
}) => {
  await resumeSavedQuiz(page, "potrosaci", "what-if");
  const original = await answerWithKeyboard(page, "potrosaci");
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  const changed = questions.find((q) => q.parentId === original.id)!;
  await expect(page.locator("#question-title")).toHaveText(changed.title);
  await expect(page.locator(".learning-change")).toContainText(changed.change!);
  await page
    .getByText("Подсети се првобитне ситуације", { exact: true })
    .click();
  await expect(page.locator(".learning-change details")).toContainText(
    original.scenario,
  );
  // Opening the reminder moves focus; return to the current question before the keyboard exercise.
  await page.locator("#question-title").focus();
  await answerWithKeyboard(page, "potrosaci");
  await page
    .getByRole("button", { name: `Прочитај члан ${changed.source.article}` })
    .click();
  await expect(page.getByRole("dialog").locator("iframe")).toHaveAttribute(
    "src",
    changed.source.href,
  );
  await page.getByRole("button", { name: "Затвори", exact: true }).click();
  await expectNoOverflow(page);
});
