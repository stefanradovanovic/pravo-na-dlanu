import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import directory from "../content/assembly-directory.json";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from "./_generated/server";
import {
  isRatingScore,
  minimumPublishedRatings,
  type PrivateRating,
  type RatingResponse,
} from "./ratingContract";

const memberIds = new Set(directory.members.map(({ id }) => id));
const target = { term: v.number(), memberId: v.string() };
const publicationDelay = 5 * MINUTE;
const minimumChangedGuests = 3;
const limiter = new RateLimiter(components.rateLimiter, {
  guestChecks: {
    kind: "token bucket",
    rate: 120,
    capacity: 30,
    period: MINUTE,
  },
  guestWrites: { kind: "token bucket", rate: 30, capacity: 10, period: MINUTE },
});

export function isCurrentDeputy(term: number, memberId: string) {
  return term === directory.term && memberIds.has(memberId);
}

function findGuest(ctx: QueryCtx, credentialHash: string) {
  return ctx.db
    .query("ratingGuests")
    .withIndex("by_credential", (q) => q.eq("credentialHash", credentialHash))
    .unique();
}

function findRating(
  ctx: QueryCtx,
  term: number,
  memberId: string,
  guestId: Id<"ratingGuests">,
) {
  return ctx.db
    .query("deputyRatings")
    .withIndex("by_deputy_guest", (q) =>
      q.eq("term", term).eq("memberId", memberId).eq("guestId", guestId),
    )
    .unique();
}

function findResult(ctx: QueryCtx, term: number, memberId: string) {
  return ctx.db
    .query("deputyRatingResults")
    .withIndex("by_deputy", (q) => q.eq("term", term).eq("memberId", memberId))
    .unique();
}

function findTotals(ctx: QueryCtx, term: number, memberId: string) {
  return ctx.db
    .query("deputyRatingTotals")
    .withIndex("by_deputy", (q) => q.eq("term", term).eq("memberId", memberId))
    .unique();
}

function roundedAverage(sum: number, count: number) {
  return Math.round((sum / count) * 10) / 10;
}

function publishedSum({ count, average, sum }: Doc<"deputyRatingResults">) {
  if (sum !== undefined) return sum;

  // An older snapshot only has a rounded average. Use it if exactly one
  // integer total could have produced that published value.
  const candidate = Math.round(count * average);
  const fits = (points: number) =>
    points >= count &&
    points <= count * 10 &&
    roundedAverage(points, count) === average;
  return fits(candidate) && !fits(candidate - 1) && !fits(candidate + 1)
    ? candidate
    : null;
}

export const result = query({
  args: target,
  handler: async (ctx, { term, memberId }) => {
    if (!isCurrentDeputy(term, memberId)) return null;
    const result = await findResult(ctx, term, memberId);
    return (
      result && {
        count: result.count,
        average: result.average,
        sum: publishedSum(result),
      }
    );
  },
});

export const ranking = query({
  args: { term: v.number() },
  returns: v.array(
    v.object({ memberId: v.string(), count: v.number(), sum: v.number() }),
  ),
  handler: async (ctx, { term }) => {
    if (term !== directory.term) return [];
    const totals = await ctx.db
      .query("deputyRatingTotals")
      .withIndex("by_deputy", (q) => q.eq("term", term))
      .collect();
    return totals.flatMap(({ memberId, count, sum }) =>
      count > 0 && memberIds.has(memberId) ? [{ memberId, count, sum }] : [],
    );
  },
});

export const backfillPublishedSums = internalMutation({
  args: { term: v.number() },
  handler: async (ctx, { term }) => {
    const results = await ctx.db
      .query("deputyRatingResults")
      .withIndex("by_deputy", (q) => q.eq("term", term))
      .collect();
    let updated = 0;
    for (const result of results) {
      if (result.sum !== undefined) continue;
      const known = publishedSum(result);
      if (known !== null) {
        await ctx.db.patch(result._id, { sum: known });
        updated += 1;
        continue;
      }
      const totals = await findTotals(ctx, term, result.memberId);
      if (totals?.count === result.count && totals.changedGuests.length === 0) {
        await ctx.db.patch(result._id, { sum: totals.sum });
        updated += 1;
      }
    }
    return { scanned: results.length, updated };
  },
});

export const privateRating = internalQuery({
  args: { ...target, credentialHash: v.string() },
  handler: async (
    ctx,
    { term, memberId, credentialHash },
  ): Promise<PrivateRating> => {
    const guest = await findGuest(ctx, credentialHash);
    if (!guest) return { registered: false, score: null };
    const rating = await findRating(ctx, term, memberId, guest._id);
    return { registered: true, score: rating?.score ?? null };
  },
});

