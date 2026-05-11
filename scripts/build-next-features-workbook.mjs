import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "./node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "outputs", "next-features-roadmap");
const outputPath = path.join(outputDir, "terraria-companion-next-features.xlsx");
const previewPath = path.join(outputDir, "terraria-companion-next-features-summary.png");
const backlogPreviewPath = path.join(outputDir, "terraria-companion-next-features-backlog.png");

const backlog = [
  {
    area: "Player Progress",
    feature: "Drop Wishlist + Boss Loot Tracker",
    problem: "Boss progression ends at a win checkmark, so players still track target drops manually.",
    value: "Turns the app into a farming companion, not just a prep reference.",
    impact: "High",
    effort: "Medium",
    priority: "P1",
    release: "1.2",
    dependencies: "Boss drops data is already present; needs persisted drop-state UI.",
    notes: "Natural extension of Boss Tracker and Loadout Builder."
  },
  {
    area: "Loadouts",
    feature: "Side-by-Side Loadout Compare",
    problem: "Players can save loadouts, but cannot quickly compare two setups or see tradeoffs.",
    value: "Makes weapon, armor, and accessory choices easier before committing to a fight.",
    impact: "High",
    effort: "Medium",
    priority: "P1",
    release: "1.2",
    dependencies: "Leverages existing loadout persistence and item stat data.",
    notes: "Could compare totals like defense, damage, mobility, summons, and utility."
  },
  {
    area: "Crafting",
    feature: "Recipe Path Planner",
    problem: "Item Lookup shows recipes, but not the fastest route from current materials to a goal item.",
    value: "Reduces wiki hopping and gives players a clearer grind path.",
    impact: "High",
    effort: "Large",
    priority: "P1",
    release: "1.3",
    dependencies: "Needs recursive recipe traversal plus source-aware missing ingredient summaries.",
    notes: "Strong strategic differentiator for the app."
  },
  {
    area: "Boss Prep",
    feature: "Boss Readiness Checklist",
    problem: "Prep Guide is rich, but users still mentally track arena, buffs, summon item, and mobility prep.",
    value: "Makes boss attempts feel actionable and repeatable.",
    impact: "High",
    effort: "Small",
    priority: "P1",
    release: "1.2",
    dependencies: "Can reuse current boss strategy/prep data with lightweight checklist state.",
    notes: "Good quick win with visible user value."
  },
  {
    area: "Search",
    feature: "Saved Searches and Filter Presets",
    problem: "Power users repeat the same item, NPC, and biome filters every session.",
    value: "Improves retention and makes the app feel more personal.",
    impact: "Medium",
    effort: "Small",
    priority: "P2",
    release: "1.2",
    dependencies: "URL state and local persistence patterns already exist in the app.",
    notes: "Fits cleanly with the current shareable/filterable UI direction."
  },
  {
    area: "Progression",
    feature: "Account-Like Local Profiles",
    problem: "Multiple players or multiple worlds share one local state footprint today.",
    value: "Supports family/shared-device use and parallel playthroughs.",
    impact: "Medium",
    effort: "Medium",
    priority: "P2",
    release: "1.3",
    dependencies: "Needs state partitioning across boss progress, loadouts, and preferences.",
    notes: "Could stay fully local without needing a backend."
  },
  {
    area: "Content Discovery",
    feature: "Item Source Explorer",
    problem: "Players often want to browse by acquisition path first, not by known item name.",
    value: "Helps answer questions like 'what can I get from this biome/event/vendor right now?'",
    impact: "Medium",
    effort: "Medium",
    priority: "P2",
    release: "1.3",
    dependencies: "Requires stronger normalization of item sources and source-based filters.",
    notes: "Pairs well with the existing Biome Guide and NPC Guide."
  },
  {
    area: "Planning",
    feature: "Session Planner",
    problem: "The app covers many domains, but does not yet combine them into a short play-session plan.",
    value: "Gives players a 'what should I do next?' answer in one place.",
    impact: "High",
    effort: "Large",
    priority: "P2",
    release: "1.4",
    dependencies: "Would combine boss readiness, build stage, missing items, and NPC/biome goals.",
    notes: "Potential flagship workflow if scoped carefully."
  },
  {
    area: "Shareability",
    feature: "Full Guide Snapshot Share Links",
    problem: "Some filtered states are shareable, but there is no polished 'send this plan to a friend' flow.",
    value: "Makes collaboration and co-op preparation easier.",
    impact: "Medium",
    effort: "Small",
    priority: "P3",
    release: "1.2",
    dependencies: "Build on existing URL-backed state and copy-link patterns.",
    notes: "Useful for social reach without much data-model risk."
  },
  {
    area: "Data Ops",
    feature: "Content Coverage Dashboard",
    problem: "Recent releases show lots of manual data expansion, which is hard to audit at a glance.",
    value: "Improves maintainability and helps choose the next data/content release intelligently.",
    impact: "Medium",
    effort: "Medium",
    priority: "P3",
    release: "1.3",
    dependencies: "Could read JSON data counts and validation outputs into a maintainer-only page.",
    notes: "More internal-facing, but useful if content velocity stays high."
  }
];

