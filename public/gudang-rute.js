/**
 * GUDANG & RUTE (INTERNAL / EKSTERNAL) - FRONTEND MODULE
 * Analisis Stok Gudang Feishu 258MB, Smart Enrichment, & Live POD Tracking
 */

let gudangState = {
  page: 1,
  limit: 50,
  search: '',
  col_waybill: '',
  col_nama_barang: '',
  col_pengirim: '',
  col_penerima: '',
  col_alamat: '',
  col_rute: '',
  col_durasi_min: '',
  col_durasi_max: '',
  holdingGw: 'ALL',
  destGw: 'ALL',
  tipeJalur: 'ALL',
  aging: 'ALL',
  enrichStatus: 'all',
  sortBy: 'durasi_jam',
  sortDir: 'DESC',
  totalRows: 0,
  totalPages: 1,
  isLoading: false,
  activeTraceWaybill: null,
  activeTraceData: null,
  pollTimer: null
};

// 1. Initial Dashboard Load
async function loadGudangRuteDashboard() {
  await fetchGudangFileInfo();
  await fetchGudangInventory();
}

// 2. Fetch File Info and Check Status
async function fetchGudangFileInfo() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/latest-file', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success) return;

    const badge = document.getElementById('gudangBatchTimeLabel');
    if (badge) {
      if (json.latestFile) {
        badge.textContent = `File: ${json.latestFile.fileName.substring(0, 30)}... (${json.latestFile.sizeMB} MB)`;
        badge.title = `File: ${json.latestFile.filePath} | Dimodifikasi: ${new Date(json.latestFile.mtime).toLocaleString('id-ID')}`;
      } else if (json.stats && json.stats.latestBatchTime !== '-') {
        badge.textContent = `Batch: ${json.stats.latestBatchTime}`;
      } else {
        badge.textContent = 'Batch: Belum ada file';
      }
    }

    // Check if import is in progress
    checkGudangImportStatus();
  } catch (err) {
    console.warn('fetchGudangFileInfo error:', err);
  }
}

// 3. Trigger 1-Click Import from Downloads
async function importLatestGudangRuteFile() {
  const btn = document.getElementById('btnImportLatestGudang');
  const btnText = document.getElementById('btnImportLatestText');
  
  if (!confirm('Mulai baca file Excel terbaru (258MB) dari folder Downloads secara streaming?\nProses berlangsung di latar belakang dengan Smart-Merge anti timpa.')) {
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = '⏳ Memulai Impor...';

  try {
    const token = localStorage.getItem('token');
    const holdingGwFilter = 'ALL'; // Import seluruh waybill se-Indonesia

    const res = await fetch('/api/gudang-rute/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ filterGw: holdingGwFilter })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal memulai impor file Excel.');
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '⚡ Baca File Terbaru (Downloads)';
      return;
    }

    // Show progress bar & start polling
    showGudangProgress(true);
    startGudangPolling();
  } catch (err) {
    alert('Terjadi kesalahan saat memulai impor: ' + err.message);
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = '⚡ Baca File Terbaru (Downloads)';
  }
}

function showGudangProgress(show) {
  const pBar = document.getElementById('gudangImportProgressBar');
  if (pBar) pBar.style.display = show ? 'block' : 'none';
}

function startGudangPolling() {
  if (gudangState.pollTimer) clearInterval(gudangState.pollTimer);
  gudangState.pollTimer = setInterval(checkGudangImportStatus, 2000);
}

async function checkGudangImportStatus() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/import-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const json = await res.json();

    const pBar = document.getElementById('gudangImportProgressBar');
    const pTitle = document.getElementById('gudangProgressTitle');
    const pCount = document.getElementById('gudangProgressCount');
    const pMsg = document.getElementById('gudangProgressMessage');
    const btn = document.getElementById('btnImportLatestGudang');
    const btnText = document.getElementById('btnImportLatestText');

    if (json.isImporting) {
      showGudangProgress(true);
      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = '⏳ Mengimpor...';

      if (pTitle) pTitle.textContent = `Memproses: ${json.progress?.fileName || 'Excel 258MB'}`;
      if (pCount) pCount.textContent = `${(json.progress?.totalProcessed || 0).toLocaleString('id-ID')} waybill`;
      if (pMsg) pMsg.textContent = json.progress?.message || 'Sedang memproses...';
    } else {
      if (gudangState.pollTimer) {
        clearInterval(gudangState.pollTimer);
        gudangState.pollTimer = null;
      }

      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '⚡ Baca File Terbaru (Downloads)';

      if (json.progress?.status === 'success') {
        showGudangProgress(false);
        // Refresh table & file info
        fetchGudangFileInfo();
        fetchGudangInventory();
      } else if (json.progress?.status === 'error') {
        showGudangProgress(false);
        alert('Impor gagal: ' + (json.progress?.message || 'Error'));
      }
    }
  } catch (err) {
    console.warn('checkGudangImportStatus error:', err);
  }
}

