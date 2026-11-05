# Project conventions

- Use shadcn/ui for interface primitives. Reuse the existing components and tokens; do not introduce new input, pill, select, or button styles unless explicitly requested.
- Keep the interface and educational content in Serbian Cyrillic. Search must accept Cyrillic, Latin, and input without diacritics.
- Store each complete law in one `content/corpus/*.md` document. Keep editorial learning examples in `content/learning.json`; never split a law into article documents or graph nodes. No CMS, database, or external AI service is required.
- Keep quoted law, editorial explanations, and fictional examples clearly separated. Never describe an excerpt as a complete law or a source-access date as legal verification.
- Every law needs a PIS source, the source's actual version, an access date, and an explicit coverage statement. Do not silently replace the law's wording.
- Validate content references and run `npm test`, `npm run typecheck`, and `npm run build` before publishing source changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
