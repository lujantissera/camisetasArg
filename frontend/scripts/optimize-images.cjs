// Redimensiona y comprime las fotos de producto in-place. Las fotos originales (de celular,
// varios MB cada una) no necesitan más de ~900px de ancho para verse nítidas en una card de
// producto — este script achica el peso sin que se note la diferencia visual.
// Uso: node scripts/optimize-images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '../public/images/products');
const MAX_WIDTH = 900;
const JPEG_QUALITY = 78;

async function main() {
  const products = fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory());
  let totalBefore = 0;
  let totalAfter = 0;

  for (const dir of products) {
    const folder = path.join(ROOT, dir.name);
    const files = fs.readdirSync(folder).filter(f => /\.jpe?g$/i.test(f));

    for (const file of files) {
      const filePath = path.join(folder, file);
      try {
        const before = fs.statSync(filePath).size;

        const buffer = await sharp(filePath)
          .rotate() // respeta la orientación EXIF antes de resizear
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toBuffer();

        // Escribe en un archivo temporal y renombra — más resistente a locks de OneDrive
        // que sobreescribir directo el archivo original.
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, buffer);
        fs.renameSync(tmpPath, filePath);

        const after = buffer.length;
        totalBefore += before;
        totalAfter += after;
        console.log(`${dir.name}/${file}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
      } catch (err) {
        console.warn(`⚠️ Salteado ${dir.name}/${file}: ${err.message}`);
      }
    }
  }

  console.log(
    `\n✅ Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB ` +
    `(-${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}%)`
  );
}

main().catch(err => {
  console.error('❌', err);
  process.exitCode = 1;
});
