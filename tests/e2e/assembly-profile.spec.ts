import { expect, test } from "@playwright/test";

const assembly = "#institucija-narodna-skupstina";

test("explore Assembly seats from the homepage and open the full roster", async ({
  page,
}) => {
  await page.goto("/");
  const preview = page.getByRole("region", {
    name: "Народна скупштина",
    exact: true,
  });
  const map = preview.getByRole("region", { name: "Распоред у Великој сали" });
  const seat = map.getByRole("radio", { name: /Чупић Александар/ });
  await seat.locator("..").click();
  await expect(seat).toBeChecked();
  await expect(
    map.getByRole("region", { name: "Чупић Александар" }),
  ).toBeVisible();
  await expect(page.locator(".assembly-roster")).toHaveCount(0);
  await expect(page.getByPlaceholder("Претражите посланике")).toHaveCount(0);
  await expect(
    preview.getByRole("link", { name: /План Велике сале/ }),
  ).toHaveCount(0);

  await preview.getByRole("link", { name: "Погледај детаље" }).click();
  await expect(page).toHaveURL(/\/institucije\/skupstina\/?$/);
  await expect(page.locator(".assembly-roster")).toBeVisible();
  await expect(page.getByPlaceholder("Претражите посланике")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /План Велике сале/ }),
  ).toBeVisible();
});

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

