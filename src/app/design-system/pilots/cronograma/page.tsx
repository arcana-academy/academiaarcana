import { CronogramaPilotHarness } from "./CronogramaPilotHarness";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/design-system/pilots/cronograma");

type Scenario = "default" | "empty" | "error" | "connected";

function scenarioFrom(value: string | string[] | undefined): Scenario {
  return value === "empty" || value === "error" || value === "connected" ? value : "default";
}

export default async function CronogramaPilotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <CronogramaPilotHarness scenario={scenarioFrom(params.scenario)} />;
}
