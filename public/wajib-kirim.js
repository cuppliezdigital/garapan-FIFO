/**
 * WAJIB KIRIM MODULE (MUST-GO QUALITY CONTROL)
 * Monitoring FIFO & Dispatch Intelligence
 * 
 * Hanya dapat diakses oleh super_admin dan admin.
 * Sinkronisasi otomatis dari API JFS ads_all_qc_must_go_cargo_waybill_child_dt
 * dan dicocokkan (VLOOKUP) dengan stok realtime GW-Jakarta (realtime_inv_man_dtl).
 */

(function() {
  'use strict';

  // Module State
  const state = {
    rawRecords: [],
    filteredRecords: [],
    stats: {},
    tlcList: [],
    globalSearch: '',
    columnFilters: {
      waybill: '',
      tlc: '',
      take_site: '',
      dest_site: '',
      first_gw: '',
      send_next: '',
      goods: '',
      weight: '',
      inventory_hours: '',
      cutoff: '',
      reason: ''
    },
    statusFilter: 'all', // 'all', 'stuck', 'departed'
    selectedTlc: 'ALL',
    sortColumn: 'inventory_hours',
    sortDir: 'desc', // 'asc' or 'desc'
    currentPage: 1,
    pageSize: 50,
    isLoading: false,
    lastSyncTime: null
  };

  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getAuthToken() {
    if (typeof window.getToken === 'function') {
      const t = window.getToken();
      if (t && t !== 'cookie-session') return t;
    }
    if (typeof getToken === 'function') {
      try {
        const t = getToken();
        if (t && t !== 'cookie-session') return t;
      } catch (_) {}
    }
    const sJwt = sessionStorage.getItem('monitoring_jwt');
    if (sJwt) return sJwt;
    const lJwt = localStorage.getItem('monitoring_jwt');
    if (lJwt) return lJwt;
    return localStorage.getItem('token') || '';
  }

  function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (token && token !== 'cookie-session') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // ==========================================================================
  // FETCH & SYNC API
  // ==========================================================================

  async function loadWajibKirimData(silent = false) {
    if (state.isLoading) return;
    state.isLoading = true;
    updateSyncButtonState(true);

    const tableBody = document.getElementById('wkJfsTableBody');
    if (!silent && tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" class="wk-loading-cell">
            <div class="wk-loading-spinner-wrap">
              <div class="wk-spinner"></div>
              <span>Memuat data WAJIB KIRIM dari database...</span>
            </div>
          </td>
        </tr>
      `;
    }

    try {
      const res = await fetch('/api/jfs/wajib-kirim?limit=2000', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Akses dibatasi. Modul ini hanya untuk super_admin dan admin.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      state.rawRecords = data.records || [];
      state.stats = data.stats || {};
      state.tlcList = data.tlcList || [];
      state.lastSyncTime = state.stats.last_sync_time || null;

      // Update Header & Summary Stats
      renderSummaryCards();
      renderTlcFilterPills();
      applyFiltersAndSort();
    } catch (err) {
      console.error('loadWajibKirimData error:', err);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="13" class="wk-empty-cell error-text">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>Gagal memuat data: ${escHtml(err.message)}</div>
              <button type="button" class="btn-wk-retry" onclick="window.loadWajibKirimData()">Coba Lagi</button>
            </td>
          </tr>
        `;
      }
      if (typeof showAppAlert === 'function') {
        showAppAlert(err.message, true);
      }
    } finally {
      state.isLoading = false;
      updateSyncButtonState(false);
    }
  }

  async function triggerWajibKirimSync() {
    if (state.isLoading) return;
    state.isLoading = true;
    updateSyncButtonState(true, 'Menyinkronkan dari server JFS...');

    if (typeof showAppAlert === 'function') {
      showAppAlert('Menghubungkan ke JFS Report Leader (ads_all_qc_must_go)...');
    }

    try {
      const res = await fetch('/api/jfs/wajib-kirim/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ days: 5 })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || `Gagal terhubung ke server (HTTP ${res.status})`);
      }

      if (typeof showAppAlert === 'function') {
        showAppAlert(json.message || 'Sinkronisasi WAJIB KIRIM sukses!', false);
      }

      // Reload data
      await loadWajibKirimData(true);
    } catch (err) {
      console.error('triggerWajibKirimSync error:', err);
      if (typeof showAppAlert === 'function') {
        showAppAlert(`Sinkronisasi gagal: ${err.message}`, true);
      } else {
        alert(`Sinkronisasi gagal: ${err.message}`);
      }
    } finally {
      state.isLoading = false;
      updateSyncButtonState(false);
    }
  }

  function updateSyncButtonState(isSyncing, customText) {
    const btn = document.getElementById('btnSyncWajibKirim');
    if (!btn) return;
    btn.disabled = isSyncing;
    if (isSyncing) {
      btn.innerHTML = `
        <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>${customText || 'Menyinkronkan...'}</span>
      `;
    } else {
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
        <span>Sinkronkan WAJIB KIRIM</span>
      `;
    }
  }

  // ==========================================================================
  // RENDER SUMMARY CARDS & TLC PILLS
  // ==========================================================================

  function renderSummaryCards() {
    const st = state.stats || {};
    const elTotal = document.getElementById('wkStatTotalKoli');
    const elWeight = document.getElementById('wkStatTotalWeight');
    const elStuck = document.getElementById('wkStatTotalStuck');
    const elTlc = document.getElementById('wkStatTotalTlc');
    const elSyncTime = document.getElementById('wkLastSyncText');

    if (elTotal) elTotal.textContent = Number(st.total_records || state.rawRecords.length).toLocaleString('id-ID');
    if (elWeight) elWeight.textContent = `${Number(st.total_weight || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
    if (elStuck) elStuck.textContent = Number(st.total_stuck || 0).toLocaleString('id-ID');
    if (elTlc) elTlc.textContent = Number(st.total_tlc || 0).toLocaleString('id-ID');

    if (elSyncTime) {
      if (st.last_sync_time) {
        const d = new Date(st.last_sync_time);
        elSyncTime.textContent = d.toLocaleString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } else {
        elSyncTime.textContent = 'Belum pernah';
      }
    }
  }

  function renderTlcFilterPills() {
    const container = document.getElementById('wkTlcPillsContainer');
    if (!container) return;

    const list = state.tlcList || [];
    let html = `
      <button type="button" class="wk-pill-btn ${state.selectedTlc === 'ALL' ? 'active' : ''}" data-tlc="ALL">
        <span>SEMUA</span>
        <span class="wk-pill-count">${state.rawRecords.length}</span>
      </button>
    `;

    list.slice(0, 15).forEach(item => {
      const isAct = state.selectedTlc === item.tlc;
      html += `
        <button type="button" class="wk-pill-btn ${isAct ? 'active' : ''}" data-tlc="${escHtml(item.tlc)}">
          <span class="font-mono font-bold">${escHtml(item.tlc)}</span>
          <span class="wk-pill-count">${item.count}</span>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.wk-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedTlc = btn.dataset.tlc || 'ALL';
        state.currentPage = 1;
        container.querySelectorAll('.wk-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndSort();
      });
    });
  }

  // ==========================================================================
  // FILTERING & SORTING LOGIC
  // ==========================================================================

  function applyFiltersAndSort() {
    const gSearch = state.globalSearch.toLowerCase().trim();
    const colFilters = state.columnFilters;
    const tlcFilter = state.selectedTlc;
    const statusFilter = state.statusFilter;

    // 1. FILTER
    let list = state.rawRecords.filter(item => {
      // Status filter
      if (statusFilter === 'stuck' && Number(item.is_stuck_in_gw) !== 1) return false;
      if (statusFilter === 'departed' && Number(item.is_stuck_in_gw) === 1) return false;

      // TLC quick filter
      if (tlcFilter !== 'ALL' && item.tlc !== tlcFilter) return false;

      // Global search
      if (gSearch) {
        const textBlob = [
          item.waybill_no,
          item.child_waybill_no,
          item.tlc,
          item.take_site_name,
          item.destination_site_name,
          item.first_distribution_name,
          item.send_nextstation,
          item.goods_name,
          item.lost_reson,
          item.order_source_name
        ].filter(Boolean).join(' ').toLowerCase();

        if (!textBlob.includes(gSearch)) return false;
      }

      // Column filters
      if (colFilters.waybill) {
        const q = colFilters.waybill.toLowerCase();
        const wb = (item.waybill_no || '').toLowerCase();
        const cwb = (item.child_waybill_no || '').toLowerCase();
        if (!wb.includes(q) && !cwb.includes(q)) return false;
      }

      if (colFilters.tlc) {
        if (!String(item.tlc || '').toLowerCase().includes(colFilters.tlc.toLowerCase())) return false;
      }

      if (colFilters.take_site) {
        if (!String(item.take_site_name || '').toLowerCase().includes(colFilters.take_site.toLowerCase())) return false;
      }

      if (colFilters.dest_site) {
        if (!String(item.destination_site_name || '').toLowerCase().includes(colFilters.dest_site.toLowerCase())) return false;
      }

      if (colFilters.first_gw) {
        if (!String(item.first_distribution_name || '').toLowerCase().includes(colFilters.first_gw.toLowerCase())) return false;
      }

      if (colFilters.send_next) {
        if (!String(item.send_nextstation || '').toLowerCase().includes(colFilters.send_next.toLowerCase())) return false;
      }

      if (colFilters.goods) {
        if (!String(item.goods_name || '').toLowerCase().includes(colFilters.goods.toLowerCase())) return false;
      }

      if (colFilters.weight) {
        const wStr = String(item.weight || '');
        if (!wStr.includes(colFilters.weight)) return false;
      }

      if (colFilters.inventory_hours) {
        const hStr = String(item.inventory_hours || '');
        if (!hStr.includes(colFilters.inventory_hours)) return false;
      }

      if (colFilters.cutoff) {
        if (!String(item.should_depart_time || '').toLowerCase().includes(colFilters.cutoff.toLowerCase())) return false;
      }

      if (colFilters.reason) {
        if (!String(item.lost_reson || '').toLowerCase().includes(colFilters.reason.toLowerCase())) return false;
      }

      return true;
    });

    // 2. SORT
    const sortCol = state.sortColumn;
    const isAsc = state.sortDir === 'asc';

    list.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];

      // Handle nulls
      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';

      // Numeric comparisons
      if (sortCol === 'weight' || sortCol === 'inventory_hours' || sortCol === 'package_number' || sortCol === 'id') {
        const na = Number(va) || 0;
        const nb = Number(vb) || 0;
        return isAsc ? na - nb : nb - na;
      }

      // String comparisons
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return isAsc ? -1 : 1;
      if (sa > sb) return isAsc ? 1 : -1;
      return 0;
    });

    state.filteredRecords = list;

    // Update Counter Text
    const counterEl = document.getElementById('wkFilterCountText');
    if (counterEl) {
      counterEl.textContent = `Menampilkan ${list.length.toLocaleString('id-ID')} dari ${state.rawRecords.length.toLocaleString('id-ID')} Koli Wajib Kirim`;
    }

    renderTable();
    renderPagination();
  }

  // ==========================================================================
  // RENDER TABLE ROWS
  // ==========================================================================

  function renderTable() {
    const tbody = document.getElementById('wkJfsTableBody');
    if (!tbody) return;

    const list = state.filteredRecords;
    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" class="wk-empty-cell">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="11" cy="11" r="7"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <div class="wk-empty-title">Tidak ada data Wajib Kirim yang cocok</div>
            <div class="wk-empty-sub">Coba sesuaikan kata kunci pencarian atau bersihkan filter kolom.</div>
            <button type="button" class="btn-wk-clear-all" onclick="window.resetWajibKirimFilters()">Reset Semua Filter</button>
          </td>
        </tr>
      `;
      return;
    }

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const pageRecords = list.slice(startIdx, startIdx + state.pageSize);

    let html = '';
    pageRecords.forEach((item, idx) => {
      const rowNo = startIdx + idx + 1;
      const isStuck = Number(item.is_stuck_in_gw) === 1;
      const hours = Number(item.inventory_hours || 0);

      // Aging badge class
      let agingClass = 'badge-aging-low';
      if (hours >= 72) agingClass = 'badge-aging-critical';
      else if (hours >= 48) agingClass = 'badge-aging-high';
      else if (hours >= 24) agingClass = 'badge-aging-mid';

      html += `
        <tr class="wk-table-row ${isStuck ? 'row-stuck' : 'row-departed'}">
          <td class="text-center font-mono text-muted text-xs">${rowNo}</td>

          <!-- NO AWB & KOLI -->
          <td class="wk-col-waybill font-mono">
            <div class="wk-wb-main font-bold">
              <span class="wb-num">${escHtml(item.waybill_no)}</span>
              <button type="button" class="btn-mini-copy" data-copy="${escHtml(item.waybill_no)}" title="Salin No Resi">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
            ${item.child_waybill_no && item.child_waybill_no !== item.waybill_no ? `
              <div class="wk-wb-child font-mono text-xs text-muted">
                Koli: <span class="font-bold">${escHtml(item.child_waybill_no)}</span>
              </div>
            ` : ''}
            <div class="wk-source-pill-row">
              <span class="wk-source-badge source-${(item.order_source_name || '').toLowerCase()}">${escHtml(item.order_source_name || 'JFS')}</span>
              ${isStuck ? '<span class="wk-status-pill pill-stuck">STAGING GW</span>' : '<span class="wk-status-pill pill-departed">BERANGKAT</span>'}
            </div>
          </td>

          <!-- TLC BADGE -->
          <td class="text-center">
            <span class="wk-tlc-badge font-mono font-bold">${escHtml(item.tlc || '-')}</span>
          </td>

          <!-- OUTLET PENGIRIM -->
          <td>
            <div class="font-mono text-xs font-bold text-slate-200">${escHtml(item.take_site_name || '-')}</div>
            <div class="text-xxs text-muted">Outlet Asal</div>
          </td>

          <!-- OUTLET TUJUAN -->
          <td>
            <div class="font-mono text-xs font-bold text-slate-100">${escHtml(item.destination_site_name || '-')}</div>
            <div class="text-xxs text-muted">${escHtml(item.dest_proxy_area_name || 'Tujuan Akhir')}</div>
          </td>

          <!-- GW PENGIRIM -->
          <td>
            <span class="wk-gw-pill pill-origin">${escHtml(item.first_distribution_name || 'GW-Jakarta')}</span>
          </td>

          <!-- GW TUJUAN -->
          <td>
            <span class="wk-gw-pill pill-dest font-bold">${escHtml(item.send_nextstation || '-')}</span>
          </td>

          <!-- NAMA BARANG -->
          <td class="wk-col-goods" title="${escHtml(item.goods_name || '')}">
            <div class="goods-text truncate">${escHtml(item.goods_name || 'Paket Standar / E-Commerce')}</div>
          </td>

          <!-- BERAT & KOLI -->
          <td class="text-right font-mono text-xs">
            <div class="font-bold text-emerald-400">${Number(item.weight || 1).toFixed(2)} kg</div>
            <div class="text-xxs text-muted">${item.package_number || 1} koli</div>
          </td>

          <!-- LAMA MENGINAP (HOURS) -->
          <td class="text-center">
            <span class="wk-aging-badge ${agingClass} font-mono font-bold">
              ${hours} Jam
            </span>
          </td>

          <!-- JADWAL CUTOFF -->
          <td class="font-mono text-xs">
            <div class="text-amber-400 font-bold">${escHtml(item.should_depart_time || '-')}</div>
            ${item.next_depart_time ? `<div class="text-xxs text-muted">Next: ${escHtml(item.next_depart_time)}</div>` : ''}
          </td>

          <!-- ALASAN QC / KETERANGAN -->
          <td class="wk-col-reason">
            <div class="reason-pill" title="${escHtml(item.lost_reson || '-')}">
              ${escHtml(item.lost_reson || '-')}
            </div>
            ${item.load_task_no && item.load_task_no !== '-' ? `
              <div class="text-xxs font-mono text-muted mt-1">SPK: ${escHtml(item.load_task_no)}</div>
            ` : ''}
          </td>

          <!-- AKSI -->
          <td class="text-center wk-col-actions">
            <div class="wk-action-btns">
              <button type="button" class="btn-wk-act-print" data-wb="${escHtml(item.waybill_no)}" title="Cetak Label Resi">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect width="12" height="8" x="6" y="14"/>
                </svg>
                <span>Cetak</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Bind row copy buttons
    tbody.querySelectorAll('.btn-mini-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.dataset.copy;
        if (text) {
          navigator.clipboard.writeText(text);
          if (typeof showAppAlert === 'function') {
            showAppAlert(`Nomor ${text} disalin ke clipboard.`, false);
          }
        }
      });
    });

    // Bind row print buttons
    tbody.querySelectorAll('.btn-wk-act-print').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wb = btn.dataset.wb;
        if (wb && typeof window.switchAdvanceTab === 'function') {
          window.switchAdvanceTab('print-awb');
          const inputEl = document.getElementById('printAwbInput');
          if (inputEl) {
            inputEl.value = wb;
            inputEl.dispatchEvent(new Event('input'));
            const btnGen = document.getElementById('btnGenerateAwbPrint');
            if (btnGen) btnGen.click();
          }
        }
      });
    });
  }

  // ==========================================================================
  // RENDER PAGINATION
  // ==========================================================================

  function renderPagination() {
    const container = document.getElementById('wkPaginationContainer');
    if (!container) return;

    const total = state.filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const cur = state.currentPage;

    if (total <= state.pageSize) {
      container.innerHTML = `<span class="wk-page-info text-muted text-xs">Total ${total.toLocaleString('id-ID')} data</span>`;
      return;
    }

    let html = `
      <div class="wk-page-nav-wrap">
        <button type="button" class="btn-page-nav" ${cur <= 1 ? 'disabled' : ''} data-page="1" title="Halaman Pertama">«</button>
        <button type="button" class="btn-page-nav" ${cur <= 1 ? 'disabled' : ''} data-page="${cur - 1}" title="Sebelumnya">‹</button>
        <span class="wk-page-curr-badge">Hal ${cur} / ${totalPages}</span>
        <button type="button" class="btn-page-nav" ${cur >= totalPages ? 'disabled' : ''} data-page="${cur + 1}" title="Selanjutnya">›</button>
        <button type="button" class="btn-page-nav" ${cur >= totalPages ? 'disabled' : ''} data-page="${totalPages}" title="Halaman Terakhir">»</button>
      </div>
      <div class="wk-page-size-wrap">
        <label class="text-xs text-muted">Per halaman:</label>
        <select id="wkPageSizeSelect" class="wk-page-select">
          <option value="25" ${state.pageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${state.pageSize === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${state.pageSize === 100 ? 'selected' : ''}>100</option>
          <option value="200" ${state.pageSize === 200 ? 'selected' : ''}>200</option>
        </select>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.btn-page-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p && p !== cur && p >= 1 && p <= totalPages) {
          state.currentPage = p;
          renderTable();
          renderPagination();
          document.getElementById('viewWajibKirim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    const selectEl = document.getElementById('wkPageSizeSelect');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        state.pageSize = parseInt(e.target.value, 10) || 50;
        state.currentPage = 1;
        renderTable();
        renderPagination();
      });
    }
  }

  // ==========================================================================
  // EXPORT TO CSV
  // ==========================================================================

  function exportWajibKirimCsv() {
    const list = state.filteredRecords;
    if (!list.length) {
      if (typeof showAppAlert === 'function') {
        showAppAlert('Tidak ada data Wajib Kirim untuk diekspor.', true);
      } else {
        alert('Tidak ada data untuk diekspor.');
      }
      return;
    }

    const headers = [
      'No',
      'No Waybill',
      'No Koli Child',
      'TLC',
      'Outlet Pengirim',
      'Outlet Tujuan',
      'GW Pengirim',
      'GW Tujuan Transit',
      'GW Tujuan Akhir',
      'Nama Barang',
      'Berat (kg)',
      'Koli',
      'Lama Menginap (Jam)',
      'Jadwal Wajib Berangkat',
      'Jadwal Berikutnya',
      'Alasan Keterlambatan QC',
      'Status Staging',
      'Sumber Order',
      'Waktu Sync'
    ];

    const rows = list.map((r, i) => [
      i + 1,
      `="${r.waybill_no || ''}"`,
      `="${r.child_waybill_no || ''}"`,
      r.tlc || '',
      r.take_site_name || '',
      r.destination_site_name || '',
      r.first_distribution_name || '',
      r.send_nextstation || '',
      r.destination_distribution_name || '',
      `"${String(r.goods_name || '').replace(/"/g, '""')}"`,
      r.weight || 0,
      r.package_number || 1,
      r.inventory_hours || 0,
      r.should_depart_time || '',
      r.next_depart_time || '',
      `"${String(r.lost_reson || '').replace(/"/g, '""')}"`,
      Number(r.is_stuck_in_gw) === 1 ? 'STAGING GW' : 'SUDAH BERANGKAT',
      r.order_source_name || '',
      r.synced_at || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Wajib_Kirim_JFS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showAppAlert === 'function') {
      showAppAlert(`Berhasil mengekspor ${list.length} koli Wajib Kirim ke CSV.`, false);
    }
  }

  // ==========================================================================
  // RESET ALL FILTERS
  // ==========================================================================

  function resetWajibKirimFilters() {
    state.globalSearch = '';
    state.selectedTlc = 'ALL';
    state.statusFilter = 'all';
    state.currentPage = 1;
    state.sortColumn = 'inventory_hours';
    state.sortDir = 'desc';

    Object.keys(state.columnFilters).forEach(k => {
      state.columnFilters[k] = '';
    });

    const gInput = document.getElementById('wkGlobalSearch');
    if (gInput) gInput.value = '';

    document.querySelectorAll('.wk-col-filter').forEach(inp => {
      inp.value = '';
    });

    document.querySelectorAll('.wk-status-pill-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === 'all');
    });

    const tlcPills = document.querySelectorAll('#wkTlcPillsContainer .wk-pill-btn');
    tlcPills.forEach(b => b.classList.toggle('active', b.dataset.tlc === 'ALL'));

    updateSortHeaderIcons();
    applyFiltersAndSort();
  }

  function updateSortHeaderIcons() {
    document.querySelectorAll('.wk-th-sortable').forEach(th => {
      const col = th.dataset.sort;
      const isCur = col === state.sortColumn;
      th.classList.toggle('sort-active', isCur);
      const icon = th.querySelector('.sort-arrow');
      if (icon) {
        if (!isCur) {
          icon.innerHTML = '⇅';
          icon.className = 'sort-arrow';
        } else if (state.sortDir === 'asc') {
          icon.innerHTML = '▲';
          icon.className = 'sort-arrow sort-asc';
        } else {
          icon.innerHTML = '▼';
          icon.className = 'sort-arrow sort-desc';
        }
      }
    });
  }

  // ==========================================================================
  // INITIALIZATION & LISTENERS
  // ==========================================================================

  function initWajibKirimModule() {
    // Sync Button
    const btnSync = document.getElementById('btnSyncWajibKirim');
    if (btnSync) {
      btnSync.addEventListener('click', triggerWajibKirimSync);
    }

    // Export Button
    const btnExport = document.getElementById('btnExportWajibKirim');
    if (btnExport) {
      btnExport.addEventListener('click', exportWajibKirimCsv);
    }

    // Reset Button
    const btnReset = document.getElementById('btnResetWajibKirim');
    if (btnReset) {
      btnReset.addEventListener('click', resetWajibKirimFilters);
    }

    // Global Search with debounce
    const inputGlobal = document.getElementById('wkGlobalSearch');
    if (inputGlobal) {
      let debounceTimer;
      inputGlobal.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.globalSearch = e.target.value;
          state.currentPage = 1;
          applyFiltersAndSort();
        }, 150);
      });

      const btnClear = document.getElementById('btnClearWkGlobalSearch');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          inputGlobal.value = '';
          state.globalSearch = '';
          state.currentPage = 1;
          applyFiltersAndSort();
          inputGlobal.focus();
        });
      }
    }

    // Status Filter Pills (Semua / Stuck / Departed)
    document.querySelectorAll('.wk-status-pill-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        state.statusFilter = btn.dataset.status || 'all';
        state.currentPage = 1;
        document.querySelectorAll('.wk-status-pill-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndSort();
      });
    });

    // Column Filters with debounce
    document.querySelectorAll('.wk-col-filter').forEach(inp => {
      let colTimer;
      inp.addEventListener('input', (e) => {
        const col = inp.dataset.col;
        clearTimeout(colTimer);
        colTimer = setTimeout(() => {
          if (col && state.columnFilters.hasOwnProperty(col)) {
            state.columnFilters[col] = e.target.value;
            state.currentPage = 1;
            applyFiltersAndSort();
          }
        }, 150);
      });
    });

    // Column Sorting Headers
    document.querySelectorAll('.wk-th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (!col) return;

        if (state.sortColumn === col) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDir = (col === 'inventory_hours' || col === 'weight') ? 'desc' : 'asc';
        }

        state.currentPage = 1;
        updateSortHeaderIcons();
        applyFiltersAndSort();
      });
    });

    updateSortHeaderIcons();

    // Auto-load if pane is active or when user opens
    if (document.getElementById('viewWajibKirim') && !document.getElementById('viewWajibKirim').classList.contains('hidden')) {
      loadWajibKirimData();
    }
  }

  // Expose to window
  window.loadWajibKirimData = loadWajibKirimData;
  window.triggerWajibKirimSync = triggerWajibKirimSync;
  window.resetWajibKirimFilters = resetWajibKirimFilters;
  window.exportWajibKirimCsv = exportWajibKirimCsv;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWajibKirimModule);
  } else {
    initWajibKirimModule();
  }
})();

