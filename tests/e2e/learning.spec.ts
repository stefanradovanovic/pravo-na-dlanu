import { resumeSavedQuiz } from "./saved-quiz";
import { test, expect, type Page } from "@playwright/test";
import { getLearningCatalog } from "../../src/lib/learning-content";
import { learningTopics } from "../../src/lib/learning";
const questions = getLearningCatalog().questions;
const storageKey = "pravo-na-dlanu.learning.v1";

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

async function answer(page: Page, correct = true) {
  const title = await page.locator("#question-title").textContent();
  const q = questions.find((q) => q.title === title)!;
  const choice = q.choices.find(
    (c) => (c.id === q.correctChoiceId) === correct,
  )!;
  const option = page
    .getByRole("group", { name: "Понуђени одговори" })
    .getByRole("button")
    .filter({ hasText: choice.text });
  await option.click();
  await page
    .getByRole("button", { name: "Провери одговор", exact: true })
    .click();
  await expect(page.getByLabel("Објашњење одговора")).toBeVisible();
  return q;
}

test("homepage and mobile navigation expose learning; topic search accepts all Serbian scripts", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Мени", exact: true });
  if (await menu.isVisible()) await menu.click();
  const learningLink = page
    .getByRole("navigation", { name: "Главна навигација" })
    .getByRole("link", { name: /^(Учи кроз примере|Учење)$/ });
  await learningLink.click();
  await expect(page).toHaveURL(/\/ucenje$/);
  await expect(
    page.locator('a[aria-current="page"][href="/ucenje"]').first(),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", { level: 1, name: "Изаберите тему за квиз" }),
  ).toBeInViewport();
  const topics = page
    .getByRole("list", { name: "Теме за учење" })
    .getByRole("link");
  await expect(topics.first()).toBeInViewport();
  const search = page.getByRole("textbox", { name: "Претрага тема за учење" });
  for (const term of ["годишњи одмор", "godišnji odmor", "godisnji odmor"]) {
    await search.fill(term);
    await expect(topics).toHaveCount(1);
    await expect(topics).toHaveAccessibleName("Права на послу");
  }
  await search.fill("ништа-не-постоји");
  await expect(page.getByText("Нема теме за", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Прикажи све теме" }).click();
  await expect(topics).toHaveCount(learningTopics.length);
  await expect(page.locator("#vezba, .learning-editorial-note")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("learning-hub.png"),
    fullPage: true,
  });
});

test("each topic starts its quiz and resumes its own confirmed answer", async ({
  page,
}) => {
  await page.goto("/ucenje");
  const savedTitles = new Map<string, string>();
  for (const topic of learningTopics) {
    await page.getByRole("link", { name: topic.title, exact: true }).click();
    await expect(page.locator("#question-title")).toBeFocused();
    await expect(page.getByText("Друге вежбе", { exact: true })).toHaveCount(0);
    const question = await answer(page);
    expect(question.topicId).toBe(topic.id);
    savedTitles.set(topic.id, question.title);
    await page.goBack();
    await expect(
      page.getByRole("list", { name: "Теме за учење" }),
    ).toBeVisible();
  }
  await page.reload();
  for (const topic of learningTopics) {
    await page.getByRole("link", { name: topic.title, exact: true }).click();
    await expect(page.locator("#question-title")).toHaveText(
      savedTitles.get(topic.id)!,
    );
    await expect(page.getByLabel("Објашњење одговора")).toBeVisible();
    await page.getByRole("link", { name: "Сачувај и врати се" }).click();
  }
});

