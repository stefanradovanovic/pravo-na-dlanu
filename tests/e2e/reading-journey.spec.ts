import { test, expect } from "@playwright/test";
import { getRegistry } from "../../src/lib/registry";
import { formatDocumentCount } from "../../src/lib/registry-types";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("law list rows show the title with icons aligned to its first line", async ({
  page,
}) => {
  await page.goto("/?view=list");
  const row = page.locator(".law-list-row").first();
  const title = row.getByRole("heading");
  await expect(title.getByRole("link")).toBeVisible();
  await expect(row).toHaveText((await title.textContent()) ?? "");
  const { y, lineHeight } = await title.evaluate((element) => ({
    y: element.getBoundingClientRect().y,
    lineHeight: parseFloat(getComputedStyle(element).lineHeight),
  }));
  const icons = await row.locator(":scope > svg").all();
  expect(icons).toHaveLength(2);
  for (const icon of icons) {
    const bounds = (await icon.boundingBox())!;
    expect(bounds.y + bounds.height / 2).toBeCloseTo(y + lineHeight / 2, 0);
  }
});

test("exact title search excludes unrelated laws and survives reload", async ({
  page,
}) => {
  await page.goto("/?q=zakon+o+radu&view=list");
  const rows = page.locator(".law-list-row");
  await expect(rows).toHaveCount(1);
  await expect(
    page.getByRole("status").filter({ hasText: "1 документ" }),
  ).toHaveText("1 документ");
  await expect(rows.getByRole("heading")).toHaveText("Закон о раду");
  await page
    .getByRole("combobox", { name: "Претрага закона" })
    .fill("Закон о раду");
  await expect(rows).toHaveCount(1);
  await expect(rows.getByRole("heading")).toHaveText("Закон о раду");
  await page.reload();
  await expect(rows).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Претрага закона" })
    .fill("potrosac");
  await page.getByRole("combobox", { name: "Претрага закона" }).press("Enter");
  await expect(rows.first().getByRole("heading")).toContainText(/потрошач/i);
  for (const title of await rows.getByRole("heading").allTextContents()) {
    expect(title.toLowerCase()).toContain("потрошач");
  }
});

