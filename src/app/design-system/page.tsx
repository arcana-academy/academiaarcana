import { ThemeShowcase } from "./ThemeShowcase";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/design-system");

export default function DesignSystemPage() {
  return <ThemeShowcase />;
}
