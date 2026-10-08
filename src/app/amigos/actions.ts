"use server";

import { revalidatePath } from "next/cache";

import { SupabaseSocialRepository } from "@/infrastructure/supabase/social/social-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function connectionIdField(formData: FormData): string {
  const value = formData.get("connectionId");

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A conexão social é obrigatória.");
  }

  return value.trim();
}

async function socialRepositoryForAuthenticatedUser() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  return {
    participantId: claims.sub,
    repository: new SupabaseSocialRepository(supabase),
  };
}

export async function acceptFriendRequestAction(formData: FormData) {
  const connectionId = connectionIdField(formData);
  const { participantId, repository } =
    await socialRepositoryForAuthenticatedUser();

  await repository.updateConnectionStatus(
    participantId,
    connectionId,
    "accepted",
  );
  revalidatePath("/amigos");
}

export async function declineFriendRequestAction(formData: FormData) {
  const connectionId = connectionIdField(formData);
  const { participantId, repository } =
    await socialRepositoryForAuthenticatedUser();

  await repository.deleteConnection(participantId, connectionId);
  revalidatePath("/amigos");
}

export async function cancelFriendRequestAction(formData: FormData) {
  const connectionId = connectionIdField(formData);
  const { participantId, repository } =
    await socialRepositoryForAuthenticatedUser();

  await repository.deleteConnection(participantId, connectionId);
  revalidatePath("/amigos");
}

export async function removeFriendConnectionAction(formData: FormData) {
  const connectionId = connectionIdField(formData);
  const { participantId, repository } =
    await socialRepositoryForAuthenticatedUser();

  await repository.deleteConnection(participantId, connectionId);
  revalidatePath("/amigos");
}
