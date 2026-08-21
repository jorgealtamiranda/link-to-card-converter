import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const logoPath = join(process.cwd(), "public", "logo-lospinares.png")
const base64 = readFileSync(logoPath).toString("base64")
const dataUrl = `data:image/png;base64,${base64}`

writeFileSync(
  join(process.cwd(), "lib", "logo-base64.ts"),
  `// Auto-generated - do not edit\nexport const logoBase64 = "${dataUrl}"\n`
)

console.log("Logo encoded successfully")
