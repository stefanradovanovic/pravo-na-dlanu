"use client";

import { ConvexProvider, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ratingClient, ratingNumber } from "../rating-client";
import "./rating-ranking.css";

type RankingProps = { term: number; members: { id: string; name: string }[] };
const byName = new Intl.Collator("sr-Cyrl-RS");

function RankingTable({ term, members }: RankingProps) {
  const totals = useQuery(api.ratings.ranking, { term });
  if (totals === undefined) return <p role="status">Учитавање…</p>;
  if (totals.length === 0) {
    return (
      <p role="status">
        Ранг-листа ће се приказати чим неко од посланика добије прву оцену.
      </p>
    );
  }

  const names = new Map(members.map(({ id, name }) => [id, name]));
  const entries = totals
    .flatMap((entry) => {
      const name = names.get(entry.memberId);
      return name ? [{ ...entry, name }] : [];
    })
    .sort(
      (left, right) =>
        right.sum - left.sum || byName.compare(left.name, right.name),
    );
  const ranked = [];
  let place = 0;
  for (const [index, entry] of entries.entries()) {
    if (entries[index - 1]?.sum !== entry.sum) place = index + 1;
    ranked.push({ ...entry, place });
  }

  return (
    <table
      aria-label="Ранг-листа по укупном броју поена"
      className="assembly-ranking"
    >
      <thead>
        <tr>
          <th scope="col">Место</th>
          <th scope="col">Посланик</th>
          <th scope="col" aria-sort="descending">
            Поени
          </th>
          <th scope="col">Број оцена</th>
        </tr>
      </thead>
      <tbody>
        {ranked.map(({ memberId, name, count, sum, place }) => (
          <tr key={memberId}>
            <td>{ratingNumber.format(place)}</td>
            <th scope="row">
              <a
                className="text-link"
                href={`/institucije/skupstina#poslanik-${memberId}`}
              >
                {name}
              </a>
            </th>
            <td>
              <strong>{ratingNumber.format(sum)}</strong>
            </td>
            <td>{ratingNumber.format(count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RatingRanking(props: RankingProps) {
  if (!ratingClient) return <p role="status">Оцене тренутно нису доступне.</p>;
  return (
    <ConvexProvider client={ratingClient}>
      <RankingTable {...props} />
    </ConvexProvider>
  );
}
