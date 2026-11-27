import { expect, test, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import directory from "../../content/assembly-directory.json" with { type: "json" };

const localBackend = process.env.ASSEMBLY_RATINGS_E2E_URL;
const assemblyPath = "/institucije/skupstina";
const defaultDeputy = directory.members.find(({ id }) => id === "1572")!;
const dummyChallenge = "XXXX.DUMMY.TOKEN.XXXX";

test.skip(!localBackend, "Requires the local Convex and Turnstile test setup.");

type AgentTool = { name: string; execute(input: object): Promise<unknown> };
type AgentTestWindow = Window & { ratingTestTools?: Map<string, AgentTool> };

async function selectDeputy(page: Page, deputy = defaultDeputy) {
  const seat = page.locator(`input[type="radio"][value="${deputy.id}"]`);
  await seat.locator("..").click();
  await expect(seat).toBeChecked();
  await expect(page.getByRole("region", { name: deputy.name })).toBeVisible();
}

async function openRating(page: Page, deputy = defaultDeputy) {
  await selectDeputy(page, deputy);
  await page.getByRole("button", { name: "Оцените рад" }).click();
  const dialog = page.getByRole("dialog", { name: "Оцена рада", exact: true });
  await expect(dialog).toHaveAccessibleDescription(deputy.name);
  return dialog;
}

test("the rating circles are discoverable and arrows move focus without voting", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const tools = new Map<string, AgentTool>();
    (window as AgentTestWindow).ratingTestTools = tools;
    Object.defineProperty(document, "modelContext", {
      value: {
        async registerTool(tool: AgentTool) {
          tools.set(tool.name, tool);
        },
        unregisterTool(name: string) {
          tools.delete(name);
        },
      },
    });
  });
  await page.goto(assemblyPath);
  const dialog = await openRating(page);
  const scores = dialog.getByRole("toolbar", { name: "Оцена од 1 до 10" });
  await expect(dialog.getByRole("button")).toHaveCount(10);
  await expect(scores.getByRole("button")).toHaveCount(10);
  const snapshot = await page.evaluate(async () => {
    const tools = (window as AgentTestWindow).ratingTestTools;
    if (!tools) throw new Error("The test UI agent bridge did not register.");
    return tools.get("snapshot")?.execute({});
  });
  expect(snapshot).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        component: "toolbar",
        label: "Оцена од 1 до 10",
        buttons: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      }),
    ]),
  );
  const focused = scores.getByRole("button", { name: "8", exact: true });
  await focused.press("ArrowRight");
  const next = scores.getByRole("button", { name: "9", exact: true });
  await expect(next).toBeEnabled();
  await expect(next).toBeFocused();
  await next.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Оцените рад" })).toBeFocused();
});

