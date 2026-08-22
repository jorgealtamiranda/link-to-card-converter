# Link to Card Converter

Aplicación Next.js para convertir publicaciones inmobiliarias en tarjetas.

## Arquitectura

El pipeline tiene dos etapas separadas, igual que `pinares-to-carrousel`:

1. **`POST /api/scrape`** — extracción **determinista** con cheerio sobre los
   selectores de Houzez (`#property-detail-wrap`, `#property-address-wrap`,
   `#pills-gallery`). Sin IA: dormitorios, baños, m², ciudad, provincia,
   amenities e imagen se leen de selectores exactos. Solo acepta el dominio
   configurado en `ALLOWED_DOMAIN` (403 en cualquier otro).
2. **`POST /api/process-ai`** — recibe esos datos ya tipados y **solo redacta**:
   título de la tarjeta, ubicación normalizada y etiquetas. Usa un `system`
   prompt con reglas escritas contra el layout de la tarjeta (no repetir la
   operación, que ya está en el badge; no repetir la localidad, que va aparte;
   no meter dormitorios/baños/m² en las etiquetas, que ya son chips).

Si la etapa 2 falla, la tarjeta igual se muestra con los datos del scraper y el
título original: los datos duros ya son correctos y el editor permite corregir
el copy a mano.

## Desarrollo local

1. Instala las dependencias: `pnpm install`.
2. Copia `.env.example` como `.env.local` y define `GROQ_API_KEY` con una clave de [GroqCloud](https://console.groq.com/keys).
3. Ejecuta `pnpm dev` y abre [http://localhost:3000](http://localhost:3000).

El servidor usa `openai/gpt-oss-120b`, reemplazo recomendado por Groq para el modelo retirado `llama-3.3-70b-versatile`.

## Deploy en Vercel

1. Sube este directorio a un repositorio de GitHub, GitLab o Bitbucket.
2. Impórtalo desde el panel de Vercel; Vercel detectará Next.js y usará `pnpm build`.
3. En **Settings → Environment Variables**, agrega `GROQ_API_KEY` para Production, Preview y Development según corresponda.
4. Haz el deploy. La variable queda disponible únicamente en las rutas de servidor y no se expone al navegador.

También puedes desplegar desde la terminal con `pnpm dlx vercel` tras iniciar sesión en Vercel.
