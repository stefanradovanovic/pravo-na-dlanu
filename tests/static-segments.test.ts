import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  normalizeStaticSegments,
  staticSegmentAlias,
} from "../scripts/static-segments";

test("Windows-exported segments are served under the browser's dotted URL", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "law-segments-"));
  try {
    await fs.mkdir(path.join(root, "vodic", "__next.vodic"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, "vodic", "__next.vodic", "__PAGE__.txt"),
      "page payload",
    );
    await normalizeStaticSegments(root);
    assert.equal(
      await fs.readFile(
        path.join(root, "vodic", "__next.vodic.__PAGE__.txt"),
        "utf8",
      ),
      "page payload",
    );
    await normalizeStaticSegments(root);
    assert.equal(
      staticSegmentAlias("nested\\route\\__next.nested\\route\\__PAGE__.txt"),
      "nested/route/__next.nested.route.__PAGE__.txt",
    );
    assert.equal(staticSegmentAlias("vodic/__next.vodic.__PAGE__.txt"), null);
    assert.equal(staticSegmentAlias("reader-assets/chunk.js"), null);
    await fs.writeFile(
      path.join(root, "vodic", "__next.vodic.__PAGE__.txt"),
      "different payload",
    );
    await assert.rejects(normalizeStaticSegments(root), /Segment collision/);
  } finally {
    assert.ok(root.startsWith(path.join(os.tmpdir(), "law-segments-")));
    await fs.rm(root, { recursive: true, force: true });
  }
});
