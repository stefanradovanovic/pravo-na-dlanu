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

`npm run build` creates a static site in `out/`; `npm start` serves that export. Deploy `out/` to any static host, or use a Next.js-compatible host with this build command.

## Content and sources

- One law = one Markdown document in `content/corpus/` and one canonical `/propisi/{id}` page.
- Official register categories connect to laws on the canvas. Articles stay headings within a continuous document.
- `content/registry.json` records exact coverage, source IDs, citations, checksums and retrieval dates.
- The catalog covers every record classified as Закон or Устав across all three PIS subregisters, including treaty ratification laws. It does not mean every kind of regulation or municipal act.
- The snapshot reconciles 2,995 PIS source entries into 2,978 documents after merging 17 duplicates. It contains 1,859 whole HTML responses and 1,119 source-only records. Older treaty laws may be available only as whole Gazette PDFs; seven HTML pages contain editorial notes, two return a different act, and three PDF endpoints return errors. These cases are explicitly marked, and wrong texts are not published. Their full text is not copied into Markdown or included in body search. Linked attachments are also not locally archived.
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

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui (Base UI), React Flow, sanitized Markdown and Pagefind. Existing input, button, tab and badge primitives are reused throughout. Searches normalize Serbian Cyrillic, Latin and diacritic-free input.

## Project folder

The initial local checkout is `D:\code\pravo-na-dlanu`, alongside the other projects. Open that folder as a Codex project.
