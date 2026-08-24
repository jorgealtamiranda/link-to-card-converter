import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import type { PropertyData } from '@/components/property-card'
import { BackgroundConfig, DEFAULT_BACKGROUND } from '@/lib/background'
import { CardAssets, LOGO_URL, STORY_H, STORY_W, generateCardHtml } from '@/lib/generate-card-html'

export const runtime = 'nodejs'
// Tope del plan Hobby. El arranque en frío de Chromium (extraer los .br a /tmp
// y levantar el proceso) se lleva varios segundos antes del primer render.
export const maxDuration = 60

/**
 * Descarga una imagen y la devuelve como data: URI. Mismo patrón que
 * app/api/image-proxy/route.ts, incluido el User-Agent: algunos orígenes
 * cortan los pedidos sin uno de navegador.
 *
 * Devuelve null si falla. La tarjeta se exporta igual sin esa imagen: es
 * preferible a que se caiga todo el export.
 */
async function toDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      console.error(`Image fetch failed (${response.status}): ${url}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(await response.arrayBuffer()).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error(`Image fetch error: ${url}`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    const { property, background } = (await request.json()) as {
      property?: PropertyData
      background?: BackgroundConfig
    }

    if (!property) {
      return NextResponse.json({ error: 'Faltan los datos de la propiedad' }, { status: 400 })
    }

    // El HTML se arma acá y no en el cliente para poder embeber las imágenes:
    // así la página que abre Chromium no hace ni un pedido de red.
    const [image, logo] = await Promise.all([toDataUri(property.image), toDataUri(LOGO_URL)])
    const assets: CardAssets = { image, logo }
    const html = generateCardHtml(property, assets, background ?? DEFAULT_BACKGROUND)

    // La tarjeta es HTML/CSS plano: sin WebGL no hace falta extraer
    // swiftshader.tar.br, y el arranque en frío baja.
    chromium.setGraphicsMode = false

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: STORY_W, height: STORY_H },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setViewport({ width: STORY_W, height: STORY_H })
    await page.setContent(html, { waitUntil: 'load', timeout: 15_000 })

    // Margen para que terminen el layout y el decodificado de las data: URIs.
    await new Promise((resolve) => setTimeout(resolve, 500))

    const screenshot = await page.screenshot({ type: 'png' })

    // Se devuelve el PNG binario: en base64 dentro de un JSON pesaría un 33%
    // más y Vercel corta los response body de funciones en 4,5 MB.
    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    return NextResponse.json(
      { error: 'Error al generar screenshot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
    // En el catch, un close() que a su vez falle taparía el error original.
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
