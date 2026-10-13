// ==========================================================================
// MODUL PTO - PELACAKAN TOTAL ORDER (OMS JFS)
// ==========================================================================

let ptoState = {
  current: 1,
  size: 100,
  totalPages: 1,
  totalRecords: 0,
  records: [],
  selectedRecord: null,
  isLoading: false
};

// 1. Initialize PTO Module
function initPtoModule() {
  initPtoDates();
  initPtoEventListeners();
  fetchPtoConfig();
}

// Format number with Indonesian thousand separator
function formatPtoNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('id-ID');
}

// Escape HTML
function escPtoHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

// Format Date YYYY-MM-DD
function getPtoDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Set up Default Dates
function initPtoDates() {
  const startInput = document.getElementById('ptoStartDate');
  const endInput = document.getElementById('ptoEndDate');
  if (!startInput || !endInput) return;

  const now = new Date();
  const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  endInput.value = getPtoDateStr(now);
  startInput.value = getPtoDateStr(past7);
}

// 2. Fetch Account Config & Token Status
async function fetchPtoConfig() {
  try {
    const token = getToken();
    const res = await fetch('/api/pto/config', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      const cfg = data.data || {};
      const nameEl = document.getElementById('ptoAccountNameText');
      if (nameEl && cfg.accountName) {
        nameEl.textContent = `Akun: ${cfg.accountName}`;
      }
      const tokenInput = document.getElementById('ptoInputToken');
      if (tokenInput && cfg.authtoken) {
        tokenInput.value = cfg.authtoken;
      }
    }
  } catch (err) {
    console.warn('fetchPtoConfig warning:', err.message);
  }
}

// 3. Main Query Function (Pelacakan Total Order)
async function executePtoQuery(targetPage = 1) {
  if (ptoState.isLoading) return;
  ptoState.isLoading = true;

  const btnSubmit = document.getElementById('btnSubmitPtoQuery');
  const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Menarik Data PTO...</span>
    `;
  }

  const tbody = document.getElementById('ptoTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="pto-empty-state">
          <div class="pto-empty-content">
            <div class="pto-spinner"></div>
            <p style="font-weight: 700; color: #38bdf8; margin-top: 12px;">Menghubungkan ke Gateway JFS PTO...</p>
            <span style="font-size: 0.8rem; color: #94a3b8;">Menarik data order real-time. Mohon tunggu beberapa detik...</span>
          </div>
        </td>
      </tr>
    `;
  }

  const startTime = performance.now();

  try {
    const startVal = document.getElementById('ptoStartDate')?.value;
    const endVal = document.getElementById('ptoEndDate')?.value;
    const sourceVal = document.getElementById('ptoOrderSource')?.value;
    const sizeVal = parseInt(document.getElementById('ptoPageSize')?.value, 10) || 100;
    const searchVal = document.getElementById('ptoWaybillSearch')?.value.trim();

    const startDate = startVal ? `${startVal} 00:00:00` : undefined;
    const endDate = endVal ? `${endVal} 23:59:59` : undefined;

    const payload = {
      startDate,
      endDate,
      current: targetPage,
      size: sizeVal,
      orderSourceName: sourceVal !== 'all' ? sourceVal : undefined
    };

    if (searchVal) {
      payload.waybillIds = searchVal;
    }

    const token = getToken();
    const res = await fetch('/api/pto/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    const elapsed = (performance.now() - startTime) / 1000;
    const respTimeEl = document.getElementById('ptoKpiResponseTime');
    if (respTimeEl) respTimeEl.textContent = `${elapsed.toFixed(2)}s`;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Gagal mengambil data dari JFS');
    }

    ptoState.current = json.current || targetPage;
    ptoState.size = json.size || sizeVal;
    ptoState.totalRecords = json.total || 0;
    ptoState.totalPages = json.totalPages || Math.ceil(ptoState.totalRecords / ptoState.size) || 1;
    ptoState.records = json.records || [];

    renderPtoTable();
    updatePtoKpis();
    renderPtoPagination();
  } catch (err) {
    console.error('executePtoQuery error:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="pto-empty-state">
            <div class="pto-empty-content" style="color: #fb7185;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style="font-weight: 700; font-size: 0.95rem; margin-top: 8px;">Gagal Menarik Data PTO</p>
              <span style="font-size: 0.82rem; color: #fda4af; max-width: 600px; display: inline-block; line-height: 1.4;">${escPtoHtml(err.message)}</span>
              <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-wrap: wrap;">
                ${(err.message && (err.message.includes('405') || err.message.includes('401') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('sesi'))) ? '<button type="button" class="btn-pto-config" onclick="openPtoConfigModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 0.82rem; background: #2563eb; color: #fff; border-radius: 6px; border: 1px solid #3b82f6; cursor: pointer; font-weight: 600;">🔑 Atur Token PTO Baru</button>' : ''}
                <button type="button" class="btn-inline-retry" onclick="executePtoQuery(${targetPage})" style="margin-top: 0;">Coba Lagi</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }
    showAppAlert(`Gagal: ${err.message}`, true);
  } finally {
    ptoState.isLoading = false;
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = origBtnHtml;
    }
  }
}