// 4. Fetch Inventory Records
async function fetchGudangInventory() {
  if (gudangState.isLoading) return;
  gudangState.isLoading = true;

  const tbody = document.getElementById('tbodyGudangRute');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 40px; color: #94a3b8;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span class="spinner-small" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
            <span>Memuat data stok &amp; rute gudang...</span>
          </div>
        </td>
      </tr>
    `;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        search: gudangState.search,
        col_waybill: gudangState.col_waybill,
        col_nama_barang: gudangState.col_nama_barang,
        col_pengirim: gudangState.col_pengirim,
        col_penerima: gudangState.col_penerima,
        col_alamat: gudangState.col_alamat,
        col_rute: gudangState.col_rute,
        col_durasi_min: gudangState.col_durasi_min,
        col_durasi_max: gudangState.col_durasi_max,
        holding_gw: gudangState.holdingGw,
        gw_tujuan: gudangState.destGw,
        tipe_jalur: gudangState.tipeJalur,
        durasi_kategori: gudangState.aging,
        is_problem: gudangState.is_problem || '',
        enrich_status: gudangState.enrichStatus,
        page: gudangState.page,
        limit: gudangState.limit,
        sortBy: gudangState.sortBy,
        sortDir: gudangState.sortDir
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat data inventaris');
    }

    // Populate filter dropdowns if options not filled
    populateGudangDropdowns(json.holdingGateways, json.destGateways);

    // Update KPI Cards
    updateGudangKpis(json.stats);

    // Render Table
    renderGudangTable(json.data);

    // Update Pagination
    updateGudangPagination(json.pagination);
  } catch (err) {
    console.error('fetchGudangInventory error:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 30px; color: #f87171;">
            Gagal memuat data: ${err.message}
          </td>
        </tr>
      `;
    }
  } finally {
    gudangState.isLoading = false;
  }
}

