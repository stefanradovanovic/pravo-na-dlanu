"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Flag,
  Landmark,
  RotateCcw,
  Search,
  ShieldCheck,
  Scale,
  ShoppingBag,
  Shuffle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  reviewQuestions,
  submitAnswer,
  type LearningCatalog,
  type LearningMode,
  type LearningProgress,
  type LearningQuestion,
  type LearningTopicId,
} from "@/lib/learning";
import { useLearningProgress } from "./use-learning-progress";
import { QuestionCard } from "./question-card";
import { SourceDetails } from "./source-details";

const topicIcons = {
  ustav: Scale,
  potrosaci: ShoppingBag,
  rad: BriefcaseBusiness,
  privatnost: ShieldCheck,
  informacije: Landmark,
};
const modeDescriptions = {
  practice:
    "Пет кратких питања. Изаберите одговор и откријте зашто правило важи.",
  "what-if":
    "Две приче, по две верзије. Једна промењена чињеница може да промени закључак.",
  research: "Отворите збирку и пронађите правило које објашњава ситуацију.",
};

function SessionResults({
  progress,
  questions,
  onRetry,
  onClose,
  onTopic,
}: {
  progress: LearningProgress;
  questions: LearningQuestion[];
  onRetry: () => void;
  onClose: () => void;
  onTopic: (topic: LearningTopicId) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const session = progress.session!;
  const attempted = session.questionIds.map((id) =>
    questions.find((q) => q.id === id)!,
  );
  const correct = attempted.filter(
    (q) => session.answers[q.id] === q.correctChoiceId,
  );
  const nextTopic = learningTopics.find(
    (t) =>
      t.id !== session.topicId &&
      questions.some(
        (q) => q.topicId === t.id && !q.needsReview && !progress.answers[q.id],
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
              <SourceDetails source={q.source} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="learning-actions">
        {correct.length < attempted.length && (
          <Button onClick={onRetry}>
            <RotateCcw /> Понови питања која су била тешка
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
  const [mode, setMode] = useState<Exclude<LearningMode, "review">>("practice");
  const [sessionOpen, setSessionOpen] = useState(false);
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
  const session = progress.session;
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
  const topicLessons = lessons.filter((lesson) => lesson.topicId === topic?.id);
  const modeAvailable = relevant.some(
    (q) => q.kind === (mode === "practice" ? "scenario" : mode),
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
      return next ? { ...current, session: next } : current;
    });
    if (started) setSessionOpen(true);
  }
  function closeSession() {
    setSessionOpen(false);
    setPanel("topics");
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
      {sessionOpen && session ? (
        <div className="learning-session">
          <div className="learning-session-header">
            <Button variant="ghost" onClick={closeSession}>
              <ArrowLeft /> Сачувај и врати се
            </Button>
            <span>{modeLabels[session.mode]}</span>
          </div>
          {activeQuestion ? (
            <QuestionCard
              key={activeQuestion.id}
              question={activeQuestion}
              answer={session.answers[activeQuestion.id]}
              index={session.cursor}
              count={session.questionIds.length}
              onSubmit={(choice) =>
                update((p) =>
                  submitAnswer(p, activeQuestion, choice, Date.now()),
                )
              }
              onNext={() => update(advanceSession)}
            />
          ) : (
            <SessionResults
              progress={progress}
              questions={questions}
              onClose={closeSession}
              onTopic={(id) => start("practice", id)}
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
              <Button onClick={() => setSessionOpen(true)}>
                Настави сесију <ArrowRight />
              </Button>
            </div>
          )}
          <Tabs
            value={panel}
            onValueChange={(value) => setPanel(String(value))}
          >
            <TabsList aria-label="Учење">
              <TabsTrigger value="topics">
                <BookOpen /> Теме и вежбе
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Flag /> Моје учење
              </TabsTrigger>
            </TabsList>
            <TabsContent value="topics">
              {topic ? (
                <section className="learning-topic-detail">
                  <Link href="/ucenje" className="text-link">
                    ← Све теме
                  </Link>
                  <h2>{topic.title}</h2>
                  <p>{topic.description}</p>
                  <div className="learning-actions">
                    <Button
                      disabled={!ready || !modeAvailable}
                      onClick={() => start(mode, topic.id)}
                    >
                      Почни кратку вежбу <ArrowRight />
                    </Button>
                    <a
                      href="#vezba"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Пређи на вежбу <ArrowRight />
                    </a>
                    <Link href="/vodic" className="text-link">
                      Помоћ за читање закона
                    </Link>
                  </div>
                  <div className="learning-outcomes">
                    <h3>Шта ћете научити</h3>
                    <ul>
                      {topic.outcomes.map((outcome) => (
                        <li key={outcome}>
                          <Check size={17} aria-hidden="true" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <section
                    className="learning-lessons"
                    aria-label="Кратке лекције"
                  >
                    <h3>1. Упознајте правила</h3>
                    <p className="learning-caption">
                      Уредничка објашњења. За изворни текст отворите везу ка
                      члану у целом закону.
                    </p>
                    <Accordion
                      defaultValue={topicLessons[0] ? [topicLessons[0].id] : []}
                      key={topic.id}
                    >
                      {topicLessons.map((l) => (
                        <AccordionItem value={l.id} key={l.id}>
                          <AccordionTrigger>{l.title}</AccordionTrigger>
                          <AccordionContent>
                            <article aria-label={l.title}>
                              {l.needsReview ? (
                                <p>
                                  Објашњење је на поновној провери због промене
                                  извора.
                                </p>
                              ) : (
                                <>
                                  <p>{l.text}</p>
                                  <SourceDetails source={l.source} />
                                </>
                              )}
                            </article>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                </section>
              ) : (
                <>
                  <section
                    className="learning-orientation"
                    aria-labelledby="learning-orientation-title"
                  >
                    <div>
                      <span className="eyebrow">ПРВИ ПУТ СТЕ ОВДЕ?</span>
                      <h2 id="learning-orientation-title">
                        Од читања до разумевања.
                      </h2>
                      <p>
                        Научите како да пронађете члан и проверите извор. Затим
                        изаберите тему и испробајте кратку вежбу.
                      </p>
                    </div>
                    <Link
                      href="/vodic"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Водич за читање закона <ArrowRight />
                    </Link>
                  </section>
                  <div className="learning-section-heading">
                    <div>
                      <h2>Која тема вас занима?</h2>
                      <p>Почните од ситуација које препознајете.</p>
                    </div>
                    <div className="learning-search">
                      <Search size={17} />
                      <Input
                        aria-label="Претрага тема за учење"
                        placeholder="Посао, куповина, подаци…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="learning-topic-grid">
                    {filteredTopics.map((t) => {
                      const Icon = topicIcons[t.id];
                      const topicQuestions = available.filter(
                        (q) => q.topicId === t.id,
                      );
                      const count = topicQuestions.filter(
                        (q) => progress.answers[q.id],
                      ).length;
                      return (
                        <article className="learning-topic-card" key={t.id}>
                          <div className="learning-row">
                            <Icon size={25} />
                            <span className="eyebrow">
                              ТЕМА{" "}
                              {String(learningTopics.indexOf(t) + 1).padStart(
                                2,
                                "0",
                              )}
                            </span>
                          </div>
                          <h3>{t.title}</h3>
                          <p>{t.description}</p>
                          <span className="learning-caption">
                            {topicQuestions.length} питања · кратке сесије
                          </span>
                          <progress
                            className="learning-progress"
                            aria-label={`Пређено: ${t.title}`}
                            value={count}
                            max={Math.max(1, topicQuestions.length)}
                          />
                          <div className="learning-row">
                            <span className="learning-caption">
                              Пређено {count} / {topicQuestions.length}
                            </span>
                            <Link
                              href={`/ucenje?tema=${t.id}`}
                              className={buttonVariants({ variant: "outline" })}
                            >
                              Изабери тему <ArrowRight />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {filteredTopics.length === 0 && (
                    <div className="learning-empty">
                      <p>
                        Нема теме за „{query}“. Пробајте „рад“, „куповина“,
                        „подаци“ или „Устав“.
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
                </>
              )}
              <section id="vezba" className="learning-practice-panel">
                <div className="learning-section-heading">
                  <div>
                    <span className="eyebrow">МАЛА ВЕЖБА, ЈАСНИЈЕ ПРАВИЛО</span>
                    <h2>
                      {topic
                        ? "2. Проверите разумевање"
                        : "Испробајте питања из свих тема"}
                    </h2>
                  </div>
                  <Badge variant="outline">Без временског ограничења</Badge>
                </div>
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as typeof mode)}
                >
                  <TabsList aria-label="Начин вежбања">
                    <TabsTrigger value="practice">
                      <BookOpen /> Ситуације
                    </TabsTrigger>
                    <TabsTrigger value="what-if">
                      <Shuffle /> Шта ако…?
                    </TabsTrigger>
                    <TabsTrigger value="research">
                      <Search /> Пронађи правило
                    </TabsTrigger>
                  </TabsList>
                  {(["practice", "what-if", "research"] as const).map((m) => (
                    <TabsContent value={m} key={m}>
                      <p>{modeDescriptions[m]}</p>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="learning-actions">
                  <Button
                    size="lg"
                    disabled={!ready || !modeAvailable}
                    onClick={() => start(mode, topic?.id ?? "all")}
                  >
                    Почни вежбу <ArrowRight />
                  </Button>
                  {due.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => start("review", topic?.id ?? "all")}
                      disabled={
                        !due.some((q) => !topic || q.topicId === topic.id)
                      }
                    >
                      <RotateCcw /> Понови и утврди
                    </Button>
                  )}
                </div>
                {inProgress && (
                  <p className="learning-caption">
                    Нова вежба замењује незавршену сесију. Претходни одговори
                    остају у напретку.
                  </p>
                )}
                {!modeAvailable && (
                  <p className="learning-caption">
                    Ова вежба тренутно нема питања доступна за изабрану тему.
                  </p>
                )}
              </section>
            </TabsContent>
            <TabsContent value="progress">
              <section className="learning-personal">
                <h2>Моје учење</h2>
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
                      onClick={() => start("practice", "rad")}
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
                        disabled={!ready || !answered.length}
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
                        onClick={() => {
                          reset();
                          setResetOpen(false);
                          setSessionOpen(false);
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
      <aside className="learning-editorial-note">
        <strong>Учење уз извор.</strong>
        <p>
          Ситуације су измишљене и поједностављене. Питања и објашњења су
          машински припремљени уреднички материјал, без стручне правне
          рецензије. Нису део закона нити правни савет. За конкретан случај
          важни су цео важећи текст, чињенице и стручна помоћ.
        </p>
      </aside>
    </div>
  );
}
