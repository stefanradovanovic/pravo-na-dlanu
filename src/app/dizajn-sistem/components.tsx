"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Info,
  LoaderCircle,
  PanelRight,
  Search,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { searchLawTitles } from "@/lib/search";

const buttonExamples = [
  ["default", "Главна радња"],
  ["secondary", "Споредна радња"],
  ["outline", "Са оквиром"],
  ["ghost", "Без оквира"],
  ["destructive", "Уклањање"],
  ["link", "Текстуална веза"],
] as const;

const catalogSamples = [
  { title: "Устав Републике Србије", kind: "constitution" },
  { title: "Закон о раду", kind: "law" },
  { title: "Закон о заштити података о личности", kind: "law" },
];
const kinds = [
  { value: "all", label: "Сви прописи" },
  { value: "constitution", label: "Устав" },
  { value: "law", label: "Закони" },
];

function ButtonExamples() {
  const [message, setMessage] = useState(
    "Изаберите дугме да видите повратну поруку. Ово су само примери радњи.",
  );
  return (
    <div className="ds-demo-panel">
      <h3 className="ds-demo-title">Хијерархија радњи</h3>
      <div className="ds-demo-row">
        {buttonExamples.map(([variant, label]) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() =>
              setMessage(
                `Испробана варијанта: ${label.toLowerCase()}. Ништа није промењено у збирци.`,
              )
            }
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="ds-demo-status" role="status">
        {message}
      </p>
      <Separator className="ds-demo-divider" />
      <h3 className="ds-demo-title">Величине и стања</h3>
      <div className="ds-demo-row">
        <Button
          size="xs"
          variant="outline"
          onClick={() =>
            setMessage(
              "Компактно дугме: 36 px; најмање 44 px на додирном екрану.",
            )
          }
        >
          Најмање
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setMessage("Мало дугме: 36 px; најмање 44 px на додирном екрану.")
          }
        >
          Мало
        </Button>
        <Button
          variant="outline"
          onClick={() => setMessage("Основно дугме: 44 пиксела висине.")}
        >
          Основно
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setMessage("Велико дугме: 48 пиксела висине.")}
        >
          Велико
        </Button>
        <Button disabled>Недоступно</Button>
        <Button disabled variant="secondary">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Учитавање
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                variant="outline"
                aria-label="О иконским дугмадима"
                onClick={() =>
                  setMessage(
                    "Иконско дугме има приступачан назив, чак и када текст није видљив.",
                  )
                }
              />
            }
          >
            <Info aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Икона увек има приступачан назив.</TooltipContent>
        </Tooltip>
      </div>
      <p className="ds-demo-caption">
        Једна главна радња по целини. Фокус проверите тастером Tab; онемогућено
        стање не служи као замена за објашњење.
      </p>
      <Separator className="ds-demo-divider" />
      <h3 className="ds-demo-title">Ознаке описују, дугмад покрећу</h3>
      <div className="ds-demo-row">
        <Badge>Изабрано</Badge>
        <Badge variant="secondary">Метаподатак</Badge>
        <Badge variant="outline">Измишљен пример</Badge>
        <Badge variant="destructive">Грешка у уносу</Badge>
      </div>
    </div>
  );
}

