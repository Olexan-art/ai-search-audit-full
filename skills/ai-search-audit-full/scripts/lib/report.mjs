// The audit as one self-contained HTML page, summary first (2.103): the header, the URL and a
// headline built from the findings, the severity counts, three "what it means for you" cards, the
// three findings to review first, the places in the document with the selected one beside them,
// and one closed section holding every technical detail (status by area, bots, the Google and Bing
// checklist, languages, severity, where the text goes, <head> and robots.txt, every finding, what
// the check cannot see), then the notes and the footer. Full adds its layers to that layout: every
// finding in the top rows and the selected place opens to its plain description and "What the
// rule says"; the history and before/after follow the places; and inside the closed section every
// problem is listed by who it concerns, with its details for specialists, where alone the fix
// direction appears.
//
// Every string that came from the audited page (titles, headings, URLs, paths) goes through esc();
// the CSP blocks every network request; the one inline script switches language and theme,
// selects a place, opens a section a link points into, and copies a path. The theme is light
// unless #theme=dark or the toggle asks for dark: the system preference is not read.

import { esc, FOOTER_LINKS } from "../vendor/vectorscope/html.mjs";
import { FINDINGS, REFUSAL_COPY, SANCTIONS_LINKS, isRefusalCode, refusalReason } from "../vendor/vectorscope/refusal.mjs";
import { MOTANKA } from "../vendor/vectorscope/sprites.mjs";
import { CSS, CSS_EXTRA } from "./css.mjs";
import { CSS_FULL } from "./cssFull.mjs";
import { explain } from "./explain.mjs";
import { source } from "./rules.mjs";
import { FAVICONS } from "./favicons.mjs";
import { ANSWERS } from "./copy.mjs";
import { CANNOT, CARD_COPY, LAYER, LITE, MARK, OWNERS, SEV, SEV_COUNT, STATE, UI, ZONE_LABEL, dateLong, dateOf, fmtEn, fmtPl, fmtUk, headline, nMinor, nProblems, subtitle } from "./copy.mjs";
import { GLL_MARK, GLL_MARK_LIGHT } from "../vendor/vectorscope/brandmark.mjs";
import { GENERATED_CSS, renderGeneratedHtml } from "../vendor/vectorscope/generatedText.mjs";
import { packScript } from "./history.mjs";
import { LOGO_GLITCH_JS } from "./glitch.mjs";
import { SEVERITIES } from "./checks.mjs";

export const TOOL_NAME = "AI Search Audit";
export const EDITION = "Full";

// ── small helpers ────────────────────────────────────────────────────────────

const pair = (en, uk, pl) => {
  if (pl === undefined) throw new Error("pair() needs the Polish string too");
  return `<span class="l-en">${en}</span><span class="l-uk" lang="uk">${uk}</span><span class="l-pl" lang="pl">${pl}</span>`;
};
/** An [en, uk, pl] triple of plain strings, escaped. */
const P = (t) => pair(esc(t[0]), esc(t[1]), esc(t[2]));
const attrPair = (name, en, uk, pl) => {
  if (pl === undefined) throw new Error("attrPair() needs the Polish string too");
  return `${name}="${esc(en)}" data-en-${name}="${esc(en)}" data-uk-${name}="${esc(uk)}" data-pl-${name}="${esc(pl)}" data-i18n`;
};
const ext = (href, text) => `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
const call = (t, ...a) => [0, 1, 2].map((i) => (typeof t[i] === "function" ? t[i](...a) : t[i]));
const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, Math.max(1, n - 1))}…` : t;
};

