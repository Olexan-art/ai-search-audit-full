// The Full layers' styles, from the approved Full prototype: the problem cards, "What the rule
// says", the details for specialists with the fix direction, all problems by owner, before and
// after, the history timeline and drift, the site navigation and the site report. The same
// tokens as the Lite stylesheet in css.mjs (light by default, AA in both themes: tests/contrast.test.mjs
// measures them), no colour of its own, and severity always as a shape and a word, never colour alone.

export const CSS_FULL = `
.lbl{color:var(--muted);font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.small{font-size:14px;color:var(--muted)}
.subhead{font-size:15px;margin:16px 0 8px;font-weight:700}
.tile p .more{color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.chips .lyr{flex-basis:auto;margin:0}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:13px;border:1px solid var(--line-2);border-radius:999px;padding:1px 10px 1px 8px;color:var(--text);background:var(--panel);white-space:nowrap;text-decoration:none}
.chip svg{width:13px;height:13px;flex:none;color:var(--accent)}
.chip-k{color:var(--muted)}
.chip.bigtag{border-style:dashed;color:var(--muted)}
.mapchip{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;font-size:12px;padding:0 8px;margin-left:4px;vertical-align:1px}
a.mapchip:hover{border-color:var(--accent)}
.lyr.measured{--c:var(--lm);--cs:var(--lm-soft)}
.lyr.derived{--c:var(--ld);--cs:var(--ld-soft)}
.rule{margin:0;font-size:14px;line-height:1.5;color:var(--text);border-left:2px solid var(--line-2);padding-left:9px;overflow-wrap:anywhere}
.rule .lbl{margin-right:5px}
dd.rule{font-size:14px}
.rq{font-style:normal}
.rsrc a{font-size:13.5px}
.rchk{font-size:13px;color:var(--muted);white-space:nowrap}
.rskill{font-weight:700;color:var(--muted)}
.spec{border-top:1px dashed var(--line-2);padding-top:6px}
.spec>summary{cursor:pointer;font-size:13.5px;color:var(--muted);font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;letter-spacing:.02em;width:max-content;max-width:100%}
.spec>summary:hover,.spec[open]>summary{color:var(--accent)}
.spec-body{margin-top:8px;display:grid;gap:8px}
.fmeta{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center}
.fmeta .lyr{flex-basis:auto;margin:0}
.code{font-size:13.5px;color:var(--muted);font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.fdl{margin:0;display:grid;grid-template-columns:max-content minmax(0,1fr);gap:4px 14px;font-size:14px}
.fdl dt{color:var(--muted);font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;padding-top:2px}
.fdl dd{margin:0;min-width:0;overflow-wrap:anywhere}
.fdl dd.mono{font-size:13.5px}
.evq{display:inline;color:var(--text);background:var(--bg-2);border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-size:13.5px;font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;-webkit-box-decoration-break:clone;box-decoration-break:clone;overflow-wrap:anywhere}
.srcs a{font-size:13.5px}
.fixdir{margin:0;font-size:13.5px;line-height:1.5;color:var(--muted);border:1px dashed var(--line-2);border-radius:8px;padding:6px 10px;background:var(--bg-2)}
.fixdir .k{display:block;font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:1px}
.fixdir code{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;font-size:13px;color:var(--text);overflow-wrap:anywhere}
.owners-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;padding:0;list-style:none}
.owners-nav a{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line-2);border-radius:999px;padding:4px 12px 4px 10px;background:var(--panel-2);color:var(--text);text-decoration:none;font-size:14.5px}
.owners-nav a:hover{border-color:var(--accent)}
.owners-nav svg{width:15px;height:15px;color:var(--accent)}
.owners-nav .cnt,.owner h3 .cnt{font-size:13.5px;color:var(--muted);font-weight:500}
.owner{margin-top:20px;scroll-margin-top:12px}
.owner h3{display:flex;align-items:center;gap:8px;font-size:16.5px;margin:0 0 8px}
.owner h3 svg{width:18px;height:18px;color:var(--accent)}
.plist{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--panel-2)}
.plist>li{display:grid;grid-template-columns:104px minmax(0,1fr);gap:4px 14px;padding:11px 14px;border-bottom:1px solid var(--line);scroll-margin-top:12px}
.plist>li:last-child{border-bottom:0}
.sev{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap;padding-top:2px;align-self:start}
.sev::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--sc);flex:none;box-shadow:0 0 0 2px var(--panel-2),0 0 0 3px var(--sc)}
.sev.blocking{--sc:var(--red);color:var(--red)}.sev.high{--sc:var(--amber);color:var(--amber)}.sev.medium{--sc:var(--amber)}.sev.low{--sc:var(--pin-low)}
.sev.medium::before{background:transparent;box-shadow:inset 0 0 0 2.5px var(--sc)}
.sev.low::before{background:transparent;border-radius:2px;box-shadow:inset 0 0 0 2px var(--sc)}
.prow-main{min-width:0;display:grid;gap:4px}
.prow-main>.lyr{flex-basis:auto;margin:0;width:fit-content}
.prow-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:700;font-size:16px;line-height:1.35}
.prow-t .pi{flex:none}
.prow-t>span:not(.chip){overflow-wrap:anywhere;min-width:0}
.prow-w{margin:0;font-size:15px;line-height:1.45}
.prow-p{margin:0;font-size:14px;color:var(--muted)}
.prow-p .lbl{margin-right:5px}
.why{margin:2px 0 6px 52px}
.why-s{cursor:pointer;list-style:none;display:inline-flex;gap:6px;align-items:center;font-size:15px;font-weight:600;color:var(--accent);border-radius:6px}
.why-s::-webkit-details-marker{display:none}
.why-s .chev{width:16px;height:16px;flex:none}
.why[open] .why-s .chev{transform:rotate(180deg)}
.why-b{margin-top:6px;display:grid;gap:6px;max-width:82ch}
.why-d{margin:0;font-size:15px;line-height:1.5}
.pd-list li .why{grid-column:1/-1;margin:2px 0 4px 34px}
.tr-x .why-b{margin:0 0 10px}
@media (prefers-reduced-motion:no-preference){.why-s .chev{transition:transform .15s}}
.how{margin-top:22px;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:12px;background:var(--panel);padding:10px 16px}
.how>summary{cursor:pointer;font-weight:700;font-size:15.5px;list-style:none;width:max-content;max-width:100%}
.how>summary::-webkit-details-marker{display:none}
.how>summary::after{content:" +";color:var(--muted);font-weight:500}
.how[open]>summary::after{content:" \\2013"}
.how ul{margin:10px 0 4px;padding:0 0 0 18px;display:grid;gap:6px;font-size:14.5px;color:var(--muted)}
.cmp-n{list-style:none;margin:0 0 6px;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.cmp-n li{display:flex;align-items:baseline;gap:7px;border:1px solid var(--line);border-radius:10px;padding:6px 12px;background:var(--panel-2);font-size:14.5px}
.cmp-n b{font-size:20px;line-height:1}
.cmp-n .good b{color:var(--green)}.cmp-n .bad b{color:var(--red)}.cmp-n .same b{color:var(--muted)}
.cmp-list{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.cmp-list li{display:flex;align-items:center;gap:8px;font-size:14.5px;border-bottom:1px solid var(--line);padding:4px 0;flex-wrap:wrap}
.cmp-list li .pi{flex:none}
.cmp-list.fixed li>span:first-of-type{text-decoration:line-through;text-decoration-color:var(--green)}
.cmp-more{margin-top:10px}
.cmp-more>summary{cursor:pointer;font-size:14px;color:var(--muted)}
.tl{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.tl li{display:grid;grid-template-columns:180px minmax(0,1fr) 40px auto auto;gap:10px;align-items:center;font-size:14px}
.tl li.now .tl-d{color:var(--accent);font-weight:700}
.tl-d{font-size:13px;color:var(--muted);white-space:nowrap}
.tl-track{height:14px;border-radius:4px;background:var(--empty);overflow:hidden;display:block}
.tl-bar{display:flex;height:100%;min-width:2px}
.tl-s{display:block;height:100%}
.tl-s.blocking{background:var(--red)}.tl-s.high{background:var(--amber)}.tl-s.medium{background:repeating-linear-gradient(45deg,var(--amber) 0 3px,var(--panel) 3px 6px)}.tl-s.low{background:var(--pin-low)}
.tl-n{text-align:right;font-weight:700}
.tl-pins{display:inline-flex;gap:3px;align-items:center}
.tl-p{display:inline-flex}
.tl-ref{font-size:12px;color:var(--red);padding-left:6px}
.tl-now{border-color:var(--accent);color:var(--accent)}
table.drift td,table.drift th{font-size:14px}
table.drift th[scope=row]{text-transform:none;letter-spacing:0;font-size:14px;color:var(--text);white-space:normal}
table.drift td{overflow-wrap:anywhere;max-width:420px}
table.drift td.was{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--line-2)}
.pass-list{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:4px;font-size:14px}
.pass-list li{border-left:3px solid var(--c);padding:2px 0 2px 9px;overflow-wrap:anywhere}
.pass-list.new{--c:var(--green)}.pass-list.lost{--c:var(--red)}.pass-list.changed{--c:var(--amber)}
.pl-k{font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:12px;color:var(--c)}
.pl-was{color:var(--muted);text-decoration:line-through}
.pl-now{color:var(--text)}
.sitenav{margin-top:16px;border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:10px 14px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline}
.sitenav .site-home{font-weight:700;text-decoration:none}
.sitenav .sub{font-size:13.5px;color:var(--muted)}
.sitenav ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px;flex-basis:100%}
.sitenav li{display:inline-flex;gap:6px;align-items:baseline;border:1px solid var(--line-2);border-radius:999px;padding:2px 10px;font-size:13.5px;background:var(--panel-2);max-width:100%}
.sitenav li a,.sitenav li>span.mono{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
.sitenav li.cur{border-color:var(--accent);color:var(--accent)}
.sitenav .pn{color:var(--muted);font-size:12.5px;white-space:nowrap}
.mx{border-collapse:separate;border-spacing:0}
.mx th,.mx td{padding:6px 8px;border-bottom:1px solid var(--line)}
.mx thead th{text-transform:none;letter-spacing:0;font-size:13px;color:var(--muted);font-weight:600;vertical-align:bottom;text-align:center;white-space:normal;min-width:44px}
.mx thead th:first-child{text-align:left}
.mx thead th a{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.mx tbody th{text-transform:none;letter-spacing:0;font-size:14px;color:var(--text);font-weight:600;white-space:normal;min-width:200px}
.mx td{text-align:center}
.mx td.n{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;font-weight:700}
.mx .pi{vertical-align:middle}
.mx .none{color:var(--faint)}
.rep{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--panel-2)}
.rep>li{display:grid;grid-template-columns:104px minmax(0,1fr);gap:4px 14px;padding:11px 14px;border-bottom:1px solid var(--line)}
.rep>li:last-child{border-bottom:0}
.rep .np{font-weight:800;color:var(--accent);white-space:nowrap}
.rep .pg{display:flex;flex-wrap:wrap;gap:4px}
.pages-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.pages-list li{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:baseline;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--panel-2);font-size:14.5px}
.pages-list .i{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;color:var(--muted)}
.pages-list a{overflow-wrap:anywhere}
.pages-list .pt{display:block;font-size:13.5px;color:var(--muted)}
.pages-list .cnts{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;font-size:13px;white-space:nowrap;color:var(--muted)}
.left-list{margin:8px 0 0;padding:0 0 0 18px;font-size:13.5px;color:var(--muted);display:grid;gap:2px}
.left-list li{overflow-wrap:anywhere}
@media (max-width:640px){
  .plist>li,.rep>li{grid-template-columns:1fr;gap:4px}
  .bigs{grid-template-columns:1fr}
  .tl li{grid-template-columns:minmax(0,1fr) 34px;row-gap:2px}
  .tl li .tl-d{grid-column:1/-1}
  .tl li .tl-track{grid-column:1}
  .tl li .chip,.tl li .tl-pins{grid-column:1/-1;justify-self:start}
  .fdl{grid-template-columns:1fr}
  .pages-list li{grid-template-columns:22px minmax(0,1fr)}
  .pages-list .cnts{grid-column:2}
}
.hx td{vertical-align:middle}
.hx .hx-url{max-width:420px;overflow-wrap:anywhere}
.hx tr.hx-now td{background:var(--sel-soft)}
.hx-trend{display:inline-flex;align-items:flex-end;gap:2px;height:22px;width:max-content}
.hx-trend i{display:block;width:6px;background:var(--accent);border-radius:2px 2px 0 0}
.hx-trend i.ref{height:100%;background:repeating-linear-gradient(135deg,var(--line-2) 0 3px,transparent 3px 6px)}
`;
