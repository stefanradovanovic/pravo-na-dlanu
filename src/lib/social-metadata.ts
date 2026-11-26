import type { Metadata } from "next";

export const siteOrigin = new URL("https://pravonadlanu.com");
export const siteName = "Право на длану";

export function socialMetadata(
  pathname?: string,
): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const pageUrl = pathname ? new URL(pathname, siteOrigin) : undefined;
  return {
    alternates: pageUrl ? { canonical: pageUrl } : undefined,
    openGraph: {
      type: "website",
      siteName,
      locale: "sr_RS",
      url: pageUrl,
      images: [
        {
          url: new URL("/share-open-palm.jpg", siteOrigin),
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: "Право на длану — Разумите своја права. Илустрација отворене књиге на длану.",
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}
