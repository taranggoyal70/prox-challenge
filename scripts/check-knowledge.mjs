import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const manifestPath = join(root, "src/knowledge/generated/manifest.json");
const visualPath = join(root, "src/knowledge/generated/visual-evidence.json");
const buildLockPath = join(root, "src/knowledge/generated/.build-in-progress");
const building = () => existsSync(buildLockPath);
const waitForBuild = () => {
  console.error("ARCLENS_KNOWLEDGE_BUILDING\nProblem: Knowledge generation is still in progress.\nCause: build:knowledge is replacing generated page assets.\nFix: Wait for build:knowledge to finish, then rerun npm run check:knowledge.\nDocs: docs/developer-experience.md#public-error-contract");
  process.exit(2);
};
const fail = (message) => {
  if (building()) waitForBuild();
  console.error(`ARCLENS_KNOWLEDGE_INVALID\nProblem: The committed knowledge package is invalid.\nCause: ${message}\nFix: Run npm run build:knowledge with the pinned toolchain, inspect the diff, then rerun npm run check:knowledge.\nDocs: docs/developer-experience.md#public-error-contract`);
  process.exit(1);
};
if (building()) waitForBuild();

if (!existsSync(manifestPath) || !existsSync(visualPath)) fail("generated manifest files are missing");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const visuals = JSON.parse(readFileSync(visualPath, "utf8"));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.pages) || manifest.pages.length !== 51) fail("manifest must contain schema version 1 and 51 pages");
for (const [tool, version] of Object.entries(manifest.toolchain ?? {})) {
  if (typeof version !== "string" || !version.trim()) fail(`blank toolchain version for ${tool}`);
}
const ids = new Set();
for (const document of manifest.documents ?? []) {
  const sourcePath = join(root, document.sourcePath);
  const publicPath = join(root, "public", document.publicUrl.replace(/^\//, ""));
  if (!existsSync(sourcePath) || sha256(readFileSync(sourcePath)) !== document.sha256) fail(`source checksum mismatch for ${document.id}`);
  if (!existsSync(publicPath) || sha256(readFileSync(publicPath)) !== document.sha256) fail(`public PDF mismatch for ${document.id}`);
}
for (const page of manifest.pages) {
  if (ids.has(page.source.id)) fail(`duplicate source id ${page.source.id}`);
  ids.add(page.source.id);
  if (page.source.pdfPageNumber < 1 || page.source.id !== `${page.source.documentId}:pdf-${page.source.pdfPageNumber}`) fail(`invalid source identity ${page.source.id}`);
  if (sha256(page.text) !== page.source.textSha256) fail(`text checksum mismatch ${page.source.id}`);
  const assetPath = join(root, "public", page.source.assetUrl.replace(/^\//, ""));
  if (!existsSync(assetPath) || sha256(readFileSync(assetPath)) !== page.source.assetSha256) fail(`page asset mismatch ${page.source.id}`);
}
for (const visual of visuals) {
  if (!ids.has(visual.sourceId)) fail(`orphan visual ${visual.id}`);
  const assetPath = join(root, "public", visual.assetUrl.replace(/^\//, ""));
  if (!existsSync(assetPath) || sha256(readFileSync(assetPath)) !== visual.assetSha256) fail(`visual asset mismatch ${visual.id}`);
}
if (building()) waitForBuild();
console.log(`Knowledge valid: ${manifest.pages.length} pages, ${visuals.length} visual records, corpus ${manifest.corpusVersion}.`);
