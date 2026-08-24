// Vive fuera de background-picker.tsx (que es "use client") porque la ruta de
// screenshot arma el HTML en el servidor: importar un valor desde un módulo
// cliente devuelve un proxy de referencia, no la función.

export type BackgroundConfig =
  | { type: "solid"; color: string }
  | { type: "gradient"; color1: string; color2: string; angle: number }

export const DEFAULT_BACKGROUND: BackgroundConfig = { type: "solid", color: "#049D5A" }

export function backgroundToCss(bg: BackgroundConfig): string {
  if (bg.type === "solid") return bg.color
  return `linear-gradient(${bg.angle}deg, ${bg.color1}, ${bg.color2})`
}