// 4. Update KPI Stat Strip
function updatePtoKpis() {
  const kpiTotal = document.getElementById('ptoKpiTotalOrders');
  const kpiPage = document.getElementById('ptoKpiPageInfo');
  const kpiWeight = document.getElementById('ptoKpiTotalWeight');

  if (kpiTotal) {
    kpiTotal.textContent = `${formatPtoNumber(ptoState.totalRecords)} Order`;
  }
  if (kpiPage) {
    kpiPage.textContent = `Halaman ${formatPtoNumber(ptoState.current)} / ${formatPtoNumber(ptoState.totalPages)}`;
  }
  if (kpiWeight) {
    const pageWeight = ptoState.records.reduce((sum, r) => sum + (parseFloat(r.packageTotalWeight) || 0), 0);
    kpiWeight.textContent = `${pageWeight.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }
}

// 5. Render PTO Data Table
function renderPtoTable() {
  const tbody = document.getElementById('ptoTableBody');
  if (!tbody) return;

  if (!ptoState.records || ptoState.records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="pto-empty-state">
          <div class="pto-empty-content">
            <p style="font-weight: 600; color: #cbd5e1;">Tidak Ada Data yang Sesuai</p>
            <span style="font-size: 0.8rem; color: #94a3b8;">Tidak ditemukan order pada rentang tanggal atau nomor resi yang dimasukkan.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const startIdx = (ptoState.current - 1) * ptoState.size;

  tbody.innerHTML = ptoState.records.map((r, idx) => {
    const rowNum = startIdx + idx + 1;
    const awb = r.waybillId || '-';
    const goods = r.goodsName || '-';
    const weight = r.packageTotalWeight ? `${parseFloat(r.packageTotalWeight).toFixed(2)} kg` : '-';
    const koli = r.packageNumber ? ` (${r.packageNumber} koli)` : '';
    const origin = r.pickNetworkName || '-';
    const dest = r.dispatchNetworkCode || '-';
    const destCity = r.receiverCityName ? ` • ${r.receiverCityName}` : '';
    const sorting = r.terminalDispatchCode || '-';
    const source = r.orderSourceName || 'Reguler';
    const sender = r.senderName || '-';
    const senderCity = r.senderCityName ? `<br><small style="color: #64748b;">${r.senderCityName}</small>` : '';
    const receiver = r.receiverName || '-';
    const receiverCity = r.receiverCityName ? `<br><small style="color: #64748b;">${r.receiverCityName}</small>` : '';
    const inputTime = r.inputTime ? r.inputTime.replace('T', ' ').slice(0, 16) : '-';

    // Source platform badge styling
    let sourceBadgeClass = 'pto-badge-reguler';
    const lowerSrc = source.toLowerCase();
    if (lowerSrc.includes('shopee')) sourceBadgeClass = 'pto-badge-shopee';
    else if (lowerSrc.includes('tokopedia')) sourceBadgeClass = 'pto-badge-tokopedia';
    else if (lowerSrc.includes('tiktok')) sourceBadgeClass = 'pto-badge-tiktok';

    return `
      <tr>
        <td style="text-align: center; color: #94a3b8; font-size: 0.78rem;">${rowNum}</td>
        <td>
          <div class="pto-awb-wrap">
            <strong class="pto-awb-text" onclick="openPtoOrderDetail('${escPtoHtml(r.id)}', ${idx})" title="Klik untuk lihat detail">${escPtoHtml(awb)}</strong>
            <button type="button" class="btn-pto-copy-awb" onclick="navigator.clipboard.writeText('${escPtoHtml(awb)}'); showAppAlert('No. Resi disalin: ${escPtoHtml(awb)}');" title="Salin Resi">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </td>
        <td>
          <div class="pto-goods-cell" title="${escPtoHtml(goods)}">
            ${escPtoHtml(goods)}
          </div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <span style="font-weight: 700; color: #f8fafc;">${weight}</span>
          <small style="color: #94a3b8;">${koli}</small>
        </td>
        <td>
          <span class="pto-origin-badge">${escPtoHtml(origin)}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: #e2e8f0;">${escPtoHtml(dest)}</div>
          <small style="color: #94a3b8; font-size: 0.73rem;">${escPtoHtml(destCity)}</small>
        </td>
        <td>
          <span class="pto-sorting-badge">${escPtoHtml(sorting)}</span>
        </td>
        <td style="text-align: center;">
          <span class="pto-source-badge ${sourceBadgeClass}">${escPtoHtml(source)}</span>
        </td>
        <td style="font-size: 0.8rem;">
          <span style="color: #cbd5e1; font-weight: 500;">${escPtoHtml(sender)}</span>
          ${senderCity}
        </td>
        <td style="font-size: 0.8rem;">
          <span style="color: #cbd5e1; font-weight: 500;">${escPtoHtml(receiver)}</span>
          ${receiverCity}
        </td>
        <td style="font-size: 0.76rem; color: #94a3b8; white-space: nowrap;">
          ${escPtoHtml(inputTime)}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-pto-view-detail" onclick="openPtoOrderDetail('${escPtoHtml(r.id)}', ${idx})" title="Lihat Informasi Lengkap">Detail</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 6. Render Pagination Controls
function renderPtoPagination() {
  const bar = document.getElementById('ptoPaginationBar');
  const rangeText = document.getElementById('ptoPaginationRangeText');
  const pageNumbers = document.getElementById('ptoPageNumbers');
  const btnFirst = document.getElementById('btnPtoFirstPage');
  const btnPrev = document.getElementById('btnPtoPrevPage');
  const btnNext = document.getElementById('btnPtoNextPage');
  const btnLast = document.getElementById('btnPtoLastPage');

  if (!bar) return;

  const total = ptoState.totalRecords;
  const current = ptoState.current;
  const totalPages = ptoState.totalPages;
  const size = ptoState.size;

  if (total === 0) {
    if (rangeText) rangeText.textContent = 'Menampilkan 0 dari 0 order';
    if (pageNumbers) pageNumbers.innerHTML = '';
    if (btnFirst) btnFirst.disabled = true;
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    if (btnLast) btnLast.disabled = true;
    return;
  }

  const startIdx = (current - 1) * size + 1;
  const endIdx = Math.min(current * size, total);

  if (rangeText) {
    rangeText.textContent = `Menampilkan ${formatPtoNumber(startIdx)} - ${formatPtoNumber(endIdx)} dari ${formatPtoNumber(total)} order`;
  }

  if (btnFirst) btnFirst.disabled = current <= 1;
  if (btnPrev) btnPrev.disabled = current <= 1;
  if (btnNext) btnNext.disabled = current >= totalPages;
  if (btnLast) btnLast.disabled = current >= totalPages;

  // Generate page numbers
  if (pageNumbers) {
    let pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(`
        <button type="button" class="btn-page ${p === current ? 'active' : ''}" onclick="executePtoQuery(${p})">${p}</button>
      `);
    }
    pageNumbers.innerHTML = pages.join('');
  }
}

// 7. Modal Detail Order (Unmasked Full Info)
window.openPtoOrderDetail = async function(id, recordIdx) {
  const modal = document.getElementById('ptoDetailModal');
  const body = document.getElementById('ptoDetailModalBody');
  const title = document.getElementById('ptoDetailModalTitle');
  const subtitle = document.getElementById('ptoDetailModalSubtitle');
  if (!modal || !body) return;

  // Fallback to table row record if available
  const rowData = (recordIdx !== null && ptoState.records[recordIdx]) ? ptoState.records[recordIdx] : {};

  if (title) title.textContent = rowData.waybillId || id || 'Detail Order';
  if (subtitle) subtitle.textContent = `Sumber: ${rowData.orderSourceName || 'JFS'} • ID: ${id}`;

  body.innerHTML = `
    <div style="text-align: center; padding: 30px; color: #38bdf8;">
      <div class="pto-spinner"></div>
      <p style="margin-top: 10px; font-weight: 600;">Memuat detail lengkap dari OMS JFS...</p>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  try {
    const token = getToken();
    const res = await fetch(`/api/pto/detail/${encodeURIComponent(id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    let detail = rowData;
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        detail = { ...rowData, ...data.data };
      }
    }

    ptoState.selectedRecord = detail;
    renderPtoDetailContent(detail);
  } catch (err) {
    console.warn('Gagal fetch reqDetail, fallback ke data row:', err);
    ptoState.selectedRecord = rowData;
    renderPtoDetailContent(rowData);
  }
};

