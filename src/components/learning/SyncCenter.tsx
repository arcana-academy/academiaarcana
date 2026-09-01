"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DEFAULT_SYNC_SETTINGS, isSyncEnabledForKind } from "@/domains/learning/sync";
import type { SyncFileKind, SyncSettings } from "@/domains/learning/sync";
import styles from "./sync.module.css";

const FILE_LABELS: Record<SyncFileKind, string> = { note: "Notas", image: "Imagens", audio: "Áudios", video: "Vídeos", pdf: "PDFs" };
const SETTING_KEYS: Record<SyncFileKind, keyof SyncSettings> = { note: "syncNotes", image: "syncImages", audio: "syncAudio", video: "syncVideo", pdf: "syncPdf" };

export function SyncCenter({ deviceId }: { deviceId: string }) {
  const [settings, setSettings] = useState<SyncSettings>({ ...DEFAULT_SYNC_SETTINGS, deviceId });
  const [saved, setSaved] = useState(false);
  const syncKinds = useMemo(() => (Object.keys(FILE_LABELS) as SyncFileKind[]).map((kind) => ({ kind, enabled: isSyncEnabledForKind(settings, kind) })), [settings]);
  function update(patch: Partial<SyncSettings>) { setSaved(false); setSettings((current) => ({ ...current, ...patch })); }
  function save() { localStorage.setItem("arcana.sync.settings", JSON.stringify(settings)); setSaved(true); }

  return (
    <section aria-labelledby="sync-center-title">
      <Card className={styles.syncCard}>
        <div className={styles.header}>
          <div><span className="aa-eyebrow">Dados e continuidade</span><h2 id="sync-center-title">Sincronização</h2><p>Continue estudando offline e defina exatamente quais dados devem ser sincronizados.</p></div>
          <span className="aa-badge aa-badge-info">Offline-first</span>
        </div>
        <div className={styles.section}><label className={styles.toggle}><input type="checkbox" checked={settings.enabled} onChange={(event) => update({ enabled: event.target.checked })} /><span><strong>Sincronização ativa</strong><small>Alterações locais ficam na fila quando não houver conexão.</small></span></label></div>
        <fieldset className={styles.section}><legend>Arquivos sincronizados</legend>{syncKinds.map(({ kind }) => { const key = SETTING_KEYS[kind]; return <label key={kind} className={styles.toggle}><input type="checkbox" checked={Boolean(settings[key])} disabled={kind === "note"} onChange={(event) => update({ [key]: event.target.checked } as Partial<SyncSettings>)} /><span><strong>{FILE_LABELS[kind]}</strong><small>{kind === "note" ? "Conteúdo principal de aprendizagem." : "Opcional para reduzir transferência de dados."}</small></span></label>; })}</fieldset>
        <fieldset className={styles.section}><legend>Preferências do dispositivo</legend><label className={styles.toggle}><input type="checkbox" checked={settings.syncEditorPreferences} onChange={(event) => update({ syncEditorPreferences: event.target.checked })} /><span><strong>Preferências do editor</strong><small>Sincronizar preferências de edição.</small></span></label><label className={styles.toggle}><input type="checkbox" checked={settings.syncShortcuts} onChange={(event) => update({ syncShortcuts: event.target.checked })} /><span><strong>Atalhos</strong><small>Sincronizar atalhos entre dispositivos.</small></span></label></fieldset>
        <div className={styles.footer}><p aria-live="polite">{saved ? "Configurações salvas neste dispositivo." : "As configurações ainda não foram salvas."}</p><button type="button" className="aa-button aa-button-primary" onClick={save}>Salvar configuração</button></div>
      </Card>
    </section>
  );
}
