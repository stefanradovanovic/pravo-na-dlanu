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

type Member = { id: string; name: string; group: string; source: string };
type Groups = Record<string, { name: string }>;

const searchName = (value: string) =>
  normalizeSearch(value).replaceAll("dj", "d");

export function MemberDirectory({
  members,
  groups,
}: {
  members: Member[];
  groups: Groups;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
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
      <ul className="assembly-list">
        {visible.map((member) => (
          <li id={`poslanik-${member.id}`} key={member.id} tabIndex={-1}>
            <a className="text-link" href={member.source}>
              {member.name}
            </a>
            <span>{groups[member.group].name}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
