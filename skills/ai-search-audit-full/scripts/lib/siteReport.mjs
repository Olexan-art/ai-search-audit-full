// The site report: the pages of one site audit side by side. Pages × problems as a grid, the
// problems that repeat across pages grouped once as "N pages", the ones found on a single page,
// what was left out and why (evaluated / total), and a link to each page's own report. The same
// design, tokens and footer as the page report; self-contained, no network requests.

import { esc } from "../vendor/vectorscope/html.mjs";
import { parts } from "./report.mjs";
import { explain } from "./explain.mjs";
import { LITE, SEV, SEV_COUNT, UI, dateLong, dateOf, fmtEn, fmtPl, fmtUk, nProblems, plForm, ukForm } from "./copy.mjs";
import { SEVERITIES, SEVERITY_RANK } from "./checks.mjs";
import { EDITION, TOOL_NAME } from "./report.mjs";
import { EXPORT_SCHEMA, PRODUCED_BY, SKILL_VERSION } from "./version.mjs";
import { RULES_CHECKED } from "./explain.mjs";
import { explanationOf } from "./outputs.mjs";
import { siteFindings } from "./siteChecks.mjs";
import { renderRefusal } from "./report.mjs";
import { buildRefusalExport, renderRefusalMarkdown } from "./outputs.mjs";
import { siteWideBlock } from "./siteWideBlock.mjs";
import { SITE_EXPLAIN } from "./siteExplain.mjs";

export const SITE_EXPORT_SCHEMA = "getlooploop/ai-search-audit-site@1";

const { P, pair, ext, call, clip, head, sumHead, pinIcon, sevPill, ruleText, documentStart, documentEnd } = parts;
const en = (n, one, many) => `${fmtEn(n)} ${n === 1 ? one : many}`;
const uk = (n, a, b, c) => `${fmtUk(n)} ${ukForm(n, a, b, c)}`;
const pl = (n, a, b, c) => `${fmtPl(n)} ${plForm(n, a, b, c)}`;

