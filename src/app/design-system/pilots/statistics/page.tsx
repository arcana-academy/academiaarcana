import { StatisticsPilotHarness } from "./StatisticsPilotHarness";
import type { StatisticsPilotScenario } from "./statistics-pilot-fixtures";

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