function renderPtoDetailContent(d) {
  const body = document.getElementById('ptoDetailModalBody');
  if (!body) return;

  body.innerHTML = `
    <div class="pto-detail-sections">
      <!-- SECTION 1: FISIK & DESKRIPSI BARANG -->
      <div class="pto-detail-card-section">
        <h4 class="pto-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          <span>Informasi Barang &amp; Dimensi Paket</span>
        </h4>
        <div class="pto-detail-grid">
          <div class="pto-detail-item full-width">
            <span class="pto-label">Nama Barang:</span>
            <strong class="pto-val text-amber" style="font-size: 0.95rem;">${escPtoHtml(d.goodsName || '-')}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Kategori Barang:</span>
            <span class="pto-val">${escPtoHtml(d.goodsTypeName || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Total Berat Asli:</span>
            <strong class="pto-val text-cyan">${d.packageTotalWeight ? d.packageTotalWeight + ' kg' : '-'}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Berat Dihitung (Charge):</span>
            <span class="pto-val">${d.packageChargeWeight ? d.packageChargeWeight + ' kg' : '-'}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Jumlah Koli:</span>
            <strong class="pto-val">${d.packageNumber || 1} Koli</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Dimensi (P × L × T):</span>
            <span class="pto-val">${d.packageLength || '0'} × ${d.packageWide || '0'} × ${d.packageHigh || '0'} cm</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Nilai Barang:</span>
            <span class="pto-val">${d.goodsValue ? 'Rp ' + formatPtoNumber(d.goodsValue) : '-'}</span>
          </div>
        </div>
      </div>

      <!-- SECTION 2: PENGIRIM & PENERIMA -->
      <div class="pto-detail-2col">
        <!-- PENGIRIM -->
        <div class="pto-detail-card-section">
          <h4 class="pto-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Pengirim (Origin)</span>
          </h4>
          <div class="pto-detail-grid single-col">
            <div class="pto-detail-item">
              <span class="pto-label">Nama Pengirim:</span>
              <strong class="pto-val">${escPtoHtml(d.senderName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nomor Telepon:</span>
              <span class="pto-val">${escPtoHtml(d.senderMobilePhone || d.senderTelphone || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Kota / Provinsi:</span>
              <span class="pto-val">${escPtoHtml(d.senderCityName || '-')}, ${escPtoHtml(d.senderProvinceName || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Alamat Lengkap:</span>
              <p class="pto-val-address">${escPtoHtml(d.senderDetailedAddress || '-')}</p>
            </div>
          </div>
        </div>

        <!-- PENERIMA -->
        <div class="pto-detail-card-section">
          <h4 class="pto-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Penerima (Destination)</span>
          </h4>
          <div class="pto-detail-grid single-col">
            <div class="pto-detail-item">
              <span class="pto-label">Nama Penerima:</span>
              <strong class="pto-val">${escPtoHtml(d.receiverName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nomor Telepon:</span>
              <span class="pto-val">${escPtoHtml(d.receiverMobilePhone || d.receiverTelphone || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Kota / Provinsi:</span>
              <span class="pto-val">${escPtoHtml(d.receiverCityName || '-')}, ${escPtoHtml(d.receiverProvinceName || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Alamat Lengkap:</span>
              <p class="pto-val-address">${escPtoHtml(d.receiverDetailedAddress || '-')}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: RUTE, PETUGAS & GATEWAY -->
      <div class="pto-detail-card-section">
        <h4 class="pto-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          <span>Operasional &amp; Rute Gateway JFS</span>
        </h4>
        <div class="pto-detail-grid">
          <div class="pto-detail-item">
            <span class="pto-label">Outlet Penjemput:</span>
            <strong class="pto-val">${escPtoHtml(d.pickNetworkName || '-')}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Kurir Jemput:</span>
            <span class="pto-val">${escPtoHtml(d.pickStaffName || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Outlet Tujuan:</span>
            <strong class="pto-val">${escPtoHtml(d.dispatchNetworkCode || '-')} (${escPtoHtml(d.dispatchNetworkName || '-')})</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Kode Sorting Gateway:</span>
            <strong class="pto-val text-cyan">${escPtoHtml(d.terminalDispatchCode || '-')}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Waktu Input Order:</span>
            <span class="pto-val">${escPtoHtml(d.inputTime || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Waktu Dispatch:</span>
            <span class="pto-val">${escPtoHtml(d.dispatchNetworkTime || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Platform Sumber:</span>
            <span class="pto-val">${escPtoHtml(d.orderSourceName || '-')} (${escPtoHtml(d.customerName || '-')})</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Metode Pembayaran:</span>
            <span class="pto-val">${escPtoHtml(d.paymentModeName || d.orderTypeName || '-')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closePtoDetailModal() {
  const modal = document.getElementById('ptoDetailModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// 8. Copy Clean Summary of Selected Order
function copyPtoSingleDetail() {
  const d = ptoState.selectedRecord;
  if (!d) return;

  const text = `📦 DETAIL ORDER RESI JFS (PTO)
AWB: ${d.waybillId || '-'}
Nama Barang: ${d.goodsName || '-'}
Berat: ${d.packageTotalWeight || '0'} kg (${d.packageNumber || 1} Koli)
Outlet Asal: ${d.pickNetworkName || '-'}
Outlet Tujuan: ${d.dispatchNetworkCode || '-'} (${d.receiverCityName || '-'})
Kode Sorting: ${d.terminalDispatchCode || '-'}
Pengirim: ${d.senderName || '-'} (${d.senderCityName || '-'})
Penerima: ${d.receiverName || '-'} (${d.receiverCityName || '-'})
Alamat Tujuan: ${d.receiverDetailedAddress || '-'}
Sumber: ${d.orderSourceName || '-'}
Waktu Input: ${d.inputTime || '-'}`;

  navigator.clipboard.writeText(text);
  showAppAlert('✅ Rincian order lengkap berhasil disalin ke clipboard!');
}

// 9. Export Current Table to CSV / Excel
function exportPtoToExcel() {
  if (!ptoState.records || ptoState.records.length === 0) {
    showAppAlert('Tidak ada data order untuk diekspor.', true);
    return;
  }

  const headers = [
    'No', 'AWB', 'Nama Barang', 'Berat (kg)', 'Koli',
    'Outlet Asal', 'Kurir Jemput', 'Outlet Tujuan', 'Kota Tujuan',
    'Kode Sorting', 'Platform', 'Pengirim', 'Alamat Pengirim',
    'Penerima', 'Alamat Penerima', 'Waktu Input'
  ];

  const csvRows = [headers.join('\t')];

  ptoState.records.forEach((r, idx) => {
    const row = [
      idx + 1,
      r.waybillId || '',
      (r.goodsName || '').replace(/[\t\n\r]/g, ' '),
      r.packageTotalWeight || '0',
      r.packageNumber || '1',
      r.pickNetworkName || '',
      r.pickStaffName || '',
      r.dispatchNetworkCode || '',
      r.receiverCityName || '',
      r.terminalDispatchCode || '',
      r.orderSourceName || '',
      (r.senderName || '').replace(/[\t\n\r]/g, ' '),
      (r.senderDetailedAddress || '').replace(/[\t\n\r]/g, ' '),
      (r.receiverName || '').replace(/[\t\n\r]/g, ' '),
      (r.receiverDetailedAddress || '').replace(/[\t\n\r]/g, ' '),
      r.inputTime || ''
    ];
    csvRows.push(row.join('\t'));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nowStr = new Date().toISOString().slice(0, 10);
  a.download = `JFS_PTO_Orders_${nowStr}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAppAlert(`✅ Berhasil mengunduh ${ptoState.records.length} data order ke file Excel.`);
}

