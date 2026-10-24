import {
  openSourceAiIntegrations,
  type OpenSourceAiId,
} from "./open-source-ai";

export const MAX_OPEN_SOURCE_AI_REQUEST_BYTES = 256 * 1024;
export const MAX_OPEN_SOURCE_AI_MESSAGE_CHARACTERS = 12_000;
export const MAX_OPEN_SOURCE_AI_TOTAL_CHARACTERS = 40_000;
export const MAX_OPEN_SOURCE_AI_OUTPUT_TOKENS = 4_096;

export type ValidatedOpenSourceAiRequest = {
  readonly provider: OpenSourceAiId;
  readonly model: string;
  readonly messages: readonly {
    readonly role: "system" | "user" | "assistant";
    readonly content: string;
  }[];
  readonly temperature: number;
  readonly maxTokens: number;
};

/** Validates untrusted JSON without trusting compile-time TypeScript types. */
export function validateOpenSourceAiRequest(
  value: unknown,
): ValidatedOpenSourceAiRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  if (
    typeof body.provider !== "string" ||
    !openSourceAiIntegrations.some(({ id }) => id === body.provider) ||
    typeof body.model !== "string" ||
    !body.model.trim() ||
    body.model.length > 200 ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 20
  ) {
    return null;
  }

  let totalCharacters = 0;
  const messages: ValidatedOpenSourceAiRequest["messages"][number][] = [];

  for (const item of body.messages) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const message = item as Record<string, unknown>;
    if (
      (message.role !== "system" &&
        message.role !== "user" &&
        message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length > MAX_OPEN_SOURCE_AI_MESSAGE_CHARACTERS
    ) {
      return null;
    }

    totalCharacters += message.content.length;
    if (totalCharacters > MAX_OPEN_SOURCE_AI_TOTAL_CHARACTERS) return null;
    messages.push({ role: message.role, content: message.content });
  }

  const temperature = body.temperature ?? 0.2;
  if (
    typeof temperature !== "number" ||
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 2
  ) {
    return null;
  }

  const maxTokens = body.maxTokens ?? 1_200;
  if (
    typeof maxTokens !== "number" ||
    !Number.isInteger(maxTokens) ||
    maxTokens < 1 ||
    maxTokens > MAX_OPEN_SOURCE_AI_OUTPUT_TOKENS
  ) {
    return null;
  }

  return {
    provider: body.provider as OpenSourceAiId,
    model: body.model.trim(),
    messages,
    temperature,
    maxTokens,
  };
}

export type BoundedJsonResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly status: 400 | 413 };

/** Reads JSON with a hard stream limit; Content-Length alone is not trusted. */
export async function readBoundedJsonRequest(
  request: Request,
  maxBytes = MAX_OPEN_SOURCE_AI_REQUEST_BYTES,
): Promise<BoundedJsonResult> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413 };
  }
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
