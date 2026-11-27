"use client";

import { Maximize, Minimize, Minus, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberRating } from "./member-rating";
import "./member-map.css";

export type Member = {
  id: string;
  name: string;
  group: string;
  photoUrl?: string;
  occupation?: string;
  residence?: string;
};
export type Groups = Record<string, { name: string }>;

// Half of the Great Hall, mirrored across its central aisle. Measurements
// follow page 46 of the Assembly's floor plan, rotated toward the dais.
const radii = [170, 205, 242, 279, 315, 352, 388];
const sideBenches = [
  [10, -82, 6],
  [15, -98, 7],
  [20, -98, 7],
  [25, -98, 7],
  [32, -98, 8],
  [38, -98, 8],
  [-42, -98, 4],
];

// Tighten row spacing around the middle bench without changing its seat count.
const rowSpacing = 0.8;
const chamber = { left: -442, top: -149, width: 884, height: 558 };
const minZoom = 1;
const maxZoom = 3;
const zoomStep = 0.5;
const mapTitle = "Распоред у Великој сали";
const seatingNote = "Распоред седења је приближан, без гаранције тачности.";
type SeatPosition = { x: number; y: number; rotation: number };

function benchRow(block: number, row: number) {
  const planRadius = radii[row];
  const radius = radii[3] + (planRadius - radii[3]) * rowSpacing;
  if (block === 1) {
    const [start, end, count] = sideBenches[row];
    return Array.from({ length: count }, (_, index) => ({
      x: radius,
      rotation: -90,
      y: start + ((end - start) * index) / (count - 1),
    }));
  }

  const radians = Math.PI / 180;
  const start =
    block === 4 ? Math.asin(14 / radius) : (block === 3 ? 28 : 56) * radians;
  const end = (block === 4 ? 24 : block === 3 ? 52 : 79) * radians;
  const planStart = block === 4 ? Math.asin(14 / planRadius) : start;
  // The innermost bench in sectors 2 and 7 has three desks.
  const count =
    block === 2 && row === 0
      ? 3
      : Math.round(((end - planStart) * planRadius) / 19);
  return Array.from({ length: count }, (_, index) => {
    const angle = start + ((end - start) * (index + 0.5)) / count;
    return {
      x: radius * Math.sin(angle),
      y: radius * Math.cos(angle),
      rotation: -angle / radians,
    };
  });
}

