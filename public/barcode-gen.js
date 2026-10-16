// ==========================================================================
// MODUL BARCODE GENERATOR - CODE 128 (J&T CARGO STANDARD)
// ==========================================================================

let activeBarcodeCanvas = null;

function initBarcodeGenerator() {
  const inputEl = document.getElementById('barcodeGenInput');
  const btnGen = document.getElementById('btnTriggerGenerateBarcode');
  const btnCopy = document.getElementById('btnCopyBarcodeImage');
  const btnDownload = document.getElementById('btnDownloadBarcodeImage');
  const btnPrint = document.getElementById('btnPrintBarcodeLabel');
  const btnClear = document.getElementById('btnClearBarcodeGen');
  const quickSamples = document.querySelectorAll('.quick-sample-barcode-btn');

  // Input listener realtime
  if (inputEl) {
    inputEl.addEventListener('input', () => {
      renderBarcodeFromInput();
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        renderBarcodeFromInput();
      }
    });
  }

  if (btnGen) {
    btnGen.addEventListener('click', () => {
      renderBarcodeFromInput();
    });
  }

  // Tombol Salin Gambar Barcode (Direct Copy PNG to Clipboard)
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const canvas = document.getElementById('barcodeSingleCanvas');
      if (!canvas) return;
      await copyBarcodeImageToClipboard(canvas, 'Barcode utama');
    });
  }

  // Tombol Unduh PNG
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const canvas = document.getElementById('barcodeSingleCanvas');
      if (!canvas) return;
      const text = (document.getElementById('barcodeGenInput')?.value || 'barcode').trim().split('\n')[0].trim();
      downloadBarcodeCanvas(canvas, `barcode_${text || 'jtcargo'}.png`);
    });
  }

  // Tombol Cetak / Print Label Simpel
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const canvas = document.getElementById('barcodeSingleCanvas');
      if (!canvas) return;
      const text = (document.getElementById('barcodeGenInput')?.value || '').trim().split('\n')[0].trim();
      printBarcodeCanvas(canvas, text);
    });
  }

  // Tombol Cetak Label Thermal PDF Resmi dari JFS
  const btnPrintOfficial = document.getElementById('btnPrintOfficialJfsPdf');
  if (btnPrintOfficial) {
    btnPrintOfficial.addEventListener('click', async () => {
      const inputEl = document.getElementById('barcodeGenInput');
      const rawInput = (inputEl?.value || '').trim().split(/[\n,;]+/)[0].trim();
      const raw = rawInput.length === 15 ? rawInput.slice(0, 12) : rawInput;
      if (!raw) {
        showAppAlert('Masukkan nomor resi waybill terlebih dahulu.', true);
        return;
      }

      const origHtml = btnPrintOfficial.innerHTML;
      btnPrintOfficial.disabled = true;
      btnPrintOfficial.innerHTML = `
        <svg class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Meminta PDF JFS...</span>
      `;

      try {
        const token = getToken();
        const res = await fetch('/api/jfs/print-waybill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ waybillNo: raw, type: [4, 5] })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal membuat URL PDF dari server JFS');
        }

        if (json.pdfUrl) {
          window.open(json.pdfUrl, '_blank');
          showAppAlert(`🖨️ Label PDF Resmi JFS untuk ${raw} berhasil dibuka! Siap dicetak.`);
        } else {
          throw new Error('Server JFS tidak mengembalikan URL PDF');
        }
      } catch (err) {
        showAppAlert(`Gagal mencetak label: ${err.message}`, true);
      } finally {
        btnPrintOfficial.disabled = false;
        btnPrintOfficial.innerHTML = origHtml;
      }
    });
  }

  // Tombol Clear
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
      renderBarcodeFromInput();
    });
  }

  // Quick sample buttons
  quickSamples.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.sample || '';
      if (inputEl) {
        inputEl.value = val;
        renderBarcodeFromInput();
      }
    });
  });

  // Tab switcher integration in Advance View
  const tabBtn = document.getElementById('tabBtnAdvanceBarcode');
  if (tabBtn) {
    tabBtn.addEventListener('click', () => {
      switchAdvanceToBarcodeTab();
      // Render initial sample if empty
      if (inputEl && !inputEl.value.trim()) {
        inputEl.value = '201827854164003';
        renderBarcodeFromInput();
      }
    });
  }
}

