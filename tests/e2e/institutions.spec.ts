import { expect, test } from "@playwright/test";

const procedureMaps = [
  {
    slug: "vlada",
    topic: "Влада",
    procedure: "Како од нацрта настаје пропис?",
    relationship: "предлаже законе",
    citation: "Закон о Влади, члан 34.",
    law: "zakon-o-vladi#clan-34",
  },
  {
    slug: "ustavni-sud",
    topic: "Уставни суд",
    procedure: "Шта се дешава када неко оспори одредбу закона?",
    relationship: "подноси уставну жалбу",
    citation: "Закон о Уставном суду, члан 82.",
    law: "zakon-o-ustavnom-sudu#clan-82",
  },
  {
    slug: "lokalna-samouprava",
    topic: "Локална самоуправа",
    procedure: "Како општина доноси и извршава буџет?",
    relationship: "предлаже буџет",
    citation: "Закон о локалној самоуправи, члан 33.",
    law: "zakon-o-lokalnoj-samoupravi#clan-33",
  },
];

test("find a ministry, read its duties and follow its legal source", async ({
  page,
}) => {
  await page.goto("/institucije");
  await page
    .getByRole("link", { name: "Преглед институција", exact: true })
    .click();
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

for (const {
  slug,
  topic,
  procedure,
  relationship,
  citation,
  law,
} of procedureMaps) {
  test(`read the ${topic} procedure and follow a relationship to the law`, async ({
    page,
  }) => {
    await page.goto(`/institucije#${slug}`);
    await expect(
      page.getByRole("tab", { name: topic, exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("heading", { name: procedure })).toBeVisible();
    await panel.getByRole("button", { name: new RegExp(relationship) }).click();
    const dialog = page.getByRole("dialog", { name: relationship });
    await dialog.getByRole("link", { name: citation }).click();
    await expect(page).toHaveURL(`/propisi/${law}`);
    await expect(page.locator(`#${law.split("#")[1]}`)).toBeInViewport();
  });
}

test("follow the small-claims appeal from the map to its legal source", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Мапе институција" })
    .click();
  await expect(page).toHaveURL(/\/institucije$/);

  await page.getByRole("tab", { name: "Судови", exact: true }).click();
  await page.getByRole("combobox", { name: "Полазиште на мапи" }).click();
  await page
    .getByRole("option", { name: "Виши суд у Београду", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Виши суд у Београду" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Први основни суд у Београду", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Први основни суд у Београду" }),
  ).toBeFocused();

  await page.getByRole("button", { name: /мале вредности/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Виши суд у Београду");
  await dialog
    .getByRole("link", { name: "Закон о уређењу судова, члан 25." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/zakon-o-uredjenju-sudova#clan-25$/);
  await expect(page.locator("#clan-25")).toBeInViewport();
});
