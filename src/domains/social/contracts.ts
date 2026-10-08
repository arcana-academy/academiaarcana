/**
 * Public contracts for the social domain.
 *
 * Social owns relationship state and exposes privacy-preserving read models
 * without leaking infrastructure details into application code.
 */

export type FriendConnectionStatus = "pending" | "accepted" | "blocked";

export type FriendConnection = {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

export interface SocialRepository {
  listConnections(participantId: string): Promise<FriendConnection[]>;
  updateConnectionStatus(
    recipientId: string,
    connectionId: string,
    status: Exclude<FriendConnectionStatus, "pending">,
  ): Promise<void>;
  deleteConnection(
    participantId: string,
    connectionId: string,
  ): Promise<void>;
}
