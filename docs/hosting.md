# Free Vercel hosting

The application exports static HTML, JavaScript, search files and document assets into `out/`. Reading, category navigation and search run without a server, database, CMS, AI API or paid storage service. Source refreshes run in GitHub Actions, outside Vercel requests.

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
