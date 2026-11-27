export const assemblyRatingPath = "/assembly-ratings";
export const assemblyRatingAction = "assembly_rating";
export const minimumPublishedRatings = 10;
export const ratingScores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function isRatingScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  );
}

export type PrivateRating = { registered: boolean; score: number | null };

type RatingTarget = { term: number; memberId: string; credential: string };

export type RatingRequest = RatingTarget &
  (
    | { operation: "read" }
    | { operation: "write"; score: number | null; challenge?: string }
  );

export type RatingResponse =
  | { status: "ok"; rating: PrivateRating }
  | { status: "limited"; retryAfter: number }
  | { status: "challenge" | "invalid" | "unavailable" };
