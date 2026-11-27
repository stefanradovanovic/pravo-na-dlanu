import { expect, test, type Locator } from "@playwright/test";

async function expectMirroredGuides(canvas: Locator, cards: Locator) {
  const ids = await cards.evaluateAll((elements) =>
    elements
      .slice(0, 2)
      .map((element) =>
        element.closest(".react-flow__node")!.getAttribute("data-id"),
      ),
  );
  expect(ids).toHaveLength(2);
  const connectors = await Promise.all(
    ids.map(async (id) => {
      const path = await canvas.locator(`path[id="e-${id}"]`).getAttribute("d");
      const match = path?.match(
        /^M ([^ ]+) [^ ]+ V ([^ ]+) H ([^ ]+) V [^ ]+ H ([^ ]+)$/,
      );
      expect(match).not.toBeNull();
      return match!.slice(1).map(Number);
    }),
  );
  const [leftStart, leftBus, leftRail, leftTarget] = connectors[0];
  const [rightStart, rightBus, rightRail, rightTarget] = connectors[1];
  expect(leftStart).toBeCloseTo(rightStart, 0);
  expect(leftBus).toBeCloseTo(rightBus, 0);
  expect(leftRail).toBeLessThan(leftTarget);
  expect(rightRail).toBeGreaterThan(rightTarget);
  expect(leftStart - leftRail).toBeCloseTo(rightRail - rightStart, 0);
  expect(leftStart - leftTarget).toBeCloseTo(rightTarget - rightStart, 0);
}

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

test("mobile legal areas fit two cards per row with readable titles", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Requires a mobile viewport.");
  await page.goto("/");
  const canvas = page.locator(".registry-canvas");
  const cards = canvas.locator(".registry-node.category");
  await expect(cards).toHaveCount(16);

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(async () => {
      const { x: left, width: canvasWidth } = (await canvas.boundingBox())!;
      const bounds = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          const title = element.querySelector("strong")!;
          return {
            x,
            y,
            width,
            height,
            titleFits:
              title.scrollHeight <= title.clientHeight + 1 &&
              title.scrollWidth <= title.clientWidth + 1,
          };
        }),
      );
      expect(bounds.every((card) => card.titleFits && card.height >= 44)).toBe(
        true,
      );
      for (let i = 0; i < bounds.length; i += 2) {
        const a = bounds[i];
        const b = bounds[i + 1];
        expect(a.y).toBeCloseTo(b.y, 0);
        expect(a.x).toBeGreaterThan(left);
        expect(a.x + a.width).toBeLessThan(b.x);
        expect(b.x + b.width).toBeLessThan(left + canvasWidth);
        if (i + 2 < bounds.length) {
          const gap =
            bounds[i + 2].y - Math.max(a.y + a.height, b.y + b.height);
          expect(gap).toBeGreaterThan(0);
          expect(gap).toBeLessThan(17);
        }
      }
      await expectMirroredGuides(canvas, cards);
    }).toPass({ timeout: 15_000 });
  }
});

test("law maps show two columns with mirrored guides on mobile and five columns on desktop", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Монетарни систем/ }).click();

  const canvas = page.locator(".registry-canvas");
  const cards = canvas.locator(".registry-node.law");
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
    .toBe(isMobile ? 2 : 5);

  if (isMobile) {
    await expect(async () => expectMirroredGuides(canvas, cards)).toPass({
      timeout: 15_000,
    });
  }
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

test("hover and keyboard focus match a law to its path and dim other paths", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Requires a mouse and keyboard");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const category = page.getByRole("button", { name: /Монетарни систем/ });
  const brickAccent = "rgb(228, 161, 153)";
  await expect(category.locator(".node-icon")).toHaveCSS("color", brickAccent);
  await category.click();

  const law = page.locator(".registry-node.law").first();
  const nodeId = await law.locator("..").getAttribute("data-id");
  const path = page.locator(`path[id="e-${nodeId}"]`);
  const otherPath = page
    .locator(`.react-flow__edge-path:not([id="e-${nodeId}"])`)
    .first();
  const restingStroke = await otherPath.evaluate(
    (edge) => getComputedStyle(edge).stroke,
  );
  const highlighted = page.locator(".react-flow__edge.is-highlighted");

  await expect(law.locator(".node-icon")).toHaveCSS("color", brickAccent);
  await expect(path).toHaveCSS("stroke-width", "1px");
  await law.hover();
  await expect(path).toHaveCSS("stroke-width", "3px");
  const activeAccent = await path.evaluate(
    (edge) => getComputedStyle(edge).stroke,
  );
  expect(activeAccent).not.toBe(restingStroke);
  expect(activeAccent).not.toBe(brickAccent);
  await expect(law).toHaveCSS("border-top-color", activeAccent);
  await expect(law.locator(".node-icon")).toHaveCSS("color", activeAccent);
  await expect(otherPath).not.toHaveCSS("stroke", restingStroke);
  await expect(highlighted).toHaveCount(1);

  await page
    .getByRole("tabpanel", { name: "Мапа" })
    .getByRole("group", { name: "Контроле мапе" })
    .hover();
  await expect(path).toHaveCSS("stroke-width", "1px");
  await expect(otherPath).toHaveCSS("stroke", restingStroke);

  await page.locator(".registry-node.category").focus();
  await page.keyboard.press("Tab");
  await expect(law).toBeFocused();
  await expect(path).toHaveCSS("stroke", activeAccent);
  await expect(law).toHaveCSS("border-top-color", activeAccent);
  await expect(otherPath).not.toHaveCSS("stroke", restingStroke);
});
