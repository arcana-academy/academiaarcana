import { FocusPilotHarness } from "./FocusPilotHarness";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/design-system/pilots/focus");

export default function FocusPilotPage() {
  return <FocusPilotHarness />;
}
