import { test, expect, type Page } from "@playwright/test";

const destinations = [
  { name: "Почетак", href: "/" },
  { name: "Институције", href: "/institucije" },
  { name: "Претрага", href: "/#pretraga" },
  { name: "Скупштина", href: "/institucije/skupstina" },
  { name: "Учење", href: "/ucenje" },
  { name: "Речник", href: "/ucenje/recnik" },
] as const;

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

async function expectActive(page: Page, name: string) {
  const navigation = page.locator(".mobile-navigation");
  if (!(await navigation.isVisible()))
    await page.getByRole("button", { name: "Мени", exact: true }).click();
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(
    navigation.getByRole("link", { name, exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("navigation", { name: "Главна навигација", exact: true }),
  ).toHaveCount(1);
}

test("mobile search expands in place across the header", async ({ page }) => {
  for (const { width, path, reducedMotion } of [
    { width: 320, path: "/ucenje", reducedMotion: "no-preference" },
    { width: 390, path: "/", reducedMotion: "no-preference" },
    {
      width: 390,
      path: "/propisi/ustav-republike-srbije",
      reducedMotion: "reduce",
    },
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto(path);
    const url = page.url();
    const navigation = page.locator(".mobile-navigation");
    await page.getByRole("button", { name: "Мени", exact: true }).click();
    const link = navigation.locator('a[href="/#pretraga"]');
    const input = page.getByRole("combobox", { name: "Претрага из заглавља" });
    await expect(input).toBeHidden();
    await link.click();
    await expect(page).toHaveURL(url);
    await expect(input).toBeFocused();
    const searchTrigger = page.locator(".header-search-mobile");
    await expect(navigation).toBeHidden();
    await expect(searchTrigger).toHaveAttribute("aria-expanded", "true");
    const form = page.locator(".header-search");
    await expect(form).toHaveCSS(
      "animation-name",
      reducedMotion === "reduce" ? "none" : "mobile-law-search-expand",
    );
    await expect(
      page.getByRole("option", { name: "Устав Републике Србије", exact: true }),
    ).toBeVisible();
    const popup = page.locator(".header-search-suggestions");
    await expect(async () => {
      const expanded = (await form.boundingBox())!;
      const bar = (await page.locator(".site-header").boundingBox())!;
      const field = (await input.boundingBox())!;
      const suggestions = (await popup.boundingBox())!;
      expect(expanded).toEqual(bar);
      expect(field.width).toBeGreaterThanOrEqual(width - 32);
      expect(suggestions.x).toBeCloseTo(field.x, 0);
      expect(suggestions.width).toBeCloseTo(field.width, 0);
      expect(suggestions.y).toBeGreaterThanOrEqual(field.y + field.height);
    }).toPass({ timeout: 10_000 });
    await input.press("Escape");
    await expect(popup).toBeHidden();
    await form.getByRole("button", { name: "Затвори претрагу" }).click();
    await expect(input).toBeHidden();
    await expect(searchTrigger).toBeFocused();
    await searchTrigger.click();
    await expect(popup).toBeVisible();
    await input.fill("zakon o radu");
    await expect(
      page.getByRole("option", { name: "Закон о раду", exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("option", { name: "Закон о раду", exact: true }).click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-radu/);
});

test("header menu crosses app and standalone law pages with correct history selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectActive(page, "Почетак");
  await expect(page.locator(".mobile-navigation a")).toHaveText(
    destinations.map(({ name }) => name),
  );
  for (const destination of destinations
    .slice(1)
    .filter(({ name }) => name !== "Претрага")) {
    await page
      .locator(".mobile-navigation")
      .getByRole("link", {
        name: destination.name,
        exact: true,
      })
      .click();
    await expect
      .poll(() => {
        const url = new URL(page.url());
        return url.pathname + url.hash;
      })
      .toBe(destination.href);
    await expectActive(page, destination.name);
    if (destination.href === "/institucije")
      await expect(
        page.getByRole("heading", { name: "Мапа институција Србије" }),
      ).toBeVisible();
  }
  await page.goto("/propisi/ustav-republike-srbije");
  await expectActive(page, "Претрага");
  await expect(page.locator("#clan-1")).toHaveCount(1);
  await expect(page.locator("#clan-206")).toHaveCount(1);
  await page.goBack();
  await expectActive(page, "Речник");
  await page.goBack();
  await expectActive(page, "Учење");
  await page.goForward();
  await expectActive(page, "Речник");
  await page.goForward();
  await expectActive(page, "Претрага");
  await page
    .locator(".mobile-navigation")
    .getByRole("link", {
      name: "Почетак",
      exact: true,
    })
    .click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expectActive(page, "Почетак");

  await page.goto("/ucenje?tema=potrosaci");
  await expectActive(page, "Учење");
  await page.goto("/propisi/zakon-o-radu#clan-18");
  await expectActive(page, "Претрага");
  await expect(page.locator("#clan-18")).toBeInViewport();
});

test("mobile widths keep menu targets reachable and dismiss the menu with Escape or an outside tap", async ({
  page,
}) => {
  for (const width of [320, 390, 800]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/institucije/skupstina", "/propisi/zakon-o-radu"]) {
      await page.goto(route);
      const navigation = page.locator(".mobile-navigation");
      const trigger = page.getByRole("button", { name: "Мени", exact: true });
      await expect(navigation).toBeHidden();
      await trigger.click();
      await expect(navigation).toBeVisible();
      await expect(page.locator(".site-header nav")).toBeHidden();
      for (const destination of destinations) {
        const link = navigation.getByRole("link", {
          name: destination.name,
          exact: true,
        });
        await expect(link).toHaveAttribute("href", destination.href);
        const box = await link.boundingBox();
        expect(
          box,
          `${destination.name} at ${width}px on ${route}`,
        ).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
        const label = await link.locator("span").boundingBox();
        expect(label!.x).toBeGreaterThanOrEqual(box!.x);
        expect(label!.x + label!.width).toBeLessThanOrEqual(
          box!.x + box!.width,
        );
      }
      await page.keyboard.press("Escape");
      await expect(navigation).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.mouse.click(4, 200);
      await expect(navigation).toBeHidden();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("desktop keeps header navigation while the hamburger is hidden for desktop and print", async ({
  page,
}) => {
  for (const width of [801, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/institucije");
    await expect(page.locator(".mobile-navigation")).toBeHidden();
    const navigation = page.locator(".site-header nav");
    await expect(navigation).toBeVisible();
    await expect(navigation.locator("a")).toHaveText([
      "Прописи",
      "Институције",
      "Скупштина",
      "Учење",
      "Речник",
    ]);
    await expect(
      page.getByRole("navigation", { name: "Главна навигација", exact: true }),
    ).toHaveCount(1);
    const assembly = navigation.getByRole("link", { name: "Скупштина" });
    await assembly.click();
    await expect(page).toHaveURL(/\/institucije\/skupstina\/?$/);
    await expect(assembly).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Одбори", exact: true }).click();
    await expect(page).toHaveURL(/\/institucije\/skupstina\/odbori\/?$/);
    await expect(navigation.locator('a[aria-current="page"]')).toHaveText(
      "Скупштина",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Мени", exact: true }).click();
  await expect(page.locator(".mobile-navigation")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".mobile-navigation")).toBeHidden();
  await page.goto("/propisi/zakon-o-radu");
  await expect(page.locator(".mobile-navigation")).toBeHidden();
});

test("mobile navigation works without JavaScript and standalone laws retain their own active destination", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/institucije/skupstina/odbori");
    await expectActive(page, "Скупштина");
    await page
      .locator(".mobile-navigation")
      .getByRole("link", {
        name: "Институције",
        exact: true,
      })
      .click();
    await expectActive(page, "Институције");
    await page.goto("/propisi/ustav-republike-srbije");
    await expectActive(page, "Претрага");
    await expect(page.locator("#clan-206")).toHaveCount(1);
    await page
      .locator(".mobile-navigation")
      .getByRole("link", {
        name: "Претрага",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/#pretraga$/);
    await expect(page.locator("#pretraga")).toBeInViewport();
    await expectActive(page, "Почетак");
    await page.goto("/propisi/zakon-o-radu");
    await expectActive(page, "Претрага");
    await page
      .locator(".mobile-navigation")
      .getByRole("link", {
        name: "Скупштина",
        exact: true,
      })
      .click();
    await expectActive(page, "Скупштина");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Народни посланици",
    );
  } finally {
    await context.close();
  }
});
