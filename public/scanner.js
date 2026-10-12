// ========================================================
// MODUL SCANNER PDA & HARDWARE BARCODE SCANNER
// ========================================================
let audioCtx = null;
let scannerSoundMuted = localStorage.getItem('scanner_sound_muted') === 'true';
let scannerCurrentMode = 'check'; // 'check' | 'update'
let scannerBatchUpdatedCount = 0;
let scannerRecentScans = [];
let scannerUnregisteredScans = [];
let cameraStream = null;
let cameraDetectActive = false;
let lastCameraScannedCode = '';
let lastCameraScanTime = 0;

// Audio Synthesizer Engine (Zero-Latency Web Audio API)
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playScannerSound(type = 'success') {
  if (scannerSoundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Nada Tinggi (880Hz -> 1100Hz): Scan Sukses / FIFO Aman
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.09);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'warning') {
      // Nada Dua Tingkat (587Hz -> 784Hz): FIFO Waspada / Overdue
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(784, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'error') {
      // Buzzer Nada Rendah (220Hz -> 175Hz): Waybill Tidak Ditemukan / Gagal
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(175, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    }
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
}

// Haptic Vibration Engine
function triggerHaptic(type = 'success') {
  if (!navigator.vibrate) return;
  try {
    if (type === 'success') {
      navigator.vibrate(80);
    } else if (type === 'warning') {
      navigator.vibrate([100, 50, 100]);
    } else if (type === 'error') {
      // Getar 2x tegas untuk resi tidak ditemukan
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {}
}

// DOM References Scanner
const scannerModal = document.getElementById('scannerModal');
const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
const openScannerBtn = document.getElementById('openScannerBtn');
const openScannerBtnQuick = document.getElementById('openScannerBtnQuick');
const navScanner = document.getElementById('navScanner');
const scannerSoundToggleBtn = document.getElementById('scannerSoundToggleBtn');
const scannerCameraToggleBtn = document.getElementById('scannerCameraToggleBtn');
const modeCheckBtn = document.getElementById('modeCheckBtn');
const modeUpdateBtn = document.getElementById('modeUpdateBtn');
const scannerUpdateConfigBar = document.getElementById('scannerUpdateConfigBar');
const scannerActionSelect = document.getElementById('scannerActionSelect');
const scannerActionChipsBar = document.getElementById('scannerActionChipsBar');
const scannerManualActionWrap = document.getElementById('scannerManualActionWrap');
const scannerManualActionInput = document.getElementById('scannerManualActionInput');
const scannerBatchCount = document.getElementById('scannerBatchCount');
const scannerBarcodeForm = document.getElementById('scannerBarcodeForm');
const scannerBarcodeInput = document.getElementById('scannerBarcodeInput');
const scannerClearInputBtn = document.getElementById('scannerClearInputBtn');
const scannerIdleState = document.getElementById('scannerIdleState');
const scannerDynamicCard = document.getElementById('scannerDynamicCard');
const scannerRecentList = document.getElementById('scannerRecentList');
const recentScanCount = document.getElementById('recentScanCount');
const toggleUnknownDrawerBtn = document.getElementById('toggleUnknownDrawerBtn');
const unknownScansDrawer = document.getElementById('unknownScansDrawer');
const closeUnknownDrawerBtn = document.getElementById('closeUnknownDrawerBtn');
const unknownScansList = document.getElementById('unknownScansList');
const unknownScansCounter = document.getElementById('unknownScansCounter');
const copyUnknownScansBtn = document.getElementById('copyUnknownScansBtn');
const clearUnknownScansBtn = document.getElementById('clearUnknownScansBtn');
const scannerCameraArea = document.getElementById('scannerCameraArea');
const scannerVideoElement = document.getElementById('scannerVideoElement');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const scannerGuideToggleBtn = document.getElementById('scannerGuideToggleBtn');
const scannerGuideDrawer = document.getElementById('scannerGuideDrawer');
const closeScannerGuideBtn = document.getElementById('closeScannerGuideBtn');
const gotItGuideBtn = document.getElementById('gotItGuideBtn');

// Modal Input Cepat DOM
const scannerQuickAddModal = document.getElementById('scannerQuickAddModal');
const closeQuickAddModalBtn = document.getElementById('closeQuickAddModalBtn');
const cancelQuickAddBtn = document.getElementById('cancelQuickAddBtn');
const scannerQuickAddForm = document.getElementById('scannerQuickAddForm');
const quickAddWaybill = document.getElementById('quickAddWaybill');
const quickAddTanggal = document.getElementById('quickAddTanggal');
const quickAddOutlet = document.getElementById('quickAddOutlet');
const quickAddTlc = document.getElementById('quickAddTlc');
const quickAddNamaBarang = document.getElementById('quickAddNamaBarang');
const quickAddAksi = document.getElementById('quickAddAksi');

// Buka & Tutup Modal Scanner
function focusScannerInput() {
  if (scannerBarcodeInput && scannerModal && !scannerModal.classList.contains('hidden')) {
    scannerBarcodeInput.focus();
  }
}

function openScannerModal() {
  if (!scannerModal) return;
  getAudioContext(); // Inisialisasi AudioContext pada interaksi user
  scannerModal.classList.remove('hidden');
  scannerModal.setAttribute('aria-hidden', 'false');
  updateSoundToggleButton();
  focusScannerInput();
  setTimeout(focusScannerInput, 80);
  setTimeout(focusScannerInput, 250);
}

function closeScannerModal() {
  if (!scannerModal) return;
  stopCameraScanner();
  scannerModal.classList.add('hidden');
  scannerModal.setAttribute('aria-hidden', 'true');
  if (unknownScansDrawer) unknownScansDrawer.classList.add('hidden');
  if (scannerGuideDrawer) scannerGuideDrawer.classList.add('hidden');
}

// Buka & Tutup Modal Input Cepat
function openQuickAddModal(waybill) {
  if (!scannerQuickAddModal) return;
  if (quickAddWaybill) quickAddWaybill.value = waybill || '';
  if (quickAddTanggal) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    quickAddTanggal.value = `${yyyy}-${mm}-${dd}`;
  }
  if (quickAddOutlet) quickAddOutlet.value = '';
  if (quickAddTlc) {
    const firstTlc = (currentAvailableTlcs && currentAvailableTlcs.length > 0)
      ? (currentAvailableTlcs[0].code || currentAvailableTlcs[0])
      : '-';
    quickAddTlc.value = firstTlc || '-';
  }
  if (quickAddNamaBarang) quickAddNamaBarang.value = '-';
  if (quickAddAksi) quickAddAksi.value = 'Dalam Gudang';

  scannerQuickAddModal.classList.remove('hidden');
  scannerQuickAddModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => quickAddOutlet && quickAddOutlet.focus(), 100);
}

function closeQuickAddModal() {
  if (!scannerQuickAddModal) return;
  scannerQuickAddModal.classList.add('hidden');
  scannerQuickAddModal.setAttribute('aria-hidden', 'true');
  if (scannerBarcodeInput) scannerBarcodeInput.focus();
}

// Toggle Sound Audio Mute
function updateSoundToggleButton() {
  if (!scannerSoundToggleBtn) return;
  const onIcon = scannerSoundToggleBtn.querySelector('.sound-icon-on');
  const offIcon = scannerSoundToggleBtn.querySelector('.sound-icon-off');
  if (onIcon) onIcon.classList.toggle('hidden', scannerSoundMuted);
  if (offIcon) offIcon.classList.toggle('hidden', !scannerSoundMuted);
  scannerSoundToggleBtn.classList.toggle('active', !scannerSoundMuted);
}

if (scannerSoundToggleBtn) {
  scannerSoundToggleBtn.addEventListener('click', () => {
    scannerSoundMuted = !scannerSoundMuted;
    localStorage.setItem('scanner_sound_muted', String(scannerSoundMuted));
    updateSoundToggleButton();
    if (!scannerSoundMuted) {
      playScannerSound('success');
    }
  });
}

// Switch Mode Scanner (Mode 1 vs Mode 2)
function setScannerMode(mode) {
  scannerCurrentMode = mode;
  if (modeCheckBtn) modeCheckBtn.classList.toggle('active', mode === 'check');
  if (modeUpdateBtn) modeUpdateBtn.classList.toggle('active', mode === 'update');
  if (scannerUpdateConfigBar) scannerUpdateConfigBar.classList.toggle('hidden', mode !== 'update');
  if (scannerBarcodeInput) {
    scannerBarcodeInput.placeholder = mode === 'check'
      ? 'Tembak laser PDA untuk cek status FIFO...'
      : 'Tembak laser PDA untuk update aksi otomatis...';
    scannerBarcodeInput.focus();
  }
}

if (modeCheckBtn) modeCheckBtn.addEventListener('click', () => setScannerMode('check'));
if (modeUpdateBtn) modeUpdateBtn.addEventListener('click', () => setScannerMode('update'));

// Ganti Aksi Mode 2 via Chips Touch
function setScannerMode2Action(actionVal) {
  if (scannerActionSelect) {
    scannerActionSelect.value = actionVal;
  }
  const chips = document.querySelectorAll('#scannerActionChipsBar .action-chip-pill');
  chips.forEach((chip) => {
    const isTarget = chip.dataset.actionVal === actionVal;
    chip.classList.toggle('active', isTarget);
    chip.setAttribute('aria-checked', isTarget ? 'true' : 'false');
  });

  if (actionVal === 'manual') {
    if (scannerManualActionWrap) scannerManualActionWrap.classList.remove('hidden');
    if (scannerManualActionInput) {
      scannerManualActionInput.classList.remove('hidden');
      scannerManualActionInput.focus();
    }
  } else {
    if (scannerManualActionWrap) scannerManualActionWrap.classList.add('hidden');
    if (scannerManualActionInput) scannerManualActionInput.classList.add('hidden');
    setTimeout(focusScannerInput, 60);
  }
}

if (scannerActionChipsBar) {
  scannerActionChipsBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.action-chip-pill');
    if (chip && chip.dataset.actionVal) {
      e.preventDefault();
      setScannerMode2Action(chip.dataset.actionVal);
      triggerHaptic('light');
    }
  });
}

