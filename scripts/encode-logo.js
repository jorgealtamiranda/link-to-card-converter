import fs from 'fs';
import path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'logo-lospinares.png');
const imageBuffer = fs.readFileSync(logoPath);
const base64 = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

const tsContent = `export const LOGO_BASE64 = "${dataUrl}";\n`;
fs.writeFileSync(path.join(process.cwd(), 'lib', 'logo-base64.ts'), tsContent);
console.log('Logo encoded to base64 successfully');
