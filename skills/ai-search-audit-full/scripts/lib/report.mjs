// The audit as one self-contained HTML page, in the Full layout: the Lite picture (a verdict
// line, six status tiles, the page map drawn from the real document, the severity bars, where the
// text goes, the bots, the classic checklist, the language grid) with the Full layers on top of
// it: every problem with a plain description and "What the rule says" (a verified quote, or
// "This skill's rule"), all problems by who they concern, the fix direction only inside each
// problem's collapsed details for specialists, before and after (--compare), the page's history
// and drift, and the other pages of a site audit. The plain layer lists problems; it gives no advice.
//
// Every string that came from the audited page (titles, headings, URLs) goes through esc(); the
// CSP blocks every network request; the one inline script only switches language and theme. The
// theme is light unless #theme=dark or the toggle asks for dark: the system preference is not read.

import { esc, FOOTER_LINKS } from "../vendor/vectorscope/html.mjs";
import { FINDINGS, REFUSAL_COPY, SANCTIONS_LINKS } from "../vendor/vectorscope/refusal.mjs";
import { MOTANKA } from "../vendor/vectorscope/sprites.mjs";
import { CSS, CSS_EXTRA } from "./css.mjs";
import { CSS_FULL } from "./cssFull.mjs";
import { FAVICONS } from "./favicons.mjs";
import { CANNOT, LAYER, MARK, OWNERS, SEV, STATE, UI, ZONE_LABEL, dateOf, fmtEn, fmtUk, nMinor, nProblems, verdict } from "./copy.mjs";
import { SEVERITIES } from "./checks.mjs";
import { explain } from "./explain.mjs";
import { source } from "./rules.mjs";

export const TOOL_NAME = "AI Search Audit";
export const EDITION = "Full";

// ── small helpers ────────────────────────────────────────────────────────────