const S = {
  pagesN: [(n) => en(n, "page", "pages"), (n) => uk(n, "сторінка", "сторінки", "сторінок"), (n) => pl(n, "strona", "strony", "stron")],
  onPages: [(n) => `on ${en(n, "page", "pages")}`, (n) => `на ${uk(n, "сторінці", "сторінках", "сторінках")}`, (n) => `na ${pl(n, "stronie", "stronach", "stronach")}`],
  coverage: ["What was audited", "Що перевірено", "Co sprawdzono"],
  evaluated: [(e, t) => `${e} of ${t} pages evaluated`, (e, t) => `перевірено ${e} із ${t} сторінок`, (e, t) => `sprawdzono ${e} z ${t} stron`],
  capLine: [(c) => `cap ${c} pages per audit`, (c) => `ліміт ${c} сторінок на аудит`, (c) => `limit ${c} stron na audyt`],
  leftOut: [(n) => `${en(n, "page", "pages")} left out`, (n) => `${uk(n, "сторінку", "сторінки", "сторінок")} пропущено`, (n) => `pominięto ${pl(n, "stronę", "strony", "stron")}`],
  reason: {
    cap: ["past the cap", "за лімітом", "poza limitem"],
    robots_disallowed: ["robots.txt closes it to this crawler", "robots.txt закриває її для цього краулера", "robots.txt zamyka ją dla tego crawlera"],
    robots_unreachable: ["robots.txt does not answer: assumed closed", "robots.txt не відповідає: вважається закритою", "robots.txt nie odpowiada: przyjęto, że jest zamknięta"],
    duplicate: ["listed twice", "указано двічі", "podana dwukrotnie"],
    invalid_url: ["not a web address", "не вебадреса", "to nie jest adres internetowy"],
    blocked_scheme: ["not http or https", "не http чи https", "ani http, ani https"],
    blocked_host: ["not a public host", "не публічний хост", "to nie jest publiczny host"],
    blocked_address: ["not a public address", "не публічна адреса", "to nie jest publiczny adres"],
  },
  listed: [(a, b) => `${a} of ${b} listed`, (a, b) => `перелічено ${a} із ${b}`, (a, b) => `wymieniono ${a} z ${b}`],
  sourceUrls: [(f) => `from the URL list ${f}`, (f) => `зі списку адрес ${f}`, (f) => `z listy adresów ${f}`],
  sourceSitemap: [(u) => `from the sitemap ${u}`, (u) => `із sitemap ${u}`, (u) => `z sitemap ${u}`],
  childUnread: [(n, c) => `${en(n, "child sitemap", "child sitemaps")} not read (cap ${c})`, (n, c) => `${uk(n, "дочірній sitemap", "дочірні sitemap", "дочірніх sitemap")} не прочитано (ліміт ${c})`, (n, c) => `nie przeczytano: ${pl(n, "podrzędna sitemap", "podrzędne sitemapy", "podrzędnych sitemap")} (limit ${c})`],
  offHost: [(n) => `${en(n, "sitemap URL", "sitemap URLs")} on another host left out`, (n) => `${uk(n, "адресу", "адреси", "адрес")} sitemap на іншому хості пропущено`, (n) => `pominięto ${pl(n, "adres", "adresy", "adresów")} z sitemap na innym hoście`],
  polite: [(d) => `Pages were read one at a time, ${d} ms apart (longer where robots.txt asks for a Crawl-delay), as GetLoopLoop/1.0; requests repeated across pages (robots.txt, the sitemap, shared links) were answered from this run's memory.`, (d) => `Сторінки читали по одній, з паузою ${d} мс (довшою, де robots.txt просить Crawl-delay), як GetLoopLoop/1.0; запити, що повторюються між сторінками (robots.txt, sitemap, спільні посилання), бралися з пам’яті цього запуску.`, (d) => `Strony czytano po jednej, w odstępach ${d} ms (dłuższych tam, gdzie robots.txt prosi o Crawl-delay), jako GetLoopLoop/1.0; żądania powtarzające się między stronami (robots.txt, sitemap, wspólne linki) obsłużono z pamięci tego uruchomienia.`],
  longDelay: [(o, d, u) => `${o} asks for a Crawl-delay of ${d} s; ${u} s was used.`, (o, d, u) => `${o} просить Crawl-delay ${d} с; використано ${u} с.`, (o, d, u) => `${o} prosi o Crawl-delay ${d} s; użyto ${u} s.`],
  pages: ["Pages", "Сторінки", "Strony"],
  refused: ["not audited", "не перевірено", "nie sprawdzono"],
  driftN: [(n) => (n ? `${en(n, "change", "changes")} since the last run` : "no change since the last run"), (n) => (n ? `${uk(n, "зміна", "зміни", "змін")} від попереднього запуску` : "без змін від попереднього запуску"), (n) => (n ? `${pl(n, "zmiana", "zmiany", "zmian")} od poprzedniego uruchomienia` : "bez zmian od poprzedniego uruchomienia")],
  firstRun: ["first run", "перший запуск", "pierwsze uruchomienie"],
  cmpN: [(f, n) => `${f} fixed · ${n} new`, (f, n) => `виправлено ${f} · нових ${n}`, (f, n) => `naprawione: ${f} · nowe: ${n}`],
  repeated: ["Problems repeated across pages", "Проблеми, що повторюються на сторінках", "Problemy powtarzające się na stronach"],
  repeatedSub: ["each counted once, with the pages it is on", "кожна врахована один раз, зі сторінками, де вона є", "każdy liczony raz, ze stronami, na których występuje"],
  noneRepeated: ["No problem is on more than one page.", "Жодна проблема не трапляється більше ніж на одній сторінці.", "Żaden problem nie występuje na więcej niż jednej stronie."],
  matrix: ["Pages × problems", "Сторінки × проблеми", "Strony × problemy"],
  matrixSub: ["the marker is the problem's severity on that page; empty means not found there", "маркер — серйозність проблеми на цій сторінці; порожньо — там її не знайдено", "znacznik to waga problemu na tej stronie; puste pole oznacza, że go tam nie znaleziono"],
  problem: ["Problem", "Проблема", "Problem"],
  total: ["Pages", "Сторінок", "Stron"],
  single: ["Problems on one page only", "Проблеми лише на одній сторінці", "Problemy tylko na jednej stronie"],
  verdictBlock: [(b, n) => `${b} of ${n} pages have a problem that blocks search or AI`, (b, n) => `${b} із ${n} сторінок мають проблему, що блокує пошук або ШІ`, (b, n) => `Strony z problemem blokującym wyszukiwarkę lub AI: ${b} z ${n}`],
  verdictHide: [(b, n) => `${b} of ${n} pages hide text from AI`, (b, n) => `${b} із ${n} сторінок ховають текст від ШІ`, (b, n) => `Strony ukrywające tekst przed AI: ${b} z ${n}`],
  verdictOk: ["No page has a blocking problem or hides text from AI", "Жодна сторінка не має блокувальної проблеми й не ховає текст від ШІ", "Żadna strona nie ma problemu blokującego ani nie ukrywa tekstu przed AI"],
  verdictNone: ["No problems found on any page", "На жодній сторінці проблем не знайдено", "Nie znaleziono problemów na żadnej stronie"],
  eyebrow: ["AI search audit · Full · site", "Аудит для ШІ-пошуку · Full · сайт", "Audyt wyszukiwania AI · Full · serwis"],
  findingsN: [(n) => en(n, "finding", "findings"), (n) => uk(n, "знахідка", "знахідки", "знахідок"), (n) => pl(n, "ustalenie", "ustalenia", "ustaleń")],
  sevTotals: ["Findings by severity, all pages", "Знахідки за серйозністю, усі сторінки", "Ustalenia według wagi, wszystkie strony"],
  checked: [(d) => `checked ${d}`, (d) => `перевірено ${d}`, (d) => `sprawdzono ${d}`],
  openPage: ["page report", "звіт сторінки", "raport strony"],
  notesN: [(n) => en(n, "note", "notes"), (n) => uk(n, "зауваження", "зауваження", "зауважень"), (n) => pl(n, "uwaga", "uwagi", "uwag")],
  seePages: ["See the pages", "Переглянути сторінки", "Zobacz strony"],
  cardBlock: [(b, n) => `${b} of ${n} pages have a problem that blocks search or AI`, (b, n) => `${b} із ${n} сторінок мають проблему, що блокує пошук або ШІ`, (b, n) => `Strony z problemem blokującym wyszukiwarkę lub AI: ${b} z ${n}`],
  cardHide: [(b, n) => `${b} of ${n} pages hide text from AI`, (b, n) => `${b} із ${n} сторінок ховають текст від ШІ`, (b, n) => `Strony ukrywające tekst przed AI: ${b} z ${n}`],
  cardOk: ["Search engines and AI can reach and read every page", "Пошукові системи й ШІ можуть дістатися до кожної сторінки й прочитати її", "Wyszukiwarki i AI mogą dotrzeć do każdej strony i ją przeczytać"],
  cardPages: [(n) => `${en(n, "page", "pages")} audited`, (n) => `перевірено ${uk(n, "сторінку", "сторінки", "сторінок")}`, (n) => `sprawdzono ${pl(n, "stronę", "strony", "stron")}`],
  cardRepeated: [(n) => `${en(n, "problem repeats", "problems repeat")} across pages`, (n) => `${uk(n, "проблема повторюється", "проблеми повторюються", "проблем повторюються")} на сторінках`, (n) => `${pl(n, "problem powtarza", "problemy powtarzają", "problemów powtarza")} się na stronach`],
  cardNoRepeated: ["No problem repeats across pages", "Жодна проблема не повторюється на сторінках", "Żaden problem nie powtarza się na stronach"],
  cardRepeatedSub: ["Fixed once in a template, fixed everywhere", "Виправлене один раз у шаблоні виправлене всюди", "Poprawione raz w szablonie jest poprawione wszędzie"],
  cardSite: [(n) => `${en(n, "problem", "problems")} only the set of pages shows`, (n) => `${uk(n, "проблема", "проблеми", "проблем")}, видимі лише на наборі сторінок`, (n) => `${pl(n, "problem widoczny", "problemy widoczne", "problemów widocznych")} tylko w zestawie stron`],
  cardNoSite: ["No site-wide problem among the audited pages", "Серед перевірених сторінок проблем на рівні сайту немає", "Wśród sprawdzonych stron nie ma problemów na poziomie serwisu"],
  cardSiteNot: [(n) => `${en(n, "site-wide check", "site-wide checks")} could not run`, (n) => `${uk(n, "перевірку", "перевірки", "перевірок")} на рівні сайту не виконано`, (n) => `nie wykonano: ${pl(n, "sprawdzenie", "sprawdzenia", "sprawdzeń")} na poziomie serwisu`],
  cardSiteSub: ["Titles, links, hreflang and canonicals between the pages", "Title, посилання, hreflang і canonical між сторінками", "Title, linki, hreflang i canonical między stronami"],
  allSub: ["What was audited · Pages × problems · Problems on one page · Severity", "Що перевірено · Сторінки × проблеми · Проблеми на одній сторінці · Серйозність", "Co sprawdzono · Strony × problemy · Problemy na jednej stronie · Waga"],
  cannotSite: ["Each page report lists what one page's check cannot see; the site audit adds one limit: at most 50 pages, every page left out listed above.", "Кожен звіт сторінки перелічує, чого не бачить перевірка однієї сторінки; аудит сайту додає одне обмеження: щонайбільше 50 сторінок, і кожну пропущену перелічено вище.", "Każdy raport strony wymienia, czego nie widzi sprawdzenie jednej strony; audyt serwisu dodaje jedno ograniczenie: najwyżej 50 stron, a każda pominięta jest wymieniona wyżej."],
};

