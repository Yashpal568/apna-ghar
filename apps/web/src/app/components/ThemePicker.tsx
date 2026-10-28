"use client";

import { useEffect, useId, useRef, useState } from "react";

const themes = [
  { id: "light", label: "Light", swatch: "#F3F4F6" },
  { id: "midnight", label: "Midnight", swatch: "#0B1120" },
  { id: "graphite", label: "Graphite", swatch: "#202328" },
  { id: "forest", label: "Forest", swatch: "#0B1715" },
  { id: "amoled", label: "AMOLED Black", swatch: "#000000" },
  { id: "system", label: "System default", swatch: "linear-gradient(135deg,#F3F4F6 50%,#0B1120 50%)" },
] as const;

type Theme = (typeof themes)[number]["id"];
const THEME_STORAGE_KEY = "apna-ghar-theme";

function resolveTheme(theme: Theme) {
  if (theme !== "system") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "midnight"
    : "light";
}

function isTheme(value: string | null): value is Theme {
  return themes.some((item) => item.id === value);
}

export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initial: Theme = isTheme(saved) ? saved : "system";
    setTheme(initial);
    document.documentElement.dataset.theme = resolveTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!isTheme(current) || current === "system") {
        document.documentElement.dataset.theme = resolveTheme("system");
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    media.addEventListener("change", onSystemChange);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      media.removeEventListener("change", onSystemChange);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function chooseTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.dataset.theme = resolveTheme(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={compact ? "theme-control theme-control-compact" : "theme-control"}>
      <button
        className="theme-trigger"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={compact ? "Choose appearance" : "Choose appearance theme"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-trigger-icon" aria-hidden="true">◐</span>
        <span className="theme-trigger-label">Appearance</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div id={menuId} className="theme-menu" role="group" aria-label="Choose a theme">
          <p>Choose your look</p>
          {themes.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`theme-option ${theme === item.id ? "is-selected" : ""}`}
              aria-pressed={theme === item.id}
              onClick={() => chooseTheme(item.id)}
            >
              <span className="theme-swatch" style={{ background: item.swatch }} aria-hidden="true" />
              <span>{item.label}</span>
              {theme === item.id && <span className="theme-check" aria-label="Selected">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