test("full-text search opens a Cyrillic passage and returns to the same search", async ({
  page,
}) => {
  await page.goto("/?q=sanitarni+nadzor&mode=full&view=list");
  const row = page.locator(".law-list-row").filter({
    has: page.getByRole("heading", {
      name: "Закон о санитарном надзору",
      exact: true,
    }),
  });
  await expect(row.locator("mark")).toContainText(/санитарни надзор/i);
  await row.screenshot({ path: test.info().outputPath("search-result.png") });
  const context = row.getByRole("link", { name: "Прочитај у контексту" });
  const target = await context.getAttribute("href");
  expect(target).toMatch(/#clan-/);
  await context.click();
  await expect(page).toHaveURL(new RegExp(target!.split("#")[1] + "$"));
  const fragment = new URL(page.url()).hash;
  await expect(page.locator(fragment)).toBeInViewport();
  await page.goBack();
  await expect(row.locator("mark")).toBeVisible();
  await page.goForward();
  await expect(page.locator(fragment)).toBeInViewport();
  await page.reload();
  await expect(page.locator(fragment)).toBeInViewport();
  await page.getByRole("link", { name: "Назад на резултате" }).click();
  await expect(
    page.getByRole("combobox", { name: "Претрага закона" }),
  ).toHaveValue("sanitarni nadzor");
  await expect(
    page.getByRole("tab", { name: "Детаљна претрага", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(row.locator("mark")).toBeVisible();
});

test("article navigation and permalink work by keyboard", async ({ page }) => {
  await page.goto("/propisi/zakon-o-sanitarnom-nadzoru");
  const summary = page.getByRole("button", { name: /Садржај закона/ });
  if (await summary.isVisible()) {
    await summary.focus();
    await page.keyboard.press("Enter");
  }
  await page.getByRole("textbox", { name: "Иди на члан" }).fill("12");
  const link = page
    .getByRole("navigation", { name: "Садржај закона" })
    .getByRole("link", { name: "Члан 12.", exact: true });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#clan-12$/);
  await expect(page.locator("#clan-12")).toBeInViewport();
  await expect(
    page.getByRole("link", { name: "Линк: Члан 12.", exact: true }),
  ).toHaveAttribute("href", "#clan-12");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("reader controls follow scrolling, jump by keyboard and keep headings visible", async ({
  page,
}) => {
  await page.goto("/propisi/zakon-o-sanitarnom-nadzoru");
  const nav = page.getByRole("navigation", { name: "Садржај закона" });
  const contents = nav.getByRole("button", { name: /Садржај закона/ });
  if (await contents.isVisible()) await contents.click();
  const input = nav.getByRole("textbox", { name: "Иди на члан" });
  await input.fill("9999");
  await expect(nav.getByRole("status")).toHaveText("Нема члана са тим бројем.");
  await input.fill("clan 12");
  await input.press("Enter");
  await expect(page).toHaveURL(/#clan-12$/);
  if (await contents.isVisible())
    await expect(contents).toHaveAttribute("aria-expanded", "false");
  await expect(nav.locator(".current-article")).toHaveText("Члан 12.");
  await expect(page.locator("#clan-12")).toBeFocused();
  await expect
    .poll(async () => {
      const heading = await page.locator("#clan-12").boundingBox();
      const panel = await nav.boundingBox();
      return page.viewportSize()!.width >= 1024
        ? heading!.y >= 0
        : heading!.y >= panel!.y + panel!.height;
    })
    .toBe(true);
  await nav.getByRole("link", { name: "Следећи члан", exact: true }).click();
  await expect(page).toHaveURL(/#clan-13$/);
  await expect(nav.locator(".current-article")).toHaveText("Члан 13.");
  await page.goBack();
  await expect(page).toHaveURL(/#clan-12$/);
  await expect(nav.locator(".current-article")).toHaveText("Члан 12.");
  await page.reload();
  await expect(nav.locator(".current-article")).toHaveText("Члан 12.");
  // Native scrolling must update the current article without rewriting the URL.
  await page
    .locator("#clan-20")
    .evaluate((element) => element.scrollIntoView());
  await expect(nav.locator(".current-article")).toHaveText("Члан 20.");
  await expect(page).toHaveURL(/#clan-12$/);
  await expect(nav).toBeInViewport();
  if (await contents.isVisible()) await contents.click();
  await input.fill("1");
  await input.press("Enter");
  await expect(
    nav.getByRole("button", { name: "Претходни члан", exact: true }),
  ).toBeDisabled();
  if (await contents.isVisible()) await contents.click();
  await input.fill("41");
  await input.press("Enter");
  await expect(
    nav.getByRole("button", { name: "Следећи члан", exact: true }),
  ).toBeDisabled();
  await nav.getByRole("link", { name: "Претходни члан", exact: true }).click();
  await expect(nav.locator(".current-article")).toHaveText("Члан 40.");
  await page.goBack();
  await expect(nav.locator(".current-article")).toHaveText("Члан 41.");
});

test("reader text size is bounded, resettable and does not change the source", async ({
  page,
}) => {
  await page.goto("/propisi/zakon-o-sanitarnom-nadzoru#clan-12");
  const article = page.locator("#tekst-zakona");
  const source = await article.textContent();
  await expect(article).toHaveCSS("line-height", "29px");
  const larger = page.getByRole("button", { name: "Увећај текст" });
  await expect(article).toHaveCSS("font-size", "18px");
  for (let step = 0; step < 3; step++) await larger.click();
  await expect(article).toHaveCSS("font-size", "24px");
  await expect(article).toHaveCSS("line-height", "38.6667px");
  await expect(larger).toBeDisabled();
  const smaller = page.getByRole("button", { name: "Смањи текст" });
  for (let step = 0; step < 4; step++) await smaller.click();
  await expect(article).toHaveCSS("font-size", "16px");
  await expect(article).toHaveCSS("line-height", "25.7778px");
  await expect(smaller).toBeDisabled();
  await larger.click();
  await expect(article).toHaveCSS("font-size", "18px");
  await page
    .getByRole("button", { name: "Врати подразумевану величину текста" })
    .click();
  await expect(article).toHaveCSS("font-size", "18px");
  expect(await article.textContent()).toBe(source);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".article-navigation")).toBeHidden();
  await expect(article).toHaveCSS("font-size", "16px");
});

test("query, category, view and pagination survive reload and history navigation", async ({
  page,
}) => {
  await page.goto("/?view=list&page=2");
  await expect(page.locator(".catalog-pagination")).toContainText("2 /");
  await page.getByRole("button", { name: "Следећа", exact: true }).click();
  await expect(page).toHaveURL(/page=3/);
  await page.reload();
  await expect(page.locator(".catalog-pagination")).toContainText("3 /");
  await page.goBack();
  await expect(page.locator(".catalog-pagination")).toContainText("2 /");
  await page.goForward();
  await expect(page.locator(".catalog-pagination")).toContainText("3 /");
  const categoryFilter = page.getByRole("combobox", { name: "Правна област" });
  await categoryFilter.click();
  await page
    .getByRole("option", { name: "Државно уређење", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.has("category")).toBe(true);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await page.reload();
  await expect(categoryFilter).toContainText("Државно уређење");
  await page.getByRole("combobox", { name: "Претрага закона" }).fill("ustav");
  await page.getByRole("combobox", { name: "Претрага закона" }).press("Enter");
  await expect(page).toHaveURL(/q=ustav/);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Претрага закона" }),
  ).toHaveValue("ustav");
  await expect(
    page.getByRole("tab", { name: "Листа", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("the full-width catalog map fits every category document without paging", async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  const explorer = page.getByRole("region", { name: "Истраживач закона" });
  const map = explorer.locator(".map-shell");
  const canvas = map.locator(".registry-canvas");
  const header = map.locator(".map-labels");
  const controls = header.getByRole("group", { name: "Контроле мапе" });
  const controlOffset = () =>
    controls.evaluate((element) => {
      const group = element.getBoundingClientRect();
      const heading = element.parentElement!.getBoundingClientRect();
      return Math.abs(
        group.x + group.width / 2 - heading.x - heading.width / 2,
      );
    });
  const zoomIn = map.getByRole("button", { name: "Увећај мапу" });
  const zoomOut = map.getByRole("button", { name: "Умањи мапу" });
  const fullscreen = map.getByRole("button", { name: "Цео екран" });
  const { records } = getRegistry();
  const categories = records.flatMap((record) => record.categories);
  const stateStructure = categories.find((name) => /^I\s+/.test(name))!;
  const finance = categories.find((name) => /^V\s+/.test(name))!;
  const count = (category: string) =>
    records.filter((record) => record.categories.includes(category)).length;
  const allCardsFit = () =>
    canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return [...element.querySelectorAll(".registry-node.law")].every(
        (card) => {
          const rect = card.getBoundingClientRect();
          return (
            rect.left >= bounds.left &&
            rect.top >= bounds.top &&
            rect.right <= bounds.right &&
            rect.bottom <= bounds.bottom
          );
        },
      );
    });
  const stateStructureCard = map.getByRole("button", {
    name: /Државно уређење/,
  });
  const viewport = map.locator(".react-flow__viewport");
  const zoom = () =>
    viewport.evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
    );

  await expect(map).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Не морате да знате назив закона." }),
  ).toHaveCount(0);
  const box = (await map.boundingBox())!;
  expect(box.width).toBeGreaterThan(page.viewportSize()!.width - 65);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    page.viewportSize()!.width,
  );
  await expect(header.getByRole("button")).toHaveCount(3);
  await expect(header).toHaveCSS("background-color", /^rgb\(/);
  await expect(header.getByText("ИСТРАЖИТЕ ОБЛАСТ")).toHaveCount(0);
  await expect.poll(controlOffset).toBeLessThan(1);
  await expect(stateStructureCard).toHaveAccessibleName(
    `Државно уређење ${formatDocumentCount(count(stateStructure))}`,
  );
  const iconOffsets = await stateStructureCard.evaluate((card) => {
    const titleTop = card.querySelector("strong")!.getBoundingClientRect().top;
    return [...card.querySelectorAll(":scope > .node-icon, :scope > svg")].map(
      (icon) => icon.getBoundingClientRect().top - titleTop,
    );
  });
  expect(iconOffsets).toHaveLength(2);
  expect(
    iconOffsets.every((offset) =>
      isMobile ? offset < 0 : Math.abs(offset) < 1,
    ),
  ).toBe(true);
  await expect(
    map.getByRole("button", { name: "Прикажи целу мапу" }),
  ).toHaveCount(0);

  const initialZoom = await zoom();
  if (!isMobile) {
    await canvas.hover();
    const scrollPosition = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 180);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(scrollPosition);
    expect(await zoom()).toBeCloseTo(initialZoom);
  }
  for (const control of [zoomIn, zoomOut, fullscreen]) {
    await expect(control).toHaveCSS("height", isMobile ? "44px" : "36px");
  }
  await zoomOut.click();
  await expect.poll(zoom).toBeLessThan(initialZoom);
  await zoomIn.focus();
  await zoomIn.press("Enter");
  await expect.poll(zoom).toBeCloseTo(initialZoom);

  await fullscreen.click();
  await expect(fullscreen).toHaveAttribute("aria-pressed", "true");
  const expanded = (await map.boundingBox())!;
  expect(expanded).toMatchObject({ x: 0, y: 0, ...page.viewportSize() });
  await page.keyboard.press("Escape");
  await expect(fullscreen).toHaveAttribute("aria-pressed", "false");
  await expect(fullscreen).toBeFocused();

  await stateStructureCard.click();
  await expect.poll(controlOffset).toBeLessThan(1);
  await expect(map.locator(".registry-node.law")).toHaveCount(
    count(stateStructure),
  );
  await expect.poll(allCardsFit).toBe(true);
  await expect(map.locator(".catalog-pagination")).toHaveCount(0);
  await map.getByRole("button", { name: "Назад на области" }).click();
  await expect(stateStructureCard).toBeVisible();

  await page.goto(`/?category=${encodeURIComponent(finance)}&page=2`);
  await expect(map.locator(".registry-node.law")).toHaveCount(count(finance));
  await expect.poll(allCardsFit).toBe(true);
  await fullscreen.click();
  await expect(fullscreen).toHaveAttribute("aria-pressed", "true");
  await expect.poll(allCardsFit).toBe(true);
  await expect.poll(controlOffset).toBeLessThan(1);
});

test("snippet fetch failure keeps the whole law accessible", async ({
  page,
}) => {
  await page.route("**/pagefind/passages/**", (route) => route.abort());
  await page.goto("/?q=sanitarni+nadzor&mode=full&view=list");
  const row = page.locator(".law-list-row").filter({
    has: page.getByRole("heading", {
      name: "Закон о санитарном надзору",
      exact: true,
    }),
  });
  await expect(row).toContainText("Одломак није доступан");
  await row
    .getByRole("link", { name: "Закон о санитарном надзору", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Закон о санитарном надзору",
  );
});

test("contents follow the current article while scrolling", async ({
  page,
}) => {
  await page.goto("/propisi/zakon-o-radu#clan-104");
  const desktop = page.viewportSize()!.width >= 1024;
  if (!desktop) {
    await page.getByRole("button", { name: /Садржај закона/ }).click();
  }
  const navigation = page.getByRole("navigation", { name: "Садржај закона" });
  for (const number of [104, 105, 18]) {
    await page
      .locator(`#clan-${number}`)
      .evaluate((element) => element.scrollIntoView());
    const current = navigation.getByRole("link", {
      name: `Члан ${number}.`,
      exact: true,
    });
    await expect(current).toHaveAttribute("aria-current", "location");
    if (desktop) {
      await expect(current).toBeInViewport();
      await expect(navigation).toHaveCSS("position", "sticky");
    }
  }
});