if (scannerManualActionInput) {
  scannerManualActionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(focusScannerInput, 50);
    }
  });
}

// Handler Pemrosesan Barcode / Waybill
async function handleScannedWaybill(rawCode) {
  let cleanCode = String(rawCode || '').trim().replace(/[\r\n\t]/g, '');
  if (!cleanCode) return;

  // Bersihkan input teks segera agar siap scan berikutnya dan tidak double-submit
  if (scannerBarcodeInput) {
    scannerBarcodeInput.value = '';
  }
  if (scannerClearInputBtn) {
    scannerClearInputBtn.classList.add('hidden');
  }

  const user = getCurrentUser();
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Cari di data monitoring lokal
  const upperCode = cleanCode.toUpperCase();
  let item = (monitoringData || []).find((entry) => String(entry.waybill || '').trim().toUpperCase() === upperCode);

  // Jika tidak ditemukan di memori lokal, coba fetch ulang dari server (siapa tahu baru diinput di device lain)
  if (!item) {
    try {
      const resp = await fetch('/api/monitoring', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (resp.ok) {
        const freshData = await resp.json();
        monitoringData = freshData;
        item = freshData.find((entry) => String(entry.waybill || '').trim().toUpperCase() === upperCode);
      }
    } catch (e) {}
  }

  if (scannerIdleState) scannerIdleState.classList.add('hidden');
  if (scannerDynamicCard) scannerDynamicCard.classList.remove('hidden');

  // ==========================================
  // KASUS 1: WAYBILL DITEMUKAN DALAM SISTEM
  // ==========================================
  if (item) {
    // Hitung Umur Hari FIFO
    let ageDays = 0;
    if (item.tanggal) {
      const itemDate = new Date(item.tanggal);
      if (!isNaN(itemDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        itemDate.setHours(0, 0, 0, 0);
        ageDays = Math.max(0, Math.round((today - itemDate) / (1000 * 60 * 60 * 24)));
      }
    }

    // Tentukan Klasifikasi FIFO Badge
    const sudahUpdate = isSudahUpdate(item);
    let fifoBadgeClass = 'fifo-badge-safe';
    let fifoBorderClass = 'border-safe';
    let fifoLabel = 'FIFO Aman (< 48 Jam)';
    let chipDotClass = 'dot-safe';

    if (sudahUpdate) {
      fifoBadgeClass = 'fifo-badge-updated';
      fifoBorderClass = 'border-updated';
      fifoLabel = 'Sudah Diupdate';
      chipDotClass = 'dot-updated';
    } else if (matchesStuckFilter(item, '36-48')) {
      fifoBadgeClass = 'fifo-badge-warning';
      fifoBorderClass = 'border-warning';
      fifoLabel = 'FIFO Perhatian (36-48 Jam)';
      chipDotClass = 'dot-warning';
    } else if (ageDays === 2 || matchesStuckFilter(item, '48-60')) {
      fifoBadgeClass = 'fifo-badge-warning';
      fifoBorderClass = 'border-warning';
      fifoLabel = 'FIFO Waspada (48-60 Jam)';
      chipDotClass = 'dot-warning';
    } else if (ageDays === 3 || matchesStuckFilter(item, '60-72') || matchesStuckFilter(item, '48-72')) {
      fifoBadgeClass = 'fifo-badge-alert';
      fifoBorderClass = 'border-alert';
      fifoLabel = 'FIFO Peringatan (60-72 Jam)';
      chipDotClass = 'dot-alert';
    } else if (ageDays >= 4 || matchesStuckFilter(item, '72-up')) {
      fifoBadgeClass = 'fifo-badge-danger';
      fifoBorderClass = 'border-danger';
      fifoLabel = 'FIFO Overdue (72 Jam UP)';
      chipDotClass = 'dot-danger';
    }

    // --- MODE 1: CEK STATUS FIFO ---
    if (scannerCurrentMode === 'check') {
      if (ageDays >= 3 && !sudahUpdate) {
        playScannerSound('warning');
        triggerHaptic('warning');
      } else {
        playScannerSound('success');
        triggerHaptic('success');
      }

      renderFoundCard(item, ageDays, fifoBadgeClass, fifoBorderClass, fifoLabel, null);
      addRecentScan(item.waybill, chipDotClass, fifoLabel, `${ageDays} Hari`, timeString);
    }
    // --- MODE 2: SCAN & UPDATE AKSI OTOMATIS ---
    else if (scannerCurrentMode === 'update') {
      let targetAksi = scannerActionSelect ? scannerActionSelect.value : 'Sudah Scan Kirim';
      if (targetAksi === 'manual') {
        targetAksi = scannerManualActionInput ? scannerManualActionInput.value.trim() : '';
        if (!targetAksi) {
          if (scannerManualActionInput) scannerManualActionInput.focus();
          playScannerSound('error');
          triggerHaptic('error');
          alert('Ketik aksi manual terlebih dahulu pada Mode 2!');
          return;
        }
      }

      try {
        const response = await fetch('/api/monitoring/bulk-update', {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ waybills: [item.waybill], aksi: targetAksi }),
        });

        if (response.ok) {
          // Update data lokal
          item.aksi = targetAksi;
          item.status = 'Sudah Diupdate';
          scannerBatchUpdatedCount += 1;
          if (scannerBatchCount) scannerBatchCount.textContent = scannerBatchUpdatedCount;

          playScannerSound('success');
          triggerHaptic('success');

          const updateSuccessMsg = `✓ Berhasil diupdate ke "${targetAksi}"`;
          renderFoundCard(item, ageDays, 'fifo-badge-updated', 'border-updated', 'Sudah Diupdate', updateSuccessMsg);
          addRecentScan(item.waybill, 'dot-updated', `Update: ${targetAksi}`, `${ageDays} Hari`, timeString);

          // Refresh tabel utama dan kartu statistik di latar belakang
          if (typeof applyFilter === 'function') applyFilter();
          else if (typeof renderTable === 'function') renderTable(monitoringData);
          if (typeof updateStats === 'function') updateStats(monitoringData);
        } else {
          if (response.status === 401) {
            logout();
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            return;
          }
          const errData = await response.json().catch(() => ({}));
          playScannerSound('error');
          triggerHaptic('error');
          alert('Gagal update aksi waybill: ' + (errData.error || 'Terjadi kesalahan server'));
        }
      } catch (updateErr) {
        console.error('Update waybill error:', updateErr);
        playScannerSound('error');
        triggerHaptic('error');
      }
    }
  }
  // ==========================================
  // KASUS 2: WAYBILL TIDAK DITEMUKAN / BELUM TERDAFTAR
  // ==========================================
  else {
    playScannerSound('error');
    triggerHaptic('error');

    // Catat ke memori sesi unregistered scans
    const alreadyLogged = scannerUnregisteredScans.some((u) => u.waybill === cleanCode);
    if (!alreadyLogged) {
      scannerUnregisteredScans.unshift({ waybill: cleanCode, time: timeString });
      updateUnknownScansDrawer();
    }

    renderNotFoundCard(cleanCode, timeString);
    addRecentScan(cleanCode, 'dot-unknown', 'TIDAK DITEMUKAN', '-', timeString);
  }

  // Bersihkan input dan siap tembakan berikutnya
  if (scannerBarcodeInput) {
    scannerBarcodeInput.value = '';
    scannerBarcodeInput.focus();
  }
  if (scannerClearInputBtn) scannerClearInputBtn.classList.add('hidden');
  if (scannerDynamicCard && !scannerDynamicCard.classList.contains('hidden')) {
    scannerDynamicCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Render Kartu Waybill Ditemukan
function renderFoundCard(item, ageDays, badgeClass, borderClass, badgeLabel, updateMessage = null) {
  if (!scannerDynamicCard) return;

  const updateBannerHtml = updateMessage
    ? `<div style="background: rgba(16, 185, 129, 0.2); border-bottom: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-weight: 700; font-size: 0.85rem; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeTlcHtml(updateMessage)}</span>
       </div>`
    : '';

  // Fitur Koreksi Aksi Cepat (PDA Optimized)
  let correctiveHtml = '';
  if (scannerCurrentMode === 'update' || updateMessage) {
    const currentAksi = String(item.aksi || '').trim();
    const correctiveOptions = [
      { key: 'Sudah Scan Kirim', label: '✓ Kirim' },
      { key: 'Penangguhan', label: '⏸ Penangguhan' },
      { key: 'Miss Route', label: '⚠️ Miss Route' },
      { key: 'Crosslabel', label: '🏷️ Crosslabel' }
    ];

    const buttonsHtml = correctiveOptions.map((opt) => {
      const isCurrent = currentAksi.toLowerCase() === opt.key.toLowerCase();
      if (isCurrent) {
        return `<span class="btn-correct-chip is-current">${opt.label} (Aktif)</span>`;
      }
      return `<button type="button" class="btn-correct-chip" data-action="correct-aksi" data-waybill="${escapeTlcHtml(item.waybill || '')}" data-target-aksi="${opt.key}">${opt.label}</button>`;
    }).join('');

    correctiveHtml = `
      <div class="scan-card-corrective-box">
        <div class="corrective-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Salah aksi? Ubah resi ini langsung:</span>
        </div>
        <div class="corrective-chips-grid">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  scannerDynamicCard.innerHTML = `
    <div class="scan-card-found ${borderClass}">
      ${updateBannerHtml}
      <div class="scan-card-header">
        <div class="scan-card-waybill-wrap">
          <span class="scan-card-waybill-label">Waybill:</span>
          <span class="scan-card-waybill">${escapeTlcHtml(item.waybill || '-')}</span>
        </div>
        <span class="fifo-badge ${badgeClass}">
          ● ${badgeLabel}
        </span>
      </div>
      <div class="scan-card-grid">
        <div class="scan-data-item">
          <span class="scan-data-label">Umur Paket</span>
          <span class="scan-data-value highlight-age">${ageDays} Hari</span>
        </div>
        <div class="scan-data-item">
          <span class="scan-data-label">Tanggal Masuk</span>
          <span class="scan-data-value">${formatDate(item.tanggal)}</span>
        </div>
        <div class="scan-data-item">
          <span class="scan-data-label">Outlet Tujuan</span>
          <span class="scan-data-value">${escapeTlcHtml(item.outlet || '-')}</span>
        </div>
        <div class="scan-data-item">
          <span class="scan-data-label">TLC / GW</span>
          <span class="scan-data-value">${escapeTlcHtml(item.tlc || '-')}</span>
        </div>
        <div class="scan-data-item">
          <span class="scan-data-label">Aksi Saat Ini</span>
          <span class="scan-data-value" style="color: #38bdf8;">${escapeTlcHtml(item.aksi || '-')}</span>
        </div>
        <div class="scan-data-item">
          <span class="scan-data-label">Status</span>
          <span class="scan-data-value">${escapeTlcHtml(item.status && String(item.status).toLowerCase() !== 'open' ? item.status : 'Pending')}</span>
        </div>
        <div class="scan-data-item" style="grid-column: 1 / -1;">
          <span class="scan-data-label">Nama Barang</span>
          <span class="scan-data-value">${escapeTlcHtml(item.nama_barang || '-')}</span>
        </div>
      </div>
      ${correctiveHtml}
    </div>
  `;
}

// Render Kartu Waybill Tidak Ditemukan (Merah Kontras)
function renderNotFoundCard(waybill, timeString) {
  if (!scannerDynamicCard) return;

  scannerDynamicCard.innerHTML = `
    <div class="scan-card-not-found">
      <div class="not-found-header">
        <div class="not-found-icon-pulse">!</div>
        <div class="not-found-title-wrap">
          <h4>DATA WAYBILL TIDAK DITEMUKAN</h4>
          <p>Paket ini belum tercatat dalam database Monitoring FIFO saat ini.</p>
        </div>
      </div>

      <div class="not-found-waybill-box">
        <span class="scanned-wb-code">${escapeTlcHtml(waybill)}</span>
        <span class="scanned-wb-time">Waktu Scan: ${timeString}</span>
      </div>

      <div class="not-found-actions">
        <button type="button" class="btn-quick-register" data-action="quick-register" data-waybill="${escapeTlcHtml(waybill)}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>+ Daftarkan Paket Ini Sekarang</span>
        </button>
        <button type="button" class="btn-note-unregistered" data-action="open-unknown-drawer">
          Lihat Riwayat Resi Nyasar (${scannerUnregisteredScans.length})
        </button>
      </div>
    </div>
  `;
}

// Tambahkan ke Riwayat Scan Sesi Ini
function addRecentScan(waybill, dotClass, label, age, time) {
  scannerRecentScans.unshift({ waybill, dotClass, label, age, time });
  if (scannerRecentScans.length > 15) scannerRecentScans.pop();

  if (recentScanCount) recentScanCount.textContent = `${scannerRecentScans.length} item`;
  if (!scannerRecentList) return;

  let html = '';
  scannerRecentScans.forEach((scan) => {
    html += `
      <div class="recent-scan-chip" data-action="scan-recent" data-waybill="${escapeTlcHtml(scan.waybill)}">
        <span class="chip-dot ${scan.dotClass}"></span>
        <span>${escapeTlcHtml(scan.waybill)}</span>
      </div>
    `;
  });
  scannerRecentList.innerHTML = html;
}

// Update Drawer Resi Tidak Ditemukan
function updateUnknownScansDrawer() {
  if (unknownScansCounter) unknownScansCounter.textContent = scannerUnregisteredScans.length;
  if (!unknownScansList) return;

  if (scannerUnregisteredScans.length === 0) {
    unknownScansList.innerHTML = '<div class="unknown-empty-state">Belum ada waybill tidak ditemukan.</div>';
    return;
  }

  let html = '';
  scannerUnregisteredScans.forEach((u) => {
    html += `
      <div class="unknown-item-row">
        <span class="unknown-item-wb">${escapeTlcHtml(u.waybill)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="unknown-item-time">${u.time}</span>
          <button type="button" class="small-btn primary-btn btn-quick-input-trigger" style="padding: 2px 8px; font-size: 0.7rem;" data-action="quick-register" data-waybill="${escapeTlcHtml(u.waybill)}">+ Input</button>
        </div>
      </div>
    `;
  });
  unknownScansList.innerHTML = html;
}

// Koreksi Cepat Aksi Waybill Terakhir Langsung dari Kartu Scan PDA
async function correctWaybillAksi(waybill, newAksi) {
  if (!waybill || !newAksi) return;

  const upperCode = String(waybill).trim().toUpperCase();
  const item = (monitoringData || []).find((entry) => String(entry.waybill || '').trim().toUpperCase() === upperCode);
  if (!item) return;

  try {
    const response = await fetch('/api/monitoring/bulk-update', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ waybills: [item.waybill], aksi: newAksi }),
    });

    if (response.ok) {
      item.aksi = newAksi;
      item.status = 'Sudah Diupdate';

      playScannerSound('success');
      triggerHaptic('success');

      // Hitung ulang umur hari untuk kartu
      let ageDays = 0;
      if (item.tanggal) {
        const itemDate = new Date(item.tanggal);
        if (!isNaN(itemDate.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          itemDate.setHours(0, 0, 0, 0);
          ageDays = Math.max(0, Math.round((today - itemDate) / (1000 * 60 * 60 * 24)));
        }
      }

      const now = new Date();
      const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const correctMsg = `✓ Aksi resi ${item.waybill} dikoreksi ke "${newAksi}"`;

      renderFoundCard(item, ageDays, 'fifo-badge-updated', 'border-updated', 'Sudah Diupdate', correctMsg);
      addRecentScan(item.waybill, 'dot-updated', `Koreksi: ${newAksi}`, `${ageDays} Hari`, timeString);

      // Refresh tabel utama dan kartu statistik di latar belakang
      if (typeof applyFilter === 'function') applyFilter();
      else if (typeof renderTable === 'function') renderTable(monitoringData);
      if (typeof updateStats === 'function') updateStats(monitoringData);

      // Kembalikan fokus ke scanner barcode input
      setTimeout(focusScannerInput, 100);
    } else {
      if (response.status === 401) {
        logout();
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        return;
      }
      const errData = await response.json().catch(() => ({}));
      playScannerSound('error');
      triggerHaptic('error');
      alert('Gagal koreksi aksi: ' + (errData.error || 'Terjadi kesalahan server'));
    }
  } catch (err) {
    console.error('Koreksi aksi error:', err);
    playScannerSound('error');
    triggerHaptic('error');
  }
}

// Event Delegation untuk Tombol Dinamis Scanner (Bebas Pelanggaran CSP)
if (scannerDynamicCard) {
  scannerDynamicCard.addEventListener('click', (e) => {
    const correctBtn = e.target.closest('[data-action="correct-aksi"]');
    if (correctBtn && correctBtn.dataset.waybill && correctBtn.dataset.targetAksi) {
      e.preventDefault();
      correctWaybillAksi(correctBtn.dataset.waybill, correctBtn.dataset.targetAksi);
      return;
    }
    const regBtn = e.target.closest('[data-action="quick-register"]');
    if (regBtn && regBtn.dataset.waybill) {
      e.preventDefault();
      openQuickAddModal(regBtn.dataset.waybill);
      return;
    }
    const noteBtn = e.target.closest('[data-action="open-unknown-drawer"]');
    if (noteBtn) {
      e.preventDefault();
      if (unknownScansDrawer) unknownScansDrawer.classList.remove('hidden');
      return;
    }
  });
}

if (scannerRecentList) {
  scannerRecentList.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-action="scan-recent"]');
    if (chip && chip.dataset.waybill) {
      e.preventDefault();
      handleScannedWaybill(chip.dataset.waybill);
    }
  });
}

if (unknownScansList) {
  unknownScansList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="quick-register"]');
    if (btn && btn.dataset.waybill) {
      e.preventDefault();
      openQuickAddModal(btn.dataset.waybill);
    }
  });
}

// Delegasi klik global pengaman agar tombol daftarkan paket & koreksi aksi selalu merespon dari elemen mana pun
document.addEventListener('click', (e) => {
  const correctBtn = e.target.closest('[data-action="correct-aksi"]');
  if (correctBtn && correctBtn.dataset.waybill && correctBtn.dataset.targetAksi) {
    e.preventDefault();
    correctWaybillAksi(correctBtn.dataset.waybill, correctBtn.dataset.targetAksi);
    return;
  }
  const regBtn = e.target.closest('[data-action="quick-register"]');
  if (regBtn && regBtn.dataset.waybill) {
    e.preventDefault();
    openQuickAddModal(regBtn.dataset.waybill);
  }
});

// ==============================================================
// HARDWARE PDA SCANNER WEDGE & AUTO-BURST DETECTION ENGINE
// ==============================================================
let barcodeBurstTimer = null;
let wedgeBuffer = '';
let lastKeypressTime = 0;
const WEDGE_MAX_CHAR_INTERVAL_MS = 250; // Toleransi jeda ketik hardware PDA lebih longgar (250ms)

// 1. Direct Listener pada Input Barcode (Sangat Akurat untuk PDA)
if (scannerBarcodeInput) {
  // A. Deteksi Input & Auto-Burst:
  // Ketika laser PDA menembak, karakter diketik secara cepat.
  // Jika dalam 160ms tidak ada ketikan baru (laser selesai nembak), proses otomatis tanpa perlu klik tombol / Enter!
  scannerBarcodeInput.addEventListener('input', () => {
    if (scannerClearInputBtn) {
      scannerClearInputBtn.classList.toggle('hidden', !scannerBarcodeInput.value.trim());
    }

    const currentVal = scannerBarcodeInput.value;

    // Jika mengandung newline / enter / tab dari laser
    if (currentVal.includes('\n') || currentVal.includes('\r') || currentVal.includes('\t')) {
      clearTimeout(barcodeBurstTimer);
      const clean = currentVal.replace(/[\r\n\t]/g, '').trim();
      if (clean) {
        handleScannedWaybill(clean);
      }
      return;
    }

    // Auto-burst trigger: jika panjang >= 5 digit resi, pasang timer cepat 160ms
    clearTimeout(barcodeBurstTimer);
    const trimmed = currentVal.trim();
    if (trimmed.length >= 5) {
      barcodeBurstTimer = setTimeout(() => {
        const finalVal = scannerBarcodeInput.value.replace(/[\r\n\t]/g, '').trim();
        if (finalVal.length >= 5) {
          handleScannedWaybill(finalVal);
        }
      }, 160);
    }
  });

  // B. Tangani penekanan Enter / Tab / Android Action Key langsung di Input
  scannerBarcodeInput.addEventListener('keydown', (e) => {
    const isEnterOrTab = (
      e.key === 'Enter' ||
      e.key === 'Tab' ||
      e.keyCode === 13 ||
      e.keyCode === 9 ||
      e.keyCode === 66 || // Android KeyEvent.KEYCODE_ENTER
      e.which === 13 ||
      e.which === 9
    );

    if (isEnterOrTab) {
      e.preventDefault();
      clearTimeout(barcodeBurstTimer);
      const val = scannerBarcodeInput.value.replace(/[\r\n\t]/g, '').trim();
      if (val) {
        handleScannedWaybill(val);
      }
    }
  });

  // C. Tangani Paste (jika PDA diset mode Clipboard Paste)
  scannerBarcodeInput.addEventListener('paste', () => {
    clearTimeout(barcodeBurstTimer);
    setTimeout(() => {
      const val = scannerBarcodeInput.value.replace(/[\r\n\t]/g, '').trim();
      if (val.length >= 3) {
        handleScannedWaybill(val);
      }
    }, 40);
  });
}

// 2. Barcode Form Submit Listener (Tombol "Proses" Manual)
if (scannerBarcodeForm) {
  scannerBarcodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(barcodeBurstTimer);
    if (!scannerBarcodeInput) return;
    const value = scannerBarcodeInput.value.trim();
    if (value) handleScannedWaybill(value);
  });
}

if (scannerClearInputBtn) {
  scannerClearInputBtn.addEventListener('click', () => {
    clearTimeout(barcodeBurstTimer);
    if (scannerBarcodeInput) {
      scannerBarcodeInput.value = '';
      scannerBarcodeInput.focus();
    }
    scannerClearInputBtn.classList.add('hidden');
  });
}

// 3. Global Hardware Wedge Scanner Listener (ketika modal tertutup atau input tidak sengaja kehilangan fokus)
let globalWedgeTimer = null;
window.addEventListener('keydown', (e) => {
  if (!e) return;

  // Jika belum login, abaikan
  if (loginView && !loginView.classList.contains('hidden')) return;

  // Jangan tangkap jika user sedang mengetik di input lain (seperti searchInput, login, filter)
  const activeEl = document.activeElement;
  const isOtherInput = activeEl && activeEl !== scannerBarcodeInput && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  if (isOtherInput) return;

  // Jika scannerBarcodeInput sedang aktif dan fokus, biarkan listener input di atas yang menangani
  if (activeEl === scannerBarcodeInput) return;

  const isEnterOrTab = (
    e.key === 'Enter' ||
    e.key === 'Tab' ||
    e.keyCode === 13 ||
    e.keyCode === 9 ||
    e.keyCode === 66 ||
    e.which === 13 ||
    e.which === 9
  );

  const currentTime = Date.now();
  const timeDiff = currentTime - lastKeypressTime;
  lastKeypressTime = currentTime;

  if (isEnterOrTab) {
    clearTimeout(globalWedgeTimer);
    if (wedgeBuffer && wedgeBuffer.length >= 3) {
      const scannedCode = wedgeBuffer.trim();
      wedgeBuffer = '';
      if (scannedCode) {
        e.preventDefault();
        if (scannerModal && scannerModal.classList.contains('hidden')) {
          openScannerModal();
        }
        handleScannedWaybill(scannedCode);
        return;
      }
    }
    wedgeBuffer = '';
    return;
  }

  // Karakter yang dapat dicetak (printable)
  if (typeof e.key === 'string' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (timeDiff <= WEDGE_MAX_CHAR_INTERVAL_MS || wedgeBuffer.length === 0) {
      wedgeBuffer += e.key;
    } else {
      wedgeBuffer = e.key;
    }

    // Auto-burst global jika laser PDA tidak mengirim tombol Enter (jeda 180ms)
    clearTimeout(globalWedgeTimer);
    if (wedgeBuffer.length >= 5) {
      globalWedgeTimer = setTimeout(() => {
        if (wedgeBuffer.length >= 5) {
          const scannedCode = wedgeBuffer.trim();
          wedgeBuffer = '';
          if (scannedCode) {
            if (scannerModal && scannerModal.classList.contains('hidden')) {
              openScannerModal();
            }
            handleScannedWaybill(scannedCode);
          }
        }
      }, 180);
    }
  }
});

// Drawer Toggle Handlers
if (toggleUnknownDrawerBtn) {
  toggleUnknownDrawerBtn.addEventListener('click', () => {
    if (unknownScansDrawer) unknownScansDrawer.classList.toggle('hidden');
  });
}
if (closeUnknownDrawerBtn) {
  closeUnknownDrawerBtn.addEventListener('click', () => {
    if (unknownScansDrawer) unknownScansDrawer.classList.add('hidden');
    focusScannerInput();
  });
}

// Panduan Setting PDA Drawer Toggle Handlers
if (scannerGuideToggleBtn) {
  scannerGuideToggleBtn.addEventListener('click', () => {
    if (scannerGuideDrawer) scannerGuideDrawer.classList.toggle('hidden');
  });
}
if (closeScannerGuideBtn) {
  closeScannerGuideBtn.addEventListener('click', () => {
    if (scannerGuideDrawer) scannerGuideDrawer.classList.add('hidden');
    focusScannerInput();
  });
}
if (gotItGuideBtn) {
  gotItGuideBtn.addEventListener('click', () => {
    if (scannerGuideDrawer) scannerGuideDrawer.classList.add('hidden');
    focusScannerInput();
  });
}
if (copyUnknownScansBtn) {
  copyUnknownScansBtn.addEventListener('click', () => {
    if (scannerUnregisteredScans.length === 0) return alert('Tidak ada nomor resi untuk disalin.');
    const textToCopy = scannerUnregisteredScans.map((u) => u.waybill).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert(`Berhasil menyalin ${scannerUnregisteredScans.length} nomor resi ke clipboard!`);
    }).catch(() => {
      alert('Gagal menyalin. Silakan salin manual.');
    });
  });
}
if (clearUnknownScansBtn) {
  clearUnknownScansBtn.addEventListener('click', () => {
    if (confirm('Bersihkan riwayat resi tidak terdaftar?')) {
      scannerUnregisteredScans = [];
      updateUnknownScansDrawer();
    }
  });
}

// Form Submit: Input Cepat Waybill ke Database
if (scannerQuickAddForm) {
  scannerQuickAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return logout();

    const payload = {
      waybill: quickAddWaybill ? quickAddWaybill.value.trim() : '',
      tanggal: quickAddTanggal ? quickAddTanggal.value.trim() : '',
      outlet: quickAddOutlet ? quickAddOutlet.value.trim() : '',
      tlc: quickAddTlc ? quickAddTlc.value.trim() : '-',
      nama_barang: quickAddNamaBarang ? quickAddNamaBarang.value.trim() : '-',
      aksi: quickAddAksi ? quickAddAksi.value.trim() : 'Dalam Gudang',
      status: 'Pending',
      stuck: '0',
    };

    if (!payload.waybill || !payload.tanggal || !payload.outlet) {
      return alert('Waybill, tanggal, dan outlet wajib diisi!');
    }

    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return alert('Sesi Anda telah berakhir. Silakan login kembali.');
        }
        return alert(resData.error || 'Gagal mendaftarkan data monitoring.');
      }

      // Hapus dari daftar resi unregistered jika sebelumnya tercatat
      scannerUnregisteredScans = scannerUnregisteredScans.filter((u) => u.waybill !== payload.waybill);
      updateUnknownScansDrawer();

      closeQuickAddModal();
      await fetchMonitoring();
      playScannerSound('success');
      triggerHaptic('success');

      // Langsung proses resi yang baru didaftarkan di scanner
      handleScannedWaybill(payload.waybill);
    } catch (err) {
      console.error('Submit quick add error:', err);
      alert('Terjadi kesalahan jaringan saat menyimpan data.');
    }
  });
}

// Modal Trigger Buttons
if (openScannerBtn) openScannerBtn.addEventListener('click', openScannerModal);
if (openScannerBtnQuick) openScannerBtnQuick.addEventListener('click', openScannerModal);
if (navScanner) navScanner.addEventListener('click', openScannerModal);
if (closeScannerModalBtn) closeScannerModalBtn.addEventListener('click', closeScannerModal);
if (closeQuickAddModalBtn) closeQuickAddModalBtn.addEventListener('click', closeQuickAddModal);
if (cancelQuickAddBtn) cancelQuickAddBtn.addEventListener('click', closeQuickAddModal);

// Tutup Scanner ketika klik overlay backdrop atau tekan ESC
if (scannerModal) {
  scannerModal.addEventListener('click', (e) => {
    if (e.target === scannerModal) {
      closeScannerModal();
      return;
    }
    const interactiveTag = e.target.closest('button, select, input, a, textarea');
    if (!interactiveTag) {
      focusScannerInput();
    }
  });
}

if (scannerActionSelect) {
  scannerActionSelect.addEventListener('change', () => {
    if (scannerActionSelect.value === 'manual') {
      if (scannerManualActionInput) {
        scannerManualActionInput.classList.remove('hidden');
        scannerManualActionInput.focus();
      }
    } else {
      if (scannerManualActionInput) {
        scannerManualActionInput.classList.add('hidden');
      }
      setTimeout(focusScannerInput, 60);
    }
  });
}
if (scannerQuickAddModal) {
  scannerQuickAddModal.addEventListener('click', (e) => {
    if (e.target === scannerQuickAddModal) closeQuickAddModal();
  });
}
window.addEventListener('keydown', (e) => {
  if (e && e.key === 'Escape') {
    if (scannerQuickAddModal && !scannerQuickAddModal.classList.contains('hidden')) {
      closeQuickAddModal();
    } else if (scannerModal && !scannerModal.classList.contains('hidden')) {
      closeScannerModal();
    }
  }
});

// ==========================================
// CAMERA SCANNER ALTERNATIVE (MOBILE / TABLET)
// ==========================================
async function startCameraScanner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Browser perangkat ini tidak mendukung akses kamera.');
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    if (scannerVideoElement) {
      scannerVideoElement.srcObject = cameraStream;
      await scannerVideoElement.play();
      cameraDetectActive = true;
      if (scannerCameraArea) scannerCameraArea.classList.remove('hidden');
      if (scannerCameraToggleBtn) scannerCameraToggleBtn.classList.add('active');
      initBarcodeDetection(scannerVideoElement);
    }
  } catch (err) {
    console.error('Camera access error:', err);
    alert('Gagal mengakses kamera: ' + (err.message || 'Izin kamera ditolak.'));
  }
}

function stopCameraScanner() {
  cameraDetectActive = false;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  if (scannerVideoElement) {
    scannerVideoElement.srcObject = null;
  }
  if (scannerCameraArea) scannerCameraArea.classList.add('hidden');
  if (scannerCameraToggleBtn) scannerCameraToggleBtn.classList.remove('active');
}

async function initBarcodeDetection(videoEl) {
  if (!window.BarcodeDetector) {
    console.warn('BarcodeDetector API tidak didukung langsung oleh browser ini.');
    alert('Browser perangkat ini belum mendukung fitur scan kamera otomatis (BarcodeDetector API). Gunakan tombol laser scanner PDA fisik atau ketik nomor resi di kolom input.');
    stopCameraScanner();
    return;
  }

  try {
    const detector = new window.BarcodeDetector({
      formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'upc_a'],
    });

    const scanFrame = async () => {
      if (!cameraDetectActive) return;
      try {
        if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
          const barcodes = await detector.detect(videoEl);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            const now = Date.now();
            if (raw && (raw !== lastCameraScannedCode || now - lastCameraScanTime > 2000)) {
              lastCameraScannedCode = raw;
              lastCameraScanTime = now;
              handleScannedWaybill(raw);
            }
          }
        }
      } catch (detErr) {}
      if (cameraDetectActive) {
        requestAnimationFrame(scanFrame);
      }
    };
    requestAnimationFrame(scanFrame);
  } catch (err) {
    console.error('BarcodeDetector initialization error:', err);
  }
}

if (scannerCameraToggleBtn) {
  scannerCameraToggleBtn.addEventListener('click', () => {
    if (cameraStream) {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  });
}
if (stopCameraBtn) stopCameraBtn.addEventListener('click', stopCameraScanner);

loadLogo();
loadBackground();

bootstrapAuth();
