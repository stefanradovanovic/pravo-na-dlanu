import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ReadingGlossary } from "@/components/learning/reading-guide";
import { findLearningLaw } from "@/lib/registry";
import { lawPath } from "@/lib/registry-types";
import "./guide.css";

export const metadata: Metadata = {
  title: "Како да читате закон — водич за почетак",
  description:
    "Пет корака од претраге до разумевања правила: чланови, извори, верзије, изузеци и мали речник за читање закона.",
};

export default function ReadingGuidePage() {
  const constitution = findLearningLaw("ustav")!;
  const constitutionHref = lawPath(constitution);

  return (
    <main id="main" className="reading-guide-page">
      <header className="guide-intro">
        <div className="eyebrow">
          <Compass size={16} /> ПРВИ КОРАК У УЧЕЊУ
        </div>
        <h1>
          Како да читате закон,
          <br />
          <span>корак по корак.</span>
        </h1>
        <p>
          Не морате да знате све правне изразе да бисте почели. Научите где да
          тражите правило, шта да прочитате уз њега и како да проверите извор.
        </p>
        <div className="guide-intro-actions">
          <a href="#koraci" className={buttonVariants({ size: "lg" })}>
            Почни од пет корака <ArrowRight />
          </a>
          <a
            href="#recnik"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <BookOpen /> Отвори мали речник
          </a>
        </div>
      </header>

      <div className="guide-body">
        <section
          id="koraci"
          aria-labelledby="steps-title"
          className="guide-method"
        >
          <div className="guide-section-heading">
            <div>
              <span className="eyebrow">ОД ПИТАЊА ДО ИЗВОРА</span>
              <h2 id="steps-title">Пет корака за пажљиво читање</h2>
            </div>
          </div>
          <ol className="guide-steps">
            <li>
              <span className="guide-step-number" aria-hidden="true">
                01
              </span>
              <div>
                <h3>Почните од једног питања</h3>
                <p>
                  Запишите шта желите да сазнате и издвојите главне речи. Ако
                  знате назив закона, користите претрагу „Назив закона”. Ако
                  тражите правило или израз унутар закона, изаберите „Цео
                  текст”.
                </p>
                <p className="guide-tip">
                  Претрага прихвата ћирилицу, латиницу и унос без квачица. За
                  мање резултата додајте прецизнију реч; ако нема резултата,
                  скратите упит.
                </p>
                <Link href="/" className="text-link">
                  Отвори претрагу закона <ArrowRight size={16} />
                </Link>
              </div>
            </li>
            <li>
              <span className="guide-step-number" aria-hidden="true">
                02
              </span>
              <div>
                <h3>Проверите који документ читате</h3>
                <p>
                  Погледајте пун назив, изворну објаву и обухват. Отворите ПИС
                  линк уз документ и упоредите верзију и напомене. Датум
                  преузимања говори када смо приступили извору, а не да је закон
                  тада донет или правно проверен.
                </p>
                <p className="guide-tip">
                  Присуство у каталогу није потврда да се свака одредба
                  примењује данас. Проверите статус и датуме у самом акту и
                  извору.
                </p>
                <Link href="/o-projektu" className="text-link">
                  Шта збирка обухвата <ArrowRight size={16} />
                </Link>
              </div>
            </li>
            <li>
              <span className="guide-step-number" aria-hidden="true">
                03
              </span>
              <div>
                <h3>Пронађите члан, па прочитајте контекст</h3>
                <p>
                  У садржају закона изаберите члан или унесите његов број. На
                  телефону отворите „Садржај закона”. Прочитајте цео члан,
                  суседне одредбе и све чланове на које се текст позива.
                </p>
                <p className="guide-tip">
                  Тражите одговоре: на кога се правило односи, под којим
                  условима, шта се тражи и да ли постоји изузетак. Обратите
                  пажњу на речи „ако”, „осим”, „може” и „дужан је”.
                </p>
              </div>
            </li>
            <li>
              <span className="guide-step-number" aria-hidden="true">
                04
              </span>
              <div>
                <h3>Проверите датуме и прелазна правила</h3>
                <p>
                  Потражите прелазне и завршне одредбе. Посебно проверите
                  ступање на снагу, почетак примене и правила за већ започете
                  поступке. Упоредите их са датумом догађаја који вас занима.
                </p>
                <p className="guide-tip">
                  Сам број године у називу објаве није довољан за закључак о
                  примени. Прочитајте и напомене и одредбе измена које су
                  укључене у документ.
                </p>
                <a href={`${constitutionHref}#clan-196`} className="text-link">
                  Устав о објављивању прописа — члан 196{" "}
                  <ArrowRight size={16} />
                </a>
              </div>
            </li>
            <li>
              <span className="guide-step-number" aria-hidden="true">
                05
              </span>
              <div>
                <h3>Проверите разумевање и сачувајте извор</h3>
                <p>
                  Објасните правило својим речима, уз услове и изузетке које сте
                  нашли. Забележите закон, члан и верзију. У читачу можете
                  копирати линк, увећати текст или штампати документ.
                </p>
                <p className="guide-tip">
                  Веза „Назад на резултате” враћа вас на претрагу из које сте
                  отворили закон. У вежбама проверите разумевање на измишљеним
                  ситуацијама и упоредите одговор са извором.
                </p>
                <Link href="/ucenje" className="text-link">
                  Учи и провери знање <ArrowRight size={16} />
                </Link>
              </div>
            </li>
          </ol>
        </section>

        <section className="guide-layers" aria-labelledby="layers-title">
          <span className="eyebrow">ТРИ РАЗЛИЧИТЕ ВРСТЕ САДРЖАЈА</span>
          <h2 id="layers-title">Шта је текст закона, а шта помоћ у учењу?</h2>
          <div className="guide-layer-grid">
            <article>
              <h3>Текст прописа</h3>
              <p>
                Преузет документ са ПИС извора, са наведеном верзијом и
                обухватом. Овде читате саме одредбе.
              </p>
            </article>
            <article>
              <h3>Уредничко објашњење</h3>
              <p>
                Поједностављено тумачење за учење. Може да помогне у разумевању,
                али се увек враћајте на цео текст и контекст.
              </p>
            </article>
            <article>
              <h3>Измишљена ситуација</h3>
              <p>
                Сценарио за вежбу, а не судски случај или одлука органа. Промена
                једне чињенице може променити одговор.
              </p>
            </article>
          </div>
          <p className="guide-editorial-note">
            Овај водич и речник су уредничка помоћ за читање, не текст прописа.
            Едукативни материјал је машински припремљен и није прошао стручну
            правну рецензију.
          </p>
        </section>

        <ReadingGlossary />

        <section className="guide-source" aria-labelledby="guide-source-title">
          <h2 id="guide-source-title">Извор за даље читање</h2>
          <p>
            Веза у четвртом кораку води на члан 196 у целом документу Устава.
            Остатак водича објашњава начин коришћења збирке и читања, без
            цитирања одредаба.
          </p>
          <p>{constitution.citation}</p>
          <p>
            Извор преузет: {constitution.fetchedAt.slice(0, 10)}. Датум приступа
            није потврда правног важења нити стручна рецензија.
          </p>
          <a
            href={constitution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Погледај званични ПИС извор ↗
          </a>
        </section>

        <div className="guide-next">
          <div>
            <h2>Следећи корак је ваш.</h2>
            <p>
              Изаберите тему за кратку вежбу или отворите закон који вас занима.
            </p>
          </div>
          <div className="guide-intro-actions">
            <Link href="/ucenje" className={buttonVariants({ size: "lg" })}>
              <BookOpen /> Изабери тему
            </Link>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Search /> Истражи законе
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
