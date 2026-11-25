import { expect, test } from "@playwright/test";

test("find a ministry, read its duties and follow its legal source", async ({
  page,
}) => {
  await page.goto("/institucije");
  await expect(
    page.getByRole("link", { name: "Преглед институција", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#pregled-institucija")).toBeInViewport();

  const search = page.getByRole("searchbox", { name: "Пронађи институцију" });
  await search.fill("непостојећа институција");
  await expect(page.getByText("Нема резултата за овај упит.")).toBeVisible();
  await search.fill("pasos");
  const ministry = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Министарство унутрашњих послова" }),
  });
  await expect(
    ministry.getByRole("list", { name: "Изабране надлежности" }),
  ).toContainText("Обавља послове у вези са личним исправама");
  await search.clear();
  const sidebar = page.getByRole("navigation", { name: "Области прегледа" });
  const authorityGroup = page.getByRole("region", {
    name: "Државна власт",
    exact: true,
  });
  const assemblyLink = sidebar.getByRole("link", {
    name: "Народна скупштина",
    exact: true,
  });
  await sidebar
    .getByLabel("Списак институција — Државна власт", { exact: true })
    .click();
  await expect(assemblyLink).toBeVisible();

  const ministryTitle = sidebar.getByLabel(
    "Списак институција — Министарства",
    {
      exact: true,
    },
  );
  const ministryLink = sidebar.getByRole("link", {
    name: "Министарство унутрашњих послова",
    exact: true,
  });
  await ministryTitle.scrollIntoViewIfNeeded();
  const initialScroll = await page.evaluate(() => window.scrollY);
  const initialUrl = page.url();

  await ministryTitle.click();
  await expect(ministryLink).toBeInViewport();
  await expect(authorityGroup).toBeVisible();
  await expect(assemblyLink).toBeHidden();
  await expect(page).toHaveURL(initialUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(initialScroll);

  await ministryTitle.click();
  await expect(ministryLink).toBeHidden();
  await expect(assemblyLink).toBeHidden();
  await expect(page).toHaveURL(initialUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(initialScroll);

  await ministryTitle.press("Enter");
  await expect(ministryLink).toBeInViewport();
  await sidebar
    .getByRole("link", { name: "Преглед области — Министарства", exact: true })
    .click();
  await expect(assemblyLink).toBeHidden();
  const ministryGroup = page.getByRole("region", {
    name: "Министарства",
    exact: true,
  });
  await expect(ministryGroup.getByRole("article")).toHaveCount(25);
  await expect(
    page.getByRole("heading", { name: "Министарство за јавна улагања" }),
  ).toBeVisible();
  await ministry
    .getByRole("link", { name: "Закон о министарствима, члан 13." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-ministarstvima#clan-13$/);
  await expect(page.locator("#clan-13")).toBeInViewport();
});

test.describe("institutions without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("expand a sector, open a profile and follow a source", async ({
    page,
  }) => {
    await page.goto("/institucije#ministarstva");
    await expect(
      page
        .getByRole("region", { name: "Министарства", exact: true })
        .getByRole("article"),
    ).toHaveCount(25);
    const groupNavigation = page.getByRole("navigation", {
      name: "Области прегледа",
    });
    const ministryOverview = groupNavigation.getByRole("link", {
      name: "Преглед области — Министарства",
      exact: true,
    });
    await groupNavigation
      .getByLabel("Списак институција — Министарства", { exact: true })
      .press("Enter");
    await expect(ministryOverview).toBeVisible();
    await groupNavigation
      .getByLabel("Списак институција — Локална самоуправа", { exact: true })
      .press("Enter");
    await expect(ministryOverview).toBeHidden();
    await groupNavigation
      .getByRole("link", { name: "Општинска управа", exact: true })
      .click();
    await expect(page).toHaveURL(/#institucija-opstinska-uprava$/);
    await expect(
      page.locator("#institucija-opstinska-uprava"),
    ).toBeInViewport();
    const localGroup = page.getByRole("region", { name: "Локална самоуправа" });
    await expect(localGroup.getByRole("article")).toHaveCount(4);
    await localGroup
      .getByRole("link", { name: "Закон о локалној самоуправи, члан 52." })
      .click();
    await expect(page.locator("#clan-52")).toBeInViewport();
  });
});

test("open the courts profile and its legal source from the overview", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Мапе институција" })
    .click();
  await expect(page).toHaveURL(/\/institucije$/);
  await expect(
    page.getByRole("heading", { name: "Везе између институција", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Како институције сарађују",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.locator('a[href="#veze-institucija"], a[href="#zajednicki-postupci"]'),
  ).toHaveCount(0);

  const sidebar = page.getByRole("navigation", { name: "Области прегледа" });
  await sidebar
    .getByLabel("Списак институција — Судови и јавна тужилаштва", {
      exact: true,
    })
    .click();
  await sidebar.getByRole("link", { name: "Судови", exact: true }).click();
  await expect(page).toHaveURL(/#institucija-sudovi$/);
  await expect(page.locator("#institucija-sudovi")).toBeInViewport();
  await page
    .getByRole("link", { name: "Закон о уређењу судова, члан 24." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-uredjenju-sudova#clan-24$/);
  await expect(page.locator("#clan-24")).toBeInViewport();
});
