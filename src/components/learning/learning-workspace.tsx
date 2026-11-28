"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flag,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { normalizeSearch } from "@/lib/search";
import {
  advanceSession,
  createSession,
  learningTopics,
  modeLabels,
  modeQuestionKinds,
  reviewQuestions,
  submitAnswer,
  selectSession,
  sessionForTopic,
  type LearningSession,
  type LearningCatalog,
  type LearningMode,
  type LearningProgress,
  type LearningQuestion,
  type LearningTopicId,
} from "@/lib/learning";
import { useLearningProgress } from "./use-learning-progress";
import { QuestionCard } from "./question-card";
import { ArticleDialog } from "./article-dialog";

function quizHref(topicId: LearningSession["topicId"]) {
  return `/ucenje?tema=${topicId === "all" ? "sve" : topicId}`;
}

function SessionResults({
  session,
  progress,
  questions,
  onContinue,
  onRetry,
  onClose,
  onTopic,
}: {
  session: LearningSession;
  progress: LearningProgress;
  questions: LearningQuestion[];
  onContinue: () => void;
  onRetry: () => void;
  onClose: () => void;
  onTopic: (topic: LearningTopicId) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const attempted = session.questionIds.map((id) =>
    questions.find((q) => q.id === id)!,
  );
  const correct = attempted.filter(
    (q) => session.answers[q.id] === q.correctChoiceId,
  );
  const nextTopicMode = session.mode === "expert" ? "expert" : "practice";
  const nextTopic = learningTopics.find(
    (t) =>
      t.id !== session.topicId &&
      questions.some(
        (q) =>
          q.topicId === t.id &&
          q.kind === modeQuestionKinds[nextTopicMode] &&
          !q.needsReview &&
          !progress.answers[q.id],
      ),
  );
  return (
    <section className="learning-results">
      <Flag size={28} />
      <span className="eyebrow">КОРАК ПО КОРАК</span>
      <h2 ref={heading} tabIndex={-1}>
        Сесија је завршена.
      </h2>
      <p className="learning-score">
        {correct.length} / {attempted.length}
      </p>
      <p>
        Тачних одговора у овој сесији. Сваки покушај је прилика да боље разумете
        правило.
      </p>
      <p className="learning-caption">
        Отворите питање да поново прочитате одговор и објашњење.
      </p>
      <Accordion className="learning-answer-review">
        {attempted.map((q) => (
          <AccordionItem key={q.id} value={q.id}>
            <AccordionTrigger>
              <span className="learning-result-heading">
                {session.answers[q.id] === q.correctChoiceId ? (
                  <Check size={18} />
                ) : (
                  <RotateCcw size={18} />
                )}
                <span>
                  <strong>{q.title}</strong>
                  <small>
                    {session.answers[q.id] === q.correctChoiceId
                      ? "Тачно"
                      : "За поновно вежбање"}
                  </small>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                <strong>Измишљена ситуација:</strong> {q.scenario}
              </p>
              <p>{q.prompt}</p>
              <p>
                <strong>Ваш одговор:</strong>{" "}
                {q.choices.find((c) => c.id === session.answers[q.id])?.text}
              </p>
              {session.answers[q.id] !== q.correctChoiceId && (
                <p>
                  {
                    q.choices.find((c) => c.id === session.answers[q.id])
                      ?.explanation
                  }
                </p>
              )}
              <p>
                <strong>Тачан одговор:</strong>{" "}
                {q.choices.find((c) => c.id === q.correctChoiceId)?.text}
              </p>
              <p>
                {q.choices.find((c) => c.id === q.correctChoiceId)?.explanation}
              </p>
              <ArticleDialog source={q.source} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="learning-actions">
        {correct.length < attempted.length && (
          <Button
            variant={session.mode === "review" ? "default" : "outline"}
            onClick={onRetry}
          >
            <RotateCcw /> Понови питања која су била тешка
          </Button>
        )}
        {session.mode !== "review" && (
          <Button onClick={onContinue}>
            Следећа рунда <ArrowRight />
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Назад на теме
        </Button>
        {nextTopic && (
          <Button variant="ghost" onClick={() => onTopic(nextTopic.id)}>
            Следећа тема: {nextTopic.title} <ArrowRight />
          </Button>
        )}
      </div>
      <p className="learning-caption">
        Тачне одговоре поново вежбамо после 1, 3, 7 и 14 дана. Резултат описује
        ову вежбу, а не потврђује правну стручност.
      </p>
    </section>
  );
}

export function LearningWorkspace({ catalog }: { catalog: LearningCatalog }) {
  const { questions, lessons } = catalog;
  const params = useSearchParams();
  const topic = learningTopics.find((t) => t.id === params.get("tema"));
  const [panel, setPanel] = useState("topics");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const quizTopic = topic?.id ?? (params.get("tema") === "sve" ? "all" : null);
  const enteredTopic = useRef<LearningSession["topicId"] | null>(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const { progress, ready, persistent, update, reset } =
    useLearningProgress(questions);
  const available = questions.filter((q) => !q.needsReview);
  const due = ready ? reviewQuestions(questions, progress, now) : [];
  const session = quizTopic
    ? sessionForTopic(progress, quizTopic)
    : progress.session;
  useEffect(() => {
    if (!ready || (enteredTopic.current === quizTopic && session)) return;
    enteredTopic.current = quizTopic;
    if (!quizTopic) return;
    update((current) => {
      const saved = sessionForTopic(current, quizTopic);
      const next =
        saved && saved.cursor < saved.questionIds.length
          ? saved
          : createSession(
              questions,
              current,
              "practice",
              quizTopic,
              Date.now(),
            );
      return next ? selectSession(current, next) : current;
    });
  }, [ready, quizTopic, questions, update, session]);
  const activeQuestion =
    session &&
    questions.find((q) => q.id === session.questionIds[session.cursor]);
  const inProgress = session && session.cursor < session.questionIds.length;
  const answered = available.filter((q) => progress.answers[q.id]);
  const latestCorrect = answered.filter(
    (q) => progress.answers[q.id].choiceId === q.correctChoiceId,
  );
  const nextReviewAt = answered.reduce<number | null>((earliest, q) => {
    const dueAt = progress.answers[q.id].dueAt;
    return dueAt > now && (earliest === null || dueAt < earliest)
      ? dueAt
      : earliest;
  }, null);
  const relevant = topic
    ? available.filter((q) => q.topicId === topic.id)
    : available;
  const lesson = lessons.find(
    (item) =>
      !item.needsReview && item.source.href === activeQuestion?.source.href,
  );
  const filteredTopics = learningTopics.filter((t) =>
    normalizeSearch(
      `${t.title} ${t.description} ${t.keywords} ${lessons
        .filter((l) => l.topicId === t.id)
        .map((l) => l.title)
        .join(" ")}`,
    ).includes(normalizeSearch(query)),
  );
  const heldCount = questions.length - available.length;

  function start(
    nextMode: LearningMode,
    topicId: LearningTopicId | "all",
    ids?: string[],
  ) {
    const candidates = ids
      ? questions.filter((q) => ids.includes(q.id))
      : questions;
    let started = false;
    update((current) => {
      const next = createSession(
        candidates,
        current,
        nextMode,
        topicId,
        Date.now(),
      );
      started = !!next;
      return next ? selectSession(current, next) : current;
    });
    if (started) {
      setRoundNumber((n) => n + 1);
      if (quizTopic !== topicId) router.push(quizHref(topicId));
    }
  }
  function closeSession() {
    setPanel("topics");
    router.push("/ucenje");
  }

  function updateCurrentRound(
    change: (current: LearningProgress) => LearningProgress,
  ) {
    if (!session) return;
    update((current) => {
      const saved = sessionForTopic(current, session.topicId);
      if (
        !saved ||
        saved.cursor !== session.cursor ||
        saved.questionIds[saved.cursor] !== session.questionIds[session.cursor]
      )
        return current;
      return change(selectSession(current, saved));
    });
  }
  if (
    !ready ||
    (quizTopic &&
      !session &&
      relevant.some((q) => q.kind === modeQuestionKinds.practice))
  ) {
    return (
      <div className="learning-workspace">
        <p role="status">
          {quizTopic ? "Припремамо питање…" : "Припремамо теме…"}
        </p>
      </div>
    );
  }

  return (
    <div className="learning-workspace">
      {!persistent && (
        <p className="learning-notice" role="status">
          Чување на уређају није доступно. Можете да наставите, али ће се
          напредак изгубити када затворите или поново учитате страницу.
        </p>
      )}
      {heldCount > 0 && (
        <p className="learning-notice">
          Питања на поновној провери: {heldCount}. Изворна верзија је промењена;
          та питања су привремено изостављена из вежбања.
        </p>
      )}
      {quizTopic ? (
        <div className="learning-session">
          <h1>{topic?.title ?? "Питања из свих тема"}</h1>
          <Link
            href="/ucenje"
            className="text-link"
            onNavigate={() => setPanel("topics")}
          >
            Сачувај и врати се
          </Link>
          {!session ? (
            <p role="status">Ова тема тренутно нема доступних питања.</p>
          ) : activeQuestion ? (
            <QuestionCard
              key={`${quizTopic}-${session.mode}-${roundNumber}-${activeQuestion.id}`}
              question={activeQuestion}
              lesson={lesson}
              answer={session.answers[activeQuestion.id]}
              index={session.cursor}
              count={session.questionIds.length}
              onSubmit={(choice) =>
                updateCurrentRound((p) =>
                  submitAnswer(p, activeQuestion, choice, Date.now()),
                )
              }
              onNext={() => updateCurrentRound(advanceSession)}
            />
          ) : (
            <SessionResults
              session={session}
              progress={progress}
              questions={questions}
              onContinue={() => start(session.mode, session.topicId)}
              onClose={closeSession}
              onTopic={(id) => {
                if (sessionForTopic(progress, id)) router.push(quizHref(id));
                else
                  start(session.mode === "expert" ? "expert" : "practice", id);
              }}
              onRetry={() =>
                start(
                  "review",
                  session.topicId,
                  session.questionIds.filter(
                    (id) =>
                      session.answers[id] !==
                      questions.find((q) => q.id === id)?.correctChoiceId,
                  ),
                )
              }
            />
          )}
        </div>
      ) : (
        <>
          {ready && inProgress && (
            <div className="learning-resume">
              <div>
                <strong>Наставите тамо где сте стали.</strong>
                <p>
                  {modeLabels[session.mode]} · одговорено{" "}
                  {Object.keys(session.answers).length} од{" "}
                  {session.questionIds.length} питања
                </p>
              </div>
              <Button onClick={() => router.push(quizHref(session.topicId))}>
                Настави сесију <ArrowRight />
              </Button>
            </div>
          )}
          <Tabs
            value={panel}
            onValueChange={(value) => setPanel(String(value))}
          >
            <div className="learning-page-heading">
              <h1>
                {panel === "progress" ? "Моје учење" : "Изаберите тему за квиз"}
              </h1>
              <TabsList aria-label="Учење">
                <TabsTrigger value="topics">
                  <BookOpen /> Теме
                </TabsTrigger>
                <TabsTrigger value="progress">
                  <Flag /> Моје учење
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="topics">
              <div className="learning-search">
                <Search size={17} />
                <Input
                  aria-label="Претрага тема за учење"
                  placeholder="Посао, куповина, подаци…"
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              <ul className="learning-topic-list" aria-label="Теме за учење">
                {filteredTopics.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/ucenje?tema=${t.id}`}
                      aria-labelledby={`topic-${t.id}`}
                    >
                      <span>
                        <strong id={`topic-${t.id}`}>{t.title}</strong>
                        <span>{t.description}</span>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {filteredTopics.length === 0 && (
                <div className="learning-empty">
                  <p>
                    Нема теме за „{query}“. Пробајте „рад“, „куповина“, „подаци“
                    или „Устав“.
                  </p>
                  <Button variant="ghost" onClick={() => setQuery("")}>
                    Прикажи све теме
                  </Button>
                  <Link
                    href={`/?q=${encodeURIComponent(query)}&mode=full&view=list`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Потражи у тексту закона <ArrowRight />
                  </Link>
                </div>
              )}
            </TabsContent>
            <TabsContent value="progress">
              <section className="learning-personal">
                <p>
                  Ваши одговори остају у овом прегледачу. Напредак се не преноси
                  на друге уређаје.
                </p>
                <div className="learning-stats">
                  <div>
                    <strong>{answered.length}</strong>
                    <span>пређених питања</span>
                  </div>
                  <div>
                    <strong>{latestCorrect.length}</strong>
                    <span>тачних последњих одговора</span>
                  </div>
                  <div>
                    <strong>{due.length}</strong>
                    <span>питања за понављање</span>
                  </div>
                </div>
                {answered.length === 0 ? (
                  <div className="learning-empty">
                    <BookOpen />
                    <p>Ваш први корак почиње једном ситуацијом.</p>
                    <Button
                      onClick={() => router.push(quizHref("rad"))}
                      disabled={
                        !ready || !available.some((q) => q.topicId === "rad")
                      }
                    >
                      Почни са правима на послу <ArrowRight />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="learning-actions">
                      <Button
                        disabled={!due.length}
                        onClick={() => start("review", "all")}
                      >
                        <RotateCcw /> Понови питања за вежбање
                      </Button>
                    </div>
                    <p className="learning-caption">
                      Нетачне одговоре можете поновити одмах. Тачни се враћају
                      после 1, 3, 7 и 14 дана успешног понављања.
                    </p>
                    {due.length === 0 && (
                      <p className="learning-notice">
                        {nextReviewAt !== null
                          ? `Следеће понављање: ${new Date(nextReviewAt).toLocaleString("sr-RS", { timeZone: "Europe/Belgrade", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} (београдско време). `
                          : "Нема питања за понављање. "}
                        У међувремену можете да истражите нову тему.
                      </p>
                    )}
                    <div className="learning-result-list">
                      {learningTopics.map((t) => {
                        const total = available.filter(
                          (q) => q.topicId === t.id,
                        );
                        const completed = total.filter(
                          (q) => progress.answers[q.id],
                        ).length;
                        return (
                          <div key={t.id}>
                            <BookOpen size={18} />
                            <span>
                              <strong>{t.title}</strong>
                              <small>
                                Пређено {completed} од {total.length} питања
                              </small>
                            </span>
                            <Link
                              href={`/ucenje?tema=${t.id}`}
                              onClick={() => setPanel("topics")}
                              className="text-link"
                            >
                              Отвори тему →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        disabled={!ready || (!session && !answered.length)}
                      />
                    }
                  >
                    Обриши мој напредак
                  </DialogTrigger>
                  <DialogContent showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>
                        Обрисати напредак на овом уређају?
                      </DialogTitle>
                      <DialogDescription>
                        Биће уклоњени сачувани одговори и сесија у овом
                        прегледачу. Можете одмах да почнете поново.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Одустани
                      </DialogClose>
                      <Button
                        variant="destructive"
                        data-agent-confirm="Брише сачуване одговоре и напредак на овом уређају."
                        onClick={() => {
                          reset();
                          setResetOpen(false);
                        }}
                      >
                        Обриши напредак
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </section>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
