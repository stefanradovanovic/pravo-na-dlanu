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
}: {
  members: Member[];
  groups: Groups;
}) {
  const [selectedId, setSelectedId] = useState("");

  return (
    <MemberMap
      members={members}
      groups={groups}
      visible={members}
      selectedId={selectedId}
      onSelect={setSelectedId}
      headingLevel="h3"
      showHallPlan={false}
    />
  );
}
