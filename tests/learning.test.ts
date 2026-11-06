import { test } from "node:test";
import assert from "node:assert/strict";
import { getLearningCatalog } from "../src/lib/learning-content";
import { getRegistry } from "../src/lib/registry";
import {
  advanceSession,
  createSession,
  emptyProgress,
  learningTopics,
  restoreProgress,
  reviewQuestions,
  submitAnswer,
  type LearningProgress,
} from "../src/lib/learning";

const catalog = getLearningCatalog();
const now = Date.parse("2026-11-06T10:00:00Z");
function start(): LearningProgress {
  return {
    ...emptyProgress(),
    session: createSession(
      catalog.questions,
      emptyProgress(),
      "practice",
      "rad",
      now,
    ),
  };
}

test("question bank has canonical source references, all formats and unique IDs", () => {
  assert.equal(catalog.questions.length, 38);
  assert.equal(new Set(catalog.questions.map((q) => q.id)).size, 38);
  for (const t of learningTopics) {
    const questions = catalog.questions.filter((q) => q.topicId === t.id);
    assert.ok(questions.length >= 10);
    assert.ok(questions.some((q) => q.kind === "research"));
    assert.ok(questions.some((q) => q.kind === "what-if"));
    assert.ok(new Set(questions.map((q) => q.correctChoiceId)).size > 1);
    for (const q of questions) {
      assert.equal(q.needsReview, false);
      assert.match(q.source.href, /^\/propisi\/[^#]+#clan-\d+$/);
      assert.ok(q.source.version && q.source.checkedAt && q.source.coverage);
      if (q.parentId) assert.ok(questions.some((p) => p.id === q.parentId));
    }
  }
});

test("confirmed answers survive reload, cannot be counted twice, and unconfirmed questions cannot advance", () => {
  const progress = start();
  const first = catalog.questions.find(
    (q) => q.id === progress.session!.questionIds[0],
  )!;
  assert.deepEqual(advanceSession(progress), progress);
  assert.deepEqual(submitAnswer(progress, first, "unknown", now), progress);
  const answered = submitAnswer(progress, first, first.correctChoiceId, now);
  const restored = restoreProgress(JSON.stringify(answered), catalog.questions);
  assert.deepEqual(restored, answered);
  assert.deepEqual(
    submitAnswer(restored, first, first.choices[0].id, now),
    answered,
  );
  assert.equal(answered.answers[first.id].attempts, 1);
  assert.equal(advanceSession(restored).session!.cursor, 1);
});

test("mistakes are due immediately; correct answers are spaced and successful repetition lengthens the interval", () => {
  const progress = start();
  const q = catalog.questions.find(
    (q) => q.id === progress.session!.questionIds[0],
  )!;
  const wrong = q.choices.find((c) => c.id !== q.correctChoiceId)!;
  const missed = submitAnswer(progress, q, wrong.id, now);
  assert.deepEqual(
    reviewQuestions(catalog.questions, missed, now).map((q) => q.id),
    [q.id],
  );
  const retry = {
    ...missed,
    session: createSession(catalog.questions, missed, "review", "all", now),
  };
  const learned = submitAnswer(retry, q, q.correctChoiceId, now);
  assert.equal(reviewQuestions(catalog.questions, learned, now).length, 0);
  assert.equal(learned.answers[q.id].dueAt, now + 86_400_000);
  const nextDay = now + 86_400_000;
  const repeat = {
    ...learned,
    session: createSession(
      catalog.questions,
      learned,
      "review",
      "all",
      nextDay,
    ),
  };
  const remembered = submitAnswer(repeat, q, q.correctChoiceId, nextDay);
  assert.equal(remembered.answers[q.id].dueAt, nextDay + 3 * 86_400_000);
});

test("practice prioritizes new material and what-if always keeps each original before its changed story", () => {
  let progress = start();
  const initial = [...progress.session!.questionIds];
  for (const id of initial) {
    const q = catalog.questions.find((q) => q.id === id)!;
    progress = advanceSession(
      submitAnswer(progress, q, q.correctChoiceId, now),
    );
  }
  assert.equal(progress.session!.cursor, 5);
  assert.deepEqual(advanceSession(progress), progress);
  const next = createSession(
    catalog.questions,
    progress,
    "practice",
    "rad",
    now,
  )!;
  assert.ok(next.questionIds.every((id) => !initial.includes(id)));
  const variants = createSession(
    catalog.questions,
    progress,
    "what-if",
    "rad",
    now,
  )!;
  assert.equal(variants.questionIds.length, 4);
  for (let i = 0; i < variants.questionIds.length; i += 2) {
    const variant = catalog.questions.find(
      (q) => q.id === variants.questionIds[i + 1],
    )!;
    assert.equal(variant.parentId, variants.questionIds[i]);
  }
});

test("corrupt, obsolete and tampered browser data cannot restore an invalid session", () => {
  for (const value of [
    "not json",
    "null",
    "[]",
    '{"version":2}',
    '{"version":1,"answers":null}',
  ])
    assert.deepEqual(
      restoreProgress(value, catalog.questions),
      emptyProgress(),
    );
  const progress = start();
  const q = catalog.questions.find(
    (q) => q.id === progress.session!.questionIds[0],
  )!;
  const answered = submitAnswer(progress, q, q.correctChoiceId, now);
  const revised = catalog.questions.map((item) =>
    item.id === q.id ? { ...item, revision: "new-revision" } : item,
  );
  assert.deepEqual(
    restoreProgress(JSON.stringify(answered), revised),
    emptyProgress(),
  );
  const invalid = structuredClone(answered);
  invalid.session!.cursor = 4;
  assert.equal(
    restoreProgress(JSON.stringify(invalid), catalog.questions).session,
    null,
  );
  invalid.answers[q.id].dueAt = Infinity;
  assert.equal(
    restoreProgress(JSON.stringify(invalid), catalog.questions).answers[q.id],
    undefined,
  );
});

test("changed source version or content holds the affected questions and invalidates their saved round", () => {
  const law = getRegistry().records.find((r) => r.title === "Закон о раду")!;
  const original = { citation: law.citation, sha256: law.sha256 };
  try {
    for (const change of [
      { citation: "Нова верзија", sha256: original.sha256 },
      { citation: original.citation, sha256: "0".repeat(64) },
    ]) {
      Object.assign(law, change);
      const updated = getLearningCatalog();
      assert.ok(
        updated.questions
          .filter((q) => q.topicId === "rad")
          .every((q) => q.needsReview),
      );
      assert.ok(
        updated.questions
          .filter((q) => q.topicId !== "rad")
          .every((q) => !q.needsReview),
      );
      assert.equal(
        createSession(
          updated.questions,
          emptyProgress(),
          "practice",
          "rad",
          now,
        ),
        null,
      );
      assert.equal(
        restoreProgress(JSON.stringify(start()), updated.questions).session,
        null,
      );
    }
  } finally {
    Object.assign(law, original);
  }
});
