import type { InstitutionSource } from "./institution-map";

export type MinistryDetails = {
  minister: {
    title: string;
    source: InstitutionSource;
    additionalSource?: InstitutionSource;
    accessedAt: string;
  } & (
    | { name: string; biography: string; portrait?: MinistryPortrait }
    | { name?: never; biography?: never; portrait?: never; description: string }
  );
  contact: {
    address?: string;
    phone?: { label: string; display: string; number: string };
    email?: { label: string; address: string };
    source: InstitutionSource;
    accessedAt: string;
  };
  website?: string;
  office?: "cabinet";
  service?: InstitutionSource & { description?: string };
};

type MinistryPortrait = {
  src: string;
  width: number;
  height: number;
  credit: string;
  source: string;
  license: InstitutionSource;
  changes?: string;
};

const accessedAt = "2026-11-25";
const cabinetRoster = {
  title: "Састав Владе Републике Србије",
  href: "https://www.srbija.gov.rs/templates/vlada/sastav.php?id=177",
};
const assemblyRecord = {
  title: "Запис о седници Народне скупштине од 24. новембра 2026.",
  href: "https://www.parlament.gov.rs/Прва_седница_Народне_скупштине.54098.43.html",
};
const governmentDirectory = {
  title: "Контакти у именику Владе",
  href: "https://www.srbija.gov.rs/tekst/67236/imenik-vlade-republike-srbije.php",
};

function rosterMinister({
  portrait,
  ...officeholder
}: {
  name: string;
  title: string;
  biography: string;
  portrait: Pick<MinistryPortrait, "src" | "width" | "height">;
}): MinistryDetails["minister"] {
  return {
    ...officeholder,
    source: cabinetRoster,
    accessedAt,
    portrait: {
      ...portrait,
      credit: "Влада Републике Србије",
      source: cabinetRoster.href,
      license: {
        title: "CC BY-NC-ND 3.0 RS",
        href: "https://creativecommons.org/licenses/by-nc-nd/3.0/rs/",
      },
    },
  };
}

function endedMandate(description: string): MinistryDetails["minister"] {
  return {
    title: "Мандат министра је престао",
    description,
    source: assemblyRecord,
    accessedAt,
  };
}

function ministryContact({
  address,
  phone,
  email,
  phoneLabel = "Телефон министарства",
  emailLabel = "Е-пошта министарства",
  source = governmentDirectory,
}: {
  address: string;
  phone: string;
  email: string;
  phoneLabel?: string;
  emailLabel?: string;
  source?: InstitutionSource;
}): MinistryDetails["contact"] {
  return {
    address,
    phone: {
      label: phoneLabel,
      display: phone,
      number: phone.replace(/[^+\d]/g, ""),
    },
    email: { label: emailLabel, address: email },
    source,
    accessedAt,
  };
}

export const caretakerGovernment = {
  text: "Влада је 19. новембра 2026. саопштила да ради у техничком мандату.",
  source: {
    title: "Саопштење Владе",
    href: "https://www.srbija.gov.rs/vest/1011594/vlada-usvojila-vise-odluka-zakljucaka-i-resenja.php",
  },
  accessedAt: "2026-11-25",
};

