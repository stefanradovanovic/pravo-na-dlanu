import { ConvexReactClient } from "convex/react";
import { assemblyRatingPath } from "../../../../convex/ratingContract";

const clientUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const ratingClient = clientUrl ? new ConvexReactClient(clientUrl) : null;
export const ratingConfiguration =
  ratingClient && siteUrl && siteKey
    ? {
        client: ratingClient,
        endpoint: new URL(assemblyRatingPath, siteUrl),
        siteKey,
      }
    : null;

export const ratingNumber = new Intl.NumberFormat("sr-Cyrl-RS");
