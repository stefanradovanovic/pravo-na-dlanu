import { assemblyMap } from "./assembly-map";
import { constitutionalCourtMap } from "./constitutional-court-map";
import { governmentMap } from "./government-map";
import { localGovernmentMap } from "./local-government-map";

export type InstitutionSource = {
  title: string;
  href: string;
};

export type InstitutionNode = {
  id: string;
  name: string;
  summary: string;
  sources: InstitutionSource[];
  relatedMap?: { id: string; label: string };
};

export type InstitutionEdge = {
  from: string;
  to: string;
  label: string;
  detail: string;
  sources: InstitutionSource[];
};

type ProcedureStep = {
  title: string;
  text: string;
  sources: InstitutionSource[];
};

export type InstitutionProcedure = {
  title: string;
  intro?: string;
  steps: ProcedureStep[];
  note?: ProcedureStep;
};

export type InstitutionMap = {
  id: string;
  title: string;
  question: string;
  nodes: InstitutionNode[];
  edges: InstitutionEdge[];
  procedure?: InstitutionProcedure;
};

export const institutionMaps: InstitutionMap[] = [
  {
    id: "vlast",
    title: "Државна власт",
    question: "Ко предлаже закон, ко га доноси и ко по њему суди?",
    nodes: [
      {
        id: "skupstina",
        name: "Народна скупштина",
        relatedMap: {
          id: "narodna-skupstina",
          label: "Како ради Народна скупштина?",
        },
        summary:
          "Народни посланици доносе законе, усвајају буџет и надзиру рад Владе. На пример, Влада предлаже републички буџет, а Скупштина гласа о њему.",
        sources: [
          {
            title: "Устав, члан 99.",
            href: "/propisi/ustav-republike-srbije#clan-99",
          },
        ],
      },
      {
        id: "vlada",
        name: "Влада",
        relatedMap: { id: "vlada", label: "Како ради Влада?" },
        summary:
          "Влада води државну политику и извршава законе. Може да предложи нов закон и да донесе уредбу којом ближе уређује како се закон спроводи.",
        sources: [
          {
            title: "Устав, члан 123.",
            href: "/propisi/ustav-republike-srbije#clan-123",
          },
        ],
      },
      {
        id: "predsednik",
        name: "Председник Републике",
        summary:
          "Председник представља Србију. Када Скупштина изгласа закон, председник га указом проглашава или га уз образложење враћа посланицима на поновно одлучивање.",
        sources: [
          {
            title: "Устав, члан 112.",
            href: "/propisi/ustav-republike-srbije#clan-112",
          },
          {
            title: "Устав, члан 113.",
            href: "/propisi/ustav-republike-srbije#clan-113",
          },
        ],
      },
      {
        id: "sudovi",
        name: "Судови",
        summary:
          "Независни судови одлучују у појединачним предметима. Закон одређује који суд решава коју врсту спора, а судија примењује право на чињенице конкретног случаја.",
        sources: [
          {
            title: "Устав, члан 142.",
            href: "/propisi/ustav-republike-srbije#clan-142",
          },
          {
            title: "Устав, члан 143.",
            href: "/propisi/ustav-republike-srbije#clan-143",
          },
          {
            title: "Устав, члан 144.",
            href: "/propisi/ustav-republike-srbije#clan-144",
          },
        ],
      },
    ],
    edges: [
      {
        from: "vlada",
        to: "skupstina",
        label: "предлаже закон",
        detail:
          "Влада може да упути предлог закона Народној скупштини. О предлогу гласају народни посланици.",
        sources: [
          {
            title: "Устав, члан 123.",
            href: "/propisi/ustav-republike-srbije#clan-123",
          },
          {
            title: "Устав, члан 99.",
            href: "/propisi/ustav-republike-srbije#clan-99",
          },
        ],
      },
      {
        from: "skupstina",
        to: "vlada",
        label: "бира и надзире",
        detail:
          "Скупштина бира Владу. И након избора, посланици надзиру њен рад и одлучују о поверењу Влади.",
        sources: [
          {
            title: "Устав, члан 99.",
            href: "/propisi/ustav-republike-srbije#clan-99",
          },
          {
            title: "Устав, члан 130.",
            href: "/propisi/ustav-republike-srbije#clan-130",
          },
        ],
      },
      {
        from: "predsednik",
        to: "skupstina",
        label: "може да врати закон",
        detail:
          "Председник може да врати изгласани закон уз писмено образложење. Ако га Скупштина поново изгласа већином од укупног броја посланика, председник је дужан да га прогласи.",
        sources: [
          {
            title: "Устав, члан 113.",
            href: "/propisi/ustav-republike-srbije#clan-113",
          },
        ],
      },
      {
        from: "skupstina",
        to: "sudovi",
        label: "законом уређује судове",
        detail:
          "Народна скупштина законом одређује врсте судова, њихово подручје и надлежност. О исходу појединачног предмета одлучује независан суд.",
        sources: [
          {
            title: "Устав, члан 143.",
            href: "/propisi/ustav-republike-srbije#clan-143",
          },
          {
            title: "Устав, члан 142.",
            href: "/propisi/ustav-republike-srbije#clan-142",
          },
        ],
      },
    ],
  },
  assemblyMap,
  governmentMap,
  constitutionalCourtMap,
  localGovernmentMap,
  {
    id: "sudovi",
    title: "Судови",
    question: "Ко одлучује о жалби на пресуду, а ко о уставности закона?",
    nodes: [
      {
        id: "prvi-osnovni",
        name: "Први основни суд у Београду",
        summary:
          "Овај суд покрива Врачар, Звездару, Палилулу, Савски венац и Стари град. У првом степену суди, између осталог, у стамбеним споровима и споровима о правима из радног односа.",
        sources: [
          {
            title:
              "Закон о седиштима и подручјима судова и јавних тужилаштава, члан 3.",
            href: "/propisi/zakon-o-sedistima-i-podrucjima-sudova-i-javnih-tuzilastava-f2d47680-3867-4d88-b830-fbbf70ab8a7f#clan-3",
          },
          {
            title: "Закон о уређењу судова, члан 24.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-24",
          },
        ],
      },
      {
        id: "visi",
        name: "Виши суд у Београду",
        summary:
          "Виши суд има две улоге. Сам суди у појединим предметима, на пример у спору за утврђивање очинства. Одлучује и о одређеним жалбама на одлуке основних судова.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 25.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-25",
          },
        ],
      },
      {
        id: "apelacioni",
        name: "Апелациони суд у Београду",
        summary:
          "Апелациони суд разматра жалбе на првостепене одлуке виших судова. Разматра и жалбе на грађанске пресуде основних судова за које закон није одредио виши суд.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 26.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-26",
          },
        ],
      },
      {
        id: "vrhovni",
        name: "Врховни суд",
        summary:
          "Највиши суд у Србији стара се о томе да судови уједначено примењују право. О судским одлукама може поново да одлучује кад закон допушта ванредно правно средство.",
        sources: [
          {
            title: "Устав, члан 143.",
            href: "/propisi/ustav-republike-srbije#clan-143",
          },
          {
            title: "Закон о уређењу судова, члан 32.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-32",
          },
        ],
      },
      {
        id: "ustavni",
        name: "Уставни суд",
        relatedMap: { id: "ustavni-sud", label: "Како ради Уставни суд?" },
        summary:
          "Уставни суд оцењује сагласност закона са Уставом. Одлучује и о уставним жалбама ради заштите људских и мањинских права и слобода које јемчи Устав. Жалбом се оспорава појединачни акт или радња јавне власти, по правилу кад су друга правна средства исцрпљена или нису предвиђена.",
        sources: [
          {
            title: "Устав, члан 167.",
            href: "/propisi/ustav-republike-srbije#clan-167",
          },
          {
            title: "Устав, члан 170.",
            href: "/propisi/ustav-republike-srbije#clan-170",
          },
        ],
      },
    ],
    edges: [
      {
        from: "visi",
        to: "prvi-osnovni",
        label: "одлучује о жалби у спору мале вредности",
        detail:
          "Ако странка оспори пресуду Првог основног суда у спору мале вредности, о тој жалби одлучује Виши суд у Београду.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 25.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-25",
          },
          {
            title:
              "Закон о седиштима и подручјима судова и јавних тужилаштава, члан 4.",
            href: "/propisi/zakon-o-sedistima-i-podrucjima-sudova-i-javnih-tuzilastava-f2d47680-3867-4d88-b830-fbbf70ab8a7f#clan-4",
          },
        ],
      },
      {
        from: "apelacioni",
        to: "prvi-osnovni",
        label: "одлучује о жалби на пресуду о отказу",
        detail:
          "Кад Први основни суд пресуди у спору о законитости отказа уговора о раду, о жалби на ту пресуду одлучује Апелациони суд у Београду. Спорови из радног односа изузети су из поступка за спорове мале вредности.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 26.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-26",
          },
          {
            title: "Закон о парничном поступку, члан 469.",
            href: "/propisi/zakon-o-parnicnom-postupku#clan-469",
          },
        ],
      },
      {
        from: "apelacioni",
        to: "visi",
        label: "испитује првостепену пресуду",
        detail:
          "Када Виши суд суди у првом степену, о жалби на његову пресуду одлучује Апелациони суд. То важи, на пример, за пресуду у спору за утврђивање очинства.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 26.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-26",
          },
          {
            title: "Закон о уређењу судова, члан 25.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-25",
          },
        ],
      },
      {
        from: "apelacioni",
        to: "vrhovni",
        label: "указује на спорно питање",
        detail:
          "Када је правно питање важно за рад судова и уједначавање судске праксе, Апелациони суд о њему обавештава Врховни суд.",
        sources: [
          {
            title: "Закон о уређењу судова, члан 26.",
            href: "/propisi/zakon-o-uredjenju-sudova#clan-26",
          },
        ],
      },
      {
        from: "prvi-osnovni",
        to: "ustavni",
        label: "тражи оцену уставности",
        detail:
          "Ако суд у свом предмету оцени да је основано питање да ли је закон у складу са Уставом, застаје са суђењем и покреће поступак пред Уставним судом. Уставни суд тада разматра сам пропис.",
        sources: [
          {
            title: "Закон о Уставном суду, члан 63.",
            href: "/propisi/zakon-o-ustavnom-sudu#clan-63",
          },
        ],
      },
    ],
  },
  {
    id: "zastita-prava",
    title: "Заштита права",
    question:
      "Од кога тражим јавни документ и коме се обраћам кад настане проблем?",
    nodes: [
      {
        id: "gradjanin",
        name: "Грађанин",
        summary:
          "Свако може да тражи увид у документ који садржи информацију од јавног значаја или копију тог документа. Наведите назив органа, своје име, презиме и адресу и опишите информацију коју тражите. Разлог можете задржати за себе.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 5.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-5",
          },
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 15.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-15",
          },
        ],
      },
      {
        id: "ministarstvo",
        name: "Министарство",
        summary:
          "Министарство је орган државне управе. Ако тражите информацију коју садржи његов документ, министарство поступа по захтеву и обавештава вас да ли је поседује.",
        sources: [
          {
            title: "Устав, члан 136.",
            href: "/propisi/ustav-republike-srbije#clan-136",
          },
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 16.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-16",
          },
        ],
      },
      {
        id: "poverenik",
        name: "Повереник за информације",
        summary:
          "Повереник за информације од јавног значаја и заштиту података о личности одлучује о жалбама због ускраћеног приступа информацијама. На овој мапи то је жалба на поступање министарства.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 22.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-22",
          },
        ],
      },
      {
        id: "zastitnik",
        name: "Заштитник грађана",
        summary:
          "Заштитник грађана контролише законитост и правилност рада управе. Ако утврди повреду права, препоручује органу како да отклони пропуст.",
        sources: [
          {
            title: "Закон о Заштитнику грађана, члан 19.",
            href: "/propisi/zakon-o-zastitniku-gradjana#clan-19",
          },
          {
            title: "Закон о Заштитнику грађана, члан 37.",
            href: "/propisi/zakon-o-zastitniku-gradjana#clan-37",
          },
        ],
      },
      {
        id: "upravni",
        name: "Управни суд",
        summary:
          "Управни суд у управном спору испитује да ли је оспорени акт законит. Пример је спор покренут тужбом против решења Повереника о приступу информацијама.",
        sources: [
          {
            title: "Закон о управним споровима, члан 3.",
            href: "/propisi/zakon-o-upravnim-sporovima#clan-3",
          },
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 27.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-27",
          },
        ],
      },
    ],
    edges: [
      {
        from: "gradjanin",
        to: "ministarstvo",
        label: "тражи документ",
        detail:
          "Захтев за приступ информацији упућује се министарству које поседује документ. Тражилац може да затражи увид у документ или његову копију.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 5.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-5",
          },
        ],
      },
      {
        from: "gradjanin",
        to: "poverenik",
        label: "подноси жалбу",
        detail:
          "Ако министарство одбије захтев за информацију или не одговори у прописаном року, тражилац може да поднесе жалбу Поверенику.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 22.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-22",
          },
        ],
      },
      {
        from: "poverenik",
        to: "ministarstvo",
        label: "налаже поступање",
        detail:
          "Када усвоји жалбу против одбијања приступа, Повереник налаже министарству да омогући приступ информацији. Ако усвоји жалбу због изостанка одговора, налаже да министарство поступи по захтеву.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 24.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-24",
          },
        ],
      },
      {
        from: "gradjanin",
        to: "zastitnik",
        label: "подноси притужбу",
        detail:
          "Ко сматра да му је радом или пропустом управе повређено право може да поднесе притужбу. По правилу, пре тога користи расположива средства пред органима управе. Закон предвиђа и изузетке.",
        sources: [
          {
            title: "Закон о Заштитнику грађана, члан 28.",
            href: "/propisi/zakon-o-zastitniku-gradjana#clan-28",
          },
        ],
      },
      {
        from: "zastitnik",
        to: "ministarstvo",
        label: "упућује препоруку",
        detail:
          "Када утврди пропуст којим је повређено право, Заштитник препоручује министарству како да га отклони. Министарство мора да објасни како је поступило или зашто није спровело препоруку.",
        sources: [
          {
            title: "Закон о Заштитнику грађана, члан 37.",
            href: "/propisi/zakon-o-zastitniku-gradjana#clan-37",
          },
        ],
      },
      {
        from: "upravni",
        to: "poverenik",
        label: "испитује законитост решења",
        detail:
          "Против решења Повереника о приступу информацијама може се поднети тужба Управном суду. Суд тада испитује законитост тог решења.",
        sources: [
          {
            title:
              "Закон о слободном приступу информацијама од јавног значаја, члан 27.",
            href: "/propisi/zakon-o-slobodnom-pristupu-informacijama-od-javnog-znacaja#clan-27",
          },
          {
            title: "Закон о управним споровима, члан 3.",
            href: "/propisi/zakon-o-upravnim-sporovima#clan-3",
          },
        ],
      },
    ],
  },
];
