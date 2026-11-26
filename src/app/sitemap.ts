import type { MetadataRoute } from "next";
import { getRegistry } from "@/lib/registry";
import { lawPath } from "@/lib/registry-types";
import { siteUrl } from "@/lib/social-metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/institucije",
    "/institucije/skupstina",
    "/institucije/skupstina/odbori",
    "/o-projektu",
    "/ucenje",
    "/ucenje/recnik",
    ...getRegistry().records.map(lawPath),
  ];
  return paths.map((pathname) => ({ url: siteUrl(pathname) }));
}
