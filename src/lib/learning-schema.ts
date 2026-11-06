import { z } from "zod";

const question = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    scenario: z.string().min(1),
    prompt: z.string().min(1),
    kind: z.enum(["scenario", "research"]),
    hint: z.string().optional(),
    choices: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          text: z.string().min(1),
          explanation: z.string().min(1),
        }),
      )
      .min(2)
      .max(4),
    correctChoiceId: z.string(),
  })
  .refine(
    (q) =>
      new Set(q.choices.map((c) => c.id)).size === q.choices.length &&
      q.choices.some((c) => c.id === q.correctChoiceId),
    "Invalid question choices",
  );

export const practiceSchema = z.object({
  sourceVersion: z.string().min(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceCheckedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  questions: z
    .array(
      question.safeExtend({
        whatIf: question.safeExtend({ change: z.string().min(1) }).optional(),
      }),
    )
    .min(1),
});

export type PracticeContent = z.infer<typeof practiceSchema>;
export type QuestionContent = z.infer<typeof question>;
