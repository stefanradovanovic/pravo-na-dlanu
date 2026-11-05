import { getRegistry } from "@/lib/registry";
import { RegistryExplorer } from "@/components/registry-explorer";
export default function Home() {
  return <RegistryExplorer registry={getRegistry()} />;
}
