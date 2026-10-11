/** Browser-only synchronous guard; this is NOT server-side idempotency. */
export function createFeedbackSubmitGate() {
  let pending = false;
  return {
    enter(): boolean {
      if (pending) return false;
      pending = true;
      return true;
    },
    leave(): void {
      pending = false;
    },
    isPending(): boolean {
      return pending;
    },
  };
}
