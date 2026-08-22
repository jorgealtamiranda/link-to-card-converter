import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import type { ScrapedProperty } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Domain validation ────────────────────────────────────────────────────────

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'inmobiliarialospinares.com'

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl)
    return hostname === ALLOWED_DOMAIN || hostname.endsWith(`.${ALLOWED_DOMAIN}`)
  } catch {
    return false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanText(raw: string): string {
  return raw
    .replace(/ /g, ' ') // &nbsp;
    .replace(/\s+/g, ' ')
    .trim()
}

/** Prefer large-format variants; fall back to the original URL. */
function pickBestImageUrl(src: string): string {
  for (const size of ['-1170x', '-900x']) {
    if (src.includes(size)) return src
  }
  // Try to rewrite to -1170x if a dimension pattern exists
  const rewritten = src.replace(/-\d+x\d+(\.\w+)$/, '-1170x$1')
  if (rewritten !== src) return rewritten
  return src
}

// El slug de la taxonomía viene en plural y sin tildes ("salones-comerciales").
// Se normaliza acá y no en el prompt para que la IA reciba un tipo ya legible:
// de lo contrario lo copia literal y sale 'Importante salones-comerciales'.
// Los ocho slugs son los de /wp-sitemap-taxonomies-property_type-1.xml.
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casas: 'casa',
  departamentos: 'departamento',
  terrenos: 'terreno',
  campos: 'campo',
  chacras: 'chacra',
  'salones-comerciales': 'salón comercial',
  'galpones-comerciales': 'galpón comercial',
  'salon-comercial-con-vivienda': 'salón comercial con vivienda',
}

