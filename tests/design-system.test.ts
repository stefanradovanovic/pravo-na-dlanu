import { test, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createElement as h, act } from "react";
import { articleHeadings } from "../src/lib/document-navigation";
import { articleNavigationEntries } from "../src/lib/article-navigation-entries";
import { getCourtDirectory } from "../src/lib/court-directory";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { getLearningCatalog } from "../src/lib/learning-content";

const dom = new JSDOM("<!doctype html><html lang='sr'><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (!(key in globalThis))
    Object.defineProperty(globalThis, key, {
      value: Reflect.get(dom.window, key),
      configurable: true,
      writable: true,
    });
}
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Element",
  "Node",
  "MutationObserver",
  "CustomEvent",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "HTMLDialogElement",
  "DOMRect",
  "getComputedStyle",
] as const) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
}
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  __UI_SDK_STRICT__: true,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});
Object.defineProperty(dom.window, "matchMedia", {
  value: () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }),
});
dom.window.HTMLElement.prototype.showPopover = function () {};
dom.window.HTMLElement.prototype.hidePopover = function () {};
dom.window.Element.prototype.getAnimations = () => [];
dom.window.Element.prototype.scrollIntoView = function () {};
dom.window.Element.prototype.checkVisibility = () => true;
dom.window.Element.prototype.getClientRects = () =>
  [] as unknown as DOMRectList;
dom.window.document.elementFromPoint = () => null;
dom.window.document.elementsFromPoint = () => [];
const { render, fireEvent, cleanup } = await import("@testing-library/react");
const { createAgent } = await import("@ui-sdk/react/agent");
const { ReaderSettings } = await import("../src/components/reader-settings");
const { ArticleNavigation } =
  await import("../src/components/article-navigation");
const { BackToTop } = await import("../src/components/back-to-top");
const { GlossaryBrowser } =
  await import("../src/components/learning/glossary-browser");
const { InstitutionDirectory } =
  await import("../src/app/institucije/institution-directory");
const { CourtDirectory } =
  await import("../src/app/institucije/court-directory");
const { institutionGroups } = await import("../src/lib/institution-directory");
const { LearningWorkspace } =
  await import("../src/components/learning/learning-workspace");
const agent = createAgent();
after(() => {
  cleanup();
  dom.window.close();
});

test("an agent can filter institutions through the directory search", async () => {
  const view = render(
    h(InstitutionDirectory, {
      groups: institutionGroups,
      courts: getCourtDirectory(),
    }),
  );
  const label = "Пронађи институцију";
  try {
    assert.ok(
      agent.snapshot().some((entry) => !entry.offPage && entry.label === label),
    );
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: label, action: "setValue", args: ["pasos"] }],
      });
      assert.ok(result.ok, result.error?.message);
    });
    assert.ok(
      view.getByRole("heading", { name: "Министарство унутрашњих послова" }),
    );
    assert.equal(
      view.queryByRole("heading", { name: "Министарство здравља" }),
      null,
    );
  } finally {
    view.unmount();
  }
});

test("an agent can search court names and territories through the named input", async () => {
  const view = render(
    h(CourtDirectory, { data: getCourtDirectory("2026-11-25") }),
  );
  const label = "Пронађи суд";
  try {
    assert.ok(
      agent.snapshot().some((entry) => !entry.offPage && entry.label === label),
    );
    for (const query of [
      "основни суд чачак",
      "Osnovni sud Čačak",
      "osnovni sud cacak",
    ]) {
      await act(async () => {
        const result = await agent.act({
          steps: [{ ref: label, action: "setValue", args: [query] }],
        });
        assert.ok(result.ok, result.error?.message);
      });
      assert.ok(view.getByText("Основни суд у Чачку", { exact: true }));
      assert.equal(
        view.queryByText("Основни суд у Нишу", { exact: true }),
        null,
      );
    }
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: label, action: "setValue", args: ["upravni sud nis"] }],
      });
      assert.ok(result.ok, result.error?.message);
    });
    assert.ok(view.getByText("Одељење у Нишу", { exact: true }));
  } finally {
    view.unmount();
  }
});

test("an agent can search the glossary through its named input and reset the filter", async () => {
  const references = [{ source: "ustav", label: "Устав, чл. 170" }];
  const view = render(
    h(GlossaryBrowser, {
      topics: [
        {
          id: "sudovi",
          title: "Судови",
          entries: [
            {
              id: "zalba",
              title: "Жалба",
              definition: "Правно средство.",
              references,
            },
            {
              id: "sud",
              title: "Суд",
              definition: "Одлучује у предмету.",
              references,
            },
          ],
        },
      ],
      sources: { ustav: { url: "https://www.pravno-informacioni-sistem.rs/" } },
    }),
  );
  try {
    const search = agent
      .snapshot()
      .find((entry) => !entry.offPage && entry.label === "Претражи речник");
    const searchLabel = search?.label;
    assert.ok(searchLabel);
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: searchLabel, action: "setValue", args: ["zalba"] }],
      });
      assert.ok(result.ok, result.error?.message);
    });
    assert.ok(view.getByRole("heading", { name: "Жалба" }));
    assert.equal(view.queryByRole("heading", { name: /^Суд$/ }), null);
    fireEvent.click(
      view.getByRole("button", { name: "Прикажи све одреднице" }),
    );
    assert.equal(document.activeElement, view.getByRole("searchbox"));
    assert.ok(view.getByRole("heading", { name: /^Суд$/ }));
  } finally {
    view.unmount();
  }
});

