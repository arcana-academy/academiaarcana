import { NextResponse } from "next/server";
import { ProductSearchBuilder } from "@relewise/client";

import { getAuthenticatedUserClaims } from "@/lib/auth/get-authenticated-user-claims";
import {
  createRelewiseSearcher,
  createRelewiseSearchUser,
} from "@/lib/relewise/server";

const MAX_TERM_LENGTH = 120;
const MAX_PAGE_SIZE = 30;
const MAX_LANGUAGE_LENGTH = 20;
const MAX_CURRENCY_LENGTH = 10;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const term = url.searchParams.get("q")?.trim() ?? "";
  const language = url.searchParams.get("language")?.trim() || "pt-BR";
  const currency = url.searchParams.get("currency")?.trim() || "BRL";
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const rawPageSize = Number.parseInt(
    url.searchParams.get("pageSize") ?? "20",
    10,
  );

  if (!term) {
    return NextResponse.json(
      { error: "Informe um termo de busca." },
      { status: 400 },
    );
  }

  if (term.length > MAX_TERM_LENGTH) {
    return NextResponse.json(
      {
        error: `O termo de busca deve ter no máximo ${MAX_TERM_LENGTH} caracteres.`,
      },
      { status: 400 },
    );
  }

  if (
    language.length > MAX_LANGUAGE_LENGTH ||
    currency.length > MAX_CURRENCY_LENGTH
  ) {
    return NextResponse.json(
      { error: "Os parâmetros de idioma ou moeda são inválidos." },
      { status: 400 },
    );
  }

  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))
    : 20;

  const claims = await getAuthenticatedUserClaims();

  if (!claims?.sub) {
    return NextResponse.json(
      { error: "Autenticação necessária." },
      { status: 401 },
    );
  }

  try {
    const searcher = createRelewiseSearcher();
    const requestBuilder = new ProductSearchBuilder({
      language,
      currency,
      displayedAtLocation: "Academia Arcana Search",
      user: createRelewiseSearchUser(claims.sub),
    })
      .setTerm(term)
      .setSelectedProductProperties({
        displayName: true,
        brand: true,
        pricing: true,
      })
      .pagination((pagination) => {
        pagination.setPage(page);
        pagination.setPageSize(pageSize);
      });

    const response = await searcher.searchProducts(requestBuilder.build());

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Relewise product search failed", error);

    return NextResponse.json(
      { error: "Não foi possível realizar a busca agora." },
      { status: 502 },
    );
  }
}
