# Link to Card Converter

Aplicación Next.js para convertir publicaciones inmobiliarias en tarjetas.

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
