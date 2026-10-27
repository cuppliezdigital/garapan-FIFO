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
  col_asal: '',
  col_penerima: '',
  col_tujuan: '',
  col_alamat: '',
  col_holding_gw: '',
  col_rute: '',
  col_durasi_min: '',
  col_durasi_max: '',
  col_status: 'ALL',
  operationalStatus: 'active',
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
  pollTimer: null,
  bulkTimer: null
};

let gudangSearchDebounceTimer = null;
let gudangFetchAbortController = null;

// 1. Initial Dashboard Load (Fast parallel dispatch)
async function loadGudangRuteDashboard() {
  checkGudangImportStatus(false);
  await Promise.all([
    fetchGudangFileInfo(),
    fetchGudangInventory()
  ]);
}

// 2. Fetch File Info & Sync Status
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
      if (json.stats?.lastSync?.filename) {
        badge.textContent = `${json.stats.lastSync.filename} • ${json.stats.lastSync.batch_time || ''}`.trim();
        badge.title = `Sync: ${json.stats.lastSync.filename} | Waktu: ${json.stats.lastSync.batch_time} | ${json.stats.lastSync.message || ''}`;
      } else if (json.stats && json.stats.latestBatchTime !== '-') {
        badge.textContent = `Batch: ${json.stats.latestBatchTime}`;
      } else if (json.latestFile) {
        badge.textContent = `File: ${json.latestFile.fileName.substring(0, 30)}... (${json.latestFile.sizeMB} MB)`;
      } else {
        badge.textContent = 'Batch: Siap Tempel Data';
      }
    }
  } catch (err) {
    console.warn('fetchGudangFileInfo error:', err);
  }
}

// 3. Quick Paste Modal & Ingestion Controller
function openQuickPasteModal() {
  const modal = document.getElementById('modalQuickPasteGudang');
  if (!modal) return;
  modal.style.display = 'flex';

  resetQuickPasteToInput();

  const batchInput = document.getElementById('quickPasteBatchTime');
  if (batchInput && !batchInput.value) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    batchInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  const textarea = document.getElementById('quickPasteTextarea');
  if (textarea) {
    textarea.focus();
    onQuickPasteInput();
  }
}

let latestPastedWaybills = [];

function resetQuickPasteToInput() {
  const formSection = document.getElementById('quickPasteFormContainer');
  const progSection = document.getElementById('quickPasteProgressContainer');
  const textarea = document.getElementById('quickPasteTextarea');
  const btn = document.getElementById('btnSubmitQuickPaste');
  const btnText = document.getElementById('btnSubmitQuickPasteText');

  if (formSection) formSection.style.display = 'flex';
  if (progSection) progSection.style.display = 'none';
  if (btn) btn.disabled = false;
  if (btnText) btnText.textContent = '🚀 Simpan & Auto-Enrich Sekarang';

  if (textarea) {
    textarea.value = '';
    onQuickPasteInput();
    textarea.focus();
  }
}

async function viewPastedInMainTable() {
  closeQuickPasteModal();
  if (!latestPastedWaybills || latestPastedWaybills.length === 0) return;

  // Set the waybill search input in the table header to the pasted waybills
  const searchInput = document.getElementById('colSearchWaybill');
  if (searchInput) {
    searchInput.value = latestPastedWaybills.join(', ');
  }
  gudangState.col_waybill = latestPastedWaybills.join(', ');
  gudangState.page = 1;

  showGudangToast(`🔍 Menampilkan ${latestPastedWaybills.length.toLocaleString('id-ID')} waybill yang baru ditempel di tabel.`);
  await fetchGudangInventory();
}

function closeQuickPasteModal() {
  const modal = document.getElementById('modalQuickPasteGudang');
  if (modal) modal.style.display = 'none';
}

function clearQuickPasteText() {
  const textarea = document.getElementById('quickPasteTextarea');
  if (textarea) {
    textarea.value = '';
    onQuickPasteInput();
    textarea.focus();
  }
}

let quickPasteDebounceTimer = null;
let quickPasteExistingList = [];

function toggleExistingListDropdown() {
  const drawer = document.getElementById('drawerExistingWaybills');
  if (!drawer) return;
  drawer.style.display = (drawer.style.display === 'none' || !drawer.style.display) ? 'block' : 'none';
}

function onQuickPasteInput() {
  const textarea = document.getElementById('quickPasteTextarea');
  const badgeText = document.getElementById('quickPasteStatusText');
  const badgeDot = document.getElementById('quickPasteStatusDot');
  const badgeContainer = document.getElementById('quickPasteStatusBadge');
  const badgeNew = document.getElementById('badgeQuickPasteNew');
  const textNew = document.getElementById('textQuickPasteNew');
  const badgeExisting = document.getElementById('badgeQuickPasteExisting');
  const textExisting = document.getElementById('textQuickPasteExisting');
  const drawerExisting = document.getElementById('drawerExistingWaybills');

  if (quickPasteDebounceTimer) {
    clearTimeout(quickPasteDebounceTimer);
    quickPasteDebounceTimer = null;
  }

  if (!textarea || !badgeText) return;

  const raw = textarea.value || '';
  if (!raw.trim()) {
    badgeText.textContent = '0 baris waybill terdeteksi';
    if (badgeDot) badgeDot.style.background = '#94a3b8';
    if (badgeContainer) {
      badgeContainer.style.background = 'rgba(148, 163, 184, 0.12)';
      badgeContainer.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      badgeContainer.style.color = '#94a3b8';
    }
    if (badgeNew) badgeNew.style.display = 'none';
    if (badgeExisting) badgeExisting.style.display = 'none';
    if (drawerExisting) drawerExisting.style.display = 'none';
    quickPasteExistingList = [];
    return;
  }

  // Count lines skipping headers and extract unique waybills
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const detectedWaybills = [];
  let maxCols = 1;

  for (const line of lines) {
    if (
      line.includes('运单号') || 
      line.toLowerCase().includes('waybill') || 
      line.toLowerCase().includes('nomor')
    ) {
      continue;
    }
    const cols = line.split('\t');
    if (cols.length > maxCols) maxCols = cols.length;
    const firstCol = (cols[0] || '').replace(/[^a-zA-Z0-9]/g, '');
    if (firstCol && firstCol.length >= 5) {
      detectedWaybills.push(firstCol);
    }
  }

  const count = detectedWaybills.length;
  if (count > 0) {
    const colInfo = maxCols >= 15 ? 'Tabel 19 Kolom Feishu/Excel' : (maxCols > 1 ? `${maxCols} Kolom` : 'Daftar Resi');
    badgeText.textContent = `✔ ${count.toLocaleString('id-ID')} waybill (${colInfo})`;
    if (badgeDot) badgeDot.style.background = '#34d399';
    if (badgeContainer) {
      badgeContainer.style.background = 'rgba(52, 211, 153, 0.15)';
      badgeContainer.style.borderColor = 'rgba(52, 211, 153, 0.35)';
      badgeContainer.style.color = '#34d399';
    }

    // Show checking indicator immediately
    if (badgeNew && textNew) {
      badgeNew.style.display = 'inline-flex';
      textNew.textContent = 'Memeriksa database...';
    }
    if (badgeExisting) badgeExisting.style.display = 'none';

    quickPasteDebounceTimer = setTimeout(() => {
      checkPastedDuplicates(detectedWaybills);
    }, 350);

  } else {
    badgeText.textContent = 'Menunggu data waybill yang valid...';
    if (badgeDot) badgeDot.style.background = '#fbbf24';
    if (badgeContainer) {
      badgeContainer.style.background = 'rgba(245, 158, 11, 0.15)';
      badgeContainer.style.borderColor = 'rgba(245, 158, 11, 0.35)';
      badgeContainer.style.color = '#fbbf24';
    }
    if (badgeNew) badgeNew.style.display = 'none';
    if (badgeExisting) badgeExisting.style.display = 'none';
  }
}

async function checkPastedDuplicates(waybills) {
  if (!waybills || waybills.length === 0) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/check-existing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ waybills: waybills.slice(0, 10000) })
    });
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success) return;

    const badgeNew = document.getElementById('badgeQuickPasteNew');
    const textNew = document.getElementById('textQuickPasteNew');
    const badgeExisting = document.getElementById('badgeQuickPasteExisting');
    const textExisting = document.getElementById('textQuickPasteExisting');
    const listContent = document.getElementById('listExistingWaybillsContent');

    quickPasteExistingList = json.existingWaybills || [];

    if (badgeNew && textNew) {
      badgeNew.style.display = 'inline-flex';
      textNew.textContent = `🟢 ${json.newCount.toLocaleString('id-ID')} Resi Baru`;
    }

    if (badgeExisting && textExisting) {
      if (json.existingCount > 0) {
        badgeExisting.style.display = 'inline-flex';
        textExisting.textContent = `🟡 ${json.existingCount.toLocaleString('id-ID')} Sudah Ada`;
      } else {
        badgeExisting.style.display = 'none';
      }
    }

    if (listContent) {
      if (quickPasteExistingList.length > 0) {
        listContent.innerHTML = quickPasteExistingList.map(wb => `
          <span style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(245, 158, 11, 0.35); padding: 3px 9px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px;">
            <span>${escapeHtml(wb)}</span>
          </span>
        `).join('');
      } else {
        listContent.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Tidak ada resi yang duplikat.</span>';
      }
    }
  } catch (err) {
    console.warn('checkPastedDuplicates error:', err);
  }
}

