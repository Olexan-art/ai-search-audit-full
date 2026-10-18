---
name: ai-search-audit-full
description: Audit public web pages for classic search and AI search (SEO and GEO), one page or a site of up to 50 pages: robots.txt for Googlebot and AI crawlers, noindex, snippets, sitemap, titles, links, images, structured data, hreflang, how an AI retriever reads the page, and the agent's own reading of questions, brand and reviews. Use for an SEO or GEO audit, AI search readiness, why Google, ChatGPT or Perplexity may not show or quote a page, or what changed since the last audit. Also «SEO-аудит сайту», «audyt SEO serwisu». For how a retriever cuts one page into passages, use Vectorscope; for a quick single-page check, ai-search-audit (Lite).
---

Version 2.110. The first number moves only on a breaking change.

# AI Search Audit (Full)

This skill checks one public page, or up to 50 pages of a site, against the published rules that decide whether Google, Bing or an AI assistant can crawl it, understand it and quote it. You add three readings only an agent can make: the questions people ask and whether the page answers them, and what your model believes about the brand and its reviews. Two bundled scripts read and check deterministically and call no model; the report marks your readings as the agent's judgement, with your model's name, and keeps a history of what changed since the last run.

**Answer the user in the language they wrote in.**

## Before you start

- **`$SKILL` is this skill's folder**, the one this SKILL.md is in. In Claude Code it is `${CLAUDE_SKILL_DIR}`. On claude.ai, use the path you read this file from. Work in a writable directory of your own and call the scripts by their path.
- **No install.** `dist/read.mjs` and `dist/audit.mjs` (with `dist/chunks/`) carry everything they need; plain `node` runs them.
- **Node 20.18 or later.** Check with `node --version`. If there is no Node, or an older one, say so and stop.
- **Network:** the page, a bounded set of site files and links, one DNS lookup and one RDAP request to `rdap.org` with the site's IP address. A site is read one page at a time, at most 50 pages, 1 second apart by default and never less than 0.5 seconds, only where robots.txt allows. Nothing is uploaded: no server of ours, no account; the only requests are those listed in `references/network-and-limits.md`. Read that file when a fetch fails, the shell has no network, the skill folder is read-only or the user gives you a saved page.
- **Never re-create the audit by hand.** If the scripts cannot run here (no Node, no code execution, the network blocked), say so, say what would make them run, and stop. Do not fetch the page another way and check it yourself: findings made by hand are not the tool's.

## Steps: one page

1. *script* `node "$SKILL/dist/read.mjs" <url> --out reading.json` (`--render` adds a JavaScript render in a local Chrome or Chromium; an empty app shell is rendered without it).
   If it prints `REFUSED <code>` (exit code 2), skip to step 6: the report says why. Do not retry with another URL unless asked.
