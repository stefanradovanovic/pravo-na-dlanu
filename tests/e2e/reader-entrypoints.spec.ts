import { test, expect } from "@playwright/test";

test("map opens a standalone document and returns to its category", async ({
  page,
}) => {
  await page.goto("/?view=map");
  await page.locator(".registry-node.category").first().click();
  const categoryUrl = page.url();
  await page.locator(".registry-node.law").first().click();
  await expect(page).toHaveURL(/\/propisi\//);
  await expect(page.locator("[data-reader-control]").first()).toBeAttached();
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(page).toHaveURL(categoryUrl);
});

test("standalone facsimile renders its PDF and preserves zoom and download", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/propisi/1df8926b-40ee-49bf-920d-aa56adf7b21c");
  const canvas = page.locator("#scan-page-1 canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("width", /^[1-9]\d+$/);
  await expect(page.locator("#scan-page-1 [role=status]")).toHaveCount(0);
  await expect(page.locator(".scan-reader [role=alert]")).toHaveCount(0);
  await page.getByRole("button", { name: "Увећај приказ" }).click();
  await expect(page.locator(".scan-pages")).toHaveClass(/is-zoomed/);
  await page.getByRole("button", { name: "Уклопи у ширину" }).click();
  await expect(page.locator(".scan-pages")).not.toHaveClass(/is-zoomed/);
  await page.locator(".scan-downloads summary").click();
  const url = await page
    .getByRole("link", { name: "Преузми скен" })
    .getAttribute("href");
  expect((await page.request.get(url!)).status()).toBe(200);
  expect(errors).toEqual([]);
});
