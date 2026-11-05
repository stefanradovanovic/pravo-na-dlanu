# Sources and data contract

Canonical catalog: [PIS register](https://www.pravno-informacioni-sistem.rs/reg-search).
Scope is **all records with document types Устав (19) or Закон (53)** in roots 458 (national), 459 (education), and 206 (international treaties). It excludes bylaws, municipal acts and other document types. It includes some historical acts retained by the official register; presence is not an independent assertion of current legal effect.

The public register's own application uses these unauthenticated endpoints:

- `https://reg.pravno-informacioni-sistem.rs/api/standardSearch/filter`
- `https://reg.pravno-informacioni-sistem.rs/api/regAreas?parentId=...`
- `https://di.pravno-informacioni-sistem.rs/REG/advancedSearch`
- `https://reg.pravno-informacioni-sistem.rs/api/viewAct/{uuid}?lawActId={registryId}`
- `https://reg.pravno-informacioni-sistem.rs/api/viewPdf?actId={registryId}`

The importer respects the search's 500-row limit by partitioning categories recursively and reconciling every parent's expected count. UUIDs (or `reg-{id}` for PDF records) provide canonical identity. Two concurrent requests, a small delay and limited retries avoid uncontrolled request volume. Authentication failures are not bypassed.

HTML is converted as a whole document. Complex tables are retained as HTML inside Markdown and sanitized at rendering. Notes and transitional provisions remain part of the document. Linked attachments and external images are linked, not locally archived. HTML formatting conversion is not legal editorial consolidation.

PDF endpoints can return an entire Gazette issue. Do not label that PDF's extracted content as one law, merge laws solely because they share a PDF checksum, or publish uncertain OCR as normative text. These records are explicitly `source-only`, searchable by title/citation, and link to the official viewer. Their Markdown file is a provenance record, **not the complete law**.

Each record retains title, publication references, categories, subregister, source IDs/URLs, download time and SHA-256. `content/registry.json` contains the machine-readable coverage report. `npm run laws:audit` checks IDs, source URL correspondence, metadata, file counts, normalized duplicate bodies and title candidates. Same-name records need source review, not automatic deletion.

`npm run laws:sync` bypasses the local resume cache and downloads a fresh snapshot. `npm run laws:resume` is only for interrupted imports; it does not certify freshness. A failed import leaves the published snapshot intact and writes `.cache/sync-report.json`. New sources do not automatically validate old educational explanations.

The daily GitHub workflow refreshes and validates the repository snapshot. A public website must also rebuild/deploy after a successful source refresh. GitHub may pause scheduled workflows in inactive repositories. Always show the actual per-document retrieval date.

Primary source explanation: [official register help](https://fp.pravno-informacioni-sistem.rs/StaticPageFiles/Help_REG.html).

## Source integrity and duplicate review

Only HTTPS hosts under `pravno-informacioni-sistem.rs` are accepted as legal sources. Other official sites are not used as fallbacks. `content/source-issues.json` identifies known bad PIS responses. Two incorrect HTML bodies are quarantined using their exact source checksums; if either response changes, refresh stops for a new review. Seven editorial-only pages are excluded from the complete-text count. Three broken PDF endpoints remain visible as unavailable records and are retried by fresh syncs. New, unknown download failures prevent publication.

The 2026-11-05 snapshot represents 2,995 PIS entries in 2,978 canonical documents: 1,859 complete HTML responses and 1,119 source-only records. This is complete catalog enumeration, **not complete full-text coverage or a professional legal verification of every document**. HTML attachments and images can contain additional material; they remain links.

Deduplication first uses the normalized title and original Gazette issue/year/page. Explicit corrections in `content/source-corrections.json` handle four groups with erroneous PIS citations, checked against the Gazette PDFs supplied by PIS. All 17 merged source entries remain in canonical-record aliases with their original citation and checksum. Same-name laws from different publications and different acts in one Gazette issue stay separate. Automated checks found no repeated canonical IDs, legal identities or normalized complete bodies in this snapshot.

Learning material lives in `content/learning.json`; it contains editorial explanations and fictional examples, not duplicate article documents. References use the PIS catalog and open the canonical whole law. The daily refresh does not certify or automatically update the editorial explanations.
