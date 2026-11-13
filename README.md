# Право на длану

A Serbian Cyrillic guide to the Constitution and laws of Serbia: PIS categories, an interactive law map, whole-document readers, cross-script search and fictional learning examples.

## Run locally

Requires Node.js 24 and npm. No database, CMS, API key or paid service.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The predev step builds a local Pagefind index from Markdown. To use the existing preview port, run `npm run dev -- --hostname 127.0.0.1 --port 3017`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

`npm run build` creates a static site in `out/`; `npm start` serves that export. Run `npm run hosting:check` to verify the export. The checked-in Vercel configuration publishes it without runtime functions. See [free hosting setup and limits](docs/hosting.md).

## Reading and search navigation

HTML laws have an article contents panel with source captions, section jumps, and search by article number or words in the law. The “Читај закон” link skips directly to the continuous source text; source/version/coverage details remain available in a native disclosure, and fictional examples follow the law. Shareable fragments such as `#clan-12a` are unchanged. Repeated article numbers in amendment texts receive occurrence suffixes (`#clan-1-2`). Scan readers retain their existing page navigation.

The catalogue defaults to a list; `view=map` opens the optional map. Mobile category selection uses the shared Select primitive, and fullscreen maps use Dialog for keyboard focus and Escape handling. Only the fields used by the catalogue are serialized to the browser.

Search URLs preserve `q`, `category`, `mode`, `view`, and the one-based `page`. Title search is the default; `mode=full` searches words and preserves Pagefind relevance order, while `mode=phrase` searches an exact phrase. Empty title searches offer full-text recovery without clearing the query. Everyday queries also suggest clearly separated editorial topics and their source laws. Result links carry a validated local `returnTo` URL. Full-text results lazily load metadata and original-script excerpts for visible laws and link to the matching article. These excerpts are derived search assets, not separate law documents. The index, category filters and excerpts are rebuilt together by `npm run search:index`.

The static build normalizes nested Windows segment export paths into the dotted filenames requested by Next's client navigation. `hosting:check` validates those aliases; the adapter is idempotent and rejects collisions without modifying dependencies.

After building, run the desktop/mobile browser checks with `npx playwright install chromium` followed by `npm run test:e2e`. To use an installed Edge browser instead, set `PLAYWRIGHT_CHANNEL=msedge`. The tests serve the static export on port 3027.

On screens up to 800px wide, the shared shadcn button variants form a fixed bottom navigation bar for home, search, learning, the reading guide and the Constitution. Search jumps to the homepage search field; project information remains available in the footer. The bar replaces the header links on mobile, marks the active section, respects device safe areas, and reserves page space so the footer remains reachable. Standalone law pages render their own active navigation at build time; all five links work without JavaScript. The bar is hidden on desktop and in print.

## Learning through everyday situations

`/ucenje` offers five learning paths: constitutional rights, work, consumer rights, personal data, and access to public information. The bank has 48 base questions and ten paired “what if” variations (58 questions total), including research questions that open the existing search and whole-law readers. Ordinary sessions contain five questions; “what if” sessions keep two original/changed pairs together. Every answer has an explanation and an article link into the canonical complete law. Topic pages state learning outcomes and introduce the rules before practice; completed sessions let readers reopen every answer and explanation.

`/vodic` introduces a five-step method for reading laws, distinguishes source text from editorial explanations and fictional situations, and includes a searchable 12-term reading glossary. The guide and glossary remain readable without JavaScript. Homepage situation links provide direct entry to all five topics. The consumer lessons use the PIS-listed 2026 law and describe their application scope.

The homepage, navigation (including mobile), and relevant law readers link to learning. Topic and glossary search accept Cyrillic, Latin, and input without diacritics; topic keywords also recognize familiar everyday terms. Unmatched topic searches link into the full-text law search. Progress and the active session are stored only in this browser under `pravo-na-dlanu.learning.v1`. Missed questions are available for immediate review; successive correct answers schedule review after 1, 3, 7, and 14 days, with the next review date shown. Users can resume a session, review their progress, or erase it. Storage failures leave the session usable in memory with a visible notice.

