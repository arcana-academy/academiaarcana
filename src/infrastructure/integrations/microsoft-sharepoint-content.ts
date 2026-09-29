import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMicrosoftSharePointSiteItemMetadata,
  type MicrosoftSharePointCredentials,
  MICROSOFT_GRAPH_API_BASE_URL,
  MICROSOFT_SHAREPOINT_PROVIDER_ID,
} from "./microsoft-sharepoint";

export const MAX_SHAREPOINT_DOWNLOAD_BYTES = 1024 * 1024;
export const MAX_SHAREPOINT_CONTEXT_CHARACTERS = 50_000;

const SUPPORTED_TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/tab-separated-values",
  "text/xml",
]);

const SUPPORTED_TEXT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".markdown",
  ".md",
  ".tsv",
  ".txt",
  ".xml",
]);

export type SharePointExternalDocumentSource = {
  readonly id: string;
  readonly providerId: string;
  readonly sourceType: "external_document";
  readonly siteId: string;
  readonly driveId: string;
  readonly itemId: string;
  readonly name: string | null;
  readonly mimeType: string | null;
  readonly webUrl: string | null;
  readonly lastModifiedAt: string | null;
  readonly sizeBytes: number | null;
  readonly status: "active" | "stale" | "revoked";
};

export type MicrosoftSharePointDocumentContext = {
  readonly source: {
    readonly id: string;
    readonly providerId: typeof MICROSOFT_SHAREPOINT_PROVIDER_ID;
    readonly siteId: string;
    readonly driveId: string;
    readonly itemId: string;
    readonly name: string | null;
    readonly mimeType: string | null;
    readonly webUrl: string | null;
    readonly lastModifiedAt: string | null;
    readonly sizeBytes: number | null;
  };
  readonly content: string;
  readonly truncated: boolean;
  readonly currentDocument: {
    readonly name: string | null;
    readonly mimeType: string | null;
    readonly sizeBytes: number | null;
    readonly lastModifiedAt: string | null;
    readonly webUrl: string | null;
  };
};

type SharePointDocumentContextDependencies = {
  readonly supabase: SupabaseClient;
  readonly ownerId: string;
  readonly credentials: MicrosoftSharePointCredentials;
  readonly fetchImpl?: typeof fetch;
};

function getExtension(name: string | null): string {
  if (!name) return "";
  const normalized = name.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  return lastDot >= 0 ? normalized.slice(lastDot) : "";
}

export function isSupportedMicrosoftSharePointTextDocument(
  name: string | null,
  mimeType: string | null,
): boolean {
  const normalizedMimeType = mimeType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (SUPPORTED_TEXT_MIME_TYPES.has(normalizedMimeType)) return true;
  return SUPPORTED_TEXT_EXTENSIONS.has(getExtension(name));
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function readResponseBytesWithinLimit(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("microsoft_sharepoint_document_too_large");
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxBytes) {
      throw new Error("microsoft_sharepoint_document_too_large");
    }
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;

      total += result.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("microsoft_sharepoint_document_too_large");
      }

      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/, "");
  } catch {
    throw new Error("microsoft_sharepoint_document_encoding_unsupported");
  }
}

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replaceAll("\u0000", "");
}

async function downloadMicrosoftSharePointSiteItemContent(
  source: Pick<
    SharePointExternalDocumentSource,
    "siteId" | "driveId" | "itemId"
  >,
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<Uint8Array> {
  const url =
    `${MICROSOFT_GRAPH_API_BASE_URL}/drives/${encodeURIComponent(
      source.driveId,
    )}/items/${encodeURIComponent(source.itemId)}/content`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "*/*",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("microsoft_sharepoint_document_unavailable");
  }

  if (!response.ok) {
    throw new Error("microsoft_sharepoint_document_unavailable");
  }

  return readResponseBytesWithinLimit(response, MAX_SHAREPOINT_DOWNLOAD_BYTES);
}

