import { ArrowRight } from "lucide-react";
import Link from "next/link";
import assembly from "../../content/assembly-directory.json";
import { getRegistry } from "@/lib/registry";
import { RegistryExplorer } from "@/components/registry-explorer";
import { buttonVariants } from "@/components/ui/button";
import { socialMetadata } from "@/lib/social-metadata";
import { AssemblyMapPreview } from "./assembly-map-preview";

export const metadata = socialMetadata("/");

export default function Home() {
  const registry = getRegistry();
  return (
    <main id="main">
      <RegistryExplorer
        registry={{
          ...registry,
          records: registry.records.map((record) => ({
            ...record,
            facsimile: undefined,
          })),
        }}
      />
      <section
        className="workspace assembly-preview"
        aria-labelledby="skupstina-naslov"
      >
        <header className="explorer-header">
          <div>
            <h2 id="skupstina-naslov">Народна скупштина</h2>
            <p className="heading-description">
              Изаберите седиште на мапи да сазнате ко ту седи и којој
              посланичкој групи припада.
            </p>
          </div>
          <Link href="/institucije/skupstina" className={buttonVariants()}>
            Погледај детаље <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        <AssemblyMapPreview
          members={assembly.members.map(
            ({ id, name, group, photoUrl, occupation, residence }) => ({
              id,
              name,
              group,
              photoUrl,
              occupation,
              residence,
            }),
          )}
          groups={assembly.groups}
        />
      </section>
    </main>
  );
}
