// The Markdown summary (English) and the JSON export, both from the same model as the HTML.
// The export carries every finding with its evidence, its rule sources and its Full layers (the
// plain description, "What the rule says" and the fix direction), the page state the drift
// compares, and, when they were made, before and after and the history.

import { CANNOT, LAYER, MARK, SEV, UI, dateOf, verdict, ZONE_LABEL } from "./copy.mjs";
import { generatedExport, generatedMarkdown } from "../vendor/vectorscope/generatedText.mjs";
import { CODES, SEVERITIES } from "./checks.mjs";
import { EXPORT_SCHEMA, PRODUCED_BY, SKILL_VERSION } from "./version.mjs";
import { EDITION, refusalLead, TOOL_NAME } from "./report.mjs";
import { explain, RULES_CHECKED } from "./explain.mjs";
import { source } from "./rules.mjs";
import { pageState } from "./history.mjs";
import { FINDINGS, REFUSAL_COPY, isRefusalCode, refusalReason } from "../vendor/vectorscope/refusal.mjs";

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

function zoneName(z) {
  if (z.kind === "section" || z.kind === "js") return `${z.label || z.headings[0] || ZONE_LABEL.untitled()[0]}${z.kind === "js" ? " · JavaScript" : ""}`;
  return (ZONE_LABEL[z.kind] || ZONE_LABEL.untitled)(z)[0];
}