// 2b-2. Drag & Drop and File Selection Handlers (.xlsx, .csv, .txt)
function handleGudangDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('quickPasteDropZone');
  if (zone) {
    zone.style.background = 'rgba(52, 211, 153, 0.18)';
    zone.style.borderColor = '#10b981';
  }
}

function handleGudangDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('quickPasteDropZone');
  if (zone) {
    zone.style.background = 'rgba(16, 185, 129, 0.06)';
    zone.style.borderColor = 'rgba(52, 211, 153, 0.45)';
  }
}

function handleGudangFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  handleGudangDragLeave(e);
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processGudangUploadedFile(files[0]);
  }
}

function handleGudangFileSelect(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    processGudangUploadedFile(files[0]);
  }
}

async function processGudangUploadedFile(file) {
  if (!file) return;
  const fileName = file.name || '';
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

  if (!['.xlsx', '.csv', '.txt'].includes(ext)) {
    alert('Format file tidak didukung. Harap pilih file .xlsx, .csv, atau .txt.');
    return;
  }

  // If TXT file, read instantly in browser and populate textarea
  if (ext === '.txt') {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      const textarea = document.getElementById('quickPasteTextarea');
      if (textarea) {
        textarea.value = content;
        onQuickPasteInput();
        showGudangToast(`📄 File "${fileName}" berhasil dibaca! Siap disimpan.`);
      }
    };
    reader.readAsText(file);
    return;
  }

  // XLSX or CSV: upload and stream directly
  const formSection = document.getElementById('quickPasteFormContainer');
  const progSection = document.getElementById('quickPasteProgressContainer');
  const liveRunning = document.getElementById('quickPasteLiveRunning');
  const liveDone = document.getElementById('quickPasteLiveDone');
  const elWbBadge = document.getElementById('quickPasteLiveWbCountBadge');
  const elTimer = document.getElementById('quickPasteLiveTimer');
  const elBar = document.getElementById('quickPasteProgressBar');
  const elPercent = document.getElementById('quickPasteLivePercent');
  const elCurrentTask = document.getElementById('quickPasteLiveCurrentTask');

  if (formSection) formSection.style.display = 'none';
  if (progSection) progSection.style.display = 'flex';
  if (liveRunning) liveRunning.style.display = 'flex';
  if (liveDone) liveDone.style.display = 'none';

  if (elWbBadge) elWbBadge.textContent = `Mengunggah & Memproses: ${fileName}`;
  if (elCurrentTask) elCurrentTask.textContent = 'Mengunggah file ke server...';
  if (elBar) elBar.style.width = '15%';
  if (elPercent) elPercent.textContent = '15%';

  function setUploadStep(stepNum, statusText, isDone = false) {
    for (let i = 1; i <= 4; i++) {
      const card = document.getElementById(`qpStep${i}`);
      const icon = document.getElementById(`qpStep${i}Icon`);
      const statusBadge = document.getElementById(`qpStep${i}Status`);
      if (!card || !icon || !statusBadge) continue;

      if (i < stepNum || (i === stepNum && isDone)) {
        card.style.opacity = '1';
        card.style.background = 'rgba(16, 185, 129, 0.12)';
        card.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        icon.textContent = '✅';
        statusBadge.textContent = 'Selesai';
        statusBadge.style.color = '#34d399';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      } else if (i === stepNum) {
        card.style.opacity = '1';
        card.style.background = 'rgba(30, 41, 59, 0.7)';
        card.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        icon.textContent = '⏳';
        statusBadge.textContent = statusText || 'Sedang Berjalan';
        statusBadge.style.color = '#38bdf8';
        statusBadge.style.background = 'rgba(56, 189, 248, 0.15)';
      } else {
        card.style.opacity = '0.45';
        card.style.background = 'rgba(30, 41, 59, 0.3)';
        card.style.borderColor = 'rgba(148, 163, 184, 0.1)';
        icon.textContent = '⚪';
        statusBadge.textContent = 'Menunggu';
        statusBadge.style.color = '#94a3b8';
        statusBadge.style.background = 'rgba(148, 163, 184, 0.1)';
      }
    }
  }

  const startTime = Date.now();
  const timerInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (elTimer) elTimer.textContent = `${elapsed}s`;
  }, 100);

  setUploadStep(1, 'Mengunggah & Streaming Excel...');

  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filterGw', 'ALL');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/gudang-rute/upload-import');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.min(45, Math.max(5, Math.round((evt.loaded / evt.total) * 45)));
        const loadedMB = (evt.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (evt.total / (1024 * 1024)).toFixed(1);
        if (elBar) elBar.style.width = `${pct}%`;
        if (elPercent) elPercent.textContent = `${pct}%`;
        if (elCurrentTask) elCurrentTask.textContent = `Mengunggah file ke server: ${loadedMB} MB / ${totalMB} MB (${pct}%)...`;
      }
    };

    xhr.onerror = () => {
      clearInterval(timerInterval);
      alert('Koneksi terputus saat mengunggah file.');
      resetQuickPasteToInput();
    };

    xhr.onload = () => {
      let json = {};
      try {
        json = JSON.parse(xhr.responseText || '{}');
      } catch (_) {}

      if (xhr.status < 200 || xhr.status >= 300 || !json.success) {
        clearInterval(timerInterval);
        alert(json.message || json.error || 'Gagal memproses file unggahan.');
        resetQuickPasteToInput();
        return;
      }

      setUploadStep(2, 'Menyimpan multi-sheet inventaris...');
      if (elBar) elBar.style.width = '48%';
      if (elPercent) elPercent.textContent = '48%';
      if (elCurrentTask) elCurrentTask.textContent = 'Membaca Sheet 1 & Sheet 2 (Streaming Engine)...';

      const pollUploadStatus = setInterval(async () => {
        try {
          const stRes = await fetch('/api/gudang-rute/import-status', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!stRes.ok) return;
          const stJson = await stRes.json();
          const p = stJson.progress;

          if (stJson.isImporting) {
            const count = p?.totalProcessed || 0;
            if (elWbBadge) elWbBadge.textContent = `${count.toLocaleString('id-ID')} waybill diproses...`;
            if (elCurrentTask) elCurrentTask.textContent = p?.message || 'Memproses baris data...';

            if (count > 0) {
              setUploadStep(2, 'Menyimpan data multi-sheet...');
              if (elBar) elBar.style.width = '70%';
              if (elPercent) elPercent.textContent = '70%';
            }
          } else {
            clearInterval(pollUploadStatus);
            clearInterval(timerInterval);

            if (p?.status === 'error') {
              alert('Proses impor terhenti: ' + (p.message || 'Unknown error'));
              resetQuickPasteToInput();
              return;
            }

            setUploadStep(3, 'Auto-enrich nama barang...');
            if (elBar) elBar.style.width = '92%';
            if (elPercent) elPercent.textContent = '92%';

            setTimeout(async () => {
              setUploadStep(4, 'Selesai', true);
              if (elBar) elBar.style.width = '100%';
              if (elPercent) elPercent.textContent = '100%';
              if (elCurrentTask) elCurrentTask.textContent = 'Semua data dan multi-sheet berhasil diimpor!';

              await new Promise(r => setTimeout(r, 300));

              if (liveRunning) liveRunning.style.display = 'none';
              if (liveDone) liveDone.style.display = 'flex';

              const elSummary = document.getElementById('quickPasteResultSummary');
              if (elSummary) {
                elSummary.textContent = `${(p?.totalProcessed || 0).toLocaleString('id-ID')} waybill berhasil diimpor dari file "${fileName}". Auto-enrichment berjalan otomatis!`;
              }

              fetchGudangFileInfo();
              fetchGudangInventory();
            }, 500);
          }
        } catch (pollErr) {
          console.warn('pollUploadStatus error:', pollErr);
        }
      }, 1500);
    };

    xhr.send(formData);

  } catch (err) {
    clearInterval(timerInterval);
    console.error('processGudangUploadedFile error:', err);
    alert('Terjadi kesalahan saat mengunggah file: ' + err.message);
    resetQuickPasteToInput();
  }
}

