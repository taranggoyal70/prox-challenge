import { describe, expect, it } from "vitest";

import type { ArcLensConfig } from "@/config";
import { ARCLENS_MCP_TOOL_NAMES, buildAgentOptions } from "@/agent/options";

const config: ArcLensConfig = {
  mode: "live-local",
  model: "claude-sonnet-5-5",
  effort: "high",
  maxBudgetUsd: 0.75,
  anthropicApiKey: "sk-ant-example",
  capabilities: {
    liveAnswers: true,
    expertMutation: false,
    recordedProof: true,
  },
};

describe("buildAgentOptions", () => {
  it("removes every built-in tool and allows only ArcLens MCP tools", () => {
    const options = buildAgentOptions({
      config,
      cwd: "/tmp/arclens-agent-test",
      mcpServer: { type: "sdk", name: "arclens", instance: {} } as never,
    });

    expect(options.tools).toEqual([]);
    expect(options.allowedTools).toEqual(ARCLENS_MCP_TOOL_NAMES);
    expect(options.permissionMode).toBe("dontAsk");
    expect(options.permissionPrompts).toBe("none");
    expect(options.settingSources).toEqual([]);
    expect(options.maxTurns).toBe(8);
    expect(options.maxBudgetUsd).toBe(0.75);
    expect(options.model).toBe("claude-sonnet-5-5");
    expect(options.effort).toBe("high");
  });

  it("resumes only the server-resolved SDK session passed by the route", () => {
    const options = buildAgentOptions({
      config,
      cwd: "/tmp/arclens-agent-test",
      mcpServer: { type: "sdk", name: "arclens", instance: {} } as never,
      resumeSessionId: "sdk-session-1",
    });
    expect(options.resume).toBe("sdk-session-1");
  });
});
