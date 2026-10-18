English · [Українська](README.uk.md) · [Polski](README.pl.md)

# AI Search Audit Full

AI Search Audit Full **2.111**, an Agent Skill from [GetLoopLoop](https://www.getlooploop.com) for claude.ai and the Claude desktop app, Claude Code, Codex, opencode, Hermes Agent and other agents that load `SKILL.md` skills. Versions count in thousandths (2.101, 2.102, …).

Before Google, Bing or an AI assistant can show or quote a page, a crawler has to be allowed in, the page has to say what it is, and the text has to survive the machine's reading. `ai-search-audit-full` checks public pages against the published rules for all three, adds three readings only an AI can make (the questions people ask, how the agent's own model describes the brand, and what it believes about the brand's reviews), and explains every problem it finds: what is wrong and why it matters, what the rule says in its source's own words, and, for specialists, which way the fix goes. It audits one page or up to 50 pages of a site, compares a run with an older one, and keeps a local history so each report shows what changed since the last run. At the bottom of every page report, *How generated the text sounds* puts the Pattern score, the words language models overuse and the agent's swap test side by side. The reports read in English, Ukrainian or Polish.

This is the Full edition. It is built on the public [Lite](https://github.com/Olexan-art/ai-search-audit) (2.110) and runs every Lite check.

![A page report from the example run: the headline, what it means for you, the findings to review first and where on the page they are](docs/ai-search-audit-full-light-1280.png)

## What Full adds over Lite

| | Lite | Full |
|---|---|---|
| Every problem | a short label, a severity, a place | plus **What goes wrong**: a plain description for juniors and managers, with no advice |
| The rule | in the export only | **What the rule says**: a short verbatim quote from the official source with its link and the date it was checked, or "This skill's rule" where nobody publishes one (83 quotes, all matched word for word against the live pages on 17 October 2026) |
| Fixes | none | a **fix direction**, technical and terse, only inside each problem's collapsed "Details for specialists" |
| Pages | one | **up to 50 per site**, from a URL list or a sitemap, read one at a time with robots.txt respected; the cap is reported as evaluated / total, with every page left out and why |
| The site | — | a **site report**: pages × problems, problems repeated across pages grouped as "on N pages", and checks only a set of pages can make (duplicate titles, descriptions and h1s, orphan pages, link depth, hreflang pairs, canonical chains, internal links through redirects, thin pages) |
| Before/after | — | `--compare old-export.json`: fixed, new and unchanged findings per page |
| How generated the text sounds | the same block | the same block on every page of a site, the swap test from `style/<page>.json` |
| History | — | every run saved as a snapshot in the user's own folder, which a new chat, a new folder or a new version of the skill does not reset, and carried inside every report; a **timeline** per page, **what changed since the last run** (title, description, canonical, h1, words, schema types, robots.txt and each bot, hreflang, passages new, lost and changed, findings fixed, new and unchanged), and **every audit in the history**, one row per address, any page and any site |

In the report, every finding in *Review these first* and in the selected place opens to its plain description and what the rule says; the history and before/after follow *Where on the page*; the fix directions sit in each problem's details for specialists, inside *All checks and technical details*.

Everything stays local: no server, no upload. The scripts call no model; the judgement parts are written by the agent running the skill, and marked with its model.

The **answer map** puts the questions people ask in one table: whether the page answers each one, a quality out of 100 (a fixed sum: complete or partial, quotable alone, and whether the answer opens its passage), what is missing, and "add first" on the three weakest.

![The answer map: each question, whether the page answers it, the quality and what is missing](docs/ai-search-audit-full-answers-1280.png)

*Where on the page* carries a **heat**: each zone is shaded by its findings weighted by severity (blocking 8, high 4, medium 2, low 1), against the hottest zone; the site report's pages × problems grid is shaded the same way, with a page-heat row under it.

![Where on the page, with each zone shaded by the weight of its findings](docs/ai-search-audit-full-heat-1280.png)

![The history of a page: two runs, what changed between them, and every audit in the history](docs/ai-search-audit-full-history-1280.png)

How generated the text sounds, at the bottom of each page report: the Pattern score, the marker words, the swap test and every passage with its evidence. Not an authorship detector, and the block says so:

![How generated the text sounds](docs/ai-search-audit-full-generated-1280.png)

The site report:

![The site report of the example run](docs/ai-search-audit-full-site-1280.png)

Every report opens light, with a dark theme on the toggle, and reads in English, Ukrainian or Polish.

## Examples

Real runs in [`examples/`](examples): the pages were read on 17 October 2026 and audited again on 18 October with 2.109, which added *How generated the text sounds* (score 1, 2 and 0 of 100, no marker words, and 4 of 17, 4 of 17 and 5 of 18 passages generic on the three pages). The judgement files in [`examples/judgement/`](examples/judgement) were written by Claude Code running Claude Opus 5.5, which did not know GetLoopLoop from its own knowledge and said so; no product model was called.

- **A three-page site audit** of getlooploop.com: [the site report](examples/getlooploop-site/report/index.html) and its pages, [/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-vectorscope.html) (19 problems: 0 blocking · 0 high · 7 medium · 12 low), [/uk/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-uk-vectorscope.html) (21: 0 · 0 · 8 · 13) and [/es/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-es-vectorscope.html) (18: 0 · 0 · 7 · 11). 15 problems repeat across pages; across the site, no audited page links to another one.
- **Two history snapshots per page** in [`examples/history/`](examples/history), so the drift shows. The first run of /vectorscope and /uk/vectorscope read the copies of those pages saved on 16 October 2026 ([`examples/first-run/`](examples/first-run), with the site checks fetched live, marked "saved copy"); the second run read them live. One passage changed on each, and the report shows where. /es/vectorscope was read live twice, minutes apart: no change.
- **Before and after**: [/vectorscope against the Lite 2.101 export](examples/compare/vectorscope-compare.html) of the same page, made earlier the same day: 0 fixed, 1 new (the security headers check that Lite 2.102 added), 18 unchanged.

The reports open in English; add `#lang=uk` for Ukrainian or `#lang=pl` for Polish.

## Install

The skill needs Node 20.18 or later and **no `npm install`**: `dist/read.mjs` and `dist/audit.mjs` are bundled with everything they need.

### claude.ai and the Claude desktop app

1. Download **`ai-search-audit-full.zip`** from this repository's [Releases](https://github.com/Olexan-art/ai-search-audit-full/releases) or `gh release download v2.110 -R Olexan-art/ai-search-audit-full`. **Do not unpack it**: the upload takes the zip, with the `ai-search-audit-full` folder at its top level.
2. Turn on code execution: **Settings > Capabilities > Code execution and file creation**. On Team and Enterprise plans an owner controls it in Organization settings > Capabilities.
3. Upload: **Customize > Skills**, **+**, **Create skill**, **Upload a skill**, choose `ai-search-audit-full.zip`, and turn the skill on.
4. Let the sandbox reach the site: **Allow network egress** (Free, Pro, Max), or the owner's domain list on Team and Enterprise. A site audit makes the same requests as a page audit, for each page.
5. Ask: **"an AI search audit of https://example.com/page"**, or **"audit these pages of my site: …"**. Claude runs the scripts and hands you `report.html` (for a site, the report folder as a zip with `index.html` as the start).

Lite and Full have different names (`ai-search-audit`, `ai-search-audit-full`), so both can be installed side by side.

### Claude Code, Codex, opencode, Hermes Agent

```
gh repo clone Olexan-art/ai-search-audit-full
```

Copy `skills/ai-search-audit-full` into your agent's skills folder:

| Agent | Personal | Project |
|---|---|---|
| Claude Code | `~/.claude/skills/ai-search-audit-full` | `.claude/skills/ai-search-audit-full` |
| Codex | `~/.agents/skills/ai-search-audit-full` | `.agents/skills/ai-search-audit-full` |
| opencode | `~/.config/opencode/skills/ai-search-audit-full` (or the Claude or Codex folders) | `.opencode/skills/ai-search-audit-full` |
| Hermes Agent | `~/.hermes/skills/ai-search-audit-full` | `.hermes/skills/` after `hermes skills trust` |

```
mkdir -p ~/.claude/skills && cp -r ai-search-audit-full/skills/ai-search-audit-full ~/.claude/skills/
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse ai-search-audit-full\skills\ai-search-audit-full "$HOME\.claude\skills\ai-search-audit-full"
```

**Any other agent:** point its instructions file (for example `AGENTS.md`) at the skill:

```
For an SEO or AI search audit of a web page or a site, follow skills/ai-search-audit-full/SKILL.md and run its scripts from that folder.
```

**GLM** and other model families run inside one of these agents; install the skill for that agent.

Sources: [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude) · [Claude Code skills](https://code.claude.com/docs/en/skills) · [Codex skills](https://learn.chatgpt.com/docs/build-skills) · [opencode skills](https://opencode.ai/docs/skills) · [Hermes Agent skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills). Checked on 2026-10-16.

### No internet in the agent's shell

Cloud sandboxes often run the shell offline or keep the skills folder read-only. The skill does not need a skills folder: unpack `ai-search-audit-full.zip` anywhere the agent can write and point it at that folder (or attach the zip to the chat). With no network, save the page in your browser as "Web page, HTML only" and, if you can, its `robots.txt`, and give both files to the agent: the skill reads the saved copy and marks every check that needs the network as not checked.

## A run, in short

One page:

```
node dist/read.mjs https://example.com/page --out reading.json
# the agent writes questions.json, style.json, brand.json and reviews.json (schemas in references/judgement-files.md)
node dist/audit.mjs reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --check
node dist/audit.mjs reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --html report.html --md report.md --json export.json [--compare old-export.json]
```

A site (at most 50 pages):

```
node dist/read.mjs --urls urls.txt --out-dir readings          # or: --sitemap https://example.com/sitemap.xml
# the agent writes questions/<page>.json and style/<page>.json for each page, and brand.json and reviews.json once
node dist/audit.mjs --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --out-dir report
```

**Politeness:** pages are read one at a time, at least 1 second apart (`--delay`, never under 500 ms), longer when robots.txt sets a `Crawl-delay` (up to 10 s), and only where robots.txt lets `GetLoopLoop` (else `*`) fetch; a robots.txt that does not answer means no page of that site is read. Requests repeated across pages (robots.txt, the sitemap, shared links) are answered from memory.

**History:** every `audit.mjs` run saves its export under `~/.ai-search-audit/history/<host>/<path>/<date>.json` (or `$AI_SEARCH_AUDIT_HISTORY`; `--history dir` for another folder, `--no-history` for none). The folder is the user's own, never the skill's, so updating the skill keeps it; a folder an older version left in the working directory is copied in. Every report also carries the whole history, so where a chat's disk does not survive (claude.ai, a fresh Cowork sandbox), the next run takes it back from an earlier report: `--history-from report.html` (or a folder of reports, exports or `site.json`), whichever page or site it was about. Auditing the same reading again rewrites its snapshot. Delete the folder to delete the history.

### This skill's own thresholds

Lite's thresholds apply unchanged; they are listed in the [Lite README](https://github.com/Olexan-art/ai-search-audit#this-skills-own-thresholds). Full adds, for a site: at most 50 pages; a page more than 3 clicks from the home page within the audited set; a page under 30% of the audited pages' median word count, from 4 pages; the link-graph checks from 3 pages; the timeline's last 20 runs; up to 8 passages listed each way in the drift. Each is a named constant in `skills/ai-search-audit-full/scripts/lib/`.

## What it cannot see

- **Field data and the index:** Core Web Vitals and "in Google's index" are always *not measured*.
- **What assistants answer today:** the brand and review readings are one model's knowledge, not a measurement of any assistant.
- **Pages behind a login, local or private addresses.**
- **Whole sites:** at most 50 pages; site-wide checks see the audited pages only (an orphan here may be linked from a page outside the set).
- **JavaScript, unless asked** (`--render`, or automatically for an empty app shell, with a local Chrome).
- **Everything past a cap:** every cap is named in the report.

For live assistants, answer volatility, embeddings and Search Console, see [GetLoopLoop](https://www.getlooploop.com).

## Asking your agent

A short request with a clear stop condition and a reply format keeps the agent on the procedure. Copy it and put in your page:

```markdown
## Task
Run the skill `ai-search-audit-full` on 1 page (or on the pages in urls.txt). Write its report.

## Inputs
- Page: https://example.com/page
- Working folder: ./audit
- Earlier reports (optional): ./old-reports

## Rules
1. Read SKILL.md first. Follow it exactly.
2. Write every file into the working folder.
3. Pass every earlier report with --history-from.

## Stop condition
Stop when report.html exists. Show it.

## Reply format
- The report link or path.
- What changed since the last run, and the 3 biggest problems.
```

## Working on the skill

```
cd skills/ai-search-audit-full
npm install          # cheerio, and esbuild for the build
npm run build        # scripts/ → dist/
npm test             # 227 tests, including dist equals a fresh build
npm run verify-rules # network: every rule quote matched against its live page
npm run zip          # dist-release/ai-search-audit-full.zip
```

To take a new Lite release: apply Lite's diff since the last one onto `skills/ai-search-audit-full` (the folder is renamed), then write explanations for any new codes; `tests/explain.test.mjs` fails until every code has them.

## Licence

MIT, as the Lite: see [LICENSE](LICENSE). The vendored Vectorscope code keeps its MIT licence ([`scripts/vendor/vectorscope/LICENSE`](skills/ai-search-audit-full/scripts/vendor/vectorscope/LICENSE)), and the favicons their [notice](skills/ai-search-audit-full/assets/favicons/NOTICE.txt).