const priorityRank = { P1: 1, P2: 2, P3: 3 };
backlog.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.feature.localeCompare(b.feature));

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const features = workbook.worksheets.add("Feature Backlog");

summary.showGridLines = false;
features.freezePanes.freezeRows(1);
features.showGridLines = false;

summary.getRange("A1:H1").merge();
summary.getRange("A1").values = [["Terraria Companion - Next Features"]];
summary.getRange("A2:H2").merge();
summary.getRange("A2").values = [[
  "A planning workbook based on the current app surface, recent changelog, and the biggest workflow gaps."
]];

const counts = {
  total: backlog.length,
  p1: backlog.filter((item) => item.priority === "P1").length,
  quickWins: backlog.filter((item) => item.effort === "Small").length,
  highImpact: backlog.filter((item) => item.impact === "High").length,
};

summary.getRange("A4:D5").values = [
  ["Total Candidates", "P1 Features", "Quick Wins", "High-Impact Bets"],
  [counts.total, counts.p1, counts.quickWins, counts.highImpact],
];

summary.getRange("A7").values = [["Recommended sequence"]];
summary.getRange("A8:D12").values = [
  ["Wave", "Focus", "Why now", "Suggested features"],
  ["1", "Actionable prep", "Builds directly on the current boss and loadout workflows.", "Boss Readiness Checklist; Drop Wishlist + Boss Loot Tracker"],
  ["2", "Decision support", "Makes saved gear and item data more useful during play.", "Side-by-Side Loadout Compare; Saved Searches and Filter Presets"],
  ["3", "Deeper progression planning", "Creates stronger long-session value and differentiation.", "Recipe Path Planner; Session Planner"],
  ["4", "Platform polish", "Improves sharing and multi-profile use once core workflows are stronger.", "Full Guide Snapshot Share Links; Account-Like Local Profiles"],
];

summary.getRange("F4:G7").values = [
  ["Priority", "Count"],
  ["P1", counts.p1],
  ["P2", backlog.filter((item) => item.priority === "P2").length],
  ["P3", backlog.filter((item) => item.priority === "P3").length],
];

const chart = summary.charts.add("bar", summary.getRange("F4:G7"));
chart.title = "Backlog by Priority";
chart.hasLegend = false;
chart.xAxis = { axisType: "textAxis" };
chart.setPosition("F9", "H22");