// 10. Copy Summary of Table Records
function copyPtoTableSummary() {
  if (!ptoState.records || ptoState.records.length === 0) {
    showAppAlert('Tidak ada data untuk disalin.', true);
    return;
  }

  let text = `📦 DAFTAR PELACAKAN TOTAL ORDER (PTO) - ${ptoState.records.length} Resi:\n`;
  ptoState.records.forEach((r, idx) => {
    const awb = r.waybillId || '-';
    const goods = r.goodsName || '-';
    const dest = r.dispatchNetworkCode || '-';
    const wt = r.packageTotalWeight ? `${r.packageTotalWeight}kg` : '';
    text += `${idx + 1}. ${awb} | ${goods} | ${dest} ${wt}\n`;
  });

  navigator.clipboard.writeText(text);
  const span = document.getElementById('btnCopyPtoSummaryText');
  if (span) {
    span.textContent = 'Tersalin ke Clipboard! ✅';
    setTimeout(() => { span.textContent = 'Salin Ringkasan'; }, 2000);
  }
}

// 11. Modal Config PTO Token
function openPtoConfigModal() {
  const modal = document.getElementById('ptoConfigModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closePtoConfigModal() {
  const modal = document.getElementById('ptoConfigModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function submitPtoConfig(e) {
  e.preventDefault();
  const input = document.getElementById('ptoInputToken');
  const tokenVal = input?.value.trim();
  if (!tokenVal) {
    alert('Token PTO tidak boleh kosong!');
    return;
  }

  try {
    const token = getToken();
    const res = await fetch('/api/pto/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ authtoken: tokenVal })
    });
    if (!res.ok) throw new Error('Gagal menyimpan token');
    showAppAlert('✅ Token PTO berhasil diperbarui!');
    closePtoConfigModal();
    fetchPtoConfig();
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

// 12. Setup Event Listeners
let ptoListenersInitialized = false;
function initPtoEventListeners() {
  if (ptoListenersInitialized) return;
  ptoListenersInitialized = true;

  // Preset Date Chips
  document.querySelectorAll('#ptoDatePresets .pto-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#ptoDatePresets .pto-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const days = chip.getAttribute('data-days');
      if (days === 'custom') return;

      const now = new Date();
      const numDays = parseInt(days, 10);
      const start = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);

      const startInput = document.getElementById('ptoStartDate');
      const endInput = document.getElementById('ptoEndDate');
      if (startInput) startInput.value = getPtoDateStr(start);
      if (endInput) endInput.value = getPtoDateStr(now);
    });
  });

  // Filter Form Submit
  const form = document.getElementById('ptoFilterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executePtoQuery(1);
    });
  }

  // Clear search input
  const btnClear = document.getElementById('btnClearPtoSearch');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      const input = document.getElementById('ptoWaybillSearch');
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  }

  // Reset Filter Button
  const btnReset = document.getElementById('btnResetPtoFilter');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      initPtoDates();
      const src = document.getElementById('ptoOrderSource');
      if (src) src.value = 'all';
      const size = document.getElementById('ptoPageSize');
      if (size) size.value = '100';
      const search = document.getElementById('ptoWaybillSearch');
      if (search) search.value = '';
      document.querySelectorAll('#ptoDatePresets .pto-chip').forEach(c => c.classList.remove('active'));
      const chip7 = document.querySelector('#ptoDatePresets .pto-chip[data-days="7"]');
      if (chip7) chip7.classList.add('active');
      executePtoQuery(1);
    });
  }

  // Export Excel
  const btnExport = document.getElementById('btnExportPtoExcel');
  if (btnExport) btnExport.addEventListener('click', exportPtoToExcel);

  // Copy Summary
  const btnCopy = document.getElementById('btnCopyPtoSummary');
  if (btnCopy) btnCopy.addEventListener('click', copyPtoTableSummary);

  // Detail Modal Buttons
  const closeDetail = document.getElementById('closePtoDetailModalBtn');
  const closeDetailBottom = document.getElementById('closePtoDetailModalBottomBtn');
  if (closeDetail) closeDetail.addEventListener('click', closePtoDetailModal);
  if (closeDetailBottom) closeDetailBottom.addEventListener('click', closePtoDetailModal);

  const btnCopySingle = document.getElementById('btnCopyPtoSingleDetail');
  if (btnCopySingle) btnCopySingle.addEventListener('click', copyPtoSingleDetail);

  const btnCopyWaybill = document.getElementById('btnCopyPtoWaybillNo');
  if (btnCopyWaybill) {
    btnCopyWaybill.addEventListener('click', () => {
      const d = ptoState.selectedRecord;
      if (d && d.waybillId) {
        navigator.clipboard.writeText(d.waybillId);
        showAppAlert(`No. Resi disalin: ${d.waybillId}`);
      }
    });
  }

  // Config Modal Buttons
  const btnOpenConfig = document.getElementById('btnOpenPtoConfigModal');
  const closeConfig = document.getElementById('closePtoConfigModalBtn');
  const cancelConfig = document.getElementById('cancelPtoConfigBtn');
  if (btnOpenConfig) btnOpenConfig.addEventListener('click', openPtoConfigModal);
  if (closeConfig) closeConfig.addEventListener('click', closePtoConfigModal);
  if (cancelConfig) cancelConfig.addEventListener('click', closePtoConfigModal);

  const configForm = document.getElementById('ptoConfigForm');
  if (configForm) configForm.addEventListener('submit', submitPtoConfig);

  // Pagination navigation buttons
  const btnFirst = document.getElementById('btnPtoFirstPage');
  const btnPrev = document.getElementById('btnPtoPrevPage');
  const btnNext = document.getElementById('btnPtoNextPage');
  const btnLast = document.getElementById('btnPtoLastPage');

  if (btnFirst) btnFirst.addEventListener('click', () => executePtoQuery(1));
  if (btnPrev) btnPrev.addEventListener('click', () => executePtoQuery(Math.max(1, ptoState.current - 1)));
  if (btnNext) btnNext.addEventListener('click', () => executePtoQuery(Math.min(ptoState.totalPages, ptoState.current + 1)));
  if (btnLast) btnLast.addEventListener('click', () => executePtoQuery(ptoState.totalPages));
}

// Auto-run if DOM loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Ready
  });
} else {
  // Ready
}

