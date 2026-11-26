import type { Metadata } from "next";

export const siteOrigin = new URL("https://pravonadlanu.com");
export const siteName = "Право на длану";

export function siteUrl(pathname: string) {
  return new URL(pathname, siteOrigin).href;
}

export function siteMetadata(
  pathname?: string,
): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = pathname ? siteUrl(pathname) : undefined;
  return {
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      type: "website",
      siteName,
      locale: "sr_RS",
      url,
      images: [
        {
          url: siteUrl("/share-open-palm.jpg"),
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
