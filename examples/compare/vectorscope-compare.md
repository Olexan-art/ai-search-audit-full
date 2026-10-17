# AI Search Audit Full: https://www.getlooploop.com/vectorscope

Semantic Chunking Visualizer for Any URL — Vectorscope · checked 17 Oct 2026 · skill 2.103

**Nothing hides text from AI** · 19 problems (blocking 0, high 0, medium 7, low 12)

Every problem has a plain description and what the rule says (a quote checked against its source, or this skill's rule). Fix directions for specialists are under each problem, marked as such. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such. No score.

> Brand, reviews and questions: one model's view (Claude Opus 5.5), from its own knowledge, not ChatGPT, Gemini or Perplexity. The web Brandscope and Reviewscope ask three assistants.

Main phrase: “Semantic chunking” (read off the h1).

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 7 |
| AI finds it? | OK | 0 |
| AI reads all of it? | Problems | 2 |
| AI quotes it right? | Problems | 8 |
| AI gets the brand right? | Problems | 1 |
| Languages in order? | OK | 1 |

## Biggest problems

1. **Medium** · 2 broken links · `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card`
   Links on the page lead to an error page. People who follow them hit a dead end, and search engines drop such addresses from their index.
2. **Medium** · Required schema fields missing · `JSON-LD #2 $`
   Structured data on the page leaves out properties that Google lists as required for its type. Without them the markup is not eligible for the rich result it was written for.
3. **Medium** · 2 passages start mid-sentence · `passages #6, #14`
   Some passages begin in the middle of a sentence, because a long section was cut into pieces. Read on its own, such a passage makes little sense, and AI answers quote passages on their own.
4. **Medium** · No answer: “Can I paste a link to a PDF instead o…” · `question 11 · no passage` · *Agent's judgement · Claude Opus 5.5*
   A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.
5. **Medium** · No answer: “The page I need is behind a login on …” · `question 12 · no passage` · *Agent's judgement · Claude Opus 5.5*
   A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.

## All problems

### For the developer (4)

#### 2. Required schema fields missing · Medium

Structured data on the page leaves out properties that Google lists as required for its type. Without them the markup is not eligible for the rich result it was written for.

- **What the rule says:** “You must include all the required properties for an object to be eligible for appearance in Google Search with enhanced display.” — [Google Search Central: introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), checked 2026-10-17
- **Where:** `JSON-LD #2 $` · layer: Measured · code `schema_required_missing`
- *Fix direction, for specialists:* Add each listed required property as the type's Google page names it, then re-test.

#### 6. Menu lines inside the text · Medium

A run of short, menu-like lines sits inside the main text. AI readers keep it as content, and it breaks up the passage around it.

- **What the rule says:** “The nav element represents a section of a page that links to other pages or to parts within the page: a section with navigation links.” — [HTML Standard: the nav element](https://html.spec.whatwg.org/multipage/sections.html#the-nav-element), checked 2026-10-17
- **Where:** `passage #1` · layer: Measured · code `nav_in_content`
- *Fix direction, for specialists:* Wrap link lists in <nav> (or <aside>) outside the main text flow.

#### 16. 131 KB, 40 scripts · Low

The page's HTML is very large, or it loads many scripts. All of it has to be downloaded and parsed before the text is ready, which is slow on phones and costly for crawlers.

- **What the rule says:** This skill's rule: HTML over 500 KB, or more than 30 scripts, is a heavy page. The threshold is this skill's; speed for real visitors is what Core Web Vitals measure, and this check does not read them.
- **Where:** `HTML` · layer: Derived · code `page_weight_heavy`
- *Fix direction, for specialists:* Cut inline JSON, SVG and CSS bulk; defer, async or drop scripts; lazy-load widgets below the fold.

#### 18. 3 security headers missing · Low

The answer lacks one or more common security headers: framing control, X-Content-Type-Options or Referrer-Policy. This does not hide the page from search; it leaves the browser's protections at their defaults.

- **What the rule says:** “The header allows you to avoid MIME type sniffing by specifying that the MIME types are deliberately configured.” — [MDN: X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options), checked 2026-10-17
- **Where:** `Content-Security-Policy, X-Content-Type-Options, frame-ancestors` · layer: Measured · code `security_headers_missing`
- *Fix direction, for specialists:* Send Content-Security-Policy: frame-ancestors 'self' (or X-Frame-Options), X-Content-Type-Options: nosniff and a Referrer-Policy such as strict-origin-when-cross-origin.

### For the content writer (11)

#### 1. 2 broken links · Medium

Links on the page lead to an error page. People who follow them hit a dead end, and search engines drop such addresses from their index.

- **What the rule says:** “In the case of Google Search, Google doesn't index URLs that return a 4xx status code, and URLs that are already indexed and return a 4xx status code are removed from the index.” — [Google Crawling Infrastructure: HTTP status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes), checked 2026-10-17
- **Where:** `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card` · layer: Measured · code `broken_links`
- *Fix direction, for specialists:* Update or remove hrefs that return 4xx or 5xx; 301 moved targets to their new URL.

#### 3. 2 passages start mid-sentence · Medium

Some passages begin in the middle of a sentence, because a long section was cut into pieces. Read on its own, such a passage makes little sense, and AI answers quote passages on their own.

- **What the rule says:** This skill's rule: The Vectorscope reading cuts the kept text at h2 sections, then into 2,000-character windows; a passage that opens inside a sentence is flagged. This is this skill's rule.
- **Where:** `passages #6, #14` · layer: Derived · code `mid_sentence_start`
- *Fix direction, for specialists:* Break long sections with more h2 or h3 headings so that cuts fall at headings; keep sections under about 2,000 characters.

#### 4. No answer: “Can I paste a link to a PDF instead o…” · Medium

A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.

- **What the rule says:** This skill's rule: The agent writes the questions people ask and judges each against the passages; one that no passage answers is flagged. The questions and verdicts are the agent's judgement, and the quote is checked against the passage.
- **Where:** `question 11 · no passage` · layer: Agent's judgement · Claude Opus 5.5 · code `question_missing`
- *Fix direction, for specialists:* Add a passage, ideally under its own h2 or h3, that answers the question directly in its first two sentences.

#### 5. No answer: “The page I need is behind a login on …” · Medium

A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.

- **What the rule says:** This skill's rule: The agent writes the questions people ask and judges each against the passages; one that no passage answers is flagged. The questions and verdicts are the agent's judgement, and the quote is checked against the passage.
- **Where:** `question 12 · no passage` · layer: Agent's judgement · Claude Opus 5.5 · code `question_missing`
- *Fix direction, for specialists:* Add a passage, ideally under its own h2 or h3, that answers the question directly in its first two sentences.

#### 8. Answered in part: “Can I check a page from my phone with…” · Low

A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.

- **What the rule says:** This skill's rule: The agent judges each question against the passages; a passage that helps but leaves part of the answer out is a partial answer. The verdict is the agent's judgement.
- **Where:** `question 4 · passage #1` · layer: Agent's judgement · Claude Opus 5.5 · code `question_partial`
- *Fix direction, for specialists:* Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.

#### 9. 1 very short section · Low

Some sections have a heading and almost no text. They promise a topic and give a reader, or an AI, nothing to quote about it.

- **What the rule says:** This skill's rule: An h2 section with fewer than 150 characters of text is flagged. This is this skill's rule (the Vectorscope reading).
- **Where:** `h2 “Important passage outside the cap?”` · layer: Measured · code `thin_section`
- *Fix direction, for specialists:* Expand the section with substance, or merge it into a neighbouring one.

#### 10. Answered in part: “My launch page goes live tomorrow: wi…” · Low

A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.

- **What the rule says:** This skill's rule: The agent judges each question against the passages; a passage that helps but leaves part of the answer out is a partial answer. The verdict is the agent's judgement.
- **Where:** `question 1 · passage #5` · layer: Agent's judgement · Claude Opus 5.5 · code `question_partial`
- *Fix direction, for specialists:* Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.

#### 11. Answered in part: “Our site is a React app. Will the tex…” · Low

A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.

- **What the rule says:** This skill's rule: The agent judges each question against the passages; a passage that helps but leaves part of the answer out is a partial answer. The verdict is the agent's judgement.
- **Where:** `question 9 · passage #5` · layer: Agent's judgement · Claude Opus 5.5 · code `question_partial`
- *Fix direction, for specialists:* Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.

#### 12. 2 sentences of one shape · Low

Many sentences follow the same shape. Text like that reads as templated, and the repetition hides which sentence carries the point.

- **What the rule says:** This skill's rule: The PatternScope's detectors flag sentences that repeat one structure. A signal about worn writing, not an AI detector; this skill's rule.
- **Where:** `passage #7 · word 892, passage #15 · word 2303` · layer: Measured · code `repeated_sentence_shape`
- *Fix direction, for specialists:* Vary the sentence structure; merge or cut the templated sentences.

#### 13. Answered in part: “I have twenty pages to check before F…” · Low

A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.

- **What the rule says:** This skill's rule: The agent judges each question against the passages; a passage that helps but leaves part of the answer out is a partial answer. The verdict is the agent's judgement.
- **Where:** `question 10 · passage #14` · layer: Agent's judgement · Claude Opus 5.5 · code `question_partial`
- *Fix direction, for specialists:* Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.

#### 19. No contact link · Low

The page has no link to an About or a Contact page. Readers and search engines look for who stands behind a site, and these pages are where they find it.

- **What the rule says:** “background about the author or the site that publishes it, such as through links to an author page or a site's About page” — [Google Search Central: creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), checked 2026-10-17
- **Where:** `contact link` · layer: Measured · code `about_contact_missing`
- *Fix direction, for specialists:* Link About and Contact from the header or the footer of every page.

### For SEO (4)

#### 7. AI doesn't know the brand · Medium

The model does not know the brand at all. An assistant answering from memory cannot describe it and depends entirely on what it can find and read.

- **What the rule says:** This skill's rule: When all five of the model's answers say it does not know the brand, the brand is unknown to that model. One model's judgement; fixed rules from Brandscope.
- **Where:** `brand questions 1–5` · layer: Agent's judgement · Claude Opus 5.5 · code `brand_unknown`
- *Fix direction, for specialists:* Make the basics explicit on key pages (what it is, for whom, the price) and earn mentions on independent sources.

#### 14. FAQ rich result retired · Low

The page has FAQPage markup, and Google no longer shows FAQ rich results. The markup does no harm, but it no longer earns the expanded result it was once added for.

- **What the rule says:** “The FAQ rich result feature is no longer shown in Google Search results” — [Google Search Central: documentation updates (FAQ rich result, 7 May 2026)](https://developers.google.com/search/updates), checked 2026-10-17
- **Where:** `FAQPage` · layer: Measured · code `faq_rich_result_retired`
- *Fix direction, for specialists:* Nothing required for Google; keep it if another consumer reads it, or remove it to lighten the page.

#### 15. How-to: no rich result any more · Low

The page carries markup for a rich result that Google has retired. The markup is not an error, but it no longer produces a special result in Google Search.

- **What the rule says:** “Removed the How-to structured data documentation, as this rich result is no longer shown in search results, on both desktop and mobile devices.” — [Google Search Central: documentation updates (FAQ rich result, 7 May 2026)](https://developers.google.com/search/updates), checked 2026-10-17
- **Where:** `HowTo` · layer: Measured · code `rich_result_retired`
- *Fix direction, for specialists:* Optional clean-up: drop the retired type unless another consumer needs it.

#### 17. llms.txt: one language only · Low

The site's llms.txt points only to pages in one language, though this page has other language versions. Agents that start from llms.txt see the site in one language.

- **What the rule says:** This skill's rule: On a site with several language versions, llms.txt is expected to point to more than one of them. The llms.txt proposal says nothing about languages; this is this skill's rule.
- **Where:** `/llms.txt` · layer: Measured · code `llms_txt_one_language`
- *Fix direction, for specialists:* List each language's key pages in llms.txt, or publish one llms.txt per locale and link them.


## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero · problems 6, 8
3. Sidebar · unseen
4. What does this mean?
5. Important passage outside the cap? · problems 9
6. Models and retrieval caps vary.
7. How to read your result · problems 3, 10, 11
8. What is semantic chunking? · problems 12
9. Is my content ready for AI search?
10. Using Vectorscope to test a RAG pipeline
11. Who is Vectorscope for?
12. Words used on this page
13. 4 more sections · problems 1, 3, 12, 13
14. Footer

**`<head>`**

- title: 54 characters
- meta description: 152 characters
- canonical: /vectorscope
- meta robots: index, follow · index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1
- hreflang: en · uk · es · x-default
- html lang: en
- JSON-LD: Organization, WebSite +6 · problems 2, 14, 15
- Open Graph: 4 of 4 tags
- viewport: set
- scripts: 40 · 1 blocking · problems 16
- favicon: loads

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: present · 32 links · problems 17
- Markdown copy: none
- ai-catalog.json: none

## Google and Bing checks

| Check | State |
|---|---|
| HTTP status and redirects | Passed |
| Served over HTTPS | Passed |
| Googlebot and Bingbot may fetch the page | Passed |
| Not marked noindex | Passed |
| One absolute canonical to the page itself | Passed |
| Listed in the sitemap | Passed |
| In Google's index | Not measured |
| Title present, 10–60 characters | Passed |
| A different title per language version | Passed |
| Description present, 70–160 characters | Passed |
| Open Graph and Twitter card tags | Passed |
| One h1 | Passed |
| No skipped heading levels | Passed |
| Images carry alt | Not on this page |
| html lang declared | Passed |
| A readable URL | Passed |
| Internal links present | Passed |
| Links say where they lead, #links have a target, no nofollow inside the site | Passed |
| Links answer without errors | Problem |
| A mobile viewport | Passed |
| HTML size and scripts | Warning |
| Core Web Vitals from real users | Not measured |
| hreflang versions link back | Passed |
| FAQPage markup | Warning |
| BreadcrumbList markup | Passed |
| Image sizes, formats, lazy loading, srcset | Not on this page |
| Eligible for a snippet (no nosnippet, max-snippet:0) | Passed |
| A favicon that loads | Passed |
| WebSite name markup on the home page | Not on this page |
| No http:// resources on https | Passed |
| A missing page answers 404 | Passed |
| http, www and slash variants end at the page | Passed |
| Strict-Transport-Security header | Passed |
| Compression, Cache-Control and security headers | Warning |
| Author, About, Contact, organisation, dates, privacy and terms | Warning |

## Bots in robots.txt (path `/vectorscope`)

| Bot | Vendor | Purpose | Verdict | Rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | search | allowed | `Allow: /vectorscope` |
| ChatGPT-User | OpenAI | a user's question | allowed | `Allow: /vectorscope` |
| GPTBot | OpenAI | training | allowed | `Allow: /vectorscope` |
| Claude-SearchBot | Anthropic | search | allowed | `Allow: /vectorscope` |
| Claude-User | Anthropic | a user's question | allowed | `Allow: /vectorscope` |
| ClaudeBot | Anthropic | training | allowed | `Allow: /vectorscope` |
| PerplexityBot | Perplexity | search | allowed | `Allow: /vectorscope` |
| Perplexity-User | Perplexity | a user's question | allowed | `Allow: /vectorscope` |
| Google-Extended | Google | training | allowed | `Allow: /vectorscope` |
| Googlebot | Google | web index | allowed | `Allow: /vectorscope` |
| Bingbot | Microsoft | web index | allowed | `Allow: /vectorscope` |
| CCBot | Common Crawl | training | allowed | `Allow: /vectorscope` |

## Language versions

x-default: yes

| Lang | Title | Description | hreflang | Same facts |
|---|---|---|---|---|
| en (this page) | Passed | Passed | Passed | Passed |
| uk | Passed | Passed | Passed | Passed |
| es | Passed | Passed | Passed | Passed |

## Where the text goes (characters)

| Stage | Characters |
|---|---|
| Raw HTML | 48,146 |
| Removed | 34,177 |
| Kept | 13,969 |
| In passages | 13,595 |
| Not in passages | 374 |
| Past the cap | 0 |

17 of 26 passages.

## Not checked

- 4 sections drawn as one zone on the map

## Before and after (since 17 Oct 2026)

0 fixed · 1 new · 18 unchanged

- new: 3 security headers missing (`security_headers_missing`)

## What this check cannot see

- What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews: [Brandscope](https://www.getlooploop.com/brandscope) · [Reviewscope](https://www.getlooploop.com/reviewscope)
- How their answers change from day to day: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user speed, sites over 50 pages: [GetLoopLoop](https://www.getlooploop.com)
