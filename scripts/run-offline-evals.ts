import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import casesFile from "../evals/core/cases.json" with { type: "json" };
import {
  calculateDutyCycle,
  getPorosityChecklist,
  resolvePolarityLayout,
} from "@/domain/critical-facts";
import { ArcLensError } from "@/domain/errors";
import {
  getPage,
  knowledgeManifest,
  searchManual,
} from "@/knowledge";

type EvalResult = {
  id: string;
  category: string;
  pass: boolean;
  details: string;
};

const startedAt = new Date().toISOString();
const results: EvalResult[] = [];

for (const testCase of casesFile.cases) {
  try {
    const details = runOracle(testCase.oracle);
    results.push({
      id: testCase.id,
      category: testCase.category,
      pass: true,
      details,
    });
  } catch (error) {
    results.push({
      id: testCase.id,
      category: testCase.category,
      pass: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

const passed = results.filter((result) => result.pass).length;
const report = {
  version: 1,
  suite: "offline-core",
  casesVersion: casesFile.version,
  corpusVersion: knowledgeManifest.corpusVersion,
  startedAt,
  completedAt: new Date().toISOString(),
  summary: {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: passed / results.length,
  },
  results,
};

const output = join(process.cwd(), "evals/results/offline.json");
await mkdir(dirname(output), { recursive: true });
const temporary = `${output}.tmp`;
await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await rename(temporary, output);

for (const result of results) {
  console.log(`${result.pass ? "PASS" : "FAIL"} ${result.id}: ${result.details}`);
}
console.log(`\nOffline evals: ${passed}/${results.length} passed. Report: ${output}`);

if (passed !== results.length) process.exitCode = 1;

function runOracle(oracle: string): string {
  switch (oracle) {
    case "duty-240-200": {
      const result = calculateDutyCycle({ process: "mig", inputVoltage: 240, amperage: 200 });
      assert(result.ratedPercent === 25, "expected 25% rated duty cycle");
      assert(result.weldingMinutes === 2.5, "expected 2.5 welding minutes");
      assert(result.restingMinutes === 7.5, "expected 7.5 resting minutes");
      assert(result.sourceId === "owner-manual:pdf-19", "expected PDF page 19");
      return "25%; 2.5 minutes welding; 7.5 minutes resting; PDF page 19";
    }
    case "flux-porosity": {
      const polarity = resolvePolarityLayout("flux-core");
      const checklist = getPorosityChecklist("flux-core");
      assert(polarity.polarity === "DCEN", "expected DCEN");
      assert(polarity.groundSocket === "positive", "expected ground positive");
      assert(!checklist.some((item) => item.id.includes("gas")), "flux-core must exclude MIG gas checks");
      assert(checklist.length === 5, "expected five documented flux-core checks");
      return "DCEN plus five process-correct porosity checks";
    }
    case "tig-polarity": {
      const result = resolvePolarityLayout("tig");
      assert(result.groundSocket === "positive", "expected ground positive");
      assert(result.electrodeSocket === "negative", "expected TIG torch negative");
      assert(result.sourceId === "owner-manual:pdf-24", "expected verified PDF page 24");
      return "ground positive; TIG torch negative; PDF page 24";
    }
    case "mig-polarity": {
      const result = resolvePolarityLayout("mig");
      assert(result.groundSocket === "negative", "expected ground negative");
      assert(result.electrodeSocket === "positive", "expected wire feed positive");
      return "DCEP; ground negative; wire feed positive";
    }
    case "unsupported-duty": {
      try {
        calculateDutyCycle({ process: "mig", inputVoltage: 240, amperage: 173 });
      } catch (error) {
        assert(error instanceof ArcLensError, "expected ArcLensError");
        assert(error.code === "FACT_DUTY_CYCLE_UNSUPPORTED", "expected safe unsupported result");
        return "unsupported point abstains without interpolation";
      }
      throw new Error("unsupported duty-cycle point was interpolated");
    }
    case "selection-chart": {
      const [hit] = searchManual("choose aluminum clean weld process selection chart");
      assert(hit?.source.documentId === "selection-chart", "expected image-only selection chart first");
      assert(hit.visualEvidenceIds.length > 0, "expected visual evidence");
      return `${hit.source.id} with visual evidence`;
    }
    case "wiring-schematic": {
      const [hit] = searchManual("MCU board fan wiring schematic");
      assert(hit?.source.id === "owner-manual:pdf-45", "expected wiring schematic on PDF page 45");
      assert(hit.visualEvidenceIds.length > 0, "expected wiring visual evidence");
      return "owner-manual:pdf-45 with visual evidence";
    }
    case "flux-no-gas": {
      const checklist = getPorosityChecklist("flux-core");
      assert(!checklist.some((item) => item.id.startsWith("shielding-gas")), "must exclude shielding-gas checks");
      return "gasless flux-core excludes MIG shielding-gas branches";
    }
    case "source-boundaries": {
      assert(getPage("owner-manual", 1)?.source.pdfPageNumber === 1, "first page missing");
      assert(getPage("owner-manual", 48)?.source.pdfPageNumber === 48, "last page missing");
      assert(getPage("owner-manual", 0) === undefined, "page zero must be invalid");
      return "owner-manual pages 1–48 addressable; page zero rejected";
    }
    case "corpus-shape":
      assert(knowledgeManifest.pages.length === 51, "expected 51 total PDF pages");
      assert(knowledgeManifest.documents.length === 3, "expected three source documents");
      return "51 pages across three source documents";
    case "process-specific-175a": {
      const tig = calculateDutyCycle({ process: "tig", inputVoltage: 240, amperage: 175 });
      const stick = calculateDutyCycle({ process: "stick", inputVoltage: 240, amperage: 175 });
      assert(tig.ratedPercent === 30, "expected TIG 30% at 175A/240V");
      assert(stick.ratedPercent === 25, "expected stick 25% at 175A/240V");
      return "TIG 30% vs stick 25%; process context changes the answer";
    }
    case "wire-no-arc":
      return assertRetrieved("why does wire feed but arc not ignite", "owner-manual:pdf-43");
    case "porosity-natural":
      return assertRetrieved("porosity in weld metal likely solutions", "owner-manual:pdf-43");
    case "generator-specs":
      return assertRetrieved("what size generator do I need input current", "owner-manual:pdf-7");
    case "spool-gun":
      return assertRetrieved("how do I attach spool gun aluminum", "owner-manual:pdf-17");
    case "cross-page-penetration": {
      const wireIds = searchManual("wire weld penetration workpiece heat control", { limit: 5 })
        .map((hit) => hit.source.id);
      const stickIds = searchManual("stick weld diagnosis workpiece heat control penetration", { limit: 5 })
        .map((hit) => hit.source.id);
      assert(wireIds.includes("owner-manual:pdf-36"), "expected wire penetration page 36");
      assert(stickIds.includes("owner-manual:pdf-38"), "expected stick diagnosis page 38");
      return "wire page 36 and stick page 38 both retrieved";
    }
    default:
      throw new Error(`unknown oracle ${oracle}`);
  }
}

function assertRetrieved(query: string, sourceId: string): string {
  const ids = searchManual(query, { limit: 5 }).map((hit) => hit.source.id);
  assert(ids.includes(sourceId), `expected ${sourceId} in top five, got ${ids.join(", ")}`);
  return `${sourceId} retrieved at rank ${ids.indexOf(sourceId) + 1}`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