async function submitQuickPaste() {
  const textarea = document.getElementById('quickPasteTextarea');
  const batchInput = document.getElementById('quickPasteBatchTime');
  const chkAutoEnrich = document.getElementById('chkQuickPasteAutoEnrich');
  const importModeSelect = document.getElementById('quickPasteImportMode');
  const btn = document.getElementById('btnSubmitQuickPaste');
  const btnText = document.getElementById('btnSubmitQuickPasteText');

  const formSection = document.getElementById('quickPasteFormContainer');
  const progSection = document.getElementById('quickPasteProgressContainer');
  const liveRunning = document.getElementById('quickPasteLiveRunning');
  const liveDone = document.getElementById('quickPasteLiveDone');
  const liveTitle = document.getElementById('quickPasteLiveStepTitle');
  const liveDesc = document.getElementById('quickPasteLiveStepDesc');

  const rawText = textarea ? textarea.value.trim() : '';
  if (!rawText) {
    alert('Silakan tempel (Ctrl + V) data tabel waybill terlebih dahulu.');
    if (textarea) textarea.focus();
    return;
  }

  const batchTime = batchInput ? batchInput.value.trim() : '';
  const autoEnrichJfs = chkAutoEnrich ? chkAutoEnrich.checked : true;
  const importMode = importModeSelect ? importModeSelect.value : 'all';

  // Count waybills from rawText
  const validWbLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length >= 5);
  const totalWbCount = Math.max(1, validWbLines.length);

  // Transition to Live Progress View inside modal
  if (formSection) formSection.style.display = 'none';
  if (progSection) progSection.style.display = 'flex';
  if (liveRunning) liveRunning.style.display = 'flex';
  if (liveDone) liveDone.style.display = 'none';

  const elWbBadge = document.getElementById('quickPasteLiveWbCountBadge');
  if (elWbBadge) elWbBadge.textContent = `Memproses ${totalWbCount.toLocaleString('id-ID')} Waybill...`;

  const elTimer = document.getElementById('quickPasteLiveTimer');
  const elBar = document.getElementById('quickPasteProgressBar');
  const elPercent = document.getElementById('quickPasteLivePercent');
  const elCurrentTask = document.getElementById('quickPasteLiveCurrentTask');

  function setQuickPasteStep(stepNum, statusText, isDone = false) {
    for (let i = 1; i <= 4; i++) {
      const card = document.getElementById(`qpStep${i}`);
      const icon = document.getElementById(`qpStep${i}Icon`);
      const statusBadge = document.getElementById(`qpStep${i}Status`);
      if (!card || !icon || !statusBadge) continue;

      if (i < stepNum || (i === stepNum && isDone)) {
        card.style.opacity = '1';
        card.style.background = 'rgba(16, 185, 129, 0.12)';
        card.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        icon.textContent = '✅';
        statusBadge.textContent = 'Selesai';
        statusBadge.style.color = '#34d399';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      } else if (i === stepNum) {
        card.style.opacity = '1';
        card.style.background = 'rgba(30, 41, 59, 0.7)';
        card.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        icon.textContent = '⏳';
        statusBadge.textContent = statusText || 'Sedang Berjalan';
        statusBadge.style.color = '#38bdf8';
        statusBadge.style.background = 'rgba(56, 189, 248, 0.15)';
      } else {
        card.style.opacity = '0.45';
        card.style.background = 'rgba(30, 41, 59, 0.3)';
        card.style.borderColor = 'rgba(148, 163, 184, 0.1)';
        icon.textContent = '⚪';
        statusBadge.textContent = 'Menunggu';
        statusBadge.style.color = '#94a3b8';
        statusBadge.style.background = 'rgba(148, 163, 184, 0.1)';
      }
    }
  }

  // Start live timer & dynamic progress simulation
  let startTime = Date.now();
  setQuickPasteStep(1, 'Menyimpan resi ke DB...');
  if (elBar) elBar.style.width = '20%';
  if (elPercent) elPercent.textContent = '20%';
  if (elCurrentTask) elCurrentTask.textContent = 'Menyimpan data waybill ke database internal...';

  const progressInterval = setInterval(() => {
    const elapsedSec = (Date.now() - startTime) / 1000;
    if (elTimer) elTimer.textContent = `${elapsedSec.toFixed(1)}s`;

    if (elapsedSec >= 0.4 && elapsedSec < 1.2) {
      setQuickPasteStep(2, 'Melacak POD scan...');
      if (elBar) elBar.style.width = '48%';
      if (elPercent) elPercent.textContent = '48%';
      if (elCurrentTask) elCurrentTask.textContent = 'Mengambil scan tracking (Holding GW, Status & Durasi Jam)...';
    } else if (elapsedSec >= 1.2 && elapsedSec < 2.4) {
      setQuickPasteStep(3, 'Membuka sensor bintang (*)...');
      if (elBar) elBar.style.width = '78%';
      if (elPercent) elPercent.textContent = '78%';
      if (elCurrentTask) elCurrentTask.textContent = 'Unmasking sensor bintang (*) & nama produk JFS OMS...';
    } else if (elapsedSec >= 2.4) {
      setQuickPasteStep(4, 'Menyiapkan pratinjau...');
      if (elBar) elBar.style.width = '92%';
      if (elPercent) elPercent.textContent = '92%';
      if (elCurrentTask) elCurrentTask.textContent = 'Menyelesaikan sinkronisasi data tabel...';
    }
  }, 90);

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/paste-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rawText, batchTime, autoEnrichJfs, importMode })
    });

    const json = await res.json();
    clearInterval(progressInterval);

    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal memproses data tempel.');
      resetQuickPasteToInput();
      return;
    }

    const finalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (elTimer) elTimer.textContent = `${finalElapsed}s`;
    if (elBar) elBar.style.width = '100%';
    if (elPercent) elPercent.textContent = '100%';
    if (elCurrentTask) elCurrentTask.textContent = 'Semua data selesai diproses!';
    setQuickPasteStep(4, 'Selesai', true);

    // Smooth 250ms delay so user sees 100% completion checkmark
    await new Promise(r => setTimeout(r, 260));

    latestPastedWaybills = json.pastedWaybills || [];

    // Switch to Completed Preview View
    if (liveRunning) liveRunning.style.display = 'none';
    if (liveDone) liveDone.style.display = 'flex';

    // Update Result Summary
    const elSummary = document.getElementById('quickPasteResultSummary');
    if (elSummary) {
      elSummary.textContent = `${(json.importedCount || 0).toLocaleString('id-ID')} waybill berhasil disimpan (${(json.totalEnriched || 0).toLocaleString('id-ID')} langsung ter-enrich nama barang & toko).`;
    }

    // Update Count badge
    const elCount = document.getElementById('quickPastePreviewCount');
    if (elCount) {
      elCount.textContent = `${(json.previewRows?.length || 0).toLocaleString('id-ID')} waybill ditampilkan`;
    }

    // Render Preview Table
    const tbody = document.getElementById('quickPastePreviewTbody');
    if (tbody && json.previewRows) {
      tbody.innerHTML = json.previewRows.map((r, idx) => `
        <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
          <td style="padding: 9px 12px; color: #94a3b8; text-align: center;">${idx + 1}</td>
          <td style="padding: 9px 12px; font-family: monospace; font-weight: 700; color: #38bdf8;">${escapeHtml(r.waybill)}</td>
          <td style="padding: 9px 12px;">
            ${r.nama_barang ? `<span style="color: #34d399; font-weight: 600;">● ${escapeHtml(r.nama_barang)}</span>` : `<span style="color: #64748b; font-style: italic;">Belum ada nama</span>`}
          </td>
          <td style="padding: 9px 12px; color: #cbd5e1; font-weight: 500;">${escapeHtml(r.pengirim || '-')}</td>
          <td style="padding: 9px 12px; color: #cbd5e1; font-weight: 500;">${escapeHtml(r.penerima || '-')}</td>
          <td style="padding: 9px 12px; color: #94a3b8; font-weight: 600;">${escapeHtml(r.holding_gw || '-')}</td>
          <td style="padding: 9px 12px; text-align: center;"><span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 700; padding: 2px 7px; border-radius: 9999px; font-size: 0.74rem;">${parseFloat(r.durasi_jam || 0).toFixed(1)} Jam</span></td>
        </tr>
      `).join('');
    }

    // Toast notification
    if (json.skippedExisting) {
      showGudangToast(`ℹ Info: ${json.message}`);
    } else if (json.importMode === 'only_new') {
      showGudangToast(`✔ Sukses! ${(json.importedCount || 0).toLocaleString('id-ID')} resi baru disimpan (${(json.existingCount || 0).toLocaleString('id-ID')} resi lama dilewati).`);
    } else {
      showGudangToast(`✔ Sukses! ${(json.newCount || 0).toLocaleString('id-ID')} resi baru disimpan & ${(json.existingCount || 0).toLocaleString('id-ID')} diperbarui!`);
    }

    // If background enrichment was triggered for large remaining sets:
    if (json.backgroundTriggered && typeof startBulkEnrichPolling === 'function') {
      startBulkEnrichPolling();
    }

    // Refresh background inventory
    fetchGudangFileInfo();

  } catch (err) {
    clearInterval(progressInterval);
    alert('Terjadi kesalahan saat memproses data: ' + err.message);
    resetQuickPasteToInput();
  }
}

