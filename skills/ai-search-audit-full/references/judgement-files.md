Read this before you write `questions.json`, `style.json`, `brand.json` or `reviews.json`.

# The judgement files: schemas, examples and rules

`audit.mjs --check` validates all 4 files against the reading and names any field it refuses. Write every file with the file-writing tool, never a shell heredoc.

## All 4 files

- `agent`: the product you run in ("Claude Code", "claude.ai", "Codex", "opencode", "Hermes"). `model`: your model's name as you know it. At most 60 characters each.
- Never guess either. If you do not know one, leave it out; the report then says "model not stated". The report prints the model beside every judgement finding.
- Questions in the page's language; brand and review answers in English. Never Russian.
- The script refuses a letter that Russian uses and the page's language does not: on a Ukrainian page, the 4 letters only Russian writes. A Bulgarian or Belarusian page keeps the letters its own words use. Quotes are checked against the passage instead.

## questions.json

```json
{
  "agent": "<your agent>",
  "model": "<your model name>",
  "topic": "what the page is about, in a few words",
  "questions": [
    { "id": "q1", "question": "My launch is tomorrow: will an assistant see the FAQ at the bottom?", "axes": ["urgency", "object"],
      "passage": 5, "verdict": "partial", "citable": false, "quote": "verbatim words from passage 5",
      "miss": "Says the FAQ may fall below the cut, not how to check where the cut falls." },
    { "id": "q2", "question": "Can I paste a PDF instead of a web page?", "axes": ["object"], "passage": null, "verdict": "missing", "miss": "Nothing on PDFs or other file types." }
  ]
}
```

**Write** 8 to 12 questions, as the GetLoopLoop Voicescope does: the page's topic crossed with a real circumstance. `axes` names the 1 to 3 axes a question uses (never all 4; every axis at least once in the file):

- `urgency`: needed now, on the move, or against a deadline;
- `device`: who asks and on what (a phone, nothing installed, hands busy, somebody watching);
- `object`: the specific document, page, account, report or person in front of them;
- `obstacle`: the mistake already made, the thing they cannot find, the thing they fear getting wrong.

Rules, most often broken first:

1. Most questions must **not** contain the keyword. People describe the problem, not the jargon.
2. Speech, in the first person, in the page's language.
3. No wake words ("Hey Google", "Siri").
4. No question that is another with words added.
5. At least 1 question the page probably does not answer.

`--check` warns (does not refuse) when more than half contain the keyword, or when every question is answered.

**Judge** each from the passages only, never from what you know:

- `passage`: the 1 passage a retriever should return, or `null`;
- `verdict`: `complete` (that passage alone answers it), `partial` (it leaves part out) or `missing`;
- `citable`: `true` only when the quoted words make sense alone;
- `quote`: the answering words, at most 400 characters, **verbatim** from that passage (whitespace, quote marks, dashes and case are folded, nothing else). None on `missing`. The script refuses a quote not in its passage;
- `miss`: optional to the script, but write it for every `partial` and `missing` answer: 1 line, at most 200 characters, your words, on what the page lacks. Leave it out on `complete` answers (an empty string counts as left out).

The report draws these as the **answer map**: 1 row per question, what the page lacks first, your `miss` line, and a quality out of 100 (complete 50 or partial 25, `citable` 25, and 25 when the quote opens its passage, measured by the script). "Add first" marks the 3 weakest.

## style.json

```json
{ "agent": "<your agent>", "model": "<your model name>",
  "passages": [
    { "passage": 3, "verdict": "specific", "evidence": "Free for up to 5 clients.", "why": "a limit a reader can check" },
    { "passage": 5, "verdict": "generic", "evidence": "unlock its full potential", "why": "names no integration" } ] }
```

