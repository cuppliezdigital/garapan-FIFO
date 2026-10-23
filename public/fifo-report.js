/**
 * Laporan FIFO Spot (Realtime JFS Management Persediaan Detail)
 * Matrix 43 Spot Loading Bay TLC Tujuan x 4 Level Jam Aging FIFO
 */

let currentFifoReportData = null;
let currentSpotDetailWaybills = [];

async function loadFifoSpotReport(forceRefresh = false) {
  const tableBody = document.getElementById('fifoReportTableBody');
  const btnSync = document.getElementById('btnSyncFifoReport');
  if (btnSync) btnSync.classList.add('is-loading');

  try {
    const url = '/api/reports/fifo-spot' + (forceRefresh ? '?_t=' + Date.now() : '');
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403) {
        showAppAlert('Akses Ditolak: Anda tidak memiliki izin untuk melihat Laporan FIFO Spot.', true);
        window.location.hash = '#/monitoring';
        return;
      }
      throw new Error(`Server status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Gagal memuat laporan');

    currentFifoReportData = data;
    renderFifoReportUI(data);
  } catch (err) {
    console.error('Error loading FIFO Spot Report:', err);
    showAppAlert('Gagal memuat Laporan FIFO Spot: ' + err.message, true);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" class="empty-state text-danger" style="text-align: center; padding: 24px;">Gagal memuat data laporan: ${escapeFifoHtml(err.message)}</td></tr>`;
    }
  } finally {
    if (btnSync) btnSync.classList.remove('is-loading');
  }
}

function renderFifoReportUI(data) {
  const ts = data.timestamp || {};
  const sum = data.summary || {};
  const spots = data.spots || [];

  // 1. Header Timestamp Live
  const elDate = document.getElementById('fifoReportDate');
  const elTime = document.getElementById('fifoReportTime');
  if (elDate) elDate.textContent = ts.dateOnly || '-';
  if (elTime) elTime.textContent = ts.timeOnly || '-';

  // 2. Summary Boxes (4 Level Jam)
  const elC24_36 = document.getElementById('fifoSummary24_36');
  const elC48_60 = document.getElementById('fifoSummary48_60');
  const elC48_72 = document.getElementById('fifoSummary48_72');
  const elC72_up = document.getElementById('fifoSummary72_up');
  const elTotalAll = document.getElementById('fifoSummaryTotalAll');

  if (elC24_36) elC24_36.textContent = sum.c24_36 || 0;
  if (elC48_60) elC48_60.textContent = sum.c48_60 || 0;
  if (elC48_72) elC48_72.textContent = sum.c48_72 || 0;
  if (elC72_up) elC72_up.textContent = sum.c72_up || 0;
  if (elTotalAll) elTotalAll.textContent = (sum.total_stuck || 0) + ' PAKET';

  // 3. Render Table Matrix 43 SPOT
  const tableBody = document.getElementById('fifoReportTableBody');
  const tableFoot = document.getElementById('fifoReportTableFoot');
  if (!tableBody) return;

  const onlyCritical = document.getElementById('chkFifoOnlyCritical')?.checked || false;

  let html = '';
  let visibleCount = 0;
  let running24_36 = 0;
  let running48_60 = 0;
  let running48_72 = 0;
  let running72_up = 0;

  spots.forEach((spot, idx) => {
    const isCritical = spot.c72_up > 0 || spot.c48_72 >= 4 || spot.c48_60 >= 6 || spot.c24_36 >= 6;
    if (onlyCritical && !isCritical && spot.total === 0) return;

    visibleCount++;
    const cls24_36 = getHeatClass(spot.c24_36);
    const cls48_60 = getHeatClass(spot.c48_60);
    const cls48_72 = getHeatClass(spot.c48_72);
    const cls72_up = getHeatClass(spot.c72_up, true); // Level 72 UP lebih sensitif merah

    const rowTotal = (spot.c24_36 || 0) + (spot.c48_60 || 0) + (spot.c48_72 || 0) + (spot.c72_up || 0);
    running24_36 += (spot.c24_36 || 0);
    running48_60 += (spot.c48_60 || 0);
    running48_72 += (spot.c48_72 || 0);
    running72_up += (spot.c72_up || 0);

    html += `
      <tr>
        <td class="col-spot-code" title="${escapeFifoHtml(spot.spot_name || spot.spot_code)}">
          <span class="spot-tag">${escapeFifoHtml(spot.spot_code)}</span>
        </td>
        <td class="col-heat-cell ${cls24_36}" onclick="openFifoCellDetail(${idx}, '24_36', '3. 24 Jam - 36 Jam')" title="Klik untuk lihat resi">
          <span class="cell-num">${spot.c24_36 || 0}</span>
        </td>
        <td class="col-heat-cell ${cls48_60}" onclick="openFifoCellDetail(${idx}, '48_60', '4. 48 Jam - 60 Jam')" title="Klik untuk lihat resi">
          <span class="cell-num">${spot.c48_60 || 0}</span>
        </td>
        <td class="col-heat-cell ${cls48_72}" onclick="openFifoCellDetail(${idx}, '48_72', '5. 48 Jam - 72 Jam')" title="Klik untuk lihat resi">
          <span class="cell-num">${spot.c48_72 || 0}</span>
        </td>
        <td class="col-heat-cell ${cls72_up}" onclick="openFifoCellDetail(${idx}, '72_up', '6. 72 UP')" title="Klik untuk lihat resi">
          <span class="cell-num">${spot.c72_up || 0}</span>
        </td>
        <td class="col-spot-total font-bold">${rowTotal}</td>
      </tr>
    `;
  });

  if (visibleCount === 0) {
    html = `<tr><td colspan="6" class="empty-state" style="text-align: center; padding: 20px;">Tidak ada spot yang cocok dengan filter.</td></tr>`;
  }

  tableBody.innerHTML = html;

  // Render Table Foot (GRAND TOTAL)
  if (tableFoot) {
    const grand24_36 = sum.c24_36 ?? running24_36;
    const grand48_60 = sum.c48_60 ?? running48_60;
    const grand48_72 = sum.c48_72 ?? running48_72;
    const grand72_up = sum.c72_up ?? running72_up;
    const grandTotal = sum.total_stuck ?? (grand24_36 + grand48_60 + grand48_72 + grand72_up);

    tableFoot.innerHTML = `
      <tr class="tr-grand-total">
        <td class="col-spot-code font-bold">TOTAL</td>
        <td class="col-heat-cell font-bold">${grand24_36}</td>
        <td class="col-heat-cell font-bold">${grand48_60}</td>
        <td class="col-heat-cell font-bold">${grand48_72}</td>
        <td class="col-heat-cell font-bold">${grand72_up}</td>
        <td class="col-spot-total font-bold">${grandTotal}</td>
      </tr>
    `;
  }
}