function safeHref(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

const ICONS = {
  // The real mark, not a drawn stand-in.
  getlooploop: `<img class="gll-ico gll-on-light" src="${GLL_MARK_LIGHT}" alt="" width="28" height="15"><img class="gll-ico gll-on-dark" src="${GLL_MARK}" alt="" width="28" height="15">`,
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  bluesky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.3C8 5.4 11 9.6 12 11.8c1-2.2 4-6.4 6.8-8.5 2-1.5 5.2-2.6 5.2 1 0 .7-.4 6-.6 6.9-.8 3-3.8 3.7-6.5 3.3 4.7.8 5.9 3.4 3.3 6.1-4.9 5-7-1.3-7.6-2.9l-.6-1.7-.6 1.7c-.6 1.6-2.7 7.9-7.6 2.9-2.6-2.7-1.4-5.3 3.3-6.1-2.7.4-5.7-.3-6.5-3.3C.4 10.3 0 5 0 4.3c0-3.6 3.2-2.5 5.2-1z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};
// The Vectorscope report's four footer links, so the two skills cannot drift apart.
const LINKS = FOOTER_LINKS.map((l) => [l.id, l.name, l.href, l.key ? UI.author : null]);
const OWNER_ICON = {
  dev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  content: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  seo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const STATE_ICON = {
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  prob: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/></svg>',
  block: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  na: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><path d="M8 12h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.6 10.6 0 0 1 12 6c5 0 8.5 4.3 9.5 6-.5.9-1.5 2.3-3 3.6M6.4 7.6C4.6 8.9 3.2 10.7 2.5 12c1 1.7 4.5 6 9.5 6 1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 12h9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

// ── markers: shape and size carry the severity as well as the colour ─────────

function pinShape(sev) {
  if (sev === "blocking") {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return `${(15.5 * Math.cos(a)).toFixed(2)},${(15.5 * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return `<polygon class="sh" points="${pts}"/>`;
  }
  if (sev === "high") return '<circle class="sh" r="13.5"/>';
  if (sev === "medium") return '<circle class="sh" r="11.5"/>';
  return '<rect class="sh" x="-9.5" y="-9.5" width="19" height="19" rx="4"/>';
}
const pinIcon = (sev, n, size = 28) => `<svg class="pi pin ${sev}" viewBox="-19 -19 38 38" width="${size}" height="${size}" aria-hidden="true">${pinShape(sev)}${n != null ? `<text dy=".36em">${n}</text>` : ""}</svg>`;
/** The "Agent's judgement · <model>" badge, on every finding the agent's model made. */
const judgeBadge = (f) => {
  if (f.layer !== "judgement") return "";
  const m = f.judgement?.model;
  const t = [`${LAYER.judgement[0]} · ${m || UI.modelNotStated[0]}`, `${LAYER.judgement[1]} · ${m || UI.modelNotStated[1]}`, `${LAYER.judgement[2]} · ${m || UI.modelNotStated[2]}`];
  return `<span class="lyr judgement">${P(t)}</span>`;
};
const ownerMark = (o) => `<span class="own" ${attrPair("title", OWNERS[o][0], OWNERS[o][1], OWNERS[o][2])}>${OWNER_ICON[o]}<span class="vh">${P(OWNERS[o])}</span></span>`;
/** SVG text in every language, or once when all three are the same. */
const stx = (x, y, t, cls, extra = "") =>
  t[0] === t[1] && t[0] === t[2]
    ? `<text class="${cls}" x="${x}" y="${y}"${extra}>${esc(t[0])}</text>`
    : `<text class="${cls} l-en" x="${x}" y="${y}"${extra}>${esc(t[0])}</text><text class="${cls} l-uk" x="${x}" y="${y}"${extra}>${esc(t[1])}</text><text class="${cls} l-pl" x="${x}" y="${y}"${extra}>${esc(t[2])}</text>`;
const mkI = (st, lab) => `<span class="mk ${st}" ${attrPair("title", lab[0], lab[1], lab[2])}><i aria-hidden="true">${MARK[st].i}</i><span class="vh">${P(lab)}</span></span>`;
const head = (id, t, unit) => `<div class="panel-head"><h2 id="${id}">${P(t)}${unit ? ` <span class="unit">${P(unit)}</span>` : ""}</h2></div>`;

// ── the summary: headline, three cards, the first three findings ─────────────

const CARD_ICON = {
  find: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="8" width="14" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 4.5V8M9.5 13h.01M14.5 13h.01M9.5 16.2h5M3 12.5v3M21 12.5v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="3.8" r="1.1" fill="currentColor"/></svg>',
  text: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3h7.5l4.5 4.5V20a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M13.5 3.2V8h4.8M8.8 12h6.4M8.8 15h6.4M8.8 18h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  brand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12.4V4.6a1 1 0 0 1 1-1h7.8a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="8.3" cy="8.3" r="1.6" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
};
const EXT_ICON = '<svg class="ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const LIST_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/></svg>';
const INFO_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.3" fill="currentColor"/></svg>';

const worstState = (items) => (items.some((f) => f.severity === "blocking") ? "block" : items.some((f) => f.severity === "high" || f.severity === "medium") ? "prob" : "ok");
const sevPill = (s) => `<span class="pill sp ${s}">${pinIcon(s, null, 14)}${P(SEV[s])}</span>`;
const layerPill = (f) => (f.layer === "judgement" ? `<span class="pill lp est">${P(LITE.estimate)}</span>` : `<span class="pill lp ms">${P(f.layer === "derived" ? LAYER.derived : LITE.measured)}</span>`);
const modelOf = (f) => [f.judgement?.model || UI.modelNotStated[0], f.judgement?.model || UI.modelNotStated[1], f.judgement?.model || UI.modelNotStated[2]];

function zoneLabel(z) {
  if (z.kind === "section" || z.kind === "js") {
    const text = z.label || z.headings[0] || "";
    const base = text ? [text, text, text] : ZONE_LABEL.untitled();
    return z.kind === "js" ? [`${base[0]} · JavaScript`, `${base[1]} · JavaScript`, `${base[2]} · JavaScript`] : base;
  }
  if (z.kind === "more" && z.label) return ZONE_LABEL.more(z).map((t) => `${z.label} · ${t}`);
  return (ZONE_LABEL[z.kind] || ZONE_LABEL.untitled)(z);
}

/** The place a finding is drawn in: a zone, the <head>, robots.txt, or none. */
const placeOf = (f) => (f.zones.length ? `z${f.zones[0]}` : f.strip ? f.strip.side : null);

/** Where a finding is, in a few words: its zone, its strip, or what the check knows. */
function locOf(f, model) {
  if (f.zones.length) {
    const z = model.zones.find((x) => x.id === f.zones[0]);
    if (z) return zoneLabel(z).map((t) => clip(t, 40));
  }
  if (f.strip) return f.strip.side === "head" ? ["<head>", "<head>", "<head>"] : ["robots.txt", "robots.txt", "robots.txt"];
  if (f.code === "question_missing") return LITE.notInText;
  if (f.where) return [clip(f.where, 40), clip(f.where, 40), clip(f.where, 40)];
  return LITE.wholePage;
}

function heroBlock(model) {
  const r = model.reading;
  const h = headline(model.findings);
  const href = safeHref(r.fetch.finalUrl);
  const url = href ? `<a class="url" id="audited-url" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(r.fetch.finalUrl)}${EXT_ICON}</a>` : `<span class="url">${esc(r.fetch.finalUrl)}</span>`;
  const date = dateLong(r.createdAt);
  const title = r.facts.head.title ? `<span aria-hidden="true">·</span><span class="pt">${esc(clip(r.facts.head.title, 120))}</span>` : "";
  const sevs = SEVERITIES.map((s) => `<li class="${s}">${pinIcon(s, null, 16)}<span>${P(call(SEV_COUNT[s], model.counts[s]))}</span></li>`).join("");
  return [
    `<header class="verdict lite-verdict${h.blocked ? " is-blocked" : ""}" id="verdict">`,
    `<p class="pageid">${url}</p>`,
    `<p class="lite-meta"><span>${P([LITE.checked[0](date[0]), LITE.checked[1](date[1]), LITE.checked[2](date[2])])}</span>${title}</p>`,
    `<h1 id="headline">${P(h.t)}</h1>`,
    `<p class="lede" id="subtitle">${P(subtitle(model.findings, h.blocked))}</p>`,
    `<ul class="sevrow" id="sev-counts" ${attrPair("aria-label", UI.severity[0], UI.severity[1], UI.severity[2])}>${sevs}</ul>`,
    `<p class="cta-row"><a class="btn btn-primary" id="see-first" href="#review-first">${P(LITE.seeFindings)}<span aria-hidden="true"> ↓</span></a></p>`,
    "</header>",
  ].join("\n");
}

function cardsBlock(model) {
  const F = model.findings;
  const own = (f) => f.layer !== "judgement" && f.area !== "brand";
  const c1 = F.filter((f) => own(f) && ["find", "classic", "lang"].includes(f.area));
  const c2 = F.filter((f) => own(f) && ["read", "quote"].includes(f.area));
  const c3 = F.filter((f) => !own(f));
  const cards = [];
  const blocker = c1.find((f) => f.severity === "blocking");
  cards.push({
    id: "find",
    state: worstState(c1),
    title: blocker ? CARD_COPY.find.title.block : CARD_COPY.find.title.ok,
    status: blocker ? [CARD_COPY.find.status.block[0](blocker.label[0]), CARD_COPY.find.status.block[1](blocker.label[1]), CARD_COPY.find.status.block[2](blocker.label[2])] : c1.length ? call(CARD_COPY.find.status.notes, c1.length) : CARD_COPY.find.status.none,
  });
  cards.push({
    id: "text",
    state: worstState(c2),
    title: !c2.length ? CARD_COPY.text.title.ok : c2.some((f) => f.hides) ? CARD_COPY.text.title.hides : CARD_COPY.text.title.notes,
    status: c2.length ? call(CARD_COPY.text.status.notes, c2.length) : CARD_COPY.text.status.none,
  });
  const judged = model.judgement.any || c3.length > 0;
  const B = CARD_COPY.brand;
  cards.push({
    id: "brand",
    state: judged ? worstState(c3) : "na",
    title: !judged ? B.title.na : c3.some((f) => f.area === "brand") ? B.title.brand : c3.length ? B.title.questions : B.title.ok,
    status: !judged ? B.status.na : c3.some((f) => f.code === "brand_unknown") ? B.status.unknown : c3.length ? call(B.status.notes, c3.length) : B.status.ok,
  });
  const li = cards.map((c) => `<li class="card ${c.state}" id="card-${c.id}"><span class="card-i">${CARD_ICON[c.id]}</span><span class="card-t"><h3>${P(c.title)}</h3><span class="card-s">${P(c.status)}</span></span></li>`).join("");
  const note = model.judgement.any ? call(LITE.cardsNote[0], model.judgement.model || UI.modelNotStated[0]) : LITE.cardsNote[1];
  if (model.judgement.any && !model.judgement.model) {
    note[1] = LITE.cardsNote[0][1](UI.modelNotStated[1]);
    note[2] = LITE.cardsNote[0][2](UI.modelNotStated[2]);
  }
  return `<section class="sum" id="means" aria-labelledby="h-means"><h2 id="h-means">${P(LITE.means)}</h2><ul class="cards" id="cards">${li}</ul><p class="cards-note">${P(note)}</p></section>`;
}

function firstRow(f, model) {
  const main = `<span class="tn ${f.severity}" aria-hidden="true">${f.pin}</span><span class="tl">${P(f.label)}</span><span class="tp">${sevPill(f.severity)}${layerPill(f)}</span><span class="tloc">${P(locOf(f, model))}</span>`;
  if (f.layer === "judgement") {
    const q = /^question_/.test(f.code);
    const qs = q ? model.findings.filter((x) => x.code === f.code && x.evidence?.question).map((x) => x.evidence.question) : [];
    const m = modelOf(f);
    const list = qs.length ? `<ul class="qx">${qs.map((t) => `<li>${pair(`“${esc(t)}”`, `«${esc(t)}»`, `„${esc(t)}”`)}</li>`).join("")}</ul>` : "";
    const panel = `<div class="tr-x">${whyBody(f)}${list}<p class="tr-model"><b>${P([LITE.modelLine[0](m[0]), LITE.modelLine[1](m[1]), LITE.modelLine[2](m[2])])}</b><span>${P(LITE.notThree)}</span></p></div>`;
    return `<li class="tr jd" id="top-${esc(f.id)}"><details class="tr-d"><summary class="tr-m">${main}<span class="btn btn-out btn-sm tr-b">${P(q ? LITE.examples : LITE.aboutEstimate)}${CHEV}</span></summary>${panel}</details></li>`;
  }
  const pid = placeOf(f);
  const btn = pid ? `<a class="btn btn-out btn-sm tr-b" href="#place-${pid}" data-place="${pid}">${P(LITE.showPlace)}<span aria-hidden="true"> ›</span></a>` : `<a class="btn btn-out btn-sm tr-b" href="#pin-${esc(f.id)}">${P(LITE.showInList)}<span aria-hidden="true"> ›</span></a>`;
  return `<li class="tr" id="top-${esc(f.id)}"><div class="tr-m">${main}${btn}</div>${whyDetails(f, `why-top-${esc(f.id)}`)}</li>`;
}

function firstBlock(model) {
  const top = model.bigs.slice(0, 3);
  const body = top.length ? `<ol class="trows" id="top-rows">${top.map((f) => firstRow(f, model)).join("")}</ol>` : `<p class="none-found">${P(UI.noProblems)}</p>`;
  return `<section class="sum" id="review-first" aria-labelledby="h-first"><h2 id="h-first">${P(LITE.first)}</h2>${body}</section>`;
}

// ── the answer map: one row per question, what the page lacks first ─────────

function answersBlock(model) {
  const a = model.answers;
  const s = a.summary;
  const tone = (q) => (q >= 75 ? "var(--green)" : q >= 40 ? "var(--amber)" : "var(--red)");
  const first = new Set(a.addFirst);
  const rows = a.rows.map((r) => {
    const signs = r.verdict === "missing" ? "" : `<span class="am-signs">${r.citable ? `<span class="am-s">✓ ${P(ANSWERS.signs.citable)}</span>` : ""}${r.direct ? `<span class="am-s">✓ ${P(ANSWERS.signs.direct)}</span>` : ""}</span>`;
    const miss = r.verdict === "complete" ? P(ANSWERS.noMiss) : r.miss ? esc(r.miss) : `<span class="am-faint">${P(ANSWERS.missUnstated)}</span>`;
    return `<tr class="am-${r.verdict}"><th scope="row">${esc(r.question)}${first.has(r.id) ? ` <span class="am-first">${P(ANSWERS.addFirst)}</span>` : ""}${r.quote ? `<q class="am-q">${esc(r.quote)}</q>` : ""}</th>`
      + `<td><span class="am-v">${P(ANSWERS.verdict[r.verdict])}</span></td>`
      + `<td><span class="am-bar" style="--t:${tone(r.quality)}"><i style="width:${r.quality}%"></i></span><b class="am-n">${r.quality}/100</b>${signs}</td>`
      + `<td class="am-miss">${miss}</td><td class="am-p">${r.passage === null ? "—" : `#${r.passage}`}</td></tr>`;
  }).join("");
  const sub = [ANSWERS.sub[0](s), ANSWERS.sub[1](s), ANSWERS.sub[2](s)];
  const pills = `<span class="pill lp est">${P(LITE.estimate)}</span> <span class="pill lp ms">${P(LAYER.derived)}</span>`;
  return `<section class="sum" id="answer-map" aria-labelledby="h-answers">${sumHead("h-answers", ANSWERS.title, sub)}<p class="am-lead">${pills} ${P(ANSWERS.lead)}</p><div class="tablewrap"><table class="am"><thead><tr>${ANSWERS.cols.map((c) => `<th>${P(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div><p class="capnote">${P(ANSWERS.how)}</p></section>`;
}

// ── where on the page: the places, top to bottom, and the selected one ──────

const HEADERISH = new Set(["header", "nav", "footer"]);

function placeList(model) {
  const F = model.findings;
  const strip = (side) => F.filter((f) => f.strip?.side === side);
  const out = [
    { id: "robots", kind: "file", label: ["robots.txt · llms.txt", "robots.txt · llms.txt", "robots.txt · llms.txt"], pins: strip("robots"), rows: model.robots },
    { id: "head", kind: "file", label: ["<head>", "<head>", "<head>"], pins: strip("head"), rows: model.head },
  ];
  const lede = F.find((f) => f.code === "hero_lede_dropped");
  for (const z of model.zones) {
    const unseen = z.hidden || z.kind === "aside" || (z.seen !== null && z.seen !== undefined && z.seen < 0.05 && !HEADERISH.has(z.kind));
    const partial = !unseen && z.seen !== null && z.seen !== undefined && z.seen < 0.9 && z.kind !== "hero" && !HEADERISH.has(z.kind) ? 1 - z.seen : 0;
    const hide = unseen ? (z.hidden && z.panels > 1 ? call(UI.panelsHidden, z.panels, z.chars) : LITE.notRead) : partial ? call(LITE.partRead, Math.round(partial * 100)) : z.kind === "hero" && lede && lede.zones.includes(z.id) ? LITE.notRead : null;
    out.push({ id: `z${z.id}`, kind: z.kind, js: z.kind === "js", label: zoneLabel(z), pins: z.pins, chars: z.chars, unseen, hide });
  }
  return out;
}

function placeRow(p, sel) {
  const shown = p.pins.slice(0, 5);
  const extra = p.pins.length - shown.length;
  const pins = `${shown.map((f) => pinIcon(f.severity, f.pin, 32)).join("")}${extra ? `<span class="pr-more">+${extra}</span>` : ""}`;
  const sr = p.pins.map((f) => `${f.pin} · ${SEV[f.severity][0]} · ${f.label[0]}`);
  const srUk = p.pins.map((f) => `${f.pin} · ${SEV[f.severity][1]} · ${f.label[1]}`);
  const srPl = p.pins.map((f) => `${f.pin} · ${SEV[f.severity][2]} · ${f.label[2]}`);
  const w = p.kind === "file" ? 0 : HEADERISH.has(p.kind) ? 34 : Math.round(Math.min(92, 22 + Math.sqrt(Math.max(0, p.chars || 0)) * 1.1));
  const mid = p.hide ? `<span class="pr-hid">${P(p.hide)}</span>` : w ? `<span class="pr-bar" style="width:${w}%" aria-hidden="true"></span>` : `<span class="pr-n">${P(call(LITE.rows, p.rows.length))}</span>`;
  const cls = ["pl", p.kind === "file" ? "file" : "", p.js ? "js" : "", p.unseen ? "hid" : "", sel ? "sel" : ""].filter(Boolean).join(" ");
  return `<li class="${cls}" id="place-${p.id}"><button type="button" class="pr" data-place="${p.id}" aria-pressed="${sel}" aria-controls="pd-${p.id}"><span class="pr-l">${P(p.label.map((t) => clip(t, 46)))}</span>${mid}<span class="pr-pins" aria-hidden="true">${pins}</span>${sr.length ? `<span class="vh">: ${P([sr.join("; "), srUk.join("; "), srPl.join("; ")])}</span>` : ""}</button></li>`;
}

function placeDetail(p, sel) {
  const o = [`<div class="pd" id="pd-${p.id}"${sel ? "" : " hidden"}>`, `<h3>${P(LITE.selected)}: <span class="pd-n">${P(p.label.map((t) => clip(t, 60)))}</span></h3>`];
  if (p.pins.length) {
    o.push(`<p class="pd-f">${P(LITE.found)}:</p><ul class="pd-list">`);
    for (const f of p.pins) o.push(`<li>${pinIcon(f.severity, f.pin, 24)}<span class="pd-l">${P(f.label)}</span><span class="pd-p">${sevPill(f.severity)}${layerPill(f)}</span>${whyDetails(f, `why-${p.id}-${esc(f.id)}`)}</li>`);
    o.push("</ul>");
  } else o.push(`<p class="pd-f none">${P(LITE.nothingHere)}</p>`);
  if (p.rows) {
    o.push(`<ul class="pd-rows">${p.rows.map((r) => {
      const k = Array.isArray(r.k) ? r.k : [r.k, r.k, r.k];
      const st = r.pins.length ? r.pins.map((f) => pinIcon(f.severity, f.pin, 20)).join("") : `<span class="mk pass" aria-hidden="true"><i>${MARK.pass.i}</i></span>`;
      return `<li><span class="rk">${P(k)}</span><span class="rv">${P(r.v.map((t) => clip(t, 70)))}</span><span class="rs">${st}</span></li>`;
    }).join("")}</ul>`);
  }
  const wheres = [...new Set(p.pins.map((f) => String(f.where || "").trim()).filter(Boolean))];
  if (wheres.length) {
    const rows = wheres.map((w) => `<div class="ex-row"><code class="ex-c">${esc(w)}</code><button type="button" class="copy" data-copy data-en-done="${esc(LITE.copied[0])}" data-uk-done="${esc(LITE.copied[1])}" data-pl-done="${esc(LITE.copied[2])}" ${attrPair("aria-label", LITE.copy[0], LITE.copy[1], LITE.copy[2])}>${COPY_ICON}</button></div>`).join("");
    o.push(`<details class="exact"><summary class="btn btn-primary btn-sm">${P(LITE.exact)}${CHEV}</summary><div class="ex-box"><p class="ex-l">${P(LITE.path)}:</p>${rows}</div></details>`);
  }
  o.push("</div>");
  return o.join("");
}

function placesBlock(model) {
  const places = placeList(model);
  const first = model.findings.map(placeOf).find(Boolean);
  const selId = first || places.find((p) => p.pins.length)?.id || places[2]?.id || places[0].id;
  const legend = [...SEVERITIES.map((s) => `<li>${pinIcon(s, null, 20)}${P(SEV[s])}</li>`), `<li><span class="sw-hatch" aria-hidden="true"></span>${P(LITE.notRead)}</li>`, `<li><span class="sw-js" aria-hidden="true"></span>${P(UI.onlyJs)}</li>`];
  if (model.unmappedCount) legend.push(`<li class="pm-un"><a href="#all-problems">${P(call(UI.unmapped, model.unmappedCount))}</a></li>`);
  const zonesCap = model.caps.find((c) => c.id === "zones");
  return [
    `<section class="sum" id="page-map" aria-labelledby="h-map">`,
    `<div class="sum-head"><h2 id="h-map">${P(LITE.where)}</h2><span class="sub">${P(LITE.schemaNote)}</span></div>`,
    `<div class="pmap"><ol class="places" id="places" ${attrPair("aria-label", LITE.placesAria[0], LITE.placesAria[1], LITE.placesAria[2])}>${places.map((p) => placeRow(p, p.id === selId)).join("")}</ol>`,
    `<div class="pm-side" id="place-detail">${places.map((p) => placeDetail(p, p.id === selId)).join("")}<p class="vh" id="copy-live" aria-live="polite"></p></div></div>`,
    `<ul class="pm-legend" id="map-legend">${legend.join("")}</ul>`,
    zonesCap ? `<p class="capnote">${P(zonesCap.t)}</p>` : "",
    "</section>",
  ].join("\n");
}

// ── all checks: the per-area status, the strips, every finding ──────────────

function areasBlock(model) {
  const o = [`<section class="panel" id="lc-areas" aria-labelledby="h-areas">${head("h-areas", LITE.areas)}<ul class="tiles areas" id="status" ${attrPair("aria-label", UI.statusAria[0], UI.statusAria[1], UI.statusAria[2])}>`];
  for (const t of model.tiles) {
    const na = t.id === "brand" ? [STATE.unchecked, UI.noBrandFiles] : [STATE.na, UI.oneVersion];
    const tc = t.state === "na" ? na[1] : !t.count ? UI.nothingFound : t.minorOnly ? nMinor(t.count) : nProblems(t.count);
    o.push(`<li class="tile ${t.state}" id="tile-${t.id}"><h3>${P(t.q)}</h3><span class="state">${STATE_ICON[t.state]}${P(t.state === "na" ? na[0] : STATE[t.state])}</span><span class="tc">${P(tc)}</span></li>`);
  }
  o.push("</ul></section>");
  return o.join("\n");
}

function stripsBlock(model) {
  const table = (title, rows) => `<div class="strip"><h3 class="mono">${esc(title)}</h3><ul class="pd-rows">${rows.map((r) => {
    const k = Array.isArray(r.k) ? r.k : [r.k, r.k, r.k];
    const st = r.pins.length ? r.pins.map((f) => `<a href="#pin-${esc(f.id)}">${pinIcon(f.severity, f.pin, 20)}<span class="vh">${P(SEV[f.severity])}</span></a>`).join("") : `<span class="mk pass" aria-hidden="true"><i>${MARK.pass.i}</i></span>`;
    return `<li><span class="rk">${P(k)}</span><span class="rv">${P(r.v)}</span><span class="rs">${st}</span></li>`;
  }).join("")}</ul></div>`;
  return `<section class="panel wide" id="lc-strips" aria-labelledby="h-strips">${head("h-strips", LITE.strips)}<div class="strips">${table("<head>", model.head)}${table("robots.txt · llms.txt", model.robots)}</div></section>`;
}

function findingsBlock(model) {
  if (!model.findings.length) return `<section class="panel" id="all-findings" aria-labelledby="h-allf">${head("h-allf", LITE.allFindings)}<p class="none-found">${P(UI.noProblems)}</p></section>`;
  const items = model.findings.map((f) => `<li id="pin-${esc(f.id)}" class="${f.severity}${f.layer === "judgement" ? " jd" : ""}">${pinIcon(f.severity, f.pin, 26)}<span class="vh">${P(SEV[f.severity])}: </span><span class="pk-l">${P(f.label)}<span class="pk-w">${P(locOf(f, model))}</span></span>${ownerMark(f.owner)}${judgeBadge(f)}</li>`).join("");
  return `<section class="panel" id="all-findings" aria-labelledby="h-allf">${head("h-allf", LITE.allFindings, call(UI.marked, model.mappedCount))}<ol class="pm-key" id="map-key">${items}</ol></section>`;
}

function allChecksBlock(model) {
  return [
    `<details class="allc" id="all-checks">`,
    `<summary class="allc-s"><span class="allc-i">${LIST_ICON}</span><span class="allc-t"><h2 id="h-all">${P(LITE.all)}</h2><span class="sub">${P(LITE.allSub)}</span></span>${CHEV}</summary>`,
    '<div class="allc-b">',
    areasBlock(model),
    '<div class="lcharts">',
    botsBlock(model),
    classicBlock(model),
    languagesBlock(model),
    severityBlock(model),
    waterfallBlock(model),
    stripsBlock(model),
    "</div>",
    allProblemsBlock(model),
    howBlock(model),
    cannotBlock(model),
    "</div>",
    "</details>",
  ].join("\n");
}

function infoStrip() {
  return [
    `<section class="info" id="info-strip" ${attrPair("aria-label", LITE.about[0], LITE.about[1], LITE.about[2])}>`,
    `<p class="info-n">${INFO_ICON}<span>${P(LITE.info)}</span></p>`,
    `<ul class="info-l"><li><span class="lyr-k ms" aria-hidden="true"></span><span><b>${P(LITE.measured)}</b>${P(LITE.measuredSub)}</span></li><li><span class="lyr-k est" aria-hidden="true"></span><span><b>${P(LITE.estimate)}</b>${P(LITE.estimateSub)}</span></li></ul>`,
    `<p class="fulllink" id="explained-link"><a class="btn btn-out" href="#all-problems">${P(LITE.full)}<span aria-hidden="true"> ↓</span></a></p>`,
    "</section>",
  ].join("\n");
}

function severityBlock(model) {
  const max = Math.max(1, ...SEVERITIES.map((s) => model.counts[s]));
  const C = { blocking: "--red", high: "--amber", medium: "--amber", low: "--pin-low" };
  const rows = SEVERITIES.map((s) => `<li><span class="sl">${pinIcon(s, null, 18)}${P(SEV[s])}</span><span class="st"><span class="sb ${s}" style="width:${((model.counts[s] / max) * 100).toFixed(1)}%;--c:var(${C[s]})"></span></span><span class="sn">${model.counts[s]}</span></li>`).join("");
  return `<section class="panel" id="lc-severity" aria-labelledby="h-lc-sev">${head("h-lc-sev", UI.severity, UI.problemsUnit)}<ul class="sbars">${rows}</ul></section>`;
}

function waterfallBlock(model) {
  const w = model.waterfall;
  const unit = [`${UI.charsUnit[0]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[0]}`, `${UI.charsUnit[1]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[1]}`, `${UI.charsUnit[2]} · ${UI.passagesLine[2](model.passages.used, model.passages.cap)}`];
  if (!w) return `<section class="panel" id="lc-text" aria-labelledby="h-lc-text">${head("h-lc-text", UI.text, unit)}</section>`;
  const R = 46;
  const x = (v) => `${((v / Math.max(1, w.raw)) * 100).toFixed(3)}%`;
  const rows = [
    [w.raw, 0, "b-raw"],
    [w.removed, w.kept, "b-gone"],
    [w.kept, 0, "b-kept"],
    [w.inPassagesUnique, 0, "b-kept"],
    [w.notInPassages, w.inPassagesUnique, "b-gone"],
    [w.pastCap, w.inPassagesUnique + w.notInPassages, "b-cap"],
  ];
  const aria = [
    `Where the text goes: ${fmtEn(w.raw)} characters in the raw HTML, ${fmtEn(w.removed)} removed, ${fmtEn(w.kept)} kept, ${fmtEn(w.inPassagesUnique)} unique in passages, ${fmtEn(w.notInPassages)} in no passage, ${fmtEn(w.pastCap)} past the cap.`,
    `Куди дівається текст: ${fmtUk(w.raw)} символів у сирому HTML, ${fmtUk(w.removed)} видалено, ${fmtUk(w.kept)} збережено, ${fmtUk(w.inPassagesUnique)} унікально в уривках, ${fmtUk(w.notInPassages)} поза уривками, ${fmtUk(w.pastCap)} за лімітом.`,
    `Dokąd trafia tekst: ${fmtPl(w.raw)} znaków w surowym HTML, ${fmtPl(w.removed)} usunięto, ${fmtPl(w.kept)} zachowano, ${fmtPl(w.inPassagesUnique)} unikalnych we fragmentach, ${fmtPl(w.notInPassages)} poza fragmentami, ${fmtPl(w.pastCap)} poza limitem.`,
  ];
  const s = [`<svg class="wf" id="waterfall" width="100%" height="${rows.length * R}" role="img" ${attrPair("aria-label", aria[0], aria[1], aria[2])}>`];
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="22" y2="${2 * R + 38}"/>`);
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="${3 * R + 22}" y2="${5 * R + 38}"/>`);
  rows.forEach(([v, start, cls], i) => {
    const t = i * R;
    const [en, uk, pl] = UI.wf[i];
    s.push(`<g><title>${esc(en)}: ${fmtEn(v)} / ${esc(uk)}: ${fmtUk(v)} / ${esc(pl)}: ${fmtPl(v)}</title>`);
    s.push(stx(0, t + 15, [en, uk, pl], "lab"));
    s.push(stx("100%", t + 15, [fmtEn(v), fmtUk(v), fmtPl(v)], "val", ' text-anchor="end"'));
    s.push(`<rect class="track" x="0" y="${t + 22}" width="100%" height="16" rx="4"/>`);
    // A zero stage is a line at its position, never an empty space.
    if (v > 0) s.push(`<rect class="${cls}" x="${x(start)}" y="${t + 22}" width="${x(v)}" height="16" rx="4"/>`);
    else s.push(`<rect class="${cls}" x="${x(start)}" y="${t + 20}" width="2" height="20" transform="translate(-2,0)"/>`);
    s.push("</g>");
  });
  s.push("</svg>");
  return `<section class="panel" id="lc-text" aria-labelledby="h-lc-text">${head("h-lc-text", UI.text, unit)}${s.join("")}</section>`;
}

function favImg(vendor) {
  const src = FAVICONS[vendor];
  return src ? `<img class="fav" src="${src}" alt="" width="16" height="16" onerror="this.style.visibility='hidden'">` : `<span class="fav" aria-hidden="true"></span>`;
}

function botsBlock(model) {
  const r = model.reading.robots;
  const unit = call(UI.path, model.robotsPath);
  let note = "";
  if (r.status === "none") note = `<p class="capnote">${P(UI.robotsNone)}</p>`;
  if (r.status === "unreachable") note = `<p class="capnote bad">${P(UI.robotsUnreachable)}</p>`;
  if (r.status === "not_checked") return `<section class="panel wide" id="lc-bots" aria-labelledby="h-lc-bots">${head("h-lc-bots", UI.bots, unit)}<p class="capnote">${P(UI.robotsNotChecked)}</p></section>`;
  const items = model.bots
    .map((b) => `<li class="${b.allowed ? "ok" : "no"}" id="bot-${esc(b.token.toLowerCase())}">${favImg(b.vendor)}<span class="bn">${esc(b.token)}</span>${b.allowed ? mkI("pass", UI.allowed) : mkI("fail", UI.blocked)}<span class="bp">${esc(b.vendor)} · ${P(UI.kind[b.kind])}</span></li>`)
    .join("");
  const llmsNote = `<p class="capnote" id="llms-note">${P(UI.llmsNote)} ${ext(UI.llmsNoteSource[2], `${esc(UI.llmsNoteSource[0])} ↗`)}</p>`;
  return `<section class="panel wide" id="lc-bots" aria-labelledby="h-lc-bots">${head("h-lc-bots", UI.bots, unit)}<ul class="bots">${items}</ul>${note}${llmsNote}</section>`;
}

function classicBlock(model) {
  const cl = model.checklist;
  const n = (st) => cl.filter((c) => c.state === st).length;
  const sum = ["pass", "fail", "warn", "na", "none"]
    .filter((st) => n(st))
    .map((st) => `<li><span class="mk ${st}"><i aria-hidden="true">${MARK[st].i}</i></span><b>${P(call(UI.sum[st], n(st)))}</b></li>`)
    .join("");
  const cells = cl
    .map((c) => `<li class="${c.state}" id="cg-${c.id}" tabindex="0" ${attrPair("aria-label", `${c.name[0]}: ${MARK[c.state].t[0]}`, `${c.name[1]}: ${MARK[c.state].t[1]}`, `${c.name[2]}: ${MARK[c.state].t[2]}`)}><span class="mk ${c.state}" aria-hidden="true"><i>${MARK[c.state].i}</i></span><span class="cs" aria-hidden="true">${P(c.short)}</span><span class="tip" aria-hidden="true">${P(c.name)} · ${P(MARK[c.state].t)}</span></li>`)
    .join("");
  const notes = model.caps.filter((c) => ["links", "links_unverified", "sitemap", "saved"].includes(c.id)).map((c) => `<li>${P(c.t)}</li>`).join("");
  return `<section class="panel" id="lc-classic" aria-labelledby="h-lc-classic">${head("h-lc-classic", UI.classic, call(UI.checksUnit, cl.length))}<ul class="cg-sum">${sum}</ul><ul class="cg" id="classic-grid">${cells}</ul>${notes ? `<ul class="caps" ${attrPair("aria-label", UI.caps[0], UI.caps[1], UI.caps[2])}>${notes}</ul>` : ""}</section>`;
}

function languagesBlock(model) {
  const L = model.languages;
  if (!L) return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs)}<p class="capnote">${P(UI.langOne)}</p></section>`;
  const markKey = `<ul class="mkey" aria-hidden="true">${["pass", "fail", "warn", "na"].map((s) => `<li><span class="mk ${s}"><i>${MARK[s].i}</i></span>${P(MARK[s].t)}</li>`).join("")}</ul>`;
  const rows = L.rows
    .map((row) => {
      const name = `${esc(row.hreflang)}${row.self ? ` <span class="self">${P(UI.thisPage)}</span>` : ""}${row.refused ? ` <span class="self">${P(UI.langRefused)}</span>` : ""}`;
      return `<tr><td>${name}</td>${row.cells.map((st, i) => `<td>${mkI(st, [`${UI.langCols[i][0]}: ${MARK[st].t[0]}`, `${UI.langCols[i][1]}: ${MARK[st].t[1]}`, `${UI.langCols[i][2]}: ${MARK[st].t[2]}`])}</td>`).join("")}</tr>`;
    })
    .join("");
  const unit = [`${call(UI.versionsUnit, L.rows.length)[0]} · x-default ${L.xDefault ? "✓" : "✕"}`, `${call(UI.versionsUnit, L.rows.length)[1]} · x-default ${L.xDefault ? "✓" : "✕"}`, `${UI.versionsUnit[2](L.rows.length)} · x-default ${L.xDefault ? "✓" : "✕"}`];
  const unread = L.unread ? `<p class="capnote">${P(call(UI.langUnread, L.unread, L.cap))}</p>` : "";
  return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs, unit)}<div class="tablewrap"><table class="lgrid"><thead><tr><th>${P(UI.langCol)}</th>${UI.langCols.map((c) => `<th>${P(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>${markKey}${unread}</section>`;
}

/** The shared Vectorscope block, with this report's own layer badges and the passage map's anchors. */
function generatedBlock(model) {
  const j = model.generated.judgement;
  const by = j ? [j.model ? esc(j.model) : null, j.agent ? esc(j.agent) : null].filter(Boolean).join(" · ") || null : null;
  return renderGeneratedHtml(model.generated, { tag: (layers) => `<span class="gx-lyrs">${layers.map((l) => `<span class="lyr ${l} gx-lyr">${P(LAYER[l])}</span>`).join("")}</span>`, by });
}

function cannotBlock(model) {
  const j = model.judgement;
  const note = j.any ? `<p class="honest" id="one-model">${P([UI.oneModel[0](j.model || UI.modelNotStated[0]), UI.oneModel[1](j.model || UI.modelNotStated[1]), UI.oneModel[2](j.model || UI.modelNotStated[2])])}</p>` : "";
  const items = CANNOT.map((c) => `<li>${EYE_OFF}<span class="cl-t">${P(c.t)}</span><span>${c.links.map(([en, uk, href, pl]) => ext(href, `${pair(esc(en), esc(uk), esc(pl))} ↗`)).join(" · ")}</span></li>`).join("");
  return `<section class="panel" id="cannot-see" aria-labelledby="h-cannot">${head("h-cannot", UI.cannot)}${note}<ul class="cannot-lite">${items}</ul></section>`;
}

// ── the page frame ───────────────────────────────────────────────────────────

// Language, theme, the selected place, opening a closed <details> a link points into, and copy.
// Without it the page still reads: the first place stays selected and every detail is in
// "All checks and technical details".
const JS = `
(function(){
  var root=document.documentElement,TK="ai-search-audit-theme",LK="ai-search-audit-lang";
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function effective(){return root.getAttribute("data-theme")==="dark"?"dark":"light"}
  function paint(){var t=effective(),l=root.getAttribute("data-lang")||"en",b=document.querySelectorAll("[data-set-theme]"),c=document.querySelectorAll("[data-set-lang]"),i;for(i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t));for(i=0;i<c.length;i++)c[i].setAttribute("aria-pressed",String(c[i].getAttribute("data-set-lang")===l))}
  function applyLang(l){root.setAttribute("data-lang",l);root.setAttribute("lang",l);var els=document.querySelectorAll("[data-i18n]"),pre="data-"+l+"-";for(var i=0;i<els.length;i++){var el=els[i],set=[];for(var j=0;j<el.attributes.length;j++){var a=el.attributes[j];if(a.name.indexOf(pre)===0)set.push([a.name.slice(pre.length),a.value])}for(var k=0;k<set.length;k++)el.setAttribute(set[k][0],set[k][1])}}
  var h=location.hash,hl=/(?:^#|&)lang=(en|uk|pl)/.exec(h),ht=/(?:^#|&)theme=(dark|light)/.exec(h);
  var t0=ht?ht[1]:get(TK);if(t0==="light"||t0==="dark")root.setAttribute("data-theme",t0);
  var l0=get(LK);applyLang(hl?hl[1]:l0==="uk"||l0==="pl"?l0:"en");paint();
  var b=document.querySelectorAll("[data-set-theme]");
  for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);put(TK,t);paint()});
  var c=document.querySelectorAll("[data-set-lang]");
  for(var j=0;j<c.length;j++)c[j].addEventListener("click",function(){var l=this.getAttribute("data-set-lang");applyLang(l);put(LK,l);paint()});
  function openTo(n){while(n&&n!==document){if(n.tagName&&String(n.tagName).toUpperCase()==="DETAILS")n.open=true;n=n.parentNode}}
  function select(id){var r=document.querySelectorAll(".pr[data-place]"),i;for(i=0;i<r.length;i++){var on=r[i].getAttribute("data-place")===id;r[i].setAttribute("aria-pressed",String(on));r[i].parentNode.className=r[i].parentNode.className.replace(/ sel\\b/g,"")+(on?" sel":"")}var d=document.querySelectorAll(".pd"),k;for(k=0;k<d.length;k++)d[k].hidden=d[k].id!=="pd-"+id}
  var rows=document.querySelectorAll(".pr[data-place]");
  for(var p=0;p<rows.length;p++)rows[p].addEventListener("click",function(){select(this.getAttribute("data-place"))});
  function isA(n){return n&&n.tagName&&String(n.tagName).toUpperCase()==="A"}
  document.addEventListener("click",function(e){var a=e.target;while(a&&a!==document&&!isA(a))a=a.parentNode;if(!a||a===document)return;var href=a.getAttribute("href");if(!href||href.charAt(0)!=="#"||href.length<2)return;var t=document.getElementById(href.slice(1));if(!t)return;e.preventDefault();var pl=a.getAttribute("data-place");if(pl)select(pl);openTo(t);try{t.scrollIntoView({block:"center"})}catch(x){}t.classList.add("hit");setTimeout(function(){t.classList.remove("hit")},1600)});
  var live=document.getElementById("copy-live");
  function said(btn,ok){var l=root.getAttribute("data-lang")||"en",m=btn.getAttribute("data-"+l+"-done")||"";btn.classList.add(ok?"done":"sel-text");if(live)live.textContent=ok?m:"";setTimeout(function(){btn.classList.remove("done","sel-text")},1600)}
  var cp=document.querySelectorAll("[data-copy]");
  for(var q=0;q<cp.length;q++)cp[q].addEventListener("click",function(){var btn=this,code=btn.parentNode.querySelector("code"),txt=code?code.textContent:"";function pick(){try{var r=document.createRange();r.selectNodeContents(code);var s=window.getSelection();s.removeAllRanges();s.addRange(r)}catch(x){}said(btn,false)}try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){said(btn,true)},pick);else pick()}catch(x){pick()}});
  if(h&&h.indexOf("=")<0&&h.length>1){var at=document.getElementById(h.slice(1));if(at)openTo(at)}
})();
`;

const brandMark = (cls) => `<span class="brand ${cls}"><span class="gll-glitch" aria-hidden="true"><img class="gll-mark gll-on-light" src="${GLL_MARK_LIGHT}" alt="" width="56" height="30"><img class="gll-mark gll-on-dark" src="${GLL_MARK}" alt="" width="56" height="30"></span><span class="gll-word">Get<span class="gll-loop">Loop</span>Loop</span></span>`;

function documentStart(title) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="referrer" content="no-referrer">',
    // No network from this file: the styles and the one script are inline, images are data: URIs.
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">`,
    `<title>${esc(title)}</title>`,
    `<style>${CSS}${CSS_EXTRA}${GENERATED_CSS}${CSS_FULL}</style>`,
    "</head>",
    "<body>",
    '<main class="wrap" id="report">',
    '<div class="top">',
    `<div class="top-l">${brandMark("brand--top")}<span class="divider" aria-hidden="true"></span><span class="product">${esc(LITE.product)}</span></div>`,
    '<div class="deco deco--top" aria-hidden="true"></div>',
    '<div class="toggles">',
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.langGroup[0], UI.langGroup[1], UI.langGroup[2])}><button type="button" id="lang-en" data-set-lang="en" aria-pressed="true">EN</button><button type="button" id="lang-uk" data-set-lang="uk" aria-pressed="false" lang="uk">UK</button><button type="button" id="lang-pl" data-set-lang="pl" aria-pressed="false" lang="pl">PL</button></div>`,
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.themeGroup[0], UI.themeGroup[1], UI.themeGroup[2])}><button type="button" id="theme-dark" data-set-theme="dark" aria-pressed="false">${P(UI.dark)}</button><button type="button" id="theme-light" data-set-theme="light" aria-pressed="true">${P(UI.light)}</button></div>`,
    "</div></div>",
  ];
}