// 3b. Trigger 1-Click Import from Downloads (Fallback)
async function importLatestGudangRuteFile() {
  const btn = document.getElementById('btnImportLatestGudang');
  const btnText = document.getElementById('btnImportLatestText');
  
  if (!confirm('Mulai baca file Excel terbaru (258MB) dari folder Downloads secara streaming?\nProses berlangsung di latar belakang dengan Smart-Merge anti timpa untuk seluruh waybill nasional.')) {
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = '⏳ Memulai Impor...';

  try {
    const token = localStorage.getItem('token');
    const holdingGwFilter = 'ALL';

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

let isImportPollingActive = false;

function startGudangPolling() {
  if (gudangState.pollTimer) clearInterval(gudangState.pollTimer);
  isImportPollingActive = true;
  gudangState.pollTimer = setInterval(() => checkGudangImportStatus(true), 2000);
}

async function checkGudangImportStatus(isTriggeredByPoll = false) {
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

      if (!gudangState.pollTimer) {
        startGudangPolling();
      }
    } else {
      const wasPolling = isImportPollingActive || isTriggeredByPoll;
      isImportPollingActive = false;

      if (gudangState.pollTimer) {
        clearInterval(gudangState.pollTimer);
        gudangState.pollTimer = null;
      }

      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '⚡ Baca File Terbaru (Downloads)';
      showGudangProgress(false);

      // ONLY re-fetch if this was actively polling an ongoing import that just finished!
      if (wasPolling) {
        if (json.progress?.status === 'success') {
          showGudangToast(`✔ Berhasil mengimpor waybill!`);
          fetchGudangFileInfo();
          fetchGudangInventory();
        } else if (json.progress?.status === 'error') {
          alert('Gagal mengimpor file: ' + (json.progress?.message || 'Unknown error'));
        }
      }
    }
  } catch (err) {
    console.warn('checkGudangImportStatus error:', err);
  }
}

// 4. Fetch Inventory from Server with Live Column Filters & Pagination
async function fetchGudangInventory() {
  // Cancel previous in-flight query if user changes page size or types rapidly
  if (gudangFetchAbortController) {
    try { gudangFetchAbortController.abort(); } catch (_) {}
  }
  gudangFetchAbortController = new AbortController();
  const currentSignal = gudangFetchAbortController.signal;

  // Always sync limit with select element in DOM
  const selPageSize = document.getElementById('gudangPageSize');
  if (selPageSize && selPageSize.value) {
    gudangState.limit = parseInt(selPageSize.value, 10) || gudangState.limit || 50;
  }

  gudangState.isLoading = true;

  const tbody = document.getElementById('tbodyGudangRute');
  if (tbody) {
    // Only wipe and show big centered spinner if table is currently completely empty
    if (!tbody.hasChildNodes() || tbody.children.length === 0 || tbody.innerText.trim() === '') {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 45px 15px; color: #94a3b8;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
              <div class="spinner-small" style="width: 24px; height: 24px; border: 3px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
              <span style="font-size: 0.86rem; font-weight: 600; color: #cbd5e1;">Memuat data (${gudangState.limit.toLocaleString('id-ID')} baris)...</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      // Table already has data: dim gently so rows don't violently flash/disappear
      tbody.style.opacity = '0.45';
      tbody.style.transition = 'opacity 0.15s ease';
    }
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/query', {
      method: 'POST',
      signal: currentSignal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        search: gudangState.search,
        col_waybill: gudangState.col_waybill,
        col_nama_barang: gudangState.col_nama_barang,
        col_pengirim: gudangState.col_pengirim,
        col_asal: gudangState.col_asal,
        col_penerima: gudangState.col_penerima,
        col_tujuan: gudangState.col_tujuan,
        col_alamat: gudangState.col_alamat,
        col_holding_gw: gudangState.col_holding_gw,
        col_rute: gudangState.col_rute,
        col_durasi_min: gudangState.col_durasi_min,
        col_durasi_max: gudangState.col_durasi_max,
        col_status: gudangState.col_status,
        operational_status: gudangState.operationalStatus || 'active',
        holding_gw: gudangState.holdingGw,
        gw_tujuan: gudangState.destGw,
        tipe_jalur: gudangState.tipeJalur,
        durasi_kategori: gudangState.aging,
        is_problem: gudangState.is_problem || '',
        enrich_status: gudangState.enrichStatus,
        page: gudangState.page,
        limit: gudangState.limit,
        pageSize: gudangState.limit,
        sortBy: gudangState.sortBy,
        sortDir: gudangState.sortDir
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat data inventaris');
    }

    populateGudangDropdowns(json.holdingGateways, json.destGateways);
    updateGudangKpis(json.stats);
    renderGudangTable(json.data);
    updateGudangPagination(json.pagination);
  } catch (err) {
    if (err.name === 'AbortError') {
      // Ignored: new request was triggered
      return;
    }
    console.error('fetchGudangInventory error:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 35px 15px; color: #f87171;">
            Gagal memuat data: ${err.message}
          </td>
        </tr>
      `;
    }
  } finally {
    gudangState.isLoading = false;
    if (tbody) {
      tbody.style.opacity = '1';
    }
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
    selHolding.innerHTML = '<option value="ALL">🌐 Semua Gateway (Nasional ~1 Juta Paket)</option>';
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

// 5. RENDER GUDANG TABLE (13 KOLOM DENGAN ASAL & TUJUAN LENGKAP)
function renderGudangTable(rows = []) {
  const tbody = document.getElementById('tbodyGudangRute');
  if (!tbody) return;

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 45px 15px; color: #94a3b8;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <p style="margin: 0; font-size: 0.92rem; font-weight: 600; color: #cbd5e1;">Tidak ada data waybill yang cocok</p>
            <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Ketikkan kata kunci lain atau bersihkan filter kolom.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const startNo = (gudangState.page - 1) * gudangState.limit + 1;
  const html = rows.map((r, idx) => {
    const no = startNo + idx;

    // Aging pill color
    const durasi = Number(r.durasi_jam) || 0;
    let agingClass = 'aging-pill-green';
    if (durasi > 72) {
      agingClass = 'aging-pill-red';
    } else if (durasi > 48) {
      agingClass = 'aging-pill-orange';
    } else if (durasi > 24) {
      agingClass = 'aging-pill-amber';
    } else if (durasi > 12) {
      agingClass = 'aging-pill-cyan';
    }

    // Goods name display
    const hasGoods = Boolean(r.nama_barang && r.nama_barang.trim());
    const goodsDisplay = hasGoods 
      ? `<div style="font-weight: 600; color: #f8fafc; font-size: 0.84rem; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(r.nama_barang)}">
           <span style="color: #34d399; margin-right: 3px;">●</span>${escapeHtml(r.nama_barang)}
         </div>`
      : `<span style="font-size: 0.76rem; color: #64748b; font-style: italic;">Belum ada nama barang</span>`;

    // Sender display
    const senderDisplay = `
      <div style="font-weight: 600; color: #f1f5f9; font-size: 0.82rem; line-height: 1.3;">${escapeHtml(r.pengirim || '-')}</div>
      ${r.perusahaan_pengirim ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(r.perusahaan_pengirim)}</div>` : ''}
      ${r.no_hp_pengirim ? `<div style="font-size: 0.72rem; color: #38bdf8; font-family: monospace; margin-top: 2px;">📞 ${escapeHtml(r.no_hp_pengirim)}</div>` : ''}
    `;

    // Origin location display (Gateway & Outlet Asal)
    const asalDisplay = `
      <div class="loc-route-container">
        <div class="loc-row">
          <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">GW:</span>
          <span class="badge-gw badge-gw-origin" title="Gateway Pengirim">${escapeHtml(r.gw_asal || '-')}</span>
        </div>
        <div class="loc-row">
          <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">OUTLET:</span>
          <span class="badge-outlet" title="Outlet / Cabang Pengirim">${escapeHtml(r.outlet_asal || '-')}</span>
        </div>
        ${r.tgl_buka ? `<div style="font-size: 0.68rem; color: #64748b; margin-top: 1px;" title="Waktu Buka Resi">🕒 ${escapeHtml(r.tgl_buka.substring(0, 16))}</div>` : ''}
      </div>
    `;

    // Receiver display with WA link
    const cleanPhone = (r.no_hp_penerima || '').replace(/\D/g, '');
    const waLink = cleanPhone.length >= 8 
      ? `<a href="https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}" target="_blank" style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; color: #22c55e; text-decoration: none; margin-left: 4px; font-weight: 700;" title="Chat WhatsApp">WA &raquo;</a>` 
      : '';

    const receiverDisplay = `
      <div style="font-weight: 600; color: #f1f5f9; font-size: 0.82rem; line-height: 1.3;">${escapeHtml(r.penerima || '-')}</div>
      ${r.perusahaan_penerima ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(r.perusahaan_penerima)}</div>` : ''}
      ${r.no_hp_penerima ? `<div style="font-size: 0.72rem; margin-top: 2px; display: flex; align-items: center; gap: 4px;"><span style="color: #38bdf8; font-family: monospace;">📞 ${escapeHtml(r.no_hp_penerima)}</span> ${waLink}</div>` : ''}
    `;

    // Destination location display (Gateway & Outlet Tujuan)
    const tujuanDisplay = `
      <div class="loc-route-container">
        <div class="loc-row">
          <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">GW:</span>
          <span class="badge-gw badge-gw-dest" title="Gateway Tujuan">${escapeHtml(r.gw_tujuan || '-')}</span>
        </div>
        <div class="loc-row">
          <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">OUTLET:</span>
          <span class="badge-outlet badge-outlet-dest" title="Outlet Tujuan">${escapeHtml(r.outlet_tujuan || '-')}</span>
        </div>
        ${r.outlet_akhir && r.outlet_akhir !== r.outlet_tujuan ? `
          <div class="loc-row" title="Outlet Akhir">
            <span style="font-size: 0.65rem; color: #a78bfa;">AKHIR:</span>
            <span style="font-size: 0.68rem; color: #c4b5fd; font-family: monospace;">${escapeHtml(r.outlet_akhir)}</span>
          </div>` : ''}
      </div>
    `;

    // Address
    const addressDisplay = r.alamat_penerima 
      ? `<div style="font-size: 0.75rem; color: #cbd5e1; max-width: 200px; word-break: break-word; line-height: 1.35;" title="${escapeHtml(r.alamat_penerima)}">${escapeHtml(r.alamat_penerima)}</div>` 
      : `<span style="font-size: 0.72rem; color: #64748b;">-</span>`;

    // Problem badge
    const isProblem = (r.is_problem === 'ya' || r.is_problem === '1');

    return `
      <tr>
        <!-- 1. NO -->
        <td style="padding: 10px 8px; text-align: center; color: #94a3b8; font-weight: 600;">${no}</td>
        
        <!-- 2. WAYBILL (AWB) WITH COPY BUTTON -->
        <td style="padding: 10px 10px;">
          <div class="gudang-awb-cell">
            <span class="gudang-awb-text" onclick="openPodTraceModal('${r.waybill}')" title="Klik untuk lacak alur scan POD">${r.waybill}</span>
            <button type="button" class="btn-copy-mini" onclick="copyAwbToClipboard('${r.waybill}', this, event)" title="Salin nomor AWB">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px; display: flex; gap: 6px;">
            <span style="font-family: monospace; font-weight: 600; color: #cbd5e1;">${Number(r.berat || 0).toFixed(1)} kg</span>
            <span style="color: #64748b;">•</span>
            <span style="color: #94a3b8;">${Number(r.volume || 0).toFixed(3)} m³</span>
          </div>
        </td>

        <!-- 3. NAMA BARANG -->
        <td style="padding: 10px 10px;">${goodsDisplay}</td>

        <!-- 4. PENGIRIM & TOKO -->
        <td style="padding: 10px 10px;">${senderDisplay}</td>

        <!-- 5. ASAL (GW & OUTLET PENGIRIM) -->
        <td style="padding: 10px 10px;">${asalDisplay}</td>

        <!-- 6. PENERIMA & HP -->
        <td style="padding: 10px 10px;">${receiverDisplay}</td>

        <!-- 7. TUJUAN (GW & OUTLET PENERIMA) -->
        <td style="padding: 10px 10px;">${tujuanDisplay}</td>

        <!-- 8. ALAMAT LENGKAP -->
        <td style="padding: 10px 10px;">${addressDisplay}</td>

        <!-- 9. GUDANG SAAT INI -->
        <td style="padding: 10px 10px;">
          <span style="font-weight: 700; color: #e2e8f0; font-size: 0.82rem;">${escapeHtml(r.holding_gw || '-')}</span>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(r.status_simpan || 'Di Gudang')}</div>
        </td>

        <!-- 10. DURASI SIMPAN -->
        <td style="padding: 10px 10px; text-align: center;">
          <span class="aging-pill ${agingClass}">
            ${durasi.toFixed(1)} Jam
          </span>
          <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 3px;">${escapeHtml(r.durasi_kategori || '')}</div>
        </td>

        <!-- 11. RUTE & JALUR -->
        <td style="padding: 10px 10px;">
          <div style="font-weight: 600; color: #f1f5f9; font-size: 0.78rem; line-height: 1.25;">
            ${escapeHtml(r.rute || (r.holding_gw + ' → ' + (r.gw_tujuan || '-')))}
          </div>
          <div style="margin-top: 3px;">
            <span style="padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 600; background: rgba(167, 139, 250, 0.15); color: #c084fc; border: 1px solid rgba(167, 139, 250, 0.3);">
              ${escapeHtml(r.tipe_jalur || 'Eksternal/Internal')}
            </span>
          </div>
        </td>

        <!-- 12. STATUS -->
        <td style="padding: 10px 10px; text-align: center;">
          ${isProblem ? `
            <span class="badge-problem-yes" title="${escapeHtml(r.status_penangguhan || 'Paket Bermasalah')}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Bermasalah
            </span>` : `
            <span class="badge-problem-no">Normal</span>`}
          ${r.status_penangguhan ? `<div style="font-size: 0.68rem; color: #f59e0b; margin-top: 3px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(r.status_penangguhan)}">${escapeHtml(r.status_penangguhan)}</div>` : ''}
        </td>

        <!-- 13. AKSI -->
        <td style="padding: 10px 10px; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 5px; align-items: center; min-width: 90px;">
            <button type="button" class="btn-track-pod" onclick="openPodTraceModal('${r.waybill}')" title="Lacak riwayat 18 scan POD real-time">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Lacak
            </button>
            <div style="display: flex; gap: 4px; width: 100%;">
              <button type="button" class="btn-print-mini" onclick="openPrintAwbFromGudang('${r.waybill}')" title="Cetak ulang label thermal">
                🖨️ Cetak
              </button>
              ${!hasGoods ? `
                <button type="button" class="btn-enrich-mini" onclick="enrichSingleGudangWaybill('${r.waybill}', this)" title="Ambil live nama barang & customer">
                  ⚡ Enrich
                </button>` : ''}
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;
}

