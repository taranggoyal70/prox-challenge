import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const requiredDocs = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "docs/getting-started.md",
  "docs/configuration.md",
  "docs/commands.md",
  "docs/errors.md",
  "docs/architecture.md",
  "docs/security.md",
  "docs/test-plan.md",
  "docs/how-to-maintain-knowledge.md",
  "docs/release-checklist.md",
  "docs/demo-script.md",
];

const operationalDocs = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/getting-started.md",
  "docs/configuration.md",
  "docs/commands.md",
  "docs/errors.md",
  "docs/how-to-maintain-knowledge.md",
  "docs/release-checklist.md",
  "docs/demo-script.md",
];

const failures = [];

for (const relativePath of requiredDocs) {
  if (!existsSync(join(root, relativePath))) failures.push(`Missing required document: ${relativePath}`);
}

for (const relativePath of operationalDocs) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) continue;
  const contents = readFileSync(absolutePath, "utf8");

  for (const match of contents.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)) {
    const script = match[1];
    if (!Object.hasOwn(packageJson.scripts, script)) {
      failures.push(`${relativePath} references missing package script: ${script}`);
    }
  }

  for (const match of contents.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("#") ||
      rawTarget.startsWith("/")
    ) {
      continue;
    }

    const [encodedPath, encodedFragment] = rawTarget.split("#", 2);
    const pathPart = decodeURIComponent(encodedPath);
    if (!pathPart || extname(pathPart) === "") continue;
    const resolvedTarget = normalize(join(dirname(absolutePath), pathPart));
    if (!resolvedTarget.startsWith(`${root}/`) || !existsSync(resolvedTarget)) {
      failures.push(`${relativePath} has broken local link: ${rawTarget}`);
      continue;
    }
    if (encodedFragment && extname(pathPart) === ".md") {
      const fragment = decodeURIComponent(encodedFragment).toLowerCase();
      const targetContents = readFileSync(resolvedTarget, "utf8");
      const anchors = new Set(
        [...targetContents.matchAll(/^#{1,6}\s+(.+)$/gm)].map((heading) =>
          githubAnchor(heading[1]),
        ),
      );
      if (!anchors.has(fragment)) {
        failures.push(`${relativePath} links to missing heading: ${rawTarget}`);
      }
    }
  }
}

const readme = existsSync(join(root, "README.md"))
  ? readFileSync(join(root, "README.md"), "utf8")
  : "";
for (const command of ["npm ci", "npm run dev"]) {
  if (!readme.includes(command)) failures.push(`README.md is missing quickstart command: ${command}`);
}

const recordedData = readFileSync(join(root, "src/components/recorded-proof-data.ts"), "utf8");
const recordedPrompts = [
  ...recordedData.matchAll(/^\s+(?:duty|porosity|tig):\s+"([^"]+)",$/gm),
].map((match) => match[1]);
for (const prompt of recordedPrompts) {
  if (!readme.includes(prompt)) failures.push(`README.md is missing recorded prompt: ${prompt}`);
}

const configReference = readFileSync(join(root, "docs/configuration.md"), "utf8");
const exampleEnv = readFileSync(join(root, ".env.example"), "utf8");
for (const match of exampleEnv.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) {
  if (!configReference.includes(`\`${match[1]}\``)) {
    failures.push(`docs/configuration.md is missing .env.example variable: ${match[1]}`);
  }
}

const errorsReference = readFileSync(join(root, "docs/errors.md"), "utf8");
const runtimeErrorCodes = new Set();
for (const sourcePath of walk(join(root, "src"))) {
  if (extname(sourcePath) !== ".ts" && extname(sourcePath) !== ".tsx") continue;
  const source = readFileSync(sourcePath, "utf8");
  for (const pattern of [
    /code:\s*"([A-Z][A-Z0-9_]+)"/g,
    /groundingError\(\s*"([A-Z][A-Z0-9_]+)"/g,
    /agentFailure\(\s*"([A-Z][A-Z0-9_]+)"/g,
  ]) {
    for (const match of source.matchAll(pattern)) runtimeErrorCodes.add(match[1]);
  }
}
for (const code of runtimeErrorCodes) {
  if (!errorsReference.includes(`### \`${code}\``)) {
    failures.push(`docs/errors.md is missing runtime error code: ${code}`);
  }
}

if (failures.length > 0) {
  console.error("Documentation validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation valid: ${requiredDocs.length} required files, ${operationalDocs.length} operational files checked.`,
  );
}

function githubAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
