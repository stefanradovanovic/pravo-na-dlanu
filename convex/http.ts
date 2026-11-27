import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import {
  assemblyRatingAction,
  assemblyRatingPath,
  isRatingScore,
  type RatingRequest,
  type RatingResponse,
} from "./ratingContract";
import { isCurrentDeputy } from "./ratings";

const turnstileVerifyUrl =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const localTestSecret = "1x0000000000000000000000000000000AA";
const localTestToken = "XXXX.DUMMY.TOKEN.XXXX";
const credentialPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function allowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  const allowed = process.env.RATINGS_ALLOWED_ORIGINS?.split(",").map((value) =>
    value.trim(),
  );
  return origin && allowed?.includes(origin) ? origin : null;
}

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

function respond(origin: string, response: RatingResponse) {
  const statuses = {
    ok: 200,
    limited: 429,
    challenge: 403,
    invalid: 400,
    unavailable: 503,
  };
  return new Response(JSON.stringify(response), {
    status: statuses[response.status],
    headers: {
      ...cors(origin),
      "Content-Type": "application/json",
      ...(response.status === "limited" && {
        "Retry-After": String(response.retryAfter),
      }),
    },
  });
}

function parseRequest(value: unknown): RatingRequest | null {
  if (!value || typeof value !== "object") return null;
  const { term, memberId, credential, operation, score, challenge } =
    value as Record<string, unknown>;
  if (
    typeof term !== "number" ||
    typeof memberId !== "string" ||
    !isCurrentDeputy(term, memberId) ||
    typeof credential !== "string" ||
    !credentialPattern.test(credential)
  )
    return null;
  if (operation === "read") return { term, memberId, credential, operation };
  if (operation !== "write" || (score !== null && !isRatingScore(score)))
    return null;
  if (
    challenge !== undefined &&
    (typeof challenge !== "string" || !challenge || challenge.length > 2048)
  )
    return null;
  return { term, memberId, credential, operation, score, challenge };
}

async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function loopback(url: string) {
  return ["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname);
}

async function verifyChallenge(challenge: string, origin: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Turnstile is not configured.");
  const localTest =
    secret === localTestSecret &&
    loopback(origin) &&
    loopback(process.env.CONVEX_SITE_URL ?? "https://convex.site");
  if (secret === localTestSecret && (!localTest || challenge !== localTestToken)) {
    return null;
  }
  const response = await fetch(turnstileVerifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: challenge }),
  });
  if (!response.ok) throw new Error("Turnstile verification is unavailable.");
  const proof = await response.json();
  if (proof.success !== true) return null;
  if (
    localTest &&
    proof.hostname === "example.com" &&
    proof.action === undefined
  )
    return {};
  if (
    proof.hostname !== new URL(origin).hostname ||
    proof.action !== assemblyRatingAction
  )
    return null;
  return { hash: await hash(challenge) };
}

const http = httpRouter();

http.route({
  path: assemblyRatingPath,
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = allowedOrigin(request);
    if (!origin) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...cors(origin),
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      },
    });
  }),
});

http.route({
  path: assemblyRatingPath,
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = allowedOrigin(request);
    if (!origin) return new Response(null, { status: 403 });
    const contentType = request.headers
      .get("Content-Type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (
      contentType !== "application/json" ||
      Number(request.headers.get("Content-Length")) > 4096
    ) {
      return respond(origin, { status: "invalid" });
    }
    const input = parseRequest(await request.json().catch(() => null));
    if (!input) return respond(origin, { status: "invalid" });

    try {
      const target = {
        term: input.term,
        memberId: input.memberId,
        credentialHash: await hash(input.credential),
      };
      if (input.operation === "read") {
        const rating = await ctx.runQuery(
          internal.ratings.privateRating,
          target,
        );
        return respond(origin, { status: "ok", rating });
      }

      let verifiedChallenge;
      if (input.challenge && input.score !== null) {
        const limit = await ctx.runMutation(
          internal.ratings.allowGuestCheck,
          {},
        );
        if (!limit.ok)
          return respond(origin, {
            status: "limited",
            retryAfter: Math.ceil(limit.retryAfter / 1000),
          });
        verifiedChallenge = await verifyChallenge(input.challenge, origin);
        if (!verifiedChallenge) return respond(origin, { status: "challenge" });
      }
      const result = await ctx.runMutation(internal.ratings.saveRating, {
        ...target,
        score: input.score,
        verifiedChallenge,
      });
      return respond(origin, result);
    } catch (error) {
      console.error("Assembly rating request failed", error);
      return respond(origin, { status: "unavailable" });
    }
  }),
});

export default http;
