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

test("select an Assembly seat and clear it by clicking away with a single search result", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => hydrationErrors.push(error.message));
  await page.goto("/institucije/skupstina#mapa-poslanika");
  await page.getByPlaceholder("Претражите посланике").fill("aleksandar cupic");
  const map = page.locator("#mapa-poslanika");
  const seat = map.getByRole("radio", { name: /Чупић Александар/ });
  const chair = seat.locator("..");
  await chair.hover();
  await expect(chair.locator("small")).toContainText(
    "Председник Народне скупштине",
  );
  await chair.click();
  await expect(seat).toBeChecked();
  await map.getByRole("heading").click();
  await expect(seat).not.toBeChecked();
  await expect(map.locator(".member-map-selection strong")).toHaveCount(0);
  await chair.click();
  await page.getByPlaceholder("Претражите посланике").click();
  await expect(seat).not.toBeChecked();
  expect(hydrationErrors).toEqual([]);
});
