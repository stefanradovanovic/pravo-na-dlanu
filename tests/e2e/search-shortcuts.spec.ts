import { test, expect } from "@playwright/test";
import { getRegistry } from "../../src/lib/registry";

test("featured documents open their readers from the homepage", async ({
  page,
}) => {
  await page.goto("/");
  const shortcuts = page.getByRole("navigation", { name: "Издвојени прописи" });
  await expect(shortcuts.getByRole("link")).toHaveText([
    "Устав",
    "Пословник Народне скупштине",
    "Кривични законик",
  ]);
  for (const [label, title] of [
    ["Устав", "Устав Републике Србије"],
    ["Пословник Народне скупштине", "Пословник Народне скупштине"],
    ["Кривични законик", "Кривични законик"],
  ]) {
    await shortcuts.getByRole("link", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("#tekst-zakona")).toBeVisible();
    await page.goBack();
  }
});

test("catalog suggestions open the selected law and preserve the search", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Претрага закона" });
  for (const query of [
    "закон о заштити потрош",
    "zakon o zaštiti potroš",
    "zakon o zastiti potros",
  ]) {
    await search.fill(query);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("tab", { name: "Мапа" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("option", {
        name: "Закон о заштити потрошача",
        exact: true,
      }),
    ).toBeVisible();
    await search.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(search).toHaveValue(query);
  }
  await search.fill("zakon o zastiti potrosa");
  await expect(
    page.getByRole("option", {
      name: "Закон о заштити потрошача",
      exact: true,
    }),
  ).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/propisi\/zakon-o-zastiti-potrosaca/);
  await expect(page.locator("#tekst-zakona")).toBeVisible();
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(search).toHaveValue("zakon o zastiti potrosa");
});

for (const [query, title] of [
  ["Rad", "Закон о раду"],
  ["saobracaj", "Закон о безбедности саобраћаја на путевима"],
  ["saobra", "Закон о безбедности саобраћаја на путевима"],
  ["годишњи одмор", "Закон о раду"],
  ["zaštita podataka", "Закон о заштити података о личности"],
]) {
  test(`${query} suggests its main law in both search modes`, async ({
    page,
  }) => {
    await page.goto("/");
    const search = page.getByRole("combobox", { name: "Претрага закона" });
    const first = page.getByRole("option").first();
    await search.fill(query);
    await expect(first).toHaveText(title);

    await page.getByRole("tab", { name: "Детаљна претрага" }).click();
    await search.focus();
    await expect(first.getByText(title, { exact: true })).toBeVisible();
    await expect(first.locator("mark")).toBeVisible();
    await search.press("Escape");
    await search.press("Enter");
    await expect(page.locator(".law-list-row h3").first()).toHaveText(title);
  });
}

test("sticky header suggestions open a law from the standalone reader", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/propisi/ustav-republike-srbije");
  const search = page.getByRole("combobox", { name: "Претрага из заглавља" });
  await search.fill("zakon o zastiti potros");
  await page
    .getByRole("option", { name: "Закон о заштити потрошача", exact: true })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-zastiti-potrosaca$/);
  await expect(page.locator("#tekst-zakona")).toBeVisible();
});

test("the wider header search keeps abbreviated titles in its suggestions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Претрага из заглавља" });
  for (const query of ["zakon o bezb", "zakon o bezb s", "zak o bezb sao"]) {
    await input.fill(query);
    await expect(
      page
        .getByRole("option", {
          name: "Закон о безбедности саобраћаја на путевима",
          exact: true,
        })
        .first(),
    ).toBeVisible();
  }
  const field = (await input.boundingBox())!;
  const popup = (await page.locator(".ui-autocomplete-content").boundingBox())!;
  expect(field.width).toBeGreaterThan(340);
  expect(popup.width).toBeGreaterThanOrEqual(field.width - 1);

  await page.setViewportSize({ width: 900, height: 900 });
  await input.fill("saobra");
  await expect(page.getByRole("option").first()).toHaveText(
    "Закон о безбедности саобраћаја на путевима",
  );
  const narrowPopup = (await page
    .locator(".header-search-suggestions")
    .boundingBox())!;
  expect(narrowPopup.width).toBeGreaterThan(350);
  expect(narrowPopup.x).toBeGreaterThanOrEqual(0);
  expect(narrowPopup.x + narrowPopup.width).toBeLessThanOrEqual(901);
});