function switchAdvanceToBarcodeTab() {
  document.querySelectorAll('.advance-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.advance-pane').forEach(p => p.classList.add('hidden'));

  const tabBtn = document.getElementById('tabBtnAdvanceBarcode');
  const pane = document.getElementById('viewBarcodeGen');
  if (tabBtn) tabBtn.classList.add('active');
  if (pane) pane.classList.remove('hidden');
}

function renderBarcodeFromInput() {
  const inputEl = document.getElementById('barcodeGenInput');
  const singleContainer = document.getElementById('barcodeSingleResultCard');
  const batchContainer = document.getElementById('barcodeBatchResultList');
  const emptyState = document.getElementById('barcodeEmptyState');
  const countBadge = document.getElementById('barcodeItemsCountBadge');

  if (!inputEl) return;
  const raw = inputEl.value.trim();

  if (!raw) {
    if (singleContainer) singleContainer.classList.add('hidden');
    if (batchContainer) batchContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (countBadge) countBadge.textContent = '0 Barcode';
    return;
  }

  // Pisahkan multi-line atau koma
  const items = raw
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (items.length === 0) {
    if (singleContainer) singleContainer.classList.add('hidden');
    if (batchContainer) batchContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (countBadge) countBadge.textContent = '0 Barcode';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (countBadge) countBadge.textContent = `${items.length} Barcode`;

  if (items.length === 1) {
    // Mode Single Barcode (Card besar dengan tombol lengkap)
    if (singleContainer) singleContainer.classList.remove('hidden');
    if (batchContainer) batchContainer.classList.add('hidden');

    const canvas = document.getElementById('barcodeSingleCanvas');
    const labelText = document.getElementById('barcodeSingleLabelText');
    const charCount = document.getElementById('barcodeSingleCharCount');
    const item = items[0];

    if (labelText) labelText.textContent = item;
    if (charCount) charCount.textContent = `${item.length} Karakter (${item.length === 15 ? 'AWB + Koli' : 'AWB Standard'})`;

    if (canvas) {
      drawCode128Barcode(canvas, item, {
        width: 2.2,
        height: 85,
        displayValue: true,
        fontSize: 15,
        margin: 10,
      });
    }
  } else {
    // Mode Batch Multi-Barcode (List rapi dengan tombol salin per barcode)
    if (singleContainer) singleContainer.classList.add('hidden');
    if (batchContainer) batchContainer.classList.remove('hidden');
    if (batchContainer) batchContainer.innerHTML = '';

    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'barcode-batch-item-card';
      const canvasId = `barcodeBatchCanvas_${idx}`;

      card.innerHTML = `
        <div class="batch-card-left">
          <div class="batch-card-header">
            <span class="batch-num">#${idx + 1}</span>
            <strong class="batch-title font-mono">${escPtoHtml(item)}</strong>
            <span class="batch-tag">${item.length === 15 ? 'AWB + Koli' : 'Standard'}</span>
          </div>
          <div class="batch-canvas-wrap">
            <canvas id="${canvasId}"></canvas>
          </div>
        </div>
        <div class="batch-card-actions">
          <button type="button" class="btn-batch-jfs-pdf" data-val="${escPtoHtml(item)}" title="Cetak Label Thermal JFS (PDF)">
            <span>🖨️ PDF</span>
          </button>
          <button type="button" class="btn-batch-copy" data-canvas-id="${canvasId}" data-val="${escPtoHtml(item)}" title="Salin Gambar Barcode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Salin</span>
          </button>
          <button type="button" class="btn-batch-download" data-canvas-id="${canvasId}" data-val="${escPtoHtml(item)}" title="Unduh PNG">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      `;

      if (batchContainer) batchContainer.appendChild(card);

      const canvas = document.getElementById(canvasId);
      if (canvas) {
        drawCode128Barcode(canvas, item, {
          width: 1.8,
          height: 60,
          displayValue: true,
          fontSize: 13,
          margin: 6,
        });
      }
    });

    // Event listener untuk tombol di batch
    batchContainer.querySelectorAll('.btn-batch-jfs-pdf').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.val || '';
        const cleanWb = val.length === 15 ? val.slice(0, 12) : val.trim();
        if (!cleanWb) return;

        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>⏳...</span>';

        try {
          const token = getToken();
          const res = await fetch('/api/jfs/print-waybill', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ waybillNo: cleanWb, type: [4, 5] })
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Gagal membuat URL PDF dari server JFS');
          }

          if (json.pdfUrl) {
            window.open(json.pdfUrl, '_blank');
            showAppAlert(`🖨️ Label PDF Resmi JFS untuk ${cleanWb} berhasil dibuka!`);
          } else {
            throw new Error('Server JFS tidak mengembalikan URL PDF');
          }
        } catch (err) {
          showAppAlert(`Gagal mencetak label: ${err.message}`, true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      });
    });

    batchContainer.querySelectorAll('.btn-batch-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.dataset.canvasId;
        const val = btn.dataset.val;
        const canvas = document.getElementById(cId);
        if (canvas) await copyBarcodeImageToClipboard(canvas, val);
      });
    });

    batchContainer.querySelectorAll('.btn-batch-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.dataset.canvasId;
        const val = btn.dataset.val;
        const canvas = document.getElementById(cId);
        if (canvas) downloadBarcodeCanvas(canvas, `barcode_${val}.png`);
      });
    });
  }
}