test("an agent can choose the expert level and start a case study", async () => {
  const view = render(
    h(
      SearchParamsContext.Provider,
      { value: new URLSearchParams({ tema: "rad" }) },
      h(LearningWorkspace, { catalog: getLearningCatalog() }),
    ),
  );
  try {
    const levels = agent
      .snapshot()
      .find((entry) => !entry.offPage && entry.label === "Ниво вежбања");
    assert.ok(levels);
    await act(async () => {
      const result = await agent.act({
        steps: [
          { ref: levels.ref, action: "setValue", args: ["Напредни ниво"] },
        ],
      });
      assert.ok(result.ok, result.error?.message);
    });
    const start = "Почни студије случаја";
    assert.ok(view.getByRole("button", { name: start }));
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: start, action: "press" }],
      });
      assert.ok(result.ok, result.error?.message);
    });
    assert.ok(view.getByText("Измишљена студија случаја"));
  } finally {
    view.unmount();
    window.localStorage.clear();
  }
});

test("the floating control becomes available after scrolling and restores focus when pressed by an agent", async (t) => {
  let reportIntersection: IntersectionObserverCallback | undefined;
  const scrollTo = t.mock.method(dom.window, "scrollTo", () => {});
  const originalObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    constructor(callback: IntersectionObserverCallback) {
      reportIntersection = callback;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  const name = "Назад на врх странице";
  const view = render(
    h(
      "div",
      null,
      h("div", { id: "page-top" }),
      h("a", { id: "site-brand", href: "/" }, "Право на длану"),
      h(BackToTop),
    ),
  );
  try {
    assert.equal(view.queryByRole("button", { name }), null);
    await act(async () => {
      assert.ok(reportIntersection);
      reportIntersection(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    assert.ok(
      agent.snapshot().some((entry) => !entry.offPage && entry.label === name),
    );
    const result = await agent.act({ steps: [{ ref: name, action: "press" }] });
    assert.ok(result.ok, result.error?.message);
    assert.deepEqual(scrollTo.mock.calls[0]?.arguments, [{ top: 0 }]);
    assert.equal(document.activeElement?.id, "site-brand");
  } finally {
    view.unmount();
    globalThis.IntersectionObserver = originalObserver;
  }
});

test("reader settings are named, operable by agents, bounded, and leave the law intact", async () => {
  const view = render(
    h(
      "main",
      { className: "full-document" },
      h(ReaderSettings),
      h(
        "article",
        { id: "tekst-zakona" },
        "Изворни текст прописа остаје непромењен.",
      ),
    ),
  );
  const names = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more")
    .map((entry) => entry.label);
  for (const name of [
    "Смањи текст",
    "Увећај текст",
    "Врати подразумевану величину текста",
  ])
    assert.ok(names.includes(name), name);
  assert.ok(names.every(Boolean), "Every exposed control has a name");
  const article = view.container.querySelector("article")!;
  const before = article.textContent;
  const reader = view.container.querySelector("main")!;
  assert.equal(reader.style.getPropertyValue("--reader-font-size"), "18px");
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: "Увећај текст", action: "press" }],
      });
      assert.equal(result.ok, true, result.error?.message);
    });
  }
  assert.equal(reader.style.getPropertyValue("--reader-font-size"), "24px");
  assert.equal(
    (view.getByRole("button", { name: "Увећај текст" }) as HTMLButtonElement)
      .disabled,
    true,
  );
  fireEvent.click(
    view.getByRole("button", { name: "Врати подразумевану величину текста" }),
  );
  assert.equal(reader.style.getPropertyValue("--reader-font-size"), "18px");
  fireEvent.click(view.getByRole("button", { name: "Смањи текст" }));
  assert.equal(reader.style.getPropertyValue("--reader-font-size"), "16px");
  assert.equal(
    (view.getByRole("button", { name: "Смањи текст" }) as HTMLButtonElement)
      .disabled,
    true,
  );
  assert.equal(article.textContent, before);
  cleanup();
});

test("article search accepts agent changes and both scripts without losing native fragments", async () => {
  const markdown =
    "Република Србија\n\n## Члан 1.\n\nТекст.\n\n## Члан 12а.\n\nДруги текст.\n\n## Члан 1.\n";
  const headings = articleHeadings(markdown);
  const view = render(
    h(
      "main",
      { className: "full-document" },
      h(
        "aside",
        { className: "reader-sidebar" },
        h(ArticleNavigation, {
          headings: articleNavigationEntries(headings, markdown, {
            id: "test",
          }),
        }),
      ),
      h(
        "article",
        {},
        ...headings.map((heading) =>
          h(
            "h2",
            { key: heading.id, id: heading.id, tabIndex: -1 },
            heading.label,
          ),
        ),
      ),
    ),
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const entries = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more");
  assert.ok(
    entries.every((entry) => Boolean(entry.label)),
    "Every exposed reader control has a name",
  );
  assert.ok(entries.some((entry) => entry.label === "Иди на члан"));
  for (const query of ["Члан 12а", "Član 12a", "clan 12a"]) {
    await act(async () => {
      const result = await agent.act({
        steps: [{ ref: "Иди на члан", action: "setValue", args: [query] }],
      });
      assert.equal(result.ok, true, result.error?.message);
    });
    assert.equal(
      view.container.querySelectorAll(".article-navigation li a").length,
      1,
    );
    assert.equal(
      view.container
        .querySelector(".article-navigation li a")
        ?.getAttribute("href"),
      "#clan-12a",
    );
  }
  assert.equal(headings[0].subtitle, "Република Србија");
  assert.equal(
    headings[1].subtitle,
    undefined,
    "A sentence from the source is not a caption",
  );
  assert.equal(headings[2].id, "clan-1-2");
  assert.equal(
    view.container.querySelector("details")?.open,
    true,
    "Contents are present before interaction on desktop",
  );
  cleanup();
});
