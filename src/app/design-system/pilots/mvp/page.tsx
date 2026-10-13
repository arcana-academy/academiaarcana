import { notFound } from "next/navigation";
import { MvpPilot } from "./MvpPilot";

/** Public builds cannot expose the synthetic demo as a substitute for authenticated routes. */
export default function MvpPilotPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <MvpPilot />;
}