import type {
  MestreArcanoExecution,
  MestreArcanoGateway,
} from "@/domains/intelligence/contracts";

export async function executeMestreArcano(
  gateway: MestreArcanoGateway,
  input: string,
): Promise<MestreArcanoExecution> {
  const normalizedInput = input.trim();
  if (!normalizedInput) {
    throw new Error("Mestre Arcano requires a non-empty input.");
  }

  return gateway.execute(normalizedInput);
}