const pair = (en, uk) => `<span class="l-en">${en}</span><span class="l-uk" lang="uk">${uk}</span>`;
/** A [en, uk] pair of plain strings, escaped. */
const P = (t) => pair(esc(t[0]), esc(t[1]));
const attrPair = (name, en, uk) => `${name}="${esc(en)}" data-en-${name}="${esc(en)}" data-uk-${name}="${esc(uk)}" data-i18n`;
const ext = (href, text) => `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
const call = (t, ...a) => [typeof t[0] === "function" ? t[0](...a) : t[0], typeof t[1] === "function" ? t[1](...a) : t[1]];
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
  getlooploop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5a4.5 4.5 0 1 0 0 9c2.4 0 3.4-1.9 4.5-4.5s2.1-4.5 4.5-4.5a4.5 4.5 0 1 1 0 9c-2.4 0-3.4-1.9-4.5-4.5S9.9 7.5 7.5 7.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
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
const target = (f) => (f.big ? `big-${f.id}` : `p-${f.id}`);
function pinLink(f, x, y) {
  const lab = (i) => `${f.pin} · ${SEV[f.severity][i]} · ${f.label[i]}`;
  return `<a class="pm-a" href="#${target(f)}" ${attrPair("aria-label", lab(0), lab(1))}><g class="pin ${f.severity}" transform="translate(${x} ${y})"><circle class="ring" r="19"/>${pinShape(f.severity)}<text dy=".36em">${f.pin}</text></g></a>`;
}
/** The "Agent's judgement · <model>" badge, on every finding the agent's model made. */
const judgeBadge = (f) => {
  if (f.layer !== "judgement") return "";
  const m = f.judgement?.model;
  const t = [`${LAYER.judgement[0]} · ${m || UI.modelNotStated[0]}`, `${LAYER.judgement[1]} · ${m || UI.modelNotStated[1]}`];
  return `<span class="lyr judgement">${P(t)}</span>`;
};
const ownerMark = (o) => `<span class="own" ${attrPair("title", OWNERS[o][0], OWNERS[o][1])}>${OWNER_ICON[o]}<span class="vh">${P(OWNERS[o])}</span></span>`;
/** SVG text in both languages, or once when the two are the same. */
const stx = (x, y, t, cls, extra = "") =>
  t[0] === t[1] ? `<text class="${cls}" x="${x}" y="${y}"${extra}>${esc(t[0])}</text>` : `<text class="${cls} l-en" x="${x}" y="${y}"${extra}>${esc(t[0])}</text><text class="${cls} l-uk" x="${x}" y="${y}"${extra}>${esc(t[1])}</text>`;
const rr = (x, y, w, h, cls, rx = 2) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const mkI = (st, lab) => `<span class="mk ${st}" ${attrPair("title", lab[0], lab[1])}><i aria-hidden="true">${MARK[st].i}</i><span class="vh">${P(lab)}</span></span>`;
const head = (id, t, unit) => `<div class="panel-head"><h2 id="${id}">${P(t)}${unit ? ` <span class="unit">${P(unit)}</span>` : ""}</h2></div>`;

// ── the page map ─────────────────────────────────────────────────────────────

const MAP_W = 520;
const PIN_STEP = 36;
const MAX_ZONE_PINS = 6;
const LINE_WIDTHS = [470, 430, 300, 452, 386, 410, 260];

function zoneLabel(z) {
  if (z.kind === "section" || z.kind === "js") {
    const text = z.label || z.headings[0] || "";
    const base = text ? [text, text] : ZONE_LABEL.untitled();
    return z.kind === "js" ? [`${base[0]} · JavaScript`, `${base[1]} · JavaScript`] : base;
  }
  return (ZONE_LABEL[z.kind] || ZONE_LABEL.untitled)(z);
}

function zoneHeight(z, lede) {
  if (z.kind === "header" || z.kind === "nav" || z.kind === "footer") return 44;
  const body = 50 + Math.min(60, Math.round(Math.sqrt(Math.max(0, z.chars)) * 0.9));
  if (z.kind === "hero") return Math.max(lede ? 104 : 80, body);
  if (z.hidden || z.kind === "aside") return Math.max(80, body);
  return body;
}

function pageSvg(model) {
  const lede = model.findings.find((f) => f.code === "hero_lede_dropped");
  const out = [];
  let y = 0;
  for (const z of model.zones) {
    const h = zoneHeight(z, lede && lede.zones.includes(z.id));
    const pins = z.pins.slice(0, z.pins.length > MAX_ZONE_PINS ? MAX_ZONE_PINS - 1 : MAX_ZONE_PINS);
    const extra = z.pins.length - pins.length;
    const pinRoom = (pins.length + (extra ? 1 : 0)) * PIN_STEP;
    const maxChars = Math.max(10, Math.floor((MAP_W - 28 - pinRoom) / 7.6));
    const g = [`<g aria-hidden="true">`, `<rect class="z${z.kind === "js" ? " js" : ""}" x="0.75" y="${y + 0.75}" width="${MAP_W - 1.5}" height="${h - 1.5}" rx="8"/>`];
    const lab = zoneLabel(z).map((t) => clip(t, maxChars));
    g.push(stx(14, y + 21, lab, "zl"));
    const contentTop = y + 32;
    const contentH = h - 42;
    const unseen = z.hidden || z.kind === "aside" || (z.seen !== null && z.seen !== undefined && z.seen < 0.05 && z.kind !== "header" && z.kind !== "nav" && z.kind !== "footer");
    if (z.kind === "header" || z.kind === "nav" || z.kind === "footer") {
      if (z.hasNav && !z.pins.length) for (let i = 0; i < 5; i++) g.push(rr(262 + i * 48, y + 15, 38, 6, "ln"));
      if (!z.hasNav || z.pins.length) g.push(rr(14, y + 31, 170, 4, "ln faint"));
      else g.push(rr(14, y + 31, 170, 4, "ln faint"));
    } else if (unseen) {
      g.push(rr(14, contentTop, MAP_W - 28, Math.max(18, contentH), "hid", 4));
      const t = z.hidden && z.panels > 1 ? call(UI.panelsHidden, z.panels, z.chars) : UI.notSeen;
      g.push(stx(MAP_W / 2, contentTop + Math.max(18, contentH) / 2 + 4, t, "ht halo", ' text-anchor="middle"'));
    } else {
      if (z.kind === "hero") {
        g.push(rr(14, contentTop - 2, 64, 5, "ln"));
        g.push(rr(14, contentTop + 6, 280, 14, "ln strong", 3));
      }
      const start = z.kind === "hero" ? contentTop + 28 : contentTop;
      const isLede = z.kind === "hero" && lede && lede.zones.includes(z.id);
      if (isLede) {
        g.push(rr(14, start, 360, 34, "hid", 4));
        g.push(stx(194, start + 21, UI.notSeen, "ht halo", ' text-anchor="middle"'));
      } else {
        const partial = z.seen !== null && z.seen !== undefined && z.seen < 0.9 && z.kind !== "hero" ? 1 - z.seen : 0;
        const room = y + h - 10 - start;
        const lines = Math.max(1, Math.floor(room / 10));
        const seenLines = partial ? Math.max(0, Math.round(lines * (1 - partial))) : lines;
        for (let i = 0; i < seenLines; i++) g.push(rr(14, start + i * 10, LINE_WIDTHS[(i + Number(z.id === "js" ? 0 : z.id || 0)) % LINE_WIDTHS.length], i ? 4 : 5, i ? "ln faint" : "ln"));
        if (partial) {
          const top = start + seenLines * 10;
          const bh = Math.max(16, y + h - 8 - top);
          g.push(rr(14, top, MAP_W - 28, bh, "hid", 4));
          if (bh >= 16) g.push(stx(MAP_W / 2, top + bh / 2 + 4, call(UI.partSeen, Math.round(partial * 100)), "ht halo", ' text-anchor="middle"'));
        }
      }
    }
    g.push("</g>");
    out.push(g.join(""));
    pins.forEach((f, i) => out.push(pinLink(f, MAP_W - 22 - (pins.length - 1 - i) * PIN_STEP - (extra ? PIN_STEP : 0), y + 21)));
    if (extra) out.push(`<text class="zn" x="${MAP_W - 22}" y="${y + 25}" text-anchor="middle" aria-hidden="true">+${extra}</text>`);
    y += h + 12;
  }
  const H = Math.max(40, y - 12);
  return `<svg class="pm-svg pm-page" id="pm-page" viewBox="0 0 ${MAP_W} ${H}" role="group" ${attrPair("aria-label", UI.mapAria[0], UI.mapAria[1])}><defs><pattern id="pm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hb" width="7" height="7"/><line class="hl" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>${out.join("")}</svg>`;
}

function sideSvg(id, title, rows) {
  const W = 320;
  const RH = 34;
  const top = 36;
  const H = top + rows.length * RH + 6;
  const o = [`<g aria-hidden="true"><rect class="z" x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="8"/>${stx(14, 23, [title, title], "zl mono")}`];
  rows.forEach((r, i) => {
    const y = top + i * RH;
    const k = Array.isArray(r.k) ? r.k : [r.k, r.k];
    const shown = r.pins.slice(0, 3);
    const room = Math.floor((W - 30 - Math.max(1, shown.length) * 34 - 148) / 6.7);
    o.push(`<line class="sep" x1="10" x2="${W - 10}" y1="${y}" y2="${y}"/>`, stx(14, y + 21, k.map((t) => clip(t, 16)), "zk"), stx(148, y + 21, r.v.map((t) => clip(t, room)), "zv"));
    if (!r.pins.length) o.push(`<g class="okm" transform="translate(${W - 22} ${y + 17})"><circle r="9.5"/><path d="m-4.5 0.5 3 3 6-6.5"/></g>`);
  });
  o.push("</g>");
  rows.forEach((r, i) => r.pins.slice(0, 3).forEach((f, j, arr) => o.push(pinLink(f, W - 22 - (arr.length - 1 - j) * 34, top + i * RH + 17))));
  return `<svg class="pm-svg" id="${id}" viewBox="0 0 ${W} ${H}" role="group" ${attrPair("aria-label", title, title)}>${o.join("")}</svg>`;
}

function mapBlock(model) {
  const o = [`<section class="panel pm-panel" id="page-map" aria-labelledby="h-map">`];
  o.push(`<div class="panel-head"><h2 id="h-map">${P(UI.pageMap)}</h2><span class="sub">${P(call(UI.marked, model.mappedCount))}</span></div>`);
  o.push(`<div class="pmap"><div class="pm-pagecol">${pageSvg(model)}</div><div class="pm-side">${sideSvg("pm-head", "<head>", model.head)}${sideSvg("pm-robots", "robots.txt · llms.txt", model.robots)}</div></div>`);
  const legend = [...SEVERITIES.map((s) => `<li>${pinIcon(s, null, 22)}${P(SEV[s])}</li>`), `<li><span class="sw-hatch" aria-hidden="true"></span>${P(UI.notSeen)}</li>`, `<li><span class="sw-js" aria-hidden="true"></span>${P(UI.onlyJs)}</li>`];
  if (model.unmappedCount) legend.push(`<li class="pm-un"><a href="#all-problems">${P(call(UI.unmappedMore, model.unmappedCount))}</a> ${P(UI.unmappedWhy)}</li>`);
  o.push(`<ul class="pm-legend" id="map-legend">${legend.join("")}</ul>`);
  const zonesCap = model.caps.find((c) => c.id === "zones");
  if (zonesCap) o.push(`<p class="capnote">${P(zonesCap.t)}</p>`);
  o.push("</section>");
  return o.join("\n");
}

// ── the panels ───────────────────────────────────────────────────────────────

function tilesBlock(model) {
  const o = [`<ul class="tiles" id="status" ${attrPair("aria-label", UI.statusAria[0], UI.statusAria[1])}>`];
  for (const t of model.tiles) {
    const na = t.id === "brand" ? [STATE.unchecked, UI.noBrandFiles] : [STATE.na, UI.oneVersion];
    const tc = t.state === "na" ? na[1] : !t.count ? UI.nothingFound : t.minorOnly ? nMinor(t.count) : nProblems(t.count);
    const top = model.findings.filter((f) => f.area === t.id).slice(0, 2);
    const line = top.length ? `<p>${P([top.map((f) => f.label[0]).join(" · "), top.map((f) => f.label[1]).join(" · ")])}${t.count > top.length ? ` <span class="more">${P(call(UI.more, t.count - top.length))}</span>` : ""}</p>` : "";
    o.push(`<li class="tile ${t.state}" id="tile-${t.id}"><h2>${P(t.q)}</h2><span class="state">${STATE_ICON[t.state]}${P(t.state === "na" ? na[0] : STATE[t.state])}</span>${line}<span class="tc">${P(tc)}</span></li>`);
  }
  o.push("</ul>");
  return o.join("\n");
}

function biggestBlock(model) {
  const o = [`<section class="panel" id="biggest" aria-labelledby="h-biggest">${head("h-biggest", UI.biggest)}`];
  if (!model.bigs.length) o.push(`<p class="none-found">${P(UI.noProblems)}</p>`);
  else o.push(`<ol class="bigs">${model.bigs.map((f) => bigCard(f, model)).join("")}</ol>`);
  o.push("</section>");
  return o.join("\n");
}

function severityBlock(model) {
  const max = Math.max(1, ...SEVERITIES.map((s) => model.counts[s]));
  const C = { blocking: "--red", high: "--amber", medium: "--amber", low: "--pin-low" };
  const rows = SEVERITIES.map((s) => `<li><span class="sl">${pinIcon(s, null, 18)}${P(SEV[s])}</span><span class="st"><span class="sb ${s}" style="width:${((model.counts[s] / max) * 100).toFixed(1)}%;--c:var(${C[s]})"></span></span><span class="sn">${model.counts[s]}</span></li>`).join("");
  return `<section class="panel" id="lc-severity" aria-labelledby="h-lc-sev">${head("h-lc-sev", UI.severity, UI.problemsUnit)}<ul class="sbars">${rows}</ul></section>`;
}

function waterfallBlock(model) {
  const w = model.waterfall;
  const unit = [`${UI.charsUnit[0]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[0]}`, `${UI.charsUnit[1]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[1]}`];
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
  ];
  const s = [`<svg class="wf" id="waterfall" width="100%" height="${rows.length * R}" role="img" ${attrPair("aria-label", aria[0], aria[1])}>`];
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="22" y2="${2 * R + 38}"/>`);
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="${3 * R + 22}" y2="${5 * R + 38}"/>`);
  rows.forEach(([v, start, cls], i) => {
    const t = i * R;
    const [en, uk] = UI.wf[i];
    s.push(`<g><title>${esc(en)}: ${fmtEn(v)} / ${esc(uk)}: ${fmtUk(v)}</title>`);
    s.push(stx(0, t + 15, [en, uk], "lab"));
    s.push(stx("100%", t + 15, [fmtEn(v), fmtUk(v)], "val", ' text-anchor="end"'));
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
    .map((c) => `<li class="${c.state}" id="cg-${c.id}" tabindex="0" ${attrPair("aria-label", `${c.name[0]}: ${MARK[c.state].t[0]}`, `${c.name[1]}: ${MARK[c.state].t[1]}`)}><span class="mk ${c.state}" aria-hidden="true"><i>${MARK[c.state].i}</i></span><span class="cs" aria-hidden="true">${P(c.short)}</span><span class="tip" aria-hidden="true">${P(c.name)} · ${P(MARK[c.state].t)}</span></li>`)
    .join("");
  const notes = model.caps.filter((c) => ["links", "links_unverified", "sitemap", "saved"].includes(c.id)).map((c) => `<li>${P(c.t)}</li>`).join("");
  return `<section class="panel" id="lc-classic" aria-labelledby="h-lc-classic">${head("h-lc-classic", UI.classic, call(UI.checksUnit, cl.length))}<ul class="cg-sum">${sum}</ul><ul class="cg" id="classic-grid">${cells}</ul>${notes ? `<ul class="caps" ${attrPair("aria-label", UI.caps[0], UI.caps[1])}>${notes}</ul>` : ""}</section>`;
}

function languagesBlock(model) {
  const L = model.languages;
  if (!L) return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs)}<p class="capnote">${P(UI.langOne)}</p></section>`;
  const markKey = `<ul class="mkey" aria-hidden="true">${["pass", "fail", "warn", "na"].map((s) => `<li><span class="mk ${s}"><i>${MARK[s].i}</i></span>${P(MARK[s].t)}</li>`).join("")}</ul>`;
  const rows = L.rows
    .map((row) => {
      const name = `${esc(row.hreflang)}${row.self ? ` <span class="self">${P(UI.thisPage)}</span>` : ""}${row.refused ? ` <span class="self">${P(UI.langRefused)}</span>` : ""}`;
      return `<tr><td>${name}</td>${row.cells.map((st, i) => `<td>${mkI(st, [`${UI.langCols[i][0]}: ${MARK[st].t[0]}`, `${UI.langCols[i][1]}: ${MARK[st].t[1]}`])}</td>`).join("")}</tr>`;
    })
    .join("");
  const unit = [`${call(UI.versionsUnit, L.rows.length)[0]} · x-default ${L.xDefault ? "✓" : "✕"}`, `${call(UI.versionsUnit, L.rows.length)[1]} · x-default ${L.xDefault ? "✓" : "✕"}`];
  const unread = L.unread ? `<p class="capnote">${P(call(UI.langUnread, L.unread, L.cap))}</p>` : "";
  return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs, unit)}<div class="tablewrap"><table class="lgrid"><thead><tr><th>${P(UI.langCol)}</th>${UI.langCols.map((c) => `<th>${P(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>${markKey}${unread}</section>`;
}

function cannotBlock(model) {
  const j = model.judgement;
  const note = j.any ? `<p class="honest" id="one-model">${P([UI.oneModel[0](j.model || UI.modelNotStated[0]), UI.oneModel[1](j.model || UI.modelNotStated[1])])}</p>` : "";
  const items = CANNOT.map((c) => `<li>${EYE_OFF}<span class="cl-t">${P(c.t)}</span><span>${c.links.map(([en, uk, href]) => ext(href, `${pair(esc(en), esc(uk))} ↗`)).join(" · ")}</span></li>`).join("");
  return `<section class="panel" id="cannot-see" aria-labelledby="h-cannot">${head("h-cannot", UI.cannot)}${note}<ul class="cannot-lite">${items}</ul></section>`;
}

// ── the page frame ───────────────────────────────────────────────────────────

const JS = `
(function(){
  var root=document.documentElement,TK="ai-search-audit-theme",LK="ai-search-audit-lang";
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function effective(){return root.getAttribute("data-theme")==="dark"?"dark":"light"}
  function paint(){var t=effective(),l=root.getAttribute("data-lang")||"en",b=document.querySelectorAll("[data-set-theme]"),c=document.querySelectorAll("[data-set-lang]"),i;for(i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t));for(i=0;i<c.length;i++)c[i].setAttribute("aria-pressed",String(c[i].getAttribute("data-set-lang")===l))}
  function applyLang(l){root.setAttribute("data-lang",l);root.setAttribute("lang",l);var els=document.querySelectorAll("[data-i18n]"),pre="data-"+l+"-";for(var i=0;i<els.length;i++){var el=els[i],set=[];for(var j=0;j<el.attributes.length;j++){var a=el.attributes[j];if(a.name.indexOf(pre)===0)set.push([a.name.slice(pre.length),a.value])}for(var k=0;k<set.length;k++)el.setAttribute(set[k][0],set[k][1])}}
  var h=location.hash,hl=/(?:^#|&)lang=(en|uk)/.exec(h),ht=/(?:^#|&)theme=(dark|light)/.exec(h);
  var t0=ht?ht[1]:get(TK);if(t0==="light"||t0==="dark")root.setAttribute("data-theme",t0);
  applyLang(hl?hl[1]:get(LK)==="uk"?"uk":"en");paint();
  var b=document.querySelectorAll("[data-set-theme]");
  for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);put(TK,t);paint()});
  var c=document.querySelectorAll("[data-set-lang]");
  for(var j=0;j<c.length;j++)c[j].addEventListener("click",function(){var l=this.getAttribute("data-set-lang");applyLang(l);put(LK,l);paint()});
  function isA(n){return n&&n.tagName&&String(n.tagName).toUpperCase()==="A"}
  document.addEventListener("click",function(e){var a=e.target;while(a&&a!==document&&!isA(a))a=a.parentNode;if(!a||a===document)return;var href=a.getAttribute("href");if(!href||href.charAt(0)!=="#"||href.length<2)return;var t=document.getElementById(href.slice(1));if(!t)return;e.preventDefault();try{t.scrollIntoView({block:"center"})}catch(x){}t.classList.add("hit");setTimeout(function(){t.classList.remove("hit")},1600)});
})();
`;

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
    `<style>${CSS}${CSS_EXTRA}${CSS_FULL}</style>`,
    "</head>",
    "<body>",
    '<main class="wrap" id="report">',
    '<div class="corner corner--tl" aria-hidden="true"></div>',
    '<div class="top">',
    `<div class="top-l"><span class="eyebrow">${P(UI.eyebrow)}</span></div>`,
    '<div class="toggles">',
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.langGroup[0], UI.langGroup[1])}><button type="button" id="lang-en" data-set-lang="en" aria-pressed="true">EN</button><button type="button" id="lang-uk" data-set-lang="uk" aria-pressed="false" lang="uk">UK</button></div>`,
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.themeGroup[0], UI.themeGroup[1])}><button type="button" id="theme-dark" data-set-theme="dark" aria-pressed="false">${P(UI.dark)}</button><button type="button" id="theme-light" data-set-theme="light" aria-pressed="true">${P(UI.light)}</button></div>`,
    "</div></div>",
    '<div class="deco" aria-hidden="true"></div>',
  ];
}

