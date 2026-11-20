import type { InstitutionMap, InstitutionSource } from "./institution-map";

function constitution(article: number): InstitutionSource {
  return {
    title: `Устав, члан ${article}.`,
    href: `/propisi/ustav-republike-srbije#clan-${article}`,
  };
}

function governmentLaw(article: number): InstitutionSource {
  return {
    title: `Закон о Влади, члан ${article}.`,
    href: `/propisi/zakon-o-vladi#clan-${article}`,
  };
}

function administrationLaw(article: number): InstitutionSource {
  return {
    title: `Закон о државној управи, члан ${article}.`,
    href: `/propisi/zakon-o-drzavnoj-upravi#clan-${article}`,
  };
}

export const governmentMap: InstitutionMap = {
  id: "vlada",
  title: "Влада",
  question: "О чему Влада сама одлучује, а шта предлаже Народној скупштини?",
  nodes: [
    {
      id: "vlada",
      name: "Влада",
      summary:
        "Владу чине председник, један или више потпредседника и министри. Заједно воде државну политику и спроводе законе. На седници одлучују које ће законе предложити Скупштини и које ће уредбе донети ради извршавања закона.",
      sources: [constitution(123), constitution(125), governmentLaw(26)],
    },
    {
      id: "predsednik-vlade",
      name: "Председник Владе",
      summary:
        "Председник Владе представља Владу и усклађује рад њених чланова. Министрима може да да обавезна упутства и посебна задужења у складу са програмом и политиком Владе.",
      sources: [governmentLaw(12)],
    },
    {
      id: "ministar",
      name: "Министар",
      summary:
        "Министар учествује у одлучивању Владе и може јој предложити да уреди одређено питање. Ресорни министар води министарство, а члан Владе може бити и министар без портфеља.",
      sources: [governmentLaw(10), governmentLaw(14), administrationLaw(23)],
    },
    {
      id: "ministarstvo",
      name: "Министарство",
      summary:
        "Министарство прати стање у својој области и припрема прописе. Када почиње да пише нацрт закона, објављује основне информације о предложеним решењима на својој интернет страници и порталу е-управе.",
      sources: [administrationLaw(13), administrationLaw(77)],
    },
    {
      id: "skupstina",
      name: "Народна скупштина",
      summary:
        "Посланици гласају о програму и избору Владе. Током њеног мандата могу да постављају посланичка питања, а Скупштина може да затражи извештај о раду Владе или појединог министра.",
      sources: [
        constitution(127),
        governmentLaw(36),
        {
          title: "Закон о Народној скупштини, члан 56.",
          href: "/propisi/zakon-o-narodnoj-skupstini#clan-56",
        },
      ],
      relatedMap: {
        id: "narodna-skupstina",
        label: "Како ради Народна скупштина?",
      },
    },
  ],
  edges: [
    {
      from: "predsednik-vlade",
      to: "vlada",
      label: "сазива и води седницу",
      detail:
        "Председник води седницу, а о предлогу гласају чланови Владе. По правилу је потребна већина свих чланова. Када је број чланова паран, довољна је и половина гласова свих чланова ако је председник гласао за предлог.",
      sources: [governmentLaw(12), governmentLaw(26)],
    },
    {
      from: "ministar",
      to: "ministarstvo",
      label: "руководи министарством",
      detail:
        "Министар на челу министарства представља тај орган и одлучује о пословима из његовог делокруга. За свој рад и стање у тој области одговара председнику Владе, Влади и Народној скупштини.",
      sources: [administrationLaw(23), constitution(125)],
    },
    {
      from: "ministarstvo",
      to: "vlada",
      label: "припрема нацрт закона",
      detail:
        "Надлежно министарство припрема текст за Владу. Током израде нацрта закона спроводи консултације са заинтересованима, међу којима су стручњаци и удружења.",
      sources: [administrationLaw(12), administrationLaw(77)],
    },
    {
      from: "vlada",
      to: "skupstina",
      label: "предлаже законе",
      detail:
        "Када Влада утврди предлог закона, упућује га Скупштини. Представници Владе учествују у скупштинској расправи о њеном предлогу, а посланици одлучују о усвајању.",
      sources: [governmentLaw(34), governmentLaw(38), constitution(99)],
    },
    {
      from: "skupstina",
      to: "vlada",
      label: "бира Владу",
      detail:
        "Кандидат за председника Владе представља програм и предлаже састав Владе. Скупштина о програму и саставу гласа истовремено. За избор је потребна већина свих народних посланика.",
      sources: [constitution(127)],
    },
  ],
  procedure: {
    title: "Како од нацрта настаје пропис?",
    steps: [
      {
        title: "Припрема текста",
        text: "Када је за промену потребан закон, министарство за Владу припрема нацрт закона. Ако треба ближе уредити примену постојећег закона, може да припреми предлог уредбе.",
        sources: [administrationLaw(12), governmentLaw(42)],
      },
      {
        title: "Одлука на седници Владе",
        text: "Ако Влада прихвати нацрт закона, утврђује предлог закона за Скупштину. Када разматра предлог уредбе, на седници може сама да донесе уредбу у границама закона.",
        sources: [governmentLaw(26), governmentLaw(34), governmentLaw(42)],
      },
      {
        title: "Закон или уредба",
        text: "Да би предлог закона био усвојен, о њему гласа Народна скупштина. Уредба коју је донела Влада објављује се у Службеном гласнику Републике Србије.",
        sources: [constitution(99), governmentLaw(46)],
      },
    ],
  },
};