// Menentukan class heatmap (Merah, Kuning, Putih/Transparan)
function getHeatClass(count, isHighest = false) {
  const n = Number(count || 0);
  if (n <= 0) return 'heat-zero';
  if (isHighest) {
    if (n >= 4) return 'heat-red';
    if (n >= 2) return 'heat-yellow';
    return 'heat-normal';
  }
  if (n >= 6) return 'heat-red';
  if (n >= 4) return 'heat-yellow';
  return 'heat-normal';
}

function escapeFifoHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --------------------------------------------------------------------------
// MODAL DRILL-DOWN RINCIAN WAYBILL PER CELL
// --------------------------------------------------------------------------
function openFifoCellDetail(spotIdx, levelKey, levelTitle) {
  if (!currentFifoReportData || !currentFifoReportData.spots) return;
  const spot = currentFifoReportData.spots[spotIdx];
  if (!spot) return;

  const waybills = (spot.waybills && spot.waybills[levelKey]) ? spot.waybills[levelKey] : [];
  currentSpotDetailWaybills = waybills;

  const modal = document.getElementById('modalFifoSpotDetail');
  const titleEl = document.getElementById('fifoDetailModalTitle');
  const subEl = document.getElementById('fifoDetailModalSub');
  const countBadge = document.getElementById('fifoDetailCountBadge');
  const tbody = document.getElementById('fifoDetailTableBody');

  if (titleEl) titleEl.textContent = `Spot: ${spot.spot_code} (${spot.spot_name})`;
  if (subEl) subEl.textContent = `Level: ${levelTitle}`;
  if (countBadge) countBadge.textContent = `${waybills.length} Paket`;

  if (tbody) {
    if (!waybills.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="text-align: center; padding: 24px;">Tidak ada waybill tertahan pada kategori ini.</td></tr>`;
    } else {
      tbody.innerHTML = waybills.map((w, i) => `
        <tr>
          <td style="text-align: center; color: #94a3b8;">${i + 1}</td>
          <td><strong style="color: #38bdf8; font-family: monospace;">${escapeFifoHtml(w.waybill)}</strong></td>
          <td>${escapeFifoHtml(w.outlet || '-')}</td>
          <td><span class="stuck-badge">${escapeFifoHtml(w.stuck || '-')}</span></td>
          <td>${escapeFifoHtml(w.nama_barang || '-')}</td>
        </tr>
      `).join('');
    }
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeFifoCellDetail() {
  const modal = document.getElementById('modalFifoSpotDetail');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  currentSpotDetailWaybills = [];
}

async function copyFifoDetailWaybills() {
  if (!currentSpotDetailWaybills.length) {
    showAppAlert('Tidak ada nomor AWB yang dapat disalin.', true);
    return;
  }

  const text = currentSpotDetailWaybills.map(w => w.waybill).filter(Boolean).join('\n');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    const btn = document.getElementById('btnCopyFifoDetailWaybills');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span>✓ ${currentSpotDetailWaybills.length} Resi Tersalin!</span>`;
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
    showAppAlert(`Berhasil menyalin ${currentSpotDetailWaybills.length} nomor AWB ke clipboard!`, false);
  } catch (err) {
    showAppAlert('Gagal menyalin AWB: ' + err.message, true);
  }
}

// --------------------------------------------------------------------------
// FITUR SALIN GAMBAR LAPORAN KE CLIPBOARD (HTML2CANVAS) - OPTIMIZED FAST
// --------------------------------------------------------------------------
async function copyFifoReportImage() {
  const card = document.getElementById('fifoReportPrintableCard');
  const btn = document.getElementById('btnCopyFifoReportImage');
  if (!card) return;

  if (typeof window.html2canvas !== 'function') {
    showAppAlert('Pustaka pembuat gambar belum siap. Silakan refresh halaman.', true);
    return;
  }

  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.innerHTML = `
      <span class="btn-icon-circle rotating-spinner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </span>
      <span class="btn-text-main">Menyalin Gambar...</span>
    `;
  }

  // Jeda sangat singkat (30ms) agar browser langsung me-render tampilan loading tanpa lag
  await new Promise((resolve) => setTimeout(resolve, 30));

  try {
    const canvas = await html2canvas(card, {
      scale: 1.5, // 1.5x scale (HD ~1190px lebar) -> 3x lebih cepat dari scale 2, sangat tajam untuk WA/Feishu
      useCORS: false, // Bebas delay karena tidak ada gambar eksternal di tabel
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      width: card.offsetWidth,
      height: card.offsetHeight
    });

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Gagal mengonversi tabel menjadi gambar.');

      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          if (btn) {
            btn.classList.remove('is-loading');
            btn.innerHTML = `
              <span class="btn-icon-circle" style="background: rgba(16, 185, 129, 0.25); color: #10b981; font-weight: bold;">✓</span>
              <span class="btn-text-main" style="color: #10b981; font-weight: 800;">Gambar Tersalin!</span>
            `;
            setTimeout(() => {
              btn.innerHTML = origHtml;
              btn.disabled = false;
            }, 2500);
          }
          showAppAlert('Gambar Laporan FIFO Spot (A4) berhasil disalin ke clipboard! Siap di-paste (Ctrl + V) ke WhatsApp / Feishu.', false);
        } else {
          // Fallback unduh jika browser membatasi direct clipboard image
          downloadBlobAsImage(blob, `Laporan_FIFO_Spot_${Date.now()}.png`);
          if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
            btn.classList.remove('is-loading');
          }
          showAppAlert('Browser tidak mengizinkan salin gambar langsung. Gambar otomatis diunduh!', false);
        }
      } catch (clipErr) {
        console.warn('Clipboard write error, fallback download:', clipErr);
        downloadBlobAsImage(blob, `Laporan_FIFO_Spot_${Date.now()}.png`);
        if (btn) {
          btn.innerHTML = origHtml;
          btn.disabled = false;
          btn.classList.remove('is-loading');
        }
        showAppAlert('Gambar otomatis diunduh sebagai file PNG.', false);
      }
    }, 'image/png');
  } catch (err) {
    console.error('Error copying report image:', err);
    showAppAlert('Gagal menyalin gambar laporan: ' + err.message, true);
    if (btn) {
      btn.innerHTML = origHtml;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }
}