test("homepage, Assembly and ranking share live vote totals", async ({
  browser,
  page,
  request,
  baseURL,
  hasTouch,
}) => {
  const endpoint = new URL("/assembly-ratings", localBackend);
  const origin = new URL(baseURL!).origin;
  expect(endpoint.hostname).toBe("127.0.0.1");
  expect(new URL(origin).hostname).toBe("127.0.0.1");

  const observer = await browser.newContext({ baseURL });
  const rankingPage = await observer.newPage();
  await rankingPage.goto(assemblyPath);
  await rankingPage
    .getByRole("region", { name: "Распоред у Великој сали" })
    .getByRole("link", { name: "Ранг-листа", exact: true })
    .click();
  await expect(rankingPage).toHaveURL(`${assemblyPath}/rang-lista`);
  const ranking = rankingPage.getByRole("table", {
    name: "Ранг-листа по укупном броју поена",
  });
  await expect(
    ranking.or(rankingPage.getByText(/добије прву оцену/)),
  ).toBeVisible();
  const rankedIds = new Set(
    await ranking
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) =>
          (link as HTMLAnchorElement).hash.replace("#poslanik-", ""),
        ),
      ),
  );
  const [deputy, otherDeputy] = directory.members.filter(
    ({ id }) => !rankedIds.has(id),
  );
  expect(
    deputy && otherDeputy,
    "The voting fixture needs two unrated deputies.",
  ).toBeTruthy();
  const rowFor = (memberId: string) =>
    ranking.getByRole("row").filter({
      has: rankingPage.locator(`a[href$="#poslanik-${memberId}"]`),
    });
  const deputyRow = rowFor(deputy.id);
  const otherRow = rowFor(otherDeputy.id);
  const deputyTotals = deputyRow.locator("td:nth-child(n+3)");
  const otherTotals = otherRow.locator("td:nth-child(n+3)");
  const rankOf = async (row: Locator) =>
    Number(await row.getByRole("cell").first().textContent());

  const fixtureCredentials: string[] = Array.from({ length: 9 }, () =>
    randomUUID(),
  );
  const extraRankingCredentials = [randomUUID(), randomUUID()];
  let visitorCredential: string | undefined;
  async function write(
    credential: string,
    score: number | null,
    challenge?: string,
    memberId = deputy.id,
  ) {
    return request.post(endpoint.href, {
      headers: { Origin: origin },
      data: {
        operation: "write",
        credential,
        memberId,
        term: directory.term,
        score,
        challenge,
      },
    });
  }

  await page.goto("/");
  const visitor = await openRating(page, deputy);
  const observerPage = await observer.newPage();
  await observerPage.goto(assemblyPath);
  await selectDeputy(observerPage, deputy);
  const assemblyResults = observerPage.getByText(/^Укупно поена:/);
  const homepageResults = page.getByText(/^Укупно поена:/);
  const scoreOption = (score: number) =>
    visitor
      .getByRole("toolbar", { name: "Оцена од 1 до 10" })
      .getByRole("button", { name: String(score), exact: true });

  try {
    await expect(assemblyResults).toHaveCount(0);
    await expect(homepageResults).toHaveCount(0);
    await expect(deputyRow).toHaveCount(0);
    expect((await write(fixtureCredentials[0], 8)).status()).toBe(403);
    expect(
      (await write(fixtureCredentials[0], 11, dummyChallenge)).status(),
    ).toBe(400);
    expect(
      (await write(fixtureCredentials[0], 8, "invalid-challenge")).status(),
    ).toBe(403);
    const writeRequest = page.waitForRequest(
      (request) =>
        request.url() === endpoint.href &&
        request.postDataJSON()?.operation === "write",
    );
    if (hasTouch) await scoreOption(6).tap();
    else await scoreOption(6).click();
    visitorCredential = (await writeRequest).postDataJSON().credential;
    const popup = page.locator("[data-assembly-rating-dialog]");
    await expect(popup).toHaveText("Ваш глас је забележен.");
    await expect(popup.getByRole("button")).toHaveCount(0);
    const closingRating = page.locator(
      '[data-assembly-rating-dialog][data-rating-feedback="saved"][data-ending-style]',
    );
    const exit = await closingRating.evaluate((dialog) => {
      const { transitionProperty, transitionDuration, scale } =
        getComputedStyle(dialog);
      return {
        transitionProperty,
        transitionDuration,
        scale,
        content: dialog.textContent,
      };
    });
    expect(exit).toEqual({
      transitionProperty: "opacity",
      transitionDuration: "0.5s",
      scale: "1",
      content: "Ваш глас је забележен.",
    });
    await expect(popup).not.toBeAttached();
    const trigger = page.getByRole("button", { name: "Оцените рад" });
    await expect(trigger).toBeFocused();
    await expect(deputyTotals).toHaveText(["6", "1"]);

    for (const credential of fixtureCredentials) {
      expect((await write(credential, 8, dummyChallenge)).status()).toBe(200);
    }
    await Promise.all([
      expect(assemblyResults).toHaveText("Укупно поена: 78 (10)"),
      expect(homepageResults).toHaveText("Укупно поена: 78 (10)"),
      expect(deputyTotals).toHaveText(["78", "10"]),
    ]);

    for (const credential of [...fixtureCredentials, visitorCredential!]) {
      expect(
        (await write(credential, 7, undefined, otherDeputy.id)).status(),
      ).toBe(200);
    }
    await expect(otherTotals).toHaveText(["70", "10"]);
    expect(await rankOf(deputyRow)).toBeLessThan(await rankOf(otherRow));
    for (const credential of extraRankingCredentials) {
      expect(
        (await write(credential, 7, dummyChallenge, otherDeputy.id)).status(),
      ).toBe(200);
    }
    await expect(otherTotals).toHaveText(["84", "12"]);
    await expect(deputyTotals).toHaveText(["78", "10"]);
    expect(await rankOf(otherRow)).toBeLessThan(await rankOf(deputyRow));

    await page
      .getByRole("region", { name: "Народна скупштина", exact: true })
      .getByRole("link", { name: "Погледај детаље" })
      .click();
    await expect(page).toHaveURL(assemblyPath);
    await selectDeputy(page, deputy);
    await trigger.click();
    await expect(popup).toHaveText("Ваш глас је већ забележен.");
    await expect(popup.getByRole("button")).toHaveCount(0);
    await expect(popup).not.toBeAttached();
    await expect(trigger).toBeFocused();
  } finally {
    await observer.close();
    if (visitorCredential) fixtureCredentials.push(visitorCredential);
    await Promise.all([
      ...fixtureCredentials.map((credential) => write(credential, null)),
      ...[...fixtureCredentials, ...extraRankingCredentials].map((credential) =>
        write(credential, null, undefined, otherDeputy.id),
      ),
    ]);
  }
});