function updateGudangKpis(stats = {}) {
  const total = stats.totalRows || 0;
  const enriched = stats.totalEnriched || 0;
  const percent = total > 0 ? ((enriched / total) * 100).toFixed(1) : 0;

  const elTotal = document.getElementById('kpiGudangTotal');
  const elBerat = document.getElementById('kpiGudangBerat');
  const elVol = document.getElementById('kpiGudangVolume');
  const elEnrich = document.getElementById('kpiGudangEnriched');
  const elEnrichPct = document.getElementById('kpiGudangEnrichPercent');
  const elProblem = document.getElementById('kpiGudangProblem');
  const elAvg = document.getElementById('kpiGudangAvgHours');

  if (elTotal) elTotal.textContent = total.toLocaleString('id-ID');
  if (elBerat) elBerat.textContent = `${Number(stats.totalWeight || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
  if (elVol) elVol.textContent = `(${Number(stats.totalVolume || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} m³)`;
  if (elEnrich) elEnrich.textContent = enriched.toLocaleString('id-ID');
  if (elEnrichPct) elEnrichPct.textContent = `(${percent}%)`;
  if (elProblem) elProblem.textContent = (stats.totalProblem || 0).toLocaleString('id-ID');
  if (elAvg) elAvg.textContent = Number(stats.avgDuration || 0).toFixed(1);
}

function populateGudangDropdowns(holdingGws = [], destGws = []) {
  const selHolding = document.getElementById('gudangFilterHoldingGw');
  if (selHolding && holdingGws && holdingGws.length > 0 && selHolding.options.length <= 2) {
    const curVal = selHolding.value;
    selHolding.innerHTML = '<option value="ALL">Semua Gateway</option>';
    holdingGws.forEach(gw => {
      const opt = document.createElement('option');
      opt.value = gw;
      opt.textContent = gw;
      selHolding.appendChild(opt);
    });
    selHolding.value = curVal;
  }

  const selDest = document.getElementById('gudangFilterDestGw');
  if (selDest && destGws && destGws.length > 0 && selDest.options.length <= 1) {
    const curVal = selDest.value;
    selDest.innerHTML = '<option value="ALL">Semua Tujuan</option>';
    destGws.forEach(gw => {
      const opt = document.createElement('option');
      opt.value = gw;
      opt.textContent = gw;
      selDest.appendChild(opt);
    });
    selDest.value = curVal;
  }
}

function renderGudangTable(rows = []) {
  const tbody = document.getElementById('tbodyGudangRute');
  if (!tbody) return;

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 40px; color: #94a3b8;">
          Tidak ada data waybill yang cocok dengan filter atau pencarian saat ini.
        </td>
      </tr>
    `;
    return;
  }

  const startNo = (gudangState.page - 1) * gudangState.limit + 1;
  const html = rows.map((r, idx) => {
    const no = startNo + idx;

    // Aging color
    const durasi = Number(r.durasi_jam) || 0;
    let badgeColor = '#34d399';
    let badgeBg = 'rgba(52, 211, 153, 0.15)';
    if (durasi > 72) {
      badgeColor = '#f87171';
      badgeBg = 'rgba(248, 113, 113, 0.2)';
    } else if (durasi > 48) {
      badgeColor = '#fb923c';
      badgeBg = 'rgba(251, 146, 60, 0.2)';
    } else if (durasi > 24) {
      badgeColor = '#fbbf24';
      badgeBg = 'rgba(251, 191, 36, 0.18)';
    } else if (durasi > 12) {
      badgeColor = '#38bdf8';
      badgeBg = 'rgba(56, 189, 248, 0.15)';
    }

    // Goods name display
    const hasGoods = Boolean(r.nama_barang && r.nama_barang.trim());
    const goodsDisplay = hasGoods 
      ? `<div style="font-weight: 600; color: #f8fafc; font-size: 0.84rem; line-height: 1.3;" title="${escapeHtml(r.nama_barang)}">${escapeHtml(r.nama_barang)}</div>`
      : `<span style="font-size: 0.76rem; color: #64748b; font-style: italic;">Belum ada nama barang</span>`;

    // Sender display
    const senderDisplay = `
      <div style="font-weight: 600; color: #e2e8f0;">${escapeHtml(r.pengirim || '-')}</div>
      ${r.perusahaan_pengirim ? `<div style="font-size: 0.74rem; color: #94a3b8;">${escapeHtml(r.perusahaan_pengirim)}</div>` : ''}
      ${r.no_hp_pengirim ? `<div style="font-size: 0.74rem; color: #38bdf8; font-family: monospace;">${escapeHtml(r.no_hp_pengirim)}</div>` : ''}
    `;

    // Receiver display with WA link
    const cleanPhone = (r.no_hp_penerima || '').replace(/\D/g, '');
    const waLink = cleanPhone.length >= 8 
      ? `<a href="https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}" target="_blank" style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; color: #22c55e; text-decoration: none; margin-left: 4px;" title="Chat WhatsApp">WA &raquo;</a>` 
      : '';

    const receiverDisplay = `
      <div style="font-weight: 600; color: #e2e8f0;">${escapeHtml(r.penerima || '-')}</div>
      ${r.perusahaan_penerima ? `<div style="font-size: 0.74rem; color: #94a3b8;">${escapeHtml(r.perusahaan_penerima)}</div>` : ''}
      ${r.no_hp_penerima ? `<div style="font-size: 0.74rem; color: #38bdf8; font-family: monospace;">${escapeHtml(r.no_hp_penerima)} ${waLink}</div>` : ''}
    `;

    // Address
    const addressDisplay = r.alamat_penerima 
      ? `<div style="font-size: 0.76rem; color: #cbd5e1; max-width: 220px; word-break: break-word; line-height: 1.3;" title="${escapeHtml(r.alamat_penerima)}">${escapeHtml(r.alamat_penerima)}</div>` 
      : `<span style="font-size: 0.74rem; color: #64748b;">-</span>`;

    // Problem badge
    const isProblem = (r.is_problem === 'ya' || r.is_problem === '1');
    const problemBadge = isProblem 
      ? `<span style="padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; background: rgba(248, 113, 113, 0.2); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.35);">Bermasalah</span>`
      : `<span style="padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; background: rgba(148, 163, 184, 0.1); color: #94a3b8;">Normal</span>`;

    // Route & line type
    const routeDisplay = `
      <div style="font-weight: 600; color: #e2e8f0; font-size: 0.78rem;">${escapeHtml(r.rute || (r.holding_gw + ' → ' + (r.gw_tujuan || '-')))}</div>
      <div style="font-size: 0.72rem; color: #a78bfa; margin-top: 2px;">
        ${escapeHtml(r.tipe_jalur || 'Eksternal/Internal')} | Dest: <b>${escapeHtml(r.outlet_tujuan || '-')}</b>
      </div>
    `;

    return `
      <tr style="border-bottom: 1px solid var(--border-color, #334155); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(56, 189, 248, 0.04)'" onmouseout="this.style.background='transparent'">
        <td style="padding: 10px 8px; text-align: center; color: #94a3b8;">${no}</td>
        
        <!-- WAYBILL -->
        <td style="padding: 10px 10px;">
          <div style="font-family: monospace; font-weight: 700; color: #38bdf8; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="openPodTraceModal('${r.waybill}')" title="Klik untuk lacak alur scan POD">
            <span>${r.waybill}</span>
          </div>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
            ${Number(r.berat || 0).toFixed(1)} kg | ${Number(r.volume || 0).toFixed(3)} m³
          </div>
        </td>

        <!-- NAMA BARANG -->
        <td style="padding: 10px 10px;">${goodsDisplay}</td>

        <!-- PENGIRIM -->
        <td style="padding: 10px 10px;">${senderDisplay}</td>

        <!-- PENERIMA -->
        <td style="padding: 10px 10px;">${receiverDisplay}</td>

        <!-- ALAMAT -->
        <td style="padding: 10px 10px;">${addressDisplay}</td>

        <!-- GUDANG SAAT INI -->
        <td style="padding: 10px 10px;">
          <span style="font-weight: 600; color: #e2e8f0; font-size: 0.8rem;">${escapeHtml(r.holding_gw || '-')}</span>
          <div style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(r.status_simpan || 'Di Gudang')}</div>
        </td>

        <!-- DURASI SIMPAN -->
        <td style="padding: 10px 10px; text-align: center;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.82rem; background: ${badgeBg}; color: ${badgeColor};">
            ${durasi.toFixed(1)} Jam
          </span>
          <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(r.durasi_kategori || '')}</div>
        </td>

        <!-- RUTE & JALUR -->
        <td style="padding: 10px 10px;">${routeDisplay}</td>

        <!-- STATUS -->
        <td style="padding: 10px 10px; text-align: center;">
          ${problemBadge}
          ${r.status_penangguhan ? `<div style="font-size: 0.7rem; color: #f59e0b; margin-top: 2px;">${escapeHtml(r.status_penangguhan)}</div>` : ''}
        </td>

        <!-- AKSI -->
        <td style="padding: 10px 10px; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openPodTraceModal('${r.waybill}')" style="width: 100%; padding: 4px 8px; font-size: 0.74rem; font-weight: 600; border-radius: 4px;" title="Lacak riwayat 18 scan POD & alur rute">
              🔍 Lacak POD
            </button>
            <div style="display: flex; gap: 4px; width: 100%;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openPrintAwbFromGudang('${r.waybill}')" style="flex: 1; padding: 3px 6px; font-size: 0.7rem;" title="Cetak ulang resi label">
                🖨️ Cetak
              </button>
              ${!hasGoods ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="enrichSingleGudangWaybill('${r.waybill}', this)" style="padding: 3px 6px; font-size: 0.7rem; color: #38bdf8;" title="Ambil live nama barang & customer dari JFS">
                  ⚡ Enrich
                </button>
              ` : ''}
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;
}

function updateGudangPagination(p = {}) {
  gudangState.totalRows = p.totalRows || 0;
  gudangState.totalPages = p.totalPages || 1;

  const info = document.getElementById('gudangPaginationInfo');
  if (info) {
    const from = (gudangState.page - 1) * gudangState.limit + 1;
    const to = Math.min(gudangState.page * gudangState.limit, gudangState.totalRows);
    info.textContent = `Menampilkan ${gudangState.totalRows > 0 ? from : 0} - ${to} dari ${gudangState.totalRows.toLocaleString('id-ID')} waybill`;
  }

  const badge = document.getElementById('gudangCurrentPageBadge');
  if (badge) badge.textContent = `Halaman ${gudangState.page} / ${gudangState.totalPages}`;

  const btnPrev = document.getElementById('btnGudangPrev');
  const btnNext = document.getElementById('btnGudangNext');
  if (btnPrev) btnPrev.disabled = (gudangState.page <= 1);
  if (btnNext) btnNext.disabled = (gudangState.page >= gudangState.totalPages);
}

function navigateGudangPage(dir) {
  const target = gudangState.page + dir;
  if (target >= 1 && target <= gudangState.totalPages) {
    gudangState.page = target;
    fetchGudangInventory();
  }
}

function changeGudangPageSize(size) {
  gudangState.limit = parseInt(size, 10) || 50;
  gudangState.page = 1;
  fetchGudangInventory();
}

function handleGudangFilterSubmit(e) {
  if (e) e.preventDefault();
  gudangState.search = document.getElementById('gudangSearchInput')?.value.trim() || '';
  gudangState.holdingGw = document.getElementById('gudangFilterHoldingGw')?.value || 'ALL';
  gudangState.destGw = document.getElementById('gudangFilterDestGw')?.value || 'ALL';
  gudangState.tipeJalur = document.getElementById('gudangFilterTipeJalur')?.value || 'ALL';
  gudangState.aging = document.getElementById('gudangFilterAging')?.value || 'ALL';
  gudangState.enrichStatus = document.getElementById('gudangFilterEnrich')?.value || 'all';
  gudangState.page = 1;
  fetchGudangInventory();
}

function resetGudangFilter() {
  const form = document.getElementById('gudangFilterForm');
  if (form) form.reset();
  gudangState.search = '';
  gudangState.holdingGw = 'ALL';
  gudangState.destGw = 'ALL';
  gudangState.tipeJalur = 'ALL';
  gudangState.aging = 'ALL';
  gudangState.enrichStatus = 'all';
  gudangState.page = 1;
  fetchGudangInventory();
}

// 5. Open POD Trace Modal (100% PERSIS SCREENSHOT USER!)
async function openPodTraceModal(waybillNo) {
  gudangState.activeTraceWaybill = waybillNo;
  const modal = document.getElementById('modalPodTraceGudang');
  const title = document.getElementById('modalPodWaybillTitle');
  const tbody = document.getElementById('tbodyPodScans');
  const dynText = document.getElementById('podDynamicRouteText');
  const planText = document.getElementById('podPlannedRouteText');
  const actText = document.getElementById('podActualRouteText');
  const retText = document.getElementById('podReturnRouteText');
  const abnCont = document.getElementById('podAbnormalContainer');

  if (title) title.textContent = waybillNo;
  if (modal) modal.style.display = 'flex';

  if (dynText) dynText.textContent = 'Memuat routing...';
  if (planText) planText.textContent = 'Memuat rute rencana...';
  if (actText) actText.textContent = 'Memuat rute aktual...';
  if (retText) retText.textContent = 'Memuat rute pengembalian...';
  if (abnCont) abnCont.innerHTML = '<span style="color: #94a3b8;">Memeriksa riwayat abnormal...</span>';

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span class="spinner-small" style="display: inline-block; width: 14px; height: 14px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
            <span>Mengambil riwayat scan POD live dari JFS Operating Platform...</span>
          </div>
        </td>
      </tr>
    `;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ waybillNo })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat jejak POD');
    }

    gudangState.activeTraceData = json;

    // 1. Render Route Strings
    if (dynText) dynText.textContent = json.routes?.dynamicRoute || '-';
    if (planText) planText.textContent = json.routes?.plannedRoute || '-';
    if (actText) actText.textContent = json.routes?.actualRoute || '-';
    if (retText) retText.textContent = json.routes?.returnRoute || '-';

    // 2. Render Scan Table
    const scans = json.scans || [];
    if (scans.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
              Belum ada riwayat scan untuk waybill ${waybillNo} di sistem JFS.
            </td>
          </tr>
        `;
      }
    } else {
      let scanHtml = '';
      scans.forEach((s) => {
        const isRed = s.isProblem;
        const rowBg = isRed ? 'rgba(239, 68, 68, 0.08)' : 'transparent';
        const typeColor = isRed ? '#ef4444' : '#e2e8f0';

        // Format description with highlighted brackets matching screenshot!
        let formattedDesc = escapeHtml(s.scanDesc || '-');
        formattedDesc = formattedDesc.replace(/(\[|【)\s*([^\]】]+?)\s*(\]|】)/g, (match, open, p1, close) => {
          let color = '#38bdf8'; // cyan for site codes
          if (p1.startsWith('DKGX') || p1.startsWith('ZXZB') || p1.startsWith('B952') || p1.startsWith('H117')) {
            color = '#38bdf8'; // blue task code
          } else if (p1.toLowerCase().includes('retur') || p1.toLowerCase().includes('masalah')) {
            color = '#f87171'; // red problem
          } else if (p1.includes('2026-')) {
            color = '#38bdf8'; // timestamp
          } else {
            color = '#a78bfa'; // person name
          }
          return `<strong style="color: ${color}; font-weight: 700;">[ ${escapeHtml(p1)} ]</strong>`;
        });

        // Highlight "alasan paket bermasalah"
        formattedDesc = formattedDesc.replace(/alasan paket bermasalah/gi, '<span style="color: #f87171; font-weight: 700;">alasan paket bermasalah</span>');
        formattedDesc = formattedDesc.replace(/alasan retur/gi, '<span style="color: #f87171; font-weight: 700;">alasan retur</span>');

        scanHtml += `
          <tr style="border-bottom: 1px solid var(--border-color, #334155); background: ${rowBg};">
            <td style="padding: 9px 8px; text-align: center; color: #94a3b8;">${s.no}</td>
            <td style="padding: 9px 10px; font-family: monospace; font-size: 0.78rem; color: #cbd5e1;">${s.scanTime}</td>
            <td style="padding: 9px 10px; font-family: monospace; font-size: 0.78rem; color: #94a3b8;">${s.uploadTime}</td>
            <td style="padding: 9px 12px; font-weight: 600; color: ${typeColor};">${escapeHtml(s.scanType)}</td>
            <td style="padding: 9px 8px; color: #94a3b8; font-size: 0.76rem;">${escapeHtml(s.scanDeviceType)}</td>
            <td style="padding: 9px 14px; line-height: 1.45; font-size: 0.79rem; color: #f1f5f9;">${formattedDesc}</td>
            <td style="padding: 9px 8px; text-align: right; color: #e2e8f0; font-family: monospace;">${s.weight}</td>
            <td style="padding: 9px 8px; text-align: right; color: #e2e8f0; font-family: monospace;">${s.volumeWeight}</td>
          </tr>
        `;
      });
      if (tbody) tbody.innerHTML = scanHtml;
    }

    // 3. Render Abnormal Issues List
    const abnList = json.abnormalList || [];
    if (abnList.length === 0) {
      if (abnCont) abnCont.innerHTML = '<span style="color: #94a3b8;">Tidak ada catatan pendaftaran masalah di sistem.</span>';
    } else {
      let abnHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
      abnList.forEach((a, i) => {
        abnHtml += `
          <div style="padding: 8px 12px; border-radius: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);">
            <div style="font-weight: 700; color: #f87171;">Kasus #${i + 1}: ${escapeHtml(a.abnormalTypeName || 'Paket Bermasalah')}</div>
            <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 2px;">${escapeHtml(a.reason || a.remark || a.description || 'Tidak ada deskripsi')}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">Didaftarkan oleh: ${escapeHtml(a.createUserName || a.operatorName || '-')} pada ${escapeHtml(a.createTime || '-')}</div>
          </div>
        `;
      });
      abnHtml += '</div>';
      if (abnCont) abnCont.innerHTML = abnHtml;
    }
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: #f87171;">
            Gagal mengambil alur scan: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