function documentEnd(madeKey = "footer") {
  const links = LINKS.map(([id, name, href, k]) => `<li><a id="foot-${id}" href="${href}" rel="noopener noreferrer" target="_blank">${ICONS[id]}<span>${name}${k ? ` · ${P(k)}` : ""}</span></a></li>`).join("");
  return [
    `<footer class="foot"><div class="foot-brand">${brandMark("brand--foot")}<span class="divider" aria-hidden="true"></span><span class="tagline">${P(LITE.tagline)}</span></div>`,
    `<ul class="links">${links}</ul>`,
    `<div class="foot-made"><img class="motanka" src="${MOTANKA}" alt="" width="30" height="39"><p>${P(UI[madeKey])}</p></div></footer>`,
    '<div class="corner corner--br" aria-hidden="true"></div>',
    "</main>",
    `<script>${JS};
${LOGO_GLITCH_JS}</script>`,
    "</body>",
    "</html>",
  ];
}

function pageId(url, title) {
  const href = safeHref(url);
  const link = href ? `<a class="url mono" id="audited-url" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(url)}</a>` : `<span class="url mono">${esc(url)}</span>`;
  return `<div class="pageid">${link}${title ? `<span class="pt">${esc(clip(title, 140))}</span>` : ""}</div>`;
}

