"use client"

import { useState, useEffect } from "react"
import { PropertyData } from "@/components/property-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PropertyEditorProps {
  data: PropertyData
  onChange: (data: PropertyData) => void
}

export default function PropertyEditor({ data, onChange }: PropertyEditorProps) {
  // Estado local para el campo de tags (permite escribir libremente)
  const [tagsInput, setTagsInput] = useState((data.tags || []).join(", "))

  // Sincronizar cuando cambian los tags externamente
  useEffect(() => {
    setTagsInput((data.tags || []).join(", "))
  }, [data.tags])

  const update = (field: keyof PropertyData, value: string | number | null) => {
    onChange({ ...data, [field]: value })
  }

  const parseAndSaveTags = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onChange({ ...data, tags })
  }

  return (
    <div 
      className="bg-card rounded-2xl border border-border p-6 mb-6"
      style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
    >
      <h3 className="font-semibold text-foreground mb-4">Editar datos de la propiedad</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Titulo */}
        <div className="sm:col-span-2">
          <Label htmlFor="title" className="text-sm text-muted-foreground mb-1.5 block">
            Título
          </Label>
          <Input
            id="title"
            value={data.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Título de la propiedad"
            className="rounded-lg"
          />
        </div>

        {/* Ubicacion */}
        <div className="sm:col-span-2">
          <Label htmlFor="location" className="text-sm text-muted-foreground mb-1.5 block">
            Ubicación
          </Label>
          <Input
            id="location"
            value={data.location || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Ciudad, Barrio, etc."
            className="rounded-lg"
          />
        </div>

        {/* Tipo de operacion */}
        <div>
          <Label htmlFor="operationType" className="text-sm text-muted-foreground mb-1.5 block">
            Tipo de operación
          </Label>
          <select
            id="operationType"
            value={data.operationType || "Venta"}
            onChange={(e) => update("operationType", e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
          >
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
            <option value="Alquiler Temporal">Alquiler Temporal</option>
          </select>
        </div>

        {/* URL de imagen */}
        <div>
          <Label htmlFor="image" className="text-sm text-muted-foreground mb-1.5 block">
            URL de imagen
          </Label>
          <Input
            id="image"
            value={data.image || ""}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://..."
            className="rounded-lg"
          />
        </div>

        {/* Dormitorios */}
        <div>
          <Label htmlFor="bedrooms" className="text-sm text-muted-foreground mb-1.5 block">
            Dormitorios
          </Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={data.bedrooms || ""}
            onChange={(e) => update("bedrooms", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="0"
            className="rounded-lg"
          />
        </div>

        {/* Banos */}
        <div>
          <Label htmlFor="bathrooms" className="text-sm text-muted-foreground mb-1.5 block">
            Baños
          </Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={data.bathrooms || ""}
            onChange={(e) => update("bathrooms", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="0"
            className="rounded-lg"
          />
        </div>

        {/* Area */}
        <div>
          <Label htmlFor="area" className="text-sm text-muted-foreground mb-1.5 block">
            Superficie (m²)
          </Label>
          <Input
            id="area"
            type="number"
            min="0"
            value={data.area || ""}
            onChange={(e) => update("area", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="0"
            className="rounded-lg"
          />
        </div>

        {/* Etiquetas personalizadas */}
        <div className="sm:col-span-2">
          <Label htmlFor="tags" className="text-sm text-muted-foreground mb-1.5 block">
            Etiquetas personalizadas <span className="text-xs font-normal">(separadas por comas)</span>
          </Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={parseAndSaveTags}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                parseAndSaveTags()
              }
            }}
            placeholder="Ej: Oportunidad, A estrenar, Financiación"
            className="rounded-lg"
          />
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-foreground text-background"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