/** The Markdown summary. */
export function renderMarkdown(model) {
  const r = model.reading;
  const o = [];
  o.push(`# ${TOOL_NAME} ${EDITION}: ${r.fetch.finalUrl}`, "");
  o.push(`${r.facts.head.title ? `${cell(r.facts.head.title)} · ` : ""}checked ${dateOf(r.createdAt)[0]} · skill ${SKILL_VERSION}`, "");
  o.push(`**${verdict(model.findings)[0]}** · ${model.findings.length} problems (${SEVERITIES.map((s) => `${SEV[s][0].toLowerCase()} ${model.counts[s]}`).join(", ")})`, "");
  o.push("Every problem has a plain description and what the rule says (a quote checked against its source, or this skill's rule). Fix directions for specialists are under each problem, marked as such. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such. No score.", "");
  if (r.fetch.saved) o.push(`Read from a saved copy${r.fetch.savedAt ? ` taken ${dateOf(r.fetch.savedAt)[0]}` : ""}.`, "");
  if (model.site) o.push(`Site audit: page ${model.site.pages.findIndex((p) => p.slug === model.site.current) + 1} of ${model.site.evaluated} evaluated (${model.site.total} found). Site report: ../index.html`, "");
  const j = model.judgement;
  if (j.any) o.push(`> ${UI.oneModel[0](j.model || UI.modelNotStated[0])}`, "");
  if (model.keyword) o.push(`Main phrase: “${cell(model.keyword.keyword)}” (${model.keyword.source === "given" ? "given with --keyword" : "read off the h1"}).`, "");
  o.push("## Status", "", "| Question | State | Problems |", "|---|---|---|");
  for (const t of model.tiles) o.push(`| ${t.q[0]} | ${(t.state === "na" ? (t.id === "brand" ? "Not checked" : "One version") : { ok: "OK", prob: "Problems", block: "Blocking" }[t.state])} | ${t.count} |`);
  o.push("", "## Biggest problems", "");
  if (!model.bigs.length) o.push("No problems found.");
  const layerOf = (f) => `${LAYER[f.layer][0]}${f.layer === "judgement" ? ` · ${f.judgement?.model || UI.modelNotStated[0]}` : ""}`;
  for (const f of model.bigs) o.push(`${f.pin}. **${SEV[f.severity][0]}** · ${cell(f.label[0])}${f.where ? ` · \`${cell(f.where)}\`` : ""}${f.layer === "judgement" ? ` · *${layerOf(f)}*` : ""}`, `   ${cell(explain(f.code).d[0])}`);
  o.push("", "## All problems", "");
  for (const [ow, title] of [["dev", "For the developer"], ["content", "For the content writer"], ["seo", "For SEO"]]) {
    const items = model.findings.filter((f) => f.owner === ow);
    if (!items.length) continue;
    o.push(`### ${title} (${items.length})`, "");
    for (const f of items) {
      const e = explain(f.code);
      o.push(`#### ${f.pin}. ${cell(f.label[0])} · ${SEV[f.severity][0]}`, "");
      o.push(cell(e.d[0]), "");
      o.push(`- **What the rule says:** ${ruleMd(e.r)}`);
      o.push(`- **Where:** ${f.where ? `\`${cell(f.where)}\`` : "the page as a whole"} · layer: ${cell(layerOf(f))} · code \`${f.code}\``);
      o.push(`- *Fix direction, for specialists:* ${cell(e.x[0])}`, "");
    }
  }
  o.push("", "## Page map", "", "Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.", "");
  model.zones.forEach((z, i) => {
    const seen = z.hidden || z.kind === "aside" ? " · unseen" : z.seen !== null && z.seen !== undefined && z.seen < 0.9 && z.kind !== "header" && z.kind !== "nav" && z.kind !== "footer" ? ` · ${Math.round((1 - z.seen) * 100)}% unseen` : "";
    o.push(`${i + 1}. ${cell(zoneName(z))}${z.kind === "js" ? " (only with JavaScript)" : ""}${seen}${z.pins.length ? ` · problems ${z.pins.map((f) => f.pin).join(", ")}` : ""}`);
  });
  const strip = (title, rows) => {
    o.push("", `**${title}**`, "");
    for (const row of rows) o.push(`- ${Array.isArray(row.k) ? row.k[0] : row.k}: ${row.v[0]}${row.pins.length ? ` · problems ${row.pins.map((f) => f.pin).join(", ")}` : ""}`);
  };
  strip("`<head>`", model.head);
  strip("`robots.txt` · `llms.txt`", model.robots);
  o.push("", `## Google and Bing checks`, "", "| Check | State |", "|---|---|");
  for (const c of model.checklist) o.push(`| ${c.name[0]} | ${MARK[c.state].t[0]} |`);
  o.push("", `## Bots in robots.txt (path \`${cell(model.robotsPath)}\`)`, "");
  if (r.robots.status === "not_checked") o.push(UI.robotsNotChecked[0]);
  else {
    if (r.robots.status === "none") o.push(`${UI.robotsNone[0]}.`, "");
    if (r.robots.status === "unreachable") o.push(`${UI.robotsUnreachable[0]}.`, "");
    o.push("| Bot | Vendor | Purpose | Verdict | Rule |", "|---|---|---|---|---|");
    for (const b of model.bots) o.push(`| ${b.token} | ${b.vendor} | ${UI.kind[b.kind][0]} | ${b.allowed ? "allowed" : "blocked"} | ${b.rule ? `\`${cell(b.rule)}\`` : "—"} |`);
  }
  o.push("", "## Language versions", "");
  if (!model.languages) o.push(UI.langOne[0]);
  else {
    o.push(`x-default: ${model.languages.xDefault ? "yes" : "no"}`, "", "| Lang | Title | Description | hreflang | Same facts |", "|---|---|---|---|---|");
    for (const row of model.languages.rows) o.push(`| ${cell(row.hreflang)}${row.self ? " (this page)" : ""}${row.refused ? " (not analysed)" : ""} | ${row.cells.map((s) => MARK[s].t[0]).join(" | ")} |`);
  }
  const w = model.waterfall;
  if (w) {
    o.push("", "## Where the text goes (characters)", "", "| Stage | Characters |", "|---|---|");
    [w.raw, w.removed, w.kept, w.inPassagesUnique, w.notInPassages, w.pastCap].forEach((v, i) => o.push(`| ${UI.wf[i][0]} | ${fmt(v)} |`));
    o.push("", `${model.passages.used} of ${model.passages.cap} passages.`);
  }
  if (model.caps.length) {
    o.push("", "## Not checked", "");
    for (const c of model.caps) o.push(`- ${c.t[0]}`);
  }
  if (model.compare) {
    const c = model.compare;
    o.push("", `## Before and after (since ${dateOf(c.before.createdAt)[0]})`, "", `${c.counts.fixed} fixed · ${c.counts.new} new · ${c.counts.unchanged} unchanged${c.sameUrl ? "" : ` · the older export is of ${c.before.url}`}`, "");
    for (const f of c.fixed) o.push(`- fixed: ${cell(f.label?.en || f.code)} (\`${f.code}\`)`);
    for (const f of c.new) o.push(`- new: ${cell(f.label?.en || f.code)} (\`${f.code}\`)`);
  }
  if (model.history) {
    const h = model.history;
    o.push("", `## History (${h.total} runs, kept in \`${h.folder}\`)`, "", "| Run | Problems | Blocking · high · medium · low |", "|---|---|---|");
    for (const run of h.runs) o.push(`| ${run.createdAt}${run.current ? " (this run)" : ""}${run.saved ? " (saved copy)" : ""} | ${run.refused ? run.refused : run.total} | ${run.refused ? "—" : `${run.blocking} · ${run.high} · ${run.medium} · ${run.low}`} |`);
    if (h.older) o.push("", `${h.older} older runs not shown.`);
    const d = h.drift;
    o.push("", "### What changed since the last run", "");
    if (!d) o.push("The first run of this page in the history folder.");
    else {
      o.push(`Compared with ${d.since}.`, "");
      if (!d.comparable) o.push(`Not compared (the older snapshot has no page state): ${d.notCompared.join(", ")}.`);
      for (const c of d.fields) o.push(`- ${c.field}: ${cell(JSON.stringify(c.before))} → ${cell(JSON.stringify(c.after))}`);
      for (const b of d.bots) o.push(`- ${b.token}: ${b.before === null ? "—" : b.before ? "allowed" : "blocked"} → ${b.after === null ? "—" : b.after ? "allowed" : "blocked"}`);
      for (const l of d.hreflang.added) o.push(`- hreflang added: ${cell(l)}`);
      for (const l of d.hreflang.removed) o.push(`- hreflang removed: ${cell(l)}`);
      if (d.passages) o.push(`- passages: ${d.passages.added} new, ${d.passages.lost} lost, ${d.passages.unchanged} unchanged`);
      o.push(`- findings: ${d.findings.counts.fixed} fixed, ${d.findings.counts.new} new, ${d.findings.counts.unchanged} unchanged`);
    }
    const ix = model.historyIndex;
    if (ix && ix.pages.length > 1) {
      o.push("", `### Every audit in this history (${ix.runs} runs · ${ix.pages.length} pages · ${ix.sites} sites)`, "", "| Page | Runs | First run | Last run | Problems, last run |", "|---|---|---|---|---|");
      for (const p of ix.pages) o.push(`| ${cell(p.url)}${p.current ? " (this page)" : ""} | ${p.runs} | ${p.first} | ${p.last} | ${p.refused ? "refused" : p.lastCounts ? p.lastCounts.total : "—"} |`);
    }
    if (ix?.dropped) o.push("", `${ix.dropped} older runs did not fit in the report; they stay in the history folder.`);
  }
  if (model.generated) o.push("", ...generatedMarkdown(model.generated));
  o.push("", "## What this check cannot see", "");
  for (const c of CANNOT) o.push(`- ${c.t[0]}: ${c.links.map(([en, , href]) => `[${en}](${href})`).join(" · ")}`);
  o.push("");
  return o.join("\n");
}

