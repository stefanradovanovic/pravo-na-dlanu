# Reading Desk — design QA

Review date: 2026-11-14. Branch: `codex/design-system-rebuild`.
Scope: the selected third concept, shared UI SDK component facade, catalog, reader, learning controls, and living design-system reference.

**Final result: passed**

No actionable P0/P1/P2 findings remain in the reviewed flows. This is acceptance of the selected design direction and tested behavior, not a claim of pixel-identical copying or a full accessibility certification.

## Visual truth and evidence

- Source: [selected option 3](docs/design/reading-desk.png).
- Implementation: [production reader](docs/design/qa/reader-desktop.jpg), [mobile reader](docs/design/qa/reader-mobile.jpg), [mobile article](docs/design/qa/reader-mobile-article.jpg).
- Supporting screens: [catalog](docs/design/qa/catalog-desktop.jpg), [design-system reference](docs/design/qa/design-system.jpg), [learning feedback](docs/design/qa/learning-mobile.jpg), [482-character title at 320 px](docs/design/qa/long-title-320.jpg).
- Local production preview: http://127.0.0.1:3027/propisi/ustav-republike-srbije
- Reference page: http://127.0.0.1:3027/dizajn-sistem

The source and final production screenshot were opened together in one comparison input. The same comparison also included the mobile reader and corrected learning feedback.

| Capture            | CSS viewport         | Image pixels     | Density / comparison treatment                              |
| ------------------ | -------------------- | ---------------- | ----------------------------------------------------------- |
| Generated source   | Intended 1487 × 1058 | 1487 × 1058 PNG  | No browser density metadata; treated as the reference frame |
| Production desktop | 1487 × 1058          | 1472 × 1048 JPEG | Browser DPR ≈ 1; capture tool scales the frame slightly     |
| Production mobile  | 390 × 844            | 375 × 811 JPEG   | Browser DPR ≈ 1; capture tool scales the frame slightly     |

Geometry was compared in CSS coordinates: desktop capture coordinates map by 1487/1472 horizontally and 1058/1048 vertically. Mobile coordinates map by 390/375 and 844/811. No raster modification was applied. The small capture scaling is not classified as design drift. Actual sidebar width, font sizes, overflow, and anchor positions were measured from the rendered DOM.

State: light theme, complete Constitution, initial document position, examples collapsed. The concept omits the real preamble and source announcements and shows article 1 selected. The implementation retains that source material, so its initial active state and above-the-fold legal text intentionally differ. Article 1 is not falsely selected while the reader is still in the preamble.

Focused inspection covered the header, title and provenance, controls, and contents column in the same full-resolution image pair. Separate crops were unnecessary: labels and icons were readable in those images, and DOM measurements resolved the font-size and geometry questions. Mobile screenshots provided a closer view of controls and wrapping.

## Findings and comparison history

| Iteration   | Finding / impact                                                                                                                                                                                                                                   | Fix and post-fix evidence                                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — blocked | **P2: narrow contents column and mismatched header.** The [first pass](docs/design/qa/reader-first-pass.jpg) used an 18rem column, dark search, and a weaker active navigation treatment. This changed the major-region proportions and hierarchy. | Increased contents to 21rem / 336 CSS px, restored a white header search and filled teal navigation, and strengthened the title. [Second pass](docs/design/qa/reader-second-pass.jpg), then final desktop capture, compared against the source. |
| 1 — blocked | **P2: provenance consumed excessive vertical space.** The source used compact metadata and fine rules.                                                                                                                                             | Consolidated access date, coverage badge and source version; used an unboxed provenance row while keeping every required source warning visible. Final desktop capture shows the corrected rhythm.                                              |
| 2 — blocked | **P2: mobile search icon was hidden and document tools wrapped.** A legacy selector hid the new icon; copy/print text crowded the toolbar.                                                                                                         | Removed the obsolete selector and used named icon controls at narrow widths. [Final mobile reader](docs/design/qa/reader-mobile.jpg) shows one tools row, visible search and no horizontal overflow.                                            |
| 2 — blocked | **P2: completed exercise answers lost readability.** Disabled button opacity also faded the educational text.                                                                                                                                      | Kept completed choices at full opacity while retaining disabled semantics. [Final feedback](docs/design/qa/learning-mobile.jpg); all three rendered choices measured opacity 1.                                                                 |
| 3 — blocked | **P2: selected header state was only 2.57:1 against the header.** White text passed, but the state fill needed stronger contrast.                                                                                                                  | Added `--chrome-selected: #167e73`: 3.18:1 against the header and 4.92:1 for white text. Rebuilt and captured the final desktop reader; the final combined comparison passed.                                                                   |

