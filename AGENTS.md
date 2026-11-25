# Project conventions

- Before starting work in a worktree, inspect its Git status and pull the latest remote changes with `git pull --ff-only`. If the branch has no upstream, fetch the remote and fast-forward from the task's intended remote base branch before editing. Preserve local changes; if synchronization fails or requires resolving divergence, report the blocker before proceeding with task edits.
- Reuse the shadcn/ui component facade in `src/components/ui/`, now backed by UI SDK, and its shared tokens. Do not introduce page-specific input, pill, select, or button styles unless explicitly requested. The approved direction and implementation contract are in `docs/design-system.md`.
- Before using UI SDK, follow `.agents/skills/ui-sdk/SKILL.md` and the installed `node_modules/@ui-sdk/react/docs/llms.txt` index, then read the relevant component page. For a new primitive, also search `docs/core.md` by heading and read `docs/rendering.md` in that package. The AI for UI skill coverage and workflow are in `docs/design/skills.md`.
- Keep the interface and educational content in Serbian Cyrillic. Search must accept Cyrillic, Latin, and input without diacritics.
- Include the Constitution, domestic laws, and the National Assembly Rules of Procedure from the current PIS national and education registers (458, 459). Keep older laws that are still in these registers. Exclude treaty register 206 and the historical Gazette archive.
- Store each complete law in one `content/corpus/*.md` document. Keep editorial learning examples in `content/learning.json`; never split a law into article documents or graph nodes. No CMS, database, or external AI service is required.
- Keep quoted law, editorial explanations, and fictional examples clearly separated. Never describe an excerpt as a complete law or a source-access date as legal verification.
- Every law needs a PIS source, the source's actual version, an access date, and an explicit coverage statement. Do not silently replace the law's wording.
- Validate content references and run `npm test`, `npm run typecheck`, and `npm run build` before publishing source changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git worktrees

- Before creating a worktree, ask which GitHub CLI account to use (`stefanradovanovic` or `klara-pelhe`) unless the user has already specified one for that worktree. When first opening an existing worktree, use the user's choice or the account saved for that worktree. Ask if neither is available. Save the selected login in a local `codex-github-account` file inside the worktree's Git directory, resolved with `git rev-parse --absolute-git-dir`. Report the chosen account alongside the worktree branch and path.
- Before creating a new worktree, run `git fetch origin` and wait for it to succeed. If the fetch fails, retry or report the failure before using a remote branch as the base.
- Start new worktree branches from `origin/master` by default. If the user names a different base branch, use its freshly fetched remote ref. Honor an explicit local branch, tag, or commit as the base.
- For a new task branch based on `master`, use `git worktree add --no-track -b codex/<task> <path> origin/master`. Verify that the new worktree's `HEAD` matches the intended base commit.
- For `gh` operations in that worktree, capture the selected account's token from `gh auth token --hostname github.com --user <login>` directly into the command process's `GH_TOKEN` environment variable. Keep the token out of output and files. Verify the login in that process with `gh api --hostname github.com user --jq .login` before using it. If verification fails or the login differs from the selected account, ask the user to sign in or choose another account before running the operation.
- After confirming a pull request into `master` was merged, find the checkout on `master` with `git worktree list` and run `git pull --ff-only origin master` there. Verify that `master` and `origin/master` point to the same commit. If the update is blocked or the commits still differ, report the cause and preserve local changes and commits.

## Local previews

- On Windows, start a preview from the current chat's worktree with `npm run dev -- --hostname 127.0.0.1 --port 3000`. Keep track of the process started for the chat and verify that the site responds before sharing its URL.
- If the chat's preview is running when you open or merge a pull request, ask at the end of the turn whether to stop it. Ask once if you open and merge in the same turn. Keep the preview available while awaiting the answer.
- If the user asks to close the preview, stop the process started for this chat and verify that its port is free. Run shared development servers separately from chat previews.

## UI development

- For UI implementation or review, read and apply the relevant installed AI for UI `SKILL.md` files in `.agents/skills/`. Use `emil-design-eng` for general UI work and the matching focused skill for a specific task. Follow the workflow in `docs/design/skills.md`.
- Compose shared components and variants from the shadcn/ui facade. Make recurring UI patterns reusable and use the default `Button` variant from `src/components/ui/button.tsx` for primary actions.
- Use the shared design tokens for typography, spacing, colors, radii, and other visual properties. If a design requirement needs a new shared token or component variant, propose it and get approval before adding or using it. Define the approved option in the shared design system.