function normalizePropertyType(raw: string): string {
  const slug = raw.trim().toLowerCase()
  if (!slug) return ''
  if (PROPERTY_TYPE_LABELS[slug]) return PROPERTY_TYPE_LABELS[slug]

  // Fallback para tipos nuevos: guiones a espacios y plural simple a singular.
  return slug
    .split('-')
    .map((w) => (w.endsWith('es') && w.length > 4 ? w.slice(0, -2) : w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
    .join(' ')
}

function parseNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const s = raw.trim()
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')

  let normalized: string
  if (hasDot && hasComma) {
    // Both separators: the last one is the decimal separator
    normalized = s.lastIndexOf(',') > s.lastIndexOf('.')
      ? s.replace(/\./g, '').replace(',', '.')   // 1.212,50  → 1212.50
      : s.replace(/,/g, '')                        // 1,212.50  → 1212.50
  } else if (hasComma) {
    // Only comma: decimal if ≤2 digits after it, thousands otherwise
    const afterComma = s.split(',').pop() ?? ''
    normalized = afterComma.length <= 2
      ? s.replace(',', '.')   // 212,50 → 212.50
      : s.replace(/,/g, '')   // 1,212  → 1212
  } else if (hasDot) {
    // Only dot: decimal if exactly one dot and ≤2 digits after it, thousands otherwise
    const parts = s.split('.')
    normalized = parts.length === 2 && parts[1].length <= 2
      ? s                     // 212.50 → 212.50
      : s.replace(/\./g, '')  // 1.212 or 21.250 → integer
  } else {
    normalized = s
  }

  const n = parseFloat(normalized)
  return isNaN(n) ? null : n
}

// ─── Houzez key/value extractor ───────────────────────────────────────────────
// Handles all three patterns Houzez uses in detail/address sections:
//   • <li><span>Label</span><span>Value</span></li>
//   • <li><strong>Label:</strong> Value text</li>
//   • <dt>Label</dt><dd>Value</dd>

type CheerioRoot = ReturnType<typeof cheerio.load>

function extractPairs($: CheerioRoot, sectionSelector: string): Map<string, string> {
  const map = new Map<string, string>()
  const section = $(sectionSelector)
  if (!section.length) return map

  // Pattern 1 – li with two or more inline children (spans, divs, etc.)
  section.find('li').each((_, li) => {
    const children = $(li).children().filter((__, c) => {
      const tag = (c as { tagName?: string }).tagName?.toLowerCase() ?? ''
      return ['span', 'div', 'p', 'strong', 'em', 'b'].includes(tag)
    })
    if (children.length >= 2) {
      const key = cleanText($(children[0]).text())
      const val = cleanText($(children[1]).text())
      if (key) map.set(key.toLowerCase().replace(/:$/, ''), val)
      return
    }
    // Pattern 2 – single li whose full text is "Key: Value"
    const full = cleanText($(li).text())
    const m = full.match(/^(.+?):\s*(.+)$/)
    if (m) map.set(m[1].trim().toLowerCase(), m[2].trim())
  })

  // Pattern 3 – dl/dt/dd
  section.find('dt').each((_, dt) => {
    const dd = $(dt).nextAll('dd').first()
    const key = cleanText($(dt).text()).toLowerCase().replace(/:$/, '')
    const val = cleanText(dd.text())
    if (key && val) map.set(key, val)
  })

  return map
}

/** Read an og:/name meta tag from the parsed document. */
function getMeta($: CheerioRoot, property: string): string {
  const byProperty = $(`meta[property="${property}"]`).attr('content')
  if (byProperty) return byProperty.trim()
  const byName = $(`meta[name="${property}"]`).attr('content')
  return byName ? byName.trim() : ''
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

async function scrapeProperty(url: string): Promise<ScrapedProperty> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; bot)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-AR,es;q=0.9',
    },
  })

  if (!res.ok) {
    throw new Error(`El sitio devolvió HTTP ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // ── Title ──────────────────────────────────────────────────────────────────
  const title = cleanText($('h1').first().text())

  // ── Operation: /estado/<slug>/ link, then details fallback ─────────────────
  let operation = ''
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const m = href.match(/\/estado\/([^/]+)/)
    if (m) { operation = m[1].toLowerCase(); return false }
  })

  // ── Property type: /tipo-propiedad/<slug>/ link ────────────────────────────
  let propertyType = ''
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const m = href.match(/\/tipo-propiedad\/([^/]+)/)
    if (m) { propertyType = m[1].toLowerCase(); return false }
  })

  // ── Address + City + Province from #property-address-wrap ─────────────────
  let address = ''
  let city = ''
  let province = ''
  let neighborhood = ''

  const addrSections = [
    '#property-address-wrap',
    '[id*="address"]',
    '[class*="address-wrap"]',
    '[class*="property-address"]',
  ]

  let addrPairs = new Map<string, string>()
  for (const sel of addrSections) {
    addrPairs = extractPairs($, sel)
    if (addrPairs.size > 0) break
  }

  // Extract address from "Dirección" pair and clean it
  const rawDir =
    addrPairs.get('dirección') ?? addrPairs.get('direccion') ?? addrPairs.get('address') ?? ''
  if (rawDir) {
    address = rawDir
      .replace(/Abrir en Google Maps/gi, '')
      .replace(/^Direcci[oó]n\s*/i, '')
      .replace(/,\s*(Municipio|Departamento).*/i, '')
      .trim()
      .replace(/\s+/g, ' ')
  }

  city = addrPairs.get('localidad') ?? addrPairs.get('ciudad') ?? addrPairs.get('city') ?? ''
  province = addrPairs.get('provincia') ?? addrPairs.get('province') ?? ''
  neighborhood =
    addrPairs.get('barrio') ?? addrPairs.get('zona') ?? addrPairs.get('neighborhood') ?? ''

  // Fallback: extract address from Google Maps link
  if (!address) {
    $('a[href*="maps.google.com"]').each((_, el) => {
      const href = $(el).attr('href') ?? ''
      const m = href.match(/[?&]q=([^&]+)/)
      if (m) { address = decodeURIComponent(m[1].replace(/\+/g, ' ')); return false }
    })
  }

  // Fallback for city/province: scan heading-based sections
  if (!city) {
    $('h2, h3, h4, .section-title, .widget-title').each((_, heading) => {
      if (!/direcci[oó]n/i.test(cleanText($(heading).text()))) return
      const block = $(heading).closest('section, div, article').first()
      const $block = cheerio.load(block.html() ?? '')
      $block('li').each((__, li) => {
        const t = cleanText($block(li).text())
        if (/^localidad\s*[:\-]/i.test(t)) city = t.replace(/^localidad\s*[:\-]\s*/i, '')
        if (/^provincia\s*[:\-]/i.test(t)) province = t.replace(/^provincia\s*[:\-]\s*/i, '')
      })
      return false
    })
  }

  // ── Description ───────────────────────────────────────────────────────────
  const descSelectors = [
    '.property_description',
    '[class*="property"][class*="description"]',
    '.description',
    '[class*="descripcion"]',
    '[class*="description"]',
    'article p',
    '.entry-content p',
  ]
  let description = ''
  for (const sel of descSelectors) {
    const el = $(sel).first()
    if (el.length && el.text().trim().length > 20) {
      description = cleanText(el.text()); break
    }
  }
  if (!description) description = getMeta($, 'og:description')

  // ── Houzez property details (#property-detail-wrap) ───────────────────────
  let bedrooms: number | null = null
  let bathrooms: number | null = null
  let totalAreaM2: number | null = null
  let coveredAreaM2: number | null = null
  let garage = false

  const detailPairs = extractPairs(
    $,
    '#property-detail-wrap, [id*="property-detail"], [class*="property-detail"]'
  )

  function applyDetailPair(key: string, value: string) {
    const k = cleanText(key).toLowerCase()
    const v = cleanText(value)
    if (!v) return

    if (/dormitorio|habitaci[oó]n|cuarto|ambiente/.test(k))
      bedrooms = parseNumber(v.match(/\d+/)?.[0]) ?? bedrooms
    else if (/^ba[ñn]o/.test(k) && !/toilet|aseo/.test(k))
      bathrooms = parseNumber(v.match(/\d+/)?.[0]) ?? bathrooms
    else if (/terreno|total/.test(k))
      totalAreaM2 = parseNumber(v.match(/[\d.,]+/)?.[0]) ?? totalAreaM2
    else if (/cubierta|cubierto/.test(k))
      coveredAreaM2 = parseNumber(v.match(/[\d.,]+/)?.[0]) ?? coveredAreaM2
    else if (/garage|cochera/.test(k))
      garage = !/no/i.test(v)
    // Operation and type from detail block as fallback
    else if (/estado.*propiedad|estado/.test(k) && !operation)
      operation = v.toLowerCase()
    else if (/tipo.*propiedad|tipo/.test(k) && !propertyType)
      propertyType = v.toLowerCase()
  }

  detailPairs.forEach((val, key) => applyDetailPair(key, val))

  // Also scan generic tables and dl lists for any site that uses them
  $('table tr').each((_, row) => {
    const cells = $(row).find('td, th')
    if (cells.length >= 2) applyDetailPair($(cells[0]).text(), $(cells[1]).text())
  })
  $('dl dt').each((_, dt) => {
    applyDetailPair($(dt).text(), $(dt).next('dd').text())
  })

  // ── Amenities: Houzez #property-features-wrap ─────────────────────────────
  const amenities: string[] = []

  $('#property-features-wrap a, [id*="features-wrap"] a, [class*="features"] a').each((_, el) => {
    const feat = cleanText($(el).text())
    if (feat && feat.length > 1 && !amenities.includes(feat)) amenities.push(feat)
  })

  // Fallback: find section with "Destaques" heading and extract li text
  if (amenities.length === 0) {
    $('h2, h3, h4').each((_, heading) => {
      if (!/destaques|caracter[ií]sticas|amenities/i.test(cleanText($(heading).text()))) return
      $(heading).nextAll('ul').first().find('li').each((__, li) => {
        const feat = cleanText($(li).text())
        if (feat && !amenities.includes(feat)) amenities.push(feat)
      })
      return false
    })
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  // Try selectors in priority order and stop at the first one that yields a
  // result — do NOT combine them into one query. Houzez reuses the word
  // "gallery" in unrelated widgets (e.g. the "similar properties" listing cards
  // use a `hz-item-gallery-js` class), so a combined `[class*="gallery"]`
  // selector pulls in thumbnails from OTHER properties via their lazy-load
  // data-src. The specific IDs below only ever match the current listing's own
  // photo gallery.
  const gallerySelectors = ['#pills-gallery', '#property-gallery-js', '.lightbox-gallery']

  let image = ''
  for (const sel of gallerySelectors) {
    $(`${sel} img`).each((_, el) => {
      const candidates = [
        $(el).attr('src'),
        $(el).attr('data-src'),
        $(el).attr('data-lazy-src'),
        $(el).attr('data-full-url'),
      ]
      for (const src of candidates) {
        if (src && src.includes('wp-content/uploads')) {
          image = pickBestImageUrl(src)
          return false
        }
      }
    })
    if (image) break
  }

  if (!image) image = getMeta($, 'og:image')
  if (!image) image = '/placeholder.jpg'

  return {
    title,
    operation,
    propertyType: normalizePropertyType(propertyType),
    address,
    neighborhood,
    city,
    province,
    bedrooms,
    bathrooms,
    totalAreaM2,
    coveredAreaM2,
    garage,
    amenities,
    description,
    image,
    sourceUrl: url,
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { url } = body
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Falta el campo url' }, { status: 400 })
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: `Solo se permite scrapear el dominio: ${ALLOWED_DOMAIN}` },
      { status: 403 }
    )
  }

  try {
    const property = await scrapeProperty(url)
    return NextResponse.json({ property }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    const isNetworkError = message.includes('fetch') || message.includes('ENOTFOUND')
    return NextResponse.json({ error: message }, { status: isNetworkError ? 502 : 422 })
  }
}