Additional audit fixes: shared control dimensions and focus treatment, 16px inputs including tablets, contained contents scrolling, an SSR-visible native contents disclosure, immediate tabs and article navigation, reduced-motion rules, and live announcements limited to result counts. Lint findings about the mobile link, unused import, and caption description were fixed; captions now use `aria-describedby`.

## Required fidelity surfaces

| Surface                | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts / typography     | Serif titles and legal prose, sans-serif navigation and metadata match the direction. The generated image has no reliable font metadata. Self-hosted Literata and IBM Plex Sans provide Cyrillic and Latin coverage; actual font loading was confirmed in the browser. Reader default is a real 18px / 30.6px, with 16–24px controls; the concept's illustrated prose appears larger despite its “18” control. The narrower 65ch reading measure and explicit size control are intentional production choices. Title reaches 48px on desktop and wraps on mobile. |
| Spacing / layout       | Continuous reading surface, pale full-height contents column, slate header, fine rules and restrained 6px corners preserve the composition. The reader uses a 336px sidebar and responsive main column; mobile turns contents into a native disclosure. Existing previous/next controls are retained. The extra source material and collapsed examples are intentional content requirements, not omitted implementation.                                                                                                                                          |
| Colors / tokens        | Slate, paper, teal, muted metadata and pale contents are centralized as semantic tokens. Text, control edges, selected navigation and focus indicators have distinct roles. The header's selected teal is slightly brighter than the action teal to meet state contrast.                                                                                                                                                                                                                                                                                          |
| Assets / image quality | The target has no photography or illustration. Standard scales, search, printer, arrows and control symbols use the existing Lucide library. No hand-drawn SVG, CSS illustration, fake imagery or bitmap UI is used in the application. The generated reference remains documentation only.                                                                                                                                                                                                                                                                       |
| Copy / content         | Interface and learning copy remain Serbian Cyrillic. Actual law titles, source version, access date, coverage and links are preserved. Access date is explicitly not legal verification. Fictional examples remain labeled and separated from legal text. No files under `content/` changed.                                                                                                                                                                                                                                                                      |

Curated chapter grouping from the concept is not implemented: the current corpus parser guarantees article anchors, not a uniform chapter hierarchy. The production contents uses real article captions when confidently recognized and distinguishes repeated numbers. More detailed chapter grouping is a P3 follow-up requiring its own corpus parsing validation.

## Browser verification

Performed through the in-app Chromium browser on development and the final static export:

