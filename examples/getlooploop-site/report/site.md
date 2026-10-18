# AI Search Audit Full: site audit, 3 pages

**No page has a blocking problem or hides text from AI** · 3 of 3 pages evaluated (cap 50) · skill 2.109

## Pages

| # | Page | Problems | Blocking · high · medium · low | Report |
|---|---|---|---|---|
| 1 | https://www.getlooploop.com/vectorscope | 19 | 0 · 0 · 7 · 12 | pages/getlooploop-com-vectorscope.html |
| 2 | https://www.getlooploop.com/uk/vectorscope | 21 | 0 · 0 · 8 · 13 | pages/getlooploop-com-uk-vectorscope.html |
| 3 | https://www.getlooploop.com/es/vectorscope | 18 | 0 · 0 · 7 · 11 | pages/getlooploop-com-es-vectorscope.html |

## Problems repeated across pages

### AI doesn't know the brand · Medium · 3 pages

The model does not know the brand at all. An assistant answering from memory cannot describe it and depends entirely on what it can find and read.

- Pages: 1, 2, 3
- Code: `brand_unknown` · *Fix direction, for specialists:* Make the basics explicit on key pages (what it is, for whom, the price) and earn mentions on independent sources.

### Broken links · Medium · 3 pages

Links on the page lead to an error page. People who follow them hit a dead end, and search engines drop such addresses from their index.

- Pages: 1, 2, 3
- Code: `broken_links` · *Fix direction, for specialists:* Update or remove hrefs that return 4xx or 5xx; 301 moved targets to their new URL.

### Passages start mid-sentence · Medium · 3 pages

Some passages begin in the middle of a sentence, because a long section was cut into pieces. Read on its own, such a passage makes little sense, and AI answers quote passages on their own.

- Pages: 1, 2, 3
- Code: `mid_sentence_start` · *Fix direction, for specialists:* Break long sections with more h2 or h3 headings so that cuts fall at headings; keep sections under about 2,000 characters.

### Menu lines inside the text · Medium · 3 pages

A run of short, menu-like lines sits inside the main text. AI readers keep it as content, and it breaks up the passage around it.

- Pages: 1, 2, 3
- Code: `nav_in_content` · *Fix direction, for specialists:* Wrap link lists in <nav> (or <aside>) outside the main text flow.

### A question with no answer · Medium · 3 pages

A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.

- Pages: 1, 2, 3
- Code: `question_missing` · *Fix direction, for specialists:* Add a passage, ideally under its own h2 or h3, that answers the question directly in its first two sentences.

### Required schema fields missing · Medium · 3 pages

Structured data on the page leaves out properties that Google lists as required for its type. Without them the markup is not eligible for the rich result it was written for.

- Pages: 1, 2, 3
- Code: `schema_required_missing` · *Fix direction, for specialists:* Add each listed required property as the type's Google page names it, then re-test.

### No About or Contact link · Low · 3 pages

The page has no link to an About or a Contact page. Readers and search engines look for who stands behind a site, and these pages are where they find it.

- Pages: 1, 2, 3
- Code: `about_contact_missing` · *Fix direction, for specialists:* Link About and Contact from the header or the footer of every page.

### FAQ rich result retired · Low · 3 pages

The page has FAQPage markup, and Google no longer shows FAQ rich results. The markup does no harm, but it no longer earns the expanded result it was once added for.

- Pages: 1, 2, 3
- Code: `faq_rich_result_retired` · *Fix direction, for specialists:* Nothing required for Google; keep it if another consumer reads it, or remove it to lighten the page.

### llms.txt in one language only · Low · 3 pages

The site's llms.txt points only to pages in one language, though this page has other language versions. Agents that start from llms.txt see the site in one language.

- Pages: 1, 2, 3
- Code: `llms_txt_one_language` · *Fix direction, for specialists:* List each language's key pages in llms.txt, or publish one llms.txt per locale and link them.

### Heavy page · Low · 3 pages

The page's HTML is very large, or it loads many scripts. All of it has to be downloaded and parsed before the text is ready, which is slow on phones and costly for crawlers.

- Pages: 1, 2, 3
- Code: `page_weight_heavy` · *Fix direction, for specialists:* Cut inline JSON, SVG and CSS bulk; defer, async or drop scripts; lazy-load widgets below the fold.

### A question answered in part · Low · 3 pages

A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.

- Pages: 1, 2, 3
- Code: `question_partial` · *Fix direction, for specialists:* Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.

### Retired rich result · Low · 3 pages

The page carries markup for a rich result that Google has retired. The markup is not an error, but it no longer produces a special result in Google Search.

- Pages: 1, 2, 3
- Code: `rich_result_retired` · *Fix direction, for specialists:* Optional clean-up: drop the retired type unless another consumer needs it.

### Security headers missing · Low · 3 pages

The answer lacks one or more common security headers: framing control, X-Content-Type-Options or Referrer-Policy. This does not hide the page from search; it leaves the browser's protections at their defaults.

- Pages: 1, 2, 3
- Code: `security_headers_missing` · *Fix direction, for specialists:* Send Content-Security-Policy: frame-ancestors 'self' (or X-Frame-Options), X-Content-Type-Options: nosniff and a Referrer-Policy such as strict-origin-when-cross-origin.

### Very short sections · Low · 3 pages

Some sections have a heading and almost no text. They promise a topic and give a reader, or an AI, nothing to quote about it.

- Pages: 1, 2, 3
- Code: `thin_section` · *Fix direction, for specialists:* Expand the section with substance, or merge it into a neighbouring one.

### Sentences of one shape · Low · 2 pages

Many sentences follow the same shape. Text like that reads as templated, and the repetition hides which sentence carries the point.

- Pages: 1, 2
- Code: `repeated_sentence_shape` · *Fix direction, for specialists:* Vary the sentence structure; merge or cut the templated sentences.

## Across the site

- **Pages no other audited page links to** (Medium, 3 pages, code site_orphan_page): No other page in this audit links to these pages. Crawlers find pages by following links, so a page reached by no link depends on the sitemap alone. Only the audited pages were looked at: a page outside the set may still link to it. *Fix direction:* Link the page from its parent section, navigation or related pages with a crawlable <a href>.
- Not checked: Pages far from the home page (no_home_page)
- Not checked: Pages much shorter than the rest (fewer_pages)

## Pages × problems

| Problem | 1 | 2 | 3 | Pages |
|---|---|---|---|---|
| AI doesn't know the brand | M | M | M | 3 |
| Broken links | M | M | M | 3 |
| Passages start mid-sentence | M | M | M | 3 |
| Menu lines inside the text | M | M | M | 3 |
| A question with no answer | M | M | M | 3 |
| Required schema fields missing | M | M | M | 3 |
| No About or Contact link | L | L | L | 3 |
| FAQ rich result retired | L | L | L | 3 |
| llms.txt in one language only | L | L | L | 3 |
| Heavy page | L | L | L | 3 |
| A question answered in part | L | L | L | 3 |
| Retired rich result | L | L | L | 3 |
| Security headers missing | L | L | L | 3 |
| Very short sections | L | L | L | 3 |
| Sentences of one shape | L | L |  | 2 |
| Main phrase in few sections |  | M |  | 1 |
| Most of the text off the main phrase |  | L |  | 1 |

B blocking, H high, M medium, L low.
