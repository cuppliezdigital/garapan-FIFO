// ==========================================================================
// MODUL ADVANCE VIEW: PUSAT CETAK AWB & KOLIAN RESMI JFS
// Mendukung Resi Utama, Label Kolian, dan Resi Lengkap dengan Kolom TTD
// ==========================================================================

let printAwbState = {
  currentItems: [],
  selectedType: [4, 5],
  results: [],
  isLoading: false,
};

let printAwbListenersInitialized = false;

function escAwbHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

function initPrintAwbModule() {
  initPrintAwbListeners();
}

function initPrintAwbListeners() {
  if (printAwbListenersInitialized) return;

  const inputEl = document.getElementById('printAwbInput');
  const countBadge = document.getElementById('printAwbCountBadge');
  const btnClear = document.getElementById('btnClearPrintAwb');
  const btnGenerate = document.getElementById('btnGenerateAwbPrint');
  const typeCards = document.querySelectorAll('.print-type-card');
  const sampleBtns = document.querySelectorAll('.btn-print-sample');
  const btnOpenAll = document.getElementById('btnOpenAllPdfs');
  const btnCopyAll = document.getElementById('btnCopyAllPdfUrls');

  if (!inputEl || !btnGenerate) {
    return;
  }

  printAwbListenersInitialized = true;

  const updateCount = () => {
    const val = inputEl.value.trim();
    if (!val) {
      if (countBadge) countBadge.classList.add('hidden');
      return;
    }
    const items = val.split(/[\s,;\n\t]+/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      if (countBadge) {
        countBadge.textContent = `${items.length} Resi Terdeteksi`;
        countBadge.classList.remove('hidden');
      }
    } else {
      if (countBadge) countBadge.classList.add('hidden');
    }
  };

  inputEl.addEventListener('input', updateCount);
  inputEl.addEventListener('paste', () => setTimeout(updateCount, 60));

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeAwbPrintGeneration();
    }
  });

  // Type selector
  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        const valStr = radio.value;
        if (valStr === 'retur') {
          printAwbState.selectedType = 'retur';
        } else {
          printAwbState.selectedType = valStr.split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
        }
      }
    });
  });

  // Quick samples
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset.sample || '';
      const sampleType = btn.dataset.type;
      inputEl.value = sample;
      inputEl.dispatchEvent(new Event('input'));
      if (sampleType === 'retur') {
        const returCard = document.getElementById('cardTypeRetur');
        if (returCard) returCard.click();
      }
      inputEl.focus();
    });
  });

  // Clear button
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      inputEl.value = '';
      if (countBadge) countBadge.classList.add('hidden');
      clearPrintAwbResults();
      inputEl.focus();
    });
  }

  // Generate button
  btnGenerate.addEventListener('click', () => {
    executeAwbPrintGeneration();
  });

  // Open all PDFs button
  if (btnOpenAll) {
    btnOpenAll.addEventListener('click', () => {
      const validResults = (printAwbState.results || []).filter(r => r.success && r.pdfUrl);
      if (!validResults.length) {
        if (typeof showAppAlert === 'function') {
          showAppAlert('Tidak ada file PDF yang siap dibuka.', true);
        } else {
          alert('Tidak ada file PDF yang siap dibuka.');
        }
        return;
      }

      if (validResults.length > 10) {
        if (!confirm(`Ada ${validResults.length} tab PDF yang akan dibuka. Lanjutkan?`)) {
          return;
        }
      }

      validResults.forEach((r, idx) => {
        setTimeout(() => {
          window.open(r.pdfUrl, '_blank');
        }, idx * 150);
      });
      if (typeof showAppAlert === 'function') {
        showAppAlert(`Membuka ${validResults.length} tab label PDF JFS...`);
      }
    });
  }

  // Copy all PDF URLs
  if (btnCopyAll) {
    btnCopyAll.addEventListener('click', () => {
      const validResults = (printAwbState.results || []).filter(r => r.success && r.pdfUrl);
      if (!validResults.length) {
        if (typeof showAppAlert === 'function') {
          showAppAlert('Tidak ada URL PDF yang bisa disalin.', true);
        } else {
          alert('Tidak ada URL PDF yang bisa disalin.');
        }
        return;
      }
      const text = validResults.map(r => `${r.waybillNo}: ${r.pdfUrl}`).join('\n');
      navigator.clipboard.writeText(text);
      if (typeof showAppAlert === 'function') {
        showAppAlert(`Seluruh ${validResults.length} link PDF berhasil disalin ke clipboard.`);
      } else {
        alert(`${validResults.length} link PDF disalin.`);
      }
    });
  }

  // Print all thermal retur labels button
  const btnPrintAllThermal = document.getElementById('btnPrintAllThermalRetur');
  if (btnPrintAllThermal) {
    btnPrintAllThermal.addEventListener('click', () => {
      const validReturList = (printAwbState.results || [])
        .filter(r => r.success && (r.returData || r.canPrintThermal))
        .map(r => r.returData || { waybillNo: r.waybillNo });
      if (!validReturList.length) {
        if (typeof showAppAlert === 'function') {
          showAppAlert('Tidak ada label thermal retur yang siap dicetak.', true);
        } else {
          alert('Tidak ada label thermal retur yang siap dicetak.');
        }
        return;
      }
      printAllThermalReturLabels(validReturList);
    });
  }
}

