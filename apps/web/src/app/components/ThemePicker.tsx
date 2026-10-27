"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "light", label: "Light Classic", swatch: "#F3F4F6" },
  { id: "midnight", label: "Midnight Navy", swatch: "#0B1120" },
  { id: "graphite", label: "Graphite", swatch: "#202328" },
  { id: "forest", label: "Forest Dark", swatch: "#0B1715" },
  { id: "amoled", label: "AMOLED Black", swatch: "#000000" },
  { id: "system", label: "System default", swatch: "linear-gradient(135deg,#F3F4F6 50%,#0B1120 50%)" },
] as const;

type Theme = (typeof themes)[number]["id"];
function resolveTheme(theme: Theme) {
  if (theme !== "system") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "light";
}

export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("apna-ghar-theme") as Theme | null;
    const initial = saved && themes.some((item) => item.id === saved) ? saved : "system";
    setTheme(initial);
    document.documentElement.dataset.theme = resolveTheme(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (window.localStorage.getItem("apna-ghar-theme") === "system") document.documentElement.dataset.theme = resolveTheme("system"); };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  function chooseTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem("apna-ghar-theme", next);
    document.documentElement.dataset.theme = resolveTheme(next);
    setOpen(false);
  }

  return <div className={compact ? "theme-control theme-control-compact" : "theme-control"}>
    <button className="theme-trigger" type="button" aria-expanded={open} aria-label="Choose appearance" onClick={() => setOpen(!open)}><span className="theme-trigger-icon" aria-hidden="true">◐</span>{compact ? <span className="theme-trigger-label">Appearance</span> : <span>Appearance</span>}<span aria-hidden="true">⌄</span></button>
    {open && <div className="theme-menu" role="dialog" aria-label="Choose a theme"><p>Choose your look</p>{themes.map((item) => <button type="button" key={item.id} className={`theme-option ${theme === item.id ? "is-selected" : ""}`} onClick={() => chooseTheme(item.id)}><span className="theme-swatch" style={{ background: item.swatch }}/><span>{item.label}</span>{theme === item.id && <span className="theme-check" aria-label="Selected">✓</span>}</button>)}</div>}
  </div>;
}