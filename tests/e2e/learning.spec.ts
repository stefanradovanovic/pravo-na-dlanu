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
  await page
    .getByRole("link", { name: "Учи и провери знање", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ucenje$/);
  await expect(
    page
      .getByRole("navigation", { name: "Главна навигација" })
      .getByRole("link", { name: "Учи кроз примере" }),
  ).toBeVisible();
  const search = page.getByRole("textbox", { name: "Претрага тема за учење" });
  for (const term of ["годишњи одмор", "godišnji odmor", "godisnji odmor"]) {
    await search.fill(term);
    await expect(page.locator(".learning-topic-card")).toHaveCount(1);
    await expect(page.locator(".learning-topic-card")).toContainText(
      "Права на послу",
    );
  }
  await search.fill("ништа-не-постоји");
  await expect(page.getByText("Нема теме за", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Прикажи све теме" }).click();
  await expect(page.locator(".learning-topic-card")).toHaveCount(
    learningTopics.length,
  );
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

test("quiz confirms once, resumes after reload, links to the real article and reviews mistakes", async ({
  page,
  context,
}) => {
  await page.goto("/ucenje?tema=rad");
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Провери одговор", exact: true }),
  ).toBeDisabled();
  const first = await answer(page, false);
  const sourcePagePromise = context.waitForEvent("page");
  await page
    .getByRole("link", {
      name: `Прочитај члан ${first.source.article}`,
      exact: false,
    })
    .click();
  const sourcePage = await sourcePagePromise;
  await sourcePage.waitForLoadState();
  await expect(
    sourcePage.locator(`#clan-${first.source.article}`),
  ).toBeInViewport();
  await sourcePage.close();
  await page.reload();
  await page.getByRole("button", { name: "Настави сесију" }).click();
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
  await page.goto("/ucenje?tema=privatnost");
  await page.getByRole("tab", { name: "Шта ако…?", exact: true }).click();
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
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
  await page.getByRole("button", { name: "Сачувај и врати се" }).click();
  await page.getByRole("tab", { name: "Пронађи правило", exact: true }).click();
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
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
  await page.getByRole("button", { name: "Почни вежбу", exact: true }).click();
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

test("law readers lead into the matching learning path", async ({ page }) => {
  await page.goto("/propisi/zakon-o-radu");
  await page
    .locator(".reader-learning-link")
    .getByRole("link", { name: "Учи и провери знање", exact: false })
    .click();
  await expect(page).toHaveURL(/\/ucenje\?tema=rad$/);
  await expect(
    page.getByRole("heading", { name: "Права на послу", exact: true }),
  ).toBeVisible();
});
