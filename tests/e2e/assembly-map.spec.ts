import { expect, test } from "@playwright/test";

const assembly = "#narodna-skupstina";

test("open and reload the Assembly topic by its shareable address", async ({
  page,
}) => {
  await page.goto(`/institucije${assembly}`);
  const tab = page.locator(`[role="tab"][href="${assembly}"]`);
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveAccessibleName(
    await tab.innerText(),
  );
  const procedure = page.getByRole("region", {
    name: "Од дневног реда до гласања о закону",
  });
  await expect(
    procedure.getByRole("heading", { name: "Кворум и потребна већина" }),
  ).toBeVisible();
  await page.reload();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await procedure.getByRole("link", { name: /Пословник.*85 и 92–94/ }).click();
  await expect(page).toHaveURL(
    /\/propisi\/poslovnik-narodne-skupstine#clan-85$/,
  );
  await expect(page.locator("#clan-85")).toBeInViewport();
});

test("follow the Assembly card, switch topics by keyboard and retrace them", async ({
  page,
}) => {
  await page.goto("/institucije");
  const government = page.getByRole("tab", {
    name: "Државна власт",
    exact: true,
  });
  const assemblyTab = page.locator(`[role="tab"][href="${assembly}"]`);
  await page
    .getByRole("link", { name: "Како ради Народна скупштина?" })
    .click();
  await expect(assemblyTab).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/#narodna-skupstina$/);

  await expect(assemblyTab).toBeFocused();
  await assemblyTab.press("Home");
  await expect(government).toBeFocused();
  await expect(government).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/#vlast$/);
  await page.goBack();
  await expect(assemblyTab).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(government).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/\/institucije$/);
  await page.goForward();
  await expect(assemblyTab).toHaveAttribute("aria-selected", "true");
});
