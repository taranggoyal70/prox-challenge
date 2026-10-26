import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const json = args.includes("--json");
const modeIndex = args.indexOf("--mode");
const mode =
  (modeIndex >= 0 ? args[modeIndex + 1] : process.env.ARCLENS_MODE) ||
  "build-no-key";
const validModes = new Set([
  "build-no-key",
  "live-local",
  "hosted-read-only",
  "hosted-admin",
]);

const checks = [];
const add = (id, status, problem, fix) => checks.push({ id, status, problem, fix });

const nodeMajor = Number(process.versions.node.split(".")[0]);
add(
  "runtime.node",
  nodeMajor === 24 ? "pass" : "fail",
  `Detected Node ${process.version}; ArcLens requires Node 24.`,
  "Run `nvm use`, `fnm use 24`, or `volta install node@24`.",
);

add(
  "config.mode",
  validModes.has(mode) ? "pass" : "fail",
  `ARCLENS_MODE is ${mode}.`,
  "Use build-no-key, live-local, hosted-read-only, or hosted-admin.",
);

const needsKey = mode !== "build-no-key";
const key = process.env.ANTHROPIC_API_KEY?.trim();
add(
  "config.anthropic-key",
  needsKey ? (key?.startsWith("sk-ant-") ? "pass" : "fail") : "skipped",
  needsKey
    ? key
      ? "ANTHROPIC_API_KEY is present but its prefix is invalid."
      : "ANTHROPIC_API_KEY is missing for a live mode."
    : "Live provider checks are disabled in build-no-key mode.",
  needsKey
    ? "Set a valid Anthropic key in .env.local, then restart the command."
    : "Switch to live-local only when a key is available.",
);

add(
  "install.lockfile",
  existsSync("package-lock.json") ? "pass" : "fail",
  "The npm lockfile must be present for a repeatable install.",
  "Run `npm install`, inspect package-lock.json, and commit it.",
);

const knowledge = spawnSync(process.execPath, ["scripts/check-knowledge.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
add(
  "knowledge.integrity",
  knowledge.status === 0 ? "pass" : "fail",
  knowledge.status === 0
    ? knowledge.stdout.trim()
    : (knowledge.stderr || knowledge.stdout).trim(),
  "Run `npm run build:knowledge`, inspect the diff, then rerun `npm run check:knowledge`.",
);

try {
  const sdk = await import("@anthropic-ai/claude-agent-sdk/core");
  add(
    "agent-sdk.import",
    typeof sdk.query === "function" && typeof sdk.createSdkMcpServer === "function"
      ? "pass"
      : "fail",
    "The Claude Agent SDK core entry loaded.",
    "Reinstall dependencies with `npm ci`.",
  );
} catch (error) {
  add(
    "agent-sdk.import",
    "fail",
    error instanceof Error ? error.message : "The Agent SDK could not be imported.",
    "Run `npm ci` and confirm Node 24 is active.",
  );
}

const port = Number(process.env.PORT || 3000);
const portAvailable = await checkPort(port);
add(
  "network.port",
  portAvailable ? "pass" : "fail",
  portAvailable ? `Port ${port} is available.` : `Port ${port} is already in use.`,
  `Stop the existing process or run ArcLens with PORT=${port + 1}.`,
);

const failed = checks.filter((check) => check.status === "fail");
if (json) {
  console.log(JSON.stringify({ v: 1, mode, ready: failed.length === 0, checks }, null, 2));
} else {
  console.log(`ArcLens doctor (${mode})`);
  for (const check of checks) {
    const marker = { pass: "PASS", fail: "FAIL", skipped: "SKIP" }[check.status];
    console.log(`\n[${marker}] ${check.id}\n${check.problem}`);
    if (check.status !== "pass") console.log(`Fix: ${check.fix}`);
  }
  console.log(`\n${failed.length === 0 ? "Ready for this mode." : `${failed.length} check(s) need attention.`}`);
}

process.exitCode = failed.length === 0 ? 0 : 1;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}
