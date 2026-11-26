import data from "../../../../content/assembly-directory.json";
import { socialMetadata } from "@/lib/social-metadata";
import { AssemblyShell } from "./assembly-shell";
import { MemberDirectory } from "./member-directory";

export const metadata = {
  ...socialMetadata("/institucije/skupstina"),
  title: "Народни посланици",
};

export default function MembersPage() {
  return (
    <AssemblyShell
      title={metadata.title}
      description={`Број посланика: ${data.members.length}`}
      accessedAt={data.accessedAt}
    >
      <MemberDirectory members={data.members} groups={data.groups} />
      <p className="assembly-links">
        <a className="text-link" href={data.memberSource}>
          Скупштински именик посланика
        </a>
        <a className="text-link" href={data.groupSource}>
          Састав посланичких група
        </a>
      </p>
    </AssemblyShell>
  );
}