- 1 verdict for **every** passage in `vs.passages`, by the swap test: would it fit a competitor's page with only the brand name changed? Yes: `generic`. `specific`: it holds what only this page could say (a number, a name, a limit, a procedure, a first-hand detail).
- `evidence`: the deciding words, verbatim, at most 200 characters. `why`: optional, 1 short line in the user's language.
- Judge the passage, not the page or who wrote it. It is not an AI detector; the report says so.
- The script checks every passage is judged once and every quote is verbatim.
- *How generated the text sounds*, the report's last block, shows your verdicts beside the Pattern score and the marker words. Where they disagree, it shows both and averages nothing.

## brand.json

```json
{
  "agent": "<your agent>",
  "model": "<your model name>",
  "brand": "BrightDesk",
  "basis": "own_knowledge",
  "answers": [
    { "question": "what_is", "knows": true, "answer": "BrightDesk is a help desk for small support teams. …" },
    { "question": "pricing", "knows": true, "answer": "Not sure: I think there is a free plan and a paid plan near $20 per agent a month." },
    { "question": "integrations", "knows": true, "answer": "…" },
    { "question": "weaknesses", "knows": false, "answer": "" },
    { "question": "alternatives", "knows": true, "answer": "…" }
  ]
}
```

`brand`: the site's own name, 1 to 80 characters. Answer the 5 fixed Brandscope questions, each once, asked of yourself in this wording:

1. `what_is`: What is <brand>? Answer in two sentences.
2. `pricing`: How much does <brand> cost? Name the plans and prices you know of. If you are not sure, say so.
3. `integrations`: What does <brand> integrate with? Name the integrations you know of.
4. `weaknesses`: What are the main weaknesses or complaints about <brand> compared with its alternatives?
5. `alternatives`: What are the main alternatives to <brand>, and when would somebody pick one of them instead?

**Honesty rules**

- `basis` must be `"own_knowledge"`: it states the answers come from what you knew, with no browsing, search, fetch or reading of the page. Look nothing up, even when a tool is available.
- At most 1,500 characters per answer.
- You know: `"knows": true`.
- You know something but are not sure: `"knows": true`, and say so in the answer ("Not sure: …", "…, but I am not certain").
- You do not know: `"knows": false`, `"answer": ""`. This is correct, and the most useful answer when it is true.
- Do not soften a guess into a fact. Do not copy the page.
- The script reads the first 400 characters of each answer. If they disclaim knowledge, it counts the answer as `"knows": false`, without a refusal. Disclaiming phrases include "I don't have (specific) information", "not familiar with", "I'm not aware", "I have no information", "I couldn't find information", "I don't know of / about / any", "unable to find", "may not exist". "Not sure" and "not certain" are not among them. Do not open a half-known answer with a disclaiming phrase.

**What the script compares** (fixed rules from Brandscope):

- contradiction: a price, or a number of the same thing ("3 agents", "26 passages"), that the page states differently;
- fact the page lacks: a sentence of `what_is`, `pricing` or `integrations` whose numbers and names are not on the page;
- brand unknown: all 5 answers count as not knowing.

Complaints are never checked against the brand's own page. Alternatives are other brands.

## reviews.json

```json
{
  "agent": "<your agent>",
  "model": "<your model name>",
  "brand": "BrightDesk",
  "basis": "own_knowledge",
  "platforms": [
    { "platform": "g2", "knows": true, "rating": 4.5, "reviews": 120 },
    { "platform": "capterra", "knows": false },
    …
  ]
}
```

1. Start from `reviews.template.json`, which `read.mjs` writes beside the reading (beside `site.json` for a site). It lists every platform of this run once, with name and scale, and `"knows"` empty.
2. Fill in `agent`, `model` and `brand`.
3. Keep exactly those platforms; add or remove none.
4. Set `"knows"` on each: `true` with a `rating` on its scale (out of 5; TrustRadius out of 10; Product Hunt a whole count of upvotes), or `false`.

- `reviews` (a whole count) is optional. `name` and `scale` may stay or go.
- The brand.json honesty rules apply. Judge each platform separately, from your own knowledge of the brand on that platform.

The script flags a rating that cannot be right, and every rating with no source on the page (no mention of the platform, no link, no rating markup). The report names them and says why.