/** The report for an audited page: the summary first, every technical detail in one closed section. */
export function renderReport(model) {
  const r = model.reading;
  const o = documentStart(`${TOOL_NAME} ${EDITION}: ${r.fetch.finalUrl}`);
  o.push(heroBlock(model));
  if (model.site) o.push(siteNav(model.site));
  o.push(cardsBlock(model));
  o.push(firstBlock(model));
  if (model.answers) o.push(answersBlock(model));
  o.push(placesBlock(model));
  o.push(compareBlock(model));
  o.push(historyBlock(model));
  o.push(allChecksBlock(model));
  // How generated the text sounds: at the bottom of the page, the same block as Vectorscope's.
  if (model.generated) o.push(generatedBlock(model));
  o.push(infoStrip());
  // The whole history, compactly, so a later run in a new chat can take it back from this file.
  if (model.historyPack) o.push(packScript(model.historyPack));
  o.push(...documentEnd());
  return o.join("\n") + "\n";
}



// ── Full: the plain description and the rule, one click away from a finding ──

/** The plain description and "What the rule says" for one finding (no fix direction: that stays in the details for specialists). */
/** A summary section heading, as the page's own summary sections draw theirs. */
const sumHead = (id, t, sub) => `<div class="sum-head"><h2 id="${id}">${P(t)}</h2>${sub ? `<span class="sub">${P(sub)}</span>` : ""}</div>`;
const whyBody = (f) => `<div class="why-b"><p class="why-d">${P(explain(f.code).d)}</p>${ruleLine(f)}</div>`;
/** A closed "What it means" under a finding, holding whyBody. */
const whyDetails = (f, id) => `<details class="why" id="${id}"><summary class="why-s">${P(UI.whyOpen)}${CHEV}</summary>${whyBody(f)}</details>`;

