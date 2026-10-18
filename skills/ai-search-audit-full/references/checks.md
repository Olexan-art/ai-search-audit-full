Read this when the user asks what a code means, how a check works, which threshold applies, or why something was or was not flagged.

# The checks: findings, codes and how each area is read

## What the report says about each problem

- Each finding has a code, a severity (blocking, high, medium, low), its tile, who it concerns (developer, content, SEO), its layer, where it is, the evidence and its rule sources (in the export).
- Layers: measured (a script counted it), derived (a fixed formula over measured values), judgement (your model, with `agent` and `model`).
- Findings not tied to 1 spot (most brand, review and question findings, several site checks) count on the map as "+N not tied to one spot".
- The plain layer shows a short label, severity, who it concerns, where, **what goes wrong** (what and why it matters to search or AI, for juniors and managers, no advice) and **what the rule says**.
- What the rule says: a short verbatim quote from the official source (Google Search Central, the RFC, the W3C, the vendor's crawler page), with the link and the date it was checked against the live page. With no published source (this skill's threshold or reading): "This skill's rule". No quote is attributed to anyone who did not write it.
- The **fix direction** (technical, terse) is only in each problem's collapsed "Details for specialists", with the code, the technical place, the evidence and every rule source. Outside it, the report gives no advice.

## Codes by tile

| Tile | Codes |
|---|---|
| Shown well in search? | `not_https`, `title_missing` (high); `h1_missing`, `canonical_other`, `canonical_multiple`, `broken_links`, `viewport_missing`, `jsonld_invalid`, `schema_required_missing`, `image_lcp_lazy`, `image_oversized`, `mixed_content`, `soft_404`, `url_variants_inconsistent` (medium); `redirect_chain`, `sitemap_missing`, `sitemap_not_listed`, `title_too_long`, `title_too_short`, `meta_description_missing`, `meta_description_short`, `meta_description_long`, `h1_multiple`, `heading_order_skip`, `canonical_missing`, `canonical_relative`, `internal_links_none`, `image_alt_missing`, `image_dimensions_missing`, `image_not_lazy`, `image_legacy_format`, `image_no_srcset`, `html_lang_missing`, `social_tags_missing`, `page_weight_heavy`, `url_unreadable`, `schema_recommended_missing`, `favicon_missing`, `site_name_missing`, `hsts_missing`, `author_missing`, `about_contact_missing`, `organization_details_missing`, `article_date_missing`, `privacy_terms_missing`, `date_mismatch`, `html_not_compressed`, `html_lang_invalid`, `link_text_generic`, `image_link_alt_empty`, `image_alt_repeated`, `internal_nofollow`, `fragment_link_broken`, `robots_no_sitemap`, `sitemap_lastmod_invalid`, `og_image_broken` (low); `structured_data_none`, `faq_rich_result_retired`, `rich_result_retired`, `html_no_cache_control`, `security_headers_missing` (low, informational) |
| AI finds it? | `robots_unreachable`, `search_engine_blocked`, `ai_search_blocked`, `noindex` (blocking); `snippet_blocked` (high); `markdown_alternate_broken`, `ai_catalog_invalid`, `indexnow_key_broken` (low); `ai_training_blocked`, `llms_txt_missing` (low, informational) |
| AI reads all of it? | `cap_overflow`, `js_dependent`, `hero_lede_dropped`, `hidden_headings`, `spa_shell` (high; hidden headings are medium when the hidden text is short); `ssr_placeholder_text`, `h1_glued_words`, `nav_in_content`, `dominant_heading` (medium); `thin_section` (low) |
| AI quotes it right? | `faq_schema_not_visible`, `lost_faq_questions` (high); `mid_sentence_start`, `question_missing`, `keyword_not_in_title`, `keyword_variant_split`, `keyword_one_section` (medium); `truncated_teaser`, `repeated_claim`, `question_partial`, `off_keyword_share`, `promise_without_number`, `stock_phrases`, `repeated_sentence_shape`, `uniform_openings`, `unchecked_claims` (low; the writing patterns are medium when they recur, stock phrases from 2.0 per 1,000 words) |
| AI gets the brand right? | `brand_contradiction`, `review_rating_unbacked`, `review_control_hallucination` (high); `brand_fact_absent`, `brand_unknown`, `reviews_without_markup` (medium) |
| Languages in order? | `hreflang_no_return` (high); `hreflang_invalid_code`, `hreflang_no_self`, `hreflang_alternate_broken`, `title_duplicate_locales`, `locale_facts_differ` (medium); `description_duplicate_locales`, `hreflang_lang_mismatch`, `hreflang_no_x_default`, `llms_txt_one_language` (low) |

