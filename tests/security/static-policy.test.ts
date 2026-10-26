import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry) ? [path] : [];
  });
}

describe("static trust-boundary policy", () => {
  it("keeps process.env reads inside the config module", () => {
    const offenders = sourceFiles(join(root, "src"))
      .filter((path) => !path.endsWith(join("src", "config", "index.ts")))
      .filter((path) => readFileSync(path, "utf8").includes("process.env"))
      .map((path) => relative(root, path));

    expect(offenders).toEqual([]);
  });

  it("never renders unsanitized HTML or runtime code", () => {
    const offenders = sourceFiles(join(root, "src"))
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(|new Function\s*\(/.test(
          source,
        );
      })
      .map((path) => relative(root, path));

    expect(offenders).toEqual([]);
  });

  it("keeps every Claude built-in tool disabled", () => {
    const options = readFileSync(join(root, "src/agent/options.ts"), "utf8");

    expect(options).toContain("tools: []");
    expect(options).toContain("permissionMode: \"dontAsk\"");
    expect(options).toContain("permissionPrompts: \"none\"");
    expect(options).toContain("settingSources: []");
  });
});
