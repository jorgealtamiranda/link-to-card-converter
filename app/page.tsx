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

// Instagram Story: 1080x1920 rendered at half size for preview (540x960)
const STORY_W = 1080
const STORY_H = 1920
const CARD_W = 820

export default function Home() {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [background, setBackground] = useState<BackgroundConfig>({ type: "solid", color: "#00A657" })

  const fetchPropertyData = async (url: string) => {
    setIsLoading(true)
    setError(null)
    setPropertyData(null)

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Error al procesar la URL")
      }

      setPropertyData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la URL")
    } finally {
      setIsLoading(false)
    }
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
          <UrlInputForm onSubmit={fetchPropertyData} isLoading={isLoading} />
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
            <PropertyEditor data={propertyData} onChange={setPropertyData} />

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
