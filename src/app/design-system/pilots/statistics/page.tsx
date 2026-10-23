import { StatisticsPilotHarness } from "./StatisticsPilotHarness";
import type { StatisticsPilotScenario } from "./statistics-pilot-fixtures";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/design-system/pilots/statistics");

function scenarioFrom(value: string | string[] | undefined): StatisticsPilotScenario {
  return value === "mixed-evidence" ||
    value === "objective-confirmed" ||
    value === "review-gap" ||
    value === "low-confidence"
    ? value
    : "no-data";
}

export default async function StatisticsPilotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <StatisticsPilotHarness initialScenario={scenarioFrom(params.scenario)} />;
}
