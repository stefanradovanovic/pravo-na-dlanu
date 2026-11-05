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

## Content and sources

- One law = one Markdown document in `content/corpus/` and one canonical `/propisi/{id}` page.
- Official register categories connect to laws on the canvas. Articles stay headings within a continuous document.
- `content/registry.json` records exact coverage, source IDs, citations, checksums and retrieval dates.
- The catalog covers records classified as Закон or Устав in PIS's current national and education registers (458, 459): domestic laws and the Constitution. Treaty register 206 and the historical Gazette archive are excluded. Older laws still in the current register are retained; publication year alone does not determine legal status.
- The snapshot contains 846 documents, all readable in the app: 845 whole HTML bodies and one complete local scan. One incorrect PIS HTML response is quarantined; the correct law is displayed from its PIS Gazette scan with explicit page provenance. Each scan keeps one Markdown document and reader, backed by local PDF assets. Body search covers HTML texts; scans are searchable by title and citation. Linked HTML attachments are not locally archived.
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

## Project folder

The initial local checkout is `D:\code\pravo-na-dlanu`, alongside the other projects. Open that folder as a Codex project.
