// The site report's "Across the site" panel: the site-wide checks (siteChecks.mjs) with their
// description, "What the rule says" and, in the closed details, the fix direction; and every
// site-wide check that could not run, with the reason.

import { esc } from "../vendor/vectorscope/html.mjs";
import { parts } from "./report.mjs";
import { SITE_EXPLAIN } from "./siteExplain.mjs";
import { SEV, UI, dateLong, fmtEn, fmtUk, ukForm } from "./copy.mjs";
import { source } from "./rules.mjs";

const { P, ext, call, clip, sumHead } = parts;
const en = (n, one, many) => `${fmtEn(n)} ${n === 1 ? one : many}`;
const uk = (n, a, b, c) => `${fmtUk(n)} ${ukForm(n, a, b, c)}`;

const W = {
  title: ["Across the site", "На всьому сайті"],
  sub: ["checks only several pages together can make; the audited pages only", "перевірки, які можна зробити лише на кількох сторінках разом; лише перевірені сторінки"],
  none: ["No site-wide problem among the audited pages.", "Серед перевірених сторінок проблем на рівні сайту немає."],
  onPages: [(n) => `on ${en(n, "page", "pages")}`, (n) => `на ${uk(n, "сторінці", "сторінках", "сторінках")}`],
  notRun: ["Not checked", "Не перевірено"],
  reason: {
    fewer_pages: [(m) => `needs at least ${m} audited pages`, (m) => `потрібно щонайменше ${m} перевірених сторінок`],
    no_home_page: [() => "needs the home page among the audited pages", () => "потрібна головна сторінка серед перевірених"],
  },
};

/** "What the rule says" for a site-wide check: a verified quote, or this skill's rule with no link. */
export function siteRuleText(r) {
  if (r.kind === "quote") {
    const s = source(r.src);
    const d = dateLong(r.checked);
    return `<q class="rq" lang="en">${esc(r.quote)}</q> <span class="rsrc">${ext(s.url, `${esc(s.name)} ↗`)} <span class="rchk">· ${P([UI.ruleChecked[0](d[0]), UI.ruleChecked[1](d[1])])}</span></span>`;
  }
  return `<span class="rskill">${P(UI.skillRule)}</span> ${P(r.text)}`;
}

export function siteWideBlock(sm) {
  const sw = sm.siteWide;
  if (!sw) return "";
  const o = [`<section class="sum" id="site-wide" aria-labelledby="h-site-wide">${sumHead("h-site-wide", W.title, W.sub)}`];
  if (!sw.findings.length) o.push(`<p class="none-found">${P(W.none)}</p>`);
  else {
    o.push('<ul class="rep">');
    for (const f of sw.findings) {
      const e = SITE_EXPLAIN[f.code];
      const chips = f.slugs.map((slug) => {
        const p = sm.pages.find((x) => x.slug === slug);
        return p ? `<a class="chip mapchip" href="pages/${esc(p.slug)}.html">${p.i} · ${esc(clip(p.path, 40))}</a>` : "";
      });
      o.push(
        `<li id="sw-${esc(f.code)}"><span class="sev ${f.severity}">${P(SEV[f.severity])}</span><div class="prow-main"><span class="prow-t"><span>${P(e.t)}</span><span class="np">${P(call(W.onPages, f.slugs.length))}</span></span><p class="prow-w">${P(e.d)}</p><div class="pg">${chips.join("")}</div><p class="rule"><span class="lbl">${P(UI.ruleSays)}</span> ${siteRuleText(e.r)}</p><details class="spec" id="spec-sw-${esc(f.code)}"><summary>${P(UI.forSpecialists)}</summary><div class="spec-body"><div class="fmeta"><span class="code">${esc(f.code)}</span></div><dl class="fdl"><dt>${P(UI.evidence)}</dt><dd><span class="evq">${esc(clip(JSON.stringify(f.evidence), 700))}</span></dd></dl><p class="fixdir"><span class="k">${P(UI.fixDir)}</span><code>${P(e.x)}</code></p></div></details></div></li>`,
      );
    }
    o.push("</ul>");
  }
  if (sw.notChecked.length) {
    o.push(`<ul class="caps" id="site-wide-not-checked">${sw.notChecked.map((n) => `<li>${P(W.notRun)}: ${P(SITE_EXPLAIN[n.code].t)} · ${P(call(W.reason[n.reason], n.min))}</li>`).join("")}</ul>`);
  }
  o.push("</section>");
  return o.join("\n");
}
