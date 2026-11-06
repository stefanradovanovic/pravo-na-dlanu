# Sources and data contract

Canonical catalog: [PIS register](https://www.pravno-informacioni-sistem.rs/reg-search).
Scope is **domestic laws and the Constitution**: records with document types Устав (19) or Закон (53) in the current PIS roots 458 (national) and 459 (education). International treaty register 206 and the historical Gazette archive are excluded, as are bylaws, municipal acts and other document types. Current-register membership determines inclusion, not publication year: an older law can remain in force. PIS also retains some older acts that were not formally repealed, with editorial notes; presence is not an independent assertion that every provision applies today.

The public register's own application uses these unauthenticated endpoints:

- `https://reg.pravno-informacioni-sistem.rs/api/standardSearch/filter`
- `https://reg.pravno-informacioni-sistem.rs/api/regAreas?parentId=...`
- `https://di.pravno-informacioni-sistem.rs/REG/advancedSearch`
- `https://reg.pravno-informacioni-sistem.rs/api/viewAct/{uuid}?lawActId={registryId}`
- `https://reg.pravno-informacioni-sistem.rs/api/viewPdf?actId={registryId}`

The importer respects the search's 500-row limit by partitioning categories recursively and reconciling every parent's expected count. UUIDs (or `reg-{id}` for PDF records) provide canonical identity. Two concurrent requests, a small delay and limited retries avoid uncontrolled request volume. Authentication failures are not bypassed.

HTML is converted as a whole document. Complex tables are retained as HTML inside Markdown and sanitized at rendering. Notes and transitional provisions remain part of the document. Linked attachments and external images are linked, not locally archived. HTML formatting conversion is not legal editorial consolidation.

PDF endpoints can return an entire Gazette issue. Verified law page sequences are exported losslessly into local `public/pis/{sha256}.pdf` assets and displayed in the same canonical law reader. `content/facsimiles.json` records the source checksum, exact publication, access date, selected zero-based source pages, printed page labels, opening title and closing provision. Boundary pages may retain neighboring text; coverage explicitly says so. Each law still has one Markdown document. PDF.js assets are copied locally at build time; no paid storage or remote viewer is needed. OCR is not published as normative text or included in body search. If a future record has no complete verified body or scan, it must remain visibly `source-only`, never mislabeled as complete.

Each record retains title, publication references, categories, subregister, source IDs/URLs, download time and SHA-256. `content/registry.json` contains the machine-readable coverage report. `npm run laws:audit` checks IDs, source URL correspondence, metadata, file counts, normalized duplicate bodies and title candidates. Same-name records need source review, not automatic deletion.

`npm run laws:sync` bypasses the local resume cache and downloads a fresh snapshot. `npm run laws:resume` is only for interrupted imports; it does not certify freshness. A failed import leaves the published snapshot intact and writes `.cache/sync-report.json`. New sources do not automatically validate old educational explanations.

The daily GitHub workflow refreshes and validates the repository snapshot. A public website must also rebuild/deploy after a successful source refresh. GitHub may pause scheduled workflows in inactive repositories. Always show the actual per-document retrieval date.

Primary source explanation: [official register help](https://fp.pravno-informacioni-sistem.rs/StaticPageFiles/Help_REG.html).

## Source integrity and duplicate review

Only HTTPS hosts under `pravno-informacioni-sistem.rs` are accepted as legal sources. Other official sites are not used as fallbacks. `content/source-issues.json` identifies known bad PIS responses. One incorrect domestic HTML body is quarantined using its exact checksum; if it changes, refresh stops for review. The correct law is supplied from the public PIS Gazette PDF, printed pages 2–3 of SCG 27/2003 (physical pages 2 and 47). New, unknown download failures prevent publication. Fresh syncs also verify the recovered PDF checksum, and audits verify local assets and page provenance before publication.

The 2026-11-05 domestic snapshot represents 846 PIS entries in 846 canonical documents: 845 complete HTML bodies and one complete locally readable scan, with zero source-only records. All current scoped entries are readable, but this is **not professional legal verification of every provision**. External HTML attachments and images can contain additional material; they remain links. The machine-readable registry report is authoritative for later snapshot counts and dates.

Deduplication first uses the normalized title and original Gazette issue/year/page. `content/source-corrections.json` can hold reviewed corrections for erroneous PIS citations; none are needed in this domestic snapshot. Any merged source entries retain their original citation and checksum as aliases. Same-name laws from different publications and different acts in one Gazette issue stay separate. Automated checks found no repeated canonical IDs, legal identities or normalized complete bodies in this snapshot.

Learning material lives in `content/learning.json`; it contains editorial explanations and fictional examples, not duplicate article documents. References use the PIS catalog and open the canonical whole law. The daily refresh does not certify or automatically update the editorial explanations.

Law-reader examples are withheld when their saved source citation changes, their pinned source checksum changes, or the referenced article anchor disappears. The reader shows how many examples await comparison and keeps the complete law available. Examples with a `practice` pin share the quiz source checks. Older examples without that pin use the saved law-level citation from `content/laws.json`; those legacy entries cannot detect a body change that retains the same citation. No refresh silently advances editorial source pins.