const pathOf = (url) => {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return String(url);
  }
};

/**
 * The site model from the pages read. `entries`: [{ slug, url, reading, model (ok pages), exp, history, compare }].
 * `manifest`: the site reading (site.json from read.mjs).
 */
export function buildSiteModel(manifest, entries) {
  const pages = entries.map((e, i) => {
    const counts = e.model ? Object.fromEntries(SEVERITIES.map((s) => [s, e.model.counts[s]])) : null;
    return {
      i: i + 1,
      slug: e.slug,
      url: e.reading.fetch?.finalUrl || e.url,
      path: pathOf(e.reading.fetch?.finalUrl || e.url),
      title: e.reading.facts?.head?.title || "",
      ok: Boolean(e.model),
      reasonCode: e.reading.reasonCode,
      counts,
      total: e.model ? e.model.findings.length : 0,
      hides: e.model ? e.model.findings.some((f) => f.hides) : false,
      blocking: e.model ? e.model.counts.blocking > 0 : false,
      drift: e.history?.drift ? e.history.drift.changed ?? null : undefined,
      hasHistory: Boolean(e.history),
      compare: e.compare ? e.compare.counts : null,
      createdAt: e.reading.createdAt,
    };
  });
  const byCode = new Map();
  for (const e of entries) {
    if (!e.model) continue;
    for (const f of e.model.findings) {
      if (!byCode.has(f.code)) byCode.set(f.code, { code: f.code, worst: f.severity, area: f.area, owner: f.owner, layer: f.layer, pages: new Map(), rules: f.rules, sample: f });
      const c = byCode.get(f.code);
      if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[c.worst]) c.worst = f.severity;
      // A code can occur more than once on a page (one finding per question): count the page once, keep the worst.
      const had = c.pages.get(e.slug);
      if (!had || SEVERITY_RANK[f.severity] > SEVERITY_RANK[had.severity]) c.pages.set(e.slug, { slug: e.slug, id: f.id, pin: f.pin, big: f.big, severity: f.severity, label: f.label, n: (had?.n || 0) + 1 });
      else had.n++;
    }
  }
  const codes = [...byCode.values()].sort((a, b) => b.pages.size - a.pages.size || SEVERITY_RANK[b.worst] - SEVERITY_RANK[a.worst] || a.code.localeCompare(b.code));
  const totals = Object.fromEntries(SEVERITIES.map((s) => [s, entries.reduce((n, e) => n + (e.model ? e.model.counts[s] : 0), 0)]));
  const siteWide = siteFindings(entries.filter((e) => e.model).map((e) => ({ slug: e.slug, reading: e.reading })));
  return { manifest, pages, codes, repeated: codes.filter((c) => c.pages.size >= 2), single: codes.filter((c) => c.pages.size === 1), totals, okPages: pages.filter((p) => p.ok).length, siteWide };
}

