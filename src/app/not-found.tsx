import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <h1>Овај пропис није у збирци.</h1>
      <p>Вратите се на библиотеку одабраних прописа.</p>
      <Link href="/" className="text-link">
        Отвори библиотеку →
      </Link>
    </main>
  );
}