test("quiz confirms once, resumes after reload, links to the real article and reviews mistakes", async ({
  page,
}) => {
  await page.goto("/ucenje?tema=rad");
  await expect(
    page.getByRole("button", { name: "Провери одговор", exact: true }),
  ).toBeDisabled();
  const first = await answer(page, false);
  const article = page.getByRole("button", {
    name: `Прочитај члан ${first.source.article}`,
  });
  await article.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("iframe")).toHaveAttribute(
    "src",
    first.source.href,
  );
  await expect(
    dialog.frameLocator("iframe").locator(`#clan-${first.source.article}`),
  ).toBeInViewport();
  await dialog.getByRole("button", { name: "Затвори", exact: true }).click();
  await expect(article).toBeFocused();
  await page.reload();
  await expect(page.locator("#question-title")).toHaveText(first.title);
  await expect(page.getByLabel("Објашњење одговора")).toBeVisible();
  const attempts = await page.evaluate(
    ([key, id]) => JSON.parse(localStorage.getItem(key)!).answers[id].attempts,
    [storageKey, first.id],
  );
  expect(attempts).toBe(1);
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  for (let i = 1; i < 5; i++) {
    await answer(page);
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
  await page
    .locator(".learning-answer-review")
    .getByRole("button", {
      name: new RegExp(first.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
  await expect(page.locator(".learning-answer-review")).toContainText(
    first.choices.find((c) => c.id === first.correctChoiceId)!.explanation,
  );
  await page
    .getByRole("button", { name: "Понови питања која су била тешка" })
    .click();
  await expect(page.locator("#question-title")).toHaveText(first.title);
  await answer(page);
  await page.getByRole("button", { name: "Погледај резултат" }).click();
  await expect(page.locator(".learning-score")).toHaveText("1 / 1");
  await page
    .getByRole("button", { name: "Назад на теме", exact: true })
    .click();
  await page.getByRole("tab", { name: "Моје учење", exact: true }).click();
  await expect(page.locator(".learning-stats")).toContainText("5");
  await expect(
    page.getByRole("button", { name: "Понови питања за вежбање" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Обриши мој напредак" }).click();
  await page.getByRole("button", { name: "Одустани", exact: true }).click();
  await expect(page.locator(".learning-stats")).toContainText("5");
  await page.getByRole("button", { name: "Обриши мој напредак" }).click();
  await page
    .getByRole("button", { name: "Обриши напредак", exact: true })
    .click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBeNull();
  await expect(
    page.getByText("Ваш први корак почиње једном ситуацијом."),
  ).toBeVisible();
});

test("what-if pairs show the changed fact; research uses the real collection", async ({
  page,
}) => {
  await resumeSavedQuiz(page, "privatnost", "what-if");
  const base = await answer(page);
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  const variant = questions.find((q) => q.parentId === base.id)!;
  await expect(page.locator("#question-title")).toHaveText(variant.title);
  await expect(page.locator(".learning-change")).toContainText(variant.change!);
  await answer(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("learning-what-if.png"),
    fullPage: true,
  });
  await resumeSavedQuiz(page, "privatnost", "research");
  await expect(
    page.getByRole("link", { name: "Претражи збирку" }),
  ).toHaveAttribute("href", /q=/);
  await expect(
    page.getByRole("link", { name: "Отвори закон" }),
  ).toHaveAttribute("href", /^\/propisi\//);
  await page.getByText("Мала помоћ", { exact: true }).click();
  await expect(
    page.getByText("Потражите речи из питања.", { exact: false }),
  ).toBeVisible();
});

test("bad saved data and unavailable storage leave quizzes usable", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{broken"),
    storageKey,
  );
  await page.goto("/ucenje?tema=informacije");
  await answer(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Чување на уређају није доступно" }),
  ).toBeVisible();
  await answer(page);
  await page
    .getByRole("button", { name: "Следеће питање", exact: true })
    .click();
  await expect(page.locator(".learning-question")).toContainText(
    "ПИТАЊЕ 3 ОД 5",
  );
});

test("saved expert studies can be resumed and continued", async ({ page }) => {
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 844 });
  await resumeSavedQuiz(page, "privatnost", "expert");
  await expect(page.getByText("Измишљена студија случаја")).toBeVisible();
  const first = await answer(page);
  expect(first.kind).toBe("case-study");
  await expect(
    page.getByRole("button", { name: `Прочитај члан ${first.source.article}` }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("learning-expert-feedback.png"),
  });
  await page.reload();
  await expect(
    page.getByText("Измишљена студија случаја", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#question-title")).toHaveText(first.title);
  const answered = [first.id];
  for (let i = 1; i < 5; i++) {
    await page.getByRole("button", { name: "Следеће питање" }).click();
    const question = await answer(page);
    expect(question.kind).toBe("case-study");
    expect(question.topicId).toBe("privatnost");
    answered.push(question.id);
  }
  await page.getByRole("button", { name: "Погледај резултат" }).click();
  await expect(page.locator(".learning-score")).toHaveText("5 / 5");
  await page.getByRole("button", { name: "Следећа рунда" }).click();
  expect(answered).not.toContain((await answer(page)).id);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the three additional topics are discoverable and link answers to their own laws", async ({
  page,
}) => {
  const newTopics = [
    {
      topicId: "ravnopravnost",
      search: "diskriminacija",
      law: "zakon-o-zabrani-diskriminacije",
    },
    {
      topicId: "upravni-postupak",
      search: "upravni postupak",
      law: "zakon-o-opstem-upravnom-postupku",
    },
    { topicId: "porodica", search: "izdrzavanje", law: "porodicni-zakon" },
  ] as const;
  for (const { topicId, search, law } of newTopics) {
    await page.goto("/ucenje");
    await page
      .getByRole("textbox", { name: "Претрага тема за учење" })
      .fill(search);
    const topic = learningTopics.find((item) => item.id === topicId)!;
    await page.getByRole("link", { name: topic.title, exact: true }).click();
    await expect(page).toHaveURL("/ucenje?tema=" + topicId);
    const question = await answer(page);
    expect(question.topicId).toBe(topicId);
    expect(question.source.lawHref).toBe("/propisi/" + law);
    await page
      .getByRole("button", { name: `Прочитај члан ${question.source.article}` })
      .click();
    await expect(page.getByRole("dialog").locator("iframe")).toHaveAttribute(
      "src",
      question.source.href,
    );
  }
});

test("law readers lead into the matching learning path", async ({ page }) => {
  await page.goto("/propisi/zakon-o-radu");
  const examples = page.getByRole("button", { name: /Примери из живота/ });
  await expect(examples).toHaveAttribute("aria-expanded", "false");
  await examples.click();
  await expect(examples).toHaveAttribute("aria-expanded", "true");
  await page
    .locator(".reader-learning-link")
    .getByRole("link", { name: "Учи и провери знање", exact: false })
    .click();
  await expect(page).toHaveURL(/\/ucenje\?tema=rad$/);
  await expect(
    page.getByRole("heading", { name: "Права на послу", exact: true }),
  ).toBeVisible();
});
