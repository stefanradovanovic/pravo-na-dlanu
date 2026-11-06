# Free Vercel hosting

The application exports static HTML, JavaScript, search files and document assets into `out/`. Reading, category navigation and search run without a server, database, CMS, AI API or paid storage service. Source refreshes run in GitHub Actions, outside Vercel requests.

## Standalone law pages

Each complete law remains a single Markdown source in `content/corpus/`. Production renders that source into ordinary HTML with the same Markdown renderer used in development. Legal text is present before JavaScript runs. Only the existing interactive controls (contents, article navigation, font size, examples, return link, copy and print) hydrate as isolated React roots. The PDF viewer loads separately for facsimiles. Search indexes and downloadable documents remain unchanged.

`npm run build` first exports the catalog and a law layout shell with Next.js, then `scripts/export-law-pages.tsx` renders every law and replaces legacy UUID and learning URLs with small redirects that preserve query parameters and article anchors. Links entering law pages must use ordinary anchors or browser navigation: Next.js client navigation expects RSC files that these documents deliberately do not generate. `next dev` continues to use the normal Next.js reader.

### Measured reduction (2026-11-06)

Local production exports of the same 846-document corpus, before and after this change; decimal MB, uncompressed files in `out/`:

| Output                            |    Before |     After |
| --------------------------------- | --------: | --------: |
| Entire deployable output          | 870.06 MB | 246.91 MB |
| HTML                              | 293.96 MB | 123.39 MB |
| Next navigation payloads (`.txt`) | 456.73 MB |   3.34 MB |
| Files                             |    10,753 |     3,971 |

The reduction is **623.15 MB (71.62%) per build**. This measures local deployment artifacts, not the Vercel team's current storage meter. Existing retained deployments still occupy their original space.

Before merging, this branch was synchronized with `c2ea5ab`, preserving the newer article subtitles, normalized document headings and 16px reader default. That combined build is **247,929,970 bytes (247.93 MB)** across 3,971 files; the comparison above records the isolated optimization before those presentation changes.

For example, the Labour Law HTML fell from 873,915 to 383,870 bytes (local gzip estimate: 140,183 to 63,435 bytes). The 2020 budget final-account law fell from 10,808,015 to 2,560,765 bytes. These are document HTML sizes, not total browser transfer including shared CSS/JavaScript.

`npm run build:measure -- before` and `npm run build:measure -- after` save reports under `.cache/`. Reports include hashes of every document's rendered legal text, article IDs, table/cell counts and source notices. All 846 before/after signatures matched exactly. Unit tests also validate source references; browser tests cover search, navigation, examples, printing, copying, redirects and PDF reading on desktop and mobile. `npm run hosting:check` rejects missing documents or regenerated law RSC payloads.

## Deploy later

1. In a personal Vercel Hobby account, import `stefanradovanovic/pravo-na-dlanu` through the GitHub integration. Use the repository root and Node.js 24.
2. Keep the checked-in `vercel.json` settings: framework **Other** (`null`), install `npm ci`, build `npm run build && npm run hosting:check`, output `out`. This publishes the Next.js static export directly and creates no runtime functions.
3. No environment variables, database, Blob subscription, API keys or Vercel cron jobs are required. The included `vercel.app` address avoids a domain registration cost.
4. After the initial deployment, check a direct `/propisi/{id}` URL, browser refresh, search, a scan document and the 404 page. Git pushes then rebuild the snapshot automatically.

**Use Git import** so source files are checked out directly during the build. Avoid the Hobby CLI's 100 MB source-upload limit as the corpus grows. Never exclude legal documents simply to fit an upload limit. Generated output and source uploads are different limits.

`npm run hosting:check` checks that every canonical law has a static HTML page and writes file counts, total bytes and the largest files to `.cache/hosting-report.json`. Run it after `npm run build`. This is a local readiness check; no Vercel deployment has been performed by this change.

## Free-tier conditions

Checked against Vercel documentation on 2026-11-05. Hobby is for **personal, non-commercial** use. It currently includes 100 GB Fast Data Transfer and 1,000,000 CDN requests. Large scans consume more transfer than text pages. Vercel may pause service after a limit is exceeded; free hosting is not unlimited or guaranteed at every traffic level. A commercial project needs an appropriate plan.

Vercel currently allows 45 minutes per build and 23 GB build disk. It does not apply its CLI's 15,000 source-file upload limit to files generated during a Git build. Keep the constrained static-generation settings in `next.config.ts`; check build duration and usage after deployment.

Sources: [Hobby plan](https://vercel.com/docs/plans/hobby), [platform limits](https://vercel.com/docs/limits), [static configuration](https://vercel.com/docs/project-configuration/vercel-json).
