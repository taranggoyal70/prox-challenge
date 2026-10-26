import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(join(standalone, "server.js"))) {
  throw new Error("Missing .next/standalone/server.js; run next build first.");
}

mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), {
  recursive: true,
  force: true,
});
cpSync(join(root, "public"), join(standalone, "public"), {
  recursive: true,
  force: true,
});

console.log("Standalone package prepared with Next static files and public evidence assets.");
