/* ============================================================ */
/* JFS REALTIME INTEGRATION (API BRIDGE)                       */
/* ============================================================ */
let jfsStatusPollingTimer = null;
let jfsListenersInitialized = false;
let lastKnownSyncTime = null;

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

        // Auto-refresh tabel monitoring jika server baru saja menyelesaikan background sync
        if (lastKnownSyncTime && lastKnownSyncTime !== cfg.lastSyncTime) {
          console.log('🔄 [JFS Realtime] Terdeteksi sinkronisasi baru dari server, menyegarkan tabel monitoring...');
          if (typeof fetchMonitoring === 'function') fetchMonitoring();
          if (typeof fetchMonitoringHistory === 'function') fetchMonitoringHistory();
        }
        lastKnownSyncTime = cfg.lastSyncTime;
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

function escapeJfsHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

async function fetchJfsLogs() {
  const token = getToken();
  if (!token) return;

  const tbody = document.getElementById('jfsLogsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/jfs/logs?limit=15', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Gagal memuat riwayat log (Status ${res.status}). Silakan klik Segarkan.</td></tr>`;
      return;
    }
    const logs = await res.json();

    if (!Array.isArray(logs) || !logs.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada riwayat sinkronisasi tersimpan. Jalankan Sync JFS untuk mulai mencatat.</td></tr>`;
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
          <td class="text-xs text-muted" style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeJfsHtml(l.message || '')}">${escapeJfsHtml(l.message || '-')}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('fetchJfsLogs error:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Gagal memuat riwayat: ${escapeJfsHtml(err.message)}</td></tr>`;
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
      const errMsg = result.error || result.message || 'Sinkronisasi gagal';
      if (errMsg.toLowerCase().includes('sedang berjalan') || errMsg.toLowerCase().includes('in progress')) {
        if (resultBox) {
          resultBox.classList.remove('hidden', 'error');
          const badge = document.getElementById('jfsResultBadge');
          if (badge) {
            badge.className = 'sync-result-badge';
            badge.style.background = '#0284c7';
            badge.style.color = '#ffffff';
            badge.textContent = 'Sedang Berjalan';
          }
          const msg = document.getElementById('jfsResultMsg');
          if (msg) msg.textContent = 'Server background sedang aktif memproses sinkronisasi JFS. Data akan selesai dalam beberapa detik...';
        }

        let checkCount = 0;
        const checkTimer = setInterval(async () => {
          checkCount++;
          await fetchJfsConfigAndStatus();
          await fetchJfsLogs();
          if (typeof fetchMonitoring === 'function') await fetchMonitoring();
          const cfg = await fetch('/api/jfs/status', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null);
          if (cfg?.config?.lastSyncStatus === 'success' || checkCount >= 10) {
            clearInterval(checkTimer);
            if (resultBox && cfg?.config?.lastSyncStatus === 'success') {
              const badge = document.getElementById('jfsResultBadge');
              if (badge) {
                badge.className = 'sync-result-badge success';
                badge.style.background = '';
                badge.style.color = '';
                badge.textContent = 'Berhasil';
              }
              const msg = document.getElementById('jfsResultMsg');
              if (msg && cfg.config.lastSyncMessage) msg.textContent = cfg.config.lastSyncMessage;
            }
          }
        }, 3000);
        return;
      }
      throw new Error(errMsg);
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
          <span class="sync-stat-tag">📥 Baru Dimuat: <strong>${(result.importedCount || 0).toLocaleString('id-ID')}</strong></span>
          <span class="sync-stat-tag">⏱️ Diperbarui: <strong>${(result.updatedAgingCount || 0).toLocaleString('id-ID')}</strong></span>
          <span class="sync-stat-tag">🗂️ Diarsip: <strong>${(result.archivedCount || result.historyCount || 0).toLocaleString('id-ID')}</strong></span>
          <span class="sync-stat-tag">🗑️ Selesai/Keluar: <strong>${(result.deletedCount || 0).toLocaleString('id-ID')}</strong></span>
          <span class="sync-stat-tag">🔄 Total JFS: <strong>${(result.totalFetched || 0).toLocaleString('id-ID')}</strong></span>
        `;
      }
    }

    if (isQuickBtn) {
      alert(`✅ Sinkronisasi JFS Berhasil (${duration}s)!\n${(result.totalFetched || 0).toLocaleString('id-ID')} waybill JFS (${(result.importedCount || 0).toLocaleString('id-ID')} baru, ${(result.archivedCount || 0).toLocaleString('id-ID')} diarsip, ${(result.deletedCount || 0).toLocaleString('id-ID')} selesai/keluar).`);
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

  // Clear logs button (Hapus Riwayat)
  const clearLogsBtn = document.getElementById('btnClearJfsLogs');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', async () => {
      const confirmClear = confirm(
        'Hapus seluruh riwayat log sinkronisasi JFS?\n\n' +
        'Semua catatan histori sinkronisasi sebelumnya akan dibersihkan.'
      );
      if (!confirmClear) return;

      clearLogsBtn.disabled = true;
      try {
        const token = getToken();
        const res = await fetch('/api/jfs/logs', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showAppAlert('✅ Riwayat log sinkronisasi berhasil dibersihkan!');
          await fetchJfsLogs();
        } else {
          showAppAlert(data.error || 'Gagal membersihkan riwayat log', true);
        }
      } catch (err) {
        showAppAlert('Koneksi gagal: ' + err.message, true);
      } finally {
        clearLogsBtn.disabled = false;
      }
    });
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

  // Refresh Flow Summary Button
  const btnRefreshFlow = document.getElementById('btnRefreshFlowSummary');
  if (btnRefreshFlow) {
    btnRefreshFlow.addEventListener('click', () => {
      btnRefreshFlow.classList.add('is-spinning');
      fetchJfsFlowSummary().finally(() => {
        setTimeout(() => btnRefreshFlow.classList.remove('is-spinning'), 600);
      });
    });
  }

  // Copy Bookmarklet script button
  const copyBookmarkletBtn = document.getElementById('btnCopyBookmarkletCode');
  if (copyBookmarkletBtn) {
    copyBookmarkletBtn.addEventListener('click', () => {
      const code = `javascript:(function(){try{var isH=function(s){return typeof s==='string'&&/^[a-f0-9]{32}$/i.test(s.trim());};var mat=function(s){if(typeof s!=='string')return null;var m=s.match(/[a-f0-9]{32}/i);return m?m[0]:null;};var getT=function(){for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);var v=localStorage.getItem(k);if(isH(v))return v.trim();var m=mat(v);if(m&&(k.toLowerCase().includes('token')||k.toLowerCase().includes('auth')||k.toLowerCase().includes('user')||k.toLowerCase().includes('admin')))return m;}for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j);var sv=sessionStorage.getItem(sk);if(isH(sv))return sv.trim();var sm=mat(sv);if(sm&&(sk.toLowerCase().includes('token')||sk.toLowerCase().includes('auth')||sk.toLowerCase().includes('user')||sk.toLowerCase().includes('admin')))return sm;}var cm=document.cookie.match(/(?:token|auth|authtoken)=([a-f0-9]{32})/i)||document.cookie.match(/([a-f0-9]{32})/i);if(cm)return cm[1]||cm[0];for(var a=0;a<localStorage.length;a++){var lm=mat(localStorage.getItem(localStorage.key(a)));if(lm)return lm;}for(var b=0;b<sessionStorage.length;b++){var ssm=mat(sessionStorage.getItem(sessionStorage.key(b)));if(ssm)return ssm;}return null;};var t=getT();if(!t){t=prompt('Masukkan token JFS:');}if(!t){alert('Batal menyinkronkan token.');return;}t=t.trim();try{navigator.clipboard.writeText(t);}catch(_){}var appUrl='https://garapan-fifo-production.up.railway.app';if(window.location.origin.includes('localhost')||window.location.port==='3000'){appUrl='http://localhost:3000';}alert('✅ Token JFS Terdeteksi:\\n'+t+'\\n\\nTab Monitoring FIFO akan dibuka untuk update & sinkronisasi otomatis!');window.open(appUrl+'/#/advance?sync_jfs_token='+encodeURIComponent(t),'_blank');}catch(err){alert('Error: '+err.message);}})();`;
      navigator.clipboard.writeText(code);
      copyBookmarkletBtn.innerHTML = `<span>✓ Script Tersalin!</span>`;
      setTimeout(() => {
        copyBookmarkletBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Salin Script Bookmarklet</span>
        `;
      }, 2500);
    });
  }

  // Click triggers for 4 Flow Speedometer Cards
  const cardInbound = document.getElementById('flowCardInbound');
  const cardBacklog = document.getElementById('flowCardBacklog');
  const cardOutbound = document.getElementById('flowCardOutbound');
  const cardTransit = document.getElementById('flowCardTransit');
  const closeFlowBtn = document.getElementById('closeFlowDetailBtn');
  const closeFlowBottomBtn = document.getElementById('closeFlowDetailBottomBtn');

  if (cardInbound) cardInbound.addEventListener('click', () => openFlowDetailModal('inbound'));
  if (cardBacklog) cardBacklog.addEventListener('click', () => openFlowDetailModal('backlog'));
  if (cardOutbound) cardOutbound.addEventListener('click', () => openFlowDetailModal('outbound'));
  if (cardTransit) cardTransit.addEventListener('click', () => openFlowDetailModal('transit'));
  if (closeFlowBtn) closeFlowBtn.addEventListener('click', closeFlowDetailModal);
  if (closeFlowBottomBtn) closeFlowBottomBtn.addEventListener('click', closeFlowDetailModal);

  // Flow Modal Drilldown Controls
  const btnBackToTrend = document.getElementById('btnBackToFlowTrend');
  if (btnBackToTrend) {
    btnBackToTrend.addEventListener('click', () => {
      const trendView = document.getElementById('flowTrendView');
      const listView = document.getElementById('flowWaybillListView');
      if (trendView) trendView.classList.remove('hidden');
      if (listView) listView.classList.add('hidden');
    });
  }

  const btnFlowSearch = document.getElementById('btnFlowListSearch');
  const inputFlowSearch = document.getElementById('flowListSearchInput');
  if (btnFlowSearch && inputFlowSearch) {
    btnFlowSearch.addEventListener('click', () => {
      openFlowWaybillList(currentFlowDetailState.date, currentFlowDetailState.type, 1, inputFlowSearch.value.trim());
    });
    inputFlowSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        openFlowWaybillList(currentFlowDetailState.date, currentFlowDetailState.type, 1, inputFlowSearch.value.trim());
      }
    });
  }

  const btnFlowPrev = document.getElementById('btnFlowListPrev');
  if (btnFlowPrev) {
    btnFlowPrev.addEventListener('click', () => {
      if (currentFlowDetailState.page > 1) {
        openFlowWaybillList(currentFlowDetailState.date, currentFlowDetailState.type, currentFlowDetailState.page - 1, currentFlowDetailState.search);
      }
    });
  }

  const btnFlowNext = document.getElementById('btnFlowListNext');
  if (btnFlowNext) {
    btnFlowNext.addEventListener('click', () => {
      const totalPages = Math.ceil(currentFlowDetailState.total / currentFlowDetailState.size);
      if (currentFlowDetailState.page < totalPages) {
        openFlowWaybillList(currentFlowDetailState.date, currentFlowDetailState.type, currentFlowDetailState.page + 1, currentFlowDetailState.search);
      }
    });
  }

  // Event Delegation for AWB drilldown button and resi copy
  document.addEventListener('click', (e) => {
    const drillBtn = e.target.closest('.btn-flow-awb-drilldown');
    if (drillBtn) {
      e.preventDefault();
      e.stopPropagation();
      const date = drillBtn.dataset.date;
      const type = drillBtn.dataset.type || currentFlowDetailState.type || 'inbound';
      if (date) {
        openFlowWaybillList(date, type, 1, '');
      }
      return;
    }

    const copyWb = e.target.closest('.flow-wb-copyable');
    if (copyWb) {
      e.preventDefault();
      e.stopPropagation();
      const wb = copyWb.dataset.wb;
      if (wb) {
        navigator.clipboard.writeText(wb);
        showAppAlert(`📋 No. Resi ${wb} disalin ke clipboard!`);
      }
      return;
    }
  });

  // Check URL parameter for auto-sync token from Bookmarklet
  checkUrlForJfsToken();
  window.addEventListener('hashchange', checkUrlForJfsToken);

  // Periodic status poll & flow summary (every 30s for live data)
  if (!jfsStatusPollingTimer) {
    fetchJfsConfigAndStatus();
    fetchJfsFlowSummary();
    jfsStatusPollingTimer = setInterval(() => {
      fetchJfsConfigAndStatus();
      fetchJfsFlowSummary();
    }, 30 * 1000);
  }
}