test("show an official portrait and profile at a filtered Assembly seat", async ({
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
  const profile = map.getByRole("region", { name: "Чупић Александар" });
  await chair.hover();
  await expect(chair.locator("small")).toContainText(
    "Председник Народне скупштине",
  );
  await chair.click();
  await expect(seat).toBeChecked();
  await expect(profile).toContainText("Председник Народне скупштине");
  await expect(profile).toContainText("доцент · Сопот");
  const portrait = profile.locator("img");
  await expect(portrait).toHaveAttribute("src", "/assembly/portraits/1487.jpg");
  await expect(portrait).toBeVisible();
  expect(
    await portrait.evaluate((img) =>
      img instanceof HTMLImageElement ? img.naturalWidth : 0,
    ),
  ).toBeGreaterThan(0);
  await expect(profile.getByRole("link")).toHaveCount(0);
  await expect(profile.getByRole("button")).toHaveCount(0);
  const floor = (await map.locator(".member-map-floor").boundingBox())!;
  const selection = map.locator(".member-map-selection");
  expect(await selection.evaluate((panel) => panel.scrollHeight)).toBe(
    await selection.evaluate((panel) => panel.clientHeight),
  );
  const card = (await selection.boundingBox())!;
  const photo = (await portrait.boundingBox())!;
  const name = (await profile
    .getByText("Чупић Александар", { exact: true })
    .boundingBox())!;
  if (floor.width >= 768) {
    expect(card.x + card.width / 2).toBeCloseTo(floor.x + floor.width / 2, 0);
    expect(card.y).toBeGreaterThan(floor.y);
    expect(card.y + card.height).toBeLessThan(floor.y + floor.height * 0.55);
    expect(card.height).toBeGreaterThan(card.width);
    expect(photo.y + photo.height).toBeLessThan(name.y);
  } else {
    expect(card.y).toBeGreaterThanOrEqual(floor.y + floor.height);
    expect(photo.x + photo.width).toBeLessThan(name.x);
  }

  await profile.getByText("доцент · Сопот").click();
  await expect(seat).toBeChecked();
  await seat.press("Escape");
  await expect(profile).toHaveCount(0);
  await expect(seat).toBeFocused();
  await seat.press("Space");
  await expect(profile).toBeVisible();
  await map.getByRole("heading").click();
  await expect(seat).not.toBeChecked();
  await expect(profile).toHaveCount(0);
  await chair.click();
  await page.getByPlaceholder("Претражите посланике").click();
  await expect(seat).not.toBeChecked();

  await page.getByPlaceholder("Претражите посланике").fill("dejan bodiroga");
  await map
    .getByRole("radio", { name: "Бодирога Дејан" })
    .locator("..")
    .click();
  const observedProfile = map.getByRole("region", { name: "Бодирога Дејан" });
  await expect(observedProfile).toContainText("спортиста · Београд");
  await expect(observedProfile).not.toContainText("Стари град");
  await expect(observedProfile.getByRole("link")).toHaveCount(0);

  if (floor.width >= 768) {
    await page.getByPlaceholder("Претражите посланике").clear();
    await map.getByRole("radio", { name: "Бакић Јово" }).locator("..").click();
    const nearbySeat = map
      .getByRole("radio", { name: "Гашић Југослав" })
      .locator("..");
    await nearbySeat.hover();
    await expect(nearbySeat.locator("small")).toHaveText("Гашић Југослав");
    const cardLayer = await selection.evaluate((panel) =>
      Number(getComputedStyle(panel).zIndex),
    );
    const labelLayer = await nearbySeat.evaluate((label) =>
      Number(getComputedStyle(label).zIndex),
    );
    expect(labelLayer).toBeGreaterThan(cardLayer);
  }
  expect(hydrationErrors).toEqual([]);
});

test("group the Assembly roster and open portraits from its links", async ({
  page,
}, testInfo) => {
  await page.goto("/institucije/skupstina");
  const roster = page.locator(".assembly-roster");
  const sns = roster.getByRole("region", {
    name: "Александар Вучић - Србија побеђује",
  });
  const minorities = roster.getByRole("region", {
    name: "Посланици са мањинских листа",
  });
  const students = roster.getByRole("region", {
    name: "Студентска листа – Студенти побеђују",
  });
  await expect(sns.getByRole("listitem")).toHaveCount(102);
  await expect(minorities.getByRole("listitem")).toHaveCount(7);
  await expect(students.getByRole("listitem")).toHaveCount(140);
  await expect(
    roster
      .getByRole("region", { name: "Без посланичке групе" })
      .getByRole("listitem"),
  ).toHaveCount(1);

  const [left, middle, right] = await Promise.all([
    sns.boundingBox(),
    minorities.boundingBox(),
    students.boundingBox(),
  ]);
  if (testInfo.project.name === "desktop") {
    expect(left!.x + left!.width).toBeLessThan(middle!.x);
    expect(middle!.x + middle!.width).toBeLessThan(right!.x);
  } else {
    expect(left!.y + left!.height).toBeLessThan(middle!.y);
    expect(middle!.y + middle!.height).toBeLessThan(right!.y);
  }

  await page.getByPlaceholder("Претражите посланике").fill("usame zukorlic");
  await expect(roster.getByRole("listitem")).toHaveCount(1);
  const link = minorities.locator("#poslanik-1295").getByRole("link");
  await expect(link).toHaveAttribute("href", "#mapa-poslanika");
  await link.click();
  await expect(page).toHaveURL(/#mapa-poslanika$/);
  const map = page.locator("#mapa-poslanika");
  await expect(
    map.getByRole("radio", { name: "Зукорлић Усаме" }),
  ).toBeChecked();
  await expect(
    map.getByRole("region", { name: "Зукорлић Усаме" }).locator("img"),
  ).toBeInViewport();

  await page.getByPlaceholder("Претражите посланике").fill("jovo bakic");
  await students.getByRole("link", { name: "Бакић Јово" }).press("Enter");
  await expect(map.getByRole("radio", { name: "Бакић Јово" })).toBeChecked();
  await expect(
    map.getByRole("region", { name: "Бакић Јово" }).locator("img"),
  ).toBeInViewport();
});

test("highlight hovered and selected seats while respecting reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/institucije/skupstina#mapa-poslanika");
  const seat = page.getByRole("radio", { name: "Бакић Јово" });
  const chair = seat.locator("..");
  const dot = chair.locator("span");
  const fill = () =>
    dot.evaluate((element) => getComputedStyle(element).backgroundColor);
  const initialColor = await fill();
  let hoverColor: string | undefined;

  if (
    await page.evaluate(
      () => matchMedia("(hover: hover) and (pointer: fine)").matches,
    )
  ) {
    await chair.hover();
    await expect.poll(fill).not.toBe(initialColor);
    await expect(dot).toHaveCSS("translate", "0px -1px");
    hoverColor = await fill();
  }
  await chair.click();
  await expect(seat).toBeChecked();
  await expect.poll(fill).not.toBe(initialColor);
  await expect(dot).toHaveCSS("translate", "0px -2px");
  await expect(dot).toHaveCSS("outline-style", "none");
  const selectedStyle = await dot.evaluate((element) => {
    const highlight = getComputedStyle(element);
    return {
      fill: highlight.backgroundColor,
      outlineStyle: highlight.outlineStyle,
      shadow: highlight.boxShadow,
    };
  });
  if (hoverColor) expect(selectedStyle.fill).toBe(hoverColor);
  const yellowHue = Number(
    selectedStyle.fill.match(/^oklch\([^ ]+ [^ ]+ ([\d.]+)/)?.[1],
  );
  expect(yellowHue).toBeGreaterThan(99);
  expect(yellowHue).toBeLessThan(118);
  expect(selectedStyle.outlineStyle).toBe("none");
  expect(selectedStyle.shadow).toBe("none");
  await page.mouse.move(0, 0);
  await expect(dot).toHaveCSS("background-color", selectedStyle.fill);

  await seat.press("Escape");
  await seat.press("Space");
  await expect(seat).toBeChecked();
  await expect(dot).toHaveCSS("translate", "none");
  await expect(dot).toHaveCSS("outline-style", "solid");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await chair.click();
  await expect(dot).toHaveCSS("translate", "none");
  await expect(dot).toHaveCSS("background-color", selectedStyle.fill);
});

test("the Assembly seats and legend use the palette for the active theme", async ({
  page,
}) => {
  const lightColors = [
    "rgb(189, 73, 60)",
    "rgb(45, 110, 172)",
    "rgb(95, 144, 63)",
  ];
  const darkColors = [
    "rgb(225, 96, 83)",
    "rgb(82, 154, 232)",
    "rgb(125, 182, 78)",
  ];
  const ungroupedColor = "rgb(104, 107, 96)";

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/institucije/skupstina");
  const map = page.locator("#mapa-poslanika");
  const seats = map.locator(".member-seat input:enabled + span");
  const seatColors = () =>
    seats.evaluateAll((chairs) =>
      [
        ...new Set(
          chairs.map((chair) => getComputedStyle(chair).backgroundColor),
        ),
      ].sort(),
    );
  const legendColors = () =>
    map
      .locator(".member-map-key li i")
      .evaluateAll((markers) =>
        markers.map((marker) => getComputedStyle(marker).backgroundColor),
      );

  await expect(map).toHaveCSS("background-color", "rgb(255, 254, 250)");
  await expect(map).toHaveCSS("color", "rgb(40, 40, 36)");
  expect(await seatColors()).toEqual([...lightColors, ungroupedColor].sort());
  expect(await legendColors()).toEqual(lightColors);

  await page.getByRole("button", { name: "Тамна тема" }).click();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(13, 13, 13)",
  );
  await expect(map).toHaveCSS("background-color", "rgb(23, 23, 23)");
  await expect(map).toHaveCSS("color", "rgb(242, 242, 242)");
  expect(await seatColors()).toEqual([...darkColors, ungroupedColor].sort());
  expect(await legendColors()).toEqual(darkColors);
});