function clearPrintAwbResults() {
  printAwbState.results = [];
  const listEl = document.getElementById('printAwbResultsList');
  const toolbar = document.getElementById('printAwbSummaryToolbar');
  const emptyState = document.getElementById('printAwbEmptyState');

  if (listEl) {
    listEl.innerHTML = '';
    listEl.classList.add('hidden');
  }
  if (toolbar) toolbar.classList.add('hidden');
  if (emptyState) emptyState.classList.remove('hidden');
}

async function executeAwbPrintGeneration() {
  const inputEl = document.getElementById('printAwbInput');
  const btnGenerate = document.getElementById('btnGenerateAwbPrint');
  if (!inputEl) return;

  const raw = inputEl.value.trim();
  if (!raw) {
    if (typeof showAppAlert === 'function') {
      showAppAlert('Silakan masukkan nomor resi waybill terlebih dahulu.', true);
    } else {
      alert('Silakan masukkan nomor resi waybill terlebih dahulu.');
    }
    inputEl.focus();
    return;
  }

  // Split multiple lines, spaces, commas, semicolons
  const items = raw
    .split(/[\s,;\n\t]+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!items.length) {
    if (typeof showAppAlert === 'function') {
      showAppAlert('Format nomor resi tidak valid.', true);
    }
    return;
  }

  // Read selected radio value
  const checkedRadio = document.querySelector('input[name="printDocType"]:checked');
  let selectedType = [4, 5];
  let isRetur = false;
  if (checkedRadio && checkedRadio.value) {
    if (checkedRadio.value === 'retur') {
      selectedType = 'retur';
      isRetur = true;
    } else {
      selectedType = checkedRadio.value.split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
    }
  }
  printAwbState.selectedType = selectedType;

  const origBtnHtml = btnGenerate ? btnGenerate.innerHTML : '';
  if (btnGenerate) {
    btnGenerate.disabled = true;
    btnGenerate.innerHTML = `
      <svg class="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="animation: spin 1s linear infinite;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Menghubungi Server JFS (${items.length} Resi)...</span>
    `;
  }

  try {
    const token = typeof getToken === 'function' ? getToken() : (sessionStorage.getItem('monitoring_jwt') || localStorage.getItem('token'));
    const res = await fetch('/api/jfs/print-waybill', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        waybillNos: items,
        type: selectedType,
        isRetur: isRetur
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menghasilkan URL PDF dari server JFS');
    }

    printAwbState.results = json.results || [];
    renderPrintAwbResults(printAwbState.results, selectedType);
    if (typeof showAppAlert === 'function') {
      showAppAlert(`Berhasil memproses ${printAwbState.results.length} resi dari server resmi JFS.`);
    }
  } catch (err) {
    console.error('executeAwbPrintGeneration error:', err);
    if (typeof showAppAlert === 'function') {
      showAppAlert(`Gagal menarik label: ${err.message}`, true);
    } else {
      alert(`Gagal menarik label: ${err.message}`);
    }
  } finally {
    if (btnGenerate) {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = origBtnHtml;
    }
  }
}

