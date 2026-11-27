import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const deputy = { term: v.number(), memberId: v.string() };

export default defineSchema({
  ratingGuests: defineTable({
    credentialHash: v.string(),
    challengeHash: v.optional(v.string()),
  })
    .index("by_credential", ["credentialHash"])
    .index("by_challenge", ["challengeHash"]),
  deputyRatings: defineTable({
    ...deputy,
    guestId: v.id("ratingGuests"),
    score: v.number(),
  }).index("by_deputy_guest", ["term", "memberId", "guestId"]),
  deputyRatingTotals: defineTable({
    ...deputy,
    count: v.number(),
    sum: v.number(),
    changedGuests: v.array(v.id("ratingGuests")),
    publicationScheduled: v.boolean(),
  }).index("by_deputy", ["term", "memberId"]),
  deputyRatingResults: defineTable({
    ...deputy,
    count: v.number(),
    average: v.number(),
    sum: v.optional(v.number()),
  }).index("by_deputy", ["term", "memberId"]),
});
