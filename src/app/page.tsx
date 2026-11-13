import { findLearningLaw, getRegistry } from "@/lib/registry";
import { RegistryExplorer } from "@/components/registry-explorer";
import { catalogData } from "@/lib/catalog";
import { learningTopics } from "@/lib/learning";
export default function Home() {
  const registry = getRegistry();
  const topics = new Map(
    learningTopics.flatMap((topic) => {
      const law = findLearningLaw(topic.lawId);
      return law ? [[law.id, topic.id] as const] : [];
    }),
  );
  return <RegistryExplorer registry={catalogData(registry, topics)} />;
}
