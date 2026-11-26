import { test, expect, type Page } from "@playwright/test";

const destinations = [
  { name: "Почетак", href: "/" },
  { name: "Институције", href: "/institucije" },
  { name: "Претрага", href: "/#pretraga" },
  { name: "Скупштина", href: "/institucije/skupstina" },
  { name: "Учење", href: "/ucenje" },
] as const;

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

async function expectActive(page: Page, name: string) {
  const navigation = page.locator(".mobile-navigation");
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(
    navigation.getByRole("link", { name, exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("navigation", { name: "Главна навигација", exact: true }),
  ).toHaveCount(1);
}

test("bottom navigation crosses app and standalone law pages with correct history selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectActive(page, "Почетак");
  await expect(page.locator(".mobile-navigation a")).toHaveText(
    destinations.map(({ name }) => name),
  );
  for (const destination of destinations.slice(1)) {
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
    await expectActive(
      page,
      destination.href === "/#pretraga" ? "Почетак" : destination.name,
    );
    if (destination.href === "/institucije")
      await expect(
        page.getByRole("heading", { name: "Мапа институција Србије" }),
      ).toBeVisible();
    if (destination.href === "/#pretraga")
      await expect(page.locator("#pretraga")).toBeInViewport();
  }
  await page.goto("/propisi/ustav-republike-srbije");
  await expectActive(page, "Претрага");
  await expect(page.locator("#clan-1")).toHaveCount(1);
  await expect(page.locator("#clan-206")).toHaveCount(1);
  await page.goBack();
  await expectActive(page, "Учење");
  await page.goBack();
  await expectActive(page, "Скупштина");
  await page.goForward();
  await expectActive(page, "Учење");
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

test("mobile widths keep every navigation target reachable and leave room below the footer", async ({
  page,
}) => {
  for (const width of [320, 390, 800]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/institucije/skupstina", "/propisi/zakon-o-radu"]) {
      await page.goto(route);
      const navigation = page.locator(".mobile-navigation");
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
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const nav =
              document.querySelector<HTMLElement>(".mobile-navigation")!;
            const navBox = nav.getBoundingClientRect();
            const footerBox = document
              .querySelector(".site-footer")!
              .getBoundingClientRect();
            return {
              fixed: getComputedStyle(nav).position === "fixed",
              bottom: Math.abs(navBox.bottom - innerHeight) <= 1,
              footerClear: footerBox.bottom <= navBox.top + 1,
              noOverflow: document.documentElement.scrollWidth <= innerWidth,
            };
          }),
        )
        .toEqual({
          fixed: true,
          bottom: true,
          footerClear: true,
          noOverflow: true,
        });
    }
  }
});

test("desktop keeps header navigation while the mobile bar is hidden for desktop and print", async ({
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