// 6. CLIPBOARD COPY FUNCTIONS WITH VISUAL FEEDBACK & TOAST
function copyAwbToClipboard(awb, btnElement, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!awb) return;

  const rawAwb = String(awb).trim();

  const doCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(rawAwb);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = rawAwb;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) return Promise.resolve();
        return Promise.reject(new Error('execCommand failed'));
      } catch (err) {
        document.body.removeChild(textarea);
        return Promise.reject(err);
      }
    }
  };

  doCopy()
    .then(() => {
      if (btnElement) {
        const origContent = btnElement.innerHTML;
        btnElement.classList.add('copied');
        btnElement.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span style="font-size:0.68rem;font-weight:700;margin-left:3px;">Disalin!</span>
        `;
        setTimeout(() => {
          btnElement.classList.remove('copied');
          btnElement.innerHTML = origContent;
        }, 1800);
      }
      showGudangToast(`✔ No. AWB <b>${rawAwb}</b> berhasil disalin ke clipboard!`);
      if (typeof window.showAppAlert === 'function') {
        window.showAppAlert(`✔ No. AWB ${rawAwb} disalin ke clipboard!`);
      }
    })
    .catch((err) => {
      console.warn('Clipboard copy error, fallback:', err);
      prompt('Salin nomor AWB (Ctrl + C):', rawAwb);
    });
}

function copyModalAwbToClipboard(btnElement) {
  const awb = gudangState.activeTraceWaybill || document.getElementById('modalPodWaybillTitle')?.textContent?.trim();
  if (awb && awb !== '-') {
    copyAwbToClipboard(awb, btnElement);
  }
}

function showGudangToast(msg) {
  const existing = document.getElementById('gudangToastNotification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'gudangToastNotification';
  toast.className = 'gudang-toast';
  toast.innerHTML = `
    <div style="width: 22px; height: 22px; border-radius: 50%; background: rgba(34, 197, 94, 0.2); display: flex; align-items: center; justify-content: center; color: #4ade80; flex-shrink: 0;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <span>${msg}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// 7. PAGINATION CONTROLS
function updateGudangPagination(p = {}) {
  gudangState.totalRows = p.totalRows || 0;
  gudangState.totalPages = p.totalPages || 1;
  const activeLimit = p.limit || p.pageSize || gudangState.limit;
  gudangState.limit = activeLimit;

  // Keep select dropdown in perfect sync
  const selPageSize = document.getElementById('gudangPageSize');
  if (selPageSize && selPageSize.value !== String(activeLimit)) {
    selPageSize.value = String(activeLimit);
  }

  const info = document.getElementById('gudangPaginationInfo');
  if (info) {
    const from = (gudangState.page - 1) * activeLimit + 1;
    const to = Math.min(gudangState.page * activeLimit, gudangState.totalRows);
    const countDisplay = (gudangState.totalRows >= 1001) 
      ? '1.000+ (Dibatasi untuk kecepatan)' 
      : `${gudangState.totalRows.toLocaleString('id-ID')}`;
    info.textContent = `Menampilkan ${gudangState.totalRows > 0 ? from.toLocaleString('id-ID') : 0} - ${to.toLocaleString('id-ID')} dari ${countDisplay} waybill`;
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
  const parsed = parseInt(size, 10) || 50;
  gudangState.limit = parsed;
  gudangState.page = 1;
  const selPageSize = document.getElementById('gudangPageSize');
  if (selPageSize && selPageSize.value !== String(parsed)) {
    selPageSize.value = String(parsed);
  }
  fetchGudangInventory();
}

// 8. LIVE AUTO-SEARCH & FILTER (INSTANT SEARCH TANPA PERLU TEKAN TOMBOL CARI)
function onGudangSearchInput(instant = false) {
  clearTimeout(gudangSearchDebounceTimer);
  if (instant) {
    applyGudangAutoSearch();
  } else {
    gudangSearchDebounceTimer = setTimeout(() => {
      applyGudangAutoSearch();
    }, 600);
  }
}

function applyGudangAutoSearch() {
  const selPageSize = document.getElementById('gudangPageSize');
  if (selPageSize && selPageSize.value) {
    gudangState.limit = parseInt(selPageSize.value, 10) || gudangState.limit || 50;
  }
  gudangState.search = document.getElementById('gudangSearchInput')?.value.trim() || '';
  gudangState.holdingGw = document.getElementById('gudangFilterHoldingGw')?.value || 'ALL';
  gudangState.destGw = document.getElementById('gudangFilterDestGw')?.value || 'ALL';
  gudangState.tipeJalur = document.getElementById('gudangFilterTipeJalur')?.value || 'ALL';
  gudangState.aging = document.getElementById('gudangFilterAging')?.value || 'ALL';
  gudangState.enrichStatus = document.getElementById('gudangFilterEnrich')?.value || 'all';
  gudangState.operationalStatus = document.getElementById('gudangFilterOperationalStatus')?.value || 'active';

  gudangState.col_waybill = document.getElementById('colSearchWaybill')?.value.trim() || '';
  gudangState.col_nama_barang = document.getElementById('colSearchNamaBarang')?.value.trim() || '';
  gudangState.col_pengirim = document.getElementById('colSearchPengirim')?.value.trim() || '';
  gudangState.col_asal = document.getElementById('colSearchAsal')?.value.trim() || '';
  gudangState.col_penerima = document.getElementById('colSearchPenerima')?.value.trim() || '';
  gudangState.col_tujuan = document.getElementById('colSearchTujuan')?.value.trim() || '';
  gudangState.col_alamat = document.getElementById('colSearchAlamat')?.value.trim() || '';
  gudangState.col_holding_gw = document.getElementById('colSearchHoldingGw')?.value.trim() || '';
  gudangState.col_durasi_min = document.getElementById('colSearchDurasiMin')?.value.trim() || '';
  gudangState.col_durasi_max = document.getElementById('colSearchDurasiMax')?.value.trim() || '';
  gudangState.col_rute = document.getElementById('colSearchRute')?.value.trim() || '';

  const statusVal = document.getElementById('colSearchStatus')?.value;
  gudangState.col_status = (statusVal && statusVal !== 'ALL') ? statusVal : 'ALL';
  gudangState.is_problem = (statusVal && statusVal !== 'ALL') ? statusVal : '';

  gudangState.page = 1;
  fetchGudangInventory();
}

function applyColumnFilters() {
  applyGudangAutoSearch();
}

function handleColumnSearch(event) {
  onGudangSearchInput(event?.key === 'Enter');
}

function handleGudangFilterSubmit(e) {
  if (e) e.preventDefault();
  applyGudangAutoSearch();
}

function clearAllColumnFilters() {
  const ids = [
    'colSearchWaybill', 'colSearchNamaBarang', 'colSearchPengirim',
    'colSearchAsal', 'colSearchPenerima', 'colSearchTujuan',
    'colSearchAlamat', 'colSearchHoldingGw', 'colSearchDurasiMin',
    'colSearchDurasiMax', 'colSearchRute'
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
  gudangState.col_asal = '';
  gudangState.col_penerima = '';
  gudangState.col_tujuan = '';
  gudangState.col_alamat = '';
  gudangState.col_holding_gw = '';
  gudangState.col_rute = '';
  gudangState.col_durasi_min = '';
  gudangState.col_durasi_max = '';
  gudangState.col_status = 'ALL';
  gudangState.is_problem = '';

  gudangState.page = 1;
  fetchGudangInventory();
}

function resetGudangFilter() {
  const form = document.getElementById('gudangFilterForm');
  if (form) form.reset();
  const searchInput = document.getElementById('gudangSearchInput');
  if (searchInput) searchInput.value = '';

  gudangState.search = '';
  gudangState.holdingGw = 'ALL';
  gudangState.destGw = 'ALL';
  gudangState.tipeJalur = 'ALL';
  gudangState.aging = 'ALL';
  gudangState.enrichStatus = 'all';
  gudangState.operationalStatus = 'active';

  const opEl = document.getElementById('gudangFilterOperationalStatus');
  if (opEl) opEl.value = 'active';

  clearAllColumnFilters();
}

// 9. OPEN POD TRACE MODAL (100% PERSIS SCREENSHOT USER!)
async function openPodTraceModal(waybillNo) {
  gudangState.activeTraceWaybill = waybillNo;
  const modal = document.getElementById('modalPodTraceGudang');
  const title = document.getElementById('modalPodWaybillTitle');
  const dynText = document.getElementById('podDynamicRouteText');
  const planText = document.getElementById('podPlannedRouteText');
  const actText = document.getElementById('podActualRouteText');
  const retText = document.getElementById('podReturnRouteText');
  const tbody = document.getElementById('tbodyPodScans');
  const abnCont = document.getElementById('podAbnormalContainer');

  if (modal) modal.style.display = 'flex';
  if (title) title.textContent = waybillNo;

  if (dynText) dynText.textContent = 'Memuat rute...';
  if (planText) planText.textContent = 'Memuat rute...';
  if (actText) actText.textContent = 'Memuat rute...';
  if (retText) retText.textContent = 'Memuat rute...';
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 35px; color: #94a3b8;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div class="spinner-small" style="width: 20px; height: 20px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <span>Menghubungkan ke API J&amp;T Cargo Operating Platform...</span>
          </div>
        </td>
      </tr>
    `;
  }
  if (abnCont) abnCont.innerHTML = '<span style="color: #94a3b8;">Memeriksa catatan...</span>';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/gudang-rute/pod-trace/${encodeURIComponent(waybillNo)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat jejak POD');
    }

    const traceData = json.data || json;
    gudangState.activeTraceData = traceData;
    renderPodTraceModal(traceData);
  } catch (err) {
    console.error('openPodTraceModal error:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: #f87171;">
            Gagal memuat jejak POD: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

function renderPodTraceModal(d = {}) {
  const dynText = document.getElementById('podDynamicRouteText');
  const planText = document.getElementById('podPlannedRouteText');
  const actText = document.getElementById('podActualRouteText');
  const retText = document.getElementById('podReturnRouteText');
  const tbody = document.getElementById('tbodyPodScans');
  const abnCont = document.getElementById('podAbnormalContainer');

  if (dynText) dynText.textContent = d.routes?.dynamicRoute || '-';
  if (planText) planText.textContent = d.routes?.plannedRoute || '-';
  if (actText) actText.textContent = d.routes?.actualRoute || '-';
  if (retText) retText.textContent = d.routes?.returnRoute || '-';

  if (tbody) {
    if (d.tokenExpired) {
      const loc = d.localInfo || {};
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="padding: 24px 20px; text-align: center; background: rgba(239, 68, 68, 0.08); border-bottom: 1px solid rgba(239, 68, 68, 0.25);">
            <div style="max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div style="font-size: 2.2rem;">⚠️</div>
              <div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #f87171;">Token Sesi JFS Kedaluwarsa (HTTP 401)</div>
                <p style="margin: 6px 0 0; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                  Sesi login ke gateway J&amp;T Cargo telah kedaluwarsa dari pusat (<em>"页面长时间未操作，请重新登录系统"</em>).<br/>
                  Silakan masukkan <strong>authtoken</strong> terbaru dari web JFS agar riwayat 18-step scan POD langsung tampil kembali!
                </p>
              </div>
              <button type="button" class="btn btn-primary" onclick="promptUpdateJfsToken()" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 8px 20px; border-radius: 8px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: #fff; cursor: pointer; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45); font-size: 0.88rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>🔑 Masukkan Token JFS Baru</span>
              </button>
            </div>
          </td>
        </tr>
        ${loc.waybill ? `
        <tr style="background: rgba(15, 23, 42, 0.7);">
          <td colspan="8" style="padding: 16px 20px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>📦 Data Status Terakhir Dari Database Lokal</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.82rem;">
              <div><strong style="color: #94a3b8;">Posisi Gudang:</strong> <span style="color: #f8fafc;">${escapeHtml(loc.holding_gw || '-')}</span></div>
              <div><strong style="color: #94a3b8;">Status Simpan:</strong> <span style="color: #34d399;">${escapeHtml(loc.status_simpan || '-')}</span></div>
              <div><strong style="color: #94a3b8;">Rute:</strong> <span style="color: #f8fafc;">${escapeHtml(loc.rute || '-')}</span></div>
              <div><strong style="color: #94a3b8;">Nama Barang:</strong> <span style="color: #fbbf24;">${escapeHtml(loc.nama_barang || '(Belum ter-enrich)')}</span></div>
              <div><strong style="color: #94a3b8;">Pengirim:</strong> <span style="color: #cbd5e1;">${escapeHtml(loc.pengirim || '-')}</span></div>
              <div><strong style="color: #94a3b8;">Penerima:</strong> <span style="color: #cbd5e1;">${escapeHtml(loc.penerima || '-')}</span></div>
            </div>
          </td>
        </tr>
        ` : ''}
      `;
    } else if (!d.scans || d.scans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
            Tidak ada riwayat scan tercatat di sistem JFS untuk nomor resi ini.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = d.scans.map(s => `
        <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.12); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(56, 189, 248, 0.05)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 10px 8px; text-align: center; color: #94a3b8; font-weight: 600;">${s.no}</td>
          <td style="padding: 10px 10px; font-family: monospace; color: #f8fafc; font-size: 0.78rem;">${escapeHtml(s.scanTime || '-')}</td>
          <td style="padding: 10px 10px; font-family: monospace; color: #94a3b8; font-size: 0.78rem;">${escapeHtml(s.uploadTime || '-')}</td>
          <td style="padding: 10px 12px; font-weight: 700; color: #38bdf8;">${escapeHtml(s.scanType || '-')}</td>
          <td style="padding: 10px 8px; color: #cbd5e1;">${escapeHtml(s.scanDeviceType || s.scanCategory || '-')}</td>
          <td style="padding: 10px 14px; color: #f1f5f9; line-height: 1.45; word-break: break-word;">${escapeHtml(s.scanDesc || '-')}</td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #cbd5e1;">${s.weight !== undefined && s.weight !== null ? s.weight : '--'}</td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #cbd5e1;">${s.volumeWeight !== undefined && s.volumeWeight !== null ? s.volumeWeight : '--'}</td>
        </tr>
      `).join('');
    }
  }

  if (abnCont) {
    if (!d.abnormalScans || d.abnormalScans.length === 0) {
      abnCont.innerHTML = '<span style="color: #94a3b8;">Tidak ada catatan paket bermasalah aktif.</span>';
    } else {
      abnCont.innerHTML = d.abnormalScans.map(a => `
        <div style="padding: 8px 10px; margin-bottom: 6px; background: rgba(248, 113, 113, 0.1); border-left: 3px solid #f87171; border-radius: 4px;">
          <div style="font-weight: 700; color: #f87171;">${escapeHtml(a.abnormalType || 'Bermasalah')} &mdash; ${escapeHtml(a.regTime || '')}</div>
          <div style="color: #cbd5e1; margin-top: 3px;">${escapeHtml(a.abnormalReason || a.remark || '-')}</div>
          ${a.regDept ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Daftar di: ${escapeHtml(a.regDept)} oleh ${escapeHtml(a.regUser || '-')}</div>` : ''}
        </div>
      `).join('');
    }
  }
}

// Quick JFS Token Updater Prompt
async function promptUpdateJfsToken() {
  const input = prompt(
    'Token autentikasi JFS dari J&T Cargo sudah kedaluwarsa.\n\n' +
    'Silakan masukkan authtoken JFS yang baru:\n' +
    '(Buka web JFS di Chrome -> F12 -> Tab Network -> Cari request apa saja -> Copy nilai header "authtoken")',
    ''
  );
  if (!input || !input.trim()) return;

  const cleanToken = input.trim();
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/pto/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ authtoken: cleanToken })
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      alert('Gagal memperbarui token: ' + (json.error || 'Terjadi kesalahan'));
      return;
    }

    alert('✔ Token JFS berhasil diperbarui! Memuat ulang pelacakan POD...');
    if (gudangState.activeTraceWaybill) {
      openPodTraceModal(gudangState.activeTraceWaybill);
    }
  } catch (err) {
    alert('Error saat menyimpan token: ' + err.message);
  }
}

function closePodModal() {
  const modal = document.getElementById('modalPodTraceGudang');
  if (modal) modal.style.display = 'none';
  gudangState.activeTraceWaybill = null;
  gudangState.activeTraceData = null;
}

// 10. COPY POD TRACE TEXT FOR FEISHU / WA
function copyPodTraceText() {
  if (!gudangState.activeTraceData) return;
  const d = gudangState.activeTraceData;
  let text = `LACAK ALUR SCAN POD: ${d.waybillNo}\n`;
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
    showGudangToast('✔ Riwayat scan POD berhasil disalin ke clipboard!');
  }).catch(() => {
    alert('Gagal menyalin teks ke clipboard.');
  });
}

// 11. ENRICH ACTIONS (SINGLE & BATCH)
async function enrichSingleGudangWaybill(waybillNo, btnEl) {
  if (!waybillNo) return;
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = '⏳';
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ waybill: waybillNo, waybillNo: waybillNo })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || json.error || 'Gagal mengambil data dari JFS.');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = '⚡ Enrich';
      }
      return;
    }

    const goodsLabel = json.data?.goodsName ? (json.data.goodsName.slice(0, 32) + '...') : 'Rincian produk';
    showGudangToast(`✔ Resi <b>${waybillNo}</b> berhasil diperkaya (${goodsLabel})!`);
    fetchGudangInventory();
  } catch (err) {
    alert('Error enrich: ' + err.message);
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = '⚡ Enrich';
    }
  }
}

// MODAL CONTROL: BUKA / TUTUP PILIHAN ENRICH MASSAL
function openEnrichOptionsModal() {
  const modal = document.getElementById('modalEnrichOptions');
  if (modal) modal.style.display = 'flex';
}

function closeEnrichModal() {
  const modal = document.getElementById('modalEnrichOptions');
  if (modal) modal.style.display = 'none';
}

// EKSEKUSI ENRICH BERDASARKAN MODE YANG DIPILIH
async function startEnrichByMode(mode) {
  closeEnrichModal();

  let payload = {};
  if (mode === 'page') {
    const unenrichedBtns = document.querySelectorAll('button[onclick*="enrichSingleGudangWaybill"]');
    if (unenrichedBtns.length === 0) {
      alert('Semua waybill di halaman ini sudah memiliki rincian nama barang!');
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
    payload = { waybills, mode: 'page' };
  } else if (mode === '500') {
    payload = { limit: 500, mode: 'limit' };
  } else if (mode === '1000') {
    payload = { limit: 1000, mode: 'limit' };
  } else if (mode === 'all') {
    if (!confirm('Jalankan Auto-Enrich Latar Belakang untuk seluruh waybill yang belum terisi di database?\n\nSistem akan memproses terus ribuan data secara otomatis tanpa mengganggu pekerjaan lu. Lu bisa stop kapan saja.')) {
      return;
    }
    payload = { mode: 'all' };
  } else {
    payload = { limit: 100 };
  }

  showGudangProgress(true);
  const pTitle = document.getElementById('gudangProgressTitle');
  const pMsg = document.getElementById('gudangProgressMessage');
  if (pTitle) pTitle.textContent = 'Memulai Auto-Enrich JFS OMS...';
  if (pMsg) pMsg.textContent = 'Menghubungkan ke API Batch OMS...';

  // Toggle stop button
  const btnStop = document.getElementById('btnStopAutoEnrich');
  const btnOpen = document.getElementById('btnOpenEnrichModal');
  if (btnStop) btnStop.style.display = 'inline-flex';
  if (btnOpen) btnOpen.style.display = 'none';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/bulk-enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal memulai auto-enrich');
      showGudangProgress(false);
      if (btnStop) btnStop.style.display = 'none';
      if (btnOpen) btnOpen.style.display = 'inline-flex';
      return;
    }

    showGudangToast(`⚡ Auto-enrich dimulai untuk ${json.total?.toLocaleString('id-ID') || 0} waybill!`);
    startBulkEnrichPolling();
  } catch (err) {
    alert('Error: ' + err.message);
    showGudangProgress(false);
    if (btnStop) btnStop.style.display = 'none';
    if (btnOpen) btnOpen.style.display = 'inline-flex';
  }
}

// HENTIKAN PROSES AUTO-ENRICH (STOP BUTTON)
async function stopBulkEnrich() {
  const btnStop = document.getElementById('btnStopAutoEnrich');
  if (btnStop) {
    btnStop.disabled = true;
    btnStop.textContent = '⏳ Menghentikan...';
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/bulk-enrich-stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await res.json();
    showGudangToast(json.message || 'Auto-enrich dihentikan.');
    checkBulkEnrichStatus();
  } catch (err) {
    alert('Gagal menghentikan: ' + err.message);
  } finally {
    if (btnStop) {
      btnStop.disabled = false;
      btnStop.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg><span>⏹️ Hentikan Enrich</span>`;
      btnStop.style.display = 'none';
    }
    const btnOpen = document.getElementById('btnOpenEnrichModal');
    if (btnOpen) btnOpen.style.display = 'inline-flex';
  }
}

function startBulkEnrichPolling() {
  if (gudangState.bulkTimer) clearInterval(gudangState.bulkTimer);
  gudangState.bulkTimer = setInterval(checkBulkEnrichStatus, 1200);
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
    const pFill = document.getElementById('gudangProgressFill');
    const btnStop = document.getElementById('btnStopAutoEnrich');
    const btnOpen = document.getElementById('btnOpenEnrichModal');

    if (json.isBulkEnriching || json.isRunning) {
      showGudangProgress(true);
      if (btnStop) btnStop.style.display = 'inline-flex';
      if (btnOpen) btnOpen.style.display = 'none';

      const curr = json.progress?.current ?? json.progress?.processed ?? 0;
      const total = json.progress?.total || 0;
      const succ = json.progress?.successCount || 0;
      const pct = total > 0 ? Math.min(100, Math.round((curr / total) * 100)) : 0;

      if (pTitle) pTitle.textContent = `⚡ Auto-Enrich JFS OMS: ${curr.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')} waybill (${pct}%)`;
      if (pCount) pCount.textContent = `${succ.toLocaleString('id-ID')} berhasil`;
      if (pMsg) pMsg.textContent = json.progress?.message || 'Memperkaya data produk & pelanggan...';
      if (pFill) pFill.style.width = `${pct}%`;
    } else {
      if (gudangState.bulkTimer) {
        clearInterval(gudangState.bulkTimer);
        gudangState.bulkTimer = null;
      }
      showGudangProgress(false);
      if (btnStop) btnStop.style.display = 'none';
      if (btnOpen) btnOpen.style.display = 'inline-flex';

      if (json.progress?.status === 'success') {
        showGudangToast(`✔ ${json.progress.message || 'Auto-enrich selesai!'}`);
      }
      fetchGudangInventory();
    }
  } catch (err) {
    console.warn('checkBulkEnrichStatus error:', err);
  }
}

async function runInstantDbEnrich() {
  showGudangProgress(true);
  const pTitle = document.getElementById('gudangProgressTitle');
  const pMsg = document.getElementById('gudangProgressMessage');
  if (pTitle) pTitle.textContent = 'Sinkronisasi Basis Data Lokal...';
  if (pMsg) pMsg.textContent = 'Mencocokkan nomor resi dengan pesanan PTO & laporan stuck...';

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gudang-rute/sync-local-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json();
    showGudangProgress(false);

    if (!res.ok || !json.success) {
      alert(json.message || 'Gagal sinkronisasi data lokal.');
      return;
    }

    showGudangToast(`✔ Berhasil mencocokkan ${json.totalEnriched?.toLocaleString('id-ID') || 0} resi dari database lokal!`);
    fetchGudangInventory();
  } catch (err) {
    showGudangProgress(false);
    alert('Error sync DB lokal: ' + err.message);
  }
}

// 12. OPEN PRINT AWB FROM GUDANG ROW
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

// 13. EXPORT ENRICHED INVENTORY TO EXCEL (LENGKAP DENGAN ASAL & TUJUAN)
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
        col_waybill: gudangState.col_waybill,
        col_nama_barang: gudangState.col_nama_barang,
        col_pengirim: gudangState.col_pengirim,
        col_asal: gudangState.col_asal,
        col_penerima: gudangState.col_penerima,
        col_tujuan: gudangState.col_tujuan,
        col_alamat: gudangState.col_alamat,
        col_holding_gw: gudangState.col_holding_gw,
        col_rute: gudangState.col_rute,
        col_durasi_min: gudangState.col_durasi_min,
        col_durasi_max: gudangState.col_durasi_max,
        col_status: gudangState.col_status,
        operational_status: gudangState.operationalStatus || 'active',
        holding_gw: gudangState.holdingGw,
        gw_tujuan: gudangState.destGw,
        tipe_jalur: gudangState.tipeJalur,
        durasi_kategori: gudangState.aging,
        enrich_status: gudangState.enrichStatus,
        page: 1,
        limit: 10000
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
      'Gateway Asal (Pengirim)': r.gw_asal || '',
      'Outlet Asal (Pengirim)': r.outlet_asal || '',
      'Penerima': r.penerima || '',
      'Perusahaan Penerima': r.perusahaan_penerima || '',
      'No HP Penerima': r.no_hp_penerima || '',
      'Gateway Tujuan (Penerima)': r.gw_tujuan || '',
      'Outlet Tujuan (Penerima)': r.outlet_tujuan || '',
      'Outlet Akhir': r.outlet_akhir || '',
      'Alamat Lengkap Penerima': r.alamat_penerima || '',
      'Gudang Simpan (Holding GW)': r.holding_gw || '',
      'Status Simpan': r.status_simpan || '',
      'Durasi Simpan (Jam)': r.durasi_jam || 0,
      'Kategori Durasi': r.durasi_kategori || '',
      'Berat (kg)': r.berat || 0,
      'Volume (m3)': r.volume || 0,
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

// Global window exposure
window.loadGudangRuteDashboard = loadGudangRuteDashboard;
window.openQuickPasteModal = openQuickPasteModal;
window.closeQuickPasteModal = closeQuickPasteModal;
window.clearQuickPasteText = clearQuickPasteText;
window.onQuickPasteInput = onQuickPasteInput;
window.submitQuickPaste = submitQuickPaste;
window.importLatestGudangRuteFile = importLatestGudangRuteFile;
window.fetchGudangInventory = fetchGudangInventory;
window.handleGudangFilterSubmit = handleGudangFilterSubmit;
window.resetGudangFilter = resetGudangFilter;
window.navigateGudangPage = navigateGudangPage;
window.changeGudangPageSize = changeGudangPageSize;
window.copyAwbToClipboard = copyAwbToClipboard;
window.copyModalAwbToClipboard = copyModalAwbToClipboard;
window.showGudangToast = showGudangToast;
window.openPodTraceModal = openPodTraceModal;
window.closePodModal = closePodModal;
window.copyPodTraceText = copyPodTraceText;
window.enrichSingleGudangWaybill = enrichSingleGudangWaybill;
window.openPrintAwbFromGudang = openPrintAwbFromGudang;
window.exportGudangRuteExcel = exportGudangRuteExcel;
window.enrichCurrentPage = enrichCurrentPage;
window.promptBulkEnrich = promptBulkEnrich;
window.runInstantDbEnrich = runInstantDbEnrich;
window.onGudangSearchInput = onGudangSearchInput;
window.applyGudangAutoSearch = applyGudangAutoSearch;
window.handleColumnSearch = handleColumnSearch;
window.applyColumnFilters = applyColumnFilters;
window.clearAllColumnFilters = clearAllColumnFilters;
window.promptUpdateJfsToken = promptUpdateJfsToken;
window.openEnrichOptionsModal = openEnrichOptionsModal;
window.closeEnrichModal = closeEnrichModal;
window.startEnrichByMode = startEnrichByMode;
window.stopBulkEnrich = stopBulkEnrich;
window.toggleExistingListDropdown = toggleExistingListDropdown;
window.viewPastedInMainTable = viewPastedInMainTable;
window.resetQuickPasteToInput = resetQuickPasteToInput;
window.handleGudangDragOver = handleGudangDragOver;
window.handleGudangDragLeave = handleGudangDragLeave;
window.handleGudangFileDrop = handleGudangFileDrop;
window.handleGudangFileSelect = handleGudangFileSelect;
