import basicCourtContacts from "../../content/basic-court-contacts.json";
import type { InstitutionContact } from "./institution-directory";

const administrativeContact = "https://www.up.sud.rs/kontaktirajte-nas-2/";
const misdemeanorAppealContact =
  "https://pkap.sud.rs/prekrsajni-apelacioni-sud-kontakti.html";

export const courtContacts: Readonly<
  Record<string, InstitutionContact | undefined>
> = {
  ...basicCourtContacts,
  "Врховни суд": {
    addresses: ["Немањина 9, Београд"],
    phone: { label: "Централа", number: "+381 11 360 46 06" },
    email: { label: "Судска управа", address: "uprava@vrh.sud.rs" },
    source: "https://www.vrh.sud.rs/sr/node/34",
  },
  "Апелациони суд у Београду": {
    addresses: ["Немањина 9, Београд"],
    phone: { label: "Информације о предметима", number: "+381 11 363 51 03" },
    email: {
      label: "Електронски поднесци",
      address: "elektronski.podnesak@bg.ap.sud.rs",
    },
    source: "https://bg.ap.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Виши суд у Београду": {
    addresses: [
      "Булевар краља Александра I Карађорђевића 17А, Београд (кривична и грађанска одељења)",
      "Устаничка 29, Београд (посебна одељења)",
    ],
    phone: { label: "Информације о предметима", number: "+381 11 745 11 39" },
    email: {
      label: "Електронски поднесци",
      address: "elektronski.podnesak@bg.vi.sud.rs",
    },
    source: "https://www.bg.vi.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Први основни суд у Београду": {
    addresses: [
      "Булевар Николе Тесле 42а, Нови Београд (грађанско одељење)",
      "Катанићева 15, Београд (кривично одељење)",
    ],
    phone: { label: "Информације о предметима", number: "+381 11 655 37 00" },
    email: {
      label: "Информације од јавног значаја",
      address: "uprava@prvi.os.sud.rs",
    },
    source: "https://www.prvi.os.sud.rs/tekst/274/kontakt-podaci-.php",
  },
  "Други основни суд у Београду": {
    addresses: [
      "Катанићева 15, Београд (седиште)",
      "Савска 17а, Београд (кривична писарница)",
    ],
    phone: { label: "Шалтер информација", number: "+381 11 635 45 72" },
    email: {
      label: "Електронски поднесци",
      address: "elektronski.podnesak@drugi.os.sud.rs",
    },
    source: "https://drugi.os.sud.rs/tekst/298/kontakt-podaci.php",
  },
  "Трећи основни суд у Београду": {
    addresses: [
      "Булевар Михајла Пупина 16, Нови Београд",
      "Тошин бунар 274г, Нови Београд",
    ],
    phone: {
      label: "Пријем поште у Булевару Михајла Пупина",
      number: "+381 11 201 83 30",
    },
    email: {
      label: "Електронски поднесци",
      address: "elektronski.podnesak@treci.os.sud.rs",
    },
    source: "https://www.treci.os.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Основни суд у Нишу": {
    addresses: ["Вожда Карађорђа 23, Ниш"],
    phone: { label: "Информације о предметима", number: "+381 18 504 102" },
    email: {
      label: "Електронски поднесци",
      address: "podnesak@ni.os.sud.rs",
    },
    source: "https://ni.os.sud.rs/tekst/496/kontakt-podaci.php",
  },
  "Основни суд у Новом Саду": {
    addresses: ["Сутјеска 3, Нови Сад"],
    phone: { label: "Централа", number: "+381 21 4876 100" },
    email: { label: "Писарница", address: "e-pisarnica@ns.os.sud.rs" },
    source: "https://ns.os.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Основни суд у Пожеги": {
    addresses: ["Уче Димитријевића 6, Пожега"],
    phone: { number: "+381 31 811 355" },
    email: { label: "Судска управа", address: "uprava@pz.os.sud.rs" },
    source: "https://pz.os.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Основни суд у Чачку": {
    addresses: ["Цара Душана 8/1, Чачак"],
    phone: { label: "Централа", number: "+381 32 322 242" },
    email: { label: "Судска управа", address: "uprava@ca.os.sud.rs" },
    source: "https://www.ca.os.sud.rs/kontakti.html",
  },
  "Привредни апелациони суд": {
    addresses: ["Немањина 9, Београд"],
    phone: { label: "Писарница", number: "+381 11 363 53 51" },
    email: { label: "Судска управа", address: "uprava@pa.sud.rs" },
    source: "https://pa.sud.rs/tekst/274/kontakt-podaci.php",
  },
  "Привредни суд у Београду": {
    addresses: ["Масарикова 2, Београд"],
    phone: { number: "+381 11 206 00 00" },
    source:
      "https://www.beograd.rs/cir/gradska-vlast/a87952/Drzavni-organi.html",
  },
  "Прекршајни суд у Београду": {
    addresses: ["Устаничка 14, Београд"],
    phone: { label: "Шалтер информација", number: "+381 11 655 08 04" },
    email: { label: "Писарница", address: "pisarnica@bg.pk.sud.rs" },
    source: "https://www.bg.pk.sud.rs/kontakt.html",
  },
  "Прекршајни апелациони суд": {
    addresses: ["Катанићева 15, Београд"],
    phone: { label: "Писарница", number: "+381 11 635 29 08" },
    email: { label: "Писарница", address: "pisarnica@pkap.sud.rs" },
    source: misdemeanorAppealContact,
  },
  "Управни суд": {
    addresses: ["Немањина 9, Београд"],
    phone: { label: "Информације о предметима", number: "+381 11 363 52 32" },
    email: { label: "Писарница", address: "pisarnica@up.sud.rs" },
    source: administrativeContact,
  },
};

export const courtDepartmentContacts: Readonly<
  Record<string, Record<string, InstitutionContact | undefined> | undefined>
> = {
  "Прекршајни апелациони суд": {
    "Одељење у Крагујевцу": {
      addresses: ["Слободе 4, Крагујевац"],
      phone: { label: "Писарница", number: "+381 34 619 64 66" },
      email: { label: "Писарница", address: "pisarnica.kg@pkap.sud.rs" },
      source: misdemeanorAppealContact,
    },
    "Одељење у Нишу": {
      addresses: ["Војводе Путника 1, Ниш"],
      phone: { label: "Писарница", number: "+381 18 282 247" },
      email: { label: "Писарница", address: "pisarnica.ni@pkap.sud.rs" },
      source: misdemeanorAppealContact,
    },
    "Одељење у Новом Саду": {
      addresses: ["Булевар ослобођења 58, Нови Сад"],
      phone: { label: "Писарница", number: "+381 21 4896 191" },
      email: { label: "Писарница", address: "pisarnica.ns@pkap.sud.rs" },
      source: misdemeanorAppealContact,
    },
  },
  "Управни суд": {
    "Одељење у Крагујевцу": {
      addresses: ["Палата правде, Слободе 4, Крагујевац"],
      phone: { number: "+381 34 619 66 29" },
      source: administrativeContact,
    },
    "Одељење у Нишу": {
      addresses: ["Војводе Путника 2б, Ниш"],
      phone: { number: "+381 18 415 00 92" },
      source: administrativeContact,
    },
    "Одељење у Новом Саду": {
      addresses: ["Булевар Михајла Пупина 6, Нови Сад"],
      phone: { number: "+381 21 661 68 93" },
      source: administrativeContact,
    },
  },
};
