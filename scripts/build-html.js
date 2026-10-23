/**
 * GARAPAN-FIFO - Automated HTML Partials Compiler
 * Menggabungkan index.template.html + partials menjadi index.html siap pakai.
 *
 * Jalankan via: npm run build:html
 */

const fs = require('fs');
const path = require('path');

function buildHtml() {
  const publicDir = path.resolve(__dirname, '../public');
  const templatePath = path.join(publicDir, 'index.template.html');
  const outputPath = path.join(publicDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file tidak ditemukan di: ${templatePath}`);
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // Regex to match <!-- @include path/to/file.html -->
  const includeRegex = /<!--\s*@include\s+([^\s]+)\s*-->/g;

  content = content.replace(includeRegex, (match, relPath) => {
    const fullPath = path.join(publicDir, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File partial yang di-include tidak ditemukan: ${fullPath}`);
    }
    const partial = fs.readFileSync(fullPath, 'utf8').trim();
    return partial;
  });

  fs.writeFileSync(outputPath, content, 'utf8');
  return {
    templateLines: fs.readFileSync(templatePath, 'utf8').split('\n').length,
    outputLines: content.split('\n').length,
  };
}

if (require.main === module) {
  try {
    const res = buildHtml();
    console.log(`✔ [HTML Compiler] Berhasil merangkai HTML!`);
    console.log(`   - Template utama: ${res.templateLines} baris`);
    console.log(`   - Hasil compile:  ${res.outputLines} baris`);
  } catch (err) {
    console.error(`✖ [HTML Compiler Error]:`, err.message);
    process.exit(1);
  }
}

module.exports = { buildHtml };

