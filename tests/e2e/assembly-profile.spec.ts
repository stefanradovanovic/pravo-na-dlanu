import { expect, test } from "@playwright/test";

const assembly = "#institucija-narodna-skupstina";

test("open and reload the Assembly profile by its shareable address", async ({
  page,
}) => {
  await page.goto(`/institucije${assembly}`);
  const profile = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Народна скупштина", exact: true }),
  });
  await expect(page.locator(assembly)).toBeInViewport();
  await expect(
    profile.getByText("Доноси законе", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(profile).toBeVisible();
  await profile
    .getByRole("link", { name: "Устав Републике Србије, члан 99." })
    .click();
  await expect(page).toHaveURL(/\/propisi\/ustav-republike-srbije#clan-99$/);
  await expect(page.locator("#clan-99")).toBeInViewport();
});

test("switch institution profiles by keyboard and retrace them", async ({
  page,
}) => {
  await page.goto("/institucije");
  const sidebar = page.getByRole("navigation", { name: "Области прегледа" });
  await sidebar
    .getByLabel("Списак институција — Државна власт", { exact: true })
    .press("Enter");
  await sidebar
    .getByRole("link", { name: "Народна скупштина", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/#institucija-narodna-skupstina$/);
  await expect(page.locator(assembly)).toBeFocused();
  await sidebar
    .getByLabel("Списак институција — Судови и јавна тужилаштва", {
      exact: true,
    })
    .press("Enter");
  await sidebar
    .getByRole("link", { name: "Судови", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/#institucija-sudovi$/);
  await expect(page.locator("#institucija-sudovi")).toBeFocused();
  await page.goBack();
  await expect(page.locator(assembly)).toBeVisible();
  await page.goForward();
  await expect(page.locator("#institucija-sudovi")).toBeVisible();
});
