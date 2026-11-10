// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { isDark, readThemeMode, THEME_KEY, writeThemeMode } from "./theme";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// the localStorage getter itself throws when the browser blocks storage
const blockStorage = () =>
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });

describe("theme mode", () => {
  it("resolves System from the media query", () => {
    expect(isDark("system", true)).toBe(true);
    expect(isDark("system", false)).toBe(false);
    expect(isDark("dark", false)).toBe(true);
    expect(isDark("light", true)).toBe(false);
  });

  it("round-trips the saved mode", () => {
    writeThemeMode("dark");
    expect(readThemeMode()).toBe("dark");
  });

  it("falls back to System on a missing or invalid value", () => {
    expect(readThemeMode()).toBe("system");
    localStorage.setItem(THEME_KEY, "purple");
    expect(readThemeMode()).toBe("system");
  });

  it("falls back to System and does not throw when storage is blocked", () => {
    blockStorage();
    expect(readThemeMode()).toBe("system");
    expect(() => writeThemeMode("dark")).not.toThrow();
  });

  it("loads the module with storage blocked", async () => {
    vi.resetModules();
    blockStorage();
    const theme = await import("./theme");
    const { mode, setMode } = theme.useThemeMode();
    expect(mode.value).toBe("system");
    setMode("dark");
    expect(mode.value).toBe("dark");
  });
});
