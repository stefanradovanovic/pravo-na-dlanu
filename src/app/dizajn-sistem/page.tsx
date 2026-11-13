import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BookOpen, Lightbulb, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  ["ponasanje", "06", "Понашање и провера"],
] as const;

const colors = [
  ["background", "Папир", "Основна позадина"],
  ["card", "Површина", "Картице и панели"],
  ["foreground", "Мастило", "Главни текст"],
  ["primary", "Главна радња", "Дугмад и избор"],
  ["chrome", "Тамно заглавље", "Оријентација и навигација"],
  ["sidebar", "Садржај закона", "Мирна бочна површина"],
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
          <Badge variant="outline">Верзија 2.0</Badge>
        </div>
        <p>
          Заједнички визуелни језик за право које је лакше пронаћи, читати и
          разумети. Мирне површине, јасна хијерархија и познате компоненте.
        </p>
        <div className="ds-hero-meta">
          <span>Ћирилица на првом месту</span>
          <span>shadcn/ui · UI SDK</span>
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
              Бела површина за читање, тамно заглавље и тиркизне радње.
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
                <code>Literata · 40 / 50</code>
              </div>
              <p className="ds-display-text">Право које разумете.</p>
            </div>
            <div className="ds-type-specimen">
              <div className="ds-type-info">
                <span>ИНТЕРФЕЈС</span>
                <code>IBM Plex Sans · 15 / 24</code>
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
                <code>Literata · 18 / 30,6</code>
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
                <code>IBM Plex Sans · 13 / 21</code>
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
                ["sm", "Мали", "3,6"],
                ["md", "Средњи", "4,8"],
                ["lg", "Основни", "6"],
                ["xl", "Велики", "8,4"],
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
              Контроле и панели користе основни радијус од 6 px. На додирним
              екранима контроле имају површину од најмање 44 × 44 px. Ширина
              текста прилагођава се екрану; табеле у прописима задржавају
              хоризонтално померање.
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

          <section id="ponasanje" className="ds-section">
            <SectionHeading number="06" title="Понашање које не омета читање">
              Један скуп компоненти за каталог, учење и читач.
            </SectionHeading>
            <ol className="ds-steps">
              <li>
                <strong>Одзив је непосредан.</strong>
                <span>
                  Претрага, избор картице и прелазак на члан немају уводне
                  анимације. Промена боје траје 100 ms; повремени дијалог или
                  панел 200 ms.
                </span>
              </li>
              <li>
                <strong>Тастатура и додир су равноправни.</strong>
                <span>
                  Видљив фокус, повратак фокуса после дијалога, Escape за
                  затварање и контроле од најмање 44 px на додирном екрану.
                </span>
              </li>
              <li>
                <strong>Корисник контролише читање.</strong>
                <span>
                  Подразумеван текст од 18 px може се подесити од 16 до 24 px.
                  Увећање странице и избор текста остају доступни. Умањено
                  кретање искључује прелазе.
                </span>
              </li>
              <li>
                <strong>Провера користи стварне крајности.</strong>
                <span>
                  Дугачки називи и верзије прописа, више од хиљаду чланова,
                  празна претрага и уски екрани. Цео закон и садржај доступни су
                  и без JavaScript-а.
                </span>
              </li>
            </ol>
            <p className="ds-paragraph">
              Понашање сложених контрола обезбеђује{" "}
              <a href="https://ui-sdk.dev/" target="_blank" rel="noreferrer">
                UI SDK
              </a>
              . Локалне shadcn/ui компоненте задржавају познате варијанте и
              заједничке токене. Правила обликовања и провере ослањају се на{" "}
              <a
                href="https://aiforui.dev/skills"
                target="_blank"
                rel="noreferrer"
              >
                AI for UI
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
