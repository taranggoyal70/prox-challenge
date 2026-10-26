import type { ArcLensConfig } from "@/config";

export type KnowledgeStatus = {
  valid: boolean;
  corpusVersion: string;
  schemaVersion: number;
};

export function buildReadiness(
  config: ArcLensConfig,
  knowledge: KnowledgeStatus,
) {
  return {
    v: 1 as const,
    ready: knowledge.valid,
    mode: config.mode,
    capabilities: config.capabilities,
    knowledge: {
      status: knowledge.valid ? ("valid" as const) : ("invalid" as const),
      corpusVersion: knowledge.corpusVersion,
      schemaVersion: knowledge.schemaVersion,
    },
  };
}
