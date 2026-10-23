import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/feedback");

/** The feedback route is a client component, so its metadata lives here. */
export default function FeedbackLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
