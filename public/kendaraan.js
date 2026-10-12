// ==========================================================================
// MONITORING INSTOCK KENDARAAN & CAPACITY REPORT MODULE
// ==========================================================================

let kendaraanListData = [];
let kendaraanFilterTab = 'all';
let masterGatewaysData = [];
let kendaraanSearchDebounce = null;
let masterGatewaySearchDebounce = null;

function escKendaraanHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

function applyKendaraanDashboardData(data) {
  if (!data) return;
  const valSiapMuat = document.getElementById('valSiapMuatPnkBdj');
  const valMotorDok = document.getElementById('valMotorDokumen');
  const valTotalSpl = document.getElementById('valTotalSpl');
  const valMotorHold = document.getElementById('valMotorHold');

  if (valSiapMuat && data.kpi) valSiapMuat.textContent = data.kpi.siap_muat_pnk_bdj || 0;
  if (valMotorDok && data.kpi) valMotorDok.textContent = data.kpi.total_motor_dokumen || 0;
  if (valTotalSpl && data.kpi) valTotalSpl.textContent = data.kpi.total_spl || 0;
  if (valMotorHold && data.kpi) valMotorHold.textContent = data.kpi.total_motor_hold || 0;

  if (data.matrix) renderKendaraanMatrix(data.matrix);

  const previewWa = document.getElementById('previewWaCapacity');
  if (previewWa && data.templates?.capacity_wa) {
    previewWa.textContent = data.templates.capacity_wa;
  }

  const previewDoc = document.getElementById('previewWaDokumen');
  if (previewDoc && data.templates?.dokumen_wa) {
    previewDoc.textContent = data.templates.dokumen_wa;
  }

  const dateHeader = document.getElementById('kendaraanMatrixDate');
  if (dateHeader) {
    const now = new Date();
    dateHeader.innerHTML = `Tanggal Laporan: <strong>${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>`;
  }
}

// 1. Fetch & Render Dashboard & KPIs
async function fetchKendaraanDashboard() {
  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/dashboard', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    if (!res.ok) throw new Error('Gagal memuat dashboard kendaraan');
    const data = await res.json();
    if (!data.success) return;

    applyKendaraanDashboardData(data);
  } catch (err) {
    console.error('fetchKendaraanDashboard error:', err);
  }
}

// 2. Render Matrix Table (Exact Match with Capacity Sheet)
function renderKendaraanMatrix(matrix) {
  const tbody = document.getElementById('kendaraanMatrixBody');
  if (!tbody || !matrix) return;

  const rows = [
    { key: 'PNK', label: 'Pontianak (PNK)', data: matrix.PNK },
    { key: 'BDJ', label: 'Banjarmasin (BDJ)', data: matrix.BDJ },
    { key: 'TOTAL', label: 'TOTAL (PNK + BDJ)', data: matrix.TOTAL, isTotal: true }
  ];

  tbody.innerHTML = rows.map(r => {
    const d = r.data || {};
    const trClass = r.isTotal ? 'row-total-matrix' : '';
    const labelHtml = r.isTotal ? `<strong>${r.label}</strong>` : `<span class="tag-badge ${r.key === 'PNK' ? 'tag-pnk' : 'tag-bdj'}">${r.label}</span>`;
    const mDok = d.total_motor_dok ?? d.total_motor_dokumen ?? ((d.motor_bensin_dok || 0) + (d.motor_listrik_dok || 0));
    const sTot = d.total_spl ?? ((d.spl_on || 0) + (d.spl_off || 0));
    const siapMuat = d.total_siap_muat ?? (mDok + sTot);
    const hold = d.total_nondok ?? d.motor_hold ?? 0;

    return `
      <tr class="${trClass}">
        <td>${labelHtml}</td>
        <td style="text-align: right; font-weight: 600;">${d.motor_bensin_dok ?? d.motor_bensin ?? 0}</td>
        <td style="text-align: right; font-weight: 600;">${d.motor_listrik_dok ?? d.motor_listrik ?? 0}</td>
        <td style="text-align: right; font-weight: 700; color: #38bdf8;">${mDok}</td>
        <td style="text-align: right; font-weight: 600;">${d.spl_on ?? d.spl_aki_on ?? 0}</td>
        <td style="text-align: right; font-weight: 600;">${d.spl_off ?? d.spl_aki_off ?? 0}</td>
        <td style="text-align: right; font-weight: 700; color: #22d3ee;">${sTot}</td>
        <td style="text-align: right; font-weight: 800; color: #34d399; font-size: 1rem;">${siapMuat}</td>
        <td style="text-align: right; font-weight: 700; color: #fb7185;">${hold}</td>
      </tr>
    `;
  }).join('');
}