async function downloadFifoReportImage() {
  const card = document.getElementById('fifoReportPrintableCard');
  const btn = document.getElementById('btnDownloadFifoReportImage');
  if (!card || typeof window.html2canvas !== 'function') return;

  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.innerHTML = `
      <span class="btn-icon-circle rotating-spinner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </span>
      <span class="btn-text-main">Membuat PNG...</span>
    `;
  }

  await new Promise((resolve) => setTimeout(resolve, 30));

  try {
    const canvas = await html2canvas(card, {
      scale: 1.5,
      useCORS: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      width: card.offsetWidth,
      height: card.offsetHeight
    });

    const dateStr = (currentFifoReportData?.timestamp?.dateOnly || '').replace(/\//g, '-');
    const filename = `Laporan_FIFO_Spot_${dateStr || Date.now()}.png`;

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (btn) {
      btn.classList.remove('is-loading');
      btn.innerHTML = `
        <span class="btn-icon-circle" style="background: rgba(16, 185, 129, 0.25); color: #10b981; font-weight: bold;">✓</span>
        <span class="btn-text-main" style="color: #10b981; font-weight: 800;">Terunduh!</span>
      `;
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }, 2500);
    }
    showAppAlert(`Berhasil mengunduh gambar ${filename}!`, false);
  } catch (err) {
    showAppAlert('Gagal mengunduh gambar: ' + err.message, true);
    if (btn) {
      btn.innerHTML = origHtml;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }
}

