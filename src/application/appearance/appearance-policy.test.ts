import { describe, expect, it } from "vitest";
import { isAppearanceMode, isThemeId, resolveAppearanceTheme } from "./appearance-policy";

describe("Academia Arcana — aparência aprovada", () => {
  it("segue o tema claro ou escuro do dispositivo no modo automático", () => {
    expect(resolveAppearanceTheme("system", true)).toBe("arcana-pergaminho");
    expect(resolveAppearanceTheme("system", false)).toBe("arcana-noturna");
  });

  it("respeita a escolha explícita independentemente do dispositivo", () => {
    expect(resolveAppearanceTheme("dark", true)).toBe("arcana-noturna");
    expect(resolveAppearanceTheme("light", false)).toBe("arcana-pergaminho");
  });

  it("preserva temas avançados válidos sem perder o modo automático", () => {
    expect(isThemeId("escuro")).toBe(true);
    expect(isThemeId("__proto__")).toBe(false);
    expect(resolveAppearanceTheme("custom", true, "escuro")).toBe("escuro");
    expect(resolveAppearanceTheme("system", true, "escuro")).toBe("arcana-pergaminho");
  });

  it("descarta valores desconhecidos do armazenamento", () => {
    expect(isAppearanceMode("system")).toBe(true);
    expect(isAppearanceMode("light")).toBe(true);
    expect(isAppearanceMode("custom")).toBe(true);
    expect(isAppearanceMode("__proto__")).toBe(false);
  });
});