/** "What the rule says" in Markdown: the quote and its source, or this skill's rule. */
function ruleMd(r) {
  if (r.kind === "quote") {
    const s = source(r.src);
    return `“${cell(r.quote)}” — [${s.name}](${s.url}), checked ${r.checked}`;
  }
  return `This skill's rule: ${cell(r.text[0])}`;
}

/** The Full layers of one code, as the export carries them. */
export function explanationOf(code) {
  const e = explain(code);
  const rule = e.r.kind === "quote" ? { kind: "quote", quote: e.r.quote, source: source(e.r.src), checked: e.r.checked, language: "en" } : { kind: "skill", label: "This skill's rule", text: { en: e.r.text[0], uk: e.r.text[1] }, source: e.r.fullOnly ? null : source("skill") };
  return { title: { en: e.t[0], uk: e.t[1] }, description: { en: e.d[0], uk: e.d[1] }, rule, fixDirection: { en: e.x[0], uk: e.x[1], audience: "specialists" } };
}

/** The JSON export: getlooploop/ai-search-audit@1. */
export function buildExport(model) {
  const r = model.reading;
  return {
    schema: EXPORT_SCHEMA,
    skillVersion: SKILL_VERSION,
    producedBy: PRODUCED_BY,
    createdAt: r.createdAt,
    edition: "full",
    page: { url: r.fetch.finalUrl, requestedUrl: r.fetch.requestedUrl, title: r.facts.head.title, saved: r.fetch.saved, ...(r.fetch.savedAt ? { savedAt: r.fetch.savedAt } : {}), redirects: r.fetch.chain },
    verdict: { en: verdict(model.findings)[0], uk: verdict(model.findings)[1] },
    counts: { total: model.findings.length, ...model.counts },
    tiles: model.tiles.map((t) => ({ id: t.id, question: { en: t.q[0], uk: t.q[1] }, state: t.state, problems: t.count })),
    findings: model.findings.map((f) => ({
      id: f.id,
      pin: f.pin,
      big: f.big,
      code: f.code,
      severity: f.severity,
      area: f.area,
      owner: f.owner,
      hidesText: f.hides,
      informational: f.informational,
      layer: f.layer,
      judgement: f.judgement,
      label: { en: f.label[0], uk: f.label[1] },
      where: f.where,
      map: { zones: f.zones, strip: f.strip },
      passages: f.passages,
      evidence: f.evidence,
      rules: f.rules,
      explanation: explanationOf(f.code),
    })),
    rulesChecked: RULES_CHECKED,
    state: pageState(r),
    ...(model.site ? { site: { current: model.site.current, evaluated: model.site.evaluated, total: model.site.total, leftOut: model.site.leftOut, pages: model.site.pages.map((p) => ({ slug: p.slug, url: p.url, ok: p.ok })) } } : {}),
    ...(model.compare ? { compare: model.compare } : {}),
    ...(model.history ? { history: { folder: model.history.folder, total: model.history.total, older: model.history.older, runs: model.history.runs, previous: model.history.previous, drift: model.history.drift } } : {}),
    codes: Object.fromEntries(Object.entries(CODES).map(([k, v]) => [k, { severity: v.severity, area: v.area, owner: v.owner, layer: v.layer || "measured" }])),
    layers: { measured: "what a script counted on the page; any agent gets the same value", derived: "computed from measured values by a fixed formula", judgement: "the agent's model read or answered it; another model may judge differently" },
    judgement: { ...model.judgement, questions: model.extra?.questions || null, brand: model.extra?.brand || null, reviews: model.extra?.reviews || null },
    keyword: model.modules.keyword,
    // The answer map: every question ranked, its quality (complete or partial + citable + direct) and what is missing.
    answerMap: model.answers || null,
    // How generated the text sounds: the Pattern score, marker words and swap test, as the report's last block shows them.
    generatedText: model.generated ? generatedExport(model.generated) : null,
    writingPatterns: model.modules.patterns.analysed ? { language: model.modules.patterns.language, wordCount: model.modules.patterns.wordCount, score: model.modules.patterns.score, detectors: model.modules.patterns.version, findings: model.modules.patterns.findings.map((x) => ({ family: x.family, detector: x.detector, severity: x.severity, evidence: x.evidence, passage: x.passage, word: x.word, heading: x.heading, occurrences: x.occurrences })), note: "signals about worn writing, not an AI detector" } : { analysed: false, reason: model.modules.patterns.reason },
    localeFacts: model.modules.locales ? { method: "h2 sections aligned by order when both versions have the same count; numbers compared as sets", compared: model.modules.locales.compared, differ: model.modules.locales.differ, limits: ["versions whose sections do not line up are not compared", "numbers written as words are not read", "a number may differ on purpose (a local price or phone number)"] } : null,
    checklist: model.checklist.map((c) => ({ id: c.id, name: { en: c.name[0], uk: c.name[1] }, state: c.state, codes: c.codes })),
    pageMap: {
      zones: model.zones.map((z) => ({ id: z.id, kind: z.kind, label: z.label, headings: z.headings, chars: z.chars, hidden: Boolean(z.hidden), panels: z.panels || 0, seenShare: z.seen ?? null, merged: z.merged || 0, problems: z.pins.map((f) => f.pin) })),
      head: model.head.map((row) => ({ id: row.id, value: { en: row.v[0], uk: row.v[1] }, problems: row.pins.map((f) => f.pin) })),
      robots: model.robots.map((row) => ({ id: row.id, value: { en: row.v[0], uk: row.v[1] }, problems: row.pins.map((f) => f.pin) })),
    },
    robots: { url: r.robots.url, status: r.robots.status, httpStatus: r.robots.httpStatus, path: model.robotsPath, sitemaps: r.robots.sitemaps, bots: r.robots.bots.map((b) => ({ token: b.token, vendor: b.vendor, kind: b.kind, allowed: b.allowed, rule: b.rule, group: b.group })) },
    sitemap: r.sitemap,
    llms: r.llms ? { url: r.llms.url, status: r.llms.status, present: r.llms.present, links: r.llms.links } : null,
    languages: model.languages,
    alternates: r.alternates ? { total: r.alternates.total, checked: r.alternates.checked, unchecked: r.alternates.unchecked, cap: r.alternates.cap, results: r.alternates.results.map((a) => (a.refused ? { hreflang: a.hreflang, href: a.href, refused: a.refused } : { hreflang: a.hreflang, href: a.href, ok: a.ok, status: a.status, finalUrl: a.finalUrl, redirected: a.redirected, title: a.title, lang: a.lang, noindex: a.noindex, reason: a.reason })) } : null,
    links: r.links ? { total: r.links.total, checked: r.links.checked, unchecked: r.links.unchecked, cap: r.links.cap, results: r.links.results } : null,
    structuredData: { jsonLd: r.facts.structured.jsonLd.map((b) => ({ index: b.index, ok: b.ok, error: b.error, types: b.types, top: b.top })), microdata: r.facts.structured.microdata, rdfa: r.facts.structured.rdfa },
    reading: { passages: model.passages.used, cap: model.passages.cap, waterfall: model.waterfall, render: r.render ? { ok: r.render.ok, wordCount: r.render.wordCount, passages: r.render.passages, jsOnlySections: r.render.jsZones?.length ?? 0, reason: r.render.reason } : null },
    notChecked: model.caps.map((c) => ({ id: c.id, count: c.n ?? null, cap: c.cap ?? null, en: c.t[0], uk: c.t[1] })),
    notMeasured: ["core_web_vitals", "google_index"],
    cannotSee: CANNOT.map((c) => ({ en: c.t[0], uk: c.t[1], links: c.links.map(([en, uk, href]) => ({ en, uk, href })) })),
  };
}