2. *judgement* **questions.json** and **style.json.** Read the `text` of every passage in `reading.json` (`vs.passages`), in full. Write 8 to 12 questions a person would say out loud to an assistant about the page's topic and judge each against the passages; mark every passage specific or generic (the swap test).
3. *judgement* **brand.json.** Name the brand (the site's own name) and answer the five fixed buyer questions **from your own knowledge only**, not from the page.
4. *judgement* **reviews.json.** Step 1 wrote `reviews.template.json` beside `reading.json`. Fill it in as `reviews.json`: for the same brand and from your own knowledge only, the rating you believe it has on each platform it lists, or `"knows": false`.
5. *script* `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --check`
   It writes nothing. On `REFUSED <file>: <reason>`, fix that file as the message says and run it again. A `warning` line is advice, not a refusal.
6. *script* `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --html report.html --md report.md --json export.json`
   - add `--keyword "phrase"` when the user gave a target keyword (otherwise the keyword is read off the h1);
   - add `--compare old-export.json` when the user gives an older export to compare with;
   - add `--history-from <file or folder>` (repeatable) for every earlier report of this skill you can find, of any page or site (see *History*).
   It prints the problems, numbered as on the report's map (judgement findings marked `(judgement)`), and saves the export in the history.
7. **Show the report** (required; see *Show the report*). A chat summary goes with it, never instead of it.

A saved copy of the page (`--html saved.html --final-url <url>`, with `--robots`, `--network`, `--saved-at`) is described in `references/network-and-limits.md`.

## Steps: several pages of a site

1. *script* `node "$SKILL/dist/read.mjs" --urls urls.txt --out-dir readings` (one URL per line, `#` for comments), or `node "$SKILL/dist/read.mjs" --sitemap https://example.com/sitemap.xml --out-dir readings` (same-host URLs only, a sitemap index followed into at most 5 children). `--max N` lowers the cap (50 at most); `--delay ms` lengthens the pause (1000 by default, never under 500).
   It writes `readings/<page>.json` per page, `readings/site.json` and `readings/reviews.template.json`, and prints `evaluated N of M` and what was left out, and why.
2. *judgement* For each page read, write `questions/<page>.json` and `style/<page>.json` (`<page>` is the reading's file name without `.json`). Write `brand.json` once, and `reviews.json` once from `readings/reviews.template.json`; both apply to every page.
3. *script* `node "$SKILL/dist/audit.mjs" --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --check`, then fix any file it refuses.
4. *script* `node "$SKILL/dist/audit.mjs" --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --out-dir report` (add `--compare old-site.json` for the `site.json` of an older site report, pages matched by URL; add `--keyword` and `--history-from` as for one page).
   It writes `report/index.html` (the site report), `report/site.md`, `report/site.json`, and `report/pages/<page>.html`, `.md` and `.json` for every page, all linked together.
5. **Show the site report**, `report/index.html` (see *Show the report*).

A page with no `questions/<page>.json` or `style/<page>.json` is audited without that judgement, and its report says so.

## When the read is refused

On any `REFUSED <code>` from read.mjs, run the audit step without the judgement files (the report states the reason), show it, and tell the user in one plain line what the code means. The table of codes and their lines is at the end of `references/network-and-limits.md`; read it when you get a code; for `unreachable`, also follow *If the page cannot be fetched* there.

`refused_ru_domain`, `refused_ru_hosting`, `refused_ru_audience` and `refused_language_ru` mean the page is not analysed (a Russian domain zone, hosting in Russia, a declared Russian-language version, a page in Russian). One line in the chat, the report, and stop: do not analyse the page in any other way. For a site, any of the first three after the list refuses the whole site: the run stopped, earlier readings were deleted, and the rest are left out as `site_refused`. Run `node "$SKILL/dist/audit.mjs" --site readings/site.json --out-dir report` with no judgement files (no page reports are written), show it, say why, and stop. `refused_language_ru` refuses only that page; the rest proceed.

## The files you write

Before writing questions.json, style.json, brand.json or reviews.json, read `references/judgement-files.md`: it has the schemas, an example of each, the brand's five questions in their fixed wording and how to fill in the review template. The rules that matter most:

- **Every file** carries top-level `agent` (the product you run in) and `model` (your model's name as you know it), up to 60 characters each. Fill them honestly; if you do not know one, leave it out. Never guess or invent either.
- **Never in Russian.** Questions and answers are in the page's language (English for brand and review answers). What you write is refused if it holds a letter Russian uses that the page's own language does not (on a Ukrainian page, any of the four letters only Russian writes there); quotes are the page's own words and are checked against it instead.
- **questions.json:** `topic`, and 8 to 12 questions with `id`, `question`, `axes` (one to three of `urgency`, `device`, `object`, `obstacle`; each used somewhere), `passage` (or `null`), `verdict` (`complete`, `partial`, `missing`), `citable`, `quote` (verbatim from that passage, up to 400 characters; none when `missing`) and, for every `partial` and `missing` answer, `miss`: one line, up to 200 characters, on what the page lacks. First-person speech in the page's language, mostly without the keyword, no wake words, no padded duplicates, at least one the page probably does not answer. Judge from the passages only. These become the report's answer map.
- **style.json:** one verdict per passage, `specific` or `generic` by the swap test (would it fit a competitor's page with only the brand name changed?), with verbatim `evidence` (up to 200 characters) and an optional `why`. It is not an AI detector.
- **brand.json / reviews.json:** `brand`, `basis: "own_knowledge"`, then the five fixed questions with `knows` and `answer`, or every platform of `reviews.template.json` once, none added or removed, with `knows` and `rating`. Answer each the same way.
- **Honesty, for brand and reviews:** own knowledge only. Do not browse, search, fetch or read the page for these, even if a tool is available. `"knows": false` is the correct answer when it is true; do not soften a guess into a fact or copy the page into an answer.

## What the report says, and fixes

Each problem has a plain description, "What the rule says" (a verbatim quote from the official source, or "This skill's rule"), and a fix direction only inside its collapsed "Details for specialists". Read `references/checks.md` when the user asks what a code means, how a check works or which threshold applies.

When the user asks for fixes, point them to the details for specialists. If they want more than those directions, you may answer from your own knowledge, and say that the advice is yours, not the report's. Do not volunteer a fix list with the summary.

## History

Every run saves its export in `~/.ai-search-audit/history` (`--history dir` chooses another, `--no-history` saves nothing), and every report carries a copy of the history, because on claude.ai and in fresh sandboxes the disk does not outlive the chat.

- **Before a run, look for earlier reports** and pass them with `--history-from <file or folder>` (repeatable): any `report.html`, `index.html`, `export.json` or `site.json` from this skill, of any page or site, in the files attached to the conversation, the folder the user works in (Cowork's folder, the outputs folder) or wherever earlier reports were saved.
- **If there is none and the history is empty**, say once that the history starts with this run, and that the report itself carries it: keep the report, and attach it (or point to its folder) next time, in any chat.
- **Save the report where the user keeps files** (see *Show the report*), never only in a scratch folder: the next run's history depends on finding it.

Read `references/outputs-and-history.md` when the user asks what a file holds, the export format, or how the drift and `--compare` work.

## Show the report

This step is required. The HTML report is the result; a run that ends with only a chat message has not delivered it. Mentioning the file name is not showing it.

**Present one file: `report.html`** (for a site, `report/index.html`, the site report; the page reports open from it). `report.md` and `export.json` are written beside it for whoever wants the data; keep them there, but do not present, attach, open or preview them. Never open or preview `export.json` or `report.md` as the result, and never end the reply on either of them: the HTML is the report. If the environment shows the last file you present, that last (and only) file must be the HTML.

- **claude.ai or the Claude desktop app, with code execution:** save `report.html` where your environment's own instructions say files for the user go (the outputs folder they name, if they name one), with `report.md` and `export.json` beside it, and present **only `report.html`** as a file in your reply, so the download the user gets and opens is the report. Do not present the JSON or the Markdown, not even after the HTML. For a site, zip the `report` folder and present only the zip, saying that `index.html` inside it is the start. A file left in a scratch folder the user cannot see has not been shown. Do not retype the report into an artifact by hand: a copy is not the tool's output.
- **Claude Code:** if the session has a tool for publishing HTML pages or artifacts, publish `report.html` with it, and only that file, and give the link (for a site, open `index.html` locally instead: the page reports are separate files). Otherwise open the HTML in the user's default browser: `start "" "<absolute path>"` on Windows, `open "<absolute path>"` on macOS, `xdg-open "<absolute path>"` on Linux. Then give its absolute path. Do not open, publish or print the JSON or the Markdown.
- **Codex, opencode, Hermes Agent or any other agent:** give the HTML's absolute path and offer to open it in the default browser with the command above (or the agent's own preview or browser tool, if it has one). Preview only the HTML. Name the other files only if the user asks for the data.

The report is one self-contained file and makes no network requests, so it opens offline. It opens in English and in the light theme; `#lang=uk` opens it in Ukrainian, `#lang=pl` in Polish and `#theme=dark` in the dark theme (for example `report.html#lang=pl&theme=dark`). When the user writes in Ukrainian or Polish, give the link with that `#lang`.

## The chat summary

Short, alongside the report and never instead of it:

- **If a crawler is blocked (`ai_search_blocked`, `search_engine_blocked`, `robots_unreachable`), snippets are blocked (`snippet_blocked`) or the page is `noindex`, say that first.**
- The verdict line and the counts by severity, as the report states them. For a site: pages evaluated of found, what was left out, and the problems repeated across most pages.
- The biggest problems (the report's numbers 1 to 5), each with where it is, in the report's plain words.
- What changed since the last run, when the history had one, and the before/after counts when `--compare` was given; how many pages and sites the history holds (the run prints it); and, when it started empty, that the report carries it forward.
- What was not checked: every cap the audit printed (links past 30, images past 20, alternates past 10, child sitemaps past 5, pages past 50, sections merged on the map, a render that could not run).
- Say once that the checks are deterministic and rest on a published rule or a threshold this skill names, and that the questions, the brand and the reviews are your own judgement as one model (name it), not what ChatGPT, Gemini or Perplexity say; the web Brandscope and Reviewscope ask three assistants.
- How generated the text sounds, in one line: the Pattern score and its band, the marker words per 1,000 words, and how many passages you judged generic (derived, derived, your judgement). Never say the page was written by AI, or was not: the text cannot show it.
- Do not claim that any assistant has indexed the page, ranks it or will cite it, and do not add a score of your own.

## Hard rules

- Never re-create the audit by hand, and never make a saved copy yourself with a browsing or fetch tool.
- Never write Russian in the files you write.
- The scripts call no model; the only judgement in the report is yours, under your model's name, never guessed.
