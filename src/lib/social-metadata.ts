import type { Metadata } from "next";

export const siteOrigin = new URL("https://pravo-na-dlanu.vercel.app");
export const siteName = "Право на длану";

export function socialMetadata(
  pathname?: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName,
      locale: "sr_RS",
      url: pathname,
      images: [
        {
          url: "/share-open-palm.jpg",
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
