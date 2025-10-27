import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";

type Props = {
  document: Document | null | undefined;
};

export default function RichTextRenderer({ document }: Props) {
  if (!document) {
    return null;
  }

  return <div>{documentToReactComponents(document)}</div>;
}