export const ministryDetails = {
  "unutrasnji-poslovi": {
    minister: {
      name: "Ивица Дачић",
      title: "Потпредседник Владе и министар унутрашњих послова",
      biography: "https://www.srbija.gov.rs/biografija/149114/ivica-dacic.php",
      source: {
        title: "Саопштење Владе од 24. новембра 2026.",
        href: "https://www.srbija.gov.rs/vest/1012014/dacic-izrazio-saucesce-povodom-smrti-mitropolita-backog-irineja.php",
      },
      accessedAt: "2026-11-25",
      portrait: {
        src: "/institucije/portreti/ivica-dacic.webp",
        width: 480,
        height: 649,
        credit: "Драган Жебељан, 2010.",
        source:
          "https://commons.wikimedia.org/wiki/File:Ivica_Dacic_(cropped).jpg",
        changes: "Исечак, умањено",
        license: {
          title: "CC BY-SA 3.0 RS",
          href: "https://creativecommons.org/licenses/by-sa/3.0/rs/",
        },
      },
    },
    contact: {
      address: "Булевар Михајла Пупина 2, Београд",
      phone: {
        label: "Телефон министарства",
        display: "+381 11 274-00-00",
        number: "+381112740000",
      },
      email: { label: "Е-пошта министарства", address: "infomup@mup.gov.rs" },
      source: {
        title: "Контакти у именику Владе",
        href: "https://www.srbija.gov.rs/tekst/67236/imenik-vlade-republike-srbije.php",
      },
      accessedAt: "2026-11-25",
    },
    website: "https://www.mup.gov.rs/",
    service: {
      title: "Закажите термин за личну карту или пасош",
      href: "https://euprava.gov.rs/usluge/00005?isNew=True",
      description:
        "Термин у полицијској управи или станици бирате на порталу еУправа.",
    },
  },
  prosveta: {
    minister: {
      name: "Дејан Вук Станковић",
      title: "Министар просвете",
      biography:
        "https://www.srbija.gov.rs/biografija/67117/dejan-vuk-stankovic.php",
      source: {
        title: "Саопштење Владе од 24. новембра 2026.",
        href: "https://www.srbija.gov.rs/vest/1012065/formiran-krizni-tim-nakon-pucnjave-u-skoli-u-kragujevcu.php",
      },
      accessedAt: "2026-11-25",
      portrait: {
        src: "/institucije/portreti/dejan-vuk-stankovic.webp",
        width: 480,
        height: 639,
        credit: "Културни центар Новог Сада (KCNS), 2018.",
        source:
          "https://commons.wikimedia.org/wiki/File:Dejan_Vuk_Stankovi%C4%87.png",
        changes: "Исечак, умањено",
        license: {
          title: "CC BY 3.0",
          href: "https://creativecommons.org/licenses/by/3.0/",
        },
      },
    },
    contact: {
      address: "Немањина 22–26, 11000 Београд",
      phone: {
        label: "Телефонска централа",
        display: "011 3613-734",
        number: "+381113613734",
      },
      email: {
        label: "Е-пошта кабинета министра",
        address: "kabinet@prosveta.gov.rs",
      },
      source: {
        title: "Сви контакти Министарства просвете",
        href: "https://prosveta.gov.rs/kontakt/",
      },
      accessedAt: "2026-11-25",
    },
    website: "https://prosveta.gov.rs/",
    service: {
      title: "Поднесите захтев преко еПисарнице",
      href: "https://euprava.gov.rs/usluga-episarnica",
    },
  },
  finansije: {
    minister: rosterMinister({
      name: "Синиша Мали",
      title: "Први потпредседник Владе и министар финансија",
      biography: "https://www.srbija.gov.rs/biografija/67114/sinisa-mali.php",
      portrait: {
        src: "/institucije/portreti/sinisa-mali.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Кнеза Милоша 20, 11000 Београд",
      phone: "+381 11 765-2028",
      email: "kontakt@mfin.gov.rs",
      phoneLabel: "Телефон секретаријата",
      source: {
        title: "Контакти министарства",
        href: "https://mfin.gov.rs/contact",
      },
    }),
    website: "https://mfin.gov.rs/",
    service: {
      title: "Затражите информације од јавног значаја",
      href: "https://www.mfin.gov.rs/usluge/pruzanje-informacija-od-javnog-znacaja",
    },
  },
  privreda: {
    minister: endedMandate(
      "Мандат Адријане Месаровић престао је 17. новембра 2026. потврђивањем њеног посланичког мандата.",
    ),
    contact: ministryContact({
      address: "Кнеза Милоша 20, Београд",
      phone: "+381 11 364-2600",
      email: "kabinet@privreda.gov.rs",
      phoneLabel: "Телефонска централа",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://privreda.gov.rs/index.php/kontakt",
      },
    }),
    website: "https://privreda.gov.rs/",
    service: {
      title: "Мишљења о примени прописа",
      href: "https://privreda.gov.rs/index.php/usluge/misljenja",
    },
  },
  poljoprivreda: {
    minister: rosterMinister({
      name: "Драган Гламочић",
      title: "Министар пољопривреде, шумарства и водопривреде",
      biography:
        "https://www.srbija.gov.rs/biografija/90303/dragan-glamocic.php",
      portrait: {
        src: "/institucije/portreti/dragan-glamocic.jpg",
        width: 800,
        height: 1190,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, 11000 Београд",
      phone: "+381 11 306-50-38",
      email: "kabinet.info@minpolj.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://minpolj.gov.rs/kontakti/",
      },
    }),
    website: "https://minpolj.gov.rs/",
    service: {
      title: "еАграр и пољопривредни подстицаји",
      href: "https://eagrar.gov.rs/",
    },
  },
  "zivotna-sredina": {
    minister: rosterMinister({
      name: "Сара Павков",
      title: "Министарка заштите животне средине",
      biography: "https://www.srbija.gov.rs/biografija/67113/sara-pavkov.php",
      portrait: {
        src: "/institucije/portreti/sara-pavkov.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2, 11070 Београд",
      phone: "+381 11 3110-271",
      email: "eko.kabinet@eko.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://www.ekologija.gov.rs/kontakt/",
      },
    }),
    website: "https://www.ekologija.gov.rs/",
    service: {
      title: "Дозволе и обрасци",
      href: "https://www.ekologija.gov.rs/servisni-hub/dozvole-i-obrasci/",
    },
  },
  "saobracaj-i-infrastruktura": {
    minister: rosterMinister({
      name: "Александра Софронијевић",
      title: "Министарка грађевинарства, саобраћаја и инфраструктуре",
      biography:
        "https://www.srbija.gov.rs/biografija/90305/aleksandra-sofronijevic.php",
      portrait: {
        src: "/institucije/portreti/aleksandra-sofronijevic.jpg",
        width: 800,
        height: 1201,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, Београд",
      phone: "+381 11 3616-609",
      email: "pitanja.gradjana@mgsi.gov.rs",
      phoneLabel: "Телефон за питања грађана",
      emailLabel: "Е-пошта за питања грађана",
      source: {
        title: "Контакти министарства",
        href: "https://mgsi.gov.rs/cir/contacts",
      },
    }),
    website: "https://mgsi.gov.rs/",
  },
  "rudarstvo-i-energetika": {
    minister: rosterMinister({
      name: "Дубравка Ђедовић Хандановић",
      title: "Министарка рударства и енергетике",
      biography:
        "https://www.srbija.gov.rs/biografija/296023/dubravka-djedovic-handanovic.php",
      portrait: {
        src: "/institucije/portreti/dubravka-djedovic-handanovic.jpg",
        width: 800,
        height: 1201,
      },
    }),
    contact: ministryContact({
      address: "Краља Милана 36, Београд",
      phone: "+381 11 3346-755",
      email: "kabinet@mre.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://www.mre.gov.rs/tekst/68/kabinet-.php",
      },
    }),
    website: "https://www.mre.gov.rs/",
    service: {
      title: "Енергетска ефикасност за грађане",
      href: "https://www.mre.gov.rs/tekst/2149/projekat-cista-energija-i-energetska-efikasnost-za-gradjane-surce.php",
    },
  },
  trgovina: {
    minister: rosterMinister({
      name: "Јагода Лазаревић",
      title: "Министарка унутрашње и спољне трговине",
      biography:
        "https://www.srbija.gov.rs/biografija/195190/jagoda-lazarevic.php",
      portrait: {
        src: "/institucije/portreti/jagoda-lazarevic.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Немањина 11, 11000 Београд",
      phone: "+381 11 3633-721",
      email: "kabinet@must.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://must.gov.rs/tekst/422/kontakti-ministarstva.php",
      },
    }),
    website: "https://must.gov.rs/",
    service: {
      title: "Заштита потрошача и приговори",
      href: "https://must.gov.rs/tekst/376/zastsita-potrosaca.php",
    },
  },
  pravda: {
    minister: rosterMinister({
      name: "Ненад Вујић",
      title: "Министар правде",
      biography: "https://www.srbija.gov.rs/biografija/873169/nenad-vujic.php",
      portrait: {
        src: "/institucije/portreti/nenad-vujic.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, Београд",
      phone: "+381 11 785-8000",
      email: "kontakt@mpravde.gov.rs",
      source: {
        title: "Контакти министарства",
        href: "https://mpravde.gov.rs/kontakt",
      },
    }),
    website: "https://mpravde.gov.rs/",
    service: {
      title: "Правосудни испит",
      href: "https://mpravde.gov.rs/pravosudni-ispit",
    },
  },
  "drzavna-uprava": {
    minister: rosterMinister({
      name: "Снежана Пауновић",
      title: "Министарка државне управе и локалне самоуправе",
      biography:
        "https://www.srbija.gov.rs/biografija/270937/snezana-paunovic.php",
      portrait: {
        src: "/institucije/portreti/snezana-paunovic.jpg",
        width: 800,
        height: 1166,
      },
    }),
    contact: ministryContact({
      address: "Бирчанинова 6, 11000 Београд",
      phone: "+381 11 3613-654",
      email: "kabinet@mduls.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://mduls.gov.rs/kontakti/?script=cir",
      },
    }),
    website: "https://mduls.gov.rs/",
  },
  "ljudska-i-manjinska-prava": {
    minister: rosterMinister({
      name: "Демо Бериша",
      title: "Министар за људска и мањинска права и друштвени дијалог",
      biography: "https://www.srbija.gov.rs/biografija/149116/demo-berisa.php",
      portrait: {
        src: "/institucije/portreti/demo-berisa.jpg",
        width: 800,
        height: 1199,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2, 11070 Нови Београд",
      phone: "+381 11 311-4528",
      email: "kabinet@minljmpdd.gov.rs",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://minljmpdd.gov.rs/kontakt/",
      },
    }),
    website: "https://minljmpdd.gov.rs/",
    service: {
      title: "Календар конкурса за цивилно друштво",
      href: "https://minljmpdd.gov.rs/sektori/civilno-drustvo/kalendar-konkursa/",
    },
  },
  odbrana: {
    minister: rosterMinister({
      name: "Братислав Гашић",
      title: "Министар одбране",
      biography:
        "https://www.srbija.gov.rs/biografija/296027/bratislav-gasic.php",
      portrait: {
        src: "/institucije/portreti/bratislav-gasic.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Бирчанинова 5, Београд",
      phone: "+381 11 3203-015",
      email: "brziodgovor@mod.gov.rs",
      phoneLabel: "Телефон за односе са јавношћу",
      emailLabel: "Е-пошта за питања грађана",
      source: {
        title: "Контакти министарства",
        href: "https://www.mod.gov.rs/cir/4354/kontakt-podaci-organizacijskih-celina-u-ministarstvu-odbrane4354",
      },
    }),
    website: "https://www.mod.gov.rs/",
    service: {
      title: "Одговори на питања грађана",
      href: "https://www.mod.gov.rs/cir/13280/odgovori-na-najcesce-postavljena-pitanja-13280",
    },
  },
  "spoljni-poslovi": {
    minister: rosterMinister({
      name: "Марко Ђурић",
      title: "Министар спољних послова",
      biography: "https://www.srbija.gov.rs/biografija/493636/marko-djuric.php",
      portrait: {
        src: "/institucije/portreti/marko-djuric.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Кнеза Милоша 24–26, 11000 Београд",
      phone: "+381 11 3068-268",
      email: "okp@mfa.rs",
      phoneLabel: "Телефон за конзуларна питања",
      emailLabel: "Е-пошта за конзуларна питања",
      source: {
        title: "Контакти министарства",
        href: "https://mfa.gov.rs/ministarstvo/kontakt",
      },
    }),
    website: "https://mfa.gov.rs/",
    service: {
      title: "Путне исправе у иностранству",
      href: "https://www.mfa.gov.rs/gradjani/usluge/putne-isprave",
    },
  },
  "evropske-integracije": {
    minister: rosterMinister({
      name: "Немања Старовић",
      title: "Министар за европске интеграције",
      biography:
        "https://www.srbija.gov.rs/biografija/149118/nemanja-starovic.php",
      portrait: {
        src: "/institucije/portreti/nemanja-starovic.jpg",
        width: 800,
        height: 1199,
      },
    }),
    contact: ministryContact({
      address: "Немањина 34, 11000 Београд",
      phone: "+381 11 3061-100",
      email: "office@mei.gov.rs",
      source: {
        title: "Контакти министарства",
        href: "https://mei.gov.rs/srp/kontakt",
      },
    }),
    website: "https://mei.gov.rs/",
    service: {
      title: "Услуге министарства",
      href: "https://mei.gov.rs/srp/ministarstvo/usluge",
    },
  },
  zdravlje: {
    minister: rosterMinister({
      name: "Златибор Лончар",
      title: "Министар здравља",
      biography:
        "https://www.srbija.gov.rs/biografija/67124/zlatibor-loncar.php",
      portrait: {
        src: "/institucije/portreti/zlatibor-loncar.jpg",
        width: 800,
        height: 1204,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, Београд",
      phone: "+381 11 3616-251",
      email: "kabinet@zdravlje.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://zdravlje.gov.rs/tekst/333296/",
      },
    }),
    website: "https://www.zdravlje.gov.rs/",
    service: {
      title: "Честа питања грађана",
      href: "https://www.zdravlje.gov.rs/tekst/333476/cesta-pitanja.php",
    },
  },
  "rad-i-socijalna-pitanja": {
    minister: rosterMinister({
      name: "Милица Ђурђевић Стаменковски",
      title: "Министарка за рад, запошљавање, борачка и социјална питања",
      biography:
        "https://www.srbija.gov.rs/biografija/67125/milica-djurdjevic-stamenkovski-.php",
      portrait: {
        src: "/institucije/portreti/milica-djurdjevic-stamenkovski.jpg",
        width: 800,
        height: 1200,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, Београд",
      phone: "+381 11 3616-128",
      email: "rad.zaposljavanje@minrzs.gov.rs",
      phoneLabel: "Телефон за рад и запошљавање",
      emailLabel: "Е-пошта за рад и запошљавање",
      source: {
        title: "Контакти министарства",
        href: "https://www.minrzs.gov.rs/sr/kontakt",
      },
    }),
    website: "https://www.minrzs.gov.rs/",
    service: {
      title: "Пријавите неправилности и незаконитости",
      href: "https://www.minrzs.gov.rs/sr/prijave-nepravilnosti-i-nezakonitosti",
    },
  },
  "porodica-i-demografija": {
    minister: rosterMinister({
      name: "Јелена Жарић Ковачевић",
      title: "Министарка за бригу о породици и демографију",
      biography:
        "https://www.srbija.gov.rs/biografija/493666/jelena-zaric-kovacevic.php",
      portrait: {
        src: "/institucije/portreti/jelena-zaric-kovacevic.jpg",
        width: 800,
        height: 1210,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2 (Палата Србија), Београд",
      phone: "+381 11 2140-318",
      email: "kabinet@minbpd.gov.rs",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://www.minbpd.gov.rs/kontakt/",
      },
    }),
    website: "https://www.minbpd.gov.rs/",
    service: {
      title: "Информације о Алиментационом фонду",
      href: "https://www.minbpd.gov.rs/sve-informacije-o-alimentacionom-fon/",
    },
  },
  sport: {
    minister: rosterMinister({
      name: "Зоран Гајић",
      title: "Министар спорта",
      biography: "https://www.srbija.gov.rs/biografija/208/zoran-gajic.php",
      portrait: {
        src: "/institucije/portreti/zoran-gajic.jpg",
        width: 800,
        height: 1195,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2, Београд",
      phone: "+381 11 313-09-12",
      email: "kabinet@mos.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://mos.gov.rs/storage/2026/11/infomator-o-radu-ms-oktobar-lat.pdf",
      },
    }),
    website: "https://www.mos.gov.rs/",
    service: {
      title: "Конкурси Министарства спорта",
      href: "https://mos.gov.rs/konkursi",
    },
  },
  kultura: {
    minister: endedMandate(
      "Мандат Николе Селаковића престао је 17. новембра 2026. потврђивањем његовог посланичког мандата.",
    ),
    contact: ministryContact({
      address: "Влајковићева 3, Београд",
      phone: "+381 11 3398-172",
      email: "kabinet@kultura.gov.rs",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Именик Министарства културе",
        href: "https://kultura.gov.rs/kontakt-lista/213",
      },
    }),
    website: "https://www.kultura.gov.rs/",
  },
  "briga-o-selu": {
    minister: rosterMinister({
      name: "Милан Кркобабић",
      title: "Министар за бригу о селу",
      biography:
        "https://www.srbija.gov.rs/biografija/270934/milan-krkobabic.php",
      portrait: {
        src: "/institucije/portreti/milan-krkobabic.jpg",
        width: 800,
        height: 1199,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2а, Београд",
      phone: "+381 11 311-2282",
      email: "kabinet@mbs.gov.rs",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://mbs.gov.rs/kontakt-2/",
      },
    }),
    website: "https://mbs.gov.rs/",
  },
  "nauka-i-inovacije": {
    minister: rosterMinister({
      name: "Бела Балинт",
      title: "Министар науке, технолошког развоја и иновација",
      biography: "https://www.srbija.gov.rs/biografija/296028/bela-balint.php",
      portrait: {
        src: "/institucije/portreti/bela-balint.jpg",
        width: 800,
        height: 1184,
      },
    }),
    contact: ministryContact({
      address: "Немањина 22–26, 11000 Београд",
      phone: "+381 11 3633-701",
      email: "kabinet@nitra.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://www.nitra.gov.rs/cir/kontakt",
      },
    }),
    website: "https://www.nitra.gov.rs/",
    service: {
      title: "Јавни позиви и конкурси",
      href: "https://nitra.gov.rs/cir/ministarstvo/javni-pozivi-i-konkursi/javni-pozivi-i-konkursi",
    },
  },
  "turizam-i-omladina": {
    minister: rosterMinister({
      name: "Хусеин Мемић",
      title: "Министар туризма и омладине",
      biography: "https://www.srbija.gov.rs/biografija/658885/husein-memic.php",
      portrait: {
        src: "/institucije/portreti/husein-memic.jpg",
        width: 800,
        height: 1157,
      },
    }),
    contact: ministryContact({
      address: "Булевар Михајла Пупина 2, 11070 Нови Београд",
      phone: "+381 11 311-2916",
      email: "kabinet@mto.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://mto.gov.rs/tekst/37/kontakti-ministarstva.php",
      },
    }),
    website: "https://mto.gov.rs/",
  },
  "informisanje-i-telekomunikacije": {
    minister: rosterMinister({
      name: "Борис Братина",
      title: "Министар информисања и телекомуникација",
      biography:
        "https://www.srbija.gov.rs/biografija/658888/boris-bratina.php",
      portrait: {
        src: "/institucije/portreti/boris-bratina.jpg",
        width: 800,
        height: 1205,
      },
    }),
    contact: ministryContact({
      address: "Париска 7, 11000 Београд",
      phone: "+381 11 2020-057",
      email: "kabinet@mit.gov.rs",
      phoneLabel: "Телефон кабинета",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://mit.gov.rs/tekst/117/",
      },
    }),
    website: "https://mit.gov.rs/",
    service: {
      title: "Контакт формулар",
      href: "https://mit.gov.rs/tekst/514/kontakt.php",
    },
  },
  "javna-ulaganja": {
    minister: rosterMinister({
      name: "Дарко Глишић",
      title: "Министар за јавна улагања",
      biography: "https://www.srbija.gov.rs/biografija/658891/darko-glisic.php",
      portrait: {
        src: "/institucije/portreti/darko-glisic.jpg",
        width: 800,
        height: 1204,
      },
    }),
    contact: ministryContact({
      address: "Немањина 11, Београд",
      phone: "+381 11 3617-737",
      email: "kabinet@obnova.gov.rs",
      emailLabel: "Е-пошта кабинета",
      source: {
        title: "Контакти министарства",
        href: "https://www.obnova.gov.rs/kontakt",
      },
    }),
    website: "https://www.obnova.gov.rs/",
  },
} satisfies Readonly<Record<string, MinistryDetails>>;