let currentFlowSummaryData = null;
let currentFlowDetailState = {
  date: '',
  type: 'inbound',
  page: 1,
  size: 20,
  total: 0,
  search: '',
};

async function openFlowDetailModal(type) {
  const modal = document.getElementById('jfsFlowDetailModal');
  if (!modal) return;

  const trendView = document.getElementById('flowTrendView');
  const listView = document.getElementById('flowWaybillListView');
  if (trendView) trendView.classList.remove('hidden');
  if (listView) listView.classList.add('hidden');

  const eyebrow = document.getElementById('flowDetailEyebrow');
  const title = document.getElementById('flowDetailTitle');
  const subtitle = document.getElementById('flowDetailSubtitle');
  const metricAwb = document.getElementById('modalMetricAwb');
  const metricWeight = document.getElementById('modalMetricWeight');
  const metricPcs = document.getElementById('modalMetricPcs');
  const tbody = document.getElementById('modalFlowTrendTableBody');

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Memuat data rincian dari JFS Gateway...</td></tr>';
  }

  const s = currentFlowSummaryData || {};
  let awb = 0, pcs = 0, wt = 0;
  let label = '', sub = '', colorClass = '';

  if (type === 'inbound') {
    label = 'Bongkar (Tiba Hari Ini)';
    sub = 'Rincian seluruh armada & waybill yang tiba dan dibongkar di Gateway Jakarta hari ini.';
    if (eyebrow) eyebrow.textContent = 'INBOUND GATEWAY JAKARTA';
    awb = s.arrival_qty || 0;
    pcs = s.arrival_pcs || 0;
    wt = s.arrival_weight || 0;
    colorClass = 'text-cyan';
  } else if (type === 'backlog') {
    label = 'Antrean Belum Muat (Backlog)';
    sub = 'Waybill yang sudah tiba di Gateway namun belum dimuat ke armada tujuan.';
    if (eyebrow) eyebrow.textContent = 'BACKLOG STUCK GATEWAY';
    awb = s.arrival_no_send_qty || 0;
    pcs = s.arrival_no_send_pcs || 0;
    wt = s.arrival_no_send_weight || 0;
    colorClass = 'text-amber';
  } else if (type === 'outbound') {
    label = 'Muat Terkirim (Outbound)';
    sub = 'Rincian seluruh muatan dan waybill yang telah diberangkatkan dari Gateway Jakarta hari ini.';
    if (eyebrow) eyebrow.textContent = 'OUTBOUND GATEWAY JAKARTA';
    awb = s.send_qty || 0;
    pcs = s.send_pcs || 0;
    wt = s.send_weight || 0;
    colorClass = 'text-emerald';
  } else {
    label = 'Kiriman Dalam Perjalanan (In-Transit)';
    sub = 'Waybill kiriman yang sedang dalam perjalanan antar-hub / gateway.';
    if (eyebrow) eyebrow.textContent = 'IN-TRANSIT ARMADA';
    awb = s.send_no_arrival_qty || 0;
    pcs = s.send_no_arrival_pcs || 0;
    wt = s.send_no_arrival_weight || 0;
    colorClass = 'text-indigo';
  }

  if (title) title.textContent = label;
  if (subtitle) subtitle.textContent = sub;
  if (metricAwb) {
    metricAwb.textContent = awb.toLocaleString('id-ID') + ' AWB';
    metricAwb.className = colorClass;
  }
  if (metricWeight) metricWeight.textContent = `${((wt || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton`;
  if (metricPcs) metricPcs.textContent = `${(pcs || 0).toLocaleString('id-ID')} Koli`;

  try {
    const token = getToken();
    const res = await fetch('/api/jfs/flow-trend', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Gagal mengambil data tren');
    const data = await res.json();
    const records = data.records || [];

    if (!records.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Tidak ada data tren harian tersedia.</td></tr>';
      return;
    }

    const sorted = [...records].reverse();

    if (tbody) {
      tbody.innerHTML = sorted.map(r => {
        let rAwb = 0, rPcs = 0, rWt = 0;
        if (type === 'inbound') {
          rAwb = r.arrival_qty || 0;
          rPcs = r.arrival_pcs || 0;
          rWt = r.arrival_weight || 0;
        } else if (type === 'backlog') {
          rAwb = r.arrival_no_send_qty || 0;
          rPcs = r.arrival_no_send_pcs || 0;
          rWt = r.arrival_no_send_weight || 0;
        } else if (type === 'outbound') {
          rAwb = r.send_qty || 0;
          rPcs = r.send_pcs || 0;
          rWt = r.send_weight || 0;
        } else {
          rAwb = r.send_no_arrival_qty || 0;
          rPcs = r.send_no_arrival_pcs || 0;
          rWt = r.send_no_arrival_weight || 0;
        }

        const ton = ((rWt || 0) / 1000).toFixed(1);
        const dateCode = r.date_code || r.endDate || '-';
        const isToday = dateCode === s.date || r.endDate === s.date;

        return `
          <tr style="${isToday ? 'background: rgba(56, 189, 248, 0.08); font-weight: 700;' : ''}">
            <td style="padding: 8px 12px; color: ${isToday ? '#38bdf8' : '#e2e8f0'};">
              ${dateCode} ${isToday ? '<span class="flow-badge-alert" style="margin-left: 4px;">Hari Ini</span>' : ''}
            </td>
            <td style="padding: 6px 12px; text-align: right;">
              <button type="button" class="btn-flow-awb-drilldown" data-date="${dateCode}" data-type="${type}" title="Klik untuk rincian semua waybill pada ${dateCode}">
                <span class="drilldown-number">${(rAwb || 0).toLocaleString('id-ID')}</span>
                <svg class="drilldown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
            </td>
            <td style="padding: 8px 12px; text-align: right; color: #cbd5e1;">${(rPcs || 0).toLocaleString('id-ID')}</td>
            <td style="padding: 8px 12px; text-align: right; color: #38bdf8;">${ton} Ton</td>
            <td style="padding: 8px 12px; text-align: center;">
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(30, 41, 59, 0.8); color: #94a3b8;">
                ${awb > 0 && rAwb > 0 ? ((rAwb / awb) * 100).toFixed(0) + '%' : '-'}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('openFlowDetailModal error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Gagal memuat tren: ${err.message}</td></tr>`;
  }
}

async function openFlowWaybillList(date, type, page = 1, search = '') {
  currentFlowDetailState.date = date;
  currentFlowDetailState.type = type;
  currentFlowDetailState.page = page;
  currentFlowDetailState.search = search;

  const trendView = document.getElementById('flowTrendView');
  const listView = document.getElementById('flowWaybillListView');
  const dateBadge = document.getElementById('flowListDateBadge');
  const countBadge = document.getElementById('flowListCountBadge');
  const searchInput = document.getElementById('flowListSearchInput');
  const tbody = document.getElementById('modalFlowWaybillsTableBody');
  const summaryEl = document.getElementById('flowListPaginationSummary');
  const indicatorEl = document.getElementById('flowListPageIndicator');
  const prevBtn = document.getElementById('btnFlowListPrev');
  const nextBtn = document.getElementById('btnFlowListNext');

  if (trendView) trendView.classList.add('hidden');
  if (listView) listView.classList.remove('hidden');

  const typeLabels = {
    inbound: 'Bongkar Tiba',
    outbound: 'Muat Kirim',
    backlog: 'Belum Kirim',
    transit: 'Dalam Perjalanan',
  };

  const label = typeLabels[type] || 'Waybill';
  if (dateBadge) dateBadge.textContent = `${date} • ${label}`;
  if (countBadge) countBadge.textContent = 'Memuat...';
  if (searchInput && document.activeElement !== searchInput) searchInput.value = search;

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-6">Sedang mengambil rincian waybill realtime dari JFS Gateway...</td></tr>';
  }

  try {
    const token = getToken();
    const q = new URLSearchParams({
      date,
      type,
      page: String(page),
      size: String(currentFlowDetailState.size),
      search: search || '',
    });

    const res = await fetch(`/api/jfs/flow-detail?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records = data.records || [];
    const total = data.total || records.length;
    currentFlowDetailState.total = total;

    if (countBadge) {
      countBadge.textContent = `${total.toLocaleString('id-ID')} AWB`;
    }

    if (!records.length) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-6">Tidak ada waybill ditemukan ${search ? `untuk pencarian "${escapeJfsHtml(search)}"` : 'pada tanggal ini'}.</td></tr>`;
      }
      if (summaryEl) summaryEl.textContent = 'Menampilkan 0 data';
      if (indicatorEl) indicatorEl.textContent = 'Hal 1 dari 1';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const startIdx = (page - 1) * currentFlowDetailState.size + 1;
    const endIdx = Math.min(page * currentFlowDetailState.size, total);
    if (summaryEl) summaryEl.textContent = `Menampilkan ${startIdx}-${endIdx} dari ${total.toLocaleString('id-ID')} waybill`;
    const totalPages = Math.max(1, Math.ceil(total / currentFlowDetailState.size));
    if (indicatorEl) indicatorEl.textContent = `Hal ${page} dari ${totalPages}`;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;

    if (tbody) {
      tbody.innerHTML = records.map((r) => {
        const waybill = escapeJfsHtml(r.billcode || '-');
        const koli = escapeJfsHtml(r.package_number || '1');
        const berat = r.package_charge_weight ? `${Number(r.package_charge_weight).toFixed(1)} Kg` : '-';
        const asal = escapeJfsHtml(r.last_dept || r.arr_dept || '-');
        const tujuan = escapeJfsHtml(r.dispatch_network_name || r.send_dept || '-');
        const tTiba = escapeJfsHtml(r.arrive_tm || '-');
        const tKirim = escapeJfsHtml(r.send_tm || '-');
        const user = escapeJfsHtml(r.scanuser || '-');
        const dispatchCode = escapeJfsHtml(r.terminal_dispatch_code || '-');

        return `
          <tr>
            <td style="padding: 8px 12px; font-family: monospace; font-weight: 700; color: #38bdf8;">
              <span class="flow-wb-copyable" data-wb="${waybill}" title="Klik untuk salin resi" style="cursor: pointer; text-decoration: underline; text-underline-offset: 2px;">${waybill}</span>
            </td>
            <td style="padding: 8px 10px; text-align: center; color: #e2e8f0;">${koli}</td>
            <td style="padding: 8px 10px; text-align: right; color: #a5b4fc; font-weight: 600;">${berat}</td>
            <td style="padding: 8px 12px; color: #cbd5e1;">${asal}</td>
            <td style="padding: 8px 12px; color: #cbd5e1;">${tujuan}</td>
            <td style="padding: 8px 12px; color: #94a3b8; font-size: 0.75rem;">${tTiba}</td>
            <td style="padding: 8px 12px; color: #94a3b8; font-size: 0.75rem;">${tKirim}</td>
            <td style="padding: 8px 12px; color: #cbd5e1;">${user}</td>
            <td style="padding: 8px 12px; color: #94a3b8; font-size: 0.75rem;">${dispatchCode}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('openFlowWaybillList error:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-6">Gagal memuat rincian: ${escapeJfsHtml(err.message)}</td></tr>`;
    }
    if (countBadge) countBadge.textContent = 'Gagal memuat';
  }
}

function closeFlowDetailModal() {
  const modal = document.getElementById('jfsFlowDetailModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function checkUrlForJfsToken() {
  try {
    const url = new URL(window.location.href);
    let incomingToken = url.searchParams.get('sync_jfs_token') || url.searchParams.get('jfs_token');
    if (!incomingToken && window.location.hash.includes('sync_jfs_token=')) {
      const match = window.location.hash.match(/sync_jfs_token=([a-f0-9]{32})/i);
      if (match) incomingToken = match[1];
    }

    if (incomingToken && /^[a-f0-9]{32}$/i.test(incomingToken)) {
      console.log('Incoming JFS token detected from URL sync:', incomingToken);
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/jfs/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ authtoken: incomingToken })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('✅ Token JFS Berhasil Disinkronkan ke Monitoring FIFO!\nMenjalankan sinkronisasi data...');
          if (typeof executeJfsSync === 'function') {
            await executeJfsSync(true);
          }
        }
      }
      const cleanHash = window.location.hash.split('?')[0];
      window.history.replaceState({}, document.title, window.location.pathname + cleanHash);
    }
  } catch (e) {
    console.error('checkUrlForJfsToken error:', e);
  }
}

async function fetchJfsFlowSummary() {
  if (window.innerWidth <= 992) return;

  const token = getToken();
  if (!token) return;

  const flowStrip = document.getElementById('jfsFlowStrip');
  if (!flowStrip) return;

  try {
    const res = await fetch('/api/jfs/flow-summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.summary) return;

    const s = data.summary;
    currentFlowSummaryData = s;

    const arrQtyEl = document.getElementById('flowArrivalQty');
    const arrWtEl = document.getElementById('flowArrivalWeight');
    const bklgQtyEl = document.getElementById('flowBacklogQty');
    const bklgWtEl = document.getElementById('flowBacklogWeight');
    const bklgBadge = document.getElementById('flowBacklogBadge');
    const sendQtyEl = document.getElementById('flowSendQty');
    const sendWtEl = document.getElementById('flowSendWeight');
    const trnQtyEl = document.getElementById('flowTransitQty');
    const trnWtEl = document.getElementById('flowTransitWeight');
    const timeEl = document.getElementById('jfsFlowTime');

    if (arrQtyEl) arrQtyEl.textContent = (s.arrival_qty || 0).toLocaleString('id-ID');
    if (arrWtEl) arrWtEl.textContent = `${((s.arrival_weight || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton • ${(s.arrival_pcs || 0).toLocaleString('id-ID')} Koli`;

    if (bklgQtyEl) bklgQtyEl.textContent = (s.arrival_no_send_qty || 0).toLocaleString('id-ID');
    if (bklgWtEl) bklgWtEl.textContent = `${((s.arrival_no_send_weight || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton • ${(s.arrival_no_send_pcs || 0).toLocaleString('id-ID')} Koli`;

    if (bklgBadge) {
      if ((s.arrival_no_send_qty || 0) > 10000) {
        bklgBadge.className = 'flow-badge-alert alert-high';
        bklgBadge.textContent = 'Padat';
      } else {
        bklgBadge.className = 'flow-badge-alert alert-normal';
        bklgBadge.textContent = 'Lancar';
      }
    }

    if (sendQtyEl) sendQtyEl.textContent = (s.send_qty || 0).toLocaleString('id-ID');
    if (sendWtEl) sendWtEl.textContent = `${((s.send_weight || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton • ${(s.send_pcs || 0).toLocaleString('id-ID')} Koli`;

    if (trnQtyEl) trnQtyEl.textContent = (s.send_no_arrival_qty || 0).toLocaleString('id-ID');
    if (trnWtEl) trnWtEl.textContent = `${((s.send_no_arrival_weight || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton • ${(s.send_no_arrival_pcs || 0).toLocaleString('id-ID')} Koli`;

    if (timeEl) {
      const now = new Date();
      timeEl.textContent = `Live: ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (err) {
    console.error('fetchJfsFlowSummary error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJfsEventListeners);
} else {
  initJfsEventListeners();
}
