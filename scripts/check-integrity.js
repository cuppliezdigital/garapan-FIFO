/**
 * GARAPAN-FIFO - Automated System Integrity & DOM Hierarchy Guard
 * Memastikan tidak ada tag HTML bocor/mismatch, semua aset terhubung, dan tata letak aman.
 *
 * Jalankan via: npm test  atau  npm run check
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const INDEX_HTML = path.join(PUBLIC_DIR, 'index.html');
const STYLE_CSS = path.join(PUBLIC_DIR, 'style.css');
const THEMES_CSS = path.join(PUBLIC_DIR, 'themes-retro.css');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(msg) {
  console.log(`${colors.green}✔${colors.reset} ${msg}`);
}

function fail(msg) {
  console.error(`${colors.red}✖ ${colors.bold}${msg}${colors.reset}`);
}

function warn(msg) {
  console.warn(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

let totalErrors = 0;

console.log(`\n${colors.bold}${colors.cyan}=======================================================`);
console.log(` 🛡️  GARAPAN-FIFO: AUTOMATED INTEGRITY & DOM GUARD `);
console.log(`=======================================================${colors.reset}\n`);

// -----------------------------------------------------------------------------
// 1. CEK KEBERADAAN FILE UTAMA
// -----------------------------------------------------------------------------
console.log(`${colors.bold}[1/4] Memeriksa Integritas File Inti...${colors.reset}`);
const requiredFiles = [
  INDEX_HTML,
  STYLE_CSS,
  THEMES_CSS,
  path.join(PUBLIC_DIR, 'script.js'),
  path.join(PUBLIC_DIR, 'monitoring-view.js'),
  path.join(PUBLIC_DIR, 'fifo-report.js'),
  path.join(ROOT_DIR, 'backend', 'server.js'),
];

requiredFiles.forEach((file) => {
  const rel = path.relative(ROOT_DIR, file);
  if (fs.existsSync(file)) {
    pass(`File ditemukan: ${rel}`);
  } else {
    fail(`File TIDAK DITEMUKAN: ${rel}`);
    totalErrors++;
  }
});

// -----------------------------------------------------------------------------
// 2. CEK STRUKTUR & TAG HTML (PARSER FULL TREE)
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}[2/4] Memeriksa Keutuhan Tag HTML (Parser Non-Destructive)...${colors.reset}`);

const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

const voidTags = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

let pos = 0;
const len = htmlContent.length;
let stack = [];
let htmlErrors = [];
let advanceAncestry = null;
let fifoReportAncestry = null;

function getLineCol(offset) {
  const upTo = htmlContent.substring(0, offset);
  const lines = upTo.split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

while (pos < len) {
  if (htmlContent.startsWith('<!--', pos)) {
    const end = htmlContent.indexOf('-->', pos + 4);
    if (end === -1) break;
    pos = end + 3;
    continue;
  }

  if (htmlContent[pos] === '<') {
    const isClose = htmlContent[pos + 1] === '/';
    const tagStart = isClose ? pos + 2 : pos + 1;
    let nameEnd = tagStart;
    while (nameEnd < len && /[a-zA-Z0-9\-]/.test(htmlContent[nameEnd])) {
      nameEnd++;
    }
    const tagName = htmlContent.substring(tagStart, nameEnd).toLowerCase();

    if (!tagName) {
      pos++;
      continue;
    }

    let tagEnd = nameEnd;
    let inQuote = null;
    while (tagEnd < len) {
      const ch = htmlContent[tagEnd];
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
      } else {
        if (ch === '"' || ch === "'") inQuote = ch;
        else if (ch === '>') break;
      }
      tagEnd++;
    }

    const fullTag = htmlContent.substring(pos, tagEnd + 1);
    const selfClosing = fullTag.endsWith('/>') || voidTags.has(tagName);
    const { line, col } = getLineCol(pos);

    if (isClose) {
      if (stack.length === 0) {
        htmlErrors.push({ line, col, msg: `Tag penutup berlebih (stray) </${tagName}> saat stack sudah kosong.` });
      } else {
        const top = stack[stack.length - 1];
        if (top.tag === tagName) {
          stack.pop();
        } else {
          htmlErrors.push({
            line,
            col,
            msg: `Tag tidak cocok: Ditutup </${tagName}>, tetapi elemen yang masih terbuka adalah <${top.tag}> (dibuka di Baris ${top.line}:${top.col}).`
          });
          const idx = stack.map((s) => s.tag).lastIndexOf(tagName);
          if (idx !== -1) {
            stack.splice(idx, 1);
          }
        }
      }
    } else {
      if (tagName === 'script' || tagName === 'style') {
        const closeTag = `</${tagName}>`;
        const end = htmlContent.toLowerCase().indexOf(closeTag, tagEnd + 1);
        pos = end !== -1 ? end + closeTag.length : len;
        continue;
      }
      if (!selfClosing) {
        if (fullTag.includes('id="viewAdvance"')) {
          advanceAncestry = stack.map((s) => s.tag);
        }
        if (fullTag.includes('id="viewFifoReport"')) {
          fifoReportAncestry = stack.map((s) => s.tag);
        }
        stack.push({ tag: tagName, line, col, fullTag: fullTag.substring(0, 50).replace(/\r?\n/g, ' ') });
      }
    }

    pos = tagEnd + 1;
    continue;
  }

  pos++;
}

if (htmlErrors.length === 0 && stack.length === 0) {
  pass(`Keutuhan tag HTML sempurna: 0 tag error, 0 unclosed tag di akhir file.`);
} else {
  htmlErrors.forEach((e) => {
    fail(`Baris ${e.line}:${e.col} -> ${e.msg}`);
    totalErrors++;
  });
  if (stack.length > 0) {
    stack.forEach((s) => {
      fail(`Tag belum ditutup sampai akhir file: <${s.tag}> (dibuka di Baris ${s.line}:${s.col})`);
      totalErrors++;
    });
  }
}

// -----------------------------------------------------------------------------
// 3. CEK HIERARKI DOM KONTAINER UTAMA
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}[3/4] Memeriksa Hierarki Kontainer Utama (Cegah Layout Geser)...${colors.reset}`);

const expectedAncestry = ['html', 'body', 'div', 'div', 'main'];
function isCorrectAncestry(arr) {
  if (!arr) return false;
  const str = arr.join('>');
  return str.includes('html>body') && str.includes('main');
}

if (isCorrectAncestry(advanceAncestry)) {
  pass(`Hierarki #viewAdvance valid: Berada aman di dalam <main class="app-views-container">.`);
} else {
  fail(`Hierarki #viewAdvance RUSAK: Tidak berada di dalam <main>! Stack: ${advanceAncestry ? advanceAncestry.join(' > ') : 'TIDAK DITEMUKAN'}`);
  totalErrors++;
}

if (isCorrectAncestry(fifoReportAncestry)) {
  pass(`Hierarki #viewFifoReport valid: Berada aman di dalam <main class="app-views-container">.`);
} else {
  fail(`Hierarki #viewFifoReport RUSAK: Tidak berada di dalam <main>! Stack: ${fifoReportAncestry ? fifoReportAncestry.join(' > ') : 'TIDAK DITEMUKAN'}`);
  totalErrors++;
}

// Cek keberadaan 8 Sub-Tab Advance
const requiredAdvancePanes = [
  'viewReconcile',
  'viewKendaraan',
  'viewFeishuDoc',
  'viewJfs',
  'viewPto',
  'viewBarcodeGen',
  'viewPrintAwb',
  'viewWajibKirim'
];

let allPanesFound = true;
requiredAdvancePanes.forEach((id) => {
  if (!htmlContent.includes(`id="${id}"`)) {
    fail(`Sub-tab Advance #${id} tidak ditemukan di index.html!`);
    allPanesFound = false;
    totalErrors++;
  }
});
if (allPanesFound) {
  pass(`Semua 8 Sub-Tab Advance (Rekonsiliasi, Kendaraan, Feishu, JFS, PTO, Barcode, Cetak AWB, Wajib Kirim) lengkap.`);
}

// -----------------------------------------------------------------------------
// 4. CEK KESEIMBANGAN KURUNG CSS (BRACE BALANCE)
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}[4/4] Memeriksa Keseimbangan CSS & Asset Link...${colors.reset}`);

function checkCssBraces(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let open = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    else if (content[i] === '}') open--;
    if (open < 0) return false;
  }
  return open === 0;
}

if (checkCssBraces(STYLE_CSS)) {
  pass(`public/style.css: Kurung { } seimbang sempurna.`);
} else {
  fail(`public/style.css: Terdapat kurung kurawal { } yang tidak seimbang!`);
  totalErrors++;
}

if (checkCssBraces(THEMES_CSS)) {
  pass(`public/themes-retro.css: Kurung { } seimbang sempurna.`);
} else {
  fail(`public/themes-retro.css: Terdapat kurung kurawal { } yang tidak seimbang!`);
  totalErrors++;
}

// -----------------------------------------------------------------------------
// REKAP HASIL
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}=======================================================`);
if (totalErrors === 0) {
  console.log(`${colors.green}${colors.bold} 🎉 SELURUH CEK INTEGRITAS BERHASIL: 0 ERROR! SISTEM SEHAT. ${colors.reset}`);
  console.log(`${colors.cyan}=======================================================${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`${colors.red}${colors.bold} ❌ DITEMUKAN ${totalErrors} ERROR INTEGRITAS! MOHON PERBAIKI. ${colors.reset}`);
  console.log(`${colors.cyan}=======================================================${colors.reset}\n`);
  process.exit(1);
}
