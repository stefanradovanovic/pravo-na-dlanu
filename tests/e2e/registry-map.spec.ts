import { expect, test } from "@playwright/test";

test("the regulations map links to its source beside the category count", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator(".map-footer");
  await expect(footer.getByText(/\d+ области/)).toBeVisible();
  await expect(page.locator(".source-banner")).toHaveCount(0);
  await footer.getByRole("link", { name: "Извор", exact: true }).click();
  await expect(page).toHaveURL(/\/o-projektu\/?$/);
  await expect(
    page.getByRole("heading", { name: "Обухват каталога" }),
  ).toBeVisible();
});

test("the registry map fills its width and grows to fit every card", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.locator(".registry-canvas");
  const cards = canvas.locator(".registry-node");
  await expect(cards).toHaveCount(17);

  await expect(async () => {
    const { width, height, top, right, bottom, left } = await canvas.evaluate(
      (element) => {
        const canvasBounds = element.getBoundingClientRect();
        const cards = Array.from(element.querySelectorAll(".registry-node"));
        const bounds = cards.map((card) => card.getBoundingClientRect());
        return {
          width: canvasBounds.width,
          height: canvasBounds.height,
          top: Math.min(...bounds.map((box) => box.top)) - canvasBounds.top,
          right:
            canvasBounds.right - Math.max(...bounds.map((box) => box.right)),
          bottom:
            canvasBounds.bottom - Math.max(...bounds.map((box) => box.bottom)),
          left: Math.min(...bounds.map((box) => box.left)) - canvasBounds.left,
        };
      },
    );

    expect(height).toBeGreaterThan(600);
    expect(Math.min(top, right, bottom, left)).toBeGreaterThan(0);
    expect((width - left - right) / width).toBeGreaterThan(0.75);
  }).toPass({ timeout: 15_000 });
});

test("large categories show title-only cards in five columns on desktop", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Монетарни систем/ }).click();

  const cards = page.locator(".registry-node.law");
  await expect(cards.nth(50)).toBeAttached();
  await expect(cards.locator("small")).toHaveCount(0);
  await expect
    .poll(() =>
      cards.evaluateAll((elements) => {
        const firstRow = elements[0].getBoundingClientRect().top;
        return elements.filter(
          (element) => element.getBoundingClientRect().top === firstRow,
        ).length;
      }),
    )
    .toBe(isMobile ? 1 : 5);
});

test("the overview's center rail lines up with the root connector", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const centerEdge = page.locator('path[id="e-category-2"]');
  await expect
    .poll(async () => {
      const path = await centerEdge.getAttribute("d");
      const match = path?.match(/^M ([^ ]+) [^ ]+ V [^ ]+ H ([^ ]+) V /);
      return match ? Number(match[1]) - Number(match[2]) : null;
    })
    .toBe(0);
});

test("hover and keyboard focus highlight a law's path", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Requires a mouse and keyboard");
  await page.goto("/");
  await page.getByRole("button", { name: /Монетарни систем/ }).click();

  const law = page.locator(".registry-node.law").first();
  const nodeId = await law.locator("..").getAttribute("data-id");
  const path = page.locator(`path[id="e-${nodeId}"]`);
  const highlighted = page.locator(".react-flow__edge.is-highlighted");

  await expect(path).toHaveCSS("stroke-width", "1px");
  await law.hover();
  await expect(path).toHaveCSS("stroke-width", "1.5px");
  await expect(highlighted).toHaveCount(1);

  await page.getByRole("group", { name: "Контроле мапе" }).hover();
  await expect(path).toHaveCSS("stroke-width", "1px");

  await page.locator(".registry-node.category").focus();
  await page.keyboard.press("Tab");
  await expect(law).toBeFocused();
  await expect(path).toHaveCSS("stroke-width", "1.5px");
});
