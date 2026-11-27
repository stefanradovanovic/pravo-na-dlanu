"use client";

import { useState } from "react";
import {
  MemberMap,
  type Groups,
  type Member,
} from "./institucije/skupstina/member-map";

export function AssemblyMapPreview({
  members,
  groups,
  term,
}: {
  members: Member[];
  groups: Groups;
  term: number;
}) {
  const [selectedId, setSelectedId] = useState("");

  return (
    <MemberMap
      members={members}
      groups={groups}
      term={term}
      visible={members}
      selectedId={selectedId}
      onSelect={setSelectedId}
      headingLevel="h3"
    />
  );
}
