import { test, expect } from "@playwright/test";

test("law text and metadata are complete without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/propisi/ustav-republike-srbije");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Устав Републике Србије",
  );
  await expect(page.locator("#clan-1")).toHaveCount(1);
  await expect(page.locator("#clan-206")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "/propisi/ustav-republike-srbije",
  );
  await expect(page.locator(".source-banner")).toContainText(
    "Датум преузимања не представља правну потврду важења.",
  );
  await context.close();
});

test("catalog opens a standalone reader with working examples, copy and print", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource:")
    )
      errors.push(message.text());
  });
  // Reader documents and assets must all work on a generic static server.
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\/(propisi|zakoni|reader-assets|pdfjs)\//.test(response.url())
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?q=zakon+o+radu&view=list");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page
    .locator(".law-list-row")
    .getByRole("link", { name: "Закон о раду", exact: true })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-radu\?returnTo=/);
  await expect(page.locator(".current-article")).toBeVisible();
  expect(
    requests.some((url) =>
      /\/(?:propisi|zakoni)\/.*(?:\.txt(?:\?|$)|_rsc=)/.test(url),
    ),
  ).toBe(false);
  expect(await page.locator('script[src*="/_next/"]').count()).toBe(0);
  await page.getByRole("button", { name: /Примери из живота/ }).click();
  const example = page.locator(".example-card").first();
  await example.getByRole("button", { name: "Да, крши", exact: true }).click();
  await expect(example.getByRole("status")).toBeVisible();
  await example.getByRole("button", { name: "Покушај поново" }).click();
  await expect(example.getByRole("status")).toHaveCount(0);
  await example.locator(".example-source").click();
  expect(new URL(page.url()).hash).toMatch(/^#clan-/);
  await page.getByRole("button", { name: "Копирај линк" }).click();
  await expect(page.locator(".document-actions [role=status]")).toHaveText(
    "Линк је копиран",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "yes";
    };
  });
  await page.getByRole("button", { name: "Штампај" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "yes");
  expect(errors).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath("standalone-law.png"),
    fullPage: false,
  });
});

test("learning redirects preserve query and hash; unknown documents stay 404", async ({
  page,
}) => {
  await page.goto("/zakoni/ustav?from=test#clan-206");
  await expect(page).toHaveURL(
    /\/propisi\/ustav-republike-srbije\?from=test#clan-206$/,
  );
  await expect(page.locator("#clan-206")).toBeInViewport();
  const response = await page.goto("/propisi/nepostojeci-zakon");
  expect(response?.status()).toBe(404);
});
