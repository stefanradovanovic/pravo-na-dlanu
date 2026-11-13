import type { QuestionContent } from "./learning-schema";
import { normalizeSearch } from "./search";

export const learningTopics = [
  {
    id: "ustav",
    title: "Устав и наша права",
    description: "Једнакост, правна заштита и учешће грађана у јавном животу.",
    lawId: "ustav",
    keywords:
      "устав права слободе једнакост дискриминација петиција грађани држава",
    outcomes: [
      "Упознајте једнаку заштиту, правно средство и право на петицију.",
      "Разликујте једнакост од истог поступања у свакој ситуацији.",
      "Повежите животну ситуацију са одредбом Устава.",
    ],
  },
  {
    id: "rad",
    title: "Права на послу",
    description: "Од разговора за посао до зараде и годишњег одмора.",
    lawId: "zakon-o-radu",
    keywords:
      "посао запослење плата плате зарада одмор годишњи уговор разговор послодавац радник",
    outcomes: [
      "Препознајте правила о запошљавању и уговору.",
      "Пронађите одредбе о заради и одмору.",
      "Проверите како промена чињеница мења одговор.",
    ],
  },
  {
    id: "potrosaci",
    title: "Куповина и потрошачка права",
    description: "Рекламација, одустанак и куповина преко интернета.",
    lawId: "zastita-potrosaca",
    keywords:
      "потрошач продавница купац куповина интернет онлајн рекламација рачун цена роба",
    outcomes: [
      "Препознајте однос потрошача и трговца.",
      "Разликујте рекламацију и одустанак од куповине.",
      "Пронађите правило и проверите услове његове примене.",
    ],
  },
  {
    id: "privatnost",
    title: "Моји лични подаци",
    description: "Достава, употреба података и исправка нетачних евиденција.",
    lawId: "zastita-podataka",
    keywords:
      "подаци приватност адреса телефон пристанак сагласност исправка брисање",
    outcomes: [
      "Препознајте сврху прикупљања података.",
      "Разликујте пристанак од других основа обраде.",
      "Пронађите правило о исправци нетачних података.",
    ],
  },
  {
    id: "informacije",
    title: "Грађани и држава",
    description: "Питајте орган власти, затражите документ и сазнајте више.",
    lawId: "pristup-informacijama",
    keywords:
      "информације документ општина институције захтев јавност орган власт",
    outcomes: [
      "Препознајте информацију од јавног значаја.",
      "Сазнајте шта треба да садржи захтев.",
      "Разликујте право на приступ и законска ограничења.",
    ],
  },
] as const;

/** Editorial discovery uses familiar words, separately from legal-text search. */
export function searchLearningTopics(query: string) {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  return learningTopics.filter((topic) => {
    const terms = normalizeSearch(
      `${topic.title} ${topic.description} ${topic.keywords} ${topic.outcomes.join(" ")}`,
    ).split(" ");
    return words.every((word) =>
      terms.some((term) =>
        word.length < 3 ? term === word : term.startsWith(word),
      ),
    );
  });
}
export type LearningTopicId = (typeof learningTopics)[number]["id"];
export type LearningMode = "practice" | "what-if" | "research" | "review";
export const modeLabels: Record<LearningMode, string> = {
  practice: "Ситуације из живота",
  "what-if": "Шта ако…?",
  research: "Пронађи правило",
  review: "Понови и утврди",
};
export type LearningSource = {
  title: string;
  article: number;
  href: string;
  lawHref: string;
  url: string;
  version: string;
  accessedAt: string;
  checkedAt: string;
  coverage: string;
};
export type LearningQuestion = Omit<QuestionContent, "kind"> & {
  kind: "scenario" | "research" | "what-if";
  topicId: LearningTopicId;
  revision: string;
  needsReview: boolean;
  source: LearningSource;
  parentId?: string;
  change?: string;
  originalScenario?: string;
};
export type LearningCatalog = {
  questions: LearningQuestion[];
  lessons: {
    id: string;
    topicId: LearningTopicId;
    title: string;
    text: string;
    source: LearningSource;
    needsReview: boolean;
  }[];
};
export type AnswerRecord = {
  revision: string;
  choiceId: string;
  attempts: number;
  streak: number;
  answeredAt: number;
  dueAt: number;
};
export type LearningSession = {
  topicId: LearningTopicId | "all";
  mode: LearningMode;
  questionIds: string[];
  revisions: string[];
  cursor: number;
  answers: Record<string, string>;
};
export type LearningProgress = {
  version: 1;
  answers: Record<string, AnswerRecord>;
  session: LearningSession | null;
};
export const emptyProgress = (): LearningProgress => ({
  version: 1,
  answers: {},
  session: null,
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validTime(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 8.64e15
  );
}
/** Persist only known, version-matching questions. A changed source invalidates an active round. */
export function restoreProgress(
  raw: string,
  questions: LearningQuestion[],
): LearningProgress {
  const result = emptyProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || value.version !== 1) return result;
    const available = new Map(
      questions.filter((q) => !q.needsReview).map((q) => [q.id, q]),
    );
    if (isObject(value.answers))
      for (const [id, record] of Object.entries(value.answers)) {
        const q = available.get(id);
        if (
          !q ||
          !isObject(record) ||
          record.revision !== q.revision ||
          !q.choices.some((c) => c.id === record.choiceId) ||
          !Number.isSafeInteger(record.attempts) ||
          Number(record.attempts) < 1 ||
          !Number.isSafeInteger(record.streak) ||
          Number(record.streak) < 0 ||
          Number(record.streak) > Number(record.attempts) ||
          !validTime(record.answeredAt) ||
          !validTime(record.dueAt)
        )
          continue;
        result.answers[id] = record as AnswerRecord;
      }
    const s = value.session;
    if (
      !isObject(s) ||
      !["practice", "what-if", "research", "review"].includes(String(s.mode)) ||
      !(
        s.topicId === "all" || learningTopics.some((t) => t.id === s.topicId)
      ) ||
      !Array.isArray(s.questionIds) ||
      s.questionIds.length < 1 ||
      s.questionIds.length > 5 ||
      new Set(s.questionIds).size !== s.questionIds.length ||
      !Array.isArray(s.revisions) ||
      s.revisions.length !== s.questionIds.length ||
      !Number.isInteger(s.cursor) ||
      Number(s.cursor) < 0 ||
      Number(s.cursor) > s.questionIds.length ||
      !isObject(s.answers)
    )
      return result;
    const ids = s.questionIds;
    const revisions = s.revisions;
    const answers = s.answers;
    const cursor = Number(s.cursor);
    if (
      !ids.every((id, i) => {
        const q = typeof id === "string" ? available.get(id) : undefined;
        return (
          q &&
          q.revision === revisions[i] &&
          (s.topicId === "all" || q.topicId === s.topicId) &&
          (i < cursor
            ? q.choices.some((c) => c.id === answers[id])
            : answers[id] === undefined ||
              (i === cursor && q.choices.some((c) => c.id === answers[id])))
        );
      }) ||
      Object.keys(answers).some((id) => !ids.includes(id))
    )
      return result;
    result.session = s as LearningSession;
  } catch {
    /* Invalid or older browser data starts a fresh learning history. */
  }
  return result;
}

