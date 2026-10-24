import type { Metadata } from "next";
import { ArcanaExperience } from "./ArcanaExperience";

export const metadata: Metadata = {
  title: "Experimente a Academia Arcana",
  description: "Uma prévia interativa com missões, progresso e foco — sem conta e sem dados de produção.",
  robots: { index: false, follow: false },
};

export default function ExperienciaPage() {
  return <ArcanaExperience />;
}
