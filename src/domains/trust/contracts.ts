/**
 * Contracts for user feedback submission and ownership.
 */
export type FeedbackInput = {
  name: string | null;
  email: string;
  feedback: string;
};

export type FeedbackRecord = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  feedback: string;
  createdAt: string;
};