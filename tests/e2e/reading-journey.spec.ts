import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("exact title search excludes unrelated laws and survives reload", async ({
  page,
}) => {
  await page.goto("/?q=zakon+o+radu&view=list");
  const rows = page.locator(".law-list-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.getByRole("heading")).toHaveText("Закон о раду");
  await page
    .getByRole("textbox", { name: "Претрага закона" })
    .fill("Закон о раду");
  await expect(rows).toHaveCount(1);
  await expect(rows.getByRole("heading")).toHaveText("Закон о раду");
  await page.reload();
  await expect(rows).toHaveCount(1);
  await page.getByRole("textbox", { name: "Претрага закона" }).fill("potrosac");
  await expect(rows.first().getByRole("heading")).toContainText(/потрошач/i);
  for (const title of await rows.getByRole("heading").allTextContents()) {
    expect(title.toLowerCase()).toContain("потрошач");
  }
});

test("full-text search opens a Cyrillic passage and returns to the same search", async ({
  page,
}) => {
  await page.goto("/?q=sanitarni+nadzor&mode=full&view=list");
  const row = page.locator(".law-list-row").filter({
    has: page.getByRole("heading", {
      name: "Закон о санитарном надзору",
      exact: true,
    }),
  });
  await expect(row.locator("mark")).toContainText(/санитарни надзор/i);
  await row.screenshot({ path: test.info().outputPath("search-result.png") });
  const context = row.getByRole("link", { name: "Прочитај у контексту" });
  const target = await context.getAttribute("href");
  expect(target).toMatch(/#clan-/);
  await context.click();
  await expect(page).toHaveURL(new RegExp(target!.split("#")[1] + "$"));
  const fragment = new URL(page.url()).hash;
  await expect(page.locator(fragment)).toBeInViewport();
  await page.goBack();
  await expect(row.locator("mark")).toBeVisible();
  await page.goForward();
  await expect(page.locator(fragment)).toBeInViewport();
  await page.reload();
  await expect(page.locator(fragment)).toBeInViewport();
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(
    page.getByRole("textbox", { name: "Претрага закона" }),
  ).toHaveValue("sanitarni nadzor");
  await expect(
    page.getByRole("tab", { name: "Цео текст", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(row.locator("mark")).toBeVisible();
});

test("article navigation and permalink work by keyboard", async ({ page }) => {
  await page.goto("/propisi/0092c8ed-9252-4dcf-951e-c6488818f2b3");
  const summary = page.getByRole("button", { name: /Садржај закона/ });
  if (await summary.isVisible()) {
    await summary.focus();
    await page.keyboard.press("Enter");
  }
  await page.getByRole("textbox", { name: "Иди на члан" }).fill("12");
  const link = page
    .getByRole("navigation", { name: "Садржај закона" })
    .getByRole("link", { name: "Члан 12.", exact: true });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#clan-12$/);
  await expect(page.locator("#clan-12")).toBeInViewport();
  await expect(link).toHaveAttribute("aria-current", "location");
  await expect(
    page.getByRole("link", { name: "Линк: Члан 12.", exact: true }),
  ).toHaveAttribute("href", "#clan-12");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("contents follow the current article while scrolling", async ({
  page,
}) => {
  await page.goto("/propisi/694cbad4-4727-4f93-b894-0b100b62c808#clan-104");
  const desktop = page.viewportSize()!.width >= 1024;
  if (!desktop) {
    await page.getByRole("button", { name: /Садржај закона/ }).click();
  }
  const navigation = page.getByRole("navigation", { name: "Садржај закона" });
  for (const number of [104, 105, 18]) {
    await page
      .locator(`#clan-${number}`)
      .evaluate((element) => element.scrollIntoView());
    const current = navigation.getByRole("link", {
      name: `Члан ${number}.`,
      exact: true,
    });
    await expect(current).toHaveAttribute("aria-current", "location");
    if (desktop) {
      await expect(current).toBeInViewport();
      await expect(navigation).toHaveCSS("position", "sticky");
    }
  }
});

test("query, category, view and pagination survive reload and history navigation", async ({
  page,
}) => {
  await page.goto("/?view=list&page=2");
  await expect(page.locator(".catalog-pagination")).toContainText("2 /");
  await page.getByRole("button", { name: "Следећа", exact: true }).click();
  await expect(page).toHaveURL(/page=3/);
  await page.reload();
  await expect(page.locator(".catalog-pagination")).toContainText("3 /");
  await page.goBack();
  await expect(page.locator(".catalog-pagination")).toContainText("2 /");
  await page.goForward();
  await expect(page.locator(".catalog-pagination")).toContainText("3 /");
  await page.locator(".category-link").first().click();
  expect(new URL(page.url()).searchParams.has("category")).toBe(true);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await page.reload();
  await expect(page.locator(".category-link.active")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Претрага закона" }).fill("ustav");
  await expect(page).toHaveURL(/q=ustav/);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Претрага закона" }),
  ).toHaveValue("ustav");
  await expect(
    page.getByRole("tab", { name: "Листа", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("snippet fetch failure keeps the whole law accessible", async ({
  page,
}) => {
  await page.route("**/pagefind/passages/**", (route) => route.abort());
  await page.goto("/?q=sanitarni+nadzor&mode=full&view=list");
  const row = page.locator(".law-list-row").filter({
    has: page.getByRole("heading", {
      name: "Закон о санитарном надзору",
      exact: true,
    }),
  });
  await expect(row).toContainText("Одломак није доступан");
  await row
    .getByRole("link", { name: "Закон о санитарном надзору", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Закон о санитарном надзору",
  );
});