// ── the Full layers: descriptions, rules, details for specialists ───────────

const ex = (f) => explain(f.code);

/** "What the rule says": a verified quote with its source and the date it was checked, or this skill's rule. */
function ruleText(f) {
  const r = ex(f).r;
  if (r.kind === "quote") {
    const s = source(r.src);
    const d = dateLong(r.checked);
    return `<q class="rq" lang="en">${esc(r.quote)}</q> <span class="rsrc">${ext(s.url, `${esc(s.name)} ↗`)} <span class="rchk">· ${P([UI.ruleChecked[0](d[0]), UI.ruleChecked[1](d[1]), UI.ruleChecked[2](d[2])])}</span></span>`;
  }
  const link = r.fullOnly ? "" : ` <span class="rsrc">${ext(source("skill").url, `${P(UI.skillThresholds)} ↗`)}</span>`;
  return `<span class="rskill">${P(UI.skillRule)}</span> ${P(r.text)}${link}`;
}
const ruleLine = (f) => `<p class="rule"><span class="lbl">${P(UI.ruleSays)}</span> ${ruleText(f)}</p>`;

/** Where a problem is, in plain words: the map's zones or strip rows, else the whole page or the model's answers. */
function plainWhere(f, model) {
  if (f.zones.length) {
    const names = f.zones.map((id) => model.zones.find((z) => z.id === id)).filter(Boolean).map(zoneLabel);
    const shown = names.slice(0, 2);
    const more = names.length - shown.length;
    return [`${shown.map((t) => t[0]).join(", ")}${more ? ` +${more}` : ""}`, `${shown.map((t) => t[1]).join(", ")}${more ? ` +${more}` : ""}`, `${shown.map((t) => t[2]).join(", ")}${more ? ` +${more}` : ""}`];
  }
  if (f.strip) {
    const rows = (f.strip.side === "head" ? model.head : model.robots).filter((r) => f.strip.rows.includes(r.id));
    const keys = rows.map((r) => (Array.isArray(r.k) ? r.k : [r.k, r.k, r.k]));
    const pre = f.strip.side === "head" ? UI.inHead : UI.inRobots;
    return [`${pre[0]}: ${keys.map((k) => k[0]).join(", ")}`, `${pre[1]}: ${keys.map((k) => k[1]).join(", ")}`, `${pre[2]}: ${keys.map((k) => k[2]).join(", ")}`];
  }
  return f.layer === "judgement" ? UI.inAnswers : UI.wholePage;
}
const mapChip = (f) => (f.mapped ? ` <a class="chip mapchip" href="#page-map">${P(call(UI.mapN, f.pin))}</a>` : "");
const ownerChip = (o) => `<span class="chip"><span class="chip-k">${P(UI.concerns)}</span>${OWNER_ICON[o]}${P(OWNERS[o])}</span>`;
const layerBadge = (f) => (f.layer === "judgement" ? judgeBadge(f) : `<span class="lyr ${f.layer}">${P(LAYER[f.layer])}</span>`);

