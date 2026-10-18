---
name: ai-search-audit-full
description: Audit public web pages for classic search and AI search (SEO and GEO), one page or a site of up to 50 pages: robots.txt for Googlebot and AI crawlers, noindex, snippets, sitemap, titles, links, images, structured data, hreflang, how an AI retriever reads the page, and the agent's own reading of questions, brand and reviews. Use for an SEO or GEO audit, AI search readiness, why Google, ChatGPT or Perplexity may not show or quote a page, or what changed since the last audit. Also «SEO-аудит сайту», «audyt SEO serwisu». For how a retriever cuts one page into passages, use Vectorscope; for a quick single-page check, ai-search-audit (Lite).
---

Version 2.110.

# AI Search Audit (Full)

## Purpose

The skill audits 1 public page, or at most 50 pages of a site, against the published rules of Google, Bing and AI assistants. 2 scripts read and check the pages; you write 4 judgement files (questions, style, brand, reviews). The result is an HTML report with a history; it does not measure what any assistant answers.

## Requirements

- Node 20.18 or later (`node --version`). If it is missing or older, tell the user and stop.
- Install: none. `dist/read.mjs` and `dist/audit.mjs` (with `dist/chunks/`) run with plain `node`.
- `$SKILL` is the folder of this file: `${CLAUDE_SKILL_DIR}` in Claude Code, the path you read it from on claude.ai.
- Work in a writable directory of your own. Call the scripts by their path.
- Network: the page, bounded site files and links, 1 DNS lookup, 1 RDAP request to `rdap.org` (the site's IP). Nothing is uploaded. Site pages: 1 at a time, 1 second apart by default (at least 0.5), only where robots.txt allows.

## Rules

R1. Answer in the user's language.
R2. Write every JSON file with the file-writing tool, never a shell heredoc (heredocs break on apostrophes).
R3. Never re-create the audit by hand. If the scripts cannot run, tell the user what would make them run, and stop.
R4. Never fetch the page another way or make a saved copy with a browsing or fetch tool. Use only files the user gives.
R5. Never write Russian. The scripts call no model; the only judgement in the report is yours.
R6. Brand and reviews: own knowledge only. Do not browse, search, fetch or read the page for them.
R7. Never guess `agent` or `model`; leave out the one you do not know.
R8. Do not claim any assistant indexes, ranks or will cite the page. Add no score of your own. Never say AI wrote the page, or did not.
R9. Do not volunteer fixes. When asked, point to "Details for specialists"; label any further advice as yours.

## Procedure: one page

1. **Read (script).** `node "$SKILL/dist/read.mjs" <url> --out reading.json`
   - `--render` adds a render in local Chrome or Chromium; an empty app shell is rendered without it.
   - Result: `reading.json` and `reviews.template.json`.
   - On `REFUSED <code>` (exit 2): go to step 7 with no judgement files (see *When the read is refused*). Do not try another URL unless asked.
   - Saved copy (`--html saved.html --final-url <url>`, `--robots`, `--network`, `--saved-at`): see `references/network-and-limits.md`.
2. **Write `questions.json` and `style.json` (judgement).** First read the full `text` of every passage in `vs.passages`.
3. **Write `brand.json` (judgement).** The brand is the site's own name. Answer the 5 fixed questions.
4. **Write `reviews.json` (judgement)** from `reviews.template.json`.
5. **Check (script).** `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --check`
   - Writes nothing. On `REFUSED <file>: <reason>`, fix that file and run it again. A `warning` is advice.
6. **Find earlier reports (judgement)** of this skill, any page or site: `report.html`, `index.html`, `export.json`, `site.json`. Look in attached files, the user's folder (Cowork's folder, the outputs folder) and where reports were saved.
7. **Write the report (script).** `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --html report.html --md report.md --json export.json`
   - Add `--history-from <file or folder>` once per report from step 6.
   - Add `--history <dir>` for another history folder (default `~/.ai-search-audit/history`), or `--no-history` to save nothing. Never both `--no-history` and `--history-from`.
   - Add `--keyword "phrase"` for the user's keyword (default: from the h1), `--compare old-export.json` for an older export.
   - Result: the 3 files, the problems numbered as on the report's map, the export saved in the history.
   - No earlier report and an empty history: tell the user once that the history starts now and the report carries it; keep it and attach it next time.
