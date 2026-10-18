#!/usr/bin/env node
// Step 2 of the AI Search Audit (Full): every check over the reading, the agent's judgement files
// validated and compared with the page, and the report. No network, no model: the scripts only
// count, compare and draw; the judgement in questions.json, brand.json and reviews.json was
// written by the agent running the skill, and the report marks it as such.
//
// One page:
//   node scripts/audit.mjs reading.json [--questions questions.json] [--brand brand.json] [--reviews reviews.json]
//        [--style style.json] [--keyword "phrase"] [--html report.html] [--md report.md] [--json export.json]
//        [--compare old-export.json] [--history dir | --no-history] [--check]
// A site (the readings and site.json that read.mjs --urls / --sitemap wrote):
//   node scripts/audit.mjs --site readings/site.json [--out-dir report] [--questions-dir dir] [--style-dir dir] [--brand brand.json]
//        [--reviews reviews.json] [--keyword "phrase"] [--compare old-site.json] [--history dir | --no-history] [--check]
//
// --check validates the judgement files against the reading(s) and writes nothing.
// Every run saves its export as a snapshot under the history folder (default ~/.ai-search-audit/history,
// or $AI_SEARCH_AUDIT_HISTORY; never inside the skill's folder), which the report reads back for the
// timeline and the drift, and every report carries the whole history in a JSON block. --history-from
// takes earlier reports, exports or history folders and adds their runs (2.110). The old default,
// ./.ai-search-audit/history in the working directory, is read and copied in.
// A refused reading (ok:false) still gets its report: the URL and the reason, nothing else.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildModel } from "./lib/model.mjs";
import { renderRefusal, renderReport } from "./lib/report.mjs";
import { buildExport, buildRefusalExport, renderMarkdown, renderRefusalMarkdown } from "./lib/outputs.mjs";
import { EXPORT_SCHEMA, READING_SCHEMA } from "./lib/version.mjs";
import { validateQuestions } from "./lib/questions.mjs";
import { validateBrand } from "./lib/brand.mjs";
import { validateReviews } from "./lib/reviews.mjs";
import { textModules } from "./lib/checks.mjs";
import { computeGenerated, validateStyle } from "./vendor/vectorscope/generatedText.mjs";
import { compareFindings, DEFAULT_HISTORY_DIR, history, historyIndex, historyPack, importHistory, resolveHistoryDir, saveSnapshot } from "./lib/history.mjs";
import { SITE_READING_SCHEMA } from "./lib/site.mjs";
import { buildSiteExport, buildSiteModel, buildSiteRefusalExport, renderSiteMarkdown, renderSiteRefusal, renderSiteRefusalMarkdown, renderSiteReport, SITE_EXPORT_SCHEMA } from "./lib/siteReport.mjs";

const USAGE = [
  "Usage: node scripts/audit.mjs reading.json [--questions questions.json] [--brand brand.json] [--reviews reviews.json] [--style style.json]",
  '       [--keyword "phrase"] [--html report.html] [--md report.md] [--json export.json]',
  "       [--compare old-export.json] [--history dir | --no-history] [--check]",
  "   or: node scripts/audit.mjs --site readings/site.json [--out-dir report] [--questions-dir dir] [--brand brand.json]",
  '       [--reviews reviews.json] [--keyword "phrase"] [--compare old-site.json] [--history dir | --no-history] [--history-from file|dir …] [--check]',
].join("\n");

