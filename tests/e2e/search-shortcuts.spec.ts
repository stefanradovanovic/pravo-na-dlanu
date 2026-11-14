import { test, expect } from "@playwright/test";

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
    await expect(page.locator(".citizen-start")).toBeVisible();
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
  test(`${label} shortcut resets full-text mode and filters, and survives reload`, async ({
    page,
  }) => {
    await page.goto(
      `/?view=list&mode=full&q=права&page=3&category=${encodeURIComponent("I   ДРЖАВНО УРЕЂЕЊЕ")}`,
    );
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