function downloadBlobAsImage(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --------------------------------------------------------------------------
// SINKRONISASI REALTIME JFS
// --------------------------------------------------------------------------
async function syncFifoSpotRealtime() {
  const btn = document.getElementById('btnSyncFifoReport');
  if (btn) btn.classList.add('is-loading');

  try {
    showAppAlert('Sedang menyinkronkan data persediaan realtime JFS...', false);
    const res = await fetch('/api/reports/fifo-spot/sync', { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Gagal sinkron');

    currentFifoReportData = data;
    renderFifoReportUI(data);
    showAppAlert('Berhasil menyinkronkan data Laporan FIFO Spot dari JFS!', false);
  } catch (err) {
    showAppAlert('Gagal sinkron data: ' + err.message, true);
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}

// --------------------------------------------------------------------------
// MASTER MAPPING SPOT (MODAL & MANAGEMENT)
// --------------------------------------------------------------------------
async function openSpotMappingModal() {
  const modal = document.getElementById('modalSpotMapping');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  await fetchSpotMappings();
}

function closeSpotMappingModal() {
  const modal = document.getElementById('modalSpotMapping');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function fetchSpotMappings() {
  const tbody = document.getElementById('spotMappingTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Memuat data mapping...</td></tr>`;

  try {
    const res = await fetch('/api/reports/fifo-spot/mappings');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const mappings = data.mappings || [];
    if (tbody) {
      if (!mappings.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Belum ada mapping SPOT.</td></tr>`;
      } else {
        tbody.innerHTML = mappings.map((m, i) => `
          <tr>
            <td style="text-align: center; font-weight: 700; color: #94a3b8;">${m.sort_order || (i + 1)}</td>
            <td><strong style="color: #38bdf8; font-family: monospace;">${escapeFifoHtml(m.spot_code)}</strong></td>
            <td>${escapeFifoHtml(m.spot_name)}</td>
            <td><span class="pattern-pill">${escapeFifoHtml(m.tlc_patterns || '-')}</span></td>
            <td style="text-align: right;">
              <button type="button" class="table-btn edit-btn" onclick="editSpotMapping(${m.id}, '${escapeFifoHtml(m.spot_code)}', '${escapeFifoHtml(m.spot_name)}', ${m.sort_order || 0}, '${escapeFifoHtml(m.tlc_patterns || '')}')">Edit</button>
              <button type="button" class="table-btn delete-btn" onclick="deleteSpotMapping(${m.id}, '${escapeFifoHtml(m.spot_code)}')">Hapus</button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-danger" style="text-align: center;">Gagal memuat mapping: ${err.message}</td></tr>`;
  }
}

function resetSpotMappingForm() {
  const idInput = document.getElementById('spotMappingId');
  const codeInput = document.getElementById('spotMappingCode');
  const nameInput = document.getElementById('spotMappingName');
  const orderInput = document.getElementById('spotMappingOrder');
  const patternsInput = document.getElementById('spotMappingPatterns');
  const formTitle = document.getElementById('spotMappingFormTitle');

  if (idInput) idInput.value = '';
  if (codeInput) codeInput.value = '';
  if (nameInput) nameInput.value = '';
  if (orderInput) orderInput.value = '0';
  if (patternsInput) patternsInput.value = '';
  if (formTitle) formTitle.textContent = 'Tambah SPOT Baru';
}

function editSpotMapping(id, code, name, order, patterns) {
  const idInput = document.getElementById('spotMappingId');
  const codeInput = document.getElementById('spotMappingCode');
  const nameInput = document.getElementById('spotMappingName');
  const orderInput = document.getElementById('spotMappingOrder');
  const patternsInput = document.getElementById('spotMappingPatterns');
  const formTitle = document.getElementById('spotMappingFormTitle');

  if (idInput) idInput.value = id;
  if (codeInput) codeInput.value = code;
  if (nameInput) nameInput.value = name;
  if (orderInput) orderInput.value = order;
  if (patternsInput) patternsInput.value = patterns;
  if (formTitle) formTitle.textContent = `Edit SPOT: ${code}`;
}

async function handleSpotMappingFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('spotMappingId')?.value;
  const spot_code = document.getElementById('spotMappingCode')?.value?.trim().toUpperCase();
  const spot_name = document.getElementById('spotMappingName')?.value?.trim();
  const sort_order = document.getElementById('spotMappingOrder')?.value;
  const tlc_patterns = document.getElementById('spotMappingPatterns')?.value?.trim();

  if (!spot_code || !spot_name) {
    showAppAlert('Kode SPOT dan Nama SPOT wajib diisi!', true);
    return;
  }

  try {
    const res = await fetch('/api/reports/fifo-spot/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, spot_code, spot_name, sort_order, tlc_patterns })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showAppAlert('Mapping SPOT berhasil disimpan!', false);
    resetSpotMappingForm();
    await fetchSpotMappings();
    loadFifoSpotReport(true); // reload table report
  } catch (err) {
    showAppAlert('Gagal menyimpan mapping: ' + err.message, true);
  }
}

async function deleteSpotMapping(id, code) {
  if (!confirm(`Yakin ingin menghapus mapping SPOT "${code}"?`)) return;

  try {
    const res = await fetch(`/api/reports/fifo-spot/mappings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showAppAlert(`SPOT ${code} berhasil dihapus.`, false);
    await fetchSpotMappings();
    loadFifoSpotReport(true);
  } catch (err) {
    showAppAlert('Gagal menghapus: ' + err.message, true);
  }
}

// --------------------------------------------------------------------------
// INISIALISASI EVENT LISTENERS
// --------------------------------------------------------------------------
function initFifoReportListeners() {
  const btnCopyImg = document.getElementById('btnCopyFifoReportImage');
  if (btnCopyImg) btnCopyImg.addEventListener('click', copyFifoReportImage);

  const btnDlImg = document.getElementById('btnDownloadFifoReportImage');
  if (btnDlImg) btnDlImg.addEventListener('click', downloadFifoReportImage);

  const btnPrint = document.getElementById('btnPrintFifoReport');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  const btnSync = document.getElementById('btnSyncFifoReport');
  if (btnSync) btnSync.addEventListener('click', syncFifoSpotRealtime);

  const btnOpenMapping = document.getElementById('btnOpenSpotMapping');
  if (btnOpenMapping) btnOpenMapping.addEventListener('click', openSpotMappingModal);

  const btnCloseMapping = document.getElementById('btnCloseSpotMappingModal');
  if (btnCloseMapping) btnCloseMapping.addEventListener('click', closeSpotMappingModal);

  const formMapping = document.getElementById('spotMappingForm');
  if (formMapping) formMapping.addEventListener('submit', handleSpotMappingFormSubmit);

  const btnResetMappingForm = document.getElementById('btnResetSpotMappingForm');
  if (btnResetMappingForm) btnResetMappingForm.addEventListener('click', resetSpotMappingForm);

  const chkOnlyCritical = document.getElementById('chkFifoOnlyCritical');
  if (chkOnlyCritical) {
    chkOnlyCritical.addEventListener('change', () => {
      if (currentFifoReportData) renderFifoReportUI(currentFifoReportData);
    });
  }

  const btnCloseDetail = document.getElementById('btnCloseFifoDetailModal');
  if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeFifoCellDetail);

  const btnCloseDetailBottom = document.getElementById('btnCloseFifoDetailModalBottom');
  if (btnCloseDetailBottom) btnCloseDetailBottom.addEventListener('click', closeFifoCellDetail);

  const btnCopyDetailWb = document.getElementById('btnCopyFifoDetailWaybills');
  if (btnCopyDetailWb) btnCopyDetailWb.addEventListener('click', copyFifoDetailWaybills);
}

// Expose globally
window.loadFifoSpotReport = loadFifoSpotReport;
window.copyFifoReportImage = copyFifoReportImage;
window.openFifoCellDetail = openFifoCellDetail;
window.closeFifoCellDetail = closeFifoCellDetail;
window.openSpotMappingModal = openSpotMappingModal;
window.closeSpotMappingModal = closeSpotMappingModal;
window.editSpotMapping = editSpotMapping;
window.deleteSpotMapping = deleteSpotMapping;

initFifoReportListeners();

