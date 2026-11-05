import { getRegistry } from "@/lib/registry";
import { RegistryExplorer } from "@/components/registry-explorer";
export default function Home() {
  const registry = getRegistry();
  return (
    <RegistryExplorer
      registry={{
        ...registry,
        records: registry.records.map((record) => ({
          ...record,
          facsimile: undefined,
        })),
      }}
    />
  );
}