## How each area is read

- **Passages:** the Vectorscope skill's checks, unchanged (h2 sections, 2,000-character windows, a 26-passage cap). `repeated_claim` and the keyword's "one section" group by h2 sections, so they need no embeddings.
- **Google and Bing checklist:** 35 cells. Core Web Vitals and "in Google's index" are always *not measured* (they need field data and Search Console).
- **Writing patterns:** the GetLoopLoop PatternScope's deterministic detectors over the kept text: stock phrases (a list per language), repeated sentence shapes, runs of same openings, evaluative claims with nothing checkable. Each has a position (passage and word) and a density per 1,000 words. English, Ukrainian and Spanish are analysed; other languages are reported as not analysed. Signals of worn writing, not an AI detector.
- **How generated the text sounds:** the report's last block, shared with the Vectorscope skill: the Pattern score, the marker words (vocabulary models overuse, counted beside the score, never in it) and your swap test.
- **Keyword:** `--keyword`, else the h1 with the site's name, a trailing year, a sales tail, a clause after a comma or colon, and edge stop words trimmed (at most 5 words). The report says which. The promise-without-a-figure rule reads English only, and says so.
- **Locale facts:** numbers in each h2 section across the language versions read, aligned by section order, only when both have the same number of sections; otherwise listed as not compared. Numbers in words are not read. A number may differ on purpose (a local price).
- **Structured data:** JSON-LD is parsed; microdata and RDFa types are listed. Required properties (as Google lists them) are checked for FAQPage, Product, SoftwareApplication (and WebApplication, MobileApplication), BreadcrumbList, Event, JobPosting, LocalBusiness, VideoObject, QAPage, WebSite, ProductGroup, Offer, AggregateOffer, Review and AggregateRating; recommended ones for those and Article (NewsArticle, BlogPosting), Organization and Person. Every FAQPage question must be in the visible text.
- **Retired rich results** are informational (no Google rich result any more, not an error), dated by https://developers.google.com/search/updates: FAQ (7 May 2026), How-to (14 September 2023), course info, estimated salary and vehicle listing (documentation removed 9 September 2025), ClaimReview (phased out 12 June 2025), special announcement (31 July 2025), practice problem (6 January 2026), sitelinks search box (29 November 2024).
- **llms.txt:** Google documents no use of it; the report quotes Google's AI features page: "You don't need to create new machine readable files, AI text files, or markup to appear in these features."
- **AI crawlers:** robots.txt matched by RFC 9309 (the Vectorscope skill's parser) for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot and CCBot. A 4xx robots.txt means no rules; a 5xx or no answer means all disallowed.
- **Brand and reviews:** see `judgement-files.md`.

## This skill's own thresholds

Named constants with their reasons, in `scripts/lib/`:

- title 10 to 60 characters; description 70 to 160;
- redirect chain: 2 or more hops;
- heavy page: HTML over 500 KB or more than 30 scripts;
- hard-to-read URL: over 115 characters, more than 2 query parameters, or a session id;
- hidden headings: high from 200 hidden characters;
- image oversized over 200 KB; wants a srcset over 100 KB or from 800 px declared width;
- above the fold: the hero and at most its first 2 images, the first being the LCP candidate;
- `data-nosnippet` blocks snippets when it covers half the visible text;
- app shell: under 150 words, with an app root (`#root`, `#__next`, `#app`, …) holding under 200 characters;
- stock phrases: medium from 2.0 per 1,000 words;
- keyword: off-phrase floor is half the passage text; "one section" is a third of the sections or fewer, from 3 sections.
