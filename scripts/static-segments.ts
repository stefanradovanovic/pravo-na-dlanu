import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

// Next 16.4's exporter passes Windows path.relative() output to a URL encoder
// that replaces only '/'. The browser requests dotted segment filenames.
// Keep this adapter at the static-export boundary; never patch node_modules.
export function staticSegmentAlias(relative: string): string | null {
  const parts = relative.replaceAll("\\", "/").split("/");
  const start = parts.findIndex((part) => part.startsWith("__next."));
  if (start < 0 || start === parts.length - 1 || !relative.endsWith(".txt"))
    return null;
  return [...parts.slice(0, start), parts.slice(start).join(".")].join("/");
}

export async function normalizeStaticSegments(root: string) {
  const resolved = path.resolve(root);
  let count = 0;
  async function walk(folder: string) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      assert.ok(
        !entry.isSymbolicLink(),
        `Unexpected export symlink: ${entry.name}`,
      );
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else {
        const alias = staticSegmentAlias(path.relative(resolved, file));
        if (!alias) continue;
        const destination = path.resolve(resolved, alias);
        assert.ok(destination.startsWith(resolved + path.sep));
        const content = await fs.readFile(file);
        const existing = await fs.readFile(destination).catch((error) => {
          if (error.code !== "ENOENT") throw error;
          return null;
        });
        if (existing)
          assert.ok(existing.equals(content), `Segment collision: ${alias}`);
        else await fs.writeFile(destination, content, { flag: "wx" });
        count++;
      }
    }
  }
  await walk(resolved);
  return count;
}
