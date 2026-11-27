import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackToTop } from "@/components/back-to-top";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SiteAnalytics } from "@/components/site-analytics";
import { UIAgentBridge } from "@/components/ui/agent-bridge";
import { siteName, siteMetadata } from "@/lib/social-metadata";
import { initializeTheme } from "@/lib/theme";
import Link from "next/link";
import "./globals.css";
import "./design-tokens.css";
import "./components.css";
import "./site.css";
import "./reading-desk.css";
export const viewport: Viewport = {
  viewportFit: "cover",
};
export const metadata: Metadata = {
  ...siteMetadata(),
  title: {
    default: `${siteName} — разумите своја права`,
    template: `%s | ${siteName}`,
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
    <html lang="sr" suppressHydrationWarning>
      <head>
        <script
          id="site-theme-init"
          dangerouslySetInnerHTML={{ __html: initializeTheme }}
        />
      </head>
      <body>
        {process.env.NODE_ENV === "development" && <UIAgentBridge />}
        <a className="skip-link" href="#main">
          Пређи на садржај
        </a>
        <div id="page-top" aria-hidden="true" />
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <span>© 2026 Право на длану</span>
          <span>Право које разумете. Знање које делите.</span>
          <Link href="/o-projektu">О збирци и изворима ↗</Link>
        </footer>
        <div id="site-top-control">
          <BackToTop />
        </div>
        <MobileNavigation />
        {process.env.VERCEL === "1" && <SiteAnalytics />}
      </body>
    </html>
  );
}
