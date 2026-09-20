"use client";

import { useEffect, useState } from "react";

type WorkspaceTitleEditorProps = {
  title: string;
  itemLabel: string;
  onSave: (title: string) => Promise<void>;
};

/** Edit one selected Workspace hierarchy title with explicit save feedback. */
export function WorkspaceTitleEditor({
  title,
  itemLabel,
  onSave,
}: WorkspaceTitleEditorProps) {
  const [value, setValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  const handleSave = async () => {
    if (!value.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(value);
      setValue(value.trim());
    } catch {
      setError(`Não foi possível renomear o ${itemLabel}.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      aria-label={`Renomear ${itemLabel}`}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <label htmlFor="workspace-title-editor">Título</label>
      <input
        id="workspace-title-editor"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={isSaving}
        placeholder={`Título do ${itemLabel}`}
      />
      <button
        type="submit"
        disabled={isSaving || !value.trim()}
      >
        {isSaving ? "Salvando…" : "Salvar título"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
