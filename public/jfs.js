/* ============================================================ */
/* JFS REALTIME INTEGRATION (API BRIDGE)                       */
/* ============================================================ */
let jfsStatusPollingTimer = null;
let jfsListenersInitialized = false;

async function fetchJfsConfigAndStatus() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch('/api/jfs/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.config) return;

    const cfg = data.config;

    // Update global status badge
    const badge = document.getElementById('jfsGlobalStatusBadge');
    const liveChip = document.getElementById('jfsLiveBadge');
    if (badge) {
      if (cfg.lastSyncStatus === 'success') {
        badge.className = 'jfs-status-pill connected';
        badge.textContent = '🟢 Terhubung & Siap Sync';
      } else if (cfg.lastSyncStatus === 'error') {
        badge.className = 'jfs-status-pill error';
        badge.textContent = '🔴 Gagal / Token Expired';
      } else {
        badge.className = 'jfs-status-pill idle';
        badge.textContent = '⚪ Siap Digunakan';
      }
    }

    if (liveChip) {
      if (cfg.lastSyncStatus === 'error') {
        liveChip.className = 'quick-status-chip error';
        liveChip.textContent = 'Cek Token';
      } else {
        liveChip.className = 'quick-status-chip live';
        liveChip.textContent = 'Live';
      }
    }

    // Update overview metrics
    const metricGw = document.getElementById('jfsMetricGateway');
    if (metricGw) metricGw.textContent = `${cfg.scanSiteCodeName || 'GW-Jakarta'} (${cfg.scanSiteCode || 'JKT99A'})`;

    const metricLast = document.getElementById('jfsMetricLastSync');
    if (metricLast) {
      if (cfg.lastSyncTime) {
        const d = new Date(cfg.lastSyncTime);
        metricLast.textContent = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('id-ID') + ')';
      } else {
        metricLast.textContent = 'Belum Pernah';
      }
    }

    const metricTotal = document.getElementById('jfsMetricTotalCount');
    if (metricTotal) metricTotal.textContent = `${(cfg.lastSyncCount || 0).toLocaleString('id-ID')} Waybill`;

    const metricWorker = document.getElementById('jfsMetricWorker');
    if (metricWorker) {
      metricWorker.textContent = cfg.autoSyncEnabled ? `Aktif (Tiap ${cfg.syncIntervalMinutes}m)` : 'Nonaktif (Manual)';
    }

    // Populate form inputs if user is not actively typing
    const inputToken = document.getElementById('jfsInputToken');
    const inputSiteCode = document.getElementById('jfsInputSiteCode');
    const inputSiteName = document.getElementById('jfsInputSiteName');
    const inputAutoSync = document.getElementById('jfsInputAutoSync');
    const inputInterval = document.getElementById('jfsInputInterval');

    if (inputToken && document.activeElement !== inputToken && cfg.authtoken) {
      inputToken.value = cfg.authtoken;
    }
    if (inputSiteCode && document.activeElement !== inputSiteCode && cfg.scanSiteCode) {
      inputSiteCode.value = cfg.scanSiteCode;
    }
    if (inputSiteName && document.activeElement !== inputSiteName && cfg.scanSiteCodeName) {
      inputSiteName.value = cfg.scanSiteCodeName;
    }
    if (inputAutoSync && document.activeElement !== inputAutoSync) {
      inputAutoSync.value = cfg.autoSyncEnabled ? 'true' : 'false';
    }
    if (inputInterval && document.activeElement !== inputInterval && cfg.syncIntervalMinutes) {
      inputInterval.value = String(cfg.syncIntervalMinutes);
    }
  } catch (err) {
    console.error('fetchJfsConfigAndStatus error:', err);
  }
}