function closePodModal() {
  const modal = document.getElementById('modalPodTraceGudang');
  if (modal) modal.style.display = 'none';
  gudangState.activeTraceWaybill = null;
  gudangState.activeTraceData = null;
}

// 6. Copy POD Trace Text for Feishu / WA
function copyPodTraceText() {
  if (!gudangState.activeTraceData) return;
  const d = gudangState.activeTraceData;
  let text = `📦 LACAK ALUR SCAN POD: ${d.waybillNo}\n`;
  text += `--------------------------------------\n`;
  text += `Routing Dinamis: ${d.routes?.dynamicRoute || '-'}\n`;
  text += `Rute Rencana: ${d.routes?.plannedRoute || '-'}\n`;
  text += `Rute Aktual: ${d.routes?.actualRoute || '-'}\n`;
  text += `Rute Retur: ${d.routes?.returnRoute || '-'}\n\n`;
  text += `RIWAYAT SCAN (${d.scans?.length || 0} langkah):\n`;
  (d.scans || []).forEach(s => {
    text += `${s.no}. [${s.scanTime}] ${s.scanType}: ${s.scanDesc}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Riwayat scan POD berhasil disalin ke clipboard!');
  }).catch(() => {
    alert('Gagal menyalin teks ke clipboard.');
  });
}

// 7. Single Waybill Enrich from JFS

// 7B. Enrich All Waybills On Current Page (Batch)
async function enrichCurrentPage() {
  const unenrichedBtns = document.querySelectorAll('button[onclick*="enrichSingleGudangWaybill"]');
  if (unenrichedBtns.length === 0) {
    alert('Semua waybill di halaman ini sudah terisi nama barang!');
    return;
  }

  const waybills = [];
  unenrichedBtns.forEach(btn => {
    const m = btn.getAttribute('onclick').match(/enrichSingleGudangWaybill\('([^']+)'/);
    if (m && m[1]) waybills.push(m[1]);
  });

  if (waybills.length === 0) {
    alert('Tidak ada waybill yang perlu di-enrich di halaman ini.');
    return;
  }

  if (!confirm(`Otomatis ambil data barang & customer untuk ${waybills.length} waybill di halaman ini dari JFS?`)) {
    return;
  }

  const btn = document.getElementById('btnEnrichCurrentPage');
  const btnText = document.getElementById('btnEnrichPageText');
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = '⏳ Meng-enrich...';

  showGudangProgress(true);
  const pTitle = document.getElementById('gudangProgressTitle');
  const pMsg = document.getElementById('gudangProgressMessage');
  if (pTitle) pTitle.textContent = `Meng-enrich ${waybills.length} Waybill di Halaman Ini...`;
  if (pMsg) pMsg.textContent = 'Menghubungkan ke API JFS Operating Platform...';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/bulk-enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ waybills })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal memulai enrich');
      showGudangProgress(false);
      return;
    }

    startBulkEnrichPolling();
  } catch (err) {
    alert('Error: ' + err.message);
    showGudangProgress(false);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = '⚡ Enrich Halaman Ini (50 Resi)';
  }
}

// 7C. Bulk Enrich Modal / Prompt (100 - 500 Waybill Sekaligus)
async function promptBulkEnrich() {
  const countStr = prompt('Masukkan jumlah waybill yang ingin di-enrich otomatis dari JFS:\n(Contoh: 100, 300, atau 500)', '100');
  if (!countStr) return;
  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) {
    alert('Harap masukkan angka yang valid.');
    return;
  }

  const btn = document.getElementById('btnBulkEnrichJfs');
  const btnText = document.getElementById('btnBulkEnrichText');
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = '⏳ Memulai...';

  showGudangProgress(true);
  const pTitle = document.getElementById('gudangProgressTitle');
  const pMsg = document.getElementById('gudangProgressMessage');
  if (pTitle) pTitle.textContent = `Auto-Enrich ${count} Waybill Massal...`;
  if (pMsg) pMsg.textContent = 'Menyiapkan antrian worker JFS...';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/bulk-enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ limit: count })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal memulai bulk enrich');
      showGudangProgress(false);
      return;
    }

    startBulkEnrichPolling();
  } catch (err) {
    alert('Error: ' + err.message);
    showGudangProgress(false);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = '⚡ Auto-Enrich Massal (100 - 500)';
  }
}

let bulkEnrichTimer = null;
function startBulkEnrichPolling() {
  if (bulkEnrichTimer) clearInterval(bulkEnrichTimer);
  bulkEnrichTimer = setInterval(checkBulkEnrichStatus, 1500);
}

async function checkBulkEnrichStatus() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/bulk-enrich-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const json = await res.json();

    const pTitle = document.getElementById('gudangProgressTitle');
    const pCount = document.getElementById('gudangProgressCount');
    const pMsg = document.getElementById('gudangProgressMessage');

    if (json.isBulkEnriching) {
      showGudangProgress(true);
      const cur = json.progress?.current || 0;
      const tot = json.progress?.total || 1;
      const succ = json.progress?.successCount || 0;
      const pct = Math.round((cur / tot) * 100);

      if (pTitle) pTitle.textContent = `Auto-Enrich JFS Sedang Berjalan (${pct}%)...`;
      if (pCount) pCount.textContent = `${cur} / ${tot} waybill (${succ} sukses)`;
      if (pMsg) pMsg.textContent = json.progress?.message || 'Memproses data order...';
    } else {
      if (bulkEnrichTimer) {
        clearInterval(bulkEnrichTimer);
        bulkEnrichTimer = null;
      }

      showGudangProgress(false);
      fetchGudangFileInfo();
      fetchGudangInventory();
    }
  } catch (err) {
    console.warn('checkBulkEnrichStatus error:', err);
  }
}

// 7D. Instant DB Enrich (PTO + Monitoring Stuck)
async function runInstantDbEnrich() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/instant-db-enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.error || 'Gagal sinkronisasi');
      return;
    }

    alert(`✅ ${json.message}\nTotal waybill ter-enrich sekarang: ${json.totalEnriched.toLocaleString('id-ID')}`);
    fetchGudangFileInfo();
    fetchGudangInventory();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function enrichSingleGudangWaybill(waybillNo, btnEl) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = '...';
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ waybillNo })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal enrich dari JFS');
      return;
    }

    // Refresh row or table
    fetchGudangInventory();
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

// 8. Open Print AWB from Gudang row
function openPrintAwbFromGudang(waybillNo) {
  if (typeof switchAdvanceTab === 'function') {
    switchAdvanceTab('print-awb', true);
    setTimeout(() => {
      const input = document.getElementById('printAwbWaybillInput');
      if (input) {
        input.value = waybillNo;
        if (typeof generatePrintAwbPdf === 'function') {
          generatePrintAwbPdf();
        }
      }
    }, 250);
  }
}

// 9. Export Enriched Inventory to Excel
async function exportGudangRuteExcel() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        search: gudangState.search,
        holding_gw: gudangState.holdingGw,
        gw_tujuan: gudangState.destGw,
        tipe_jalur: gudangState.tipeJalur,
        durasi_kategori: gudangState.aging,
        enrich_status: gudangState.enrichStatus,
        page: 1,
        limit: 5000 // Max 5000 for direct excel export
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success || !json.data || json.data.length === 0) {
      alert('Tidak ada data yang dapat diexport.');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('Modul Excel XLSX belum dimuat di browser.');
      return;
    }

    const exportRows = json.data.map((r, i) => ({
      'No': i + 1,
      'Waybill (AWB)': r.waybill,
      'Nama Barang': r.nama_barang || '',
      'Pengirim': r.pengirim || '',
      'Perusahaan Pengirim': r.perusahaan_pengirim || '',
      'No HP Pengirim': r.no_hp_pengirim || '',
      'Penerima': r.penerima || '',
      'Perusahaan Penerima': r.perusahaan_penerima || '',
      'No HP Penerima': r.no_hp_penerima || '',
      'Alamat Lengkap Penerima': r.alamat_penerima || '',
      'Gudang Simpan (Holding GW)': r.holding_gw || '',
      'Status Simpan': r.status_simpan || '',
      'Durasi Simpan (Jam)': r.durasi_jam || 0,
      'Kategori Durasi': r.durasi_kategori || '',
      'Berat (kg)': r.berat || 0,
      'Volume (m3)': r.volume || 0,
      'Outlet Asal': r.outlet_asal || '',
      'Gateway Asal': r.gw_asal || '',
      'Gateway Tujuan': r.gw_tujuan || '',
      'Outlet Tujuan': r.outlet_tujuan || '',
      'Alur Rute': r.rute || '',
      'Tipe Jalur': r.tipe_jalur || '',
      'Bermasalah': r.is_problem || '',
      'Status Penangguhan': r.status_penangguhan || '',
      'Waktu Buka Waybill': r.tgl_buka || '',
      'Batch Feishu': r.batch_time || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gudang Rute Enriched');
    const fileName = `Paket_Gudang_Rute_Enriched_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (err) {
    alert('Gagal mengekspor file Excel: ' + err.message);
  }
}

// Utility HTML escape
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.loadGudangRuteDashboard = loadGudangRuteDashboard;
window.importLatestGudangRuteFile = importLatestGudangRuteFile;
window.fetchGudangInventory = fetchGudangInventory;
window.handleGudangFilterSubmit = handleGudangFilterSubmit;
window.resetGudangFilter = resetGudangFilter;
window.navigateGudangPage = navigateGudangPage;
window.changeGudangPageSize = changeGudangPageSize;
window.openPodTraceModal = openPodTraceModal;
window.closePodModal = closePodModal;
window.copyPodTraceText = copyPodTraceText;
window.enrichSingleGudangWaybill = enrichSingleGudangWaybill;
window.openPrintAwbFromGudang = openPrintAwbFromGudang;

// Per-Column Filter Handlers
function handleColumnSearch(event) {
  if (event.key === 'Enter' || event.type === 'change') {
    applyColumnFilters();
  }
}

function applyColumnFilters() {
  gudangState.col_waybill = document.getElementById('colSearchWaybill')?.value.trim() || '';
  gudangState.col_nama_barang = document.getElementById('colSearchNamaBarang')?.value.trim() || '';
  gudangState.col_pengirim = document.getElementById('colSearchPengirim')?.value.trim() || '';
  gudangState.col_penerima = document.getElementById('colSearchPenerima')?.value.trim() || '';
  gudangState.col_alamat = document.getElementById('colSearchAlamat')?.value.trim() || '';
  gudangState.col_rute = document.getElementById('colSearchRute')?.value.trim() || '';
  gudangState.col_durasi_min = document.getElementById('colSearchDurasiMin')?.value.trim() || '';
  gudangState.col_durasi_max = document.getElementById('colSearchDurasiMax')?.value.trim() || '';
  
  const statusVal = document.getElementById('colSearchStatus')?.value;
  if (statusVal && statusVal !== 'ALL') {
    gudangState.is_problem = statusVal;
  } else {
    gudangState.is_problem = '';
  }

  const holdingVal = document.getElementById('colSearchHoldingGw')?.value.trim();
  if (holdingVal) {
    gudangState.holdingGw = holdingVal;
  }

  gudangState.page = 1;
  fetchGudangInventory();
}

function clearAllColumnFilters() {
  const ids = [
    'colSearchWaybill', 'colSearchNamaBarang', 'colSearchPengirim',
    'colSearchPenerima', 'colSearchAlamat', 'colSearchHoldingGw',
    'colSearchDurasiMin', 'colSearchDurasiMax', 'colSearchRute'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const st = document.getElementById('colSearchStatus');
  if (st) st.value = 'ALL';

  gudangState.col_waybill = '';
  gudangState.col_nama_barang = '';
  gudangState.col_pengirim = '';
  gudangState.col_penerima = '';
  gudangState.col_alamat = '';
  gudangState.col_rute = '';
  gudangState.col_durasi_min = '';
  gudangState.col_durasi_max = '';
  gudangState.is_problem = '';
  gudangState.page = 1;
  fetchGudangInventory();
}

window.exportGudangRuteExcel = exportGudangRuteExcel;
window.enrichCurrentPage = enrichCurrentPage;
window.promptBulkEnrich = promptBulkEnrich;
window.runInstantDbEnrich = runInstantDbEnrich;
window.handleColumnSearch = handleColumnSearch;
window.applyColumnFilters = applyColumnFilters;
window.clearAllColumnFilters = clearAllColumnFilters;
