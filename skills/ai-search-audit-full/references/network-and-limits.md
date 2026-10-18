# Network, limits, saved copies and offline runs

Read this when a fetch fails, the shell has no network, the skill folder is read-only, the user gives a saved copy, or the user asks what the skill requests or where its limits are.

## What is requested

**Per page:** the read makes requests to the page, its site's `/robots.txt`, its sitemap (the robots.txt `Sitemap:` lines on the same site, else `/sitemap.xml`, and at most 5 child sitemaps of an index), `/llms.txt`, its hreflang alternates (at most 10), a HEAD (or a bodiless GET) of at most 30 of its links and at most 20 of its images, and one request each for the favicon, a path that does not exist (the soft-404 check), at most 3 URL variants (http, www or not, the trailing slash), a Markdown copy of the page, `/.well-known/ai-catalog.json` (then `/ai-catalog.json`) and, only when the page declares one, its IndexNow key file. Before the page, one DNS lookup of its host and one RDAP request to `rdap.org` (`https://rdap.org/ip/<the site's IP address>`) for the country its server is registered in: that request sends the site's IP address to rdap.org and nothing of the page, and a saved page (`--html`) makes neither. When the page is an empty single-page-app shell, it is also rendered in a local Chrome or Chromium (see *Limits*). Nothing else, and every cap is reported in the report and the export.

**For a site:** the same for each page (the DNS lookup and the RDAP request once per host), at most 50 pages, read one at a time with a pause between pages of 1 second by default and never less than 0.5 seconds (`--delay` in milliseconds; longer when robots.txt asks for a `Crawl-delay`, up to 10 seconds), and only pages robots.txt allows this skill's crawler (`GetLoopLoop`, else the `*` group) to fetch. A request already answered in the run (robots.txt, the sitemap, links shared by the pages) is answered from memory instead of being sent again.

Nothing is uploaded: there is no server of ours and no account, and the only requests are the ones listed above. The history is a folder of JSON files in the user's own folder.

## Limits

- One public URL per page audit, at most 50 per site audit; every page past the cap, closed by robots.txt, listed twice or not a web address is listed in the site report with its reason. The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s), on every redirect hop (5 at most) of every request.
- No login and no cookies; no Accept-Language, so a site that picks a language by location may answer in another language.
- No JavaScript in the reading. `--render`, or an empty app shell, also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile, and draws the sections only the render has as dashed zones on the map. With no browser, the report says the render was not done.
- 12-second timeout per request (8 for a link, an image or a site check), 3,000,000-character ceiling for HTML, 10 MB for a sitemap, 1 MB for llms.txt, the Markdown copy and ai-catalog.json.
- The brand and review readings are one model's knowledge at its training time; they are not a measurement of any assistant, and they say nothing about what ChatGPT, Gemini or Perplexity answer today.
- The rule quotes were checked against their pages on the date each one shows; a source can change after that. `node tools/verify-rules.mjs` in a repository checkout checks them all again.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`.
- The readable source is `scripts/` in the repository, built into `dist/` with esbuild; tests: `npm test` in the skill folder of a repository checkout.

## A saved copy

`node "$SKILL/dist/read.mjs" <url> --html saved.html --final-url <url> --out reading.json` audits a saved copy instead (add `--robots saved-robots.txt` for its robots.txt); then nothing is fetched, and the sitemap, llms.txt, language versions, links, images and site checks are reported as not measured. Add `--network` to fetch those site checks live around the saved copy, and `--saved-at <ISO date>` to date the reading when the copy was taken, so the history puts it in its place; the report marks it "saved copy". `--save-html page.html` keeps the fetched copy of a live read.

## No network in the shell, or nowhere to install

Some agents run their shell with no internet (cloud sandboxes such as Codex in the cloud or ChatGPT), or cannot write to their skills folder.

- **The skill folder can live anywhere.** If the agent's skills folder is read-only, unpack `ai-search-audit-full.zip` (or copy this folder) into any directory you can write, such as the working directory, and use that folder as `$SKILL`. Nothing needs installing. Copying file by file (through a file connector, say) works too, as long as `dist/` comes whole, `dist/chunks/` included; no file in it is over 700 KB. If you cannot get the files at all (no network, downloads blocked), ask the user to attach `ai-search-audit-full.zip` from the repository's Releases, and wait.
- **No network in the shell:** read.mjs prints `REFUSED unreachable`. Ask the user for a saved copy: the page saved from their browser as "Web page, HTML only" (Ctrl+S, or Cmd+S on a Mac), and, if they can, the site's robots.txt (open `<site>/robots.txt` and save it as text). Then run `node "$SKILL/dist/read.mjs" <url> --html page.html --robots robots.txt --out reading.json` and go on with step 2. Without `--robots`, robots.txt is reported as not checked. Every check that needs the network (the sitemap, llms.txt, the language versions, links, images and the site checks) is then reported as not checked. A site audit needs the network; offline, audit one page at a time. The report says it read a saved copy.
- **Only files the user gives you.** Do not make the saved copy yourself with a browsing or fetch tool: those return text or Markdown converted from the page, not its HTML, and the reading would not be the page's. And do not fill in for the scripts: a check made by hand is not this tool's result.

## If the page cannot be fetched

When a request fails, read.mjs prints `REFUSED unreachable` (or another refusal code). In a sandbox, say what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows. On Free, Pro and Max plans the setting is **Allow network egress** (Settings > Capabilities); on Team and Enterprise plans an owner sets it in Organization settings > Capabilities (off, package managers only, package managers and specific domains, or all domains; with specific domains, the page's domain must be listed). If the plan's setting cannot allow the site, say that this page cannot be audited from claude.ai, and that the same skill runs in Claude Code or another agent on the user's own machine. Then stop.
- **Behind a proxy:** if `HTTPS_PROXY` or `HTTP_PROXY` is set and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front (Node 22.21 or later, or 24 or later).
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Say which code came back and stop.

## Refusal codes

What each `REFUSED <code>` from read.mjs means, in the words to tell the user:

| Code | Tell the user |
|---|---|
| `invalid_url` | That does not look like a web address. Ask for the full URL of a page. |
| `blocked_scheme` | Only http and https pages can be read. |
| `blocked_host`, `blocked_address` | That address is not a page on the public web: localhost, a private network, or a non-standard port. |
| `unreachable` | The page could not be reached. It may be down, or the name does not resolve. |
| `http_error` | The page answered with an error status (in the reading), or redirected more than 5 times. |
| `blocked` | The site turns automated readers away (HTTP 401, 403 or 429); retrying will not help. |
| `not_html` | The URL is a file such as a PDF or an image, not an HTML page. |
| `too_large` | The page is over the 3 MB ceiling. |
| `empty` | The page answered, but no readable text was left once navigation and boilerplate were removed. |
| `refused_ru_domain` | The address is in a Russian domain zone (.ru, .su, .рф, .москва, .moscow), and this tool does not analyse it; the page was not fetched. One line in the chat, the report, nothing more. |
| `refused_ru_hosting` | The site is hosted in Russia (RDAP gives its server's country as RU), and this tool does not analyse it; the page was not fetched. One line in the chat, the report, nothing more. |
| `refused_ru_audience` | The site has a Russian-language version (an hreflang alternate, og:locale or Content-Language declares a Russian version), and this tool does not analyse it. One line in the chat, the report, nothing more. |
| `refused_language_ru` | The page is in Russian, and this tool does not analyse pages in Russian. One line in the chat, the report, nothing more. |
