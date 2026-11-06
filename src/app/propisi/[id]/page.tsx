import { notFound } from "next/navigation";
import { getRegistry, getLawDocument } from "@/lib/registry";
import { FullLawDocument } from "@/components/full-law-document";
import { lawPath } from "@/lib/registry-types";
import { LawUrlRedirect } from "@/components/law-url-redirect";
export const dynamicParams = false;
export function generateStaticParams() {
  return getRegistry().records.flatMap((r) => [{ id: r.slug! }, { id: r.id }]);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = getRegistry().records.find(
    (r) => r.id === id || r.slug === id,
  );
  return {
    alternates: record ? { canonical: lawPath(record) } : undefined,
    title: record?.title ?? "Документ није пронађен",
  };
}
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = getRegistry().records.find(
    (r) => r.slug === id || r.id === id,
  );
  if (!record) notFound();
  if (id !== record.slug) return <LawUrlRedirect href={lawPath(record)} />;
  const document = getLawDocument(record.id);
  if (!document) notFound();
  return <FullLawDocument {...document} />;
}
