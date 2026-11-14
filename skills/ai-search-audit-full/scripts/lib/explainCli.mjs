// `audit.mjs --codes` and `audit.mjs --explain <code>`: what a code means, from explain.mjs (title,
// plain description, fix direction, the rule quoted from its source and the further `also` quotes),
// the registry (checks.mjs), the rule sources (rules.mjs) and the rubrics (rubrics.mjs). No network,
// no reading needed. Quotes stay in the source's English in every language.

import { CODES, CODE_ORDER } from "./checks.mjs";
import { AREAS, OWNERS } from "./copy.mjs";
import { EXPLAIN } from "./explain.mjs";
import { source } from "./rules.mjs";
import { RUBRICS } from "./rubrics.mjs";

export const EXPLAIN_LANGS = ["en", "uk", "pl"];

const H = {
  severity: ["severity", "серйозність", "waga"],
  tile: ["tile", "плитка", "kafelek"],
  owner: ["owner", "хто виправляє", "kto poprawia"],
  layer: ["layer", "шар", "warstwa"],
  what: ["What goes wrong", "Що не так", "Co jest nie tak"],
  fix: ["Fix direction (for specialists)", "Напрям виправлення (для фахівців)", "Kierunek poprawki (dla specjalistów)"],
  rule: ["What the rule says", "Що каже правило", "Co mówi reguła"],
  also: ["Also", "Також", "Także"],
  skill: ["This skill's rule", "Правило цієї навички", "Reguła tego skilla"],
  checked: ["checked", "перевірено", "sprawdzono"],
  sources: ["Rule sources", "Джерела правила", "Źródła reguły"],
  rubric: ["Verifier rubric (references/checks.md)", "Рубрика перевірки (references/checks.md)", "Rubryka weryfikacji (references/checks.md)"],
};

/** Is this a code of this skill? */
export const isCode = (code) => Object.prototype.hasOwnProperty.call(CODES, code);

/** Every code with its one-line title, in registry order. */
export function codesText(lang = "en") {
  const i = EXPLAIN_LANGS.indexOf(lang);
  const width = Math.max(...CODE_ORDER.map((c) => c.length));
  return CODE_ORDER.map((c) => `${c.padEnd(width)}  ${CODES[c].severity.padEnd(8)}  ${EXPLAIN[c].t[i] ?? EXPLAIN[c].t[0]}`).join("\n");
}

const quoteLine = (q, i) => {
  const s = source(q.src);
  return `“${q.quote}” (${s.name}, ${s.url}; ${H.checked[i]} ${q.checked})`;
};

/** One code: title, description, fix direction, the rule and its quotes, sources and rubric. */
export function explainText(code, lang = "en") {
  const i = EXPLAIN_LANGS.indexOf(lang);
  const reg = CODES[code];
  const e = EXPLAIN[code];
  const pick = (arr) => arr[i] ?? arr[0];
  const area = AREAS.find((a) => a.id === reg.area);
  const out = [
    `${code} · ${pick(e.t)}`,
    `${H.severity[i]}: ${reg.severity} · ${H.tile[i]}: ${area ? area.q[i] : reg.area} · ${H.owner[i]}: ${OWNERS[reg.owner][i]} · ${H.layer[i]}: ${reg.layer || "measured"}`,
    "",
    `${H.what[i]}: ${pick(e.d)}`,
    "",
    `${H.fix[i]}: ${pick(e.x)}`,
    "",
    e.r.kind === "quote" ? `${H.rule[i]}: ${quoteLine(e.r, i)}` : `${H.rule[i]}: ${H.skill[i]}: ${pick(e.r.text)}`,
  ];
  for (const q of e.also || []) out.push(`${H.also[i]}: ${quoteLine(q, i)}`);
  out.push("", `${H.sources[i]}:`);
  for (const key of reg.rules) {
    const s = source(key);
    out.push(`  - ${s.name}${s.url ? `: ${s.url}` : ""}`);
  }
  const rubric = RUBRICS[code];
  if (rubric) {
    out.push("", `${H.rubric[i]}:`);
    for (const c of rubric.keepWhen) out.push(`  keepWhen ${c.id}  ${c.text}`);
    for (const c of rubric.dropWhen) out.push(`  dropWhen ${c.id}  ${c.text}`);
  }
  return out.join("\n");
}
