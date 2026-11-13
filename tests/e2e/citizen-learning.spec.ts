import { test, expect, type Page } from "@playwright/test";
import { getLearningCatalog } from "../../src/lib/learning-content";
import { learningTopics, type LearningTopicId } from "../../src/lib/learning";
import { readingTerms } from "../../src/lib/reading-guide";

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

test("home offers direct routes to new citizen topics and the reading guide", async ({
  page,
}) => {
  for (const id of ["ustav", "potrosaci"] as const) {
    const topic = learningTopics.find((candidate) => candidate.id === id)!;
    await page.goto("/");
    await page
      .locator(".citizen-topic-list")
      .getByRole("link", { name: topic.title })
      .click();
    await expect(page).toHaveURL(new RegExp(`/ucenje\\?tema=${id}$`));
    await expect(
      page.getByRole("heading", { name: topic.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Шта ћете научити" }),
    ).toBeVisible();
    await expect(
      page.locator(".learning-lessons article").first(),
    ).toBeVisible();
    await expectNoOverflow(page);
  }
  await page.goto("/");
  await page
    .locator(".citizen-help-links")
    .getByRole("link", { name: "Како читати закон" })
    .click();
  await expect(page).toHaveURL(/\/vodic$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoOverflow(page);
});

test("the reading glossary accepts all Serbian scripts and recovers from no matches", async ({
  page,
}) => {
  await page.goto("/vodic");
  await page.getByRole("link", { name: "Отвори мали речник" }).click();
  const search = page.getByRole("textbox", { name: "Пронађите појам" });
  for (const term of ["тачка", "tačka", "tacka"]) {
    await search.fill(term);
    await expect(page.locator("#recnik dt")).toHaveText(["Тачка"]);
    await expect(page.getByRole("status")).toContainText(
      `Приказано 1 од ${readingTerms.length}`,
    );
  }
  await search.fill("непостојећи-појам");
  await expect(page.locator("#recnik dt")).toHaveCount(0);
  const reset = page.getByRole("button", { name: "Прикажи све појмове" });
  await reset.focus();
  await reset.press("Enter");
  await expect(search).toHaveValue("");
  await expect(page.locator("#recnik dt")).toHaveCount(readingTerms.length);
  await expectNoOverflow(page);
  await page
    .getByRole("link", { name: "Устав о објављивању прописа — члан 196" })
    .click();
  await expect(page).toHaveURL(/\/propisi\/ustav-republike-srbije#clan-196$/);
  await expect(page.locator("#clan-196")).toBeInViewport();
  await expect(page.locator("#clan-1")).toHaveCount(1);
  await expect(page.locator("#clan-206")).toHaveCount(1);
});

test("the beginner guide and glossary remain readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/vodic");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Како да читате закон",
    );
    await expect(page.locator(".guide-steps > li")).toHaveCount(5);
    await expect(page.locator("#recnik dt")).toHaveCount(readingTerms.length);
    await expect(
      page.getByRole("heading", { name: "Извор за даље читање" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Устав о објављивању прописа — члан 196" })
      .click();
    await expect(page.locator("#clan-196")).toBeInViewport();
  } finally {
    await context.close();
  }
});

test("constitutional practice works with a keyboard and allows mistakes to be reviewed", async ({
  page,
  context,
}) => {
  await page.goto("/ucenje?tema=ustav");
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
  const first = await answerWithKeyboard(page, "ustav", false);
  const sourcePromise = context.waitForEvent("page");
  await page
    .getByRole("link", {
      name: `Прочитај члан ${first.source.article}`,
      exact: false,
    })
    .click();
  const source = await sourcePromise;
  await source.waitForLoadState();
  await expect(source).toHaveURL(
    new RegExp(`${first.source.lawHref}#clan-${first.source.article}$`),
  );
  await expect(source.getByRole("heading", { level: 1 })).toHaveText(
    first.source.title,
  );
  await expect(
    source.locator(`#clan-${first.source.article}`),
  ).toBeInViewport();
  await expect(source.locator("#clan-1")).toHaveCount(1);
  await expect(source.locator("#clan-206")).toHaveCount(1);
  await source.close();
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
  await page.goto("/ucenje?tema=potrosaci");
  await page.getByRole("tab", { name: "Шта ако…?", exact: true }).click();
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
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
  await expect(
    page.getByRole("link", {
      name: `Прочитај члан ${changed.source.article}`,
      exact: false,
    }),
  ).toHaveAttribute("href", changed.source.href);
  await expectNoOverflow(page);
});
