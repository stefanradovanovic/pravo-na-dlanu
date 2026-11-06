import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLibrary } from "@/lib/content";
import { findLearningLaw } from "@/lib/registry";
import { lawPath } from "@/lib/registry-types";
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
  const law = getLibrary().laws.find((l) => l.id === slug);
  return {
    title: law?.title ?? "Пропис није пронађен",
    description: law?.description,
  };
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
