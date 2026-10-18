Read this when a fetch fails, the shell has no network, the skill folder is read-only, the user gives a saved copy, or the user asks what the skill requests or what its limits are.

# Network, limits, saved copies and offline runs

## What is requested

**Per page,** `read.mjs` requests:

- the page;
- the site's `/robots.txt`;
- its sitemap: the robots.txt `Sitemap:` lines on the same site, else `/sitemap.xml`, and at most 5 child sitemaps of an index;
- `/llms.txt`;
- its hreflang alternates, at most 10;
- a HEAD (or a bodiless GET) of at most 30 links and at most 20 images;
- 1 request each for: the favicon, a path that does not exist (the soft-404 check), at most 3 URL variants (http, www or not, the trailing slash), a Markdown copy of the page, `/.well-known/ai-catalog.json` (then `/ai-catalog.json`), and the IndexNow key file only when the page declares one;
- before the page: 1 DNS lookup of its host, and 1 RDAP request to `rdap.org` (`https://rdap.org/ip/<the site's IP address>`) for the country of its server. That request sends the site's IP address and nothing of the page. A saved page (`--html`) makes neither.
- An empty single-page-app shell is also rendered in a local Chrome or Chromium (see *Limits*).

Nothing else. The report and the export show every cap.

**Per site:**

- The same for each page; the DNS lookup and the RDAP request once per host.
- At most 50 pages, 1 at a time.
- The pause between pages is 1 second by default, at least 0.5 seconds (`--delay` in milliseconds). A robots.txt `Crawl-delay` makes it longer, up to 10 seconds.
- Only pages robots.txt allows this skill's crawler (`GetLoopLoop`, else the `*` group) to fetch.
- A request already answered in the run (robots.txt, the sitemap, shared links) is answered from memory.

Nothing is uploaded. There is no server of ours and no account. The history is a folder of JSON files in the user's own folder.

## Limits

- 1 public URL per page audit, at most 50 per site audit. The site report lists every page past the cap, closed by robots.txt, listed twice or not a web address, with its reason.
- The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s), on every redirect hop (at most 5) of every request.
- No login, no cookies, no Accept-Language. A site that picks a language by location may answer in another language.
- No JavaScript in the reading. `--render`, or an empty app shell, also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile. The map draws the sections only the render has as dashed zones. With no browser, the report says the render was not done.
- Timeouts: 12 seconds per request; 8 for a link, an image or a site check.
- Size ceilings: 3,000,000 characters of HTML; 10 MB for a sitemap; 1 MB for llms.txt, the Markdown copy and ai-catalog.json.
- The brand and review readings are 1 model's knowledge at its training time. They do not measure any assistant, and say nothing about what ChatGPT, Gemini or Perplexity answer today.
- The rule quotes were checked against their pages on the date each one shows; a source can change. `node tools/verify-rules.mjs` in a repository checkout checks them again.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`.
- The readable source is `scripts/` in the repository, built into `dist/` with esbuild. Tests: `npm test` in the skill folder of a repository checkout.

## A saved copy

- `node "$SKILL/dist/read.mjs" <url> --html saved.html --final-url <url> --out reading.json` audits a saved copy. Add `--robots saved-robots.txt` for its robots.txt.
- Nothing is fetched. The sitemap, llms.txt, language versions, links, images and site checks are reported as not measured.
- `--network` fetches those site checks live around the saved copy.
- `--saved-at <ISO date>` dates the reading at the time the copy was taken, so the history puts it in its place. The report marks it "saved copy".
- `--save-html page.html` keeps the fetched copy of a live read.

## No network in the shell, or a read-only skill folder

Some agents run their shell with no internet (cloud sandboxes such as Codex in the cloud or ChatGPT), or cannot write to their skills folder.

- **Read-only skills folder:** unpack `ai-search-audit-full.zip` (or copy this folder) into any writable directory, such as the working directory, and use it as `$SKILL`. Nothing needs installing. Copying file by file (for example through a file connector) works if `dist/` comes whole, `dist/chunks/` included; no file in it is over 700 KB.
- **No files at all** (no network, downloads blocked): ask the user to attach `ai-search-audit-full.zip` from the repository's Releases, and wait.
- **No network in the shell:** `read.mjs` prints `REFUSED unreachable`. Ask the user for a saved copy: the page saved from their browser as "Web page, HTML only" (Ctrl+S, or Cmd+S on a Mac), and, if they can, `<site>/robots.txt` saved as text. Then run `node "$SKILL/dist/read.mjs" <url> --html page.html --robots robots.txt --out reading.json` and continue with step 2.
  - Without `--robots`, robots.txt is reported as not checked.
  - Every check that needs the network (sitemap, llms.txt, language versions, links, images, site checks) is reported as not checked. The report says it read a saved copy.
  - A site audit needs the network. Offline, audit 1 page at a time.
- **Only files the user gives you.** Do not make the saved copy with a browsing or fetch tool: those return text or Markdown converted from the page, not its HTML. Do not do the scripts' checks by hand.

## If the page cannot be fetched

When a request fails, `read.mjs` prints `REFUSED unreachable` or another refusal code. In a sandbox, tell the user what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows.
  - Free, Pro and Max plans: **Allow network egress** (Settings > Capabilities).
  - Team and Enterprise plans: an owner sets it in Organization settings > Capabilities (off, package managers only, package managers and specific domains, or all domains). With specific domains, the page's domain must be listed.
  - If the plan's setting cannot allow the site, tell the user that this page cannot be audited from claude.ai, and that the same skill runs in Claude Code or another agent on their own machine. Then stop.
- **Behind a proxy:** if `HTTPS_PROXY` or `HTTP_PROXY` is set and the fetch is `unreachable`, run `read.mjs` once more with `NODE_USE_ENV_PROXY=1` in front (Node 22.21 or later, or 24 or later).
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Tell the user which code came back, and stop.

## Refusal codes

The table of codes and the line to tell the user is in `SKILL.md`, section *Refusal codes*. For `refused_ru_domain`, `refused_ru_hosting`, `refused_ru_audience` and `refused_language_ru`: 1 line in the chat, the report, nothing more.
