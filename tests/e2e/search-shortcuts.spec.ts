import { test, expect } from "@playwright/test";

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
      page.getByRole("textbox", { name: "Претрага закона" }),
    ).toHaveValue(title);
    await expect(
      page.getByRole("tab", { name: "Назив закона" }),
    ).toHaveAttribute("aria-selected", "true");
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
      page.getByRole("textbox", { name: "Претрага закона" }),
    ).toHaveValue(title);
    await expect(page.locator(".law-list-row").first()).toContainText(title);
  });
}
