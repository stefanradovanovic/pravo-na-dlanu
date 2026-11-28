import { expect, test } from "@playwright/test";

test("main navigation links to all 300 dictionary entries and supports Serbian search", async ({
  page,
}) => {
  await page.goto("/ucenje");
  await expect(
    page.getByRole("main").getByRole("link", { name: /речник/i }),
  ).toHaveCount(0);
  const menu = page.getByRole("button", { name: "Мени", exact: true });
  if (await menu.isVisible()) await menu.click();
  const dictionary = page
    .getByRole("navigation", { name: "Главна навигација" })
    .getByRole("link", { name: "Речник", exact: true });
  await dictionary.click();
  await expect(
    page.locator('a[aria-current="page"][href="/ucenje/recnik"]').first(),
  ).toBeAttached();
  await expect(page).toHaveURL(/\/ucenje\/recnik\/?$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Речник" }),
  ).toBeVisible();
  await expect(page.locator(".glossary-entry")).toHaveCount(300);
  const search = page.getByRole("searchbox", { name: "Претражи речник" });

  for (const query of [
    "јавни извршитељ",
    "javni izvršitelj",
    "javni izvrsitelj",
  ]) {
    await search.fill(query);
    await expect(page.locator(".glossary-entry")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Јавни извршитељ" }),
    ).toBeVisible();
  }

  await search.fill("појам-који-не-постоји");
  await expect(
    page.getByText("Нема одредница", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Прикажи све одреднице" }).click();
  await expect(search).toBeFocused();
  await expect(page.locator(".glossary-entry")).toHaveCount(300);
});

test("dictionary topic filters, examples and source links fit on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/ucenje/recnik");
  const topics = page.getByRole("combobox", { name: "Тема" });
  await topics.press("Enter");
  await page.getByRole("option", { name: "Избори и учешће грађана" }).click();
  await expect(page.locator(".glossary-topic h2")).toHaveText([
    "Избори и учешће грађана",
  ]);

  const entry = page.getByRole("article", { name: "Излазност" });
  await expect(entry.getByText(/Број бирача који су гласали/)).toBeVisible();
  await entry.getByText("Пример и извори", { exact: true }).click();
  await expect(entry.getByText("Уреднички пример")).toBeVisible();
  await expect(entry.getByRole("link", { name: "ПИС" })).toHaveAttribute(
    "href",
    /^https:\/\/reg\.pravno-informacioni-sistem\.rs\//,
  );
  await expect(entry.getByRole("link", { name: /ЗИНП/ })).toHaveAttribute(
    "href",
    /^\/propisi\//,
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);

  await page.getByRole("button", { name: "Прикажи све одреднице" }).click();
  const search = page.getByRole("searchbox", { name: "Претражи речник" });
  await search.fill("Повереник за информације");
  await expect(page.locator(".glossary-entry")).toHaveCount(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all entries and their source disclosures are in the initial page", async ({
    page,
  }) => {
    await page.goto("/ucenje/recnik");
    await expect(page.locator(".glossary-entry")).toHaveCount(300);
    const entry = page.getByRole("article", { name: "Устав", exact: true });
    await entry.getByText("Извори", { exact: true }).click();
    const law = entry.getByRole("link", { name: /Устав, чл\./ });
    await expect(law).toBeVisible();
    await law.click();
    await expect(page).toHaveURL(/\/propisi\/ustav-republike-srbije\/?$/);
  });
});
