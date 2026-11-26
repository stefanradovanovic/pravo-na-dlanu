"use client";

import { useState } from "react";
import { normalizeSearch } from "@/lib/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionSearchInput } from "../institution-search-input";

import { MemberMap, seatingArea, type Member, type Groups } from "./member-map";
const searchName = (value: string) =>
  normalizeSearch(value).replaceAll("dj", "d");

function MemberList({
  label,
  members,
  onSelect,
}: {
  label: string;
  members: Member[];
  onSelect: (id: string) => void;
}) {
  if (!members.length) return null;

  return (
    <section aria-label={label}>
      <h2>{label}</h2>
      <ul className="assembly-list">
        {members.map((member) => (
          <li id={`poslanik-${member.id}`} key={member.id} tabIndex={-1}>
            <a
              className="text-link"
              href="#mapa-poslanika"
              onClick={() => onSelect(member.id)}
            >
              {member.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MemberDirectory({
  members,
  groups,
}: {
  members: Member[];
  groups: Groups;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const words = searchName(query).split(" ").filter(Boolean);
  const options = [
    { value: "all", label: "Све групе" },
    ...Object.entries(groups).map(([value, item]) => ({
      value,
      label: item.name,
    })),
  ];
  const visible = members.filter(
    (member) =>
      (group === "all" || member.group === group) &&
      words.every((word) => searchName(member.name).includes(word)),
  );
  const membersInArea = (area: string) =>
    visible.filter((member) => seatingArea(member) === area);
  return (
    <>
      <div className="assembly-filters">
        <div>
          <p>Име или презиме</p>
          <InstitutionSearchInput
            label="Име или презиме"
            placeholder="Претражите посланике"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <div>
          <label htmlFor="poslanicka-grupa">Посланичка група</label>
          <Select
            value={group}
            items={options}
            onValueChange={(value) => setGroup(value ?? "all")}
          >
            <SelectTrigger id="poslanicka-grupa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p role="status" className="assembly-status">
        {visible.length
          ? `Приказано: ${visible.length} од ${members.length}`
          : "Нема посланика за изабрану претрагу."}
      </p>
      <MemberMap
        members={members}
        groups={groups}
        visible={visible}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="assembly-roster">
        <div>
          <MemberList
            label={groups["175"].name}
            members={membersInArea("175")}
            onSelect={setSelectedId}
          />
        </div>
        <div>
          <MemberList
            label="Посланици са мањинских листа"
            members={membersInArea("minority")}
            onSelect={setSelectedId}
          />
          <MemberList
            label={groups["173"].name}
            members={membersInArea("173")}
            onSelect={setSelectedId}
          />
        </div>
        <div>
          <MemberList
            label={groups["174"].name}
            members={membersInArea("174")}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </>
  );
}