- Catalog title search: `zastit` and `заштит` both returned 43 documents. Empty results appeared correctly; clearing restored focus to the search field.
- Production full-text search: `ljudska prava` returned 80 documents. A snippet opened the Constitution at `#clan-22`; the return link retained the search context.
- Map nodes rendered with accessible names on a fresh production load.
- Reader controls hydrated as isolated roots. Three size increases reached 24px / 40.8px; reset returned to 18px. Copy displayed “Линк је копиран”.
- Article search accepted Cyrillic, accented Latin and plain Latin. On mobile, Enter closed contents, focused the article and placed it below sticky navigation: heading top 109.35px, sidebar bottom 96.80px.
- The 482-character title wrapped without page or title overflow at 320px. The longest citation record retained its heading plus the 474-character remaining version line, without truncation or page overflow.
- The law with 1,094 article entries filtered repeated article 60 into two distinct links. Selecting the second reached and focused `#clan-60-2`.
- At 1024 × 360 the sidebar/navigation became non-sticky. At 820 × 1000 the input remained 16px, and the header and document fit.
- SDK tabs, select options, dialog and sheet opened and closed correctly. Keyboard selection worked; Escape restored focus to the opening control. The sheet fit a 320 × 740 viewport.
- Learning choice → confirmation → explanation worked; focus moved to feedback and the saved session resumed in production. Completed answers remained readable.
- The facsimile viewer rendered both page canvases; entering page 2 and choosing “Иди” navigated to the second scan.
- Development WebMCP changed a gallery tab, input and select through the same controlled state as human input. Production does not mount the development agent bridge.

Measured contrast from rendered colors / standard sRGB calculation:

| Pair                          | Ratio   |
| ----------------------------- | ------- |
| Body text / page              | 12.95:1 |
| Metadata / page               | 5.60:1  |
| Primary action text / fill    | 6.10:1  |
| Input edge / input surface    | 3.12:1  |
| Selected header text / fill   | 4.92:1  |
| Selected header fill / header | 3.18:1  |

Fresh production reader, catalog, learning, gallery and scan flows showed no console errors or warnings in the inspected logs. Development hot reload emitted a React Flow node-types warning; those maps are already module-level constants, and the warning did not recur in fresh production checks.

## Automated validation

| Command / check                                                                  | Result                                                                                                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                                       | Exit 0; 50/50 passed, including corpus scope, legal references, article anchors and the new reader/agent integration tests |
| `npm run typecheck`                                                              | Exit 0                                                                                                                     |
| `npm run lint`                                                                   | Exit 0 after fixing three findings                                                                                         |
| `npm run build`                                                                  | Exit 0; 845 text documents indexed and all 846 law pages exported                                                          |
| `npx tsx scripts/build-static.ts` after final CSS changes                        | Exit 0; final production export refreshed, including TypeScript checks                                                     |
| `npx tsx --test tests/design-system.test.ts` after caption accessibility changes | Exit 0; 2/2 passed                                                                                                         |
| `npm run hosting:check`                                                          | Exit 0; all 846 standalone law pages and hosting constraints validated                                                     |
| Static HTML assertions                                                           | Exit 0; open contents, first and final Constitution articles, source version and settings island present before JavaScript |
| `git diff --check`                                                               | Exit 0                                                                                                                     |
| `git diff --exit-code -- content`                                                | Exit 0; no corpus or educational-content changes                                                                           |

The separate Playwright CLI suite was updated for the new font defaults but not run. Browser verification used the required computer-use interface. Reduced-motion, coarse-pointer sizing and print styles were reviewed in CSS; physical touch devices, Safari/Firefox, OS-level reduced-motion switching, actual printing and a screen reader were not tested. Static HTML was inspected directly; a JavaScript-disabled browser session was not used. No performance trace was recorded.

UI SDK is `0.1.0-beta.1`, pinned by the lockfile and isolated behind the existing component facade. Future upgrades need the same SSR, focus, keyboard and static-export checks.

## Implementation checklist

- [x] Read all 19 AI for UI skills; installed 17 relevant web skills plus the UI SDK skill, with provenance and licenses.
- [x] Document the selected direction, semantic tokens, type scale and component contracts.
- [x] Apply shared UI SDK controls and responsive Reading Desk layouts.
- [x] Preserve complete legal text, source metadata, native links and static rendering.
- [x] Fix all identified P0/P1/P2 issues and repeat the visual comparison.
- [x] Pass required checks, save browser evidence and leave the local production preview running.

final result: passed