// Fungsi utama menggambar Barcode Code 128
function drawCode128Barcode(canvas, text, opts = {}) {
  if (!canvas || !text) return;
  const cleanText = String(text).trim();
  if (!cleanText) return;

  if (window.JsBarcode) {
    try {
      JsBarcode(canvas, cleanText, {
        format: 'CODE128',
        width: opts.width || 2,
        height: opts.height || 75,
        displayValue: opts.displayValue !== false,
        text: cleanText,
        fontSize: opts.fontSize || 14,
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 4,
        background: '#ffffff',
        lineColor: '#000000',
        margin: opts.margin || 8,
      });
    } catch (err) {
      console.warn('JsBarcode render error:', err.message);
    }
  }
}

// Fungsi reusable untuk komponen lain (Modal Monitoring & PTO)
window.renderGlobalWaybillBarcode = function(canvasSelector, waybillNumber, options = {}) {
  const canvas = typeof canvasSelector === 'string' ? document.querySelector(canvasSelector) : canvasSelector;
  if (!canvas) return;
  drawCode128Barcode(canvas, waybillNumber, options);
};

window.copyBarcodeImageToClipboard = copyBarcodeImageToClipboard;
window.downloadBarcodeCanvas = downloadBarcodeCanvas;
window.printBarcodeCanvas = printBarcodeCanvas;

// Copy gambar barcode langsung ke clipboard pengguna (Format PNG)
async function copyBarcodeImageToClipboard(canvas, label = 'Barcode') {
  if (!canvas) return;
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showAppAlert('Gagal membuat gambar barcode.', true);
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showAppAlert(`📋 Gambar Barcode "${label}" berhasil disalin ke clipboard! Siap di-paste ke WhatsApp / Excel.`);
        } else {
          throw new Error('Clipboard API image tidak didukung browser ini.');
        }
      } catch (clipErr) {
        // Fallback untuk browser yang membatasi direct image copy
        try {
          await navigator.clipboard.writeText(label);
          showAppAlert(`📋 Teks resi "${label}" disalin ke clipboard! (Browser membatasi salin gambar langsung, gunakan tombol Unduh).`);
        } catch (txtErr) {
          showAppAlert(`Gagal menyalin barcode: ${clipErr.message}`, true);
        }
      }
    }, 'image/png');
  } catch (err) {
    showAppAlert(`Gagal memproses salin barcode: ${err.message}`, true);
  }
}

// Unduh gambar barcode sebagai PNG
function downloadBarcodeCanvas(canvas, filename = 'barcode.png') {
  if (!canvas) return;
  try {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAppAlert(`⬇️ Berhasil mengunduh ${filename}`);
  } catch (err) {
    showAppAlert(`Gagal mengunduh barcode: ${err.message}`, true);
  }
}

// Cetak label barcode langsung ke printer (Format thermal friendly)
function printBarcodeCanvas(canvas, text = '') {
  if (!canvas) return;
  try {
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank', 'width=450,height=350');
    if (!printWindow) {
      showAppAlert('Popup terblokir oleh browser. Izinkan popup untuk mencetak.', true);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Barcode - ${text}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 10px;
              margin: 0;
            }
            .print-card {
              text-align: center;
              border: 1px dashed #999;
              padding: 15px;
              border-radius: 6px;
            }
            .brand-tag {
              font-size: 11px;
              font-weight: bold;
              color: #555;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            img {
              max-width: 100%;
              height: auto;
              image-rendering: pixelated;
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            <div class="brand-tag">J&T Cargo • Resi / Koli</div>
            <img src="${imgData}" alt="${text}" />
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    showAppAlert(`Gagal mencetak: ${err.message}`, true);
  }
}

// Inisialisasi saat DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBarcodeGenerator);
} else {
  initBarcodeGenerator();
}
