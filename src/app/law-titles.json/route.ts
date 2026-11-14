import { getRegistry } from "@/lib/registry";
import { lawPath } from "@/lib/registry-types";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    getRegistry().records.map((law) => ({
      title: law.title,
      href: lawPath(law),
    })),
  );
}