export const allowGuestCheck = internalMutation({
  args: {},
  handler: (ctx) => limiter.limit(ctx, "guestChecks"),
});

export const saveRating = internalMutation({
  args: {
    ...target,
    credentialHash: v.string(),
    score: v.union(v.number(), v.null()),
    verifiedChallenge: v.optional(v.object({ hash: v.optional(v.string()) })),
  },
  handler: async (
    ctx,
    { term, memberId, credentialHash, score, verifiedChallenge },
  ): Promise<RatingResponse> => {
    if (
      !isCurrentDeputy(term, memberId) ||
      (score !== null && !isRatingScore(score))
    ) {
      return { status: "invalid" };
    }

    const guest = await findGuest(ctx, credentialHash);
    let guestId = guest?._id;
    if (!guestId) {
      if (!verifiedChallenge || score === null) return { status: "challenge" };
      const challengeHash = verifiedChallenge.hash;
      if (challengeHash) {
        const used = await ctx.db
          .query("ratingGuests")
          .withIndex("by_challenge", (q) =>
            q.eq("challengeHash", challengeHash),
          )
          .first();
        if (used) return { status: "challenge" };
      }
      guestId = await ctx.db.insert("ratingGuests", {
        credentialHash,
        challengeHash,
      });
    }

    const limit = await limiter.limit(ctx, "guestWrites", { key: guestId });
    if (!limit.ok)
      return {
        status: "limited",
        retryAfter: Math.ceil(limit.retryAfter / 1000),
      };

    const oldRating = await findRating(ctx, term, memberId, guestId);
    const previous = oldRating?.score ?? null;
    if (previous === score)
      return { status: "ok", rating: { registered: true, score } };

    if (oldRating && score === null) await ctx.db.delete(oldRating._id);
    else if (oldRating && score !== null)
      await ctx.db.patch(oldRating._id, { score });
    else if (score !== null)
      await ctx.db.insert("deputyRatings", { term, memberId, guestId, score });

    const totals = await findTotals(ctx, term, memberId);
    const count =
      (totals?.count ?? 0) + Number(score !== null) - Number(previous !== null);
    const sum = (totals?.sum ?? 0) + (score ?? 0) - (previous ?? 0);
    const changedGuests = totals?.changedGuests ?? [];
    if (
      changedGuests.length < minimumChangedGuests &&
      !changedGuests.includes(guestId)
    ) {
      changedGuests.push(guestId);
    }
    let publicationScheduled = totals?.publicationScheduled ?? false;
    if (
      count < minimumPublishedRatings &&
      (totals?.count ?? 0) >= minimumPublishedRatings
    ) {
      const published = await findResult(ctx, term, memberId);
      if (published) await ctx.db.delete(published._id);
    }
    if (
      !publicationScheduled &&
      count >= minimumPublishedRatings &&
      changedGuests.length >= minimumChangedGuests
    ) {
      const published = await findResult(ctx, term, memberId);
      await ctx.scheduler.runAfter(
        published ? publicationDelay : 0,
        internal.ratings.publishResult,
        { term, memberId },
      );
      publicationScheduled = true;
    }

    const update = { count, sum, changedGuests, publicationScheduled };
    if (totals) await ctx.db.patch(totals._id, update);
    else
      await ctx.db.insert("deputyRatingTotals", { term, memberId, ...update });
    return { status: "ok", rating: { registered: true, score } };
  },
});

export const publishResult = internalMutation({
  args: target,
  handler: async (ctx, { term, memberId }) => {
    const totals = await findTotals(ctx, term, memberId);
    if (!totals?.publicationScheduled) return;

    const { count, sum, changedGuests } = totals;
    if (
      count < minimumPublishedRatings ||
      changedGuests.length < minimumChangedGuests
    ) {
      await ctx.db.patch(totals._id, { publicationScheduled: false });
      return;
    }

    const average = roundedAverage(sum, count);
    const published = await findResult(ctx, term, memberId);
    if (!published)
      await ctx.db.insert("deputyRatingResults", {
        term,
        memberId,
        count,
        average,
        sum,
      });
    else if (published.count !== count || published.sum !== sum) {
      await ctx.db.patch(published._id, { count, average, sum });
    }
    await ctx.db.patch(totals._id, {
      publicationScheduled: false,
      changedGuests: [],
    });
  },
});
