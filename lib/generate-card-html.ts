import { PropertyData } from "@/components/property-card"
import { BackgroundConfig, backgroundToCss } from "@/components/background-picker"

// Logo URL - usando blob storage de Vercel que es accesible por Puppeteer
const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lospinares260%201-YQBt1gpiCxGTYIPAVRoB52N9UA6Iv3.png"

export function generateCardHtml(
  data: PropertyData,
  storyW: number,
  storyH: number,
  cardW: number,
  background: BackgroundConfig = { type: "solid", color: "#049D5A" }
): string {
  const bgCss = backgroundToCss(background)
  const cleanTitle = (title: string) => title.trim().substring(0, 60)

  const bedIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00A657" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`
  
  const bathIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00A657" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/></svg>`
  
  const areaIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00A657" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`
  
  const locationIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  
  const externalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
  
  const heartIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`

  const features = []
  if (data.bedrooms) {
    features.push(`
      <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; border-radius: 999px; background-color: #e8f7f0; border: 2px solid #b3e6cd;">
        ${bedIcon}
        <span style="font-size: 24px; font-weight: 600; color: #1e293b; line-height: 1;">${data.bedrooms} Dorm.</span>
      </div>
    `)
  }
  if (data.bathrooms) {
    features.push(`
      <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; border-radius: 999px; background-color: #e8f7f0; border: 2px solid #b3e6cd;">
        ${bathIcon}
        <span style="font-size: 24px; font-weight: 600; color: #1e293b; line-height: 1;">${data.bathrooms} Baño${data.bathrooms > 1 ? 's' : ''}</span>
      </div>
    `)
  }
  if (data.area) {
    features.push(`
      <div style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; border-radius: 999px; background-color: #e8f7f0; border: 2px solid #b3e6cd;">
        ${areaIcon}
        <span style="font-size: 24px; font-weight: 600; color: #1e293b; line-height: 1;">${data.area}m²</span>
      </div>
    `)
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { 
      width: ${storyW}px; 
      height: ${storyH}px;
    }
    body { 
      width: ${storyW}px; 
      height: ${storyH}px;
      background: ${bgCss};
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 250px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding-left: 0;
      padding-right: 0;
    }
    .card {
      width: ${cardW}px;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      z-index: 1;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .image-container {
      width: 100%;
      height: 620px;
      position: relative;
      background-color: #e2e8f0;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge {
      position: absolute;
      top: 32px;
      left: 32px;
      background-color: #EC3136;
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 999px;
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
    }
    .content {
      padding: 48px 56px;
    }
    .title {
      font-size: 44px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
      margin-bottom: 24px;
    }
    .location {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      margin-bottom: 36px;
    }
    .location span {
      font-size: 24px;
      line-height: 1;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 32px;
    }
    .actions {
      display: flex;
      gap: 16px;
    }
    .btn-primary {
      flex: 1;
      height: 72px;
      background-color: #1e293b;
      color: #ffffff;
      border: none;
      border-radius: 16px;
      font-size: 24px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .btn-heart {
      width: 72px;
      height: 72px;
      background-color: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="image-container">
      ${data.image ? `<img src="${data.image}" alt="Propiedad" crossorigin="anonymous" />` : ''}
      <div class="badge">${data.operationType}</div>
    </div>
    <div class="content">
      <h1 class="title">${cleanTitle(data.title) || 'Propiedad'}</h1>
      ${data.location ? `
        <div class="location">
          ${locationIcon}
          <span>${data.location}</span>
        </div>
      ` : ''}
      <div class="features">
        ${features.join('')}
      </div>
      ${data.tags && data.tags.length > 0 ? `
        <div style="margin-bottom: 36px;">
          ${data.tags.map(tag => `
            <span style="display: inline-block; padding: 14px 26px; border-radius: 999px; background-color: #1e293b; color: #ffffff; font-size: 22px; font-weight: 600; line-height: 1; margin-right: 12px; margin-bottom: 12px;">${tag}</span>
          `).join('')}
        </div>
      ` : ''}
      <div style="display: flex; justify-content: center; margin-top: 44px;">
        <img src="${LOGO_URL}" alt="Los Pinares" style="height: 110px; object-fit: contain;" crossorigin="anonymous">
      </div>
    </div>
  </div>
</body>
</html>`
}