function documentEnd(madeKey = "footer") {
  const links = LINKS.map(([id, name, href, k]) => `<li><a id="foot-${id}" href="${href}" rel="noopener noreferrer" target="_blank">${ICONS[id]}<span>${name}${k ? ` · ${P(k)}` : ""}</span></a></li>`).join("");
  return [
    '<div class="deco deco--foot" aria-hidden="true"></div>',
    `<footer class="foot"><div class="foot-made"><img class="motanka" src="${MOTANKA}" alt="" width="30" height="39"><p>${P(UI[madeKey])}</p></div><ul class="links">${links}</ul></footer>`,
    '<div class="corner corner--br" aria-hidden="true"></div>',
    "</main>",
    `<script>${JS}</script>`,
    "</body>",
    "</html>",
  ];
}

function pageId(url, title) {
  const href = safeHref(url);
  const link = href ? `<a class="url mono" id="audited-url" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(url)}</a>` : `<span class="url mono">${esc(url)}</span>`;
  return `<div class="pageid">${link}${title ? `<span class="pt">${esc(clip(title, 140))}</span>` : ""}</div>`;
}

// ── the Full layers: descriptions, rules, details for specialists ───────────

const ex = (f) => explain(f.code);
const DATE_RE = /^\d{4}-\d{2}-\d{2}/;
const dateLong = (iso) => (DATE_RE.test(String(iso || "")) ? dateOf(iso) : [String(iso || ""), String(iso || "")]);

