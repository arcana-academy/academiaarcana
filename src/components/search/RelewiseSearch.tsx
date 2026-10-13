"use client";

import { FormEvent, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

type SearchResult = {
  productId?: string;
  displayName?: string | null;
};

type RelewiseResponse = {
  results?: SearchResult[];
};

export function RelewiseSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTerm, setSubmittedTerm] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const pendingController = useRef<AbortController | null>(null);

  function onTermChange(value: string) {
    requestVersion.current += 1;
    pendingController.current?.abort();
    pendingController.current = null;
    setTerm(value);
    setResults([]);
    setSubmittedTerm(null);
    setError(null);
    setLoading(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();

    if (!query) {
      setResults([]);
      setSubmittedTerm(null);
      setError("Digite algo para pesquisar.");
      return;
    }

    const currentRequest = ++requestVersion.current;
    pendingController.current?.abort();
    const controller = new AbortController();
    pendingController.current = controller;
    setLoading(true);
    setResults([]);
    setSubmittedTerm(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/relewise?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      const data = (await response.json()) as
        | RelewiseResponse
        | { error?: string };

      if (currentRequest !== requestVersion.current) return;

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Falha na busca.",
        );
      }

      setResults("results" in data ? data.results ?? [] : []);
      setSubmittedTerm(query);
    } catch (searchError) {
      if (currentRequest !== requestVersion.current || controller.signal.aborted) return;
      setResults([]);
      setError(
        searchError instanceof Error ? searchError.message : "Falha na busca.",
      );
    } finally {
      if (currentRequest === requestVersion.current) {
        pendingController.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <section
      aria-labelledby="relewise-search-title"
      className="aa-card"
    >
      <p className="aa-eyebrow">Busca inteligente</p>
      <h2 id="relewise-search-title">Encontre o que você procura</h2>

      <form onSubmit={onSubmit} role="search" className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="relewise-search">
          Pesquisar
        </label>
        <input
          id="relewise-search"
          className="aa-input"
          value={term}
          onChange={(event) => onTermChange(event.target.value)}
          placeholder="Pesquisar..."
          autoComplete="off"
        />
        <button
          className="aa-button aa-button-primary"
          type="submit"
          disabled={loading}
          aria-label="Pesquisar"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Search aria-hidden="true" />
          )}
        </button>
      </form>

      {error ? (
        <p className="aa-field-error mt-2" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && submittedTerm !== null && results.length === 0 ? (
        <p className="mt-4" role="status">
          Nenhum resultado encontrado.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-label="Resultados da busca">
          {results.map((result, index) => (
            <li
              key={result.productId ?? `result-${index}`}
              className="aa-card"
            >
              {result.displayName ?? result.productId ?? "Resultado"}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
