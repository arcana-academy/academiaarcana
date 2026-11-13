import { notFound } from "next/navigation";
import { MvpPilot } from "./MvpPilot";

/** Public builds cannot expose the synthetic demo as a substitute for authenticated routes. */
export default function MvpPilotPage() {
  const isolated = process.env.ARCANA_DEMO_ISOLATED === "1";
  if (process.env.NODE_ENV !== "development" && !isolated) notFound();
  return <MvpPilot isolated={isolated} />;
}