import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("external_document_sources")
    .select(
      "id, provider_id, source_type, name, mime_type, web_url, last_modified_at, size_bytes, site_id, drive_id, item_id, status, created_at, updated_at",
    )
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "external_sources_unavailable" }, { status: 502 });
  }

  return NextResponse.json({ sources: data ?? [] });
}
