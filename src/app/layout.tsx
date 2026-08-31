import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia Arcana",
  description: "Uma academia de aprendizagem adaptativa, acessível e segura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
