"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { getVersionDiff } from "@/domains/learning/sync";
import type { DocumentVersion } from "@/domains/learning/sync";
import styles from "./sync.module.css";

export function VersionHistory({ versions, onRestore }: { versions: readonly DocumentVersion[]; onRestore?: (version: DocumentVersion) => void }) {
  const [selectedId, setSelectedId] = useState(versions[0]?.id);
  const selected = versions.find((version) => version.id === selectedId);
  const previous = useMemo(() => selected ? versions.find((version) => version.version === selected.version - 1) : undefined, [selected, versions]);
  const diff = selected && previous ? getVersionDiff(previous.content, selected.content) : undefined;

  if (versions.length === 0) return <Card variant="inset"><strong>Nenhuma versão registrada.</strong><p>As próximas alterações desta página aparecerão aqui.</p></Card>;

  return (
    <section aria-labelledby="version-history-title">
      <Card>
        <div className={styles.header}><div><span className="aa-eyebrow">Recuperação</span><h2 id="version-history-title">Histórico de versões</h2><p>Veja alterações anteriores e restaure uma versão sem apagar o histórico.</p></div></div>
        <div className={styles.layout}>
          <ol aria-label="Versões disponíveis" className={styles.list}>
            {versions.slice().sort((a, b) => b.version - a.version).map((version) => <li key={version.id}><button type="button" className={`${styles.item} ${selectedId === version.id ? styles.isSelected : ""}`} aria-pressed={selectedId === version.id} onClick={() => setSelectedId(version.id)}><strong>Versão {version.version}</strong><span>{new Date(version.createdAt).toLocaleString("pt-BR")}</span><small>{version.changeSummary ?? "Alteração salva"}</small></button></li>)}
          </ol>
          <div className={styles.preview} aria-live="polite">
            {selected ? <><div className={styles.metrics}><span>{diff ? `${diff.added} linhas adicionadas` : "Versão inicial"}</span><span>{diff ? `${diff.removed} linhas removidas` : "Sem comparação anterior"}</span></div><pre><code>{selected.content}</code></pre>{onRestore ? <button type="button" className="aa-button aa-button-secondary" onClick={() => onRestore(selected)}>Restaurar esta versão</button> : null}</> : <p>Selecione uma versão para visualizar.</p>}
          </div>
        </div>
      </Card>
    </section>
  );
}