async function fetchJfsLogs() {
  const token = getToken();
  if (!token) return;

  const tbody = document.getElementById('jfsLogsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/jfs/logs?limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const logs = await res.json();

    if (!Array.isArray(logs) || !logs.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada riwayat sinkronisasi.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const timeStr = l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-';
      const triggerBadge = l.trigger_type === 'auto'
        ? '<span class="badge-log-type auto">Auto Worker</span>'
        : '<span class="badge-log-type manual">Manual Klik</span>';
      const statusBadge = l.status === 'success'
        ? '<span class="badge-log-status success">Sukses</span>'
        : '<span class="badge-log-status error">Gagal</span>';

      return `
        <tr>
          <td>${timeStr}</td>
          <td>${triggerBadge}</td>
          <td>${statusBadge}</td>
          <td><strong>${(l.total_fetched || 0).toLocaleString('id-ID')}</strong></td>
          <td class="text-emerald font-semibold">${(l.imported_count || 0).toLocaleString('id-ID')}</td>
          <td class="text-indigo font-semibold">${(l.archived_count || 0).toLocaleString('id-ID')}</td>
          <td class="text-rose font-semibold">${(l.deleted_count || 0).toLocaleString('id-ID')}</td>
          <td class="text-xs text-muted" style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(l.message || '')}">${escapeHtml(l.message || '-')}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('fetchJfsLogs error:', err);
  }
}

async function handleSaveJfsConfig(e) {
  if (e) e.preventDefault();
  const token = getToken();
  if (!token) return;

  const authtoken = document.getElementById('jfsInputToken')?.value.trim();
  const scanSiteCode = document.getElementById('jfsInputSiteCode')?.value.trim();
  const scanSiteCodeName = document.getElementById('jfsInputSiteName')?.value.trim();
  const autoSyncEnabled = document.getElementById('jfsInputAutoSync')?.value === 'true';
  const syncIntervalMinutes = parseInt(document.getElementById('jfsInputInterval')?.value || '5', 10);

  if (!authtoken) {
    alert('Harap isi JFS Auth Token!');
    return;
  }

  const saveBtn = document.getElementById('btnSaveJfsConfig');
  const origHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>Menyimpan...</span>';
  }

  try {
    const res = await fetch('/api/jfs/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        authtoken,
        scanSiteCode,
        scanSiteCodeName,
        autoSyncEnabled,
        syncIntervalMinutes,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menyimpan pengaturan');
    }

    alert('✅ Pengaturan JFS berhasil disimpan dan background worker telah diperbarui!');
    await fetchJfsConfigAndStatus();
  } catch (err) {
    alert(`❌ ${err.message}`);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = origHtml;
    }
  }
}

async function handleTestJfsConnection() {
  const token = getToken();
  if (!token) return;

  const authtoken = document.getElementById('jfsInputToken')?.value.trim();
  const scanSiteCode = document.getElementById('jfsInputSiteCode')?.value.trim();

  const testBtn = document.getElementById('btnTestJfsConnection');
  const origHtml = testBtn ? testBtn.innerHTML : '';
  if (testBtn) {
    testBtn.disabled = true;
    testBtn.innerHTML = '<span>Menguji...</span>';
  }

  try {
    const res = await fetch('/api/jfs/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ authtoken, scanSiteCode }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Koneksi gagal atau token tidak valid');
    }

    alert(`✅ ${data.message}`);
    const badge = document.getElementById('jfsGlobalStatusBadge');
    if (badge) {
      badge.className = 'jfs-status-pill connected';
      badge.textContent = '🟢 Token Valid & Terhubung';
    }
  } catch (err) {
    alert(`❌ Gagal: ${err.message}`);
    const badge = document.getElementById('jfsGlobalStatusBadge');
    if (badge) {
      badge.className = 'jfs-status-pill error';
      badge.textContent = '🔴 Gagal / Token Expired';
    }
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.innerHTML = origHtml;
    }
  }
}

async function executeJfsSync(isQuickBtn = false) {
  const token = getToken();
  if (!token) {
    alert('Sesi login telah berakhir. Silakan login kembali.');
    return;
  }

  const bigBtn = document.getElementById('btnJfsTriggerSync');
  const quickBtn = document.getElementById('btnQuickSyncJfs');
  const iconBig = bigBtn?.querySelector('.btn-jfs-icon');
  const iconQuick = quickBtn?.querySelector('.jfs-spin-icon');
  const mainText = document.getElementById('btnJfsSyncTextMain');
  const subText = document.getElementById('btnJfsSyncTextSub');
  const resultBox = document.getElementById('jfsSyncResultBox');

  if (bigBtn) bigBtn.disabled = true;
  if (quickBtn) quickBtn.disabled = true;
  if (iconBig) iconBig.classList.add('is-spinning');
  if (iconQuick) iconQuick.classList.add('is-spinning');
  if (mainText) mainText.textContent = '⚡ Sedang Menarik Data JFS...';
  if (subText) subText.textContent = 'Mengambil inventaris realtime & mencocokkan database FIFO...';

  const startTime = Date.now();

  try {
    const res = await fetch('/api/jfs/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || 'Sinkronisasi gagal');
    }

    // Show success in result box
    if (resultBox) {
      resultBox.classList.remove('hidden', 'error');
      const badge = document.getElementById('jfsResultBadge');
      if (badge) {
        badge.className = 'sync-result-badge success';
        badge.textContent = 'Berhasil';
      }
      const time = document.getElementById('jfsResultTime');
      if (time) time.textContent = `${duration} detik`;
      const msg = document.getElementById('jfsResultMsg');
      if (msg) msg.textContent = result.message;

      const stats = document.getElementById('jfsResultStats');
      if (stats) {
        stats.innerHTML = `
          <span class="sync-stat-tag">📥 Dimuat: <strong>${result.importedCount || 0}</strong></span>
          <span class="sync-stat-tag">🗂️ Diarsip: <strong>${result.historyCount || 0}</strong></span>
          <span class="sync-stat-tag">🗑️ Dibersihkan: <strong>${result.deletedCount || 0}</strong></span>
          <span class="sync-stat-tag">🔄 Total Diambil: <strong>${result.totalFetched || 0}</strong></span>
        `;
      }
    }

    if (isQuickBtn) {
      alert(`✅ Sinkronisasi JFS Berhasil (${duration}s)!\n${result.totalFetched || 0} waybill ditarik (${result.importedCount || 0} aktif, ${result.historyCount || 0} masuk history).`);
    }

    // Refresh monitoring tables and KPI
    if (typeof fetchMonitoring === 'function') await fetchMonitoring();
    if (typeof fetchMonitoringHistory === 'function') await fetchMonitoringHistory();
    await fetchJfsConfigAndStatus();
    await fetchJfsLogs();
  } catch (err) {
    console.error('executeJfsSync error:', err);
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.classList.add('error');
      const badge = document.getElementById('jfsResultBadge');
      if (badge) {
        badge.className = 'sync-result-badge error';
        badge.textContent = 'Gagal';
      }
      const msg = document.getElementById('jfsResultMsg');
      if (msg) msg.textContent = err.message;
    }
    alert(`❌ Sinkronisasi Gagal: ${err.message}`);
  } finally {
    if (bigBtn) bigBtn.disabled = false;
    if (quickBtn) quickBtn.disabled = false;
    if (iconBig) iconBig.classList.remove('is-spinning');
    if (iconQuick) iconQuick.classList.remove('is-spinning');
    if (mainText) mainText.textContent = '⚡ Tarik & Sinkronkan Data JFS Sekarang';
    if (subText) subText.textContent = 'Langsung update tabel FIFO & kalkulasi KPI';
  }
}

function initJfsEventListeners() {
  if (jfsListenersInitialized) return;
  jfsListenersInitialized = true;

  // Big sync button in advance tab
  const bigSyncBtn = document.getElementById('btnJfsTriggerSync');
  if (bigSyncBtn) {
    bigSyncBtn.addEventListener('click', () => executeJfsSync(false));
  }

  // Quick sync button in monitoring toolbar
  const quickSyncBtn = document.getElementById('btnQuickSyncJfs');
  if (quickSyncBtn) {
    quickSyncBtn.addEventListener('click', () => executeJfsSync(true));
  }

  // Save config form
  const form = document.getElementById('jfsConfigForm');
  if (form) {
    form.addEventListener('submit', handleSaveJfsConfig);
  }

  // Test connection button
  const testBtn = document.getElementById('btnTestJfsConnection');
  if (testBtn) {
    testBtn.addEventListener('click', handleTestJfsConnection);
  }

  // Refresh logs button
  const refreshLogsBtn = document.getElementById('btnRefreshJfsLogs');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', fetchJfsLogs);
  }

  // Toggle token visibility
  const toggleVisibilityBtn = document.getElementById('btnToggleTokenVisibility');
  const tokenInput = document.getElementById('jfsInputToken');
  if (toggleVisibilityBtn && tokenInput) {
    toggleVisibilityBtn.addEventListener('click', () => {
      const isPassword = tokenInput.type === 'password';
      tokenInput.type = isPassword ? 'text' : 'password';
      toggleVisibilityBtn.textContent = isPassword ? 'Sembunyikan' : 'Lihat Token';
    });
  }

  // Copy token button
  const copyTokenBtn = document.getElementById('btnCopyJfsToken');
  if (copyTokenBtn && tokenInput) {
    copyTokenBtn.addEventListener('click', () => {
      if (tokenInput.value) {
        navigator.clipboard.writeText(tokenInput.value);
        copyTokenBtn.title = 'Tersalin!';
        setTimeout(() => { copyTokenBtn.title = 'Salin Token'; }, 2000);
      }
    });
  }

  // Periodic status poll (every 60s)
  if (!jfsStatusPollingTimer) {
    fetchJfsConfigAndStatus();
    jfsStatusPollingTimer = setInterval(() => {
      fetchJfsConfigAndStatus();
    }, 60 * 1000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJfsEventListeners);
} else {
  initJfsEventListeners();
}
