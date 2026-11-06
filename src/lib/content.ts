import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { topics } from "./topics";
import type { Library } from "./types";
import { practiceSchema } from "./learning-schema";

const topic = z.enum(["rad", "privatnost", "informacije", "ravnopravnost"]);
const lawSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  description: z.string().min(1),
  topics: z.array(topic).min(1),
  sourceUrl: z
    .url()
    .refine(
      (url) =>
        new URL(url).protocol === "https:" &&
        new URL(url).hostname === "www.pravno-informacioni-sistem.rs",
    ),
  sourceName: z.string().min(1),
  sourceVersion: z.string().min(1),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceNote: z.string().optional(),
  coverage: z.literal("learning"),
});
const articleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  lawId: z.string(),
  number: z.number().int().positive(),
  title: z.string().min(1),
  scope: z.string().min(1),
  explanation: z.string().min(1),
  related: z.array(z.string()),
  practice: practiceSchema.optional(),
  examples: z.array(
    z.object({
      title: z.string().min(1),
      scenario: z.string().min(1),
      violation: z.boolean(),
      explanation: z.string().min(1),
    }),
  ),
});
export function getLibrary(
  root = path.join(process.cwd(), "content"),
): Library {
  const laws = z
    .array(lawSchema)
    .parse(JSON.parse(fs.readFileSync(path.join(root, "laws.json"), "utf8")));
  const articles = z
    .array(articleSchema)
    .parse(
      JSON.parse(fs.readFileSync(path.join(root, "learning.json"), "utf8")),
    )
    .sort((a, b) => a.number - b.number);
  if (new Set(laws.map((l) => l.id)).size !== laws.length)
    throw new Error("Duplicate law ID");
  if (new Set(articles.map((a) => a.id)).size !== articles.length)
    throw new Error("Duplicate article ID");
  for (const a of articles) {
    if (!laws.some((l) => l.id === a.lawId))
      throw new Error(`Unknown law: ${a.lawId}`);
    for (const id of a.related)
      if (!articles.some((other) => other.id === id))
        throw new Error(`Broken article reference: ${id}`);
  }
  for (const law of laws)
    if (!articles.some((a) => a.lawId === law.id))
      throw new Error(`Law without articles: ${law.id}`);
  return { laws, articles, topics };
}
