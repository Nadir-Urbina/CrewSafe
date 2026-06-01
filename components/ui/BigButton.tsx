"use client";

import { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "dark" | "ghost";

interface BigButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  type?: "button" | "submit" | "reset";
}

const variants: Record<Variant, { bg: string; fg: string; bd: string }> = {
  primary: { bg: "var(--cs-hiviz)",    fg: "var(--cs-ink)", bd: "var(--cs-ink)" },
  dark:    { bg: "var(--cs-ink)",      fg: "#fff",          bd: "var(--cs-ink)" },
  ghost:   { bg: "transparent",        fg: "var(--cs-ink)", bd: "var(--cs-line-strong)" },
};

export default function BigButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
}: BigButtonProps) {
  const v = variants[variant];

  const base: CSSProperties = {
    width: "100%", height: 60, borderRadius: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "var(--cs-paper-deep)" : v.bg,
    color: disabled ? "var(--cs-faint)" : v.fg,
    border: `2.5px solid ${disabled ? "var(--cs-line)" : v.bd}`,
    boxShadow: disabled ? "none" : `0 4px 0 ${v.bd}`,
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21,
    letterSpacing: 0.6, textTransform: "uppercase",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, transition: "transform .08s, box-shadow .08s",
    minHeight: 60,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={base}
      onMouseDown={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(3px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 1px 0 ${v.bd}`;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 0 ${v.bd}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 0 ${v.bd}`;
        }
      }}
    >
      {children}
    </button>
  );
}
