import { ArcLensError } from "@/domain/errors";
import generatedFacts from "@/knowledge/generated/facts.json";

export type SocketPolarity = "positive" | "negative";
export type WeldingProcess = "flux-core" | "mig" | "tig" | "stick";

type DutyCycleInput = {
  process: WeldingProcess;
  inputVoltage: 120 | 240;
  amperage: number;
};

type DutyCycleResult = {
  ratedPercent: number;
  weldingMinutes: number;
  restingMinutes: number;
  sourceId: string;
  computationId: "duty-cycle:v1";
};

const dutyCycleRatings = new Map(
  generatedFacts.facts
    .filter((fact) => fact.predicate === "duty_cycle")
    .map((fact) => {
      const inputs = fact.inputs as {
        process: WeldingProcess;
        inputVoltage: 120 | 240;
        amperage: number;
      };
      const output = fact.output as {
        ratedPercent: number;
        weldingMinutes: number;
        restingMinutes: number;
      };
      return [
        `${inputs.process}:${inputs.inputVoltage}:${inputs.amperage}`,
        { ...output, sourceId: fact.sourceIds[0] },
      ] as const;
    }),
);

export function calculateDutyCycle(input: DutyCycleInput): DutyCycleResult {
  const rating = dutyCycleRatings.get(
    `${input.process}:${input.inputVoltage}:${input.amperage}`,
  );
  if (!rating) {
    throw new ArcLensError({
      code: "FACT_DUTY_CYCLE_UNSUPPORTED",
      status: 422,
      retryable: false,
      problem: "The provided manuals do not specify that duty-cycle point.",
      cause: `No rated ${input.process} duty cycle is listed for ${input.amperage} A at ${input.inputVoltage} V.`,
      fix: "Use one of the rated points from the manual or ask about the nearest documented setting.",
      docsUrl: "/docs/errors#fact-duty-cycle-unsupported",
    });
  }

  return { ...rating, computationId: "duty-cycle:v1" };
}

type PolarityLayout = {
  process: string;
  polarity: "DCEN" | "DCEP";
  groundSocket: SocketPolarity;
  electrodeSocket: SocketPolarity;
  electrodeLabel: string;
  sourceId: string;
};

const polarityLayouts = Object.fromEntries(
  generatedFacts.facts
    .filter((fact) => fact.predicate === "polarity_layout")
    .map((fact) => {
      const process = (fact.inputs as { process: WeldingProcess }).process;
      return [
        process,
        { ...(fact.output as Omit<PolarityLayout, "sourceId">), sourceId: fact.sourceIds[0] },
      ];
    }),
) as Record<
  WeldingProcess,
  PolarityLayout
>;

export function resolvePolarityLayout(process: WeldingProcess) {
  return polarityLayouts[process];
}

export type TroubleshootingCheck = {
  id: string;
  title: string;
  action: string;
  sourceIds: string[];
};

const commonPorosityChecks: TroubleshootingCheck[] = [
  {
    id: "polarity",
    title: "Confirm the process polarity",
    action: "Flux-core is DCEN; gas-shielded MIG is DCEP.",
    sourceIds: ["owner-manual:pdf-13", "owner-manual:pdf-14", "owner-manual:pdf-43"],
  },
  {
    id: "surface-contamination",
    title: "Clean the workpiece and wire",
    action: "Remove rust, oil, coatings, and other residue down to bare metal.",
    sourceIds: ["owner-manual:pdf-37", "owner-manual:pdf-43"],
  },
  {
    id: "travel-speed",
    title: "Keep travel speed steady",
    action: "Avoid inconsistent gun movement through the weld.",
    sourceIds: ["owner-manual:pdf-37"],
  },
  {
    id: "ctwd",
    title: "Shorten contact-tip-to-work distance",
    action: "Keep CTWD within the procedure instead of holding the gun too far away.",
    sourceIds: ["owner-manual:pdf-37", "owner-manual:pdf-43"],
  },
  {
    id: "wire-contamination",
    title: "Inspect the welding wire",
    action: "Replace wire that carries rust, oil, or residue into the weld.",
    sourceIds: ["owner-manual:pdf-43"],
  },
];

const migGasChecks: TroubleshootingCheck[] = [
  {
    id: "shielding-gas-flow",
    title: "Check shielding-gas flow",
    action: "Confirm the bottle, regulator flow, and a clean nozzle.",
    sourceIds: ["owner-manual:pdf-37", "owner-manual:pdf-43"],
  },
  {
    id: "shielding-gas-type",
    title: "Confirm the shielding-gas type",
    action: "Use the gas recommended by the wire supplier.",
    sourceIds: ["owner-manual:pdf-37"],
  },
];

export function getPorosityChecklist(
  process: Extract<WeldingProcess, "flux-core" | "mig">,
): TroubleshootingCheck[] {
  return process === "mig"
    ? [commonPorosityChecks[0], ...migGasChecks, ...commonPorosityChecks.slice(1)]
    : commonPorosityChecks;
}