async function loadOwnedSource(
  dependencies: SharePointDocumentContextDependencies,
  sourceId: string,
): Promise<SharePointExternalDocumentSource> {
  const normalizedSourceId = sourceId.trim();
  if (!normalizedSourceId) {
    throw new Error("microsoft_sharepoint_source_id_required");
  }

  const { data, error } = await dependencies.supabase
    .from("external_document_sources")
    .select(
      "id, provider_id, source_type, site_id, drive_id, item_id, name, mime_type, web_url, last_modified_at, size_bytes, status",
    )
    .eq("id", normalizedSourceId)
    .eq("owner_id", dependencies.ownerId)
    .eq("provider_id", MICROSOFT_SHAREPOINT_PROVIDER_ID)
    .eq("source_type", "external_document")
    .maybeSingle();

  if (error) {
    throw new Error("microsoft_sharepoint_source_lookup_failed");
  }

  if (!data) {
    throw new Error("microsoft_sharepoint_source_not_found");
  }

  if (data.status !== "active") {
    throw new Error(
      data.status === "revoked"
        ? "microsoft_sharepoint_source_revoked"
        : "microsoft_sharepoint_source_stale",
    );
  }

  return {
    id: String(data.id),
    providerId: String(data.provider_id),
    sourceType: "external_document",
    siteId: String(data.site_id),
    driveId: String(data.drive_id),
    itemId: String(data.item_id),
    name: asNullableString(data.name),
    mimeType: asNullableString(data.mime_type),
    webUrl: asNullableString(data.web_url),
    lastModifiedAt: asNullableString(data.last_modified_at),
    sizeBytes: asNullableNumber(data.size_bytes),
    status: data.status as SharePointExternalDocumentSource["status"],
  };
}

export async function getMicrosoftSharePointDocumentContext(
  sourceId: string,
  dependencies: SharePointDocumentContextDependencies,
): Promise<MicrosoftSharePointDocumentContext> {
  if (dependencies.credentials.subjectId !== dependencies.ownerId) {
    throw new Error("microsoft_sharepoint_not_connected");
  }

  const source = await loadOwnedSource(dependencies, sourceId);

  const currentMetadata = await getMicrosoftSharePointSiteItemMetadata(
    source.siteId,
    source.driveId,
    source.itemId,
    dependencies.credentials.accessToken,
  );

  const output =
    currentMetadata.output &&
    typeof currentMetadata.output === "object"
      ? (currentMetadata.output as Record<string, unknown>)
      : null;

  const file =
    output?.file && typeof output.file === "object"
      ? (output.file as Record<string, unknown>)
      : null;

  const currentName = asNullableString(output?.name);
  const currentMimeType = asNullableString(file?.mimeType);
  const currentSizeBytes = asNullableNumber(output?.size);
  const currentLastModifiedAt = asNullableString(
    output?.lastModifiedDateTime,
  );
  const currentWebUrl = asNullableString(output?.webUrl);

  if (!file) {
    throw new Error("microsoft_sharepoint_source_is_not_file");
  }

  if (
    !isSupportedMicrosoftSharePointTextDocument(
      currentName ?? source.name,
      currentMimeType ?? source.mimeType,
    )
  ) {
    throw new Error("microsoft_sharepoint_document_type_unsupported");
  }

  if (
    currentSizeBytes !== null &&
    currentSizeBytes > MAX_SHAREPOINT_DOWNLOAD_BYTES
  ) {
    throw new Error("microsoft_sharepoint_document_too_large");
  }

  const bytes = await downloadMicrosoftSharePointSiteItemContent(
    source,
    dependencies.credentials.accessToken,
    dependencies.fetchImpl ?? fetch,
  );

  const normalized = normalizeText(decodeUtf8(bytes));
  const truncated = normalized.length > MAX_SHAREPOINT_CONTEXT_CHARACTERS;

  return {
    source: {
      id: source.id,
      providerId: MICROSOFT_SHAREPOINT_PROVIDER_ID,
      siteId: source.siteId,
      driveId: source.driveId,
      itemId: source.itemId,
      name: source.name,
      mimeType: source.mimeType,
      webUrl: source.webUrl,
      lastModifiedAt: source.lastModifiedAt,
      sizeBytes: source.sizeBytes,
    },
    content: truncated
      ? normalized.slice(0, MAX_SHAREPOINT_CONTEXT_CHARACTERS)
      : normalized,
    truncated,
    currentDocument: {
      name: currentName,
      mimeType: currentMimeType,
      sizeBytes: currentSizeBytes,
      lastModifiedAt: currentLastModifiedAt,
      webUrl: currentWebUrl,
    },
  };
}