export const ministersWithoutPortfolio = [
  {
    id: "novica-toncev",
    name: "Развој недовољно развијених општина",
    summary:
      "Кабинет подржава развој недовољно развијених општина. Помаже локалним самоуправама у припреми пројеката и тражењу извора финансирања.",
    details: {
      office: "cabinet",
      minister: rosterMinister({
        name: "Новица Тончев",
        title: "Министар без портфеља",
        biography:
          "https://www.srbija.gov.rs/biografija/149115/novica-toncev.php",
        portrait: {
          src: "/institucije/portreti/novica-toncev.jpg",
          width: 800,
          height: 1187,
        },
      }),
      contact: ministryContact({
        address: "Немањина 11, Београд",
        phone: "+381 11 3610-688",
        email: "kabinet@rnro.gov.rs",
        phoneLabel: "Телефон кабинета",
        emailLabel: "Е-пошта кабинета",
        source: {
          title: "Контакти кабинета",
          href: "https://rnro.gov.rs/kontakt/",
        },
      }),
      website: "https://rnro.gov.rs/",
    },
  },
  {
    id: "djordje-milicevic",
    name: "Односи са дијаспором",
    summary:
      "Кабинет прати стање, предлаже мере и учествује у усклађивању активности Србије у односима са дијаспором.",
    details: {
      office: "cabinet",
      minister: rosterMinister({
        name: "Ђорђе Милићевић",
        title: "Министар без портфеља",
        biography:
          "https://www.srbija.gov.rs/biografija/658894/djordje-milicevic.php",
        portrait: {
          src: "/institucije/portreti/djordje-milicevic.jpg",
          width: 800,
          height: 1200,
        },
      }),
      contact: ministryContact({
        address: "Немањина 22–26, 11. спрат, Београд",
        phone: "+381 11 361-9833",
        email: "kabinet@mbpdijaspora.gov.rs",
        phoneLabel: "Телефон кабинета",
        emailLabel: "Е-пошта кабинета",
      }),
      website: "https://www.mbpdijaspora.gov.rs/",
    },
  },
  {
    id: "usame-zukorlic",
    name: "Помирење, регионална сарадња и друштвена стабилност",
    summary:
      "Према саставу Владе, ова област обухвата помирење, регионалну сарадњу и друштвену стабилност. Извештај Народне скупштине о гласању од 25. новембра 2026. наводи Усаму Зукорлића као народног посланика.",
    details: {
      office: "cabinet",
      minister: {
        ...rosterMinister({
          name: "Усаме Зукорлић",
          title: "У саставу Владе наведен као министар без портфеља",
          biography:
            "https://www.srbija.gov.rs/biografija/493639/usame-zukorlic.php",
          portrait: {
            src: "/institucije/portreti/usame-zukorlic.jpg",
            width: 800,
            height: 1176,
          },
        }),
        additionalSource: {
          title: "Извештај Народне скупштине о гласању од 25. новембра 2026.",
          href: "https://www.parlament.gov.rs/upload/rezultati_glasanja/2026/6.2.pdf",
        },
      },
      contact: ministryContact({
        address: "Булевар Михајла Пупина 2, Београд",
        phone: "+381 11 361-98-34",
        email: "kabinet@pomirenje.gov.rs",
        phoneLabel: "Телефон кабинета",
        emailLabel: "Е-пошта кабинета",
      }),
      website: "https://www.pomirenje.gov.rs/",
    },
  },
  {
    id: "nenad-popovic",
    name: "Међународна економска сарадња и положај цркве",
    summary:
      "Посебно задужење обухвата међународну економску сарадњу и друштвени положај цркве у земљи и иностранству.",
    details: {
      office: "cabinet",
      minister: rosterMinister({
        name: "Ненад Поповић",
        title: "Министар без портфеља",
        biography:
          "https://www.srbija.gov.rs/biografija/779965/nenad-popovic.php",
        portrait: {
          src: "/institucije/portreti/nenad-popovic.jpg",
          width: 800,
          height: 1200,
        },
      }),
      contact: {
        source: {
          ...governmentDirectory,
          title: "Именик Владе Републике Србије",
        },
        accessedAt,
      },
    },
  },
  {
    id: "tatjana-macura",
    name: "Родна равноправност и оснаживање жена",
    summary:
      "Кабинет координира активности у области родне равноправности, спречавања насиља над женама и економског и политичког оснаживања жена.",
    details: {
      office: "cabinet",
      minister: rosterMinister({
        name: "Татјана Мацура",
        title: "Министарка без портфеља",
        biography:
          "https://www.srbija.gov.rs/biografija/779968/tatjana-macura.php",
        portrait: {
          src: "/institucije/portreti/tatjana-macura.jpg",
          width: 800,
          height: 1161,
        },
      }),
      contact: ministryContact({
        address: "Булевар Михајла Пупина 2, Нови Београд",
        phone: "+381 11 3619-824",
        email: "kabinet@jednakost.gov.rs",
        phoneLabel: "Телефон кабинета",
        emailLabel: "Е-пошта кабинета",
        source: {
          title: "Контакти кабинета",
          href: "https://jednakost.gov.rs/kontakt-2/",
        },
      }),
      website: "https://jednakost.gov.rs/",
    },
  },
] satisfies readonly {
  id: string;
  name: string;
  summary: string;
  details: MinistryDetails;
}[];