// 3. Fetch Vehicles List & Filter
async function fetchKendaraanList() {
  try {
    const token = getToken();
    const searchInput = document.getElementById('kendaraanSearchInput');
    const searchVal = searchInput ? searchInput.value.trim() : '';
    
    let url = `/api/kendaraan/list?`;
    if (searchVal) {
      url += `search=${encodeURIComponent(searchVal)}&`;
    }

    const res = await fetch(url, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    if (!res.ok) throw new Error('Gagal memuat list kendaraan');
    const data = await res.json();
    kendaraanListData = data.data || [];

    updateKendaraanTabCounters();
    renderKendaraanTable();
  } catch (err) {
    console.error('fetchKendaraanList error:', err);
  }
}

// 4. Update Tab Counters
function updateKendaraanTabCounters() {
  const allCount = kendaraanListData.length;
  let siapCount = 0;
  let holdCount = 0;
  let pnkCount = 0;
  let bdjCount = 0;

  kendaraanListData.forEach(k => {
    const tipe = (k.tipe_kendaraan || '').toLowerCase();
    const dok = (k.status_dokumen || '');
    const isSpl = tipe.includes('spl') || tipe.includes('sepeda');
    const isDokumen = dok === 'Lengkap';
    const isHold = (tipe.includes('motor') && !isDokumen) || k.status_muat === 'hold';
    const isSiap = isSpl || (tipe.includes('motor') && isDokumen);

    if (isSiap) siapCount++;
    if (isHold) holdCount++;

    const tlc = (k.tlc_tujuan || '').toUpperCase();
    if (tlc.includes('PNK') || tlc.includes('PONTIANAK')) pnkCount++;
    if (tlc.includes('BDJ') || tlc.includes('BANJARMASIN')) bdjCount++;
  });

  const elAll = document.getElementById('countTabAll');
  const elSiap = document.getElementById('countTabSiapMuat');
  const elHold = document.getElementById('countTabHold');
  const elPnk = document.getElementById('countTabPnk');
  const elBdj = document.getElementById('countTabBdj');

  if (elAll) elAll.textContent = allCount;
  if (elSiap) elSiap.textContent = siapCount;
  if (elHold) elHold.textContent = holdCount;
  if (elPnk) elPnk.textContent = pnkCount;
  if (elBdj) elBdj.textContent = bdjCount;
}

// 5. Render Vehicles Table
function renderKendaraanTable() {
  const tbody = document.getElementById('kendaraanTableBody');
  const emptyState = document.getElementById('kendaraanEmptyState');
  const noMatchState = document.getElementById('kendaraanNoMatchState');
  if (!tbody) return;

  let filtered = [...kendaraanListData];

  // Apply tab filter
  if (kendaraanFilterTab === 'siap_muat') {
    filtered = filtered.filter(k => {
      const tipe = (k.tipe_kendaraan || '').toLowerCase();
      const isSpl = tipe.includes('spl') || tipe.includes('sepeda');
      const isDok = k.status_dokumen === 'Lengkap';
      return isSpl || (tipe.includes('motor') && isDok);
    });
  } else if (kendaraanFilterTab === 'hold') {
    filtered = filtered.filter(k => {
      const tipe = (k.tipe_kendaraan || '').toLowerCase();
      return (tipe.includes('motor') && k.status_dokumen !== 'Lengkap') || k.status_muat === 'hold';
    });
  } else if (kendaraanFilterTab === 'pnk') {
    filtered = filtered.filter(k => (k.tlc_tujuan || '').toUpperCase().includes('PNK'));
  } else if (kendaraanFilterTab === 'bdj') {
    filtered = filtered.filter(k => (k.tlc_tujuan || '').toUpperCase().includes('BDJ'));
  }

  if (kendaraanListData.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (noMatchState) noMatchState.classList.add('hidden');
    return;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');
    if (noMatchState) noMatchState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (noMatchState) noMatchState.classList.add('hidden');

  tbody.innerHTML = filtered.map((k, idx) => {
    // Badges logic
    const tlc = (k.tlc_tujuan || '').toUpperCase();
    let tujuanBadge = `<span class="tag-badge tag-lainnya">${escKendaraanHtml(tlc || '-')}</span>`;
    if (tlc.includes('PNK') || tlc.includes('PONTIANAK')) {
      tujuanBadge = `<span class="tag-badge tag-pnk">📍 PNK</span>`;
    } else if (tlc.includes('BDJ') || tlc.includes('BANJARMASIN')) {
      tujuanBadge = `<span class="tag-badge tag-bdj">📍 BDJ</span>`;
    }

    const tipe = k.tipe_kendaraan || '-';
    let tipeBadge = `<span class="tag-badge tag-motor-bensin">${escKendaraanHtml(tipe)}</span>`;
    if (tipe.toLowerCase().includes('spl') || tipe.toLowerCase().includes('sepeda')) {
      tipeBadge = `<span class="tag-badge tag-spl">⚡ Sepeda Listrik</span>`;
    } else if (tipe.toLowerCase().includes('listrik')) {
      tipeBadge = `<span class="tag-badge tag-motor-listrik">🔌 Motor Listrik</span>`;
    }

    const dok = k.status_dokumen || '-';
    let dokBadge = `<span class="tag-badge tag-dok-tidak">❌ Non-Dokumen (HOLD)</span>`;
    if (dok === 'Lengkap') {
      dokBadge = `<span class="tag-badge tag-dok-lengkap">✅ Dokumen Lengkap</span>`;
    } else if (tipe.toLowerCase().includes('spl') || tipe.toLowerCase().includes('sepeda')) {
      const aki = k.status_spl || k.status_aki || 'Aki Terpasang';
      const isOff = aki.toLowerCase().includes('lepas') || aki.toLowerCase().includes('off');
      dokBadge = isOff 
        ? `<span class="tag-badge tag-spl" style="opacity: 0.85;">Aki Lepas (OFF)</span>` 
        : `<span class="tag-badge tag-dok-lengkap">Aki Terpasang (ON)</span>`;
    }

    // Gateway & PIC info
    const gw = k.effective_gateway || k.nama_gateway || '-';
    const pic = k.effective_pic || k.tagging_pic || '-';
    const outlet = k.effective_outlet || k.kode_outlet || '';

    // Direct WhatsApp Link
    let waButton = '';
    const phone = k.pic_phone || '';
    if (pic !== '-' && phone) {
      const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
      const waMsg = encodeURIComponent(`Halo Kak ${pic}, izin konfirmasi unit tertahan dokumen di Gudang: No Resi ${k.awb} tujuan ${k.tlc_tujuan}. Mohon bantuannya terimakasih.`);
      waButton = `<a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="wa-btn-link" title="Chat WhatsApp PIC Gateway">📱 WA PIC</a>`;
    }

    // Format date
    let dateStr = '-';
    if (k.tanggal_input) {
      const d = new Date(k.tanggal_input);
      dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    return `
      <tr>
        <td style="text-align: center; color: #94a3b8; font-size: 0.8rem;">${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="color: #f8fafc; font-family: monospace; font-size: 0.88rem;">${escKendaraanHtml(k.awb)}</strong>
            <button type="button" class="btn-copy-mini" onclick="navigator.clipboard.writeText('${escKendaraanHtml(k.awb)}'); showAppAlert('No AWB disalin ke clipboard!');" title="Salin AWB">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </td>
        <td>${tipeBadge}</td>
        <td>${tujuanBadge}</td>
        <td>${dokBadge}</td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-weight: 600; color: #e2e8f0; font-size: 0.82rem;">${escKendaraanHtml(gw)}</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">${outlet ? escKendaraanHtml(outlet) + ' &bull; ' : ''}PIC: <strong style="color: #cbd5e1;">${escKendaraanHtml(pic)}</strong></span>
            ${waButton}
          </div>
        </td>
        <td style="text-align: center; font-weight: 700; color: #38bdf8;">${k.koli || 1}</td>
        <td>
          <span style="font-size: 0.78rem; color: #94a3b8; max-width: 180px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escKendaraanHtml(k.keterangan || '-')}">
            ${escKendaraanHtml(k.keterangan || '-')}
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; font-size: 0.75rem; color: #94a3b8;">
            <span>${dateStr}</span>
            <span style="color: #64748b;">${escKendaraanHtml(k.spot_petugas || '-')}</span>
          </div>
        </td>
        <td style="text-align: center;">
          <div class="table-action-btns">
            <button type="button" class="btn-action-icon" title="Edit Unit" onclick="editKendaraanById(${k.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button type="button" class="btn-action-icon btn-delete" title="Hapus Unit" onclick="deleteKendaraanById(${k.id}, '${escKendaraanHtml(k.awb)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 6. Google Sheet Sync Handler
async function syncKendaraanFromGoogleSheet() {
  const btn = document.getElementById('btnSyncKendaraanGSheet');
  if (btn) {
    btn.classList.add('is-loading');
    btn.disabled = true;
  }

  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/sync-sheet', {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menyinkronkan data dari Google Sheet');
    }

    if (data.kpi && data.matrix) {
      applyKendaraanDashboardData(data);
    }
    if (data.data) {
      kendaraanListData = data.data;
      renderKendaraanTable();
    } else {
      await Promise.all([fetchKendaraanDashboard(), fetchKendaraanList()]);
    }

    showAppAlert(`Sinkronisasi Berhasil! ${data.synced_count || 0} unit kendaraan aktif berhasil ditarik dari AppSheet Google Sheet.`);
  } catch (err) {
    showAppAlert(err.message, true);
  } finally {
    if (btn) {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }
}

// 7. Open Add / Edit Modal (AppSheet Style)
function setAppSheetToggle(group, value) {
  const buttons = document.querySelectorAll(`.appsheet-toggle-btn[data-group="${group}"]`);
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === value);
  });
  if (group === 'tlc') {
    const el = document.getElementById('kendaraanTujuan');
    if (el) el.value = value;
  } else if (group === 'tipe') {
    const el = document.getElementById('kendaraanTipe');
    if (el) el.value = value;
    updateConditionalFields();
  } else if (group === 'dokumen') {
    const el = document.getElementById('kendaraanStatusDokumen');
    if (el) el.value = value;
  } else if (group === 'aki') {
    const el = document.getElementById('kendaraanStatusAki');
    if (el) el.value = value;
  }
}

function updateConditionalFields() {
  const tipeInput = document.getElementById('kendaraanTipe');
  const tipe = tipeInput ? tipeInput.value : 'Motor Bensin';
  const wrapDokumen = document.getElementById('wrapFieldDokumen');
  const wrapAki = document.getElementById('wrapFieldStatusAki');

  if (tipe === 'Sepeda Listrik') {
    if (wrapDokumen) wrapDokumen.classList.add('hidden');
    if (wrapAki) wrapAki.classList.remove('hidden');
  } else {
    if (wrapDokumen) wrapDokumen.classList.remove('hidden');
    if (wrapAki) wrapAki.classList.add('hidden');
  }
}

function openKendaraanModal(data = null) {
  const modal = document.getElementById('kendaraanInputModal');
  const title = document.getElementById('kendaraanModalTitle');
  const idInput = document.getElementById('kendaraanId');
  const awbInput = document.getElementById('kendaraanAwb');
  const koliInput = document.getElementById('kendaraanKoli');
  const ketInput = document.getElementById('kendaraanKeterangan');

  if (data) {
    if (title) title.textContent = 'Edit Data Kendaraan';
    if (idInput) idInput.value = data.id;
    if (awbInput) { awbInput.value = data.awb || ''; awbInput.readOnly = true; }

    const tlc = (data.tlc_tujuan || 'BDJ').toUpperCase();
    setAppSheetToggle('tlc', tlc.includes('PNK') ? 'PNK' : 'BDJ');

    let tipe = data.tipe_kendaraan || 'Motor Bensin';
    if (tipe.toLowerCase().includes('spl') || tipe.toLowerCase().includes('sepeda')) tipe = 'Sepeda Listrik';
    else if (tipe.toLowerCase().includes('listrik')) tipe = 'Motor Listrik';
    else tipe = 'Motor Bensin';
    setAppSheetToggle('tipe', tipe);

    const dok = data.status_dokumen === 'Lengkap' ? 'Lengkap' : 'Tidak';
    setAppSheetToggle('dokumen', dok);

    const aki = (data.status_spl || data.status_aki || 'ON').toUpperCase().includes('OFF') ? 'OFF' : 'ON';
    setAppSheetToggle('aki', aki);

    if (koliInput) koliInput.value = data.koli || 1;
    if (ketInput) ketInput.value = data.keterangan || '';
  } else {
    if (title) title.textContent = 'Input Kendaraan Baru';
    if (idInput) idInput.value = '';
    if (awbInput) {
      awbInput.value = '';
      awbInput.readOnly = false;
      setTimeout(() => awbInput.focus(), 150);
    }
    setAppSheetToggle('tlc', 'BDJ');
    setAppSheetToggle('tipe', 'Motor Bensin');
    setAppSheetToggle('dokumen', 'Tidak');
    setAppSheetToggle('aki', 'ON');
    if (koliInput) koliInput.value = 1;
    if (ketInput) ketInput.value = '';
  }

  updateConditionalFields();

  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeKendaraanModal() {
  const modal = document.getElementById('kendaraanInputModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Global functions for inline HTML button triggers
window.editKendaraanById = function(id) {
  const item = kendaraanListData.find(k => k.id === id);
  if (item) openKendaraanModal(item);
};

window.deleteKendaraanById = async function(id, awb) {
  if (!confirm(`Hapus unit kendaraan dengan No AWB ${awb}?`)) return;

  try {
    const token = getToken();
    const res = await fetch(`/api/kendaraan/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus unit');
    }

    // Optimistic removal from table
    if (Array.isArray(kendaraanListData)) {
      kendaraanListData = kendaraanListData.filter(x => String(x.id) !== String(id));
      renderKendaraanTable();
    }
    showAppAlert(`Unit ${awb} berhasil dihapus.`);
    Promise.all([fetchKendaraanDashboard(), fetchKendaraanList()]).catch(() => null);
  } catch (err) {
    showAppAlert(err.message, true);
  }
};

// 8b. Clear All Kendaraan Instock
async function clearAllKendaraan() {
  const count = (typeof kendaraanListData !== 'undefined' && Array.isArray(kendaraanListData)) ? kendaraanListData.length : 0;
  const confirmed = window.confirm(
    `⚠️ PERINGATAN HAPUS SEMUA DATA!\n\nApakah Anda yakin ingin menghapus SEMUA data kendaraan instock (${count} unit)?\n\nData yang dihapus dapat ditarik kembali sewaktu-waktu dari AppSheet via tombol "Sinkron AppSheet".\n\nLanjutkan penghapusan?`
  );
  if (!confirmed) return;

  const btn = document.getElementById('btnKendaraanClearAll');
  if (btn) btn.classList.add('is-loading');

  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/clear-all', {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus semua data kendaraan');
    }

    kendaraanListData = [];
    renderKendaraanTable();
    showAppAlert(data.message || 'Semua data kendaraan instock berhasil dihapus.');
    Promise.all([fetchKendaraanDashboard(), fetchKendaraanList()]).catch(() => null);
  } catch (err) {
    console.error('clearAllKendaraan error:', err);
    showAppAlert(err.message, true);
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}
window.clearAllKendaraan = clearAllKendaraan;

// 9. Save Kendaraan (Create or Update)
async function submitKendaraanForm(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : 'Simpan';

  const id = document.getElementById('kendaraanId').value;
  const awb = document.getElementById('kendaraanAwb').value.trim();
  const tlc = document.getElementById('kendaraanTujuan').value;
  const tipe = document.getElementById('kendaraanTipe').value;
  const dok = document.getElementById('kendaraanStatusDokumen').value;
  const aki = document.getElementById('kendaraanStatusAki').value;
  const koli = document.getElementById('kendaraanKoli').value;
  const keterangan = document.getElementById('kendaraanKeterangan').value.trim();

  const isSpl = tipe === 'Sepeda Listrik';

  const payload = {
    awb,
    tipe_kendaraan: tipe,
    tlc_tujuan: tlc,
    status_dokumen: isSpl ? null : dok,
    status_spl: isSpl ? aki : null,
    koli: parseInt(koli, 10) || 1,
    keterangan
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = 'Menyimpan...';
  }

  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    let res;
    if (id) {
      res = await fetch(`/api/kendaraan/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/kendaraan', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      });
    }

    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menyimpan unit kendaraan');
    }

    closeKendaraanModal();
    showAppAlert(id ? 'Data unit kendaraan berhasil diperbarui.' : 'Data unit kendaraan berhasil disimpan.');

    // Optimistic table update
    if (data.data && Array.isArray(kendaraanListData)) {
      if (id) {
        const idx = kendaraanListData.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) kendaraanListData[idx] = data.data;
      } else {
        kendaraanListData.unshift(data.data);
      }
      renderKendaraanTable();
    }

    // Refresh dashboard in background
    Promise.all([fetchKendaraanDashboard(), fetchKendaraanList()]).catch(() => null);
  } catch (err) {
    showAppAlert(err.message, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.innerHTML = originalText;
    }
  }
}

// 11. Master Gateways Modal
async function openMasterGatewaysModal() {
  const modal = document.getElementById('masterGatewaysModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/gateways', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    masterGatewaysData = data.data || [];
    renderMasterGatewaysTable();
  } catch (err) {
    console.error('openMasterGatewaysModal error:', err);
  }
}

function closeMasterGatewaysModal() {
  const modal = document.getElementById('masterGatewaysModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function renderMasterGatewaysTable() {
  const tbody = document.getElementById('masterGatewaysTableBody');
  const searchInput = document.getElementById('searchGatewayInput');
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!tbody) return;

  let filtered = [...masterGatewaysData];
  if (searchVal) {
    filtered = filtered.filter(g => {
      const code = (g.tlc_gateway || '').toLowerCase();
      const name = (g.nama_gateway || '').toLowerCase();
      const pic = (g.tagging_pic || '').toLowerCase();
      return code.includes(searchVal) || name.includes(searchVal) || pic.includes(searchVal);
    });
  }

  tbody.innerHTML = filtered.map((g, idx) => {
    return `
      <tr>
        <td style="text-align: center; color: #94a3b8; font-size: 0.8rem;">${idx + 1}</td>
        <td><strong style="color: #38bdf8; font-family: monospace;">${escKendaraanHtml(g.tlc_gateway || '-')}</strong></td>
        <td><strong style="color: #f8fafc;">${escKendaraanHtml(g.nama_gateway || '-')}</strong></td>
        <td><span style="color: #94a3b8; font-size: 0.8rem;">${escKendaraanHtml(g.area || 'Nasional')}</span></td>
        <td><strong style="color: #cbd5e1;">${escKendaraanHtml(g.tagging_pic || '-')}</strong></td>
        <td style="text-align: center;">
          <button type="button" class="btn-kendaraan-action btn-sync" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openEditPicModal(${g.id}, '${escKendaraanHtml(g.nama_gateway)}', '${escKendaraanHtml(g.tagging_pic || '')}')">
            Edit PIC
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openEditPicModal = function(id, gatewayName, currentPic) {
  const modal = document.getElementById('editGatewayPicModal');
  const label = document.getElementById('editPicGatewayLabel');
  const nameInput = document.getElementById('editPicName');
  const idInput = document.getElementById('editPicGatewayCode');

  if (idInput) idInput.value = id;
  if (label) label.value = gatewayName;
  if (nameInput) nameInput.value = currentPic || '';

  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
};

function closeEditPicModal() {
  const modal = document.getElementById('editGatewayPicModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function submitEditPicForm(e) {
  e.preventDefault();
  const id = document.getElementById('editPicGatewayCode').value;
  const name = document.getElementById('editPicName').value.trim();

  try {
    const token = getToken();
    const res = await fetch(`/api/kendaraan/gateways/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ tagging_pic: name })
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menyimpan PIC');
    }

    closeEditPicModal();
    showAppAlert('Kontak PIC Gateway berhasil diperbarui.');
    await openMasterGatewaysModal(); // refresh list
  } catch (err) {
    showAppAlert(err.message, true);
  }
}

// 12. Setup Event Listeners for Kendaraan Module
let kendaraanListenersInitialized = false;
function initKendaraanEventListeners() {
  if (kendaraanListenersInitialized) return;
  kendaraanListenersInitialized = true;

  // Sync Button
  const btnSync = document.getElementById('btnSyncKendaraanGSheet');
  if (btnSync) btnSync.addEventListener('click', syncKendaraanFromGoogleSheet);

  // Clear All Kendaraan Button
  const btnClearKendaraan = document.getElementById('btnKendaraanClearAll');
  if (btnClearKendaraan) btnClearKendaraan.addEventListener('click', clearAllKendaraan);


  // Copy WA Capacity
  const btnCopyWa = document.getElementById('btnCopyWaCapacity');
  if (btnCopyWa) {
    btnCopyWa.addEventListener('click', () => {
      const preview = document.getElementById('previewWaCapacity');
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent);
        const span = document.getElementById('btnCopyWaCapacityText');
        if (span) span.textContent = 'Tersalin! ✅';
        setTimeout(() => { if (span) span.textContent = 'Salin Format WA'; }, 2000);
      }
    });
  }

  // Open Add Modal
  const btnAdd = document.getElementById('btnOpenAddKendaraanModal');
  if (btnAdd) btnAdd.addEventListener('click', () => openKendaraanModal());

  // Close Add Modal
  const closeAddBtn = document.getElementById('closeKendaraanModalBtn');
  const cancelAddBtn = document.getElementById('cancelKendaraanModalBtn');
  if (closeAddBtn) closeAddBtn.addEventListener('click', closeKendaraanModal);
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeKendaraanModal);

  // Submit Add/Edit Form
  const formKendaraan = document.getElementById('kendaraanForm');
  if (formKendaraan) formKendaraan.addEventListener('submit', submitKendaraanForm);

  // AppSheet Toggle Buttons Listener
  document.querySelectorAll('.appsheet-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-group');
      const val = btn.getAttribute('data-val');
      if (group && val) {
        setAppSheetToggle(group, val);
      }
    });
  });

  // Stepper Buttons for koli
  const btnKoliMinus = document.getElementById('btnKoliMinus');
  const btnKoliPlus = document.getElementById('btnKoliPlus');
  const koliInput = document.getElementById('kendaraanKoli');
  if (btnKoliMinus && koliInput) {
    btnKoliMinus.addEventListener('click', () => {
      const cur = parseInt(koliInput.value, 10) || 1;
      if (cur > 1) koliInput.value = cur - 1;
    });
  }
  if (btnKoliPlus && koliInput) {
    btnKoliPlus.addEventListener('click', () => {
      const cur = parseInt(koliInput.value, 10) || 1;
      koliInput.value = cur + 1;
    });
  }

  // Barcode / QR Icon Focus
  const btnScanAwbIcon = document.getElementById('btnScanAwbIcon');
  const awbInput = document.getElementById('kendaraanAwb');
  if (btnScanAwbIcon && awbInput) {
    btnScanAwbIcon.addEventListener('click', () => {
      awbInput.focus();
      showAppAlert('Arahkan laser scanner PDA ke barcode waybill!');
    });
  }

  // Filter Tabs
  const tabButtons = document.querySelectorAll('.toolbar-filter-tabs .filter-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      kendaraanFilterTab = btn.getAttribute('data-tab') || 'all';
      renderKendaraanTable();
    });
  });

  // KPI Cards click -> filters table tab
  const kpiSiap = document.getElementById('kpiCardSiapMuat');
  if (kpiSiap) {
    kpiSiap.addEventListener('click', () => {
      const tab = document.querySelector('.filter-tab-btn[data-tab="siap_muat"]');
      if (tab) tab.click();
    });
  }

  const kpiHold = document.getElementById('kpiCardMotorHold');
  if (kpiHold) {
    kpiHold.addEventListener('click', () => {
      const tab = document.querySelector('.filter-tab-btn[data-tab="hold"]');
      if (tab) tab.click();
    });
  }

  // Search Input for Kendaraan
  const searchInput = document.getElementById('kendaraanSearchInput');
  const btnClearSearch = document.getElementById('btnClearKendaraanSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (btnClearSearch) btnClearSearch.classList.toggle('hidden', !searchInput.value);
      clearTimeout(kendaraanSearchDebounce);
      kendaraanSearchDebounce = setTimeout(() => {
        fetchKendaraanList();
      }, 300);
    });
  }
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      btnClearSearch.classList.add('hidden');
      fetchKendaraanList();
    });
  }

  // Master Gateways Modal triggers
  const btnOpenGw = document.getElementById('btnOpenMasterGateways');
  const closeGwBtn = document.getElementById('closeMasterGatewaysBtn');
  const closeGwBottomBtn = document.getElementById('closeMasterGatewaysBottomBtn');
  if (btnOpenGw) btnOpenGw.addEventListener('click', openMasterGatewaysModal);
  if (closeGwBtn) closeGwBtn.addEventListener('click', closeMasterGatewaysModal);
  if (closeGwBottomBtn) closeGwBottomBtn.addEventListener('click', closeMasterGatewaysModal);

  // Search Gateways
  const searchGwInput = document.getElementById('searchGatewayInput');
  const btnClearGwSearch = document.getElementById('btnClearGatewaySearch');
  if (searchGwInput) {
    searchGwInput.addEventListener('input', () => {
      if (btnClearGwSearch) btnClearGwSearch.classList.toggle('hidden', !searchGwInput.value);
      clearTimeout(masterGatewaySearchDebounce);
      masterGatewaySearchDebounce = setTimeout(renderMasterGatewaysTable, 200);
    });
  }
  if (btnClearGwSearch) {
    btnClearGwSearch.addEventListener('click', () => {
      if (searchGwInput) searchGwInput.value = '';
      btnClearGwSearch.classList.add('hidden');
      renderMasterGatewaysTable();
    });
  }

  // Edit PIC Modal triggers
  const closeEditPicBtn = document.getElementById('closeEditPicModalBtn');
  const cancelEditPicBtn = document.getElementById('cancelEditPicBtn');
  const editPicForm = document.getElementById('editGatewayPicForm');
  if (closeEditPicBtn) closeEditPicBtn.addEventListener('click', closeEditPicModal);
  if (cancelEditPicBtn) cancelEditPicBtn.addEventListener('click', closeEditPicModal);
  if (editPicForm) editPicForm.addEventListener('submit', submitEditPicForm);
}

// Auto-run event listeners registration once DOM loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKendaraanEventListeners);
} else {
  initKendaraanEventListeners();
}

