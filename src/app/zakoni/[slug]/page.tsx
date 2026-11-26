import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLibrary } from "@/lib/content";
import { findLearningLaw } from "@/lib/registry";
import { lawPath } from "@/lib/registry-types";
import { lawMetadata } from "@/lib/law-metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return getLibrary().laws.map((l) => ({ slug: l.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = findLearningLaw(slug);
  return record ? lawMetadata(record) : { title: "Пропис није пронађен" };
}
export default async function LawPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const law = findLearningLaw(slug);
  if (!law) notFound();
  redirect(lawPath(law));
}