function SeatRow({ seats }: { seats: SeatPosition[] }) {
  return (
    <g>
      {seats.map(({ x, y, rotation }, i) => (
        <rect
          key={i}
          x="-7.5"
          y="-5.4"
          width="15"
          height="10.8"
          rx="2"
          transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotation.toFixed(3)})`}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity=".3"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

const sectors = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  const block = number <= 4 ? number : 9 - number;
  return {
    number,
    area: number <= 4 ? "174" : number === 5 ? "minority" : "175",
    rows: radii.map((_, row) =>
      benchRow(block, row).map((position) =>
        number > 4
          ? { ...position, x: -position.x, rotation: -position.rotation }
          : position,
      ),
    ),
  };
});

const openingSessionPhoto =
  "https://www.parlament.gov.rs/upload/images/archive/photo/ostalo/14_saziv/17.11.2026.sednica2.JPG";
const oathPhotoSource = {
  url: "https://www.parlament.gov.rs/upload/images/archive/photo/ostalo/14_saziv/17.11.2026.sednica7.JPG",
  label: "Место на фотографији",
};
const oppositionPhotoSource = {
  url: "https://www.parlament.gov.rs/upload/images/archive/photo/ostalo/14_saziv/17.11.2026.sednica3.JPG",
  label: "Место на фотографији",
};
const oppositionGallerySource = {
  url: "https://www.blic.rs/vesti/politika/raspored-poslanika-u-skupstini-srbije-ko-sedi-u-prvim-redovima/hkv8xsz",
  label: "Фотографије распореда",
};
const november24FrontBenchesSource = {
  url: "https://www.youtube.com/watch?v=zm-BK3kiWUo&t=3407s",
  label: "Место на снимку",
};
const november24VucicBenchesSource = {
  url: "https://www.youtube.com/watch?v=zm-BK3kiWUo&t=3032s",
  label: "Место на снимку",
};
const november24SideBenchesSource = {
  url: "https://www.youtube.com/watch?v=zm-BK3kiWUo&t=3759s",
  label: "Место на снимку",
};
const mirkovicSpeechSource = {
  url: "https://www.youtube.com/watch?v=QxOLhJHQs-U&t=13955s",
  label: "Место на снимку",
};
const panticPiljaSpeechSource = {
  url: "https://www.youtube.com/watch?v=QxOLhJHQs-U&t=24750s",
  label: "Место на снимку",
};
const nedeljkovicSpeechSource = {
  url: "https://skupstina.live/sednica/s15-01-d4/govor/73",
  label: "Место на снимку",
};
const unoccupiedOppositionSeats = new Set([sectors[6].rows[0][1]]);

// Observations from the November 2026 opening session, located against the Great Hall plan.
// Rows start at the floor center. Seats follow the order generated by benchRow.
const observedSeats: [
  memberId: string,
  sector: number,
  row: number,
  seat: number,
  source?: { url: string; label: string },
][] = [
  ["1444", 1, 1, 6], // Тихомир Станић
  ["1437", 1, 2, 7], // Илија Срдановић
  ["1439", 2, 1, 3], // Жељко Хубач
  ["1476", 2, 3, 1, oathPhotoSource], // Сања Фриц
  ["1470", 2, 4, 4], // Александра Штимац
  ["1539", 2, 5, 3], // Слободан Бубњевић
  ["1460", 2, 7, 3], // Дејан Бодирога
  ["1558", 2, 7, 2], // Драган Јовановић
  ["1512", 3, 1, 1], // Јово Бакић
  // The same-day broadcast shows him speaking from the seat next to Бакић.
  // https://informer.rs/politika/vesti/1170801/jugoslav-gasic-studentska-lista
  ["1532", 3, 1, 2], // Југослав Гашић
  // Ђајић is in front of Шошкић in the 19 November broadcast.
  ["1494", 4, 2, 1, oathPhotoSource], // Зоран Ђајић
  [
    "1484",
    4,
    2,
    4,
    {
      url: "https://skupstina.live/sednica/s15-01-d3/govor/390",
      label: "Место на снимку",
    },
  ], // Феђа Димовић
  ["1463", 4, 3, 2, oathPhotoSource], // Дејан Шошкић
  // Both are in the front row. Their order is inferred from the rear view.
  ["324", 5, 1, 1, november24FrontBenchesSource], // Балинт Пастор
  ["1295", 5, 1, 3, november24FrontBenchesSource], // Усаме Зукорлић
  ["1002", 6, 1, 1, november24FrontBenchesSource], // Александар Шешељ
  ["1611", 6, 1, 2, nedeljkovicSpeechSource], // Марина Недељковић
  ["598", 6, 1, 3, november24FrontBenchesSource], // Маријан Ристичевић
  ["118", 6, 2, 5, nedeljkovicSpeechSource], // Вјерица Радета
  ["1029", 7, 1, 1, oppositionPhotoSource], // Миленко Јованов
  ["30", 7, 1, 3, oppositionPhotoSource], // Александар Вучић
  ["1326", 7, 2, 1, november24FrontBenchesSource], // Арно Гујон
  ["1034", 7, 2, 2, november24VucicBenchesSource], // Невена Ђурић Никитовић
  ["1190", 7, 2, 3, oppositionPhotoSource], // Ана Брнабић
  ["1016", 7, 2, 4, oppositionPhotoSource], // Милош Вучевић
  ["1618", 7, 3, 1, oppositionPhotoSource], // Владимир Балаћ
  ["1587", 7, 3, 2, oppositionPhotoSource], // Вукашин Вучићевић
  ["1023", 7, 3, 3, oppositionPhotoSource], // Оља Петровић
  ["1594", 7, 3, 4, oppositionPhotoSource], // Лука Лалошевић
  ["1586", 7, 3, 5, oppositionPhotoSource], // Милош Павловић
  // The 24 November broadcast also shows Кубуровић and Мацура here at 50:32:
  // https://www.youtube.com/watch?v=zm-BK3kiWUo&t=3032s
  ["1600", 7, 4, 3, oppositionPhotoSource], // Нина Кубуровић
  ["1205", 7, 4, 4, oppositionPhotoSource], // Никола Бокан
  ["1619", 7, 4, 5, oppositionPhotoSource], // Ања Ранковић
  ["1605", 7, 4, 6, oppositionPhotoSource], // Марија Станковић
  ["1602", 7, 5, 3, oppositionGallerySource], // Дина Вучинић
  ["1578", 7, 5, 4, oppositionGallerySource], // Јелена Ђукић Милинковић
  ["1196", 7, 5, 5, oppositionGallerySource], // Нада Мацура
  ["1598", 7, 5, 6, oppositionGallerySource], // Славица Сантрач
  ["1590", 7, 5, 7, oppositionGallerySource], // Урош Радуловић
  ["1057", 7, 6, 1, oppositionGallerySource], // Мирослав Кондић
  ["1606", 7, 6, 2, oppositionGallerySource], // Драгана Живковић Обрадовић
  ["1583", 7, 6, 3, oppositionGallerySource], // Милан Стојичић
  ["1610", 7, 6, 5, oppositionGallerySource], // Кристина Васиљковић
  ["1621", 7, 6, 6, oppositionGallerySource], // Предраг Момчиловић
  ["302", 8, 1, 1, november24SideBenchesSource], // Марина Рагуш
  ["1041", 8, 1, 2, mirkovicSpeechSource], // Александар Мирковић
  ["617", 8, 1, 3, panticPiljaSpeechSource], // Биљана Пантић Пиља
  ["757", 8, 1, 4, november24SideBenchesSource], // Владимир Ђукановић
  ["1324", 8, 1, 6, november24SideBenchesSource], // Никола Селаковић
  ["1038", 8, 2, 1, oppositionPhotoSource], // Данијела Николић
  ["1579", 8, 2, 2, november24SideBenchesSource], // Бранислав Лечић
  ["1058", 8, 2, 3, november24SideBenchesSource], // Угљеша Мрдић
  ["270", 8, 2, 4, november24SideBenchesSource], // Лидија Вукићевић
  ["1332", 8, 3, 1, oppositionPhotoSource], // Горан Ракић
  ["1102", 8, 3, 2, oppositionPhotoSource], // Марко Младеновић
];

const seatObservations = new Map(
  observedSeats.map(([id, sector, row, seat, source]) => [
    id,
    {
      position: sectors[sector - 1].rows[row - 1][seat - 1],
      source: source ?? {
        url: openingSessionPhoto,
        label: "Место на фотографији",
      },
    },
  ]),
);

// Officers elected on 19 November 2026. The display order is schematic.
const daisY = -131;
const dais = Array.from({ length: 11 }, (_, i) => ({
  x: (i - 5) * 20,
  y: daisY,
  rotation: 0,
}));
const speakerId = "1487";
const officers = new Map(
  ["1449", "1454", "1450", speakerId, "1508", "1442", "1525"].map(
    (id, index) => [id, dais[index + 2]] as const,
  ),
);
function office(id: string) {
  if (id === speakerId) return "Председник Народне скупштине";
  if (officers.has(id)) return "Потпредседник Народне скупштине";
}

const minorityMembers = new Set([
  "1415",
  "1295",
  "863",
  "1625",
  "1626",
  "324",
  "1418",
]);
export function seatingArea(member: Member) {
  return minorityMembers.has(member.id) ? "minority" : member.group;
}

const colors: Record<string, string> = {
  "174": "var(--chart-1)",
  "175": "var(--chart-3)",
  minority: "var(--chart-2)",
};

// Sample the existing bench positions within each area. Use the full roster so
// that filtering the directory never moves a deputy to a different bench.
function placeMembers(members: Member[]) {
  const byArea = new Map<string, Member[]>();
  for (const member of members) {
    const area = seatingArea(member);
    const list = byArea.get(area);
    if (list) list.push(member);
    else byArea.set(area, [member]);
  }
  return Array.from(byArea, ([area, roster]) => {
    const reserved = new Set(
      roster.map(({ id }) => seatObservations.get(id)?.position),
    );
    const positions = sectors
      .filter((sector) => sector.area === area)
      .flatMap(({ rows }) => rows.flat())
      .filter(
        (position) =>
          !unoccupiedOppositionSeats.has(position) && !reserved.has(position),
      );
    const floorCount = roster.filter(
      ({ id }) => !officers.has(id) && !seatObservations.has(id),
    ).length;
    let floorIndex = 0;
    return {
      area,
      count: roster.length,
      dots: roster.map((member) => ({
        member,
        position:
          officers.get(member.id) ??
          seatObservations.get(member.id)?.position ??
          positions[
            Math.floor(((floorIndex++ + 0.5) * positions.length) / floorCount)
          ],
      })),
    };
  }).sort((a, b) => b.count - a.count);
}

function MemberPortrait({ member }: { member: Member }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="member-map-portrait">
      {!loaded && <UserRound aria-hidden="true" />}
      {member.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Serve the Assembly's small portrait thumbnails as static assets.
        <img
          src={`/assembly/portraits/${member.id}.jpg`}
          alt=""
          width={150}
          height={209}
          decoding="async"
          hidden={!loaded}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

export function MemberMap({
  members,
  groups,
  term,
  visible,
  selectedId,
  onSelect,
  headingLevel: Heading = "h2",
}: {
  members: Member[];
  groups: Groups;
  term: number;
  visible: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
  headingLevel?: "h2" | "h3";
}) {
  const [hoveredId, setHoveredId] = useState("");
  const [focusedId, setFocusedId] = useState("");
  const [zoom, setZoom] = useState(minZoom);
  const [inlineMapHeight, setInlineMapHeight] = useState<number | null>(null);
  const fullscreen = inlineMapHeight !== null;
  const matching = new Set(visible.map((member) => member.id));
  const selected = visible.find((member) => member.id === selectedId);
  const selectionRef = useRef<HTMLDivElement>(null);
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomCenter = useRef({ x: 0.5, y: 0.5 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.dataset.pannable = "";
      const { x, y } = zoomCenter.current;
      viewport.scrollTo({
        left: x * viewport.scrollWidth - viewport.clientWidth / 2,
        top: y * viewport.scrollHeight - viewport.clientHeight / 2,
      });
    }
  }, [zoom, fullscreen]);

  function rememberZoomCenter() {
    const viewport = viewportRef.current;
    if (viewport?.scrollWidth && viewport.scrollHeight) {
      zoomCenter.current = {
        x:
          (viewport.scrollLeft + viewport.clientWidth / 2) /
          viewport.scrollWidth,
        y:
          (viewport.scrollTop + viewport.clientHeight / 2) /
          viewport.scrollHeight,
      };
    }
  }

  function changeZoom(step: number) {
    const nextZoom = Math.max(minZoom, Math.min(maxZoom, zoom + step));
    if (nextZoom === minZoom) zoomCenter.current = { x: 0.5, y: 0.5 };
    else rememberZoomCenter();
    setZoom(nextZoom);
  }

  const clearSelection = useCallback(() => {
    onSelect("");
    setFocusedId("");
    setHoveredId("");
  }, [onSelect]);

  useEffect(() => {
    if (!selected) return;
    function clearOnOutsideClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (selectionRef.current?.contains(event.target)) return;
      if (event.target.closest(".member-map-controls")) return;
      if (event.target.closest(".member-seat")?.querySelector("input:enabled"))
        return;
      clearSelection();
    }
    document.addEventListener("click", clearOnOutsideClick, true);
    return () =>
      document.removeEventListener("click", clearOnOutsideClick, true);
  }, [selected, clearSelection]);
  const areas = useMemo(() => placeMembers(members), [members]);
  const assignedSeats = useMemo(
    () =>
      new Set(
        areas.flatMap(({ dots }) =>
          dots.flatMap(({ position }) =>
            position ? [position.x + "," + position.y] : [],
          ),
        ),
      ),
    [areas],
  );
  function emptySeats(row: SeatPosition[]) {
    return row.filter(({ x, y }) => !assignedSeats.has(x + "," + y));
  }
  const city = selected?.residence?.split(",", 1)[0].trim();
  const description = selected
    ? [selected.occupation, city].filter(Boolean).join(" · ")
    : "";
  const previewId = [hoveredId, focusedId].find(
    (id) => id && id !== selected?.id && matching.has(id),
  );
  const names: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(groups).map(([id, group]) => [id, group.name]),
    ),
    minority: "Посланици са мањинских листа",
    "173": "Остали посланици без групе — положај непотврђен",
  };
  function memberSeat(member: Member, area: string, position?: SeatPosition) {
    return (
      <label
        key={member.id}
        className="member-seat"
        data-side={position && (position.x < 0 ? "left" : "right")}
        data-preview={previewId === member.id || undefined}
        data-tip-below={(position && position.y < -25) || undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch" && matching.has(member.id))
            setHoveredId(member.id);
        }}
        onPointerLeave={() => setHoveredId("")}
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) setFocusedId(member.id);
        }}
        onBlur={() => setFocusedId("")}
        style={
          {
            "--seat-color": colors[area] ?? "var(--chart-4)",
            ...(position && {
              "--seat-rotation": `${position.rotation.toFixed(3)}deg`,
              left: `${(((position.x - chamber.left) / chamber.width) * 100).toFixed(3)}%`,
              top: `${(((position.y - chamber.top) / chamber.height) * 100).toFixed(3)}%`,
            }),
          } as CSSProperties
        }
      >
        <input
          type="radio"
          className="sr-only"
          name="assembly-seat"
          aria-label={[member.name, office(member.id)]
            .filter(Boolean)
            .join(", ")}
          value={member.id}
          disabled={!matching.has(member.id)}
          checked={selected?.id === member.id}
          onChange={() => onSelect(member.id)}
        />
        <span aria-hidden="true" />
        {previewId === member.id && (
          <small aria-hidden="true">
            {member.name}
            {office(member.id) && (
              <>
                <br />
                {office(member.id)}
              </>
            )}
          </small>
        )}
      </label>
    );
  }
  const mapBody = (
    <div className="member-map-body" ref={mapBodyRef}>
      <div
        className="member-map-chamber"
        data-zoomed={zoom > minZoom || undefined}
        style={
          {
            "--chamber-aspect-ratio": chamber.width / chamber.height,
            "--dais-center-offset": `${((daisY - chamber.top) / chamber.width) * 100}cqw`,
          } as CSSProperties
        }
      >
        <div className="member-map-viewport" ref={viewportRef}>
          <div className="member-map-stage" style={{ width: `${zoom * 100}%` }}>
            <div className="member-map-floor">
              <svg
                className="member-hemicycle"
                viewBox={`${chamber.left} ${chamber.top} ${chamber.width} ${chamber.height}`}
                role="img"
                aria-labelledby="chamber-title"
              >
                <title id="chamber-title">
                  {`Осам сектора Велике сале. Из публике гледано, „${names["174"]}“ је десно, ` +
                    "мањинске листе лево уз средишњи пролаз, а група Александар Вучић даље лево."}
                </title>
                <SeatRow seats={emptySeats(dais)} />
                {sectors.map(({ number, rows }) => (
                  <g key={number} data-sector={number}>
                    {rows.map((row, index) => (
                      <SeatRow key={index} seats={emptySeats(row)} />
                    ))}
                  </g>
                ))}
              </svg>
              {areas.flatMap(({ area, dots }) =>
                dots.map(
                  ({ member, position }) =>
                    position && memberSeat(member, area, position),
                ),
              )}
            </div>
          </div>
        </div>
        <div
          className="member-map-selection"
          ref={selectionRef}
          aria-live="polite"
          aria-atomic="true"
        >
          {selected && (
            <section
              className="member-map-profile leading-snug"
              aria-labelledby="member-map-profile-name"
            >
              <MemberPortrait
                key={`portrait-${selected.id}`}
                member={selected}
              />
              <div className="member-map-profile-copy">
                <strong id="member-map-profile-name">{selected.name}</strong>
                {description && <p>{description}</p>}
                <p>
                  {[office(selected.id), groups[selected.group].name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <MemberRating
                key={`${term}:${selected.id}`}
                member={selected}
                term={term}
              />
            </section>
          )}
        </div>
      </div>
      <div className="member-map-key">
        <ul aria-label="Број посланика по групама">
          {areas.map(({ area, count, dots }) => (
            <li key={area}>
              <span className="member-map-key-marker">
                {dots[0].position ? (
                  <i
                    aria-hidden="true"
                    style={{ backgroundColor: colors[area] ?? "var(--border)" }}
                  />
                ) : (
                  dots.map(({ member }) => memberSeat(member, area))
                )}
              </span>
              <span className="member-map-key-label">{names[area]}</span>
              <b>{count}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  function controls(expanded: boolean) {
    return (
      <div
        className="member-map-controls"
        role="group"
        aria-label="Контроле мапе"
      >
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Увећај мапу"
          disabled={zoom >= maxZoom}
          focusableWhenDisabled
          onClick={() => changeZoom(zoomStep)}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Умањи мапу"
          disabled={zoom <= minZoom}
          focusableWhenDisabled
          onClick={() => changeZoom(-zoomStep)}
        >
          <Minus aria-hidden="true" />
        </Button>
        {expanded ? (
          <DialogClose
            render={<Button variant="outline" size="icon-xs" />}
            aria-label="Изађи из целог екрана"
            title="Изађи из целог екрана"
          >
            <Minimize aria-hidden="true" />
          </DialogClose>
        ) : (
          <DialogTrigger
            render={<Button variant="outline" size="icon-xs" />}
            aria-label="Цео екран"
            title="Цео екран"
          >
            <Maximize aria-hidden="true" />
          </DialogTrigger>
        )}
      </div>
    );
  }

  const rankingLink = (
    <div className="member-map-ranking">
      <Link
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "assembly-rating-action",
        })}
        href="/institucije/skupstina/rang-lista"
      >
        Ранг-листа
      </Link>
    </div>
  );

  return (
    <Dialog
      open={fullscreen}
      onOpenChange={(open) => {
        rememberZoomCenter();
        setHoveredId("");
        setFocusedId("");
        setInlineMapHeight(
          open ? (mapBodyRef.current?.offsetHeight ?? 0) : null,
        );
      }}
    >
      <section
        className="member-map"
        aria-labelledby="mapa-sastava"
        id="mapa-poslanika"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            selected &&
            !event.defaultPrevented &&
            !(
              event.target instanceof Element &&
              event.target.closest("[data-assembly-rating-dialog]")
            )
          ) {
            event.preventDefault();
            clearSelection();
          }
        }}
      >
        <header>
          <Heading id="mapa-sastava">{mapTitle}</Heading>
          <p>{seatingNote}</p>
        </header>
        {rankingLink}
        {controls(false)}
        {fullscreen ? <div style={{ minHeight: inlineMapHeight }} /> : mapBody}
      </section>
      <DialogContent
        className="member-map member-map-fullscreen"
        showCloseButton={false}
      >
        <div>
          <header>
            <DialogTitle className="sr-only">{mapTitle}</DialogTitle>
            <DialogDescription>{seatingNote}</DialogDescription>
          </header>
          {rankingLink}
          {controls(true)}
        </div>
        {fullscreen && mapBody}
      </DialogContent>
    </Dialog>
  );
}
