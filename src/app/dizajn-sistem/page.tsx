import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArrowUpRight, BookOpen, Lightbulb, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ComponentExamples } from "./components";
import "./system.css";

export const metadata: Metadata = {
  title: "Дизајн систем",
  description:
    "Боје, типографија, компоненте и правила приказа за Право на длану.",
  robots: { index: false, follow: false },
};

const sections = [
  ["boje", "01", "Боје и површине"],
  ["tipografija", "02", "Типографија"],
  ["razmaci", "03", "Размаци и облик"],
  ["komponente", "04", "Компоненте"],
  ["sadrzaj", "05", "Језик садржаја"],
  ["figma", "06", "Рад у Фигми"],
] as const;

const colors = [
  ["background", "Папир", "Основна позадина"],
  ["card", "Површина", "Картице и панели"],
  ["foreground", "Мастило", "Главни текст"],
  ["primary", "Главна радња", "Дугмад и избор"],
  ["brand", "Теракота", "Идентитет и нагласак"],
  ["muted", "Тиха површина", "Секундарни садржај"],
  ["muted-foreground", "Пратећи текст", "Описи и метаподаци"],
  ["border", "Ивица", "Раздвајање целина"],
] as const;

function SectionHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="ds-section-heading">
      <span className="ds-number">{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </header>
  );
}

