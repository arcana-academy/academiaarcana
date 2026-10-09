import Image from "next/image";

export const FLONTS_APPROVED_MINI_SRC =
  "/assets/flonts/flonts-mago-mini-96.webp" as const;

/**
 * Reuses one approved illustration without redrawing, tinting or stretching.
 * The master and other responsive derivatives remain governed by AA-ASSET-013.
 */
export function FlontsPortrait({ decorative = true }: { decorative?: boolean }) {
  return (
    <Image
      src={FLONTS_APPROVED_MINI_SRC}
      unoptimized
      alt={decorative ? "" : "Flonts, gato mago da Academia Arcana"}
      width={48}
      height={60}
      style={{
        width: 48,
        height: 60,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
