import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL es requerida' }, { status: 400 })
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'No se pudo acceder a la URL' }, { status: 400 })
    }

    const html = await response.text()

    // Extract meta tags
    const getMetaContent = (property: string): string | null => {
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
      )
      if (ogMatch) return ogMatch[1]

      const nameMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
      )
      return nameMatch ? nameMatch[1] : null
    }

    // Get text content for AI analysis
    let textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000) // Limitar para no exceder tokens

    // Extract OG image
    const ogImage = getMetaContent('og:image')
    
    // Extract images from HTML as fallback
    const imageRegex = /<img[^>]+src="([^">]+)"/g
    const images: string[] = []
    let imgMatch
    while ((imgMatch = imageRegex.exec(html)) !== null) {
      const img = imgMatch[1]
      if (!img.includes('pixel') && !img.includes('1x1') && !img.includes('transparent') && !img.includes('logo')) {
        images.push(img)
      }
    }
    
    const imageUrl = ogImage || images[0] || '/placeholder.jpg'

    // GPT-OSS 120B is Groq's recommended replacement for the retired
    // llama-3.3-70b-versatile model.
    const { text } = await generateText({
      model: groq('openai/gpt-oss-120b'),
      prompt: `Analiza el siguiente contenido de una página web de una propiedad inmobiliaria y extrae la información en formato JSON.

URL: ${url}

Contenido de la página:
${textContent}

Responde SOLO con un objeto JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "title": "Título descriptivo de la propiedad (máximo 80 caracteres)",
  "location": "Ubicación/dirección de la propiedad",
  "operationType": "Venta" | "Alquiler" | "Permuta" | "Otro",
  "bedrooms": número o null si no se menciona,
  "bathrooms": número o null si no se menciona,
  "area": número en metros cuadrados o null si no se menciona,
  "price": "Precio con moneda" o null si no se menciona,
  "description": "Descripción breve" o null
}

JSON:`,
    })

    // Parse the JSON response
    let parsed
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7)
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3)
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3)
      }
      cleanText = cleanText.trim()
      
      parsed = JSON.parse(cleanText)
    } catch {
      console.error('Failed to parse AI response:', text)
      // Fallback to basic extraction
      parsed = {
        title: getMetaContent('og:title') || 'Propiedad',
        location: 'Ubicación no disponible',
        operationType: 'Otro',
        bedrooms: null,
        bathrooms: null,
        area: null,
        price: null,
        description: getMetaContent('og:description'),
      }
    }

    return NextResponse.json({
      title: parsed.title || 'Propiedad',
      location: parsed.location || 'Ubicación no disponible',
      operationType: parsed.operationType || 'Otro',
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      area: parsed.area,
      price: parsed.price || 'Consultar',
      description: parsed.description,
      image: imageUrl,
    })
  } catch (error) {
    console.error('Error al scrapear:', error)
    return NextResponse.json(
      {
        error: 'Error al procesar la URL',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
