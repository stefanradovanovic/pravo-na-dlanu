import { expect, test } from "@playwright/test";
import { themeStorageKey } from "../../src/lib/theme";

const lawPath = "/propisi/ustav-republike-srbije";
const lightPaper = "rgb(250, 249, 246)";
const darkPaper = "rgb(13, 13, 13)";

test("the saved theme overrides the device setting in the catalog and standalone reader", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  if (isMobile) await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Тамна тема" });
  const body = page.locator("body");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(body).toHaveCSS("background-color", lightPaper);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(body).toHaveCSS("background-color", darkPaper);

  await toggle.press("Space");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.goto(lawPath);
  await expect(body).toHaveCSS("background-color", lightPaper);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(body).toHaveCSS("background-color", darkPaper);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.locator("html").evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.emulateMedia({ media: "print" });
  await expect(body).toHaveCSS("background-color", lightPaper);
  await expect(body).toHaveCSS("color", "rgb(40, 40, 36)");
  await expect(toggle).toBeHidden();
});

test("the device theme works with JavaScript disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    colorScheme: "dark",
  });
  try {
    const page = await context.newPage();
    await page.goto(lawPath);
    await expect(page.locator("body")).toHaveCSS("background-color", darkPaper);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#site-theme-toggle button")).toBeHidden();
  } finally {
    await context.close();
  }
});

test("theme samples keep their own palette when the site theme changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/dizajn-sistem");
  const lightSample = page.locator('.ds-theme-sample[data-theme="light"]');
  const darkSample = page.locator('.ds-theme-sample[data-theme="dark"]');
  await expect(lightSample).toHaveCSS("background-color", lightPaper);
  await expect(darkSample).toHaveCSS("background-color", darkPaper);
  await page.getByRole("button", { name: "Тамна тема" }).click();
  await expect(page.locator("body")).toHaveCSS("background-color", lightPaper);
  await expect(darkSample).toHaveCSS("background-color", darkPaper);
});

test("a saved choice updates other tabs and applies before their scripts load", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  const reader = await context.newPage();
  await reader.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await reader.goto(lawPath);
  const readerToggle = reader.getByRole("button", { name: "Тамна тема" });
  await expect(readerToggle).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Тамна тема" }).click();
  await expect(readerToggle).toHaveAttribute("aria-pressed", "true");
  await reader.route("**/reader-assets/*.js", (route) => route.abort());
  await reader.reload();
  await expect(reader.locator("body")).toHaveCSS("background-color", darkPaper);
  await expect(reader.locator("#site-theme-toggle button")).toBeHidden();
  expect(
    await reader.evaluate((key) => localStorage.getItem(key), themeStorageKey),
  ).toBe("dark");
});
