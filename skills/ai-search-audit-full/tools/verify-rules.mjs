#!/usr/bin/env node
// Checks every "What the rule says" quote in scripts/lib/explain.mjs against its live source:
// fetches each source page once, turns it into text (scripts and styles dropped, tags replaced by
// spaces, entities decoded), folds both sides the same way (foldQuoteText) and looks for the
// quote word for word. Network, so it is not part of npm test; run it before a release, and
// change RULES_CHECKED in explain.mjs only after it passes.
//
//   node tools/verify-rules.mjs            every quote
//   node tools/verify-rules.mjs gHreflang  only the quotes from one source key
//
// Exit code 1 when a quote is not found on its page (the page changed, or the quote is wrong):
// then requote it from the page, or label the code "This skill's rule". Never edit a quote to
// something the page does not say.

import { EXPLAIN, foldQuoteText } from "../scripts/lib/explain.mjs";
import { SOURCES } from "../scripts/lib/rules.mjs";
import { SITE_EXPLAIN } from "../scripts/lib/siteExplain.mjs";

const only = process.argv[2] || null;
const UA = "Mozilla/5.0 (compatible; ai-search-audit-full rule check)";

function pageText(html) {
  return foldQuoteText(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))),
  );
}

const byUrl = new Map();
for (const [code, e] of [...Object.entries(EXPLAIN), ...Object.entries(SITE_EXPLAIN)]) {
  if (e.r.kind !== "quote") continue;
  if (only && e.r.src !== only) continue;
  const src = SOURCES[e.r.src];
  if (!src) {
    console.log(`MISSING   ${code}: no source ${e.r.src} in rules.mjs`);
    process.exitCode = 1;
    continue;
  }
  const url = src[1].split("#")[0];
  if (!byUrl.has(url)) byUrl.set(url, []);
  byUrl.get(url).push({ code, quote: e.r.quote, src: e.r.src });
}

let ok = 0;
let bad = 0;
for (const [url, items] of byUrl) {
  let text = "";
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(30_000) });
    text = pageText(await r.text());
    if (!r.ok) console.log(`HTTP ${r.status}  ${url}`);
  } catch (error) {
    console.log(`UNREACHABLE ${url}: ${error.message}`);
  }
  for (const it of items) {
    if (text.includes(foldQuoteText(it.quote))) {
      ok++;
      console.log(`ok        ${it.code.padEnd(30)} ${it.src}`);
    } else {
      bad++;
      process.exitCode = 1;
      console.log(`NOT FOUND ${it.code.padEnd(30)} ${it.src}  “${it.quote.slice(0, 90)}”`);
    }
  }
}
const skill = [...Object.values(EXPLAIN), ...Object.values(SITE_EXPLAIN)].filter((e) => e.r.kind === "skill").length;
console.log(`quotes    ${ok} found · ${bad} not found · ${byUrl.size} pages · ${skill} codes labelled "This skill's rule"`);
