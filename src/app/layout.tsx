import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import "./globals.css";
import "./site.css";
export const metadata: Metadata = {
  title: {
    default: "Право на длану — разумите своја права",
    template: "%s | Право на длану",
  },
  description:
    "Истражите Устав и каталог закона Србије кроз правне области, целовите текстове, званичне изворе и примере из живота.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        <TooltipProvider>
          <a className="skip-link" href="#main">
            Пређи на садржај
          </a>
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <span>© 2026 Право на длану</span>
            <span>Право које разумете. Знање које делите.</span>
            <Link href="/o-projektu">О збирци и изворима ↗</Link>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
