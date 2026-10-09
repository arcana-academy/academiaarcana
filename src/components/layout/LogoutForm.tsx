"use client";

import { useActionState } from "react";

import { finishLocalLogout, signOut } from "@/lib/auth/actions";
import {
  INITIAL_LOGOUT_STATE,
  type LogoutStatus,
} from "@/lib/auth/logout-state";

const errorMessages: Record<Exclude<LogoutStatus, "idle">, string> = {
  revocation_failed:
    "Não foi possível confirmar a saída de todos os dispositivos. Você pode tentar novamente.",
  outcome_unknown:
    "Não foi possível confirmar se todas as sessões foram encerradas. Você pode tentar novamente.",
  reauth_required:
    "Sua sessão não permite confirmar a saída de todos os dispositivos. Entre novamente para verificar a situação.",
  cleanup_incomplete:
    "A saída não foi concluída neste dispositivo. Você pode finalizar a limpeza local.",
  unexpected_error:
    "Não foi possível concluir a solicitação. Tente novamente.",
};

export function LogoutForm() {
  const [state, action, pending] = useActionState(
    signOut,
    INITIAL_LOGOUT_STATE,
  );
  const [localState, localAction, localPending] = useActionState(
    finishLocalLogout,
    INITIAL_LOGOUT_STATE,
  );
  const busy = pending || localPending;
  const message =
    localState.status !== "idle"
      ? errorMessages[localState.status]
      : state.status !== "idle"
        ? errorMessages[state.status]
        : null;

  return (
    <div className="aa-logout-controls">
      <form action={action}>
        <button
          className="aa-button aa-button-ghost aa-button-sm"
          type="submit"
          disabled={busy}
        >
          {pending ? "Saindo..." : "Sair"}
        </button>
      </form>
      {message && <p role="alert">{message}</p>}
      {state.status !== "idle" && (
        <form action={localAction}>
          <p>
            Se preferir, encerre somente a sessão deste dispositivo.
            Isso não confirma a saída dos outros dispositivos.
          </p>
          <button
            className="aa-button aa-button-ghost aa-button-sm"
            type="submit"
            disabled={busy}
          >
            {localPending ? "Finalizando..." : "Sair somente deste dispositivo"}
          </button>
        </form>
      )}
    </div>
  );
}
