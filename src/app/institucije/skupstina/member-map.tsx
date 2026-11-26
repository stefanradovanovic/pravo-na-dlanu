"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";

export type Member = {
  id: string;
  name: string;
  group: string;
  source: string;
};
export type Groups = Record<string, { name: string }>;

// Allocate each arc a share of the dots proportional to its length.
function positions(count: number) {
  const radii = [19, 23, 27, 31, 35, 39, 43, 47];
  const totalRadius = radii.reduce((sum, radius) => sum + radius, 0);
  let covered = 0;
  const dots = radii.flatMap((radius) => {
    const start = Math.round((count * covered) / totalRadius);
    covered += radius;
    const length = Math.round((count * covered) / totalRadius) - start;
    return Array.from({ length }, (_, index) => {
      const angle = (Math.PI * (index + 0.5)) / length;
      return {
        angle,
        x: 50 - radius * Math.cos(angle),
        y: 96 - 2 * radius * Math.sin(angle),
      };
    });
  });
  return dots.sort((a, b) => a.angle - b.angle);
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
  const [selectedId, setSelectedId] = useState("");
  const [hoveredId, setHoveredId] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const { legend, seats } = useMemo(() => {
    const legend = Object.entries(groups)
      .map(([id, group]) => ({
        id,
        name: group.name,
        members: members.filter((member) => member.group === id),
      }))
      .sort((a, b) => b.members.length - a.members.length);
    const dots = positions(members.length);
    const seats = legend
      .flatMap((group, index) =>
        group.members.map((member) => ({
          member,
          color: `var(--chart-${(index % 5) + 1})`,
        })),
      )
      .map((seat, index) => ({ ...seat, ...dots[index] }));
    return { legend, seats };
  }, [members, groups]);
  const matching = new Set(visible.map((member) => member.id));
  const selected =
    visible.find((member) => member.id === selectedId) ??
    (visible.length === 1 ? visible[0] : undefined);
  const displayed =
    visible.find((member) => member.id === hoveredId) ?? selected;
  return (
    <section
      className="member-map"
      aria-labelledby="mapa-sastava"
      id="mapa-poslanika"
    >
      <header>
        <div>
          <h2 id="mapa-sastava">Мапа посланичких група</h2>
          <p>
            Свака тачка представља једног посланика. Положаји су шематски, по
            посланичким групама.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          aria-pressed={zoomed}
          onClick={() => setZoomed(!zoomed)}
        >
          Увећај приказ
        </Button>
      </header>
      <div className="member-map-body">
        <div className="member-map-scroll" data-zoomed={zoomed || undefined}>
          <fieldset
            className="member-hemicycle"
            onPointerLeave={() => setHoveredId("")}
          >
            <legend className="sr-only">
              Изаберите народног посланика на мапи
            </legend>
            {seats.map(({ member, color, x, y }) => (
              <label
                key={member.id}
                title={`${member.name} · ${groups[member.group].name}`}
                className="member-dot"
                style={
                  {
                    left: x + "%",
                    top: y + "%",
                    "--dot-color": color,
                  } as CSSProperties
                }
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHoveredId(member.id);
                }}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="map-member"
                  aria-label={member.name}
                  disabled={!matching.has(member.id)}
                  checked={selected?.id === member.id}
                  onChange={() => {
                    setSelectedId(member.id);
                    setHoveredId("");
                  }}
                />
                <span aria-hidden="true" />
              </label>
            ))}
            <div className="member-map-total" aria-hidden="true">
              <strong>{members.length}</strong>посланика
            </div>
          </fieldset>
        </div>
        <div className="member-map-key">
          <ul aria-label="Састав по посланичким групама">
            {legend.map((group, index) => (
              <li key={group.id}>
                <i
                  aria-hidden="true"
                  style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
                />
                {group.name}
                <b>{group.members.length}</b>
              </li>
            ))}
          </ul>
          <div className="member-map-detail">
            {displayed ? (
              <>
                <strong>{displayed.name}</strong>
                <p>{groups[displayed.group].name}</p>
              </>
            ) : (
              <p>
                {visible.length
                  ? "Изаберите тачку да видите име посланика."
                  : "Нема посланика за изабрану претрагу."}
              </p>
            )}
            {selected && displayed === selected && (
              <a className="text-link" href={selected.source}>
                Профил на сајту Скупштине
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