8. **Show the report** (required). The chat summary goes with it, never instead.

## Procedure: a site

1. **Read (script).** `node "$SKILL/dist/read.mjs" --urls urls.txt --out-dir readings` (1 URL per line, `#` comments), or `node "$SKILL/dist/read.mjs" --sitemap https://example.com/sitemap.xml --out-dir readings` (same host; at most 5 child sitemaps).
   - `--max N` lowers the cap (at most 50). `--delay ms` lengthens the pause (default 1000, at least 500).
   - Result: `readings/<page>.json`, `readings/site.json`, `readings/reviews.template.json`; prints `evaluated N of M` and what was left out, and why.
2. **Write judgement files (judgement).** Per page: `questions/<page>.json`, `style/<page>.json` (`<page>` = reading file name without `.json`). Once: `brand.json`, `reviews.json`. A page without its file is audited without that judgement.
3. **Check (script).** `node "$SKILL/dist/audit.mjs" --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --check`
4. **Find earlier reports**, as in one-page step 6.
5. **Write the report (script).** `node "$SKILL/dist/audit.mjs" --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --out-dir report`
   - Add `--history-from`, `--history <dir>` or `--no-history`, and `--keyword`, as in one-page step 7. `--compare old-site.json` takes an older `site.json`; pages match by URL.
   - Result: `report/index.html` (the site report), `report/site.md`, `report/site.json`, and `report/pages/<page>.html|md|json`.
6. **Show the site report**, `report/index.html`.

## When the read is refused

1. Run the report step with no judgement files, show the report, and tell the user the code's line from *Refusal codes*.
2. `unreachable`: also follow *If the page cannot be fetched* in `references/network-and-limits.md`.
3. `refused_ru_*` and `refused_language_ru`: 1 line in the chat, the report, and stop. Do not analyse the page another way.
4. Site: `refused_ru_domain`, `refused_ru_hosting` or `refused_ru_audience` after the list refuses the whole site (run stopped, earlier readings deleted, the rest `site_refused`). Run `node "$SKILL/dist/audit.mjs" --site readings/site.json --out-dir report` with no judgement files, show it, say why, and stop.
5. Site: `refused_language_ru` refuses only that page; continue.

## Judgement files

Read `references/judgement-files.md` first: schemas, examples, the 5 brand questions, the review template.

