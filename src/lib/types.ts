import type { PracticeContent } from "./learning-schema";
export type TopicId =
  "rad" | "privatnost" | "informacije" | "ravnopravnost" | "potrosaci";
export type Topic = {
  id: TopicId;
  title: string;
  description: string;
  color: string;
  constitutionArticle: number;
};
export type Law = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  topics: TopicId[];
  sourceUrl: string;
  sourceName: string;
  sourceVersion: string;
  accessedAt: string;
  sourceNote?: string;
  coverage: "learning";
};
export type Example = {
  title: string;
  scenario: string;
  violation: boolean;
  explanation: string;
};
export type Article = {
  id: string;
  lawId: string;
  number: number;
  title: string;
  scope: string;
  explanation: string;
  related: string[];
  examples: Example[];
  practice?: PracticeContent;
};
export type Library = { laws: Law[]; articles: Article[]; topics: Topic[] };