summary.getRange("A1:H2").format = {
  fill: "#13315C",
  font: { color: "#FFFFFF", bold: true },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
summary.getRange("A1").format = { ...summary.getRange("A1").format, font: { color: "#FFFFFF", bold: true, size: 16 } };
summary.getRange("A4:D4").format = {
  fill: "#1E4E5F",
  font: { color: "#FFFFFF", bold: true },
  horizontalAlignment: "center",
};
summary.getRange("A5:D5").format = {
  fill: "#F6FBFF",
  horizontalAlignment: "center",
  font: { bold: true, color: "#16324F" },
};
summary.getRange("A7:D8").format = {
  fill: "#DCEAF7",
  font: { bold: true, color: "#16324F" },
  wrapText: true,
};
summary.getRange("A9:D12").format = { wrapText: true, verticalAlignment: "top" };
summary.getRange("F4:G4").format = {
  fill: "#1E4E5F",
  font: { color: "#FFFFFF", bold: true },
  horizontalAlignment: "center",
};

summary.getRange("A1:H22").format.borders = {
  top: { style: "Continuous", color: "#C8D8E8" },
  bottom: { style: "Continuous", color: "#C8D8E8" },
  left: { style: "Continuous", color: "#C8D8E8" },
  right: { style: "Continuous", color: "#C8D8E8" }
};

summary.getRange("A1").format.rowHeightPx = 30;
summary.getRange("A2").format.rowHeightPx = 34;
summary.getRange("A:A").format.columnWidthPx = 130;
summary.getRange("B:B").format.columnWidthPx = 150;
summary.getRange("C:C").format.columnWidthPx = 220;
summary.getRange("D:D").format.columnWidthPx = 240;
summary.getRange("F:F").format.columnWidthPx = 90;
summary.getRange("G:G").format.columnWidthPx = 70;

const featureHeaders = [[
  "Priority",
  "Area",
  "Feature",
  "Impact",
  "Effort",
  "Suggested Release",
  "Problem / Opportunity",
  "User Value",
  "Dependencies",
  "Notes",
]];

const featureRows = backlog.map((item) => [
  item.priority,
  item.area,
  item.feature,
  item.impact,
  item.effort,
  item.release,
  item.problem,
  item.value,
  item.dependencies,
  item.notes,
]);

features.getRange(`A1:J${featureRows.length + 1}`).values = [...featureHeaders, ...featureRows];
const table = features.tables.add(`A1:J${featureRows.length + 1}`, true, "FeatureBacklog");
table.style = "TableStyleMedium2";

features.getRange(`A2:A${featureRows.length + 1}`).conditionalFormats.add("containsText", {
  text: "P1",
  format: { fill: "#FDE68A", font: { bold: true, color: "#7C2D12" } }
});
features.getRange(`A2:A${featureRows.length + 1}`).conditionalFormats.add("containsText", {
  text: "P2",
  format: { fill: "#BFDBFE", font: { bold: true, color: "#1E3A8A" } }
});
features.getRange(`A2:A${featureRows.length + 1}`).conditionalFormats.add("containsText", {
  text: "P3",
  format: { fill: "#E5E7EB", font: { bold: true, color: "#374151" } }
});

features.getRange("A1:J1").format = {
  fill: "#13315C",
  font: { color: "#FFFFFF", bold: true },
  wrapText: true,
  horizontalAlignment: "center",
};
features.getRange(`A2:J${featureRows.length + 1}`).format = {
  wrapText: true,
  verticalAlignment: "top",
};

const widths = [78, 110, 220, 90, 90, 110, 260, 250, 250, 220];
for (let i = 0; i < widths.length; i += 1) {
  features.getRangeByIndexes(0, i, featureRows.length + 1, 1).format.columnWidthPx = widths[i];
}

features.getRange(`A2:J${featureRows.length + 1}`).format.rowHeightPx = 84;

const inspection = await workbook.inspect({
  kind: "table",
  range: `Feature Backlog!A1:J${Math.min(featureRows.length + 1, 8)}`,
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 10,
});
console.log(inspection.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errorScan.ndjson);

const preview = await workbook.render({
  sheetName: "Summary",
  range: "A1:H22",
  scale: 2,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const backlogPreview = await workbook.render({
  sheetName: "Feature Backlog",
  range: `A1:J${Math.min(featureRows.length + 1, 11)}`,
  scale: 2,
  format: "png",
});
await fs.writeFile(backlogPreviewPath, new Uint8Array(await backlogPreview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);

console.log(outputPath);
