# Project conventions

- Before starting work in a worktree, inspect its Git status and pull the latest remote changes with `git pull --ff-only`. If the branch has no upstream, fetch the remote and fast-forward from the task's intended remote base branch before editing. Preserve local changes; if synchronization fails or requires resolving divergence, report the blocker before proceeding with task edits.
- Reuse the shadcn/ui component facade in `src/components/ui/`, now backed by UI SDK, and its shared tokens. Do not introduce page-specific input, pill, select, or button styles unless explicitly requested. The approved direction and implementation contract are in `docs/design-system.md`.
- Before using UI SDK, follow `.agents/skills/ui-sdk/SKILL.md` and the installed `node_modules/@ui-sdk/react/docs/llms.txt` index, then read the relevant component page. For a new primitive, also search `docs/core.md` by heading and read `docs/rendering.md` in that package. The AI for UI skill coverage and workflow are in `docs/design/skills.md`.
- Keep the interface and educational content in Serbian Cyrillic. Search must accept Cyrillic, Latin, and input without diacritics.
- Scope is the Constitution and domestic laws in the current PIS national and education registers (458, 459). Exclude treaty register 206 and the historical Gazette archive. Do not exclude a current-register law solely because of its publication year.
- Store each complete law in one `content/corpus/*.md` document. Keep editorial learning examples in `content/learning.json`; never split a law into article documents or graph nodes. No CMS, database, or external AI service is required.
- Keep quoted law, editorial explanations, and fictional examples clearly separated. Never describe an excerpt as a complete law or a source-access date as legal verification.
- Every law needs a PIS source, the source's actual version, an access date, and an explicit coverage statement. Do not silently replace the law's wording.
- Validate content references and run `npm test`, `npm run typecheck`, and `npm run build` before publishing source changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
