"use client";

import { ArticleNavigation } from "@/components/article-navigation";
import { DocumentActions } from "@/components/document-actions";
import { ReaderBackLink } from "@/components/reader-back-link";
import { LawExamples, type LawExamplesProps } from "@/components/law-examples";
import type { ArticleHeading } from "@/lib/document-navigation";

export type ReaderControlProps =
  | { kind: "navigation"; headings: ArticleHeading[] }
  | { kind: "actions"; printable: boolean }
  | { kind: "back" }
  | ({ kind: "examples" } & LawExamplesProps);

/** Only reader controls are hydrated; the legal text never enters this tree. */
export function ReaderControl(props: ReaderControlProps) {
  switch (props.kind) {
    case "navigation":
      return <ArticleNavigation headings={props.headings} />;
    case "actions":
      return <DocumentActions printable={props.printable} />;
    case "back":
      return <ReaderBackLink />;
    case "examples":
      return <LawExamples {...props} />;
  }
}
