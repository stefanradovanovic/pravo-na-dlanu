import { test, expect } from "@playwright/test";
test("legacy law links preserve query and article anchors on static hosting", async ({
  page,
}) => {
  await page.goto(
    "/propisi/0092c8ed-9252-4dcf-951e-c6488818f2b3?from=test#clan-12",
  );
  await expect(page).toHaveURL(/\/propisi\/[a-z][a-z-]+\?from=test#clan-12$/);
  await expect(page.locator("#clan-12")).toBeVisible();
  await page.reload();
  await expect(page.locator("#clan-12")).toBeVisible();
});
test("catalog links use the readable law title", async ({ page }) => {
  await page.goto("/?q=zakon+o+radu&view=list");
  const link = page
    .locator(".law-list-row")
    .getByRole("link", { name: "Закон о раду", exact: true });
  await expect(link).toHaveAttribute(
    "href",
    /^\/propisi\/zakon-o-radu(?:\?|$)/,
  );
  await link.click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-radu$/);
  await page.reload();
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(page).toHaveURL(/q=zakon\+o\+radu/);
});