/** Markdown and JSON for a refused reading: the code, and for a page in Russian the reason. */
export function renderRefusalMarkdown(reading) {
  const url = reading.page?.url || reading.fetch?.finalUrl || reading.requestedInput || "";
  if (!isRefusalCode(reading.reasonCode)) return `# ${TOOL_NAME} ${EDITION}: ${url}\n\nThe page could not be audited: \`${reading.reasonCode}\`${reading.status ? ` (HTTP ${reading.status})` : ""}.\n`;
  const lines = [`# ${TOOL_NAME} ${EDITION}: ${url}`, "", `**${REFUSAL_COPY.title.en}.** ${refusalLead("en")}`, "", refusalReason(reading.reasonCode, "en"), ""];
  for (const f of FINDINGS) {
    if (f.items) {
      lines.push(`- **${f.source.en}**`);
      for (const it of f.items) lines.push(`  - ${it.text.en} ${it.url}`);
    } else lines.push(`- **${f.source.en}**${f.joiner.en}${f.text.en} ${f.url}`);
  }
  lines.push("", `${REFUSAL_COPY.sanctions.en}`, "");
  return lines.join("\n");
}

export function buildRefusalExport(reading) {
  return {
    schema: EXPORT_SCHEMA,
    skillVersion: SKILL_VERSION,
    producedBy: PRODUCED_BY,
    createdAt: reading.createdAt,
    edition: "full",
    refused: true,
    reasonCode: reading.reasonCode,
    status: reading.status ?? null,
    page: { url: reading.page?.url || reading.fetch?.finalUrl || null, requestedUrl: reading.page?.requestedUrl || reading.fetch?.requestedUrl || reading.requestedInput },
    ...(reading.refusal ? { refusal: reading.refusal } : {}),
    ...(reading.hosting ? { hosting: reading.hosting } : {}),
    ...(reading.language ? { language: reading.language } : {}),
  };
}
