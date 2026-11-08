import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type WebThemeContextValue = {
  mode: ThemeMode;
  toggle: () => void;
};

const STORAGE_KEY = "freshfriends-web-theme";
const alphaTokens = ["primary", "primary-container", "secondary", "error", "outline-variant", "on-primary-container", "on-surface-variant"];
const alphaValues = ["04", "18", "20", "30", "40", "45", "50", "55", "60", "70", "80"];
const WebThemeContext = createContext<WebThemeContextValue>({
  mode: "light",
  toggle: () => {},
});

const themes: Record<ThemeMode, Record<string, string>> = {
  light: {
    background: "#f7f8f4",
    surface: "#ffffff",
    "surface-container": "#f0f3ee",
    "surface-container-low": "#f5f7f3",
    "surface-container-high": "#e9eee9",
    "surface-container-highest": "#dfe7df",
    "surface-container-lowest": "#ffffff",
    primary: "#176343",
    "primary-container": "#dcefe2",
    "on-primary": "#ffffff",
    "on-primary-container": "#173b2b",
    secondary: "#876b12",
    "secondary-container": "#f6edce",
    "on-secondary": "#ffffff",
    "on-secondary-container": "#4c3b06",
    tertiary: "#ad5146",
    "tertiary-container": "#ffded8",
    "on-tertiary": "#ffffff",
    "on-tertiary-container": "#4a211b",
    "tertiary-fixed": "#ffdad7",
    "on-tertiary-fixed": "#410005",
    error: "#ba1a1a",
    "on-error": "#ffffff",
    "error-container": "#ffdad6",
    "on-error-container": "#93000a",
    "on-background": "#18241d",
    "on-surface": "#18241d",
    "surface-variant": "#e4e9e3",
    "on-surface-variant": "#4c5c51",
    outline: "#748478",
    "outline-variant": "#c4d0c5",
    "landing-background": "#f7f8f4",
    "landing-surface": "#ffffff",
    "landing-ink": "#142b21",
    "landing-muted": "#65766b",
    "landing-green": "#236446",
    "landing-green-dark": "#102e25",
    "landing-pale-green": "#e8f1e7",
    "landing-yellow": "#d9f36a",
    "landing-line": "#e3e9e2",
    "feature-one": "#e8f1e7",
    "feature-two": "#fff0df",
    "feature-three": "#faeae0",
    "feature-four": "#e9edfa",
    "produce-warm": "#fff0da",
    "produce-red": "#fce9e4",
    "status-good": "#e1f1df",
    "tip-background": "#fff7e2",
    "tip-text": "#78590e",
    "preview-muted": "#89958d",
    "how-background": "#edf0e6",
    "step-border": "#dde7d8",
    "step-connector": "#cbd8c6",
  },
  dark: {
    background: "#101a15",
    surface: "#17231c",
    "surface-container": "#1c2a22",
    "surface-container-low": "#141f19",
    "surface-container-high": "#24332a",
    "surface-container-highest": "#2d3d33",
    "surface-container-lowest": "#111b15",
    primary: "#8bd5a7",
    "primary-container": "#254d36",
    "on-primary": "#103722",
    "on-primary-container": "#c5f2d1",
    secondary: "#e9cf75",
    "secondary-container": "#514416",
    "on-secondary": "#3e3100",
    "on-secondary-container": "#f8e8a9",
    tertiary: "#ff9d8f",
    "tertiary-container": "#5c2a25",
    "on-tertiary": "#4b1711",
    "on-tertiary-container": "#ffd9d2",
    "tertiary-fixed": "#4c1718",
    "on-tertiary-fixed": "#ffdad7",
    error: "#ffb4ab",
    "on-error": "#690005",
    "error-container": "#93000a",
    "on-error-container": "#ffdad6",
    "on-background": "#e5eee7",
    "on-surface": "#e5eee7",
    "surface-variant": "#2d3d33",
    "on-surface-variant": "#bac9bd",
    outline: "#879b8c",
    "outline-variant": "#405448",
    "landing-background": "#111d16",
    "landing-surface": "#1b2b21",
    "landing-ink": "#e8f0e9",
    "landing-muted": "#adbeaf",
    "landing-green": "#83c69a",
    "landing-green-dark": "#0d2419",
    "landing-pale-green": "#263b2d",
    "landing-yellow": "#d9f36a",
    "landing-line": "#344a39",
    "feature-one": "#263b2d",
    "feature-two": "#483327",
    "feature-three": "#462c2b",
    "feature-four": "#2b344b",
    "produce-warm": "#483c26",
    "produce-red": "#472b2a",
    "status-good": "#294130",
    "tip-background": "#493d1e",
    "tip-text": "#f4dfa0",
    "preview-muted": "#9daf9f",
    "how-background": "#17251c",
    "step-border": "#3c5140",
    "step-connector": "#506650",
  },
};

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  try {
    const savedMode = window.localStorage.getItem(STORAGE_KEY);
    if (savedMode === "light" || savedMode === "dark") return savedMode;
  } catch (error) {
    console.warn("Could not read the saved FreshFriends theme preference.", error);
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  for (const [name, value] of Object.entries(themes[mode])) {
    root.style.setProperty(`--ff-${name}`, value);
  }
  for (const name of alphaTokens) {
    for (const opacity of alphaValues) {
      const percent = ((parseInt(opacity, 16) / 255) * 100).toFixed(2);
      root.style.setProperty(
        `--ff-${name}-alpha-${opacity}`,
        `color-mix(in srgb, var(--ff-${name}) ${percent}%, transparent)`,
      );
    }
  }
  document.body.style.backgroundColor = "var(--ff-background)";
  document.body.style.color = "var(--ff-on-surface)";
  document.body.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
}

export function WebThemeProvider({ children }: React.PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch (error) {
      console.warn("Could not read the saved FreshFriends theme preference.", error);
    }
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const updateFromSystem = (event: MediaQueryListEvent) =>
      setMode(event.matches ? "dark" : "light");
    media.addEventListener?.("change", updateFromSystem);
    return () => media.removeEventListener?.("change", updateFromSystem);
  }, []);

  const toggle = useCallback(() => {
    const nextMode = mode === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn("Could not save the FreshFriends theme preference.", error);
    }
    setMode(nextMode);
  }, [mode]);

  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);
  return <WebThemeContext.Provider value={value}>{children}</WebThemeContext.Provider>;
}

export function useWebTheme() {
  return useContext(WebThemeContext);
}
