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
        printAwbState.selectedType = valStr.split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
      }
    });
  });

  // Quick samples
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset.sample || '';
      inputEl.value = sample;
      inputEl.dispatchEvent(new Event('input'));
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
  if (checkedRadio && checkedRadio.value) {
    selectedType = checkedRadio.value.split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
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
        type: selectedType
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
  const str = (typeArray || []).join(',');
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

  const successCount = results.filter(r => r.success && r.pdfUrl).length;
  if (statusText) {
    statusText.textContent = `Siap Dicetak: ${successCount} dari ${results.length} Resi (${getPrintTypeName(selectedType)})`;
  }

  let html = '';
  results.forEach((item, idx) => {
    const isOk = item.success && item.pdfUrl;
    html += `
      <div class="print-result-card ${isOk ? 'is-success' : 'is-error'}">
        <div class="print-card-main">
          <div class="print-card-idx">#${idx + 1}</div>
          <div class="print-card-info">
            <div class="print-card-top-row">
              <strong class="print-card-waybill font-mono">${escAwbHtml(item.waybillNo)}</strong>
              ${isOk ? '<span class="print-status-badge status-ready">Siap Cetak</span>' : '<span class="print-status-badge status-fail">Gagal</span>'}
              <span class="print-type-tag">${getPrintTypeName(selectedType)}</span>
            </div>
            ${isOk
              ? `<div class="print-card-link-preview font-mono text-muted truncate">${escAwbHtml(item.pdfUrl)}</div>`
              : `<div class="print-card-error-text text-rose">${escAwbHtml(item.error || 'Gagal menghasilkan URL PDF')}</div>`
            }
          </div>
        </div>

        <div class="print-card-actions">
          ${isOk ? `
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

  listEl.querySelectorAll('.btn-print-retry-single').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wb = btn.dataset.wb;
      if (!wb) return;
      btn.disabled = true;
      btn.innerHTML = 'Menarik...';
      try {
        const token = typeof getToken === 'function' ? getToken() : (sessionStorage.getItem('monitoring_jwt') || localStorage.getItem('token'));
        const res = await fetch('/api/jfs/print-waybill', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ waybillNo: wb, type: printAwbState.selectedType })
        });
        const json = await res.json();
        if (json.success && json.pdfUrl) {
          const idx = printAwbState.results.findIndex(r => r.waybillNo === wb);
          if (idx !== -1) {
            printAwbState.results[idx] = { waybillNo: wb, success: true, pdfUrl: json.pdfUrl };
          }
          renderPrintAwbResults(printAwbState.results, printAwbState.selectedType);
          if (typeof showAppAlert === 'function') {
            showAppAlert(`Berhasil mengambil PDF untuk ${wb}`);
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

// Auto-initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrintAwbModule);
} else {
  initPrintAwbModule();
}