/** "What the rule says": a verified quote with its source and the date it was checked, or this skill's rule. */
function ruleText(f) {
  const r = ex(f).r;
  if (r.kind === "quote") {
    const s = source(r.src);
    const d = dateLong(r.checked);
    return `<q class="rq" lang="en">${esc(r.quote)}</q> <span class="rsrc">${ext(s.url, `${esc(s.name)} ↗`)} <span class="rchk">· ${P([UI.ruleChecked[0](d[0]), UI.ruleChecked[1](d[1])])}</span></span>`;
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
    return [`${shown.map((t) => t[0]).join(", ")}${more ? ` +${more}` : ""}`, `${shown.map((t) => t[1]).join(", ")}${more ? ` +${more}` : ""}`];
  }
  if (f.strip) {
    const rows = (f.strip.side === "head" ? model.head : model.robots).filter((r) => f.strip.rows.includes(r.id));
    const keys = rows.map((r) => (Array.isArray(r.k) ? r.k : [r.k, r.k]));
    const pre = f.strip.side === "head" ? UI.inHead : UI.inRobots;
    return [`${pre[0]}: ${keys.map((k) => k[0]).join(", ")}`, `${pre[1]}: ${keys.map((k) => k[1]).join(", ")}`];
  }
  return f.layer === "judgement" ? UI.inAnswers : UI.wholePage;
}
const mapChip = (f) => (f.mapped ? ` <a class="chip mapchip" href="#page-map">${P(call(UI.mapN, f.pin))}</a>` : "");
const sevPill = (s) => `<span class="pill sev-${s}">${P(SEV[s])}</span>`;
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

