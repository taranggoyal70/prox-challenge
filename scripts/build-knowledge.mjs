import { createHash } from "node:crypto";
import { closeSync, cpSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const generatedDir = join(root, "src/knowledge/generated");
const pageRoot = join(root, "public/manual-pages");
const regionRoot = join(root, "public/manual-regions");
const manualsRoot = join(root, "public/manuals");
const buildLockPath = join(generatedDir, ".build-in-progress");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const padded = (page) => String(page).padStart(3, "0");

const documents = [
  { id: "owner-manual", title: "Vulcan OmniPro 220 Owner's Manual", sourcePath: "files/owner-manual.pdf", publicName: "owner-manual.pdf", pages: 48 },
  { id: "quick-start", title: "Vulcan OmniPro 220 Quick Start Guide", sourcePath: "files/quick-start-guide.pdf", publicName: "quick-start-guide.pdf", pages: 2 },
  { id: "selection-chart", title: "Welding Process Selection Chart", sourcePath: "files/selection-chart.pdf", publicName: "selection-chart.pdf", pages: 1 },
];

function cleanGeneratedFiles(directory, matcher) {
  if (!existsSync(directory)) return;
  for (const file of readdirSync(directory)) if (matcher.test(file)) unlinkSync(join(directory, file));
}

function commandVersion(command) {
  const result = spawnSync(command, ["-v"], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
    .trim()
    .split("\n")
    .find((line) => line.trim().length > 0);
  if (result.status !== 0 || !output) {
    throw new Error(`Required knowledge-build tool is unavailable or unversioned: ${command}`);
  }
  return output.trim();
}

function ownerSection(page) {
  if (page === 1) return "Cover";
  if (page <= 6) return "Safety";
  if (page === 7) return "Specifications";
  if (page <= 9) return "Controls";
  if (page <= 23) return "MIG / Flux-Cored Wire Welding";
  if (page <= 33) return "TIG / Stick Welding";
  if (page <= 40) return "Welding Tips";
  if (page <= 45) return "Maintenance and Troubleshooting";
  if (page <= 47) return "Parts List and Diagram";
  return "Warranty";
}

const curatedTags = {
  "owner-manual:pdf-8": ["front panel", "controls", "lcd", "knobs", "sockets"],
  "owner-manual:pdf-13": ["flux-core", "gasless", "DCEN", "ground positive", "wire feed negative", "polarity"],
  "owner-manual:pdf-14": ["MIG", "solid wire", "gas shielded", "DCEP", "ground negative", "wire feed positive", "polarity"],
  "owner-manual:pdf-19": ["duty cycle", "240V", "200A", "25 percent", "2.5 minutes", "7.5 minutes"],
  "owner-manual:pdf-24": ["TIG", "DCEN", "ground positive", "torch negative", "foot pedal", "polarity"],
  "owner-manual:pdf-27": ["stick", "DCEP", "ground negative", "electrode holder positive", "polarity"],
  "owner-manual:pdf-35": ["weld diagnosis", "wire speed", "voltage", "wrong polarity", "bead"],
  "owner-manual:pdf-36": ["penetration", "burn through", "heat control", "workpiece"],
  "owner-manual:pdf-37": ["porosity", "spatter", "crooked bead", "burn through", "CTWD"],
  "owner-manual:pdf-43": ["troubleshooting", "porosity", "MIG", "flux-core", "DCEP", "DCEN"],
  "owner-manual:pdf-45": ["wiring schematic", "MCU board", "remote board", "fan", "solenoid", "rectifier"],
  "quick-start:pdf-1": ["quick start", "wire spool", "feed mechanism", "nozzle", "contact tip"],
  "quick-start:pdf-2": ["quick start", "welding instructions"],
  "selection-chart:pdf-1": ["process selection", "MIG", "flux-core", "stick", "TIG", "material", "thickness", "gas", "skill level"],
};

const visualDefinitions = [
  { id: "selection-chart:process-matrix", sourceId: "selection-chart:pdf-1", caption: "Visual process-selection matrix comparing flux-cored, MIG, stick, and TIG by skill, gas, material, thickness, applications, and weld cleanliness.", entities: ["flux-cored", "MIG", "stick", "TIG", "steel", "stainless steel", "aluminum", "gas", "material thickness"], relationships: ["process depends on material and thickness", "MIG and TIG use shielding gas", "flux-core and stick suit outdoor conditions"], aliases: ["which process", "choose a welder", "process chart", "GMAW", "FCAW", "SMAW", "GTAW"], intents: ["choose a welding process", "compare weld cleanliness", "check material compatibility"], regions: [{ id: "matrix", label: "Four-process comparison matrix", bounds: { x: 0.01, y: 0.29, width: 0.98, height: 0.48 } }] },
  { id: "owner-manual:pdf-13:flux-core-polarity", sourceId: "owner-manual:pdf-13", caption: "DCEN gasless flux-cored polarity: ground clamp in positive socket and wire feed power cable in negative socket.", entities: ["positive socket", "negative socket", "ground clamp", "wire feed power cable", "DCEN"], relationships: ["ground clamp connects positive", "wire feed cable connects negative"], aliases: ["flux core polarity", "gasless polarity", "ground positive", "electrode negative"], intents: ["set up flux-cored welding", "check cable sockets"], regions: [{ id: "polarity", label: "Flux-cored DCEN cable diagram", bounds: { x: 0.43, y: 0.42, width: 0.53, height: 0.48 } }] },
  { id: "owner-manual:pdf-14:mig-polarity", sourceId: "owner-manual:pdf-14", caption: "DCEP gas-shielded solid-wire MIG polarity: ground clamp negative and wire feed power cable positive.", entities: ["positive socket", "negative socket", "ground clamp", "wire feed power cable", "DCEP"], relationships: ["ground clamp connects negative", "wire feed cable connects positive"], aliases: ["MIG polarity", "solid wire polarity", "ground negative", "electrode positive"], intents: ["set up MIG welding", "check cable sockets"], regions: [{ id: "polarity", label: "MIG DCEP cable diagram", bounds: { x: 0.43, y: 0.02, width: 0.54, height: 0.48 } }] },
  { id: "owner-manual:pdf-19:duty-cycle", sourceId: "owner-manual:pdf-19", caption: "Rated duty-cycle charts: 120VAC 40% at 100A and 240VAC 25% at 200A, plus 100% continuous ratings.", entities: ["120VAC", "240VAC", "100A", "200A", "25 percent", "40 percent", "ten-minute period"], relationships: ["200A at 240V permits 2.5 minutes welding and 7.5 minutes rest"], aliases: ["duty cycle chart", "cool down", "welding time", "rest time"], intents: ["calculate duty cycle", "avoid overheating"], regions: [{ id: "charts", label: "120V and 240V rated duty-cycle charts", bounds: { x: 0.51, y: 0.03, width: 0.45, height: 0.46 } }] },
  { id: "owner-manual:pdf-24:tig-polarity", sourceId: "owner-manual:pdf-24", caption: "TIG DCEN connections with ground clamp positive and TIG torch cable negative, including foot-pedal and gas-hose context.", entities: ["TIG torch", "ground clamp", "positive socket", "negative socket", "foot pedal", "shielding gas"], relationships: ["ground clamp connects positive", "TIG torch connects negative"], aliases: ["TIG polarity", "torch negative", "ground positive", "GTAW setup"], intents: ["set up TIG welding", "connect TIG torch"], regions: [{ id: "connections", label: "TIG torch and ground cable connections", bounds: { x: 0.04, y: 0.2, width: 0.92, height: 0.62 } }] },
  { id: "owner-manual:pdf-36:penetration", sourceId: "owner-manual:pdf-36", caption: "Cross-section diagrams comparing excessive, proper, and inadequate weld penetration with corrective actions.", entities: ["excess penetration", "proper penetration", "inadequate penetration", "workpiece", "weld bead"], relationships: ["heat and travel speed affect penetration"], aliases: ["burn through", "weld not adhering", "penetration profile"], intents: ["diagnose weld penetration", "compare bead profiles"], regions: [{ id: "profiles", label: "Weld penetration profile comparison", bounds: { x: 0.05, y: 0.04, width: 0.9, height: 0.43 } }] },
  { id: "owner-manual:pdf-37:porosity", sourceId: "owner-manual:pdf-37", caption: "Wire-weld porosity diagram and possible causes: polarity, shielding gas for MIG, contamination, travel speed, and CTWD.", entities: ["porosity", "weld bead", "shielding gas", "CTWD", "polarity", "contamination"], relationships: ["incorrect polarity or contamination can cause porosity", "shielding-gas checks apply to MIG"], aliases: ["holes in weld", "small cavities", "porous weld", "gas pockets"], intents: ["diagnose porosity", "fix holes in weld"], regions: [{ id: "porosity", label: "Porosity example and diagnostic list", bounds: { x: 0.03, y: 0.02, width: 0.47, height: 0.57 } }] },
  { id: "owner-manual:pdf-45:wiring-schematic", sourceId: "owner-manual:pdf-45", caption: "Full electrical wiring schematic showing AC input, rectifier, PFC/IGBT power stages, MCU board, remote board, fans, wire feeder, and solenoid valves.", entities: ["MCU board", "remote board", "fan", "wire feeder", "solenoid valve", "rectifier", "PFC", "IGBT"], relationships: ["remote board connects torch and pedal inputs", "MCU board controls wire feeder and solenoids"], aliases: ["electrical diagram", "circuit diagram", "control board wiring", "internal wiring"], intents: ["inspect wiring schematic", "locate control-board connections"], regions: [{ id: "schematic", label: "OmniPro 220 wiring schematic", bounds: { x: 0.04, y: 0.05, width: 0.88, height: 0.88 } }] },
];

const sectionFor = (id, page) => id === "quick-start" ? "Quick Start Guide" : id === "selection-chart" ? "Process Selection Chart" : ownerSection(page);

async function build() {
  for (const directory of [generatedDir, pageRoot, regionRoot, manualsRoot]) mkdirSync(directory, { recursive: true });
  const lock = openSync(buildLockPath, "wx");
  closeSync(lock);
  let temp;
  try {
    cleanGeneratedFiles(regionRoot, /^[a-z0-9-]+\.webp$/);
    const popplerTextVersion = commandVersion("pdftotext");
    const popplerImageVersion = commandVersion("pdftoppm");
    const manifestDocuments = [];
    const pages = [];
    temp = mkdtempSync(join(tmpdir(), "arclens-knowledge-"));
    for (const document of documents) {
      const sourcePath = join(root, document.sourcePath);
      const sourceBytes = readFileSync(sourcePath);
      const sourceSha256 = hash(sourceBytes);
      cpSync(sourcePath, join(manualsRoot, document.publicName));
      manifestDocuments.push({ id: document.id, title: document.title, sourcePath: document.sourcePath, publicUrl: `/manuals/${document.publicName}`, sha256: sourceSha256, pages: document.pages });
      const outputDir = join(pageRoot, document.id);
      mkdirSync(outputDir, { recursive: true });
      cleanGeneratedFiles(outputDir, /^page-\d{3}\.webp$/);
      for (let page = 1; page <= document.pages; page += 1) {
        const prefix = `${document.id}-${padded(page)}`;
        const textPath = join(temp, `${prefix}.txt`);
        const imagePrefix = join(temp, prefix);
        execFileSync("pdftotext", ["-f", String(page), "-l", String(page), "-layout", sourcePath, textPath]);
        execFileSync("pdftoppm", ["-f", String(page), "-l", String(page), "-r", "144", "-png", "-singlefile", sourcePath, imagePrefix]);
        const text = readFileSync(textPath, "utf8").replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trim();
        const assetPath = join(outputDir, `page-${padded(page)}.webp`);
        await sharp(`${imagePrefix}.png`).webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(assetPath);
        const id = `${document.id}:pdf-${page}`;
        pages.push({ source: { id, documentId: document.id, documentTitle: document.title, pdfPageNumber: page, printedPageLabel: document.id === "owner-manual" && page > 1 ? String(page) : null, section: sectionFor(document.id, page), assetUrl: `/manual-pages/${document.id}/page-${padded(page)}.webp`, assetSha256: hash(readFileSync(assetPath)), textSha256: hash(text) }, text, tags: [...new Set([sectionFor(document.id, page), ...(curatedTags[id] ?? [])])], safety: document.id === "owner-manual" && (page <= 6 || /warning|hazard|shock|fire|fume/i.test(text)) });
      }
    }
    const pageMap = new Map(pages.map((page) => [page.source.id, page]));
    const visuals = [];
    for (const definition of visualDefinitions) {
      const page = pageMap.get(definition.sourceId);
      if (!page) throw new Error(`visual source missing: ${definition.sourceId}`);
      const pagePath = join(root, "public", page.source.assetUrl.slice(1));
      const metadata = await sharp(pagePath).metadata();
      const bounds = definition.regions[0].bounds;
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      const left = Math.max(0, Math.floor(bounds.x * width));
      const top = Math.max(0, Math.floor(bounds.y * height));
      const cropWidth = Math.min(width - left, Math.max(1, Math.ceil(bounds.width * width)));
      const cropHeight = Math.min(height - top, Math.max(1, Math.ceil(bounds.height * height)));
      const slug = definition.id.replace(/:/g, "-");
      const cropPath = join(regionRoot, `${slug}.webp`);
      await sharp(pagePath).extract({ left, top, width: cropWidth, height: cropHeight }).webp({ quality: 92, effort: 6 }).toFile(cropPath);
      visuals.push({ ...definition, assetUrl: `/manual-regions/${slug}.webp`, assetSha256: hash(readFileSync(cropPath)) });
    }
    const corpusVersion = hash(manifestDocuments.map((document) => document.sha256).join(":")).slice(0, 16);
    const manifest = { schemaVersion: 1, corpusVersion, generatorVersion: "1.0.0", toolchain: { pdftotext: popplerTextVersion, pdftoppm: popplerImageVersion, sharp: sharp.versions.sharp, dpi: "144", webp: "quality=90,effort=6" }, documents: manifestDocuments, pages };
    writeFileSync(join(generatedDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(join(generatedDir, "visual-evidence.json"), `${JSON.stringify(visuals, null, 2)}\n`);
    const wireRatings = [
      [120, 100, 40, 4, 6], [120, 75, 100, 10, 0],
      [240, 200, 25, 2.5, 7.5], [240, 115, 100, 10, 0],
    ];
    const tigRatings = [
      [120, 125, 40, 4, 6], [120, 90, 100, 10, 0],
      [240, 175, 30, 3, 7], [240, 105, 100, 10, 0],
    ];
    const stickRatings = [
      [120, 80, 40, 4, 6], [120, 60, 100, 10, 0],
      [240, 175, 25, 2.5, 7.5], [240, 100, 100, 10, 0],
    ];
    const dutyFacts = [
      ...["mig", "flux-core"].flatMap((process) =>
        wireRatings.map(([inputVoltage, amperage, ratedPercent, weldingMinutes, restingMinutes]) => ({
          id: `duty:${process}:${inputVoltage}v:${amperage}a`, predicate: "duty_cycle",
          inputs: { process, inputVoltage, amperage },
          output: { ratedPercent, weldingMinutes, restingMinutes }, sourceIds: ["owner-manual:pdf-19"],
        })),
      ),
      ...tigRatings.map(([inputVoltage, amperage, ratedPercent, weldingMinutes, restingMinutes]) => ({
        id: `duty:tig:${inputVoltage}v:${amperage}a`, predicate: "duty_cycle",
        inputs: { process: "tig", inputVoltage, amperage },
        output: { ratedPercent, weldingMinutes, restingMinutes }, sourceIds: ["owner-manual:pdf-29"],
      })),
      ...stickRatings.map(([inputVoltage, amperage, ratedPercent, weldingMinutes, restingMinutes]) => ({
        id: `duty:stick:${inputVoltage}v:${amperage}a`, predicate: "duty_cycle",
        inputs: { process: "stick", inputVoltage, amperage },
        output: { ratedPercent, weldingMinutes, restingMinutes }, sourceIds: ["owner-manual:pdf-29"],
      })),
    ];
    const polarityFacts = [
      { id: "polarity:flux-core", predicate: "polarity_layout", inputs: { process: "flux-core" }, output: { process: "Flux-cored (gasless)", polarity: "DCEN", groundSocket: "positive", electrodeSocket: "negative", electrodeLabel: "Wire feed power cable" }, sourceIds: ["owner-manual:pdf-13"] },
      { id: "polarity:mig", predicate: "polarity_layout", inputs: { process: "mig" }, output: { process: "MIG (gas-shielded solid wire)", polarity: "DCEP", groundSocket: "negative", electrodeSocket: "positive", electrodeLabel: "Wire feed power cable" }, sourceIds: ["owner-manual:pdf-14"] },
      { id: "polarity:tig", predicate: "polarity_layout", inputs: { process: "tig" }, output: { process: "TIG", polarity: "DCEN", groundSocket: "positive", electrodeSocket: "negative", electrodeLabel: "TIG torch cable" }, sourceIds: ["owner-manual:pdf-24"] },
      { id: "polarity:stick", predicate: "polarity_layout", inputs: { process: "stick" }, output: { process: "Stick", polarity: "DCEP", groundSocket: "negative", electrodeSocket: "positive", electrodeLabel: "Electrode holder cable" }, sourceIds: ["owner-manual:pdf-27"] },
    ];
    writeFileSync(join(generatedDir, "facts.json"), `${JSON.stringify({ schemaVersion: 1, corpusVersion, facts: [...dutyFacts, ...polarityFacts] }, null, 2)}\n`);
    console.log(`Built ${pages.length} pages and ${visuals.length} visual evidence records (${corpusVersion}).`);
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
    if (existsSync(buildLockPath)) unlinkSync(buildLockPath);
  }
}

await build();
