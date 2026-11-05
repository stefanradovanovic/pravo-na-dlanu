import { notFound } from "next/navigation";
import { getRegistry, getLawDocument } from "@/lib/registry";
import { FullLawDocument } from "@/components/full-law-document";
export const dynamicParams = false;
export function generateStaticParams() {
  return getRegistry().records.map((r) => ({ id: r.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title:
      getRegistry().records.find((r) => r.id === id)?.title ??
      "Документ није пронађен",
  };
}
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = getLawDocument(id);
  if (!document) notFound();
  return <FullLawDocument {...document} />;
}
