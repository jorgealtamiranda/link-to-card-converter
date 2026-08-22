"use client"

import { useState, useCallback } from "react"
import { Download, Sparkles, AlertCircle, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PropertyCard, { PropertyData } from "@/components/property-card"
import PropertyEditor from "@/components/property-editor"
import UrlInputForm from "@/components/url-input-form"
import { generateCardHtml } from "@/lib/generate-card-html"
import BackgroundPicker, { BackgroundConfig, backgroundToCss } from "@/components/background-picker"
import type { CardCopy, ScrapedProperty } from "@/lib/types"

// Instagram Story: 1080x1920 rendered at half size for preview (540x960)
const STORY_W = 1080
const STORY_H = 1920
const CARD_W = 820

/** El scraper devuelve la operación en minúscula ("venta"); el editor usa "Venta". */
function formatOperation(operation: string): string {
  if (!operation) return "Venta"
  return operation
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * La tarjeta muestra un solo chip de superficie (`area`), así que cuando la ficha
 * trae las dos, la que no se muestra se perdería. Se recupera como etiqueta.
 * Es un dato duro y determinista: no tiene sentido gastarlo en el prompt.
 */
function complementaryAreaTag(property: ScrapedProperty): string | null {
  const { coveredAreaM2, totalAreaM2 } = property
  if (coveredAreaM2 == null || totalAreaM2 == null) return null
  // El chip usa `coveredAreaM2 ?? totalAreaM2`, así que la que sobra es la total.
  return `${Math.round(totalAreaM2)} m² totales`
}

/** Combina los datos duros del scraper con el copy redactado por la IA. */
function toPropertyData(property: ScrapedProperty, copy: CardCopy | null): PropertyData {
  const location = copy?.locationNormalized || [property.city, property.province].filter(Boolean).join(", ")

  const areaTag = complementaryAreaTag(property)
  const tags = [...(areaTag ? [areaTag] : []), ...(copy?.tags ?? [])].slice(0, 3)

  return {
    title: copy?.titleOptions[0] || property.title,
    location,
    price: "",
    image: property.image,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.coveredAreaM2 ?? property.totalAreaM2,
    operationType: formatOperation(property.operation),
    description: "",
    tags,
  }
}

export default function Home() {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loadingStage, setLoadingStage] = useState<"idle" | "scraping" | "generating">("idle")
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [background, setBackground] = useState<BackgroundConfig>({ type: "solid", color: "#049D5A" })
  // Las 3 variantes generadas de una sola vez. Viven mientras dure la tarjeta y se
  // descartan al pegar otra URL: el botón cicla sobre estas y nunca vuelve a la IA.
  const [titleOptions, setTitleOptions] = useState<string[]>([])
  const [titleIndex, setTitleIndex] = useState(0)

  const isLoading = loadingStage !== "idle"

  const fetchPropertyData = async (url: string) => {
    setLoadingStage("scraping")
    setError(null)
    setPropertyData(null)
    setTitleOptions([])
    setTitleIndex(0)

    let property: ScrapedProperty
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la URL")
      }

      property = data.property
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la URL")
      setLoadingStage("idle")
      return
    }

    // Los datos duros ya son correctos: si la redacción falla igual mostramos la
    // tarjeta con el título original y el editor permite corregir a mano.
    setLoadingStage("generating")
    let copy: CardCopy | null = null
    try {
      const response = await fetch("/api/process-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property }),
      })

      const data = await response.json()

      if (response.ok) {
        copy = data.content
      } else {
        setError(`No se pudo generar el copy (${data.error}). Se muestran los datos sin redactar.`)
      }
    } catch {
      setError("No se pudo generar el copy. Se muestran los datos sin redactar.")
    }

    setTitleOptions(copy?.titleOptions ?? [])
    setTitleIndex(0)
    setPropertyData(toPropertyData(property, copy))
    setLoadingStage("idle")
  }

  /**
   * Cicla entre las 3 variantes generadas al principio, volviendo a la primera
   * después de la última. No llama a la IA: cada llamada pesa ~2.100 tokens de
   * system prompt contra un límite de 8000 por minuto, así que clickear seguido
   * disparaba 429 y ponía en riesgo la cuenta.
   * Solo toca el título: ubicación y etiquetas quedan intactas.
   */
  const nextTitle = () => {
    if (!propertyData || titleOptions.length < 2) return
    const next = (titleIndex + 1) % titleOptions.length
    setTitleIndex(next)
    setPropertyData({ ...propertyData, title: titleOptions[next] })
  }

  const exportToPng = useCallback(async () => {
    if (!propertyData) return

    setIsExporting(true)
    setError(null)

    try {
      // Generate full HTML for the card
      const html = generateCardHtml(propertyData, STORY_W, STORY_H, CARD_W, background)

      // Send to server for Puppeteer screenshot
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al generar imagen")
      }

      // Download the image
      const link = document.createElement("a")
      link.download = `propiedad-${Date.now()}.png`
      link.href = data.image
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Export error:", err)
      setError("Error al exportar la imagen. Intenta nuevamente.")
    } finally {
      setIsExporting(false)
    }
  }, [propertyData])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Property Card Generator
            </h1>
          </div>
          <p className="text-center text-muted-foreground max-w-md mx-auto">
            Pega el link de cualquier propiedad inmobiliaria y genera una hermosa tarjeta para compartir
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* URL Input */}
        <div 
          className="bg-card rounded-2xl border border-border p-6 mb-8"
          style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
        >
          <UrlInputForm
            onSubmit={fetchPropertyData}
            isLoading={isLoading}
            loadingLabel={loadingStage === "generating" ? "Redactando..." : "Leyendo ficha..."}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Property Card Preview */}
        {propertyData && (
          <div className="space-y-6">
            {/* Property Editor */}
            <PropertyEditor
              data={propertyData}
              onChange={setPropertyData}
              onNextTitle={nextTitle}
              titleIndex={titleIndex}
              titleCount={titleOptions.length}
            />

            {/* Background Picker */}
            <BackgroundPicker value={background} onChange={setBackground} />

            {/* Export Button */}
            <div className="flex justify-center">
              <Button
                onClick={exportToPng}
                disabled={isExporting}
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12 px-6 font-medium"
              >
                {isExporting ? (
                  <>
                    <Download className="w-5 h-5 mr-2 animate-bounce" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Exportar para Instagram
                  </>
                )}
              </Button>
            </div>

            {/* Preview escalada al 50% de 1080x1920 */}
            <div className="flex justify-center">
              <div
                style={{
                  width: STORY_W / 2,
                  height: STORY_H / 2,
                  background: backgroundToCss(background),
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: "125px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div style={{ transform: "scale(0.5)", transformOrigin: "top center", width: CARD_W, flexShrink: 0 }}>
                  <PropertyCard data={propertyData} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!propertyData && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-2xl mb-4">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sin propiedades todavía
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Pega un link de una propiedad inmobiliaria para generar una tarjeta visual que puedes exportar como imagen
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
