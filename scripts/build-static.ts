import { spawnSync } from "node:child_process";
import path from "node:path";

// Keep development's Next.js reader while production uses ordinary HTML pages.
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  STANDALONE_LAWS: "1",
};
for (const args of [
  [path.resolve("node_modules/next/dist/bin/next"), "build"],
  ["--import", "tsx", "scripts/export-law-pages.tsx"],
]) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
