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
let ptoAutoLoaded = false;
function initPtoModule() {
  initPtoDates();
  initPtoEventListeners();
  fetchPtoConfig();
  fetchPtoSyncStatus();
  setInterval(fetchPtoSyncStatus, 30000);
  // Otomatis tarik data pertama kali agar tabel langsung terisi ribuan data live
  if (!ptoAutoLoaded) {
    ptoAutoLoaded = true;
    setTimeout(() => {
      executePtoQuery(1);
    }, 250);
  }
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

// Parser Nomor Pesanan Shopee untuk Label Sobek (YYMMDD...)
function parseShopeeOrderSn(sn) {
  if (!sn) return null;
  const clean = String(sn).trim().toUpperCase();
  const match = clean.match(/^(\d{2})(\d{2})(\d{2})([A-Z0-9]{7,12})$/i);
  if (!match) return null;
  const yy = match[1];
  const mm = match[2];
  const dd = match[3];
  const mNum = parseInt(mm, 10);
  const dNum = parseInt(dd, 10);
  if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) return null;
  return {
    orderSn: clean,
    year: `20${yy}`,
    month: mm,
    day: dd,
    dateIso: `20${yy}-${mm}-${dd}`,
    dateFormatted: `${dd}/${mm}/20${yy}`
  };
}