function parseArgs(argv) {
  const out = { reading: null, html: null, md: null, json: null, questions: null, brand: null, reviews: null, style: null, styleDir: null, keyword: null, check: false, compare: null, history: null, historyFrom: [], noHistory: false, site: null, outDir: "report", questionsDir: null };
  const takes = { "--html": "html", "--md": "md", "--json": "json", "--questions": "questions", "--brand": "brand", "--reviews": "reviews", "--style": "style", "--style-dir": "styleDir", "--keyword": "keyword", "--compare": "compare", "--history": "history", "--site": "site", "--out-dir": "outDir", "--questions-dir": "questionsDir" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (takes[arg]) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} needs a value`);
      out[takes[arg]] = v;
    } else if (arg === "--history-from") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--history-from needs a value");
      out.historyFrom.push(v);
    } else if (arg === "--check") out.check = true;
    else if (arg === "--no-history") out.noHistory = true;
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else if (!out.reading) out.reading = arg;
    else throw new Error(`One reading only; also given: ${arg}. For several pages use --site.`);
  }
  return out;
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
if (args.help || (!args.reading && !args.site) || (args.reading && args.site)) {
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}

const readJson = (file, what) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`REFUSED   ${file} is not a readable JSON file (${what}): ${error.message}`);
    process.exit(1);
  }
};
// The history folder: the user's own, never the skill's (an update replaces that), never lost to a new version.
const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (args.noHistory && args.historyFrom.length) {
  console.error("REFUSED   --history-from adds runs to the history, and --no-history turns it off: give one of them.");
  process.exit(1);
}
const where = args.noHistory ? { dir: null, moved: null } : resolveHistoryDir(args.history, { skillDir: SKILL_DIR });
const historyDir = where.dir;
if (where.moved === "inside_skill") console.log(`history   ${args.history} is inside the skill's folder, which an update replaces; kept in ${historyDir} instead`);
if (historyDir && !args.check) {
  // The pre-2.110 default lived in the working directory, often the skill's own folder: copy it in.
  const legacy = resolve(DEFAULT_HISTORY_DIR);
  if (existsSync(legacy) && legacy !== resolve(historyDir)) {
    const got = importHistory(historyDir, [legacy]);
    if (got.imported) console.log(`history   ${got.imported} run${got.imported === 1 ? "" : "s"} copied in from ${legacy}`);
  }
  if (args.historyFrom.length) {
    const got = importHistory(historyDir, args.historyFrom);
    console.log(`history   from ${got.files} file${got.files === 1 ? "" : "s"}: ${got.imported} run${got.imported === 1 ? "" : "s"} added, ${got.already} already here${got.unreadable.length ? ` · not readable as a report, an export or a history: ${got.unreadable.join(", ")}` : ""}`);
  }
}

/** The judgement files for one reading, each validated against it, or the run stops and says what to fix. */
function judge(reading, files, tag = "") {
  const extra = { keyword: args.keyword };
  const modules = textModules(reading, { keyword: args.keyword });
  const judged = [
    ["questions", files.questions, (x) => validateQuestions(x, reading.vs.passages, { keyword: modules.keyword.keyword })],
    ["brand", files.brand, validateBrand],
    ["reviews", files.reviews, validateReviews],
    ["style", files.style, (x) => validateStyle(x, reading.vs.passages)],
  ];
  for (const [key, file, validate] of judged) {
    if (!file) continue;
    try {
      extra[key] = validate(readJson(file, key));
    } catch (error) {
      console.error(`REFUSED   ${file}${tag}: ${error.message}`);
      process.exit(1);
    }
    for (const w of extra[key].warnings || []) console.log(`warning   ${file}${tag}: ${w}`);
    const j = extra[key].judgement;
    console.log(`${key.padEnd(9)} ${file}${tag} ok · judged by ${j.agent || "agent not stated"} · ${j.model || "model not stated"}`);
  }
  return extra;
}

/** An older export to compare with: a page export, or the page's entry in a site export. */
function olderFor(old, url) {
  if (!old) return null;
  if (old.schema === EXPORT_SCHEMA && !old.refused) return { createdAt: old.createdAt, url: old.page?.url, findings: old.findings };
  if (old.schema === SITE_EXPORT_SCHEMA) {
    const p = old.pages.find((x) => x.url === url) || null;
    return p && p.ok ? { createdAt: p.createdAt || old.createdAt, url: p.url, findings: p.findings } : null;
  }
  return null;
}
function loadCompare(file) {
  if (!file) return null;
  const old = readJson(file, "compare");
  if (old.schema !== EXPORT_SCHEMA && old.schema !== SITE_EXPORT_SCHEMA) {
    console.error(`REFUSED   ${file} is not an ai-search-audit export (schema ${JSON.stringify(old.schema)}); --compare takes export.json (one page) or site.json from a site report.`);
    process.exit(1);
  }
  if (old.refused) {
    console.error(`REFUSED   ${file} is the export of a refused reading (${old.reasonCode}): there are no findings to compare.`);
    process.exit(1);
  }
  return old;
}

/** One page, end to end: the model, before and after, the history, and the three outputs. */
function auditPage(reading, extra, { old = null, site = null, out = {} } = {}) {
  if (!reading.ok) {
    const exp = buildRefusalExport(reading);
    if (out.html) writeFileSync(out.html, renderRefusal(reading, { site }));
    if (out.md) writeFileSync(out.md, renderRefusalMarkdown(reading));
    if (out.json) writeFileSync(out.json, JSON.stringify(exp, null, 2));
    if (historyDir && exp.page.url) {
      saveSnapshot(historyDir, exp);
      if (out.html) writeFileSync(out.html, renderRefusal(reading, { site, historyPack: historyPack(historyDir, exp) }));
    }
    return { model: null, exp, hist: null, compare: null };
  }
  const model = buildModel(reading, extra);
  // How generated the text sounds: the writing patterns' own text, each passage, the swap test.
  model.generated = computeGenerated({ sections: reading.facts.sections || null, passages: reading.vs.passages, style: extra.style ?? null });
  if (site) model.site = site;
  let exp = buildExport(model);
  const before = olderFor(old, exp.page.url);
  if (old && !before) console.log(`compare   ${exp.page.url}: not in the older export, so nothing to compare`);
  if (before) {
    model.compare = { before: { createdAt: before.createdAt, url: before.url }, sameUrl: before.url === exp.page.url, ...compareFindings(before, exp) };
    delete model.compare.counts;
    model.compare.counts = { fixed: model.compare.fixed.length, new: model.compare.new.length, unchanged: model.compare.unchanged.length };
  }
  if (historyDir) model.history = history(historyDir, exp);
  exp = buildExport(model);
  if (historyDir) {
    saveSnapshot(historyDir, exp);
    // Every run this history holds, any page and any site: listed by URL, and carried inside the report.
    model.historyPack = historyPack(historyDir, exp);
    model.historyIndex = historyIndex(null, exp, model.historyPack);
  }
  if (out.html) writeFileSync(out.html, renderReport(model));
  if (out.md) writeFileSync(out.md, renderMarkdown(model));
  // The written export lists every audit in the history; the snapshot does not carry that list.
  if (out.json) writeFileSync(out.json, JSON.stringify(model.historyIndex ? { ...exp, historyIndex: model.historyIndex } : exp, null, 2));
  return { model, exp, hist: model.history || null, compare: model.compare || null };
}

// ── one page ──────────────────────────────────────────────────────────────────
if (args.reading) {
  if (!args.check && !args.html && !args.md && !args.json) args.html = "report.html";
  const reading = readJson(args.reading, "reading");
  if (reading.schema !== READING_SCHEMA) {
    console.error(`REFUSED   ${args.reading} is not an ai-search-audit reading (schema ${JSON.stringify(reading.schema)}, expected ${READING_SCHEMA}). Run read.mjs first.`);
    process.exit(1);
  }
  if (!reading.ok) {
    if (args.check) {
      console.log(`REFUSED   ${reading.reasonCode}: the reading was refused, so there is nothing to judge.`);
      process.exit(2);
    }
    auditPage(reading, {}, { out: args });
    console.log(`REFUSED   ${reading.reasonCode}${reading.status ? ` (HTTP ${reading.status})` : ""}`);
    for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
    process.exit(2);
  }
  const extra = judge(reading, { questions: args.questions, brand: args.brand, reviews: args.reviews, style: args.style });
  const old = loadCompare(args.compare);
  if (args.check) process.exit(0);
  const { model, hist, compare } = auditPage(reading, extra, { old, out: args });
  const c = model.counts;
  console.log(`url       ${reading.fetch.finalUrl}`);
  console.log(`problems  ${model.findings.length} · blocking ${c.blocking} · high ${c.high} · medium ${c.medium} · low ${c.low}`);
  console.log(`tiles     ${model.tiles.map((t) => `${t.id} ${t.state}`).join(" · ")}`);
  if (model.keyword) console.log(`keyword   “${model.keyword.keyword}” (${model.keyword.source === "given" ? "--keyword" : "from the h1"})`);
  const p = model.modules.patterns;
  console.log(`patterns  ${p.analysed ? `${p.language} · ${p.wordCount} words · ${p.findings.length} signals` : `not analysed (${p.reason})`}`);
  if (model.modules.locales) console.log(`locales   ${model.modules.locales.compared.map((x) => `${x.hreflang} ${x.aligned ? `${x.differ} differ` : "not aligned"}`).join(" · ")}`);
  for (const f of model.findings) console.log(`  ${String(f.pin).padStart(2)} [${f.severity}] ${f.code}${f.layer === "judgement" ? " (judgement)" : ""}${f.where ? `  @ ${f.where.slice(0, 90)}` : ""}`);
  const cl = model.checklist;
  console.log(`checklist ${["pass", "fail", "warn", "na", "none"].map((s) => `${s} ${cl.filter((x) => x.state === s).length}`).join(" · ")}`);
  for (const cap of model.caps) console.log(`not done  ${cap.t[0]}`);
  if (compare) console.log(`compare   since ${compare.before.createdAt}: ${compare.counts.fixed} fixed · ${compare.counts.new} new · ${compare.counts.unchanged} unchanged`);
  if (model.historyIndex) console.log(`history   ${model.historyIndex.runs} run${model.historyIndex.runs === 1 ? "" : "s"} of ${model.historyIndex.pages.length} page${model.historyIndex.pages.length === 1 ? "" : "s"} on ${model.historyIndex.sites} site${model.historyIndex.sites === 1 ? "" : "s"} carried in the report`);
  if (hist) console.log(`history   ${hist.total} run${hist.total === 1 ? "" : "s"} in ${hist.folder}${hist.drift ? ` · since ${hist.drift.since}: ${hist.drift.comparable ? `${hist.drift.changed} changes` : "not comparable"}` : " · first run"}`);
  else console.log("history   not saved (--no-history)");
  for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
  process.exit(0);
}

// ── a site ────────────────────────────────────────────────────────────────────
const manifest = readJson(args.site, "site");
if (manifest.schema !== SITE_READING_SCHEMA) {
  console.error(`REFUSED   ${args.site} is not a site reading (schema ${JSON.stringify(manifest.schema)}, expected ${SITE_READING_SCHEMA}). Run read.mjs --urls or --sitemap first.`);
  process.exit(1);
}
if (manifest.refused) {
  // 2.108: the site itself is refused; the report is the refusal and where the run stopped.
  if (args.check) {
    console.log(`REFUSED   ${manifest.refused.reasonCode}: the site was refused, so there is nothing to judge.`);
    process.exit(2);
  }
  mkdirSync(args.outDir, { recursive: true });
  writeFileSync(join(args.outDir, "index.html"), renderSiteRefusal(manifest));
  writeFileSync(join(args.outDir, "site.md"), renderSiteRefusalMarkdown(manifest));
  writeFileSync(join(args.outDir, "site.json"), JSON.stringify(buildSiteRefusalExport(manifest), null, 2));
  console.log(`REFUSED   ${manifest.refused.reasonCode}: the site audit stopped at ${manifest.refused.url}; no page of this site is analysed`);
  console.log(`html      ${join(args.outDir, "index.html")}`);
  console.log(`md        ${join(args.outDir, "site.md")}`);
  console.log(`json      ${join(args.outDir, "site.json")}`);
  process.exit(2);
}
const base = dirname(resolve(args.site));
const entries = [];
for (const p of manifest.pages) {
  const file = join(base, p.reading || `${p.slug}.json`);
  if (!existsSync(file)) {
    console.error(`REFUSED   ${file} is missing: site.json lists it, and read.mjs writes it beside site.json.`);
    process.exit(1);
  }
  const reading = readJson(file, "reading");
  if (reading.schema !== READING_SCHEMA) {
    console.error(`REFUSED   ${file} is not an ai-search-audit reading.`);
    process.exit(1);
  }
  let extra = {};
  if (reading.ok) {
    const q = args.questionsDir ? join(args.questionsDir, `${p.slug}.json`) : null;
    const st = args.styleDir ? join(args.styleDir, `${p.slug}.json`) : null;
    extra = judge(reading, { questions: q && existsSync(q) ? q : null, brand: args.brand, reviews: args.reviews, style: st && existsSync(st) ? st : null }, ` [${p.slug}]`);
    if (args.styleDir && !(st && existsSync(st))) console.log(`style     ${p.slug}: no ${p.slug}.json in ${args.styleDir}; the swap test was not made for this page`);
    if (args.questionsDir && !(q && existsSync(q))) console.log(`questions ${p.slug}: no ${p.slug}.json in ${args.questionsDir}; that judgement was not made for this page`);
  }
  entries.push({ slug: p.slug, url: p.url, reading, extra });
}
const old = loadCompare(args.compare);
if (args.check) process.exit(0);

const pagesDir = join(args.outDir, "pages");
mkdirSync(pagesDir, { recursive: true });
const pathOf = (url) => {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return url;
  }
};
// Each page's report links to the others: a first pass for the counts, then the pages are written.
const pass = entries.map((e) => ({ ...e, model0: e.reading.ok ? buildModel(e.reading, e.extra) : null }));
const navPages = pass.map((e) => ({ slug: e.slug, url: e.url, path: pathOf(e.reading.fetch?.finalUrl || e.url), ok: Boolean(e.model0), total: e.model0 ? e.model0.findings.length : 0, reasonCode: e.reading.reasonCode }));
const done = [];
for (const e of pass) {
  const site = { current: e.slug, pages: navPages, evaluated: manifest.evaluated, total: manifest.total, leftOut: manifest.leftOut.count };
  const out = { html: join(pagesDir, `${e.slug}.html`), md: join(pagesDir, `${e.slug}.md`), json: join(pagesDir, `${e.slug}.json`) };
  const r = auditPage(e.reading, e.extra, { old, site, out });
  done.push({ slug: e.slug, url: e.url, reading: e.reading, model: r.model, exp: r.exp, history: r.hist, compare: r.compare });
  console.log(`  ${e.reading.ok ? `${String(r.model.findings.length).padStart(3)} problems` : `REFUSED ${e.reading.reasonCode}`}  ${e.url}${r.hist?.drift ? ` · ${r.hist.drift.changed ?? "?"} changes since ${r.hist.drift.since}` : ""}${r.compare ? ` · ${r.compare.counts.fixed} fixed, ${r.compare.counts.new} new` : ""}`);
}
const sm = buildSiteModel(manifest, done);
if (historyDir) sm.historyPack = historyPack(historyDir);
writeFileSync(join(args.outDir, "index.html"), renderSiteReport(sm));
writeFileSync(join(args.outDir, "site.md"), renderSiteMarkdown(sm));
writeFileSync(join(args.outDir, "site.json"), JSON.stringify(buildSiteExport(sm, done), null, 2));
console.log(`site      ${manifest.evaluated} of ${manifest.total} pages evaluated${manifest.leftOut.count ? ` · ${manifest.leftOut.count} left out` : ""} · ${sm.repeated.length} problems on several pages · ${sm.single.length} on one page`);
console.log(`history   ${historyDir ? `saved in ${historyDir}` : "not saved (--no-history)"}`);
console.log(`html      ${join(args.outDir, "index.html")} (and pages/<page>.html)`);
console.log(`md        ${join(args.outDir, "site.md")}`);
console.log(`json      ${join(args.outDir, "site.json")}`);
process.exit(0);
