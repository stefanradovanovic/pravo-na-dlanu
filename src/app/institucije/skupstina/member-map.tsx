"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type Member = {
  id: string;
  name: string;
  group: string;
  source: string;
};
export type Groups = Record<string, { name: string }>;

// Half of the Great Hall, mirrored across its central aisle. Measurements
// follow page 46 of the Assembly's floor plan, rotated toward the dais.
const radii = [170, 205, 242, 279, 315, 352, 388];
const sideBenches = [
  [207, 10, -82, 6],
  [242, 15, -98, 7],
  [277, 20, -98, 7],
  [312, 25, -98, 7],
  [347, 32, -98, 8],
  [383, 38, -98, 8],
  [422, -42, -98, 4],
];

// Tighten row spacing around the middle bench without changing its seat count.
const rowSpacing = 0.8;
type SeatPosition = { x: number; y: number; rotation: number };

function benchRow(block: number, row: number) {
  if (block === 1) {
    const [x, start, end, count] = sideBenches[row];
    return Array.from({ length: count }, (_, index) => ({
      x: sideBenches[3][0] + (x - sideBenches[3][0]) * rowSpacing,
      rotation: -90,
      y: start + ((end - start) * index) / (count - 1),
    }));
  }
  const planRadius = radii[row];
  const radius = radii[3] + (planRadius - radii[3]) * rowSpacing;
  const radians = Math.PI / 180;
  const start =
    block === 4 ? Math.asin(14 / radius) : (block === 3 ? 28 : 56) * radians;
  const end = (block === 4 ? 24 : block === 3 ? 52 : 79) * radians;
  const planStart = block === 4 ? Math.asin(14 / planRadius) : start;
  const count = Math.round(((end - planStart) * planRadius) / 19);
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
          strokeOpacity=".6"
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
    rows: radii.map((_, row) => benchRow(block, row)),
  };
});

// Officers elected on 19 November 2026. The display order is schematic.
const dais = Array.from({ length: 11 }, (_, i) => ({
  x: (i - 5) * 20,
  y: -107,
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
function seatingArea(member: Member) {
  return minorityMembers.has(member.id) ? "minority" : member.group;
}

const colors: Record<string, string> = {
  "174": "var(--chart-1)",
  "175": "var(--chart-2)",
  minority: "var(--chart-3)",
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
    const positions = sectors
      .filter((sector) => sector.area === area)
      .flatMap(({ number, rows }) =>
        rows.flat().map(({ x, y, rotation }) => ({
          x: number > 4 ? -x : x,
          rotation: number > 4 ? -rotation : rotation,
          y,
        })),
      );
    const floorCount = roster.filter(
      (member) => !officers.has(member.id),
    ).length;
    let floorIndex = 0;
    return {
      area,
      count: roster.length,
      dots: roster.map((member) => ({
        member,
        position:
          officers.get(member.id) ??
          positions[
            Math.floor(((floorIndex++ + 0.5) * positions.length) / floorCount)
          ],
      })),
    };
  }).sort((a, b) => b.count - a.count);
}

export function MemberMap({
  members,
  groups,
  visible,
}: {
  members: Member[];
  groups: Groups;
  visible: Member[];
}) {
  const [hoveredId, setHoveredId] = useState("");
  const [focusedId, setFocusedId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (!selectedId) return;
    function clearOnOutsideClick(event: MouseEvent) {
      const seat =
        event.target instanceof Element && event.target.closest(".member-seat");
      if (seat && seat.querySelector("input:enabled")) return;
      setSelectedId("");
      setFocusedId("");
      setHoveredId("");
    }
    document.addEventListener("click", clearOnOutsideClick, true);
    return () =>
      document.removeEventListener("click", clearOnOutsideClick, true);
  }, [selectedId]);
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
  function emptySeats(row: SeatPosition[], mirrored = false) {
    return row.filter(
      ({ x, y }) => !assignedSeats.has((mirrored ? -x : x) + "," + y),
    );
  }
  const matching = new Set(visible.map((member) => member.id));
  const selected = visible.find((member) => member.id === selectedId);
  const previewId = [hoveredId, focusedId, selected?.id].find(
    (id) => id && matching.has(id),
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
            "--seat-color": colors[area] ?? "var(--muted-foreground)",
            ...(position && {
              "--seat-rotation": `${position.rotation.toFixed(3)}deg`,
              left: `${(((position.x + 442) / 884) * 100).toFixed(3)}%`,
              top: `${(((position.y + 125) / 534) * 100).toFixed(3)}%`,
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
          onChange={() => setSelectedId(member.id)}
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
  return (
    <section
      className="member-map"
      aria-labelledby="mapa-sastava"
      id="mapa-poslanika"
    >
      <header>
        <h2 id="mapa-sastava">Распоред у Великој сали</h2>
        <p>
          Поглед ка председавајућем. Изаберите обојено седиште да видите
          посланика. Положаји су приближни. Обриси означавају места без
          придруженог имена.
        </p>
      </header>
      <div className="member-map-body">
        <div className="member-map-floor">
          <svg
            className="member-hemicycle"
            viewBox="-442 -125 884 534"
            role="img"
            aria-labelledby="chamber-title"
          >
            <title id="chamber-title">
              Осам сектора Велике сале. Из публике гледано, Студентска листа је
              десно, мањинске листе лево уз средишњи пролаз, а група Александар
              Вучић даље лево.
            </title>
            <SeatRow seats={emptySeats(dais)} />
            {sectors.map(({ number, rows }) => (
              <g
                key={number}
                data-sector={number}
                transform={number > 4 ? "scale(-1 1)" : undefined}
              >
                {rows.map((row, index) => (
                  <SeatRow key={index} seats={emptySeats(row, number > 4)} />
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
        <div className="member-map-key">
          <div className="member-map-selection" aria-live="polite">
            {selected ? (
              <>
                <strong>{selected.name}</strong>
                {office(selected.id) && <> · {office(selected.id)}</>} ·{" "}
                {groups[selected.group].name} ·{" "}
                <a className="text-link" href={selected.source}>
                  Профил посланика
                </a>
              </>
            ) : (
              "Изаберите посланика на мапи."
            )}
          </div>
          <ul aria-label="Број посланика по групама">
            {areas.map(({ area, count, dots }) => (
              <li key={area}>
                {dots[0].position ? (
                  <i
                    aria-hidden="true"
                    style={{ backgroundColor: colors[area] ?? "var(--border)" }}
                  />
                ) : (
                  dots.map(({ member }) => memberSeat(member, area))
                )}
                {names[area]}
                <b>{count}</b>
              </li>
            ))}
          </ul>
          <div className="member-map-detail">
            <a
              className="text-link"
              href="https://www.parlament.gov.rs/upload/archive/files/eng/pdf/Informator/informator_eng.pdf#page=46"
            >
              План Велике сале (стр. 46)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
