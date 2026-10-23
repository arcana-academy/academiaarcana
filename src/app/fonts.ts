import { Cormorant_Upright, Grenze, Literata, Smythe } from "next/font/google";

/**
 * Brand Book 360° — fontes Google Fonts com licença SIL OFL 1.1.
 * Arquivos servidos pelo próprio Next.js após download no build.
 * Não substituir nem reconstruir o lettering institucional canônico.
 */
export const arcanaGrenze = Grenze({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arcana-grenze",
});
export const arcanaLiterata = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arcana-literata",
});
export const arcanaCormorant = Cormorant_Upright({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-arcana-cormorant",
  preload: false,
});
export const arcanaSmythe = Smythe({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-arcana-smythe",
  preload: false,
});