function bigCard(f, model) {
  const e = ex(f);
  return [
    `<li class="big ${f.severity}" id="big-${esc(f.id)}">`,
    `<div class="bh">${pinIcon(f.severity, f.pin, 30)}<h3>${P(f.label)}</h3></div>`,
    `<dl class="plain"><div><dt class="lbl">${P(UI.whatWrong)}</dt><dd>${P(e.d)}</dd></div>`,
    `<div><dt class="lbl">${P(UI.where)}</dt><dd>${P(plainWhere(f, model))}${mapChip(f)}</dd></div>`,
    `<div><dt class="lbl">${P(UI.ruleSays)}</dt><dd class="rule">${ruleText(f)}</dd></div></dl>`,
    `<div class="chips">${sevPill(f.severity)}${ownerChip(f.owner)}${f.layer === "judgement" ? judgeBadge(f) : ""}</div>`,
    specDetails(f, `spec-big-${esc(f.id)}`),
    "</li>",
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
        `<li id="p-${esc(f.id)}" class="${f.severity}"><span class="sev ${f.severity}">${P(SEV[f.severity])}</span><div class="prow-main"><span class="prow-t">${pinIcon(f.severity, f.pin, 22)}<span>${P(f.label)}</span>${tag}</span>${f.layer === "judgement" ? judgeBadge(f) : ""}<p class="prow-w">${P(e.d)}</p><p class="prow-p"><span class="lbl">${P(UI.where)}</span>${P(plainWhere(f, model))}${mapChip(f)}</p>${ruleLine(f)}${specDetails(f, `spec-${esc(f.id)}`)}</div></li>`,
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
  const o = [`<section class="panel" id="compare" aria-labelledby="h-compare">${head("h-compare", UI.compare, [UI.since[0](d[0]), UI.since[1](d[1])])}`];
  if (!c.sameUrl) o.push(`<p class="capnote bad">${P(call(UI.compareOtherUrl, c.before.url || "—"))}</p>`);
  o.push(`<ul class="cmp-n">${[["fixed", "good"], ["new", "bad"], ["unchanged", "same"]].map(([k, cls]) => `<li class="${cls}"><b>${c.counts[k]}</b>${P(UI.cmp[k])}</li>`).join("")}</ul>`);
  const item = (f) => `<li class="${esc(f.severity)}">${pinIcon(f.severity, null, 18)}<span>${f.label ? P([f.label.en || f.code, f.label.uk || f.code]) : esc(f.code)}</span> <span class="code">${esc(f.code)}</span></li>`;
  if (c.fixed.length) o.push(`<h3 class="subhead">${P(UI.cmp.fixed)}</h3><ul class="cmp-list fixed">${c.fixed.map(item).join("")}</ul>`);
  if (c.new.length) o.push(`<h3 class="subhead">${P(UI.cmp.new)}</h3><ul class="cmp-list new">${c.new.map(item).join("")}</ul>`);
  if (c.unchanged.length) o.push(`<details class="cmp-more"><summary>${P(call(UI.cmpUnchanged, c.unchanged.length))}</summary><ul class="cmp-list">${c.unchanged.map(item).join("")}</ul></details>`);
  o.push(`<p class="capnote">${P(UI.compareHow)}</p></section>`);
  return o.join("\n");
}

const DRIFT_FIELD = {
  title: ["Title", "Title"],
  description: ["Meta description", "Meta description"],
  canonical: ["Canonical", "Canonical"],
  h1: ["h1", "h1"],
  wordCount: ["Word count", "Кількість слів"],
  schemaTypes: ["Schema types", "Типи схеми"],
  robotsStatus: ["robots.txt", "robots.txt"],
  source: ["Read from", "Джерело"],
};
const showVal = (v) => (v === null || v === undefined || (Array.isArray(v) && !v.length) ? "—" : Array.isArray(v) ? v.join(" · ") : String(v));

/** The timeline (finding counts per run) and what changed since the run before. */
function historyBlock(model) {
  const h = model.history;
  if (!h) return "";
  const o = [`<section class="panel" id="history" aria-labelledby="h-history">${head("h-history", UI.history, call(UI.runsUnit, h.total))}`];
  const max = Math.max(1, ...h.runs.map((r) => r.total || 0));
  o.push(`<ol class="tl" id="timeline">`);
  for (const r of h.runs) {
    const d = dateLong(r.createdAt);
    const t = new Date(r.createdAt);
    const hm = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    const bar = r.refused
      ? `<span class="tl-ref">${esc(r.refused)}</span>`
      : `<span class="tl-bar" style="width:${(((r.total || 0) / max) * 100).toFixed(1)}%">${SEVERITIES.map((s) => (r[s] ? `<span class="tl-s ${s}" style="flex:${r[s]}" ${attrPair("title", `${SEV[s][0]}: ${r[s]}`, `${SEV[s][1]}: ${r[s]}`)}></span>` : "")).join("")}</span>`;
    const tags = `${r.current ? `<span class="chip tl-now">${P(UI.thisRun)}</span>` : ""}${r.saved ? `<span class="chip">${P(UI.savedCopy)}</span>` : ""}`;
    o.push(`<li class="${r.current ? "now" : ""}"><span class="tl-d mono">${P([`${d[0]} ${hm}`, `${d[1]} ${hm}`])}</span><span class="tl-track">${bar}</span><span class="tl-n mono">${r.refused ? "—" : r.total}</span><span class="tl-pins">${r.refused ? "" : SEVERITIES.filter((s) => r[s]).map((s) => `<span class="tl-p" ${attrPair("title", SEV[s][0], SEV[s][1])}>${pinIcon(s, r[s], 26)}<span class="vh">${P(SEV[s])}</span></span>`).join("")}</span>${tags}</li>`);
  }
  o.push("</ol>");
  if (h.older) o.push(`<p class="capnote">${P(call(UI.olderRuns, h.older))}</p>`);
  if (h.later) o.push(`<p class="capnote">${P(UI.laterRuns)}</p>`);
  o.push(`<h3 class="subhead">${P(UI.drift)}</h3>`);
  const dr = h.drift;
  if (!dr) o.push(`<p class="capnote">${P(UI.firstRun)}</p>`);
  else {
    const since = dateLong(dr.since);
    o.push(`<p class="small">${P([UI.driftSince[0](since[0]), UI.driftSince[1](since[1])])}</p>`);
    if (!dr.comparable) o.push(`<p class="capnote">${P(call(UI.notComparable, dr.notCompared.join(", ")))}</p>`);
    const rows = [];
    for (const c of dr.fields) rows.push(`<tr><th scope="row">${P(DRIFT_FIELD[c.field] || [c.field, c.field])}</th><td class="was">${esc(clip(showVal(c.before), 160))}</td><td class="now">${esc(clip(showVal(c.after), 160))}</td></tr>`);
    for (const b of dr.bots) rows.push(`<tr><th scope="row">${esc(b.token)}</th><td class="was">${P(b.before === null ? ["—", "—"] : b.before ? UI.allowed : UI.blocked)}</td><td class="now">${P(b.after === null ? ["—", "—"] : b.after ? UI.allowed : UI.blocked)}</td></tr>`);
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
  return `<nav class="sitenav" id="site-pages" ${attrPair("aria-label", UI.sitePages[0], UI.sitePages[1])}><a class="site-home" href="../index.html">${P(UI.siteReportLink)}</a><span class="sub">${P(call(UI.evaluatedOf, site.evaluated, site.total))}${site.leftOut ? ` · ${P(call(UI.leftOutN, site.leftOut))}` : ""}</span><ol>${pages.join("")}</ol></nav>`;
}

/** How this was checked: the layers, the one model, the fix directions, the history. */
function howBlock(model) {
  const items = UI.how.map((t) => `<li>${P(typeof t[0] === "function" ? [t[0](model.judgement.model || UI.modelNotStated[0]), t[1](model.judgement.model || UI.modelNotStated[1])] : t)}</li>`);
  return `<details class="how" id="how-checked"><summary>${P(UI.howChecked)}</summary><ul>${items.join("")}</ul></details>`;
}

/** The report for an audited page. `model.compare`, `model.history` and `model.site` are optional. */
export function renderReport(model) {
  const r = model.reading;
  const o = documentStart(`${TOOL_NAME} ${EDITION}: ${r.fetch.finalUrl}`);
  o.push('<header class="verdict lite-verdict" id="verdict">');
  o.push(pageId(r.fetch.finalUrl, r.facts.head.title));
  o.push(`<h1>${P(verdict(model.findings))}</h1>`);
  const date = dateOf(r.createdAt);
  const savedNote = r.fetch.saved ? `<span aria-hidden="true">·</span><span>${P(UI.savedCopy)}</span>` : "";
  o.push(`<p class="lite-meta"><a href="#all-problems">${P(nProblems(model.findings.length))}</a><span aria-hidden="true">·</span><span>${P([UI.checked[0](date[0]), UI.checked[1](date[1])])}</span>${savedNote}${model.history ? `<span aria-hidden="true">·</span><a href="#history">${P(call(UI.runsUnit, model.history.total))}</a>` : ""}${model.compare ? `<span aria-hidden="true">·</span><a href="#compare">${P(UI.compare)}</a>` : ""}</p>`);
  o.push("</header>");
  if (model.site) o.push(siteNav(model.site));
  o.push(tilesBlock(model));
  o.push(mapBlock(model));
  o.push(biggestBlock(model));
  o.push('<div class="lcharts">');
  o.push(severityBlock(model));
  o.push(waterfallBlock(model));
  o.push(botsBlock(model));
  o.push(classicBlock(model));
  o.push(languagesBlock(model));
  o.push("</div>");
  o.push(allProblemsBlock(model));
  o.push(compareBlock(model));
  o.push(historyBlock(model));
  o.push(howBlock(model));
  o.push(cannotBlock(model));
  o.push(...documentEnd());
  return o.join("\n") + "\n";
}

// Shared with the site report (siteReport.mjs), so the two pages are one design.
export const parts = { P, pair, attrPair, esc, ext, call, clip, head, pinIcon, ownerChip, sevPill, ruleText, specDetails, documentStart, documentEnd, OWNER_ICON, OWNER_ORDER };

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
function refusalBody(lang) {
  const out = [`<p class="lead">${esc(refusalLead(lang))}</p>`, "<ul>"];
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
  out.push(`<p class="last">${esc(REFUSAL_COPY.lastLine[lang])}</p>`);
  return out.join("");
}

/** The report for a refused reading: the URL, the reason, the footer; nothing of the page. */
export function renderRefusal(reading, { site = null } = {}) {
  const url = reading.page?.url || reading.fetch?.finalUrl || reading.requestedInput || "";
  const o = documentStart(`${TOOL_NAME} ${EDITION}: ${REFUSAL_COPY.title.en}`);
  o.push(`<header class="verdict lite-verdict" id="verdict">${pageId(url, "")}</header>`);
  if (site) o.push(siteNav(site));
  if (reading.reasonCode === "refused_language_ru") {
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P([REFUSAL_COPY.title.en, REFUSAL_COPY.title.uk])}</h2></div><div class="lb-en">${refusalBody("en")}</div><div class="lb-uk" lang="uk">${refusalBody("uk")}</div></section>`);
  } else {
    const code = `${reading.reasonCode}${reading.status ? ` · HTTP ${reading.status}` : ""}`;
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P(["The page could not be audited", "Сторінку не вдалося перевірити"])}</h2></div><p class="lead mono">${esc(code)}</p></section>`);
  }
  o.push(...documentEnd("footerRefused"));
  return o.join("\n") + "\n";
}
