"use client"

import { forwardRef } from "react"
import { Home } from "lucide-react"

export interface PropertyData {
  title: string
  location: string
  price: string
  image: string
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  operationType: string
  description: string
  features?: string[]
  tags?: string[]
}

interface PropertyCardProps {
  data: PropertyData
  showSource?: boolean
}

const PropertyCard = forwardRef<HTMLDivElement, PropertyCardProps>(({ data, showSource = false }, ref) => {
  const cleanTitle = (title: string) => {
    return title.trim().substring(0, 60)
  }

  const getProxiedImageUrl = (url: string) => {
    if (!url) return null
    if (url.startsWith('http')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
    return url
  }

  const imageUrl = data.image ? getProxiedImageUrl(data.image) : null

  // Icon as inline SVG string para mejor compatibilidad con html2canvas
  const LocationIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block", marginRight: "8px" }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )

  const BedIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A657" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block", marginRight: "8px" }}>
      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
    </svg>
  )

  const BathIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A657" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block", marginRight: "8px" }}>
      <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/>
    </svg>
  )

  const AreaIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A657" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block", marginRight: "8px" }}>
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>
    </svg>
  )

  const ExternalIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block", marginRight: "10px" }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  )

  const HeartIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline-block" }}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  )

  return (
    <div
      ref={ref}
      style={{ 
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        width: "100%",
      }}
    >
      {/* Image Container */}
      <div style={{ position: "relative", height: "600px", width: "100%", overflow: "hidden", backgroundColor: "#e2e8f0" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={data.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "table", backgroundColor: "#e2e8f0" }}>
            <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: "center" }}>
              <Home style={{ width: 64, height: 64, color: "#64748b" }} />
            </div>
          </div>
        )}
        {/* Operation Type Badge */}
        <div style={{ position: "absolute", top: "32px", left: "32px", backgroundColor: "#EC3136", color: "#ffffff", padding: "14px 32px", borderRadius: "999px", fontSize: "30px", fontWeight: 700, lineHeight: 1 }}>
          {data.operationType}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "48px 56px" }}>
        {/* Title */}
        <div style={{ color: "#1e293b", fontSize: "44px", fontWeight: 700, lineHeight: 1.2, marginBottom: "24px" }}>
          {cleanTitle(data.title) || 'Propiedad'}
        </div>

        {/* Location */}
        {data.location && (
          <div style={{ color: "#6b7280", fontSize: "24px", lineHeight: 1, marginBottom: "36px" }}>
            <LocationIcon />
            <span style={{ verticalAlign: "middle" }}>{data.location}</span>
          </div>
        )}

        {/* Features */}
        <div style={{ marginBottom: "32px" }}>
          {data.bedrooms && (
            <span style={{ display: "inline-block", padding: "16px 28px", borderRadius: "999px", backgroundColor: "#e8f7f0", border: "2px solid #b3e6cd", fontSize: "24px", fontWeight: 600, color: "#1e293b", lineHeight: "26px", marginRight: "14px", marginBottom: "14px" }}>
              <BedIcon />
              <span style={{ verticalAlign: "middle" }}>{data.bedrooms} Dorm.</span>
            </span>
          )}
          {data.bathrooms && (
            <span style={{ display: "inline-block", padding: "16px 28px", borderRadius: "999px", backgroundColor: "#e8f7f0", border: "2px solid #b3e6cd", fontSize: "24px", fontWeight: 600, color: "#1e293b", lineHeight: "26px", marginRight: "14px", marginBottom: "14px" }}>
              <BathIcon />
              <span style={{ verticalAlign: "middle" }}>{data.bathrooms} Baño{data.bathrooms > 1 ? 's' : ''}</span>
            </span>
          )}
          {data.area && (
            <span style={{ display: "inline-block", padding: "16px 28px", borderRadius: "999px", backgroundColor: "#e8f7f0", border: "2px solid #b3e6cd", fontSize: "24px", fontWeight: 600, color: "#1e293b", lineHeight: "26px", marginRight: "14px", marginBottom: "14px" }}>
              <AreaIcon />
              <span style={{ verticalAlign: "middle" }}>{data.area}m²</span>
            </span>
          )}
        </div>

        {/* Etiquetas personalizadas */}
        {data.tags && data.tags.length > 0 && (
          <div style={{ marginBottom: "36px" }}>
            {data.tags.map((tag, i) => (
              <span
                key={i}
                style={{ display: "inline-block", padding: "14px 26px", borderRadius: "999px", backgroundColor: "#1e293b", color: "#ffffff", fontSize: "22px", fontWeight: 600, lineHeight: 1, marginRight: "12px", marginBottom: "12px" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Logo centrado */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "44px" }}>
          <img src="/logo-lospinares.png" alt="Los Pinares" style={{ height: "100px", objectFit: "contain" }} />
        </div>
      </div>
    </div>
  )
})

PropertyCard.displayName = "PropertyCard"

export default PropertyCard