// Set up Default Dates (Default 30 Hari agar mencakup seluruh order aktif)
function initPtoDates() {
  const startInput = document.getElementById('ptoStartDate');
  const endInput = document.getElementById('ptoEndDate');
  if (!startInput || !endInput) return;

  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  endInput.value = getPtoDateStr(now);
  startInput.value = getPtoDateStr(past30);
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
      const tokenInput = document.getElementById('ptoInputToken');
      if (tokenInput && cfg.authtoken) {
        tokenInput.value = cfg.authtoken;
      }
      const siteInput = document.getElementById('ptoSiteCode');
      if (siteInput && cfg.siteCode && !siteInput.value) {
        siteInput.value = cfg.siteCode;
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
    const siteVal = document.getElementById('ptoSiteCode')?.value.trim();
    const sourceVal = document.getElementById('ptoOrderSource')?.value;
    const goodsVal = document.getElementById('ptoGoodsName')?.value.trim();
    const personVal = document.getElementById('ptoPersonName')?.value.trim();
    const sizeVal = parseInt(document.getElementById('ptoPageSize')?.value, 10) || 100;
    const searchVal = document.getElementById('ptoWaybillSearch')?.value.trim();

    const startDate = startVal ? `${startVal} 00:00:00` : undefined;
    const endDate = endVal ? `${endVal} 23:59:59` : undefined;

    const payload = {
      startDate,
      endDate,
      siteCode: siteVal || 'JKT99A',
      current: targetPage,
      size: sizeVal,
      orderSourceName: sourceVal !== 'all' ? sourceVal : undefined
    };

    if (goodsVal) {
      payload.goodsName = goodsVal;
    }
    if (personVal) {
      payload.personName = personVal;
    }
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
    const siteVal = (document.getElementById('ptoSiteCode')?.value || '').trim().toUpperCase();
    const isGatewaySite = siteVal === 'JKT99A';
    const isSearchEmpty = !(document.getElementById('ptoWaybillSearch')?.value || '').trim();

    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="pto-empty-state">
          <div class="pto-empty-content" style="padding: 30px 20px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" style="margin-bottom: 8px;">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p style="font-weight: 700; color: #cbd5e1; font-size: 1rem; margin-bottom: 4px;">Tidak Ada Data Order yang Ditemukan</p>
            <span style="font-size: 0.84rem; color: #94a3b8; max-width: 600px; display: inline-block; line-height: 1.5;">
              ${(isGatewaySite && isSearchEmpty)
                ? 'ℹ️ <strong>Kode Site JKT99A</strong> adalah Pusat Transit Gateway (bukan outlet drop point pengambilan paket).<br>👉 Masukkan <strong>Nomor Resi / AWB</strong> di kolom pencarian di atas untuk melacak paket, atau masukkan <strong>Kode Outlet / Drop Point</strong> asal Anda.'
                : 'Tidak ditemukan order pada rentang tanggal atau nomor resi yang dimasukkan. Coba luaskan rentang tanggal atau periksa nomor resi.'}
            </span>
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
    const goodsType = r.goodsTypeName || '-';
    const weight = r.packageTotalWeight ? `${parseFloat(r.packageTotalWeight).toFixed(2)} kg` : '-';
    const koli = r.packageNumber ? `${r.packageNumber} koli` : '1 koli';
    const origin = r.pickNetworkName || '-';
    const dest = r.dispatchNetworkCode || '-';
    const destCity = r.receiverCityName ? ` • ${r.receiverCityName}` : '';
    const sorting = r.terminalDispatchCode || '-';
    const source = r.orderSourceName || 'Reguler';
    const orderNo = r.customerOrderNo || r.customerOrderId || r.customerOrderCode || '-';
    const senderCompany = r.senderCompanyName || r.customerName || '-';
    const sender = r.senderName || '-';
    const senderMobile = r.senderMobile || r.senderMobilePhone || '-';
    const senderCity = r.senderCityName ? `<br><small style="color: #64748b; font-size: 0.72rem;">${r.senderCityName}</small>` : '';
    const receiver = r.receiverName || '-';
    const receiverCompany = r.receiverCompanyName || '-';
    const receiverMobile = r.receiverMobile || r.receiverMobilePhone || '-';
    const receiverAddress = r.receiverDetailedAddress || '-';
    const codVal = parseFloat(r.goodsValue || r.codAmount || 0);
    const codFormatted = codVal > 0 ? `Rp ${formatPtoNumber(codVal)}` : 'Rp 0';
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
          <span class="pto-source-badge ${sourceBadgeClass}">${escPtoHtml(source)}</span>
          ${orderNo && orderNo !== '-' ? `<small style="font-family: monospace; color: #94a3b8; font-size: 0.71rem; display: block; margin-top: 3px;" title="No. Pesanan: ${escPtoHtml(orderNo)}">${escPtoHtml(orderNo)}</small>` : ''}
        </td>
        <td>
          <div class="pto-goods-cell" title="${escPtoHtml(goods)}">
            ${escPtoHtml(goods)}
          </div>
          ${goodsType && goodsType !== '-' ? `<small style="color: #64748b; font-size: 0.71rem; display: block; margin-top: 2px;">${escPtoHtml(goodsType)}</small>` : ''}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <span style="font-weight: 700; color: #f8fafc;">${weight}</span>
          <small style="color: #94a3b8; display: block; font-size: 0.72rem;">${koli}</small>
        </td>
        <td>
          <span style="font-weight: 600; color: #38bdf8; font-size: 0.8rem; display: block; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escPtoHtml(senderCompany)}">${escPtoHtml(senderCompany)}</span>
        </td>
        <td style="font-size: 0.8rem;">
          <span style="color: #cbd5e1; font-weight: 500;">${escPtoHtml(sender)}</span>
          ${senderMobile && senderMobile !== '-' ? `<small style="color: #64748b; font-family: monospace; display: block; font-size: 0.72rem;">${escPtoHtml(senderMobile)}</small>` : ''}
          ${senderCity}
        </td>
        <td>
          <span class="pto-origin-badge">${escPtoHtml(origin)}</span>
          <span class="pto-sorting-badge" style="display: block; margin-top: 3px; font-size: 0.68rem;">${escPtoHtml(sorting)}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: #e2e8f0; font-size: 0.82rem;">${escPtoHtml(dest)}</div>
          <small style="color: #94a3b8; font-size: 0.73rem;">${escPtoHtml(destCity)}</small>
        </td>
        <td>
          <strong style="color: #f8fafc; font-weight: 600; font-size: 0.82rem;">${escPtoHtml(receiver)}</strong>
        </td>
        <td>
          <span style="color: #cbd5e1; font-size: 0.8rem; display: block; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escPtoHtml(receiverCompany)}">${escPtoHtml(receiverCompany)}</span>
        </td>
        <td style="white-space: nowrap;">
          <span style="font-family: monospace; font-size: 0.78rem; color: #22d3ee;">${escPtoHtml(receiverMobile)}</span>
        </td>
        <td>
          <div style="max-width: 240px; font-size: 0.76rem; color: #94a3b8; line-height: 1.35; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${escPtoHtml(receiverAddress)}">
            ${escPtoHtml(receiverAddress)}
          </div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <span style="font-weight: 700; color: #fbbf24; font-size: 0.8rem;">${codFormatted}</span>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-pto-view-detail" onclick="openPtoOrderDetail('${escPtoHtml(r.id)}', ${idx})" title="Lihat Rincian Lengkap">Detail</button>
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
      <p style="margin-top: 10px; font-weight: 600;">Memuat detail lengkap dan membuka sensor JFS...</p>
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

  const codVal = parseFloat(d.goodsValue || d.codAmount || 0);
  const codFormatted = codVal > 0 ? `Rp ${formatPtoNumber(codVal)}` : 'Rp 0 (Non-COD)';

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
            <span class="pto-label">Kategori / Jenis Barang:</span>
            <span class="pto-val">${escPtoHtml(d.goodsTypeName || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Total Berat Asli:</span>
            <strong class="pto-val text-cyan">${d.packageTotalWeight ? d.packageTotalWeight + ' kg' : '-'}</strong>
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
            <span class="pto-label">Jumlah Pembayaran COD:</span>
            <strong class="pto-val text-amber">${codFormatted}</strong>
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
              <span class="pto-label">Perusahaan / Toko Pengirim:</span>
              <strong class="pto-val text-cyan">${escPtoHtml(d.senderCompanyName || d.customerName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nama Pengirim:</span>
              <strong class="pto-val">${escPtoHtml(d.senderName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nomor Ponsel Pengirim:</span>
              <span class="pto-val" style="font-family: monospace;">${escPtoHtml(d.senderMobile || d.senderMobilePhone || d.senderTelphone || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Area / Kota / Provinsi:</span>
              <span class="pto-val">${escPtoHtml(d.senderAreaName || '-')}, ${escPtoHtml(d.senderCityName || '-')}, ${escPtoHtml(d.senderProvinceName || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Alamat Lengkap Pengirim:</span>
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
              <span class="pto-label">Perusahaan Penerima:</span>
              <strong class="pto-val text-cyan">${escPtoHtml(d.receiverCompanyName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nama Penerima (Asli):</span>
              <strong class="pto-val text-white" style="font-size: 0.95rem;">${escPtoHtml(d.receiverName || '-')}</strong>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Nomor Ponsel / Telp Penerima:</span>
              <span class="pto-val text-cyan" style="font-family: monospace; font-size: 0.9rem; font-weight: 700;">${escPtoHtml(d.receiverMobile || d.receiverMobilePhone || d.receiverTelphone || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Area / Kota / Provinsi:</span>
              <span class="pto-val">${escPtoHtml(d.receiverAreaName || '-')}, ${escPtoHtml(d.receiverCityName || '-')}, ${escPtoHtml(d.receiverProvinceName || '-')}</span>
            </div>
            <div class="pto-detail-item">
              <span class="pto-label">Alamat Lengkap Tujuan:</span>
              <p class="pto-val-address" style="color: #f1f5f9; font-weight: 500;">${escPtoHtml(d.receiverDetailedAddress || '-')}</p>
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
            <span class="pto-label">Outlet Penjemput (Origin):</span>
            <strong class="pto-val">${escPtoHtml(d.pickNetworkName || '-')}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Ten Letter Code (TLC):</span>
            <strong class="pto-val text-cyan">${escPtoHtml(d.terminalDispatchCode || '-')}</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Outlet Tujuan Delivery:</span>
            <strong class="pto-val">${escPtoHtml(d.dispatchNetworkCode || '-')} (${escPtoHtml(d.dispatchNetworkName || '-')})</strong>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Gateway Asal:</span>
            <span class="pto-val">${escPtoHtml(d.sourceNetworkCode || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Gateway Tujuan:</span>
            <span class="pto-val">${escPtoHtml(d.destGateway || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Kode Rute:</span>
            <span class="pto-val" style="font-family: monospace;">${escPtoHtml(d.transferPath || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Nomor Pesanan Pelanggan:</span>
            <span class="pto-val" style="font-family: monospace;">${escPtoHtml(d.customerOrderNo || d.customerOrderId || d.customerOrderCode || '-')}</span>
          </div>
          <div class="pto-detail-item">
            <span class="pto-label">Waktu Input Order:</span>
            <span class="pto-val">${escPtoHtml(d.inputTime || '-')}</span>
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

  const codVal = parseFloat(d.goodsValue || d.codAmount || 0);
  const codFormatted = codVal > 0 ? `Rp ${formatPtoNumber(codVal)}` : 'Rp 0 (Non-COD)';

  const text = `📦 DETAIL ORDER RESI JFS (PTO)
AWB: ${d.waybillId || '-'}
No. Pesanan: ${d.customerOrderNo || d.customerOrderId || '-'}
Platform: ${d.orderSourceName || '-'}
Nama Barang: ${d.goodsName || '-'} (${d.goodsTypeName || 'Lainnya'})
Berat: ${d.packageTotalWeight || '0'} kg (${d.packageNumber || 1} Koli)
Nilai COD: ${codFormatted}

🏢 PENGIRIM:
Toko/Perusahaan: ${d.senderCompanyName || d.customerName || '-'}
Nama Pengirim: ${d.senderName || '-'}
No. HP: ${d.senderMobile || d.senderMobilePhone || '-'}
Alamat Asal: ${d.senderDetailedAddress || '-'}

👤 PENERIMA:
Nama Penerima: ${d.receiverName || '-'}
Perusahaan Penerima: ${d.receiverCompanyName || '-'}
No. HP: ${d.receiverMobile || d.receiverMobilePhone || '-'}
Alamat Lengkap: ${d.receiverDetailedAddress || '-'}

🚚 OPERASIONAL & RUTE:
Outlet Asal: ${d.pickNetworkName || '-'}
Outlet Tujuan: ${d.dispatchNetworkCode || '-'} (${d.receiverCityName || '-'})
TLC (Ten Letter Code): ${d.terminalDispatchCode || '-'}
Gateway Asal: ${d.sourceNetworkCode || '-'}
Gateway Tujuan: ${d.destGateway || '-'}
Kode Rute: ${d.transferPath || '-'}
Waktu Input: ${d.inputTime || '-'}`;

  navigator.clipboard.writeText(text);
  showAppAlert('✅ Rincian order lengkap berhasil disalin ke clipboard!');
}

// 9. Export Current Table to CSV / Excel (36 Kolom Lengkap JFS)
function exportPtoToExcel() {
  if (!ptoState.records || ptoState.records.length === 0) {
    showAppAlert('Tidak ada data order untuk diekspor.', true);
    return;
  }

  const headers = [
    'Waybill Utama', 'Nama Barang', 'Sumber Pesanan', 'Outlet Pengirim',
    'Kode Pos Pengirim', 'Provinsi Pengirim', 'Kota Pengirim', 'Area Pengirim',
    'Alamat Lengkap Pengirim', 'Pengirim', 'nomor ponsel pengirim', 'Ten letter code',
    'Nama Outlet Delivery', 'Gateway asal', 'Gateway tujuan', 'Kode rute',
    'Nomor pesanan pelanggan', 'Perusahaan pengirim', 'Telepon rumah pengirim', 'Kelurahan Pengirim',
    'Penerima', 'perusahaan penerima paket', 'nomor handphone penerima', 'nomor telepon penerima',
    'negara penerima', 'Provinsi penerima', 'Kota penerima', 'area penerima',
    'Kelurahan Penerima', 'jalan penerima paket', 'Alamat Lengkap Penerima', 'Kode Pos Penerima',
    'jumlah pembayaran COD', 'Jenis Barang', 'Jumlah Koli', 'Berat Pick-up'
  ];

  const csvRows = [headers.join('\t')];

  ptoState.records.forEach((r) => {
    const codVal = parseFloat(r.goodsValue || r.codAmount || 0);
    const row = [
      r.waybillId || '',
      (r.goodsName || '').replace(/[\t\n\r]/g, ' '),
      r.orderSourceName || '',
      r.pickNetworkName || '',
      r.senderPostcode || '',
      r.senderProvinceName || '',
      r.senderCityName || '',
      r.senderAreaName || '',
      (r.senderDetailedAddress || '').replace(/[\t\n\r]/g, ' '),
      (r.senderName || '').replace(/[\t\n\r]/g, ' '),
      r.senderMobile || r.senderMobilePhone || '',
      r.terminalDispatchCode || '',
      r.dispatchNetworkCode || '',
      r.sourceNetworkCode || '',
      r.destGateway || '',
      r.transferPath || '',
      r.customerOrderNo || r.customerOrderId || '',
      (r.senderCompanyName || r.customerName || '').replace(/[\t\n\r]/g, ' '),
      r.senderTelphone || '',
      r.senderTownName || '',
      (r.receiverName || '').replace(/[\t\n\r]/g, ' '),
      (r.receiverCompanyName || '').replace(/[\t\n\r]/g, ' '),
      r.receiverMobile || r.receiverMobilePhone || '',
      r.receiverTelphone || '',
      'Indonesia',
      r.receiverProvinceName || '',
      r.receiverCityName || '',
      r.receiverAreaName || '',
      r.receiverTownName || '',
      r.receiverStreetName || '',
      (r.receiverDetailedAddress || '').replace(/[\t\n\r]/g, ' '),
      r.receiverPostcode || '',
      codVal.toFixed(2),
      r.goodsTypeName || 'Lainnya',
      r.packageNumber || '1',
      r.packageTotalWeight || '0.00'
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

  showAppAlert(`✅ Berhasil mengunduh ${ptoState.records.length} data order lengkap (36 kolom) ke file Excel.`);
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

// 11B. Import File Excel PTO (36 Kolom Lengkap JFS Pelacakan Total Order)
function initPtoImportHandler() {
  const btnImport = document.getElementById('btnImportPtoExcel');
  const fileInput = document.getElementById('inputPtoExcelFile');

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => {
      fileInput.value = '';
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      showAppAlert(`⏳ Sedang membaca file Excel ${file.name}...`);

      try {
        const data = await file.arrayBuffer();
        let rows = [];

        if (typeof XLSX !== 'undefined') {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        } else {
          const text = new TextDecoder('utf-8').decode(data);
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const sep = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
              const obj = {};
              headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
              rows.push(obj);
            }
          }
        }

        if (!rows || rows.length === 0) {
          showAppAlert('❌ File kosong atau kolom tidak terbaca.', true);
          return;
        }

        showAppAlert(`📤 Mengunggah ${rows.length} data order resmi JFS PTO...`);

        const token = getToken();
        const res = await fetch('/api/pto/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ rows })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal menyimpan data import');
        }

        showAppAlert(`✅ ${json.message || `Berhasil mengimpor ${rows.length} order!`}`);
        // Refresh PTO table immediately
        executePtoQuery(1);
      } catch (err) {
        console.error('Import PTO Error:', err);
        showAppAlert(`❌ Gagal import: ${err.message}`, true);
      }
    });
  }
}

// 11C. Sinkronisasi PTO Otomatis (Live JFS OMS)
async function fetchPtoSyncStatus() {
  try {
    const token = getToken();
    const res = await fetch('/api/pto/sync-status', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      const statusText = document.getElementById('ptoSyncStatusText');
      if (statusText) {
        if (data.isSyncInProgress) {
          statusText.textContent = 'Menyinkronkan...';
        } else if (data.totalOrders > 0) {
          statusText.textContent = `Auto-Sync Aktif (${formatPtoNumber(data.totalOrders)} Order)`;
        } else {
          statusText.textContent = 'Auto-Sync Aktif';
        }
      }
    }
  } catch (_) {}
}

async function triggerPtoManualSync() {
  const btn = document.getElementById('btnSyncPtoLive');
  const textSpan = document.getElementById('btnSyncPtoLiveText');
  const origText = textSpan ? textSpan.textContent : 'Sinkronkan PTO';

  if (btn) btn.disabled = true;
  if (textSpan) textSpan.textContent = 'Menyinkronkan...';
  showAppAlert('⏳ Sedang menyinkronkan data PTO langsung dari JFS...');

  try {
    const token = getToken();
    const res = await fetch('/api/pto/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const result = await res.json();
    if (!res.ok || result.success === false) {
      throw new Error(result.message || result.error || 'Gagal sinkronisasi PTO');
    }

    showAppAlert(`✅ ${result.message}`);
    await fetchPtoSyncStatus();
    await executePtoQuery(1);
  } catch (err) {
    showAppAlert(`❌ Gagal sinkron PTO: ${err.message}`, true);
  } finally {
    if (btn) btn.disabled = false;
    if (textSpan) textSpan.textContent = origText;
  }
}

// 12. Setup Event Listeners
let ptoListenersInitialized = false;
function initPtoEventListeners() {
  if (ptoListenersInitialized) return;
  ptoListenersInitialized = true;

  initPtoImportHandler();

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

  // Smart Multi-AWB & Shopee Order Detection on Search Input
  const ptoSearchInput = document.getElementById('ptoWaybillSearch');
  const ptoSearchBadge = document.getElementById('ptoSearchCountBadge');

  if (ptoSearchInput) {
    const updatePtoSearchBadge = () => {
      const val = ptoSearchInput.value.trim();
      if (!val) {
        if (ptoSearchBadge) ptoSearchBadge.classList.add('hidden');
        return;
      }

      // Pisahkan berdasarkan baris baru (enter), koma, titik koma, spasi, atau tab
      const items = val.split(/[\s,;\n\t]+/).map(s => s.trim()).filter(Boolean);
      if (items.length > 1) {
        if (ptoSearchBadge) {
          ptoSearchBadge.textContent = `${items.length} Resi / Order Terdeteksi`;
          ptoSearchBadge.classList.remove('hidden');
        }
      } else if (items.length === 1 && /[*%]|.{2,}/.test(items[0])) {
        if (ptoSearchBadge) {
          ptoSearchBadge.textContent = 'Pencarian Resi Sobek (Wildcard)';
          ptoSearchBadge.classList.remove('hidden');
        }
      } else {
        if (ptoSearchBadge) ptoSearchBadge.classList.add('hidden');
      }

      // Deteksi otomatis jika hanya 1 nomor dan itu nomor pesanan Shopee (YYMMDD...)
      if (items.length === 1) {
        const parsed = parseShopeeOrderSn(items[0]);
        if (parsed) {
          const startInput = document.getElementById('ptoStartDate');
          const endInput = document.getElementById('ptoEndDate');
          const srcSelect = document.getElementById('ptoOrderSource');
          if (startInput) startInput.value = parsed.dateIso;
          if (endInput) endInput.value = parsed.dateIso;
          if (srcSelect) {
            const shopeeOpt = Array.from(srcSelect.options).find(o => o.value.toLowerCase().includes('shopee') || o.text.toLowerCase().includes('shopee'));
            if (shopeeOpt) srcSelect.value = shopeeOpt.value;
          }
          showAppAlert(`💡 Terdeteksi No Pesanan Shopee (${parsed.orderSn}) tanggal ${parsed.dateFormatted}! Filter tanggal otomatis diarahkan.`, false);
        }
      }
    };

    ptoSearchInput.addEventListener('input', updatePtoSearchBadge);
    ptoSearchInput.addEventListener('paste', () => setTimeout(updatePtoSearchBadge, 50));

    // Shortcut: Tekan Ctrl+Enter atau Cmd+Enter untuk langsung menarik/mencari data PTO
    ptoSearchInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executePtoQuery(1);
      }
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
      if (ptoSearchBadge) ptoSearchBadge.classList.add('hidden');
    });
  }

  // Reset Filter Button
  const btnReset = document.getElementById('btnResetPtoFilter');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      initPtoDates();
      const src = document.getElementById('ptoOrderSource');
      if (src) src.value = 'all';
      const goods = document.getElementById('ptoGoodsName');
      if (goods) goods.value = '';
      const person = document.getElementById('ptoPersonName');
      if (person) person.value = '';
      const size = document.getElementById('ptoPageSize');
      if (size) size.value = '100';
      const search = document.getElementById('ptoWaybillSearch');
      if (search) search.value = '';
      if (ptoSearchBadge) ptoSearchBadge.classList.add('hidden');
      document.querySelectorAll('#ptoDatePresets .pto-chip').forEach(c => c.classList.remove('active'));
      const chip30 = document.querySelector('#ptoDatePresets .pto-chip[data-days="30"]');
      if (chip30) chip30.classList.add('active');
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
    initPtoModule();
  });
} else {
  initPtoModule();
}

