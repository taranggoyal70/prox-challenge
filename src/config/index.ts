import { z } from "zod";

import { ArcLensError } from "@/domain/errors";

export const arclensModes = [
  "build-no-key",
  "live-local",
  "hosted-read-only",
  "hosted-admin",
] as const;

export type ArcLensMode = (typeof arclensModes)[number];

const modeSchema = z.enum(arclensModes);

export type ArcLensConfig = {
  mode: ArcLensMode;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxBudgetUsd: number;
  anthropicApiKey?: string;
  capabilities: {
    liveAnswers: boolean;
    expertMutation: boolean;
    recordedProof: true;
  };
};

type Env = Record<string, string | undefined>;

export function isDevelopmentRuntime(env: Env = process.env): boolean {
  return env.NODE_ENV === "development";
}

export function loadConfig(env: Env = process.env): ArcLensConfig {
  if (env.ARCLENS_DEPLOYMENT_MODE !== undefined) {
    throw new ArcLensError({
      code: "CONFIG_LEGACY_MODE",
      status: 500,
      retryable: false,
      problem: "ArcLens found a superseded deployment-mode variable.",
      cause: "ARCLENS_DEPLOYMENT_MODE was replaced by the four-value ARCLENS_MODE contract.",
      fix: "Remove ARCLENS_DEPLOYMENT_MODE and set ARCLENS_MODE. Use build-no-key when unsure.",
      docsUrl: "/docs/errors#config-legacy-mode",
    });
  }

  const parsedMode = modeSchema.safeParse(env.ARCLENS_MODE ?? "build-no-key");
  if (!parsedMode.success) {
    throw new ArcLensError({
      code: "CONFIG_INVALID_MODE",
      status: 500,
      retryable: false,
      problem: "ArcLens cannot start with the configured mode.",
      cause: `ARCLENS_MODE must be one of ${arclensModes.join(", ")}.`,
      fix: "Set ARCLENS_MODE=build-no-key for the safest default.",
      docsUrl: "/docs/errors#config-invalid-mode",
    });
  }

  const mode = parsedMode.data;
  if (mode === "hosted-read-only" || mode === "hosted-admin") {
    throw new ArcLensError({
      code: "CONFIG_HOSTED_UNAVAILABLE",
      status: 503,
      retryable: false,
      problem: "Hosted live mode is not available in this assessment build.",
      cause: "Production authentication, signed session handles, quotas, and admission controls are not implemented.",
      fix: "Use build-no-key for review or live-local on a trusted machine.",
      docsUrl: "/docs/errors#config-hosted-unavailable",
    });
  }
  const liveAnswers = mode !== "build-no-key";
  const apiKey = env.ANTHROPIC_API_KEY?.trim();

  if (liveAnswers && !apiKey) {
    throw new ArcLensError({
      code: "ARCLENS_KEY_MISSING",
      status: 503,
      retryable: false,
      problem: "Live answers are unavailable.",
      cause: `ANTHROPIC_API_KEY is not set for ${mode} mode.`,
      fix: "Add ANTHROPIC_API_KEY to .env.local, then restart npm run dev. Recorded proof still works in build-no-key mode.",
      docsUrl: "/docs/errors#arclens-key-missing",
    });
  }

  const budget = Number(env.ARCLENS_MAX_BUDGET_USD ?? "0.75");
  if (!Number.isFinite(budget) || budget <= 0 || budget > 0.75) {
    throw new ArcLensError({
      code: "CONFIG_INVALID_BUDGET",
      status: 500,
      retryable: false,
      problem: "ArcLens cannot use the configured request budget.",
      cause: "ARCLENS_MAX_BUDGET_USD must be greater than 0 and no more than 0.75.",
      fix: "Set ARCLENS_MAX_BUDGET_USD=0.75 or a smaller positive value.",
      docsUrl: "/docs/errors#config-invalid-budget",
    });
  }

  const effort = z
    .enum(["low", "medium", "high", "xhigh", "max"])
    .catch("high")
    .parse(env.CLAUDE_EFFORT);

  return {
    mode,
    model: env.CLAUDE_MODEL?.trim() || "claude-sonnet-5-5",
    effort,
    maxBudgetUsd: budget,
    ...(apiKey ? { anthropicApiKey: apiKey } : {}),
    capabilities: {
      liveAnswers,
      expertMutation: false,
      recordedProof: true,
    },
  };
}

export function buildAgentSubprocessEnv(
  config: ArcLensConfig,
  parentEnv: Env = process.env,
): Record<string, string | undefined> {
  return {
    PATH: parentEnv.PATH,
    HOME: parentEnv.HOME,
    TMPDIR: parentEnv.TMPDIR,
    ...(parentEnv.TEMP ? { TEMP: parentEnv.TEMP } : {}),
    ...(parentEnv.TMP ? { TMP: parentEnv.TMP } : {}),
    ANTHROPIC_API_KEY: config.anthropicApiKey,
    CLAUDE_AGENT_SDK_CLIENT_APP: "arclens/0.1.0",
  };
}
