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
