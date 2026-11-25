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
  await expect(
    ministryGroup.locator(":scope > .institution-profiles > article"),
  ).toHaveCount(25);
  await expect(
    ministryGroup
      .getByRole("region", { name: "Министри без портфеља", exact: true })
      .getByRole("article"),
  ).toHaveCount(5);
  await expect(
    page.getByRole("heading", { name: "Министарство за јавна улагања" }),
  ).toBeVisible();
  await ministry
    .getByRole("link", { name: "Закон о министарствима, члан 13." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-ministarstvima#clan-13$/);
  await expect(page.locator("#clan-13")).toBeInViewport();
});

test("find the two ministers and their official contacts and services", async ({
  page,
}) => {
  await page.goto("/institucije#ministarstva");
  const ministries = page.getByRole("region", {
    name: "Министарства",
    exact: true,
  });
  await expect(ministries.getByText(/ради у техничком мандату/)).toHaveCount(1);
  await expect(
    ministries.getByRole("link", { name: "Саопштење Владе" }),
  ).toHaveAttribute("href", /srbija\.gov\.rs\/vest\/1011594/);

  const search = page.getByRole("searchbox", { name: "Пронађи институцију" });
  const profile = ministries.getByRole("article");
  for (const query of ["Ивица Дачић", "Ivica Dačić", "ivica dacic"]) {
    await search.fill(query);
    await expect(profile.getByRole("heading", { level: 3 })).toHaveText(
      "Министарство унутрашњих послова",
    );
  }
  await expect(
    profile.getByRole("link", { name: "+381 11 274-00-00" }),
  ).toHaveAttribute("href", "tel:+381112740000");
  await expect(
    profile.getByRole("link", { name: /закажите термин/i }),
  ).toHaveAttribute("href", /euprava\.gov\.rs\/usluge\/00005/);

  await search.fill("dejan vuk stankovic");
  await expect(profile.getByRole("heading", { level: 3 })).toHaveText(
    "Министарство просвете",
  );
  await expect(
    profile.getByRole("link", { name: /званична биографија/i }),
  ).toHaveAttribute("href", /srbija\.gov\.rs\/biografija\/67117/);
  await expect(
    profile.getByRole("link", { name: "kabinet@prosveta.gov.rs" }),
  ).toHaveAttribute("href", "mailto:kabinet@prosveta.gov.rs");
  await expect(
    profile.getByRole("link", { name: /поднесите захтев/i }),
  ).toHaveAttribute("href", "https://euprava.gov.rs/usluga-episarnica");
  await profile.locator("summary").press("Enter");
  await expect(profile.getByRole("link", { name: "CC BY 3.0" })).toBeVisible();
});

test.describe("institutions without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("browse court types and jurisdictions by keyboard", async ({ page }) => {
    await page.goto("/institucije#institucija-sudovi");
    const directory = page.getByRole("region", {
      name: "Списак судова и надлежности",
    });
    await expect(directory.getByText(/судова у мрежи/)).toBeVisible();
    const basic = directory
      .locator("details")
      .filter({ hasText: "Основни судови" });
    await basic.locator("summary").press("Enter");
    await expect(
      basic.getByText("Основни суд у Чачку", { exact: true }),
    ).toBeVisible();
    await expect(
      basic.getByText("Територија града Чачка", { exact: true }),
    ).toBeVisible();
    await expect(
      basic.getByRole("link", { name: "Закон о уређењу судова, члан 24." }),
    ).toBeVisible();
    await basic.locator("summary").press("Enter");
    await expect(
      basic.getByText("Основни суд у Чачку", { exact: true }),
    ).toBeHidden();
  });

  test("expand a sector, open a profile and follow a source", async ({
    page,
  }) => {
    await page.goto("/institucije#ministarstva");
    await expect(
      page
        .getByRole("region", { name: "Министарства", exact: true })
        .locator(":scope > .institution-profiles > article"),
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
    const ministers = groupNavigation.locator("details[open]");
    await expect(ministers.getByRole("link").last()).toHaveText(
      "Татјана Мацура",
    );
    await ministers
      .getByRole("link", { name: "Новица Тончев", exact: true })
      .click();
    await expect(page).toHaveURL(/#institucija-novica-toncev$/);
    await expect(page.locator("#institucija-novica-toncev")).toBeInViewport();
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

test("find a court by city and by a municipality it covers", async ({
  page,
}) => {
  await page.goto("/institucije#institucija-sudovi");
  const directory = page.getByRole("region", {
    name: "Списак судова и надлежности",
  });
  const search = directory.getByRole("searchbox", { name: "Пронађи суд" });
  await search.fill("osnovni sud cacak");
  await expect(
    directory.getByText("Основни суд у Чачку", { exact: true }),
  ).toBeVisible();
  await search.fill("osnovni sud zemun");
  await expect(
    directory.getByText(/(Трећи|Четврти) основни суд у Београду/, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    directory.getByText("Основни суд у Чачку", { exact: true }),
  ).toHaveCount(0);
  await search.fill("Kosovska Mitrovica");
  await expect(directory.getByText(/привремено су пренете/)).toBeVisible();
  await search.fill("zzzx");
  await expect(directory.getByRole("status")).toHaveText(
    "Нема судова за овај упит.",
  );
  await search.clear();
  await expect(directory.getByText(/судова у мрежи/)).toBeVisible();
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
  await expect(sidebar.getByRole("link")).toHaveText([
    "Преглед области",
    "Уставни суд",
    "Јавно тужилаштво",
    "Судови",
  ]);
  const courtsLink = sidebar.getByRole("link", { name: "Судови", exact: true });
  await courtsLink.click();
  await expect(page).toHaveURL(/#institucija-sudovi$/);
  await expect(page.locator("#institucija-sudovi")).toBeInViewport();
  const judiciary = page.getByRole("region", {
    name: "Судови и јавна тужилаштва",
  });
  await expect(judiciary.getByRole("heading", { level: 3 })).toHaveText([
    "Уставни суд",
    "Јавно тужилаштво",
    "Судови",
  ]);
  const courtsProfile = judiciary.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Судови", exact: true }),
  });
  const highlightOpacity = () =>
    courtsProfile.evaluate(
      (profile) => getComputedStyle(profile, "::before").opacity,
    );
  await expect.poll(highlightOpacity).toBe("1");
  await expect.poll(highlightOpacity).toBe("0");
  await expect(courtsLink).toHaveAttribute("aria-current", "location");
  await page
    .getByRole("link", { name: "Закон о уређењу судова, члан 24." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-uredjenju-sudova#clan-24$/);
  await expect(page.locator("#clan-24")).toBeInViewport();
});