test("detailed search suggests matching passages and opens their articles", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Детаљна претрага" }).click();
  const search = page.getByRole("combobox", { name: "Претрага закона" });
  await expect(search).toHaveAttribute(
    "placeholder",
    /фраза из текста прописа/,
  );

  const examples = page.locator(".suggestions");
  await expect(examples.getByRole("button")).toHaveText([
    "Пробни рад",
    "Право на жалбу",
    "Уговор на даљину",
  ]);

  const options = page.getByRole("option");
  await search.fill("ugovor na dalj");
  await expect(options.first().locator("mark")).toContainText(/уговор на даљ/i);
  await search.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);

  await search.fill("уговор на даљи");
  const option = options.first();
  await expect(option.locator("mark")).toContainText(/уговор на даљи/i);
  const href = await option.getAttribute("href");
  expect(href).toMatch(/#clan-/);
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(new RegExp(href!.split("#")[1] + "$"));
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(search).toHaveValue(/уговор на даљину/i);
  await expect(
    page.getByRole("tab", { name: "Детаљна претрага" }),
  ).toHaveAttribute("aria-selected", "true");

  await examples.getByRole("button", { name: "Пробни рад" }).click();
  await expect(search).toHaveValue("Пробни рад");
  await expect(
    page.locator(".law-list-row .search-snippet mark").first(),
  ).toContainText(/пробни рад/i);
});

test("detailed suggestions respect the selected category", async ({ page }) => {
  const { records } = getRegistry();
  const category = records
    .flatMap((record) => record.categories)
    .find((name) => /^III\s+/.test(name))!;
  await page.goto(`/?mode=full&category=${encodeURIComponent(category)}`);
  await expect(
    page.getByRole("tab", { name: "Детаљна претрага" }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("combobox", { name: "Претрага закона" })
    .fill("pravo na žalb");
  const options = page.getByRole("option");
  await expect(options.first().locator("mark")).toContainText(/право на жалб/i);
  const titles = records
    .filter((record) => record.categories.includes(category))
    .map((record) => record.title);
  for (const title of await options.locator(".font-medium").allTextContents()) {
    expect(titles).toContain(title);
  }
});

test("work shortcut selects the labor law instead of unrelated prefix matches", async ({
  page,
}) => {
  await page.goto("/?view=list");
  await page
    .locator(".suggestions")
    .getByRole("button", { name: "Рад", exact: true })
    .click();
  await expect(page.locator(".law-list-row")).toHaveCount(1);
  await expect(page.locator(".law-list-row")).toContainText("Закон о раду");
});

for (const [label, title] of [
  ["Рад", "Закон о раду"],
  ["Саобраћај", "Закон о безбедности саобраћаја на путевима"],
  ["Потрошач", "Закон о заштити потрошача"],
]) {
  test(`${label} title shortcut resets filters and survives reload`, async ({
    page,
  }) => {
    await page.goto(
      `/?view=list&mode=full&q=права&page=3&category=${encodeURIComponent("I   ДРЖАВНО УРЕЂЕЊЕ")}`,
    );
    await page.getByRole("tab", { name: "Прописи" }).click();
    await page
      .locator(".suggestions")
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(
      page.getByRole("combobox", { name: "Претрага закона" }),
    ).toHaveValue(title);
    await expect(page.getByRole("tab", { name: "Прописи" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect
      .poll(async () => {
        const titles = await page
          .locator(".law-list-row h3 a")
          .allTextContents();
        return titles.length > 0 && titles.every((value) => value === title);
      })
      .toBe(true);
    const url = new URL(page.url());
    for (const key of ["mode", "category", "page"])
      expect(url.searchParams.has(key)).toBe(false);
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Претрага закона" }),
    ).toHaveValue(title);
    await expect(page.locator(".law-list-row").first()).toContainText(title);
  });
}
