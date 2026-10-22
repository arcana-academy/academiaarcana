import { describe, expect, it } from "vitest";
import { isAppearanceMode, resolveAppearanceTheme } from "./appearance-policy";

describe("Academia Arcana — aparência aprovada", () => {
  it("segue o tema claro ou escuro do dispositivo no modo automático", () => {
    expect(resolveAppearanceTheme("system", true)).toBe("arcana-pergaminho");
    expect(resolveAppearanceTheme("system", false)).toBe("arcana-noturna");
  });

  it("respeita a escolha explícita independentemente do dispositivo", () => {
    expect(resolveAppearanceTheme("dark", true)).toBe("arcana-noturna");
    expect(resolveAppearanceTheme("light", false)).toBe("arcana-pergaminho");
  });

  it("descarta valores desconhecidos do armazenamento", () => {
    expect(isAppearanceMode("system")).toBe(true);
    expect(isAppearanceMode("light")).toBe(true);
    expect(isAppearanceMode("__proto__")).toBe(false);
  });
});
