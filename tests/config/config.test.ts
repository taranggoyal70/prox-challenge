import { describe, expect, it } from "vitest";

import { buildAgentSubprocessEnv, loadConfig } from "@/config";
import { ArcLensError } from "@/domain/errors";

describe("loadConfig", () => {
  it("defaults to a safe no-key product", () => {
    const config = loadConfig({});

    expect(config.mode).toBe("build-no-key");
    expect(config.capabilities).toEqual({
      liveAnswers: false,
      expertMutation: false,
      recordedProof: true,
    });
  });

  it("requires an Anthropic key for live-local", () => {
    expect(() => loadConfig({ ARCLENS_MODE: "live-local" })).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({ code: "ARCLENS_KEY_MISSING" }),
    );
  });

  it.each(["hosted-read-only", "hosted-admin"] as const)(
    "fails closed for unimplemented %s controls",
    (mode) => {
      expect(() => loadConfig({ ARCLENS_MODE: mode, ANTHROPIC_API_KEY: "sk-ant-example" })).toThrowError(
        expect.objectContaining<Partial<ArcLensError>>({ code: "CONFIG_HOSTED_UNAVAILABLE" }),
      );
    },
  );

  it("rejects the superseded two-value deployment mode", () => {
    expect(() => loadConfig({ ARCLENS_DEPLOYMENT_MODE: "local" })).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({ code: "CONFIG_LEGACY_MODE" }),
    );
  });

  it("enables live answers without enabling expert mutation", () => {
    const config = loadConfig({
      ARCLENS_MODE: "live-local",
      ANTHROPIC_API_KEY: "sk-ant-example",
    });

    expect(config.capabilities.liveAnswers).toBe(true);
    expect(config.capabilities.expertMutation).toBe(false);
    expect(config.model).toBe("claude-sonnet-5-5");
    expect(config.maxBudgetUsd).toBe(0.75);
  });

  it("does not pass unrelated parent secrets to the Agent SDK subprocess", () => {
    const config = loadConfig({
      ARCLENS_MODE: "live-local",
      ANTHROPIC_API_KEY: "sk-ant-example",
    });

    const childEnv = buildAgentSubprocessEnv(config, {
      PATH: "/usr/bin",
      HOME: "/tmp/home",
      TMPDIR: "/tmp",
      AWS_SECRET_ACCESS_KEY: "must-not-cross",
      DATABASE_URL: "must-not-cross",
    });

    expect(childEnv).toEqual({
      PATH: "/usr/bin",
      HOME: "/tmp/home",
      TMPDIR: "/tmp",
      ANTHROPIC_API_KEY: "sk-ant-example",
      CLAUDE_AGENT_SDK_CLIENT_APP: "arclens/0.1.0",
    });
    expect(childEnv).not.toHaveProperty("AWS_SECRET_ACCESS_KEY");
    expect(childEnv).not.toHaveProperty("DATABASE_URL");
  });
});