function siteVerdict(sm) {
  const n = sm.pages.length;
  const b = sm.pages.filter((p) => p.blocking).length;
  const h = sm.pages.filter((p) => p.hides).length;
  if (b) return call(S.verdictBlock, b, n);
  if (h) return call(S.verdictHide, h, n);
  return sm.codes.length ? S.verdictOk : S.verdictNone;
}

const pageLink = (p, hash = "") => `pages/${esc(p.slug)}.html${hash}`;

function coverageBlock(sm) {
  const m = sm.manifest;
  const o = [`<section class="panel" id="coverage" aria-labelledby="h-coverage">${head("h-coverage", S.coverage, call(S.capLine, m.cap))}`];
  const src = m.source.kind === "sitemap" ? call(S.sourceSitemap, m.source.input) : call(S.sourceUrls, m.source.input);
  o.push(`<p class="cov"><b>${P(call(S.evaluated, m.evaluated, m.total))}</b> · ${P(src)}</p>`);
  const caps = [];
  if (m.leftOut.count) caps.push(`<li>${P(call(S.leftOut, m.leftOut.count))}: ${Object.entries(m.leftOut.byReason).map(([r, n]) => `${n} ${P(S.reason[r] || [r, r, r])}`).join(" · ")}</li>`);
  if (m.source.children?.unread) caps.push(`<li>${P(call(S.childUnread, m.source.children.unread, m.source.children.cap))}</li>`);
  if (m.source.offHost) caps.push(`<li>${P(call(S.offHost, m.source.offHost))}</li>`);
  for (const d of m.politeness.longDelays || []) caps.push(`<li>${P(call(S.longDelay, d.origin, d.crawlDelay, d.used))}</li>`);
  if (caps.length) o.push(`<ul class="caps" id="site-caps">${caps.join("")}</ul>`);
  if (m.leftOut.items.length) {
    o.push(`<details class="cmp-more" id="left-out"><summary>${P(call(S.listed, m.leftOut.listed, m.leftOut.count))}</summary><ol class="left-list">${m.leftOut.items.map((x) => `<li><span class="mono">${esc(clip(x.url, 140))}</span> · ${P(S.reason[x.reason] || [x.reason, x.reason, x.reason])}${x.rule ? ` · <span class="mono">${esc(x.rule)}</span>` : ""}</li>`).join("")}</ol></details>`);
  }
  o.push(`<p class="capnote">${P(call(S.polite, m.politeness.delayMs))}</p></section>`);
  return o.join("\n");
}

