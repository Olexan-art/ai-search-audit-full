import { test } from "node:test";
import assert from "node:assert/strict";
import { answerMap, isDirect, QUALITY } from "../scripts/lib/answerMap.mjs";
import { validateQuestions } from "../scripts/lib/questions.mjs";

const passages = [
  { index: 0, text: "Single receipts are free. Teams pay per seat." },
  { index: 1, text: "Some background first. Later on, the export writes one row per receipt line." },
];

test("direct: an answer that opens its passage counts, one buried later does not", () => {
  assert.equal(isDirect("Single receipts are free.", passages[0].text), true);
  assert.equal(isDirect("the export writes one row per receipt line", passages[1].text), false);
});

test("the quality is the fixed sum, ranked with what the page lacks first", () => {
  const map = answerMap({ questions: [
    { id: "a", question: "Is it free?", verdict: "complete", passage: 0, citable: true, quote: "Single receipts are free." },
    { id: "b", question: "What does the export look like?", verdict: "partial", passage: 1, citable: false, quote: "the export writes one row per receipt line", miss: "No example of a row." },
    { id: "c", question: "Can I use it offline?", verdict: "missing", passage: null, citable: false, quote: null, miss: "Nothing on offline use." },
  ] }, passages);
  assert.deepEqual(map.rows.map((r) => [r.id, r.quality]), [["c", 0], ["b", QUALITY.partial], ["a", QUALITY.complete + QUALITY.citable + QUALITY.direct]]);
  assert.deepEqual(map.addFirst, ["c", "b"]);
  assert.equal(map.summary.average, Math.round((0 + 25 + 100) / 3));
  assert.equal(map.rows[0].miss, "Nothing on offline use.");
});

test("miss is optional, kept only for answers that are not complete, and whitespace is folded", () => {
  const q = (id, verdict, extra = {}) => ({ id, question: `Question ${id}?`, axes: [["urgency", "device", "object", "obstacle"][Number(id.slice(1)) % 4]], passage: verdict === "missing" ? null : 0, verdict, citable: false, ...(verdict === "missing" ? {} : { quote: "Single receipts are free." }), ...extra });
  const list = [q("q1", "missing", { miss: "Nothing   on\nsome  thing." }), q("q2", "complete", { miss: "ignored" }), ...["q3", "q4", "q5", "q6", "q7", "q8"].map((id) => q(id, "partial"))];
  const v = validateQuestions({ questions: list }, passages);
  assert.equal(v.questions[0].miss, "Nothing on some thing.");
  assert.equal(v.questions[1].miss, null);
  assert.equal(v.questions[2].miss, null);
  assert.throws(() => validateQuestions({ questions: [{ ...list[0], miss: "x".repeat(201) }, ...list.slice(1)] }, passages), /miss/);
});
