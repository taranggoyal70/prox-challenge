const [major] = process.versions.node.split(".").map(Number);

if (major !== 24) {
  console.error(
    [
      "ARCLENS_NODE_VERSION",
      `Problem: ArcLens requires Node 24; detected ${process.version}.`,
      "Cause: The Claude Agent SDK and project toolchain are pinned to Node 24.",
      "Fix: run `nvm use`, `fnm use 24`, or `volta install node@24`, then retry `npm ci`.",
      "Docs: docs/developer-experience.md#runtime-and-package-manager-preflight",
    ].join("\n"),
  );
  process.exit(1);
}