- **All 4:** top-level `agent` (your product) and `model` (your model's name), at most 60 characters each. Questions in the page's language; brand and review answers in English. The script refuses a letter Russian uses and the page's language does not (on a Ukrainian page, the 4 letters only Russian writes); quotes are checked against the page.
- **questions.json:** `topic`; 8 to 12 questions with `id`, `question`, `axes`, `passage` (the `index` of a passage in `vs.passages`, 0-based, or `null`), `verdict`, `citable`, `quote`, `miss`.
  - `axes`: 1 to 3 of `urgency`, `device`, `object`, `obstacle`; each used somewhere. `verdict`: `complete`, `partial`, `missing`.
  - `quote`: verbatim from that passage, at most 400 characters, none when `missing`.
  - `miss`: every `partial` and `missing` answer, 1 line, at most 200 characters, what the page lacks (the report's answer map).
  - First-person speech, mostly without the keyword, no wake words, no padded duplicates, at least 1 the page probably does not answer. Judge from the passages only.
- **style.json:** every passage once, `specific` or `generic` by the swap test (would it fit a competitor's page with only the brand changed?). `evidence` verbatim, at most 200 characters; `why` optional. Not an AI detector.
- **brand.json:** `brand`, `basis: "own_knowledge"`, the 5 questions once each with `knows` and `answer` (at most 1,500 characters).
  - Known: `"knows": true`. Half-known: `"knows": true`, and say in the answer that you are not sure ("Not sure: …", "…, but I am not certain"). Unknown: `"knows": false`, `"answer": ""`.
  - The script counts an answer as `"knows": false`, without a refusal, when its first 400 characters disclaim knowledge ("I don't have information", "not familiar with", "unable to find"; more in the reference). "Not sure" and "not certain" do not count.
  - Do not soften a guess into a fact or copy the page.
- **reviews.json:** the template's platforms, each once, none added or removed; fill in `brand`. Each: `"knows": true` with `rating` on its scale (5; TrustRadius 10; Product Hunt whole upvotes), or `"knows": false`. `reviews` (whole count) optional. Judge each platform separately, from your own knowledge of the brand on that platform.

## Verification

- [ ] Every JSON file was written with the file-writing tool.
- [ ] The final runs printed no `REFUSED` (a refused read excepted).
- [ ] The HTML report exists where the user keeps files.
- [ ] No file holds Russian or a guessed `agent` or `model`.

## Show the report

The HTML is the result; a chat message or a file name alone has not delivered it. Save it where the user keeps files, never only in a scratch folder (the next run's history needs it).

**Present one file: `report.html`** (for a site, `report/index.html`). Keep `report.md` and `export.json` beside it; do not present, attach, open or preview them. Never open or preview `export.json` or `report.md` as the result, and never end the reply on either: the HTML is the report. If the environment shows the last file presented, it must be the HTML.

When the user or caller has said not to publish or open anything, stop after the HTML file exists and give its path.

- **claude.ai or the Claude desktop app:** save it in the folder your environment names for user files, then present **only `report.html`**, not even the JSON after it. For a site, zip `report`, present only the zip, and say `index.html` is the start. Do not retype the report into an artifact.
- **Claude Code:** publish only `report.html` with an HTML or artifact tool, if there is one, and give the link (for a site, open `index.html` locally). Otherwise run `start "" "<absolute path>"` (Windows), `open "<absolute path>"` (macOS) or `xdg-open "<absolute path>"` (Linux), and give the path.
- **Codex, opencode, Hermes Agent or any other agent:** give the absolute path and offer to open it. Name the other files only if asked.

The report works offline. It opens in English and in the light theme; add `#lang=uk`, `#lang=pl` or `#theme=dark` (`report.html#lang=pl&theme=dark`). Give a Ukrainian or Polish user that `#lang`.

## Chat summary

- First: a blocked crawler (`ai_search_blocked`, `search_engine_blocked`, `robots_unreachable`), `snippet_blocked` or `noindex`.
- The verdict line and severity counts. Site: pages evaluated of found, left out, problems on most pages.
- Problems 1 to 5, with where, in the report's words.
- Changes since the last run; `--compare` counts; the history size the run prints; if it started empty, that the report carries it.
- Every cap printed (links past 30, images past 20, alternates past 10, child sitemaps past 5, pages past 50, merged map sections, a failed render).
- Once: the checks are deterministic, each on a published rule or a named threshold; questions, brand and reviews are your judgement as 1 named model, not ChatGPT, Gemini or Perplexity (the web Brandscope and Reviewscope ask 3).
- 1 line: Pattern score and band, marker words per 1,000 words, passages you judged generic.

## Refusal codes

| Code | Tell the user |
|---|---|
| `invalid_url` | Not a web address; ask for a page's full URL. |
| `blocked_scheme` | Only http and https pages can be read. |
| `blocked_host`, `blocked_address` | Not a public page: localhost, a private network or a non-standard port. |
| `unreachable` | The page could not be reached; it may be down, or the name does not resolve. |
| `http_error` | An error status, or more than 5 redirects. |
| `blocked` | The site turns automated readers away (401, 403, 429); retrying will not help. |
| `not_html` | A file such as a PDF or an image, not an HTML page. |
| `too_large` | Over the 3 MB ceiling. |
| `empty` | No readable text once navigation and boilerplate were removed. |
| `refused_ru_domain`, `refused_ru_hosting`, `refused_ru_audience`, `refused_language_ru` | Not analysed: a Russian domain zone (.ru, .su, .рф, .москва, .moscow) or hosting in Russia (RDAP country RU), both not fetched; a declared Russian-language version (hreflang, og:locale, Content-Language); a page in Russian. |

## References

| File | Read when |
|---|---|
| `references/judgement-files.md` | Before writing a judgement file. |
| `references/network-and-limits.md` | A fetch fails, no network, a read-only skill folder, a saved copy, or questions on requests and limits. |
| `references/checks.md` | Questions on a code, a check, a threshold, or why something was flagged. |
| `references/outputs-and-history.md` | Questions on a file, the export format, history, drift or `--compare`. |
