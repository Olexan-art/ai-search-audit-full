// The answer map: the questions people ask (questions.json), one row each, with how well the page
// answers. A simplified AnswerGapScope over the same judgement: no competitors, no brief beyond
// "what is missing". The verdict and `citable` are the agent's; `direct` is measured here; the
// quality is a fixed sum of the three, so the same files always give the same numbers.

import { foldForQuote } from "../vendor/vectorscope/judgement.mjs";

/** The quality's parts, out of 100. A partial answer can never reach the top. */
export const QUALITY = { complete: 50, partial: 25, citable: 25, direct: 25 };
/** How far into its passage an answer may start and still count as the passage's opening. */
export const DIRECT_CHARS = 160;
/** How many questions "Add first" names. */
export const ADD_FIRST = 3;

/** True when the quote starts in the passage's first sentence (its first DIRECT_CHARS characters when it has no sentence end). */
export function isDirect(quote, text) {
  if (!quote || !text) return false;
  const q = foldForQuote(quote);
  const t = foldForQuote(text);
  const at = t.indexOf(q.slice(0, 40));
  if (at < 0) return false;
  const end = t.search(/[.!?](\s|$)/);
  return at <= (end < 0 ? DIRECT_CHARS : end);
}

/**
 * Rows for the validated questions, ranked: what the page lacks first, then the weakest answers,
 * then the original order. `passages` are the reading's passages ([{index, text}]).
 */
export function answerMap(validated, passages) {
  if (!validated?.questions?.length) return null;
  const byIndex = new Map(passages.map((p) => [p.index, p]));
  const rows = validated.questions.map((q, n) => {
    const direct = q.verdict !== "missing" && isDirect(q.quote, byIndex.get(q.passage)?.text);
    const quality = (q.verdict === "complete" ? QUALITY.complete : q.verdict === "partial" ? QUALITY.partial : 0)
      + (q.citable ? QUALITY.citable : 0) + (direct ? QUALITY.direct : 0);
    return { id: q.id, n: n + 1, question: q.question, verdict: q.verdict, passage: q.passage, quote: q.quote, citable: q.citable, direct, quality, miss: q.miss || null };
  });
  const rank = { missing: 0, partial: 1, complete: 2 };
  rows.sort((a, b) => rank[a.verdict] - rank[b.verdict] || a.quality - b.quality || a.n - b.n);
  const count = (v) => rows.filter((r) => r.verdict === v).length;
  return {
    rows,
    addFirst: rows.filter((r) => r.verdict !== "complete").slice(0, ADD_FIRST).map((r) => r.id),
    summary: {
      questions: rows.length,
      complete: count("complete"),
      partial: count("partial"),
      missing: count("missing"),
      average: Math.round(rows.reduce((s, r) => s + r.quality, 0) / rows.length),
    },
  };
}