function FormExamples() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | null>("all");
  const [sampleValue, setSampleValue] = useState("А");
  const invalid = sampleValue.trim().length < 2;
  const matches = searchLawTitles(catalogSamples, query).filter(
    (item) => kind === "all" || item.kind === kind,
  );

  return (
    <div className="ds-demo-panel">
      <h3 className="ds-demo-title">Претрага и избор</h3>
      <div className="ds-form-grid">
        <div className="ds-field">
          <label htmlFor="sample-search">Назив прописа</label>
          <Input
            id="sample-search"
            type="search"
            placeholder="Нпр. рад"
            value={query}
            onValueChange={setQuery}
            aria-describedby="sample-search-hint"
          />
          <p id="sample-search-hint">
            Три пробна наслова. Претрага прихвата ћирилицу, латиницу и унос без
            дијакритика.
          </p>
        </div>
        <div className="ds-field">
          <label id="sample-kind-label" htmlFor="sample-kind">
            Врста прописа
          </label>
          <Select items={kinds} value={kind} onValueChange={setKind}>
            <SelectTrigger
              id="sample-kind"
              aria-labelledby="sample-kind-label"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kinds.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="ds-demo-results">
        {matches.map((item) => (
          <Link
            key={item.title}
            href={{ pathname: "/", query: { q: item.title, view: "list" } }}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>{item.title}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
        {matches.length === 0 && (
          <p>
            Нема подударања међу пробним насловима. Покушајте са „рад“ или
            „Устав“.
          </p>
        )}
      </div>
      <div className="ds-demo-row">
        <p className="ds-demo-status" role="status">
          Број приказаних наслова: {matches.length}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            setKind("all");
          }}
        >
          Очисти филтере
        </Button>
      </div>
      <Separator className="ds-demo-divider" />
      <div className="ds-states">
        <div className="ds-field">
          <label htmlFor="sample-validation">Провера уноса</label>
          <Input
            id="sample-validation"
            value={sampleValue}
            onValueChange={setSampleValue}
            aria-invalid={invalid}
            aria-describedby="sample-validation-hint"
          />
          <p id="sample-validation-hint" aria-live="polite">
            {invalid
              ? "Унесите најмање два знака."
              : "Унос садржи најмање два знака."}
          </p>
        </div>
        <div className="ds-field">
          <label htmlFor="sample-disabled">Недоступно поље</label>
          <Input
            id="sample-disabled"
            value="Пример онемогућеног поља"
            disabled
            aria-describedby="sample-disabled-hint"
          />
          <p id="sample-disabled-hint">
            Разлог недоступности увек стоји уз поље.
          </p>
        </div>
      </div>
    </div>
  );
}

function NavigationExamples() {
  return (
    <div className="ds-demo-panel">
      <h3 className="ds-demo-title">Додатни садржај, на захтев</h3>
      <div className="ds-demo-row">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            <Info aria-hidden="true" /> Отвори дијалог
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Једна јасна порука</DialogTitle>
              <DialogDescription>
                Дијалог користимо за кратку одлуку или објашњење. Фокус остаје у
                њему, а Escape га затвара.
              </DialogDescription>
            </DialogHeader>
            <p>Ово је пример компоненте. Садржај збирке се не мења.</p>
            <DialogFooter>
              <DialogClose render={<Button />}>
                <Check aria-hidden="true" /> Разумем
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            <PanelRight aria-hidden="true" /> Отвори бочни панел
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Садржај уз читање</SheetTitle>
              <SheetDescription>
                Панел чува контекст странице док читалац прегледа додатне
                информације.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 leading-relaxed">
              <p>
                Овде се могу приказати навигација по члановима, подаци о извору
                или помоћ за тренутни задатак.
              </p>
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>
                Затвори панел
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Separator className="ds-demo-divider" />
      <Accordion defaultValue={["keyboard"]}>
        <AccordionItem value="keyboard">
          <AccordionTrigger>Како се крећемо тастатуром?</AccordionTrigger>
          <AccordionContent>
            Tab прелази на следећу контролу. У групи картица стрелице померају
            фокус и бирају картицу. Escape затвара дијалог и панел; фокус се
            враћа на дугме које их је отворило.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="content">
          <AccordionTrigger>Када склапамо садржај?</AccordionTrigger>
          <AccordionContent>
            Када је садржај допунски. Важну напомену о извору, обухвату или
            грешци не скривамо иза додатног клика.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function ComponentExamples() {
  return (
    <Tabs defaultValue="actions">
      <div className="ds-component-tabs">
        <TabsList aria-label="Групе компоненти">
          <TabsTrigger value="actions">Радње и ознаке</TabsTrigger>
          <TabsTrigger value="forms">
            <Search aria-hidden="true" /> Поља
          </TabsTrigger>
          <TabsTrigger value="navigation">Навигација</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="actions">
        <ButtonExamples />
      </TabsContent>
      <TabsContent value="forms">
        <FormExamples />
      </TabsContent>
      <TabsContent value="navigation">
        <NavigationExamples />
      </TabsContent>
    </Tabs>
  );
}
