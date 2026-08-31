import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/design-system/themes";

export const metadata: Metadata = {
  title: "Academia Arcana",
  description: "Uma academia de aprendizagem adaptativa, acessível e segura.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider initialTheme="mago-classico">{children}</ThemeProvider>
      </body>
    </html>
  );
}
