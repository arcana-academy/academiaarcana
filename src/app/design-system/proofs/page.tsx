import { ProofShowcase } from "./ProofShowcase";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/design-system/proofs");

export default function ProofSurfacesPage() {
  return <ProofShowcase />;
}