export function reviewQuestions(
  questions: LearningQuestion[],
  progress: LearningProgress,
  now: number,
) {
  return questions.filter((q) => {
    const a = progress.answers[q.id];
    return (
      !q.needsReview &&
      a?.revision === q.revision &&
      (a.choiceId !== q.correctChoiceId || a.dueAt <= now)
    );
  });
}

export function createSession(
  questions: LearningQuestion[],
  progress: LearningProgress,
  mode: LearningMode,
  topicId: LearningTopicId | "all",
  now: number,
): LearningSession | null {
  const pool = questions.filter(
    (q) => !q.needsReview && (topicId === "all" || q.topicId === topicId),
  );
  // First encounter follows the authored path; later rounds prioritize unseen and difficult questions.
  const ordered = (list: LearningQuestion[]) =>
    [...list].sort((a, b) => {
      const left = progress.answers[a.id],
        right = progress.answers[b.id];
      return (
        Number(!!left) - Number(!!right) ||
        Number(left?.choiceId === a.correctChoiceId) -
          Number(right?.choiceId === b.correctChoiceId) ||
        (left?.answeredAt ?? 0) - (right?.answeredAt ?? 0)
      );
    });
  let selected: LearningQuestion[];
  if (mode === "what-if") {
    selected = ordered(
      pool.filter(
        (q) => q.kind === "what-if" && pool.some((p) => p.id === q.parentId),
      ),
    )
      .slice(0, 2)
      .flatMap((q) => [pool.find((p) => p.id === q.parentId)!, q]);
  } else {
    selected = ordered(
      mode === "review"
        ? reviewQuestions(pool, progress, now)
        : pool.filter(
            (q) => q.kind === (mode === "research" ? "research" : "scenario"),
          ),
    ).slice(0, 5);
  }
  return selected.length
    ? {
        topicId,
        mode,
        questionIds: selected.map((q) => q.id),
        revisions: selected.map((q) => q.revision),
        cursor: 0,
        answers: {},
      }
    : null;
}

/** A confirmed answer counts once; leaving or reloading the feedback screen cannot inflate progress. */
export function submitAnswer(
  progress: LearningProgress,
  question: LearningQuestion,
  choiceId: string,
  now: number,
): LearningProgress {
  const session = progress.session;
  if (
    !session ||
    question.needsReview ||
    session.questionIds[session.cursor] !== question.id ||
    session.revisions[session.cursor] !== question.revision ||
    session.answers[question.id] ||
    !question.choices.some((c) => c.id === choiceId)
  )
    return progress;
  const previous = progress.answers[question.id];
  const correct = choiceId === question.correctChoiceId;
  const streak = correct ? (previous?.streak ?? 0) + 1 : 0;
  const days = correct ? [1, 3, 7, 14][Math.min(streak - 1, 3)] : 0;
  return {
    ...progress,
    answers: {
      ...progress.answers,
      [question.id]: {
        revision: question.revision,
        choiceId,
        attempts: (previous?.attempts ?? 0) + 1,
        streak,
        answeredAt: now,
        dueAt: now + days * 86_400_000,
      },
    },
    session: {
      ...session,
      answers: { ...session.answers, [question.id]: choiceId },
    },
  };
}

export function advanceSession(progress: LearningProgress): LearningProgress {
  const s = progress.session;
  if (
    !s ||
    s.cursor >= s.questionIds.length ||
    !s.answers[s.questionIds[s.cursor]]
  )
    return progress;
  return { ...progress, session: { ...s, cursor: s.cursor + 1 } };
}
