import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const { html } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML es requerido' }, { status: 400 })
    }

    // Launch browser with chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1920 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    
    // Set viewport to Instagram Story size
    await page.setViewport({ width: 1080, height: 1920 })

    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Wait a bit for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500))

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
    })

    await browser.close()
    browser = null

    return NextResponse.json({ 
      image: `data:image/png;base64,${screenshot}` 
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    if (browser) {
      await browser.close()
    }
    return NextResponse.json(
      { error: 'Error al generar screenshot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