/** The evidence as short "key: value" lines, every value escaped and clipped. */
function evidenceText(ev) {
  const parts = [];
  const val = (v) => {
    if (v === null || v === undefined) return "—";
    if (Array.isArray(v)) {
      const shown = v.slice(0, 4).map((x) => (x && typeof x === "object" ? JSON.stringify(x) : String(x)));
      return `${shown.join(" · ")}${v.length > 4 ? ` · +${v.length - 4}` : ""}`;
    }
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  for (const [k, v] of Object.entries(ev || {})) {
    if (k === "note") continue;
    parts.push(`${k}: ${clip(val(v), 220)}`);
  }
  return clip(parts.join("  ·  "), 900) || "—";
}

/** The collapsed details for specialists: code, layer, the technical place, the evidence, every rule source, and the fix direction. */
function specDetails(f, id) {
  const e = ex(f);
  const srcs = f.rules.map((s) => ext(s.url, `${esc(s.name)} ↗`)).join("<br>");
  return [
    `<details class="spec" id="${id}"><summary>${P(UI.forSpecialists)}</summary><div class="spec-body">`,
    `<div class="fmeta"><span class="code">${esc(f.code)}</span>${layerBadge(f)}</div>`,
    `<dl class="fdl"><dt>${P(UI.whereTech)}</dt><dd class="mono">${esc(f.where || "—")}</dd><dt>${P(UI.evidence)}</dt><dd><span class="evq">${esc(evidenceText(f.evidence))}</span></dd><dt>${P(UI.ruleSources)}</dt><dd class="srcs">${srcs}</dd></dl>`,
    `<p class="fixdir"><span class="k">${P(UI.fixDir)}</span><code>${P(e.x)}</code></p>`,
    "</div></details>",
  ].join("");
}

const OWNER_ORDER = ["dev", "content", "seo"];

/** Every problem, grouped by who it concerns, most serious first; each with its description, place, rule and details. */
function allProblemsBlock(model) {
  const o = [`<section class="panel" id="all-problems" aria-labelledby="h-all">${head("h-all", UI.allProblems, UI.byOwner)}`];
  if (!model.findings.length) {
    o.push(`<p class="none-found">${P(UI.noProblems)}</p></section>`);
    return o.join("\n");
  }
  const groups = OWNER_ORDER.map((ow) => [ow, model.findings.filter((f) => f.owner === ow)]).filter(([, items]) => items.length);
  o.push(`<ul class="owners-nav">${groups.map(([ow, items]) => `<li><a href="#for-${ow}">${OWNER_ICON[ow]}${P(UI.forOwner[ow])} <span class="cnt">${items.length}</span></a></li>`).join("")}</ul>`);
  for (const [ow, items] of groups) {
    o.push(`<section class="owner" id="for-${ow}" aria-labelledby="h-for-${ow}"><h3 id="h-for-${ow}">${OWNER_ICON[ow]}${P(UI.forOwner[ow])} <span class="cnt">${P(nProblems(items.length))}</span></h3><ul class="plist">`);
    for (const f of items) {
      const e = ex(f);
      const tag = f.big ? `<span class="chip bigtag">${P(call(UI.bigTag, f.pin))}</span>` : "";
      o.push(
        `<li id="pin-${esc(f.id)}" class="${f.severity}"><span class="sev ${f.severity}">${P(SEV[f.severity])}</span><div class="prow-main"><span class="prow-t">${pinIcon(f.severity, f.pin, 22)}<span>${P(f.label)}</span>${tag}</span>${f.layer === "judgement" ? judgeBadge(f) : ""}<p class="prow-w">${P(e.d)}</p><p class="prow-p"><span class="lbl">${P(UI.where)}</span>${P(plainWhere(f, model))}${mapChip(f)}</p>${ruleLine(f)}${specDetails(f, `spec-${esc(f.id)}`)}</div></li>`,
      );
    }
    o.push("</ul></section>");
  }
  o.push("</section>");
  return o.join("\n");
}

/** Before and after: the findings of an older export of this page, fixed, new and unchanged. */
function compareBlock(model) {
  const c = model.compare;
  if (!c) return "";
  const d = dateLong(c.before.createdAt);
  const o = [`<section class="sum" id="compare" aria-labelledby="h-compare">${sumHead("h-compare", UI.compare, [UI.since[0](d[0]), UI.since[1](d[1]), UI.since[2](d[2])])}`];
  if (!c.sameUrl) o.push(`<p class="capnote bad">${P(call(UI.compareOtherUrl, c.before.url || "—"))}</p>`);
  o.push(`<ul class="cmp-n">${[["fixed", "good"], ["new", "bad"], ["unchanged", "same"]].map(([k, cls]) => `<li class="${cls}"><b>${c.counts[k]}</b>${P(UI.cmp[k])}</li>`).join("")}</ul>`);
  const item = (f) => `<li class="${esc(f.severity)}">${pinIcon(f.severity, null, 18)}<span>${f.label ? P([f.label.en || f.code, f.label.uk || f.code, f.label.pl || f.label.en || f.code]) : esc(f.code)}</span> <span class="code">${esc(f.code)}</span></li>`;
  if (c.fixed.length) o.push(`<h3 class="subhead">${P(UI.cmp.fixed)}</h3><ul class="cmp-list fixed">${c.fixed.map(item).join("")}</ul>`);
  if (c.new.length) o.push(`<h3 class="subhead">${P(UI.cmp.new)}</h3><ul class="cmp-list new">${c.new.map(item).join("")}</ul>`);
  if (c.unchanged.length) o.push(`<details class="cmp-more"><summary>${P(call(UI.cmpUnchanged, c.unchanged.length))}</summary><ul class="cmp-list">${c.unchanged.map(item).join("")}</ul></details>`);
  o.push(`<p class="capnote">${P(UI.compareHow)}</p></section>`);
  return o.join("\n");
}

const DRIFT_FIELD = {
  title: ["Title", "Title", "Title"],
  description: ["Meta description", "Meta description", "Meta description"],
  canonical: ["Canonical", "Canonical", "Canonical"],
  h1: ["h1", "h1", "h1"],
  wordCount: ["Word count", "Кількість слів", "Liczba słów"],
  schemaTypes: ["Schema types", "Типи схеми", "Typy schematu"],
  robotsStatus: ["robots.txt", "robots.txt", "robots.txt"],
  source: ["Read from", "Джерело", "Źródło odczytu"],
};
const showVal = (v) => (v === null || v === undefined || (Array.isArray(v) && !v.length) ? "—" : Array.isArray(v) ? v.join(" · ") : String(v));

/** The timeline (finding counts per run) and what changed since the run before. */
/**
 * Every page the history holds, any site, one row per address (2.110): runs, first and last, the
 * last run's problems and the totals run by run. Shown when the history knows more than this page.
 */
function allAuditsBlock(model) {
  const ix = model.historyIndex;
  if (!ix || ix.pages.length < 2) return ix?.dropped ? `<p class="capnote">${P(call(UI.historyDropped, ix.dropped))}</p>` : "";
  const day = (iso) => {
    const d = dateLong(iso);
    return P([d[0], d[1], d[2]]);
  };
  const trend = (t) => {
    const max = Math.max(1, ...t.filter((v) => v !== null));
    return `<span class="hx-trend" aria-hidden="true">${t.map((v) => (v === null ? '<i class="ref"></i>' : `<i style="height:${Math.max(8, Math.round((v / max) * 100))}%"></i>`)).join("")}</span>`;
  };
  const rows = ix.pages.map((p) => {
    const href = safeHref(p.url);
    const label = esc(p.url.replace(/^https?:\/\//, ""));
    const link = href ? `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${label}</a>` : label;
    const now = p.refused ? P(UI.refusedShort) : p.lastCounts ? `<b>${p.lastCounts.total}</b> <span class="small">${SEVERITIES.filter((s) => p.lastCounts[s]).map((s) => `${pinIcon(s, p.lastCounts[s], 20)}`).join("")}</span>` : "—";
    return `<tr${p.current ? ' class="hx-now"' : ""}><td class="hx-url">${link}${p.current ? ` <span class="chip">${P(UI.thisPage)}</span>` : ""}</td><td class="mono">${p.runs}</td><td>${day(p.first)}</td><td>${day(p.last)}</td><td>${now}</td><td>${trend(p.trend)}</td></tr>`;
  });
  return [
    `<h3 class="subhead" id="all-audits">${P(UI.allAudits)} <span class="unit">${P(call(UI.allAuditsUnit, { runs: ix.runs, pages: ix.pages.length, sites: ix.sites }))}</span></h3>`,
    `<p class="small">${P(UI.allAuditsLead)}</p>`,
    `<div class="tablewrap"><table class="hx"><thead><tr><th>${P(UI.colPage)}</th><th>${P(UI.colRuns)}</th><th>${P(UI.colFirst)}</th><th>${P(UI.colLast)}</th><th>${P(UI.colNow)}</th><th>${P(UI.colTrend)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`,
    ix.dropped ? `<p class="capnote">${P(call(UI.historyDropped, ix.dropped))}</p>` : "",
  ].join("");
}

function historyBlock(model) {
  const h = model.history;
  if (!h) return "";
  const o = [`<section class="sum" id="history" aria-labelledby="h-history">${sumHead("h-history", UI.history, call(UI.runsUnit, h.total))}`];
  const max = Math.max(1, ...h.runs.map((r) => r.total || 0));
  o.push(`<ol class="tl" id="timeline">`);
  for (const r of h.runs) {
    const d = dateLong(r.createdAt);
    const t = new Date(r.createdAt);
    const hm = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    const bar = r.refused
      ? `<span class="tl-ref">${esc(r.refused)}</span>`
      : `<span class="tl-bar" style="width:${(((r.total || 0) / max) * 100).toFixed(1)}%">${SEVERITIES.map((s) => (r[s] ? `<span class="tl-s ${s}" style="flex:${r[s]}" ${attrPair("title", `${SEV[s][0]}: ${r[s]}`, `${SEV[s][1]}: ${r[s]}`, `${SEV[s][2]}: ${r[s]}`)}></span>` : "")).join("")}</span>`;
    const tags = `${r.current ? `<span class="chip tl-now">${P(UI.thisRun)}</span>` : ""}${r.saved ? `<span class="chip">${P(UI.savedCopy)}</span>` : ""}`;
    o.push(`<li class="${r.current ? "now" : ""}"><span class="tl-d mono">${P([`${d[0]} ${hm}`, `${d[1]} ${hm}`, `${d[2]} ${hm}`])}</span><span class="tl-track">${bar}</span><span class="tl-n mono">${r.refused ? "—" : r.total}</span><span class="tl-pins">${r.refused ? "" : SEVERITIES.filter((s) => r[s]).map((s) => `<span class="tl-p" ${attrPair("title", SEV[s][0], SEV[s][1], SEV[s][2])}>${pinIcon(s, r[s], 26)}<span class="vh">${P(SEV[s])}</span></span>`).join("")}</span>${tags}</li>`);
  }
  o.push("</ol>");
  if (h.older) o.push(`<p class="capnote">${P(call(UI.olderRuns, h.older))}</p>`);
  if (h.later) o.push(`<p class="capnote">${P(UI.laterRuns)}</p>`);
  o.push(`<h3 class="subhead">${P(UI.drift)}</h3>`);
  const dr = h.drift;
  if (!dr) o.push(`<p class="capnote">${P(UI.firstRun)}</p>`);
  else {
    const since = dateLong(dr.since);
    o.push(`<p class="small">${P([UI.driftSince[0](since[0]), UI.driftSince[1](since[1]), UI.driftSince[2](since[2])])}</p>`);
    if (!dr.comparable) o.push(`<p class="capnote">${P(call(UI.notComparable, dr.notCompared.join(", ")))}</p>`);
    const rows = [];
    const srcVal = (v) => P(v === "saved copy" ? UI.savedCopy : v === "live" ? UI.liveRead : [String(v), String(v), String(v)]);
    for (const c of dr.fields) rows.push(c.field === "source" ? `<tr><th scope="row">${P(DRIFT_FIELD.source)}</th><td class="was">${srcVal(c.before)}</td><td class="now">${srcVal(c.after)}</td></tr>` : `<tr><th scope="row">${P(DRIFT_FIELD[c.field] || [c.field, c.field, c.field])}</th><td class="was">${esc(clip(showVal(c.before), 160))}</td><td class="now">${esc(clip(showVal(c.after), 160))}</td></tr>`);
    for (const b of dr.bots) rows.push(`<tr><th scope="row">${esc(b.token)}</th><td class="was">${P(b.before === null ? ["—", "—", "—"] : b.before ? UI.allowed : UI.blocked)}</td><td class="now">${P(b.after === null ? ["—", "—", "—"] : b.after ? UI.allowed : UI.blocked)}</td></tr>`);
    for (const l of dr.hreflang.added) rows.push(`<tr><th scope="row">hreflang</th><td class="was">—</td><td class="now">${esc(l)}</td></tr>`);
    for (const l of dr.hreflang.removed) rows.push(`<tr><th scope="row">hreflang</th><td class="was">${esc(l)}</td><td class="now">—</td></tr>`);
    if (rows.length) o.push(`<div class="tablewrap"><table class="drift"><thead><tr><th>${P(UI.driftWhat)}</th><th>${P(UI.driftBefore)}</th><th>${P(UI.driftNow)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`);
    const p = dr.passages;
    if (p) {
      o.push(`<ul class="cmp-n"><li class="good"><b>+${p.added}</b>${P(UI.passNew)}</li><li class="bad"><b>−${p.lost}</b>${P(UI.passLost)}</li><li class="same"><b>${p.unchanged}</b>${P(UI.passSame)}</li></ul>`);
      const pi = (x, k) => `<li><span class="pl-k">${P(k)}</span> <span class="mono">#${x.index}</span> ${x.heading ? `<b>${esc(clip(x.heading, 80))}</b> · ` : ""}<span class="small">${esc(x.head)}…</span></li>`;
      const changedIdx = new Set((p.changedItems || []).map((c) => c.index));
      const ci = (c) => `<li><span class="pl-k">${P(UI.passChanged)}</span> <span class="mono">#${c.index}</span> ${c.heading ? `<b>${esc(clip(c.heading, 80))}</b> · ` : ""}<span class="pl-was">${esc(c.before)}</span> <span aria-hidden="true">→</span> <span class="pl-now">${esc(c.after)}</span></li>`;
      if (p.changedItems?.length) o.push(`<ul class="pass-list changed">${p.changedItems.map(ci).join("")}</ul>`);
      const onlyNew = p.addedItems.filter((x) => !changedIdx.has(x.index));
      const onlyLost = p.lostItems.filter((x) => !changedIdx.has(x.index));
      if (onlyNew.length) o.push(`<ul class="pass-list new">${onlyNew.map((x) => pi(x, UI.passNewOne)).join("")}</ul>`);
      if (onlyLost.length) o.push(`<ul class="pass-list lost">${onlyLost.map((x) => pi(x, UI.passLostOne)).join("")}</ul>`);
      if (p.added > p.addedItems.length || p.lost > p.lostItems.length) o.push(`<p class="capnote">${P(call(UI.passCap, p.listCap))}</p>`);
    }
    if (!rows.length && (!p || (!p.added && !p.lost))) o.push(`<p class="capnote">${P(UI.noDrift)}</p>`);
    const fc = dr.findings.counts;
    o.push(`<p class="small">${P(call(UI.driftFindings, fc.fixed, fc.new, fc.unchanged))}</p>`);
  }
  o.push(allAuditsBlock(model));
  o.push(`<p class="capnote">${P(call(UI.historyWhere, h.folder))}</p></section>`);
  return o.join("\n");
}

/** The other pages of a site audit, and the site report. */
function siteNav(site) {
  const pages = site.pages.map((p, i) => {
    const label = `${i + 1} · ${p.path}`;
    const n = p.ok ? P(nProblems(p.total)) : esc(p.reasonCode);
    return p.slug === site.current
      ? `<li aria-current="page" class="cur"><span class="mono">${esc(label)}</span><span class="pn">${n}</span></li>`
      : `<li><a class="mono" href="${esc(p.slug)}.html">${esc(label)}</a><span class="pn">${n}</span></li>`;
  });
  return `<nav class="sitenav" id="site-pages" ${attrPair("aria-label", UI.sitePages[0], UI.sitePages[1], UI.sitePages[2])}><a class="site-home" href="../index.html">${P(UI.siteReportLink)}</a><span class="sub">${P(call(UI.evaluatedOf, site.evaluated, site.total))}${site.leftOut ? ` · ${P(call(UI.leftOutN, site.leftOut))}` : ""}</span><ol>${pages.join("")}</ol></nav>`;
}

/** How this was checked: the layers, the one model, the fix directions, the history. */
function howBlock(model) {
  const items = UI.how.map((t) => `<li>${P(typeof t[0] === "function" ? [t[0](model.judgement.model || UI.modelNotStated[0]), t[1](model.judgement.model || UI.modelNotStated[1]), t[2](model.judgement.model || UI.modelNotStated[2])] : t)}</li>`);
  return `<details class="how" id="how-checked"><summary>${P(UI.howChecked)}</summary><ul>${items.join("")}</ul></details>`;
}

export const parts = { sumHead, CARD_ICON, worstState, LIST_ICON, CHEV, EXT_ICON, safeHref, P, pair, attrPair, esc, ext, call, clip, head, pinIcon, ownerChip, sevPill, ruleText, specDetails, documentStart, documentEnd, OWNER_ICON, OWNER_ORDER };


// ── the refusal: pages in Russian are not analysed ───────────────────────────

const bold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
function sourceLink(url) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return `<a class="src-link" href="${esc(url)}" rel="noopener noreferrer" target="_blank">${esc(host)} ↗</a>`;
}
/** The Vectorscope's approved refusal copy, with only the tool's name changed. */
export const refusalLead = (lang) => REFUSAL_COPY.lead[lang].replace("Vectorscope", TOOL_NAME);
function refusalBody(lang, code) {
  const out = [`<p class="lead">${esc(refusalLead(lang))}</p>`];
  const why = refusalReason(code, lang);
  if (why) out.push(`<p class="why">${esc(why)}</p>`);
  out.push("<ul>");
  for (const f of FINDINGS) {
    if (f.items) {
      out.push(`<li><b>${esc(f.source[lang])}</b><ul>`);
      for (const item of f.items) out.push(`<li>${bold(item.text[lang])} ${sourceLink(item.url)}</li>`);
      out.push("</ul></li>");
    } else out.push(`<li><b>${esc(f.source[lang])}</b>${esc(f.joiner[lang])}${bold(f.text[lang])} ${sourceLink(f.url)}</li>`);
  }
  out.push("</ul>");
  const lists = SANCTIONS_LINKS.map((l) => `<a href="${esc(l.url)}" rel="noopener noreferrer" target="_blank">${esc(l.name)}</a>`).join(" · ");
  out.push(`<p class="sanctions"><b>${esc(REFUSAL_COPY.sanctionsLabel[lang])}:</b> ${esc(REFUSAL_COPY.sanctions[lang])} ${lists}</p>`);
  return out.join("");
}

/** The report for a refused reading: the URL, the reason, the footer; nothing of the page. */
export function renderRefusal(reading, { site = null, note = null, historyPack = null } = {}) {
  const url = reading.page?.url || reading.fetch?.finalUrl || reading.requestedInput || "";
  const o = documentStart(`${TOOL_NAME} ${EDITION}: ${REFUSAL_COPY.title.en}`);
  o.push(`<header class="verdict lite-verdict" id="verdict">${pageId(url, "")}</header>`);
  if (site) o.push(siteNav(site));
  if (note) o.push(`<p class="lead site-stop">${P(note)}</p>`);
  if (isRefusalCode(reading.reasonCode)) {
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P([REFUSAL_COPY.title.en, REFUSAL_COPY.title.uk, REFUSAL_COPY.title.pl])}</h2></div><div class="lb-en">${refusalBody("en", reading.reasonCode)}</div><div class="lb-uk" lang="uk">${refusalBody("uk", reading.reasonCode)}</div><div class="lb-pl" lang="pl">${refusalBody("pl", reading.reasonCode)}</div></section>`);
  } else {
    const code = `${reading.reasonCode}${reading.status ? ` · HTTP ${reading.status}` : ""}`;
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P(["The page could not be audited", "Сторінку не вдалося перевірити", "Nie udało się sprawdzić strony"])}</h2></div><p class="lead mono">${esc(code)}</p></section>`);
  }
  if (historyPack) o.push(packScript(historyPack));
  o.push(...documentEnd("footerRefused"));
  return o.join("\n") + "\n";
}
