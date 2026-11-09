import { ref, watchEffect } from "vue";

// Keep in sync with the inline script in index.html: same key, values and `.dark` class.
export const THEME_KEY = "theme";
export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const DARK_QUERY = "(prefers-color-scheme: dark)";

// Touch window.localStorage only inside try: the getter itself throws when storage is blocked.
export function readThemeMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return THEME_MODES.find((mode) => mode === saved) ?? "system";
  } catch {
    return "system";
  }
}

export function writeThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // storage blocked (private mode): the choice lasts until reload
  }
}

export function isDark(mode: ThemeMode, systemDark: boolean) {
  return mode === "dark" || (mode === "system" && systemDark);
}

const media = window.matchMedia(DARK_QUERY);
const mode = ref<ThemeMode>(readThemeMode());
const systemDark = ref(media.matches);
media.addEventListener("change", (event) => (systemDark.value = event.matches));

watchEffect(() => {
  const dark = isDark(mode.value, systemDark.value);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
});

export function useThemeMode() {
  function setMode(next: ThemeMode) {
    mode.value = next;
    writeThemeMode(next);
  }
  return { mode, setMode };
}