function pagesBlock(sm) {
  const items = sm.pages.map((p) => {
    const counts = p.ok ? `${P(nProblems(p.total))} ${SEVERITIES.filter((s) => p.counts[s]).map((s) => `<span class="pc" ${parts.attrPair("title", SEV[s][0], SEV[s][1], SEV[s][2])}>${pinIcon(s, p.counts[s], 26)}</span>`).join("")}` : P(S.refused);
    const drift = typeof p.drift === "number" ? ` · <a href="${pageLink(p, "#history")}">${P(call(S.driftN, p.drift))}</a>` : "";
    const first = p.hasHistory && p.drift === undefined && p.ok ? ` · ${P(S.firstRun)}` : "";
    const cmp = p.compare ? ` · <a href="${pageLink(p, "#compare")}">${P(call(S.cmpN, p.compare.fixed, p.compare.new))}</a>` : "";
    return `<li id="page-${esc(p.slug)}"><span class="i">${p.i}</span><span><a href="${pageLink(p)}">${esc(p.url)}</a>${p.title ? `<span class="pt">${esc(clip(p.title, 120))}</span>` : ""}${!p.ok ? `<span class="pt mono">${esc(p.reasonCode)}</span>` : ""}</span><span class="cnts">${counts}${drift}${first}${cmp}</span></li>`;
  });
  return `<section class="sum" id="pages" aria-labelledby="h-pages">${sumHead("h-pages", S.pages, call(S.pagesN, sm.pages.length))}<ol class="pages-list">${items.join("")}</ol></section>`;
}

const codeTitle = (code) => explain(code).t;

function repeatedBlock(sm) {
  const o = [`<section class="sum" id="repeated" aria-labelledby="h-repeated">${sumHead("h-repeated", S.repeated, S.repeatedSub)}`];
  if (!sm.repeated.length) {
    o.push(`<p class="none-found">${P(S.noneRepeated)}</p></section>`);
    return o.join("\n");
  }
  o.push('<ul class="rep">');
  for (const c of sm.repeated) {
    const e = explain(c.code);
    const chips = [...c.pages.values()].map((x) => {
      const p = sm.pages.find((y) => y.slug === x.slug);
      return `<a class="chip mapchip" href="${pageLink(p, `#${x.big ? "big" : "p"}-${esc(x.id)}`)}">${p.i} · ${esc(clip(p.path, 40))}</a>`;
    });
    o.push(
      `<li id="rep-${esc(c.code)}"><span class="sev ${c.worst}">${P(SEV[c.worst])}</span><div class="prow-main"><span class="prow-t"><span>${P(e.t)}</span><span class="np">${P(call(S.onPages, c.pages.size))}</span></span><p class="prow-w">${P(e.d)}</p><div class="pg">${chips.join("")}</div><p class="rule"><span class="lbl">${P(UI.ruleSays)}</span> ${ruleText(c.sample)}</p>${siteSpec(c)}</div></li>`,
    );
  }
  o.push("</ul></section>");
  return o.join("\n");
}

/** The details for specialists of a code across the site: the code, the rule sources and the fix direction. */
function siteSpec(c) {
  const e = explain(c.code);
  const srcs = c.rules.map((s) => ext(s.url, `${esc(s.name)} ↗`)).join("<br>");
  return `<details class="spec" id="spec-rep-${esc(c.code)}"><summary>${P(UI.forSpecialists)}</summary><div class="spec-body"><div class="fmeta"><span class="code">${esc(c.code)}</span></div><dl class="fdl"><dt>${P(UI.ruleSources)}</dt><dd class="srcs">${srcs}</dd></dl><p class="fixdir"><span class="k">${P(UI.fixDir)}</span><code>${P(e.x)}</code></p></div></details>`;
}

function matrixBlock(sm) {
  const ok = sm.pages.filter((p) => p.ok);
  if (!sm.codes.length || !ok.length) return "";
  const headCells = ok.map((p) => `<th scope="col"><a href="${pageLink(p)}" title="${esc(p.url)}">${p.i}</a></th>`).join("");
  const rows = sm.codes.map((c) => {
    const cells = ok.map((p) => {
      const x = c.pages.get(p.slug);
      return x ? `<td><a href="${pageLink(p, `#${x.big ? "big" : "p"}-${esc(x.id)}`)}" aria-label="${esc(`${p.path}: ${SEV[x.severity][0]}`)}">${pinIcon(x.severity, x.n > 1 ? x.n : null, 20)}</a></td>` : `<td class="none" aria-label="—">·</td>`;
    });
    return `<tr><th scope="row"><a href="#${c.pages.size >= 2 ? "rep" : "one"}-${esc(c.code)}">${P(codeTitle(c.code))}</a></th>${cells.join("")}<td class="n">${c.pages.size}</td></tr>`;
  });
  return `<section class="panel" id="matrix" aria-labelledby="h-matrix">${head("h-matrix", S.matrix, S.matrixSub)}<div class="tablewrap"><table class="mx"><thead><tr><th scope="col">${P(S.problem)}</th>${headCells}<th scope="col">${P(S.total)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><ul class="left-list mx-key">${ok.map((p) => `<li><span class="mono">${p.i}</span> ${esc(p.url)}</li>`).join("")}</ul></section>`;
}