function getPrintTypeName(typeArray) {
  if (typeArray === 'retur') return 'Label AWB Retur (Pengembalian)';
  const str = Array.isArray(typeArray) ? typeArray.join(',') : String(typeArray || '');
  if (str === 'retur') return 'Label AWB Retur (Pengembalian)';
  if (str === '4,5') return 'Resi Utama + Semua Kolian';
  if (str === '4') return 'Resi Utama Saja';
  if (str === '5') return 'Label Kolian Saja';
  if (str === '2') return 'Resi Lengkap + Kolom TTD';
  if (str === '1') return 'Surat Jalan / Manifest A4';
  return 'Label Thermal Standar';
}

function renderPrintAwbResults(results = [], selectedType = [4, 5]) {
  const listEl = document.getElementById('printAwbResultsList');
  const toolbar = document.getElementById('printAwbSummaryToolbar');
  const emptyState = document.getElementById('printAwbEmptyState');
  const statusText = document.getElementById('printSummaryStatusText');

  if (!listEl) return;

  if (!results.length) {
    listEl.classList.add('hidden');
    if (toolbar) toolbar.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (toolbar) toolbar.classList.remove('hidden');
  listEl.classList.remove('hidden');

  const hasThermalRetur = results.some(r => r.returData || r.canPrintThermal || r.isRetur);
  const btnPrintAllThermal = document.getElementById('btnPrintAllThermalRetur');
  if (btnPrintAllThermal) {
    if (hasThermalRetur) {
      btnPrintAllThermal.classList.remove('hidden');
    } else {
      btnPrintAllThermal.classList.add('hidden');
    }
  }

  const readyCount = results.filter(r => r.success && (r.pdfUrl || r.canPrintThermal || r.returData)).length;
  if (statusText) {
    statusText.textContent = `Siap Dicetak: ${readyCount} dari ${results.length} Resi (${getPrintTypeName(selectedType)})`;
  }

  let html = '';
  results.forEach((item, idx) => {
    const isReturItem = Boolean(item.isRetur || item.returData || item.canPrintThermal || selectedType === 'retur');
    const isOk = item.success && (item.pdfUrl || item.canPrintThermal || item.returData);

    let statusBadgeHtml = '<span class="print-status-badge status-fail">Gagal</span>';
    if (isOk) {
      if (item.pdfUrl) {
        statusBadgeHtml = '<span class="print-status-badge status-ready" style="background: rgba(16, 185, 129, 0.22); color: #10b981; border: 1px solid #10b981;">PDF RESMI JFS</span>';
      } else if (isReturItem) {
        statusBadgeHtml = '<span class="print-status-badge badge-retur">Thermal Retur Siap</span>';
      } else {
        statusBadgeHtml = '<span class="print-status-badge status-ready">Siap Cetak</span>';
      }
    }

    const rData = item.returData;

    html += `
      <div class="print-result-card ${isOk ? 'is-success' : 'is-error'} ${isReturItem ? 'is-retur-card' : ''}">
        <div class="print-card-main">
          <div class="print-card-idx">#${idx + 1}</div>
          <div class="print-card-info">
            <div class="print-card-top-row">
              <strong class="print-card-waybill font-mono">${escAwbHtml(item.waybillNo)}</strong>
              ${statusBadgeHtml}
              <span class="print-type-tag">${isReturItem ? 'Label Retur (Pengembalian)' : getPrintTypeName(selectedType)}</span>
            </div>

            ${rData ? `
              <div class="print-card-retur-details">
                <div class="retur-route-pill">
                  <span class="route-point apply-point font-mono"><b>${escAwbHtml(rData.applyNetwork || '-')}</b> (${escAwbHtml(rData.senderCity || 'Outlet Asal')})</span>
                  <span class="route-sep">&#10132;</span>
                  <span class="route-point dest-point font-mono"><b>${escAwbHtml(rData.destNetwork || '-')}</b> (${escAwbHtml(rData.receiverCity || 'Tujuan')})</span>
                </div>
                <div class="retur-parties-grid">
                  <div class="retur-party-box">
                    <small class="party-label">Penerima Retur (Pengirim Asal):</small>
                    <strong class="party-name">${escAwbHtml(rData.receiverName || '-')}</strong>
                    <span class="party-addr truncate" title="${escAwbHtml(rData.receiverAddress || '')}">${escAwbHtml(rData.receiverAddress || '-')}</span>
                  </div>
                  <div class="retur-party-box">
                    <small class="party-label">Pengirim Retur (Outlet Pengembali):</small>
                    <strong class="party-name">${escAwbHtml(rData.senderName || '-')}</strong>
                    <span class="party-addr truncate" title="${escAwbHtml(rData.senderAddress || '')}">${escAwbHtml(rData.senderAddress || '-')}</span>
                  </div>
                </div>
                <div class="retur-meta-row">
                  <span class="retur-chip chip-reason">Alasan: <b>${escAwbHtml(rData.reason || 'PENGEMBALIAN')}</b></span>
                  <span class="retur-chip">Berat: <b>${rData.weight || 0} kg</b></span>
                  <span class="retur-chip">Ongkir: <b>Rp ${Number(rData.freight || 0).toLocaleString('id-ID')}</b></span>
                  ${rData.orderSource ? `<span class="retur-chip chip-source">${escAwbHtml(rData.orderSource)}</span>` : ''}
                  ${rData.applyTime ? `<span class="retur-chip text-muted">${escAwbHtml(rData.applyTime)}</span>` : ''}
                </div>
              </div>
            ` : ''}

            ${item.pdfUrl ? `
              <div class="print-card-link-preview font-mono text-muted truncate" style="margin-top:4px;">
                <b style="color:#10b981;">PDF Asli JFS:</b> ${escAwbHtml(item.pdfUrl)}
              </div>
            ` : ''}

            ${!item.pdfUrl && !rData && isOk ? `
              <div class="print-card-link-preview font-mono text-muted truncate">Siap dicetak</div>
            ` : ''}

            ${!isOk ? `
              <div class="print-card-error-text text-rose">${escAwbHtml(item.error || 'Gagal mengambil data dari server JFS')}</div>
            ` : ''}
          </div>
        </div>

        <div class="print-card-actions">
          ${isReturItem && isOk ? `
            ${item.pdfUrl ? `
              <button type="button" class="btn-print-open-pdf" data-url="${escAwbHtml(item.pdfUrl)}" data-wb="${escAwbHtml(item.waybillNo)}" title="Buka PDF Resmi Asli dari Server JFS" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #10b981;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect width="12" height="8" x="6" y="14"/>
                </svg>
                <span>Buka PDF Asli JFS</span>
              </button>
              <button type="button" class="btn-print-copy-url" data-url="${escAwbHtml(item.pdfUrl)}" title="Salin Link PDF Resmi JFS">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>Salin Link</span>
              </button>
              <button type="button" class="btn-print-thermal-retur" data-wb="${escAwbHtml(item.waybillNo)}" title="Cetak Format Thermal Mandiri (100x100 mm)" style="background: rgba(148, 163, 184, 0.15); border-color: rgba(148, 163, 184, 0.3); color: #cbd5e1;">
                <span>Thermal Mandiri (100x100)</span>
              </button>
            ` : `
              <button type="button" class="btn-print-thermal-retur" data-wb="${escAwbHtml(item.waybillNo)}" title="Cetak Label Thermal Retur (100x100 mm)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect width="12" height="8" x="6" y="14"/>
                </svg>
                <span>Cetak Thermal Retur (100x100)</span>
              </button>
            `}
          ` : isOk ? `
            <button type="button" class="btn-print-open-pdf" data-url="${escAwbHtml(item.pdfUrl)}" data-wb="${escAwbHtml(item.waybillNo)}" title="Buka PDF di Tab Baru">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect width="12" height="8" x="6" y="14"/>
              </svg>
              <span>Buka PDF</span>
            </button>
            <button type="button" class="btn-print-copy-url" data-url="${escAwbHtml(item.pdfUrl)}" title="Salin Link PDF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Salin Link</span>
            </button>
          ` : `
            <button type="button" class="btn-print-retry-single" data-wb="${escAwbHtml(item.waybillNo)}" title="Coba Tarik Ulang">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span>Coba Lagi</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;

  // Bind click listeners
  listEl.querySelectorAll('.btn-print-open-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      const wb = btn.dataset.wb;
      if (url) {
        window.open(url, '_blank');
        if (typeof showAppAlert === 'function') {
          showAppAlert(`Membuka label PDF untuk ${wb}...`);
        }
      }
    });
  });

  listEl.querySelectorAll('.btn-print-copy-url').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (url) {
        navigator.clipboard.writeText(url);
        if (typeof showAppAlert === 'function') {
          showAppAlert('Link PDF label resmi berhasil disalin ke clipboard.');
        } else {
          alert('Link PDF disalin.');
        }
      }
    });
  });

  listEl.querySelectorAll('.btn-print-thermal-retur').forEach(btn => {
    btn.addEventListener('click', () => {
      const wb = btn.dataset.wb;
      const item = (printAwbState.results || []).find(r => r.waybillNo === wb);
      if (item && item.returData) {
        printThermalReturLabel(item.returData);
      } else {
        printThermalReturLabel({ waybillNo: wb });
      }
    });
  });

  listEl.querySelectorAll('.btn-print-retry-single').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wb = btn.dataset.wb;
      if (!wb) return;
      btn.disabled = true;
      btn.innerHTML = 'Menarik...';
      try {
        const token = typeof getToken === 'function' ? getToken() : (sessionStorage.getItem('monitoring_jwt') || localStorage.getItem('token'));
        const isRetur = printAwbState.selectedType === 'retur';
        const res = await fetch('/api/jfs/print-waybill', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            waybillNo: wb,
            type: printAwbState.selectedType,
            isRetur: isRetur
          })
        });
        const json = await res.json();
        if (json.success && (json.pdfUrl || json.canPrintThermal || json.returData)) {
          const idx = printAwbState.results.findIndex(r => r.waybillNo === wb);
          const newItem = {
            waybillNo: wb,
            success: true,
            pdfUrl: json.pdfUrl || null,
            isRetur: json.isRetur || isRetur,
            canPrintThermal: json.canPrintThermal,
            returData: json.returData || null
          };
          if (idx !== -1) {
            printAwbState.results[idx] = newItem;
          } else {
            printAwbState.results.push(newItem);
          }
          renderPrintAwbResults(printAwbState.results, printAwbState.selectedType);
          if (typeof showAppAlert === 'function') {
            showAppAlert(`Berhasil memproses resi ${wb}`);
          }
        } else {
          throw new Error(json.error || 'Server JFS menolak');
        }
      } catch (e) {
        if (typeof showAppAlert === 'function') {
          showAppAlert(`Gagal: ${e.message}`, true);
        }
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Coba Lagi</span>
        `;
      }
    });
  });
}

// ==========================================================================
// PENCETAKAN THERMAL LABEL RETUR (100x100 MM MANDIRI STANDAR J&T CARGO)
// ==========================================================================

function generateBarcodeBase64(text) {
  if (!text) return '';
  try {
    const canvas = document.createElement('canvas');
    if (window.JsBarcode) {
      window.JsBarcode(canvas, String(text).trim(), {
        format: 'CODE128',
        width: 2.1,
        height: 44,
        displayValue: true,
        fontSize: 15,
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 3,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 4
      });
      return canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('Barcode gen warning:', e);
  }
  return '';
}

function renderSingleThermalReturHtml(retur = {}) {
  const wb = escAwbHtml(retur.waybillNo || '');
  const barcodeUrl = generateBarcodeBase64(wb);
  const orderSource = escAwbHtml(retur.orderSource || 'TikTok');
  const applyNet = escAwbHtml(retur.applyNetwork || 'PMS001A');
  const destNet = escAwbHtml(retur.destNetwork || 'BGR011B');
  const senderName = escAwbHtml(retur.senderName || '-');
  const senderPhone = escAwbHtml(retur.senderPhone || retur.senderMobile || '');
  const senderAddr = escAwbHtml(retur.senderAddress || '-');
  const receiverName = escAwbHtml(retur.receiverName || '-');
  const receiverPhone = escAwbHtml(retur.receiverPhone || retur.receiverMobile || '');
  const receiverAddr = escAwbHtml(retur.receiverAddress || '-');
  const reason = escAwbHtml(retur.reason || 'MENOLAK');
  const problemCategory = escAwbHtml(retur.problemCategory || 'Kategori Pelanggan');
  const weight = Number(retur.weight || 1);
  const freight = Number(retur.freight || 0);
  const applyTime = escAwbHtml(retur.applyTime || new Date().toISOString().replace('T', ' ').slice(0, 19));
  const destCityCode = destNet.slice(0, 3) || 'BGR';
  const applyCityCode = applyNet.slice(0, 3) || 'PMS';

  return `
    <div class="jfs-official-label">
      <!-- Header Row -->
      <div class="jfs-header-row">
        <div class="jfs-header-meta">
          <div>waktu cetak:${applyTime}</div>
          <div>outlet pengirim:${applyNet}</div>
        </div>
        <div class="jfs-header-badge">
          <div class="jfs-badge-title">RETUR</div>
          <div class="jfs-badge-sub">FastTrack</div>
        </div>
      </div>

      <!-- Main Destination Code -->
      <div class="jfs-dest-code-row">
        <span class="jfs-dest-code-text">${destCityCode}-${destNet}-XX</span>
      </div>

      <!-- Transit Grid (Standard JFS 4 Columns) -->
      <div class="jfs-transit-grid">
        <div class="jfs-transit-col">
          <div class="jfs-transit-top">${applyCityCode}</div>
          <div class="jfs-transit-bot">G1</div>
        </div>
        <div class="jfs-transit-col">
          <div class="jfs-transit-top">MES</div>
          <div class="jfs-transit-bot">A02</div>
        </div>
        <div class="jfs-transit-col">
          <div class="jfs-transit-top">JKT</div>
          <div class="jfs-transit-bot">B13</div>
        </div>
        <div class="jfs-transit-col jfs-transit-dest">
          <div class="jfs-transit-top">${destCityCode}</div>
          <div class="jfs-transit-bot">D15</div>
        </div>
      </div>

      <!-- Freight, Settlement & Weight Row -->
      <div class="jfs-freight-row">
        <div class="jfs-freight-col">
          <div class="jfs-freight-type">Bulanan (Ongkir Retur)</div>
          <div class="jfs-freight-amt">Rp.${freight.toLocaleString('id-ID')}.00</div>
        </div>
        <div class="jfs-koli-col">
          <div class="jfs-koli-count">001/001</div>
          <div class="jfs-koli-weight">${weight.toFixed(2)}kg / 0.003m³</div>
        </div>
      </div>

      <!-- Barcode Section -->
      <div class="jfs-barcode-section">
        ${barcodeUrl ? `<img src="${barcodeUrl}" alt="${wb}" class="jfs-barcode-img">` : `<div style="font-size:18px;font-weight:900;font-family:monospace;">${wb}</div>`}
        <div class="jfs-barcode-subline">
          <span class="jfs-print-seq">cetakan ke-1</span>
          <span class="jfs-wb-center font-mono">Utama ${wb}</span>
          <span class="jfs-flag-right font-mono">RETUR</span>
        </div>
      </div>

      <!-- Address Box: TO, REASON, FROM -->
      <div class="jfs-address-container">
        <!-- TO -->
        <div class="jfs-addr-row jfs-to-row">
          <div class="jfs-to-head">
            <strong>TO:</strong> &nbsp; [ <b>${receiverName}</b> ] &nbsp; [PH: <b>${receiverPhone || '(-)'}</b> ]
          </div>
          <div class="jfs-to-body">
            [ ${receiverAddr} ]
          </div>
        </div>

        <!-- REASON -->
        <div class="jfs-addr-row jfs-reason-row">
          <strong>keterangan:</strong> ALASAN RETUR: <b>${reason}</b> (${problemCategory})
        </div>

        <!-- FROM & SOURCE -->
        <div class="jfs-addr-row jfs-from-row">
          <div class="jfs-from-info">
            <div><strong>From:</strong> ${senderName} &nbsp; Ph: ${senderPhone || '(-)'}</div>
            <div class="jfs-from-addr">${senderAddr}</div>
          </div>
          <div class="jfs-source-tag">
            ${orderSource}
          </div>
        </div>
      </div>

      <!-- Footer: CS Hotline & TTD Box -->
      <div class="jfs-footer-row">
        <div class="jfs-cs-info">
          <strong>Nomor CS: 021-80661666</strong><br>
          FastTrack • Standar Resmi J&amp;T Cargo
        </div>
        <div class="jfs-sign-box">
          <span>Tanda Tangan Penerima</span>
        </div>
      </div>
    </div>
  `;
}

function openThermalPrintPopup(labelsHtml, title = 'Cetak Label Retur') {
  const printWindow = window.open('', '_blank', 'width=460,height=560');
  if (!printWindow) {
    if (typeof showAppAlert === 'function') {
      showAppAlert('Popup terblokir browser. Mohon izinkan popup untuk mencetak label.', true);
    } else {
      alert('Popup terblokir browser. Mohon izinkan popup.');
    }
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: 100mm 100mm;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .thermal-page-break {
            page-break-after: always;
            break-after: page;
          }
          .no-print {
            display: none !important;
          }
          .jfs-official-label {
            width: 100mm !important;
            height: 100mm !important;
            max-height: 100mm !important;
            border: 1.2px solid #000 !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            page-break-inside: avoid;
          }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          color: #000;
          background: #f1f5f9;
          padding: 10px;
        }
        .print-controls {
          max-width: 100mm;
          margin: 0 auto 10px auto;
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .btn-ctrl {
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          background: #ffffff;
        }
        .btn-ctrl-primary {
          background: #00B075;
          color: #ffffff;
          border-color: #00B075;
        }
        .jfs-official-label {
          width: 100mm;
          height: 99mm;
          max-height: 100mm;
          margin: 0 auto 14px auto;
          background: #fff;
          border: 1.5px solid #000;
          padding: 2.2mm 2.8mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          color: #000;
        }
        .jfs-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 2px;
        }
        .jfs-header-meta {
          font-size: 7.2px;
          line-height: 1.2;
          color: #000;
        }
        .jfs-header-badge {
          text-align: right;
        }
        .jfs-badge-title {
          font-size: 15px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0.5px;
        }
        .jfs-badge-sub {
          font-size: 8px;
          font-weight: 700;
        }
        .jfs-dest-code-row {
          border-top: 1.5px solid #000;
          border-bottom: 1.5px solid #000;
          text-align: center;
          padding: 2px 0;
        }
        .jfs-dest-code-text {
          font-size: 21px;
          font-weight: 900;
          font-family: monospace;
          letter-spacing: 1px;
          line-height: 1;
        }
        .jfs-transit-grid {
          display: flex;
          border-bottom: 1.2px solid #000;
          text-align: center;
        }
        .jfs-transit-col {
          flex: 1;
          border-right: 1px solid #000;
          font-size: 10.5px;
          font-weight: 800;
        }
        .jfs-transit-col:last-child {
          border-right: none;
        }
        .jfs-transit-top {
          padding: 1.5px 0;
        }
        .jfs-transit-bot {
          font-size: 8.8px;
          font-weight: 700;
          border-top: 1px solid #000;
          padding: 1px 0;
          background: #fbfbfb;
        }
        .jfs-transit-dest {
          background: #000;
          color: #fff;
        }
        .jfs-transit-dest .jfs-transit-bot {
          background: #000;
          color: #fff;
          border-top: 1px solid #fff;
        }
        .jfs-freight-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.2px solid #000;
          padding: 2px 2px;
        }
        .jfs-freight-type {
          font-size: 7.2px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .jfs-freight-amt {
          font-size: 13px;
          font-weight: 900;
          line-height: 1.1;
        }
        .jfs-koli-col {
          text-align: right;
        }
        .jfs-koli-count {
          font-size: 11px;
          font-weight: 900;
        }
        .jfs-koli-weight {
          font-size: 8.8px;
          font-weight: 700;
        }
        .jfs-barcode-section {
          border-bottom: 1.2px solid #000;
          text-align: center;
          padding: 2px 0 1px 0;
        }
        .jfs-barcode-img {
          max-width: 96%;
          height: 38px;
          display: block;
          margin: 0 auto;
        }
        .jfs-barcode-subline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px 0 5px;
        }
        .jfs-wb-center {
          font-size: 11px;
          font-weight: 900;
        }
        .jfs-address-container {
          border-bottom: 1.2px solid #000;
          font-size: 8px;
          line-height: 1.25;
        }
        .jfs-addr-row {
          padding: 2.5px 2px;
        }
        .jfs-to-row {
          border-bottom: 1px solid #000;
        }
        .jfs-to-head {
          font-size: 9px;
          font-weight: 800;
        }
        .jfs-to-body {
          font-size: 8px;
          margin-top: 1px;
          color: #111;
        }
        .jfs-reason-row {
          border-bottom: 1px solid #000;
          font-size: 7.5px;
          background: #fdfdfd;
        }
        .jfs-from-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .jfs-from-info {
          flex: 1;
          font-size: 8px;
        }
        .jfs-from-addr {
          font-size: 7px;
          color: #333;
        }
        .jfs-source-tag {
          font-size: 9.5px;
          font-weight: 900;
          border: 1.2px solid #000;
          padding: 1px 4px;
          border-radius: 2px;
          margin-left: 5px;
        }
        .jfs-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 2px;
          font-size: 6.8px;
        }
        .jfs-cs-info {
          line-height: 1.2;
          color: #222;
        }
        .jfs-sign-box {
          width: 28mm;
          height: 10mm;
          border: 1px solid #000;
          text-align: center;
          font-size: 6px;
          color: #333;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 1px;
        }
      </style>
    </head>
    <body>
      <div class="print-controls no-print">
        <button class="btn-ctrl btn-ctrl-primary" onclick="window.print()">🖨️ Cetak Label Sekarang (100x100)</button>
        <button class="btn-ctrl" onclick="window.close()">Tutup</button>
      </div>
      <div class="labels-container">
        ${labelsHtml}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function printThermalReturLabel(retur) {
  if (!retur) return;
  const labelHtml = renderSingleThermalReturHtml(retur);
  openThermalPrintPopup(labelHtml, `Cetak Retur - ${retur.waybillNo || ''}`);
}

function printAllThermalReturLabels(returList = []) {
  if (!returList.length) return;
  const labelsHtml = returList.map((retur, i) => {
    const isLast = i === returList.length - 1;
    return `
      ${renderSingleThermalReturHtml(retur)}
      ${!isLast ? '<div class="thermal-page-break"></div>' : ''}
    `;
  }).join('');
  openThermalPrintPopup(labelsHtml, `Cetak ${returList.length} Label Retur`);
}

// Auto-initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrintAwbModule);
} else {
  initPrintAwbModule();
}