Questions remain in `content/learning.json` alongside the existing editorial material. Each question group pins the source's actual citation, SHA-256 and the date of source comparison. A changed citation or source checksum holds the affected questions, lessons and reader examples for editorial review. Legacy reader examples without a question pin are checked against their saved law citation; missing article anchors also withhold affected examples. Updating a pin requires comparing the content again; the daily source refresh does not update these pins. Question/content revisions invalidate incompatible saved answers and sessions. `getLearningCatalog()` validates IDs, choices and article anchors during the build; learning tests check behavior and source-change handling.

All scenarios are fictional and the explanations remain machine-prepared editorial material without professional legal review. Source comparison is not legal verification. The full quoted laws stay in their original complete Markdown documents.

## Content and sources

- One law = one Markdown document in `content/corpus/` and one canonical `/propisi/{slug}` page.
- Official register categories connect to laws on the canvas. Articles stay headings within a continuous document.
- `content/registry.json` records exact coverage, source IDs, citations, checksums and retrieval dates.
- The catalog covers records classified as Закон or Устав in PIS's current national and education registers (458, 459): domestic laws and the Constitution. Treaty register 206 and the historical Gazette archive are excluded. Older laws still in the current register are retained; publication year alone does not determine legal status.
- The snapshot contains 846 documents, all readable in the app: 845 whole HTML bodies and one complete local scan. One incorrect PIS HTML response is quarantined; the correct law is displayed from its PIS Gazette scan with explicit page provenance. Each scan keeps one Markdown document and reader, backed by local PDF assets. Body search covers HTML texts; scans are searchable by title. Linked HTML attachments are not locally archived.
- Learning examples are explicitly fictional, machine-prepared editorial drafts, not professionally reviewed legal advice. Their source references lead to complete laws.

Legal sources are **PIS only**. No alternate publishers or Parliament fallbacks are used.

Read [the source contract](docs/sources.md) for exact scope and limitations. The visible website always distinguishes catalog coverage from full-text coverage. Do not market this snapshot as a legally verified, permanently current archive.

## Refresh sources

```sh
npm run laws:sync
npm run laws:audit
npm run search:index
```

A daily GitHub Action refreshes public official sources, audits them and commits only a successfully validated snapshot. Manual runs are available in Actions. For an interrupted local download use `npm run laws:resume`; this uses cache and is not a fresh legal check. A deployed site must rebuild after source changes. Explanations require separate editorial review when the relevant laws change.

## Stack

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui (Base UI), React Flow, sanitized Markdown, PDF.js and Pagefind. Existing input, button, tab and badge primitives are reused throughout. Searches normalize Serbian Cyrillic, Latin and diacritic-free input.

### Design system

Open `/dizajn-sistem` for the living component reference: colors, Cyrillic typography, spacing, interactive shadcn/ui states, and legal-content patterns. Shared tokens in `src/app/design-tokens.css` are applied across the catalog, map, learning screens, and standalone law reader. See [the design system and Figma mapping](docs/design-system.md) before adding or changing UI patterns.

### Dependency security

Run `npm audit` to check the complete dependency tree, including development tools. Scoped overrides pin `serve`'s `compression` to 1.8.2 and the TypeScript ESLint parser's `minimatch` to 11.0.4 until those upstream packages adopt patched versions. The latter supports this project's Node.js 24 requirement; lint validates the parser integration.

The shadcn CLI is not installed because its `deepmerge` dependency has no patched release. Existing shadcn/ui components remain in `src/components/ui/`. Their shared stylesheet is an unmodified copy of `shadcn@4.23.0/dist/tailwind.css` in `src/app/vendor/shadcn-tailwind.css`, with its MIT license alongside it. When updating it, copy the stylesheet and license from a reviewed upstream release; do not reintroduce the vulnerable CLI dependency.

Advisories: [compression](https://github.com/advisories/GHSA-vc2v-76pw-4v95), [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

## Project folder

The initial local checkout is `D:\code\pravo-na-dlanu`, alongside the other projects. Open that folder as a Codex project.
