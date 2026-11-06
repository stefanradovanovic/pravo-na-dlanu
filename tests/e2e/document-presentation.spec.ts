import { test, expect } from "@playwright/test";

test("article captions sit beside their article number at the reader font size", async ({
  page,
}) => {
  await page.goto("/propisi/ustav-republike-srbije#clan-2");
  const heading = page.locator("#clan-2");
  await expect(heading).toContainText("Члан 2. — Носиоци суверености");
  await expect(heading.locator(".article-subtitle")).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(heading.locator(".article-subtitle")).toHaveCSS(
    "font-weight",
    "400",
  );
  await expect(page.locator("#clan-3")).toContainText(
    "Члан 3. — Владавина права",
  );
  await expect(
    page
      .locator("#tekst-zakona > p")
      .filter({ hasText: /^Носиоци суверености$/ }),
  ).toHaveCount(0);
  await expect(heading).toBeInViewport();
});

test("law title is unified and article navigation still reaches the text", async ({
  page,
}) => {
  await page.goto(
    "/propisi/zakon-o-vodama-54547db1-244d-4570-a6a5-3a9a56470dfd",
  );
  const text = page.locator("#tekst-zakona");
  await expect(
    text.getByRole("heading", { name: "ЗАКОН о водама", exact: true }),
  ).toHaveCount(1);
  await expect(text.locator("p").filter({ hasText: /^ЗАКОН$/ })).toHaveCount(0);
  await expect(text).toContainText("Редакцијски пречишћен текст");
  await expect(text).toContainText("30 од 7. маја 2010");
  await page.goto(
    "/propisi/zakon-o-vodama-54547db1-244d-4570-a6a5-3a9a56470dfd#clan-1",
  );
  await expect(page.locator("#clan-1")).toBeInViewport();
});
