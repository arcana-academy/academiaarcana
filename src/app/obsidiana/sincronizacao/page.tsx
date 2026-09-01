import { SyncCenter } from "@/components/learning/SyncCenter";

export default function SyncSettingsPage() {
  return (
    <main className="aa-page-shell">
      <header className="aa-page-heading">
        <span className="aa-eyebrow">Obsidiana</span>
        <h1>Continuidade entre dispositivos</h1>
        <p>Configurações para trabalho offline, sincronização seletiva e preferências por dispositivo.</p>
      </header>
      <SyncCenter deviceId="web-current-device" />
    </main>
  );
}
