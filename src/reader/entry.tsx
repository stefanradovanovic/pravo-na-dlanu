import { hydrateRoot } from "react-dom/client";
import { ReaderControl, type ReaderControlProps } from "./controls";
import { BackToTop } from "@/components/back-to-top";

const topControl = document.getElementById("site-top-control");
if (topControl) hydrateRoot(topControl, <BackToTop />);

for (const container of document.querySelectorAll<HTMLElement>(
  "[data-reader-control]",
)) {
  const data = document.getElementById(`${container.id}-props`);
  if (!data?.textContent) throw new Error("Missing reader control data");
  const props: ReaderControlProps = JSON.parse(data.textContent);
  hydrateRoot(container, <ReaderControl {...props} />, {
    identifierPrefix: container.id,
  });
}

// PDF.js is loaded only for the documents which actually contain facsimiles.
const scan = document.querySelector<HTMLElement>("[data-reader-scan]");
if (scan) {
  const data = document.getElementById(`${scan.id}-props`);
  if (!data?.textContent) throw new Error("Missing facsimile data");
  const props = JSON.parse(data.textContent);
  void import("@/components/facsimile-reader").then(({ FacsimileReader }) => {
    hydrateRoot(scan, <FacsimileReader {...props} />, {
      identifierPrefix: scan.id,
    });
  });
}