function singleBlock(sm) {
  if (!sm.single.length) return "";
  const items = sm.single.map((c) => {
    const x = [...c.pages.values()][0];
    const p = sm.pages.find((y) => y.slug === x.slug);
    return `<li id="one-${esc(c.code)}"><span class="sev ${c.worst}">${P(SEV[c.worst])}</span><div class="prow-main"><span class="prow-t"><span>${P(x.label)}</span></span><p class="prow-p">${P(codeTitle(c.code))} · <a class="chip mapchip" href="${pageLink(p, `#${x.big ? "big" : "p"}-${esc(x.id)}`)}">${p.i} · ${esc(clip(p.path, 40))}</a></p></div></li>`;
  });
  return `<section class="panel" id="single" aria-labelledby="h-single">${head("h-single", S.single, call(S.findingsN, sm.single.length))}<ul class="rep">${items.join("")}</ul></section>`;
}

function totalsBlock(sm) {
  const max = Math.max(1, ...SEVERITIES.map((s) => sm.totals[s]));
  const C = { blocking: "--red", high: "--amber", medium: "--amber", low: "--pin-low" };
  const rows = SEVERITIES.map((s) => `<li><span class="sl">${pinIcon(s, null, 18)}${P(SEV[s])}</span><span class="st"><span class="sb ${s}" style="width:${((sm.totals[s] / max) * 100).toFixed(1)}%;--c:var(${C[s]})"></span></span><span class="sn">${sm.totals[s]}</span></li>`).join("");
  return `<section class="panel wide" id="site-severity" aria-labelledby="h-site-sev">${head("h-site-sev", S.sevTotals)}<ul class="sbars">${rows}</ul></section>`;
}

/** The site report HTML (index.html of the output folder), in the page report's summary-first layout. */
export function renderSiteReport(sm) {
  const m = sm.manifest;
  const { CARD_ICON, LIST_ICON, CHEV } = parts;
  let host = "";
  try {
    host = new URL(sm.pages[0]?.url || m.source.input).hostname;
  } catch {}
  const o = documentStart(`${TOOL_NAME} ${EDITION}: ${host} · ${sm.pages.length} pages`);
  const total = SEVERITIES.reduce((n, s) => n + sm.totals[s], 0);
  const d = dateLong(m.createdAt);
  const blocked = sm.pages.some((p) => p.blocking);
  const sevs = SEVERITIES.map((s) => `<li class="${s}">${pinIcon(s, null, 16)}<span>${P(call(SEV_COUNT[s], sm.totals[s]))}</span></li>`).join("");
  o.push(
    [
      `<header class="verdict lite-verdict${blocked ? " is-blocked" : ""}" id="verdict">`,
      `<p class="pageid"><span class="url">${esc(host)}</span></p>`,
      `<p class="lite-meta"><span>${P([LITE.checked[0](d[0]), LITE.checked[1](d[1]), LITE.checked[2](d[2])])}</span><span aria-hidden="true">·</span><span>${P(S.eyebrow)}</span></p>`,
      `<h1 id="headline">${P(siteVerdict(sm))}</h1>`,
      `<p class="lede" id="subtitle">${P([`${S.evaluated[0](m.evaluated, m.total)} · ${S.notesN[0](total)}`, `${S.evaluated[1](m.evaluated, m.total)} · ${S.notesN[1](total)}`, `${S.evaluated[2](m.evaluated, m.total)} · ${S.notesN[2](total)}`])}</p>`,
      `<ul class="sevrow" id="sev-counts" ${parts.attrPair("aria-label", UI.severity[0], UI.severity[1], UI.severity[2])}>${sevs}</ul>`,
      `<p class="cta-row"><a class="btn btn-primary" id="see-pages" href="#pages">${P(S.seePages)}<span aria-hidden="true"> ↓</span></a></p>`,
      "</header>",
    ].join("\n"),
  );
  // Three cards: the pages that block, the problems shared by pages, the problems only the set shows.
  const blockPages = sm.pages.filter((p) => p.blocking);
  const hidePages = sm.pages.filter((p) => p.hides);
  const sw = sm.siteWide?.findings || [];
  const worst = (sevs2) => (sevs2.includes("blocking") ? "block" : sevs2.some((s) => s === "high" || s === "medium") ? "prob" : "ok");
  const cards = [
    { id: "find", state: blockPages.length ? "block" : hidePages.length ? "prob" : "ok", title: blockPages.length ? call(S.cardBlock, blockPages.length, sm.pages.length) : hidePages.length ? call(S.cardHide, hidePages.length, sm.pages.length) : S.cardOk, status: call(S.cardPages, sm.okPages) },
    { id: "text", state: worst(sm.repeated.map((c) => c.worst)), title: sm.repeated.length ? call(S.cardRepeated, sm.repeated.length) : S.cardNoRepeated, status: S.cardRepeatedSub },
    { id: "brand", state: sm.siteWide ? worst(sw.map((f) => f.severity)) : "na", title: sw.length ? call(S.cardSite, sw.length) : S.cardNoSite, status: sm.siteWide?.notChecked.length ? call(S.cardSiteNot, sm.siteWide.notChecked.length) : S.cardSiteSub },
  ];
  o.push(`<section class="sum" id="means" aria-labelledby="h-means"><h2 id="h-means">${P(LITE.means)}</h2><ul class="cards" id="cards">${cards.map((c) => `<li class="card ${c.state}" id="card-${c.id}"><span class="card-i">${CARD_ICON[c.id]}</span><span class="card-t"><h3>${P(c.title)}</h3><span class="card-s">${P(c.status)}</span></span></li>`).join("")}</ul></section>`);
  o.push(pagesBlock(sm));
  o.push(siteWideBlock(sm));
  o.push(repeatedBlock(sm));
  o.push(
    [
      `<details class="allc" id="all-checks">`,
      `<summary class="allc-s"><span class="allc-i">${LIST_ICON}</span><span class="allc-t"><h2 id="h-all">${P(LITE.all)}</h2><span class="sub">${P(S.allSub)}</span></span>${CHEV}</summary>`,
      '<div class="allc-b">',
      coverageBlock(sm),
      matrixBlock(sm),
      singleBlock(sm),
      '<div class="lcharts">',
      totalsBlock(sm),
      "</div>",
      `<section class="panel" id="cannot-see" aria-labelledby="h-cannot">${head("h-cannot", UI.cannot)}<p class="capnote">${P(S.cannotSite)}</p></section>`,
      "</div>",
      "</details>",
    ].join("\n"),
  );
  o.push(...documentEnd("footerSite"));
  return o.join("\n") + "\n";
}

