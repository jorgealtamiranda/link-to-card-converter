"use client"

import { useState } from "react"

export type BackgroundConfig =
  | { type: "solid"; color: string }
  | { type: "gradient"; color1: string; color2: string; angle: number }

const PRESETS: BackgroundConfig[] = [
  { type: "solid", color: "#00A657" },
  { type: "solid", color: "#1e293b" },
  { type: "solid", color: "#EC3136" },
  { type: "solid", color: "#0ea5e9" },
  { type: "solid", color: "#7c3aed" },
  { type: "solid", color: "#f59e0b" },
  { type: "gradient", color1: "#f37430", color2: "#eb3135", angle: 135 },
  { type: "gradient", color1: "#a1cd47", color2: "#00a657", angle: 135 },
  { type: "gradient", color1: "#1e293b", color2: "#475569", angle: 160 },
  { type: "gradient", color1: "#7c3aed", color2: "#EC3136", angle: 135 },
  { type: "gradient", color1: "#0ea5e9", color2: "#7c3aed", angle: 135 },
  { type: "gradient", color1: "#00A657", color2: "#f59e0b", angle: 135 },
]

export function backgroundToCss(bg: BackgroundConfig): string {
  if (bg.type === "solid") return bg.color
  return `linear-gradient(${bg.angle}deg, ${bg.color1}, ${bg.color2})`
}

interface Props {
  value: BackgroundConfig
  onChange: (bg: BackgroundConfig) => void
}

export default function BackgroundPicker({ value, onChange }: Props) {
  const [tab, setTab] = useState<"solid" | "gradient">(value.type)

  const solidColor = value.type === "solid" ? value.color : "#00A657"
  const gradColor1 = value.type === "gradient" ? value.color1 : "#00A657"
  const gradColor2 = value.type === "gradient" ? value.color2 : "#0ea5e9"
  const gradAngle = value.type === "gradient" ? value.angle : 135

  return (
    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px" }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Fondo
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["solid", "gradient"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              if (t === "solid") onChange({ type: "solid", color: solidColor })
              else onChange({ type: "gradient", color1: gradColor1, color2: gradColor2, angle: gradAngle })
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              backgroundColor: tab === t ? "#1e293b" : "#e2e8f0",
              color: tab === t ? "#ffffff" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {t === "solid" ? "Sólido" : "Degradado"}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {PRESETS.filter((p) => p.type === tab).map((preset, i) => {
          const css = backgroundToCss(preset)
          const isActive =
            value.type === preset.type &&
            (preset.type === "solid"
              ? value.color === preset.color
              : value.color1 === preset.color1 && value.color2 === preset.color2)
          return (
            <button
              key={i}
              onClick={() => onChange(preset)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: css,
                border: isActive ? "3px solid #1e293b" : "2px solid transparent",
                cursor: "pointer",
                outline: isActive ? "2px solid #ffffff" : "none",
                outlineOffset: "-4px",
              }}
              title={css}
            />
          )
        })}
      </div>

      {/* Custom inputs */}
      {tab === "solid" && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="color"
            value={solidColor}
            onChange={(e) => onChange({ type: "solid", color: e.target.value })}
            style={{ width: "44px", height: "44px", borderRadius: "8px", border: "2px solid #e2e8f0", cursor: "pointer", padding: "2px" }}
          />
          <span style={{ fontSize: "13px", color: "#64748b" }}>Color personalizado</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginLeft: "auto" }}>{solidColor}</span>
        </div>
      )}

      {tab === "gradient" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="color"
              value={gradColor1}
              onChange={(e) => onChange({ type: "gradient", color1: e.target.value, color2: gradColor2, angle: gradAngle })}
              style={{ width: "44px", height: "44px", borderRadius: "8px", border: "2px solid #e2e8f0", cursor: "pointer", padding: "2px" }}
            />
            <span style={{ fontSize: "13px", color: "#64748b" }}>Color 1</span>
            <input
              type="color"
              value={gradColor2}
              onChange={(e) => onChange({ type: "gradient", color1: gradColor1, color2: e.target.value, angle: gradAngle })}
              style={{ width: "44px", height: "44px", borderRadius: "8px", border: "2px solid #e2e8f0", cursor: "pointer", padding: "2px" }}
            />
            <span style={{ fontSize: "13px", color: "#64748b" }}>Color 2</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>Angulo: {gradAngle}°</span>
            <input
              type="range"
              min={0}
              max={360}
              value={gradAngle}
              onChange={(e) => onChange({ type: "gradient", color1: gradColor1, color2: gradColor2, angle: Number(e.target.value) })}
              style={{ flex: 1, accentColor: "#1e293b" }}
            />
          </div>
          {/* Gradient preview */}
          <div
            style={{
              height: "32px",
              borderRadius: "8px",
              background: `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`,
              border: "1px solid #e2e8f0",
            }}
          />
        </div>
      )}
    </div>
  )
}
