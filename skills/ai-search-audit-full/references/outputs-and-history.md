Read this when the user asks what a file holds, the export format, or how the history, the drift or `--compare` work.

# Outputs, export format, history and drift

## Outputs

- `report.html`: 1 self-contained page (inline CSS, 1 small script, favicons as data URIs, a content security policy that blocks every network request, all page text escaped). Light by default, dark on the toggle; English, Ukrainian, Polish; safe down to 375 px.
  - Summary first: a headline from the findings, severity counts, 3 cards, the 3 findings to review first, and the places in the document beside the selected one. Each finding shows its plain description; what the rule says is 1 click away.
  - Then the history and before/after, when there are any.
  - Every technical detail, with each finding's details for specialists and fix direction, is in 1 closed section, *All checks and technical details*.
  - Judgement findings carry an "Agent's judgement · <model>" badge. A note says brand, reviews and questions are 1 model's view.
- `report.md`: the same audit in English Markdown: status, biggest problems, every problem by who it concerns (description, rule, place, layer, fix direction), the page map as a list, checklist, bots, language versions, where the text goes, before and after, history, drift, and what was not checked.
- `export.json`: `getlooploop/ai-search-audit@1`, `edition: "full"`.
  - Every finding: `code`, `severity`, `area`, `owner`, `layer`, `judgement` (`agent`, `model`, or `null`), `label` (en, uk), `where`, `map` (zones and strip rows), `passages`, `evidence`, `rules` (each `{ name, url }`), `explanation` (`title`, `description`, `rule` as `{ kind: "quote", quote, source, checked }` or `{ kind: "skill", text }`, `fixDirection`).
  - Also: `state` (what the drift compares), `compare` and `history` when made, tiles, checklist, page map, robots, sitemap, llms.txt, languages, alternates, links, structured data, `keyword`, `writingPatterns`, `generatedText` (Pattern score, marker words, swap test, per passage), `localeFacts`, `judgement` (the files as validated), the reading's waterfall, `notChecked` (every cap), `notMeasured`.
- Site: `index.html` (pages × problems, problems repeated as "N pages", problems on 1 page, what was audited and left out, every page linked), `site.md`, `site.json` (`getlooploop/ai-search-audit-site@1`), and `pages/<page>.html|md|json`.
- `reading.json` (`getlooploop/ai-search-audit-reading@1`): everything step 1 read, so the audit can run again offline. Site: `readings/site.json` (`getlooploop/ai-search-audit-site-reading@1`) lists pages read and pages left out, with reasons.
- History folder: 1 export per page per run; every report carries the same history.

## History and drift

Every `audit.mjs` run saves its export at `<history>/<host>/<path>/<date>.json`. The reading's date names the file, so a second audit of the same reading rewrites that snapshot.

The report shows:

- the **timeline**: problems by severity per run, the last 20 runs (older runs counted);
- **what changed since the last run**: title, description, canonical, h1, word count, schema types, robots.txt per bot, the hreflang set, passages new, lost and changed, findings fixed, new and unchanged;
- **every audit in this history**: 1 row per address, any page or site, with runs, first and last date, and the last run's problems.

**Where it lives**

- `~/.ai-search-audit/history` (or `$AI_SEARCH_AUDIT_HISTORY`), whatever the working directory, so every folder, day and skill version sees the same history.
- Never inside the skill's folder, which an update replaces: the script redirects a `--history` that points there, and says so.
- The script copies in an older version's `./.ai-search-audit/history` from the working directory on the next run.
- `--history dir` chooses another folder; `--no-history` saves nothing. The script refuses `--no-history` with `--history-from`.

**Every report carries it**

- The report holds every known run in its own JSON block: at most 300 runs, newest kept; it says if any were left out.
- Where the disk does not outlive the chat (claude.ai, Cowork in a fresh sandbox), the next run takes it back with `--history-from`.
- A run already in the history is not added twice.

## Compare

`--compare old-export.json` sets this run beside 1 older export: a page's `export.json`, or a site report's `site.json` (pages matched by URL). It shows fixed, new and unchanged findings, matched by code and question id.