/** The site report in Markdown (English). */
export function renderSiteMarkdown(sm) {
  const m = sm.manifest;
  const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const o = [`# ${TOOL_NAME} ${EDITION}: site audit, ${sm.pages.length} pages`, "", `**${siteVerdict(sm)[0]}** · ${m.evaluated} of ${m.total} pages evaluated (cap ${m.cap}) · skill ${SKILL_VERSION}`, ""];
  if (m.leftOut.count) o.push(`Left out: ${m.leftOut.count} (${Object.entries(m.leftOut.byReason).map(([r, n]) => `${n} ${(S.reason[r] || [r])[0]}`).join(", ")}).`, "");
  o.push("## Pages", "", "| # | Page | Problems | Blocking · high · medium · low | Report |", "|---|---|---|---|---|");
  for (const p of sm.pages) o.push(`| ${p.i} | ${cell(p.url)} | ${p.ok ? p.total : p.reasonCode} | ${p.ok ? SEVERITIES.map((s) => p.counts[s]).join(" · ") : "—"} | pages/${p.slug}.html |`);
  o.push("", "## Problems repeated across pages", "");
  if (!sm.repeated.length) o.push(S.noneRepeated[0]);
  for (const c of sm.repeated) {
    const e = explain(c.code);
    o.push(`### ${cell(e.t[0])} · ${SEV[c.worst][0]} · ${c.pages.size} pages`, "", cell(e.d[0]), "");
    o.push(`- Pages: ${[...c.pages.values()].map((x) => sm.pages.find((p) => p.slug === x.slug).i).join(", ")}`);
    o.push(`- Code: \`${c.code}\` · *Fix direction, for specialists:* ${cell(e.x[0])}`, "");
  }
  o.push("## Across the site", "");
  if (!sm.siteWide.findings.length) o.push("No site-wide problem among the audited pages.", "");
  for (const f of sm.siteWide.findings) o.push(`- **${SITE_EXPLAIN[f.code].t[0]}** (${SEV[f.severity][0]}, ${f.slugs.length} pages, code ${f.code}): ${cell(SITE_EXPLAIN[f.code].d[0])} *Fix direction:* ${cell(SITE_EXPLAIN[f.code].x[0])}`);
  for (const n of sm.siteWide.notChecked) o.push(`- Not checked: ${SITE_EXPLAIN[n.code].t[0]} (${n.reason})`);
  o.push("");
  o.push("## Pages × problems", "", `| Problem | ${sm.pages.filter((p) => p.ok).map((p) => p.i).join(" | ")} | Pages |`, `|---|${sm.pages.filter((p) => p.ok).map(() => "---").join("|")}|---|`);
  for (const c of sm.codes) o.push(`| ${cell(codeTitle(c.code)[0])} | ${sm.pages.filter((p) => p.ok).map((p) => (c.pages.get(p.slug) ? SEV[c.pages.get(p.slug).severity][0][0] : "")).join(" | ")} | ${c.pages.size} |`);
  o.push("", "B blocking, H high, M medium, L low.", "");
  return o.join("\n");
}

