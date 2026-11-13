import { test, expect } from "@playwright/test";

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("everyday searches offer a relevant topic, source and recovery without clearing the query", async ({
  page,
}) => {
  await page.goto("/?q=godisnji+odmor");
  const topics = page.getByRole("region", { name: "Теме и објашњења" });
  await expect(
    topics.getByRole("link", { name: "Права на послу" }),
  ).toBeVisible();
  await expect(
    topics.getByRole("link", { name: /Извор: Закон о раду/ }),
  ).toHaveAttribute("href", /\/propisi\/zakon-o-radu/);
  await expect(page.locator(".law-list-row")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Претражи цео текст", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Претрага закона" }),
  ).toHaveValue("godisnji odmor");
  await expect(page.locator(".law-list-row").first()).toBeVisible();
  await expect(page.locator(".law-list-row mark").first()).toBeVisible();
  await expect(page.locator(".explorer-header")).toContainText(
    "по релевантности",
  );
  await page.getByRole("tab", { name: "Тачна фраза" }).click();
  await expect(page).toHaveURL(/mode=phrase/);
  await expect(page.locator(".law-list-row mark").first()).toContainText(
    /годишњи одмор/i,
  );
});

test("the default catalogue is a list and mobile topics and categories remain usable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("tab", { name: "Листа", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".react-flow")).toHaveCount(0);
  await expect(
    page
      .locator(".citizen-topic-list")
      .getByRole("link", { name: "Права на послу" }),
  ).toBeInViewport();
  if (page.viewportSize()!.width <= 800) {
    const category = page.getByRole("combobox", { name: "Правна област" });
    await category.click();
    await page.getByRole("option").nth(1).click();
    await expect(page).toHaveURL(/category=/);
    await page.reload();
    await expect(category).not.toContainText("Све области");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("law entry, source disclosure, text search and section navigation work together", async ({
  page,
}) => {
  await page.goto("/propisi/zakon-o-radu");
  const source = page.locator(".reader-source-details");
  await expect(source).not.toHaveAttribute("open", "");
  await expect(
    page.getByRole("link", { name: "Читај закон", exact: true }),
  ).toBeInViewport();
  await source.locator("summary").click();
  await expect(
    source.getByRole("link", { name: "Верзија извора" }),
  ).toHaveAttribute("href", "/vodic#pojam-verzija");
  await expect(source).toContainText(
    "Датум преузимања не представља правну потврду важења.",
  );
  await source.locator("summary").click();
  await page.getByRole("link", { name: "Читај закон", exact: true }).click();
  await expect(page.locator("#tekst-zakona")).toBeInViewport();
  const nav = page.getByRole("navigation", { name: "Садржај закона" });
  const contents = nav.getByRole("button", { name: /Садржај закона/ });
  if (await contents.isVisible()) await contents.click();
  const input = nav.getByRole("textbox", { name: "Иди на члан" });
  await input.fill("godisnji odmor");
  await expect(nav.getByRole("status")).toContainText("Пронађено чланова:");
  await input.press("Enter");
  await expect(page).toHaveURL(/#clan-/);
  await expect(page.locator(new URL(page.url()).hash)).toBeFocused();
  if (await contents.isVisible()) await contents.click();
  await input.fill("");
  await nav.getByRole("combobox", { name: "Одељак закона" }).click();
  await page.getByRole("option", { name: /^VIII\. ЗАРАДА/ }).click();
  await expect(page).toHaveURL(/#clan-104$/);
});

test("fullscreen map traps focus, hides decorative edges and restores its trigger", async ({
  page,
}) => {
  await page.goto("/?view=map");
  const trigger = page.getByRole("button", { name: "Цео екран", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Мапа правних области и закона",
  });
  await expect(dialog).toBeVisible();
  if (page.viewportSize()!.width <= 600) {
    await expect
      .poll(
        async () =>
          (await dialog.locator(".registry-node.root").boundingBox())?.width ??
          0,
      )
      .toBeGreaterThan(180);
  }
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox();
      return bounds && Math.abs(bounds.x) < 1 && Math.abs(bounds.y) < 1;
    })
    .toBe(true);
  await expect(
    dialog.getByRole("button", { name: "Смањи приказ" }),
  ).toBeFocused();
  for (let index = 0; index < 26; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await expect(dialog.locator(".react-flow__edge[tabindex='0']")).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("static navigation segments exist and topic practice starts near the title", async ({
  page,
  request,
}) => {
  const response = await request.get("/vodic/__next.vodic.__PAGE__.txt");
  expect(response.status()).toBe(200);
  await page.goto("/ucenje?tema=rad");
  const start = page.getByRole("button", {
    name: "Почни кратку вежбу",
    exact: true,
  });
  await expect(start).toBeInViewport();
  await start.click();
  await expect(page.locator("#question-title")).toBeFocused();
});