export default function DesignSystemPage() {
  return (
    <main id="main" className="ds-page">
      <header className="ds-hero">
        <div className="ds-kicker">
          <Scale size={16} aria-hidden="true" /> ПРАВО НА ДЛАНУ / ДИЗАЈН СИСТЕМ
        </div>
        <div className="ds-hero-title">
          <h1>Јасноћа у сваком детаљу.</h1>
          <Badge variant="outline">Верзија 1.0</Badge>
        </div>
        <p>
          Заједнички визуелни језик за право које је лакше пронаћи, читати и
          разумети. Мирне површине, јасна хијерархија и познате компоненте.
        </p>
        <div className="ds-hero-meta">
          <span>Ћирилица на првом месту</span>
          <span>shadcn/ui · Base UI</span>
          <span>Приступачност као основа</span>
        </div>
      </header>

      <div className="ds-layout">
        <aside className="ds-sidebar">
          <p className="ds-kicker">У ОВОМ ВОДИЧУ</p>
          <nav aria-label="Садржај дизајн система">
            {sections.map(([id, number, title]) => (
              <a key={id} href={`#${id}`}>
                <span>{number}</span>
                {title}
              </a>
            ))}
          </nav>
          <p className="ds-sidebar-note">
            Исте компоненте које покрећу каталог и читач, приказане на једном
            месту.
          </p>
        </aside>

        <div className="ds-content">
          <section id="boje" className="ds-section">
            <SectionHeading number="01" title="Боје и површине">
              Топла подлога, тамно мастило и један препознатљив акценат.
            </SectionHeading>
            <div className="ds-palette">
              {colors.map(([token, name, use]) => (
                <div className="ds-swatch" key={token}>
                  <div
                    className="ds-swatch-color"
                    style={{ backgroundColor: `var(--${token})` }}
                  />
                  <strong>{name}</strong>
                  <span>{use}</span>
                  <code>--{token}</code>
                </div>
              ))}
            </div>
            <div className="ds-note">
              Боју увек прати назив, икона или објашњење. Зелена ознака сама по
              себи не значи да је пропис правно проверен.
            </div>
            <div className="ds-theme-samples">
              <div className="ds-theme-sample">
                <Badge variant="secondary">Светла тема</Badge>
                <strong>Простор за читање.</strong>
                <p>Основна тема каталога и читача.</p>
              </div>
              <div className="dark ds-theme-sample">
                <Badge variant="secondary">Тамна тема компоненти</Badge>
                <strong>Исти језик, друга подлога.</strong>
                <p>Узорак токена; није прекидач теме сајта.</p>
              </div>
            </div>
          </section>

          <section id="tipografija" className="ds-section">
            <SectionHeading number="02" title="Типографија">
              Јасан интерфејс и миран ритам дугог текста. Без спољног учитавања
              фонтова.
            </SectionHeading>
            <div className="ds-type-specimen">
              <div className="ds-type-info">
                <span>НАСЛОВ</span>
                <code>Georgia · 44 / 53</code>
              </div>
              <p className="ds-display-text">Право које разумете.</p>
            </div>
            <div className="ds-type-specimen">
              <div className="ds-type-info">
                <span>ИНТЕРФЕЈС</span>
                <code>Arial · 14 / 22</code>
              </div>
              <div className="ds-ui-text">
                <strong>Пронађите пропис који вам је потребан.</strong>
                <p>
                  Дугмад и описи говоре јасно шта следи. Љ, Њ, Ђ, Ћ, Џ — свако
                  слово има своје место.
                </p>
              </div>
            </div>
            <div className="ds-type-specimen">
              <div className="ds-type-info">
                <span>ЧИТАЊЕ</span>
                <code>Georgia · 16 / 24</code>
              </div>
              <p className="ds-reading-text">
                Ово је типографски узорак, а не цитат прописа. Дужи текст има
                удобан проред и јасне пасусе. Читалац у читачу може да прилагоди
                величину слова и размак између редова.
              </p>
            </div>
            <div className="ds-type-specimen">
              <div className="ds-type-info">
                <span>МЕТАПОДАЦИ</span>
                <code>Arial · 12 / 19</code>
              </div>
              <p className="ds-caption-text">
                Извор, верзија, датум приступа и обухват приказују се као
                засебни подаци.
              </p>
            </div>
          </section>

          <section id="razmaci" className="ds-section">
            <SectionHeading number="03" title="Размаци и облик">
              Основа је 4 пиксела. Ивице прате постојећу shadcn/ui скалу.
            </SectionHeading>
            <div className="ds-spacing-scale">
              {[1, 2, 3, 4, 6, 8, 12, 16].map((step) => (
                <div key={step}>
                  <span
                    className="ds-spacing-bar"
                    style={{ height: `var(--space-${step})` } as CSSProperties}
                  />
                  <strong>{step * 4}</strong>
                  <code>{step}</code>
                </div>
              ))}
            </div>
            <div className="ds-radius-scale">
              {[
                ["sm", "Мали", "5,28"],
                ["md", "Средњи", "7,04"],
                ["lg", "Основни", "8,8"],
                ["xl", "Велики", "12,32"],
              ].map(([size, label, pixels]) => (
                <div key={size}>
                  <span style={{ borderRadius: `var(--radius-${size})` }} />
                  <strong>{label}</strong>
                  <code>
                    {pixels} px · radius-{size}
                  </code>
                </div>
              ))}
            </div>
            <p className="ds-note">
              Картице и дијалози користе већи радијус, контроле постојеће
              варијанте. Ширина текста прилагођава се екрану; табеле у прописима
              задржавају хоризонтално померање.
            </p>
          </section>

          <section id="komponente" className="ds-section">
            <SectionHeading number="04" title="Компоненте у раду">
              Испробајте стварне компоненте: избор, претрагу, дијалог и бочни
              панел.
            </SectionHeading>
            <ComponentExamples />
          </section>

          <section id="sadrzaj" className="ds-section">
            <SectionHeading
              number="05"
              title="Три врсте садржаја. Јасне границе."
            >
              Правила приказа, без цитирања закона и без нових правних тумачења.
            </SectionHeading>
            <div className="ds-content-patterns">
              <article className="ds-content-pattern">
                <BookOpen size={20} aria-hidden="true" />
                <Badge variant="outline">Текст прописа</Badge>
                <h3>Извор има предност.</h3>
                <p>
                  Изворни текст остаје непромењен. Уз њега су ПИС извор, стварна
                  верзија, датум приступа и обухват. Извод је увек означен као
                  извод.
                </p>
              </article>
              <article className="ds-content-pattern ds-editorial-pattern">
                <Lightbulb size={20} aria-hidden="true" />
                <Badge variant="outline">Уредничко објашњење</Badge>
                <h3>Објашњење има своје место.</h3>
                <p>
                  Одвојена површина, јасан наслов и веза ка пропису. Објашњење
                  никада не замењује цитирани текст.
                </p>
              </article>
              <article className="ds-content-pattern">
                <Scale size={20} aria-hidden="true" />
                <Badge variant="outline">Измишљен пример</Badge>
                <h3>Пример служи учењу.</h3>
                <p>
                  Ознака је видљива пре приче и питања. Одговор има објашњење и
                  везу ка правилу; не представља стварни случај.
                </p>
              </article>
            </div>
            <div className="ds-note">
              Датум приступа извору није датум правне провере. Називи и напомене
              морају пренети ту разлику и без ослањања на боју.
            </div>
          </section>

          <section id="figma" className="ds-section">
            <SectionHeading number="06" title="Од Фигме до интерфејса">
              Заједничка имена токена повезују дизајн и код.
            </SectionHeading>
            <p className="ds-paragraph">
              Полазна библиотека је{" "}
              <a
                href="https://www.figma.com/community/file/1203061493325953101/shadcn-ui-design-system"
                target="_blank"
                rel="noreferrer"
              >
                shadcn/ui — Design System, Пјетро Скирано
              </a>
              . Њен опис наводи Radix UI и Next.js 13. Овај пројекат користи
              Base UI и стил base-nova, па димензије, стања и понашање
              усклађујемо са овим приказом.
            </p>
            <ol className="ds-steps">
              <li>
                <strong>Поставите основе.</strong>
                <span>
                  Боје именујте према улози: background, foreground, primary,
                  brand. Користите фонтове и размаке из овог водича.
                </span>
              </li>
              <li>
                <strong>Ускладите варијанте.</strong>
                <span>
                  Дугмад, поља и ознаке треба да имају иста имена варијанти као
                  локалне компоненте. Прикажите фокус, грешку и онемогућено
                  стање.
                </span>
              </li>
              <li>
                <strong>Проверите у контексту.</strong>
                <span>
                  Дугачак ћирилични наслов, уски екран и навигација тастатуром
                  део су сваког прегледа.
                </span>
              </li>
            </ol>
            <a
              className={buttonVariants({ variant: "outline" })}
              href="https://www.figma.com/community/file/1203061493325953101/shadcn-ui-design-system"
              target="_blank"
              rel="noreferrer"
            >
              Отвори референцу у Фигми <ArrowUpRight aria-hidden="true" />
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