/** The site export: getlooploop/ai-search-audit-site@1. Each page's own export is beside it. */
export function buildSiteExport(sm, entries) {
  return {
    schema: SITE_EXPORT_SCHEMA,
    pageSchema: EXPORT_SCHEMA,
    skillVersion: SKILL_VERSION,
    producedBy: PRODUCED_BY,
    edition: "full",
    createdAt: sm.manifest.createdAt,
    rulesChecked: RULES_CHECKED,
    source: sm.manifest.source,
    cap: sm.manifest.cap,
    total: sm.manifest.total,
    evaluated: sm.manifest.evaluated,
    leftOut: sm.manifest.leftOut,
    politeness: sm.manifest.politeness,
    verdict: { en: siteVerdict(sm)[0], uk: siteVerdict(sm)[1] },
    totals: sm.totals,
    pages: sm.pages.map((p) => {
      const e = entries.find((x) => x.slug === p.slug);
      return {
        slug: p.slug,
        url: p.url,
        title: p.title,
        ok: p.ok,
        reasonCode: p.reasonCode,
        createdAt: p.createdAt,
        counts: p.counts,
        total: p.total,
        report: `pages/${p.slug}.html`,
        export: `pages/${p.slug}.json`,
        findings: e?.model ? e.model.findings.map((f) => ({ id: f.id, code: f.code, severity: f.severity, label: { en: f.label[0], uk: f.label[1] }, where: f.where })) : [],
        drift: e?.history?.drift ? { since: e.history.drift.since, changed: e.history.drift.changed ?? null } : null,
        compare: e?.compare ? e.compare.counts : null,
      };
    }),
    repeated: sm.repeated.map((c) => ({ code: c.code, severity: c.worst, pages: [...c.pages.keys()], explanation: explanationOf(c.code) })),
    single: sm.single.map((c) => ({ code: c.code, severity: c.worst, page: [...c.pages.keys()][0] })),
    siteWide: { findings: sm.siteWide.findings.map((f) => ({ ...f, explanation: { title: { en: SITE_EXPLAIN[f.code].t[0], uk: SITE_EXPLAIN[f.code].t[1] }, description: { en: SITE_EXPLAIN[f.code].d[0], uk: SITE_EXPLAIN[f.code].d[1] }, rule: SITE_EXPLAIN[f.code].r, fixDirection: { en: SITE_EXPLAIN[f.code].x[0], uk: SITE_EXPLAIN[f.code].x[1] } } })), notChecked: sm.siteWide.notChecked, scope: "the audited pages only" },
    matrix: { codes: sm.codes.map((c) => c.code), pages: sm.pages.filter((p) => p.ok).map((p) => p.slug), cells: sm.codes.map((c) => sm.pages.filter((p) => p.ok).map((p) => c.pages.get(p.slug)?.severity || null)) },
  };
}

// ── 2.108: a refused site ─────────────────────────────────────────────────────
// A Russian domain zone, hosting in Russia, or a Russian-language version shown on any page stops
// the whole site run (site.mjs). The site report is then the refusal itself, with one line saying
// where the run stopped; no page report is written and nothing of any page is kept.

/** The refused site as a reading-shaped object, for the page refusal's renderers. */
const refusedSite = (manifest) => ({
  ok: false,
  reasonCode: manifest.refused.reasonCode,
  refusal: manifest.refused.refusal ?? null,
  hosting: manifest.refused.hosting ?? null,
  createdAt: manifest.createdAt,
  requestedInput: manifest.refused.url,
  page: { url: manifest.refused.url, requestedUrl: manifest.refused.url },
});

/** Where the run stopped, EN, UK and PL. */
export function siteStopNote(manifest) {
  const read = (manifest.discarded || []).length;
  const notRead = manifest.leftOut?.byReason?.site_refused ?? 0;
  return [
    `The site audit stopped at ${manifest.refused.url}: no page of this site is analysed (read before it and discarded: ${fmtEn(read)}; not read: ${fmtEn(notRead)}).`,
    `Перевірку сайту зупинено на ${manifest.refused.url}: жодну сторінку цього сайту не проаналізовано (прочитано до неї й відкинуто: ${fmtUk(read)}; не прочитано: ${fmtUk(notRead)}).`,
    `Sprawdzanie serwisu zatrzymano na ${manifest.refused.url}: żadna strona tego serwisu nie została przeanalizowana (przeczytane przed nią i odrzucone: ${fmtPl(read)}; nieprzeczytane: ${fmtPl(notRead)}).`,
  ];
}

export function renderSiteRefusal(manifest) {
  return renderRefusal(refusedSite(manifest), { note: siteStopNote(manifest) });
}

export function renderSiteRefusalMarkdown(manifest) {
  const md = renderRefusalMarkdown(refusedSite(manifest));
  const [first, ...rest] = md.split("\n");
  return [first, "", siteStopNote(manifest)[0], ...rest].join("\n");
}

export function buildSiteRefusalExport(manifest) {
  return {
    ...buildRefusalExport(refusedSite(manifest)),
    schema: SITE_EXPORT_SCHEMA,
    pageSchema: EXPORT_SCHEMA,
    site: { source: manifest.source, stoppedAt: manifest.refused.url, total: manifest.total, evaluated: manifest.evaluated, discarded: (manifest.discarded || []).length, leftOut: manifest.leftOut },
  };
}
