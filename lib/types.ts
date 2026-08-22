// Datos crudos extraídos de la ficha de la propiedad (scraper determinista).
// Subconjunto del PropertyData de pinares-to-carrousel: sin coordenadas (la
// card no tiene mapa) y con una sola imagen en vez de galería.
export interface ScrapedProperty {
  title: string            // h1 original — insumo para la IA, no se renderiza
  operation: string        // "venta" | "alquiler" | "alquiler-temporario"
  propertyType: string     // "casa" | "departamento" | "terreno" | ...
  address: string
  neighborhood: string
  city: string
  province: string
  bedrooms: number | null
  bathrooms: number | null
  totalAreaM2: number | null
  coveredAreaM2: number | null
  garage: boolean
  amenities: string[]
  description: string      // insumo para la IA, no se renderiza
  image: string
  sourceUrl: string
}

// Copy redactado por la IA a partir de un ScrapedProperty.
export interface CardCopy {
  titleOptions: string[]     // 1–4 variantes ≤ 60 caracteres; la primera se aplica
  locationNormalized: string // "[Ciudad], [Provincia]", ≤ 30 caracteres
  tags: string[]             // 0–3 extras; nunca dormitorios/baños/m²
}
