/** Public contracts owned by the intelligence domain. */

export type MestreArcanoExecution = {
  readonly output: string;
  readonly responseId: string | null;
  readonly model: string;
};

export type MestreArcanoGateway = {
  execute(input: string): Promise<MestreArcanoExecution>;
};
