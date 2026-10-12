function updateQuickChipsUI(selectedVal) {
  const chips = document.querySelectorAll('#modalQuickChips .quick-chip-btn');
  chips.forEach((chip) => {
    const action = chip.dataset.action;
    if (selectedVal && action === selectedVal) {
      chip.classList.add('active');
    } else if (action === 'manual' && selectedVal === 'manual') {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function openModal(mode = 'create', item = null) {
  if (!monitoringModal) return;

  editingWaybill = mode === 'edit' ? item?.waybill || null : null;
  editingArchiveWaybill = mode === 'archive-edit' ? item?.waybill || null : null;
  modalTitle.textContent = mode === 'edit' || mode === 'archive-edit' ? 'Update Data Monitoring' : 'Tambah Data Monitoring';

  monitoringForm.reset();
  document.getElementById('status').value = 'Pending';
  if (actionManual) actionManual.classList.add('hidden');
  const manualWrapper = document.getElementById('manualActionWrapper');
  if (manualWrapper) manualWrapper.classList.add('hidden');

  const contextCard = document.getElementById('modalWaybillContext');
  const waybillText = document.getElementById('modalWaybillText');
  const outletText = document.getElementById('modalOutletText');
  const dateText = document.getElementById('modalDateText');
  const stuckText = document.getElementById('modalStuckText');
  const barangText = document.getElementById('modalBarangText');
  const currentStatusBadge = document.getElementById('modalCurrentStatusBadge');
  const currentStatusText = document.getElementById('modalCurrentStatusText');

  if (item && (mode === 'edit' || mode === 'archive-edit')) {
    if (contextCard) contextCard.classList.remove('hidden');
    if (waybillText) waybillText.textContent = item.waybill || '-';
    const outletParts = [item.outlet, item.tlc].filter((v) => v && v !== '-');
    if (outletText) outletText.textContent = outletParts.length ? outletParts.join(' • ') : (item.outlet || '-');
    if (dateText) dateText.textContent = normalizeDateString(item.tanggal) || '-';
    if (stuckText) stuckText.textContent = item.stuck || '0';
    if (barangText) barangText.textContent = item.nama_barang || '-';

    const isUpdated = (item.aksi && item.aksi !== '-') || String(item.status || '').toLowerCase() === 'sudah diupdate' || String(item.status || '').toLowerCase() === 'sudah scan kirim';
    const currentStatusVal = isUpdated ? 'Sudah Diupdate' : (item.status || 'Pending');
    if (currentStatusText) currentStatusText.textContent = currentStatusVal;
    if (currentStatusBadge) {
      currentStatusBadge.className = `modern-status-badge ${isUpdated ? 'status-success' : 'status-pending'}`;
    }

    const savedAction = item.aksi === '-' ? '' : (item.aksi || '');
    const actionOptions = Array.from(actionSelect?.options || []).map((option) => option.value);
    if (actionSelect && actionOptions.includes(savedAction)) {
      actionSelect.value = savedAction;
    } else if (actionSelect) {
      actionSelect.value = savedAction ? 'manual' : '';
      if (actionManual) actionManual.value = savedAction;
    }
    const isManual = actionSelect?.value === 'manual';
    if (actionManual) actionManual.classList.toggle('hidden', !isManual);
    if (manualWrapper) manualWrapper.classList.toggle('hidden', !isManual);
    updateQuickChipsUI(actionSelect?.value);
    syncStatusWithAction();
  } else {
    if (contextCard) contextCard.classList.add('hidden');
    if (currentStatusText) currentStatusText.textContent = 'Data Baru';
    if (currentStatusBadge) currentStatusBadge.className = 'modern-status-badge status-pending';
    updateQuickChipsUI('');
    syncStatusWithAction();
  }

  monitoringModal.classList.remove('hidden');
  monitoringModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!monitoringModal) return;
  monitoringModal.classList.add('hidden');
  monitoringModal.setAttribute('aria-hidden', 'true');
  monitoringForm.reset();
  editingWaybill = null;
  editingArchiveWaybill = null;
  updateQuickChipsUI('');
  const manualWrapper = document.getElementById('manualActionWrapper');
  if (manualWrapper) manualWrapper.classList.add('hidden');
  if (actionManual) actionManual.classList.add('hidden');
}

function openRegisterModal() {
  if (!registerModal) return;
  registerForm.reset();
  registerMessage.textContent = '';
  registerMessage.classList.remove('error');
  registerModal.classList.remove('hidden');
  registerModal.setAttribute('aria-hidden', 'false');
}

function closeRegisterModal() {
  if (!registerModal) return;
  registerModal.classList.add('hidden');
  registerModal.setAttribute('aria-hidden', 'true');
  registerForm.reset();
  registerMessage.textContent = '';
  registerMessage.classList.remove('error');
}

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const normalized = normalizeDateString(dateValue);
  if (!normalized) return '-';
  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateForApi(dateValue) {
  if (dateValue === null || dateValue === undefined || dateValue === '') return '';
  const normalized = normalizeDateString(dateValue);
  if (!normalized) return '';
  return normalized;
}

function normalizeDateString(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const raw = String(value).trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (raw.includes('T') && raw.endsWith('Z')) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const datePart = raw.includes('T') ? raw.split('T')[0] : raw.split(' ')[0];
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const slashParts = datePart.split('/');
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    const [day, month, year] = slashParts;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    const year = fallback.getFullYear();
    const month = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

function syncStatusWithAction() {
  const statusInput = document.getElementById('status');
  const targetStatusBadge = document.getElementById('modalTargetStatusBadge');
  const targetStatusText = document.getElementById('modalTargetStatusText');
  if (!statusInput) return;

  const selectedAction = actionSelect?.value === 'manual'
    ? (actionManual?.value || '').trim()
    : (actionSelect?.value || '').trim();

  const hasAction = Boolean(selectedAction && selectedAction !== '-');
  statusInput.value = hasAction ? 'Sudah Diupdate' : 'Pending';

  if (targetStatusBadge && targetStatusText) {
    if (hasAction) {
      targetStatusBadge.className = 'modern-status-badge status-success';
      targetStatusText.textContent = 'Sudah Diupdate';
    } else {
      targetStatusBadge.className = 'modern-status-badge status-pending';
      targetStatusText.textContent = 'Pending';
    }
  }
}

function renderStatusOverview(data) {
  const statusChart = document.getElementById('statusChart');
  if (!statusChart) return;

  const counts = {
    Pending: 0,
    'Sudah Diupdate': 0,
  };

  data.forEach((item) => {
    if (isSudahUpdate(item)) {
      counts['Sudah Diupdate'] += 1;
    } else {
      counts.Pending += 1;
    }
  });

  const maxValue = Math.max(...Object.values(counts), 1);
  const total = data.length || 1;

  statusChart.innerHTML = Object.entries(counts)
    .map(([status, value]) => {
      const percentage = Math.round((value / total) * 100);
      const width = Math.max((value / maxValue) * 100, value > 0 ? 18 : 0);
      return `
        <div class="chart-row">
          <div class="chart-label"><span>${status}</span><strong>${value}</strong></div>
          <div class="chart-track">
            <div class="chart-bar ${status.toLowerCase()}" style="width: ${width}%"></div>
          </div>
          <span class="chart-percent">${percentage}%</span>
        </div>
      `;
    })
    .join('');
}

function renderTable(data) {
  if (!tbody) return;

  const user = getCurrentUser();
  const canMutate = hasPermission('edit_monitoring');

  const totalPages = Math.max(1, Math.ceil(data.length / monitoringPageSize));
  monitoringPage = Math.min(monitoringPage, totalPages);
  const pageStart = (monitoringPage - 1) * monitoringPageSize;
  const pageRows = data.slice(pageStart, pageStart + monitoringPageSize);
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Belum ada data monitoring.</td>
      </tr>
    `;
    renderMonitoringPagination(0, 1);
    return;
  }

  pageRows.forEach((item) => {
    const tr = document.createElement('tr');
    const updated = isSudahUpdate(item);
    tr.className = `${getUrgencyClass(item.stuck)}${updated ? ' is-updated' : ''}${selectedMonitoringWaybills.has(item.waybill) ? ' is-selected' : ''}`;

    let actionButtons = '<span class="read-only-label">Read only</span>';
    if (canMutate) {
      if (updated) {
        const canRestore = hasPermission('restore_updated');
        actionButtons = `
          <div class="action-group">
            <button type="button" class="table-btn edit-btn" data-action="edit" data-waybill="${item.waybill || ''}" title="Edit tindakan waybill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: -1px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>EDIT</span>
            </button>
            ${canRestore ? `
              <button type="button" class="table-btn restore-btn" data-action="restore-update" data-waybill="${item.waybill || ''}" title="Kembalikan waybill ke status Pending">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: -1px;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>RESTORE</span>
              </button>
            ` : ''}
          </div>
        `;
      } else {
        actionButtons = `
          <div class="action-group">
            <button type="button" class="table-btn update-btn" data-action="update" data-waybill="${item.waybill || ''}" title="Update tindakan waybill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: -1px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>UPDATE</span>
            </button>
          </div>
        `;
      }
    }

    const currentStatus = item.status && String(item.status).toLowerCase() !== 'open' ? item.status : 'Pending';
    const isUpdated = currentStatus === 'Sudah Diupdate';
    const statusDisplay = isUpdated && item.aksi && item.aksi !== '-' ? item.aksi : currentStatus;
    const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');

    tr.innerHTML = `
      <td class="col-check" data-label="Pilih"><input type="checkbox" class="monitoring-select-checkbox" data-waybill="${item.waybill || ''}" ${selectedMonitoringWaybills.has(item.waybill) ? 'checked' : ''} /></td>
      <td class="col-waybill" data-label="Waybill"><strong class="cell-value">${highlightSearch(item.waybill || '-')}</strong></td>
      <td class="col-tanggal" data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(item.tanggal))}</span></td>
      <td class="col-outlet" data-label="Outlet"><span class="cell-value">${highlightSearch(item.outlet || '-')}</span></td>
      <td class="col-stuck" data-label="Stuck"><span class="cell-value"><span class="badge badge-stuck">${highlightSearch(item.stuck || 0)}</span></span></td>
      <td class="col-tlc" data-label="TLC"><span class="cell-value">${highlightSearch(item.tlc || '-')}</span></td>
      <td class="col-status" data-label="Status"><span class="cell-value"><span class="status ${statusClass}" title="Status: ${escapeTlcHtml(currentStatus)}${item.aksi && item.aksi !== '-' ? ' (' + escapeTlcHtml(item.aksi) + ')' : ''}">${highlightSearch(statusDisplay)}</span></span></td>
      <td class="col-aksi" data-label="Aksi">${actionButtons}</td>
      <td class="col-barang" data-label="Nama Barang" title="${escapeTlcHtml(item.nama_barang || '')}"><span class="cell-value">${highlightSearch(item.nama_barang || '-')}</span></td>
      <td class="col-updated" data-label="Updated By"><span class="cell-value">${highlightSearch(item.updated_by || '-')}</span></td>
    `;
    tbody.appendChild(tr);
  });

  if (selectAllMonitoring) {
    const pageWaybills = pageRows.map((item) => item.waybill);
    selectAllMonitoring.checked = pageWaybills.length > 0 && pageWaybills.every((waybill) => selectedMonitoringWaybills.has(waybill));
  }
  updateSelectedMonitoringCount();
  renderMonitoringPagination(data.length, totalPages);
}

function highlightSearch(value, searchValue = searchInput?.value) {
  const text = String(value ?? '-');
  const escaped = text.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
  const keyword = String(searchValue || '').trim();
  if (!keyword) return escaped;
  const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}

function renderBulkSelectedWaybills() {
  if (!bulkWaybillChipsStrip) return;
  const waybills = [...selectedMonitoringWaybills];
  if (waybills.length === 0) {
    bulkWaybillChipsStrip.innerHTML = '';
    return;
  }

  const maxVisible = 6;
  const visible = waybills.slice(0, maxVisible);
  const remaining = waybills.length - maxVisible;

  let html = visible.map((wb) => `
    <span class="bulk-waybill-tag">
      <span>${escapeTlcHtml(wb)}</span>
      <button type="button" class="wb-remove-btn" data-wb="${escapeTlcHtml(wb)}" title="Hapus waybill ini">✕</button>
    </span>
  `).join('');

  if (remaining > 0) {
    html += `<span class="bulk-waybill-more">+${remaining} lainnya</span>`;
  }

  bulkWaybillChipsStrip.innerHTML = html;
}

function updateBulkQuickChipsUI(currentAction = bulkActionSelect?.value || '') {
  if (!bulkQuickChips) return;
  const chips = bulkQuickChips.querySelectorAll('.bulk-quick-chip');
  chips.forEach((chip) => {
    const chipAction = chip.dataset.action;
    const isActive = Boolean(currentAction) && ((chipAction === currentAction) || (chipAction === 'manual' && currentAction === 'manual'));
    chip.classList.toggle('is-active', isActive);
  });
}

function updateSelectedMonitoringCount() {
  const count = selectedMonitoringWaybills.size;
  if (selectedMonitoringCount) selectedMonitoringCount.textContent = count;
  if (selectedMonitoringArchiveCount) selectedMonitoringArchiveCount.textContent = count;
  if (selectedMonitoringDeleteCount) selectedMonitoringDeleteCount.textContent = count;
  if (selectedMonitoringCountBadge) selectedMonitoringCountBadge.textContent = count;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = count === 0;

  if (bulkDeleteBtn) {
    bulkDeleteBtn.disabled = count === 0;
    toggle(bulkDeleteBtn, hasPermission('delete_selected'));
  }

  if (bulkRestoreUpdateBtn) {
    const hasUpdatedSelected = [...selectedMonitoringWaybills].some((wb) => {
      const item = monitoringData.find((m) => m.waybill === wb);
      return item && isSudahUpdate(item);
    });
    bulkRestoreUpdateBtn.disabled = count === 0 || !hasUpdatedSelected;
    toggle(bulkRestoreUpdateBtn, hasPermission('restore_updated'));
  }

  renderBulkSelectedWaybills();
  refreshBulkActionButtonState();
  monitoringBulkControls?.classList.toggle('has-selection', count > 0);
}

function refreshBulkActionButtonState() {
  if (!bulkUpdateBtn) return;
  const count = selectedMonitoringWaybills.size;
  const hasSelection = count > 0;
  const selectedValue = bulkActionSelect?.value || '';
  const manualValue = (bulkActionManual?.value || '').trim();
  const effectiveAction = selectedValue === 'manual' ? manualValue : selectedValue;
  const hasAction = (selectedValue === 'manual' ? manualValue : selectedValue).length > 0
    && selectedValue !== ''
    && !(selectedValue === 'manual' && !manualValue);
  bulkUpdateBtn.disabled = !(hasSelection && hasAction);

  if (bulkUpdateBtnText) {
    if (hasAction && hasSelection) {
      bulkUpdateBtnText.innerHTML = `Update (${count}) <span class="bulk-btn-arrow">➔</span> <span class="bulk-btn-target">${escapeTlcHtml(effectiveAction)}</span>`;
    } else {
      bulkUpdateBtnText.innerHTML = `Update (<span id="selectedMonitoringCount">${count}</span>)`;
    }
  }
}

function renderMonitoringPagination(totalRows, totalPages) {
  if (!monitoringPagination) return;
  const visiblePages = new Set([1, totalPages, monitoringPage, monitoringPage - 1, monitoringPage + 1]);
  if (monitoringPage <= 3) [2, 3, 4].forEach((page) => visiblePages.add(page));
  if (monitoringPage >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => visiblePages.add(page));
  const orderedPages = [...visiblePages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const pageButtons = orderedPages.map((page, index) => {
    const previousPage = orderedPages[index - 1];
    const separator = previousPage && page - previousPage > 1 ? '<span class="page-ellipsis">...</span>' : '';
    return `${separator}<button type="button" class="page-btn ${page === monitoringPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
  }).join('');

  monitoringPagination.innerHTML = `
    <div class="pagination-summary">Menampilkan ${totalRows ? ((monitoringPage - 1) * monitoringPageSize) + 1 : 0}-${Math.min(monitoringPage * monitoringPageSize, totalRows)} dari ${totalRows} data</div>
    <div class="pagination-controls">
      <label>Tampilkan:
        <select id="monitoringPageSize" aria-label="Jumlah data per halaman">
          <option value="20" ${monitoringPageSize === 20 ? 'selected' : ''}>20</option>
          <option value="50" ${monitoringPageSize === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${monitoringPageSize === 100 ? 'selected' : ''}>100</option>
          <option value="200" ${monitoringPageSize === 200 ? 'selected' : ''}>200</option>
        </select> data
      </label>
      <button type="button" class="page-btn" data-page="${Math.max(1, monitoringPage - 1)}" ${monitoringPage === 1 ? 'disabled' : ''}>‹</button>
      ${pageButtons}
      <button type="button" class="page-btn" data-page="${Math.min(totalPages, monitoringPage + 1)}" ${monitoringPage === totalPages ? 'disabled' : ''}>›</button>
    </div>
  `;
}

let currentStuckFilter = null;
let activeSummaryCardId = null;

function isSudahUpdate(item) {
  const aksi = String(item.aksi || '').trim();
  const status = String(item.status || '').toLowerCase();
  return (aksi && aksi !== '-') || status === 'sudah diupdate' || status === 'sudah scan kirim';
}

function getStuckNumericHours(stuckVal) {
  const raw = String(stuckVal || '').trim();
  if (/^[1-6]\.\s+/.test(raw) || /^\d+\s*-\s*\d+/.test(raw)) return null;
  const match = raw.match(/^(\d+(?:\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  return null;
}

function formatStuckByHours(hours) {
  const h = Math.round(Number(hours));
  if (h <= 11) return `${h} Jam (1-12)`;
  if (h <= 23) return `${h} Jam (12-24)`;
  if (h <= 35) return `${h} Jam (24-36)`;
  if (h <= 47) return `${h} Jam (36-48)`;
  if (h <= 59) return `${h} Jam (48-60)`;
  if (h <= 71) return `${h} Jam (60-72)`;
  return `${h} Jam (72 UP)`;
}

function normalizeStuckCategory(value) {
  if (value === null || value === undefined) return '0 Jam (1-12)';

  const rawStr = String(value).trim();
  if (!rawStr) return '0 Jam (1-12)';

  const normalized = rawStr.toLowerCase().replace(/\s+/g, ' ');

  // 1. Dukungan format teks lama dan baru dengan penomoran (1. 1-12 Jam, 4. 36-48 Jam, dsb)
  if (/^(?:1\.\s*)?(?:12\s*jam$|1-12)/.test(normalized)) return '12 Jam (1-12)';
  if (/^(?:2\.\s*)?(?:12\s*jam\s*-\s*24\s*jam|12-24)/.test(normalized)) return '24 Jam (12-24)';
  if (/^(?:3\.\s*)?(?:24\s*jam\s*-\s*36\s*jam|24-36)/.test(normalized)) return '36 Jam (24-36)';
  if (/^(?:4\.\s*)?(?:36\s*jam\s*-\s*48\s*jam|36-48)/.test(normalized)) return '48 Jam (36-48)';
  if (/^(?:5\.\s*)?(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '60 Jam (48-60)';
  if (/^(?:6\.\s*)?(?:(?:48|60)\s*jam\s*-\s*72\s*jam|(?:48-72|60-72))/.test(normalized)) return '72 Jam (60-72)';
  if (/^(?:7\.\s*)?(?:72(?:\s*jam)?\s*(?:up|\+)|72-up)/.test(normalized)) return '72 Jam (72 UP)';

  // Dukungan teks format lama tanpa penomoran
  if (/^36\s*jam\s*-\s*48\s*jam$/.test(normalized)) return '48 Jam (36-48)';
  if (/^48\s*jam\s*-\s*60\s*jam$/.test(normalized)) return '60 Jam (48-60)';
  if (/^(?:48|60)\s*jam\s*-\s*72\s*jam$/.test(normalized)) return '72 Jam (60-72)';
  if (/^72(?:\s*jam)?\s*(?:up|\+)$/.test(normalized)) return '72 Jam (72 UP)';
  if (/^12\s*jam\s*-\s*24\s*jam$/.test(normalized)) return '24 Jam (12-24)';
  if (/^24\s*jam\s*-\s*36\s*jam$/.test(normalized)) return '36 Jam (24-36)';
  if (/^12\s*jam$/.test(normalized)) return '12 Jam (1-12)';

  // Backward compatibility jika ada data lama berformat "4. 48-60" sebelum 36-48 dipisah
  if (/^4\.\s*(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '60 Jam (48-60)';

  // 2. Input jam numerik (e.g. 5, 14, 45, 45 Jam, 45h, 45 Jam (48-60))
  // Cegah mencocokkan range seperti "48-72" sebagai single number 48
  if (!/^\d+\s*-\s*\d+/.test(rawStr)) {
    const numMatch = rawStr.match(/^(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const hours = parseFloat(numMatch[1]);
      return formatStuckByHours(hours);
    }
  }

  return rawStr;
}

function getItemStuckKey(item) {
  const rawStuck = String(item?.stuck || item || '').trim();
  if (!rawStuck) return '1-12';

  const normalized = rawStuck.toLowerCase().replace(/\s+/g, ' ');

  // 1. Cek rentang eksplisit dalam tanda kurung
  if (normalized.includes('(1-12)') || normalized.includes('(0-12)')) return '1-12';
  if (normalized.includes('(12-24)')) return '12-24';
  if (normalized.includes('(24-36)')) return '24-36';
  if (normalized.includes('(36-48)')) return '36-48';
  if (normalized.includes('(48-60)') || normalized.includes('(36-60)')) return '48-60';
  if (normalized.includes('(60-72)') || normalized.includes('(48-72)')) return '60-72';
  if (normalized.includes('(72 up)') || normalized.includes('(72up)') || normalized.includes('(72+)') || normalized.includes('(72 jam up)')) return '72-up';

  // 2. Format teks lama dengan penomoran atau teks eksplisit
  if (/^(?:1\.\s*)?(?:1-12|12\s*jam$)/.test(normalized)) return '1-12';
  if (/^(?:2\.\s*)?(?:12-24|12\s*jam\s*-\s*24\s*jam)/.test(normalized)) return '12-24';
  if (/^(?:3\.\s*)?(?:24-36|24\s*jam\s*-\s*36\s*jam)/.test(normalized)) return '24-36';
  if (/^(?:4\.\s*)?(?:36-48|36\s*jam\s*-\s*48\s*jam)/.test(normalized)) return '36-48';
  if (/^(?:5\.\s*)?(?:48-60|48\s*jam\s*-\s*60\s*jam)/.test(normalized)) return '48-60';
  if (/^(?:6\.\s*)?(?:60-72|48-72|(?:48|60)\s*jam\s*-\s*72\s*jam)/.test(normalized)) return '60-72';
  if (/^(?:7\.\s*)?(?:72\s*up|72\s*jam\s*(?:up|\+)|72\+|72-up)/.test(normalized)) return '72-up';

  // Dukungan backward compatibility jika ada data lama berformat "4. 48-60" sebelum penambahan 36-48
  if (/^4\.\s*(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '48-60';
  if (/^5\.\s*(?:(?:48|60)\s*jam\s*-\s*72\s*jam|(?:48-72|60-72))/.test(normalized)) return '60-72';
  if (/^6\.\s*(?:72(?:\s*jam)?\s*(?:up|\+)|72-up)/.test(normalized)) return '72-up';

  // 3. Jika hanya angka jam (misal 5, 14, 25, 45, 65, 80)
  const hours = getStuckNumericHours(rawStuck);
  if (hours !== null) {
    if (hours < 12) return '1-12';
    if (hours < 24) return '12-24';
    if (hours < 36) return '24-36';
    if (hours < 48) return '36-48';
    if (hours < 60) return '48-60';
    if (hours < 72) return '60-72';
    return '72-up';
  }

  // 4. Default fallback aman
  return '1-12';
}

function matchesStuckFilter(item, filter) {
  if (filter === 'updated') return isSudahUpdate(item);
  if (isSudahUpdate(item)) return false;

  const key = getItemStuckKey(item);
  if (filter === '48-72') return key === '60-72';
  return key === filter;
}

function getUrgencyClass(stuckValue) {
  const key = getItemStuckKey(stuckValue);
  if (key === '1-12') return 'urgency-1-12';
  if (key === '12-24') return 'urgency-12-24';
  if (key === '24-36') return 'urgency-24-36';
  if (key === '36-48') return 'urgency-36-48';
  if (key === '48-60') return 'urgency-48-60';
  if (key === '60-72') return 'urgency-60-72';
  if (key === '72-up') return 'urgency-72-up';
  return 'urgency-normal';
}

function updateStats(data) {
  const totalDataEl = document.getElementById('totalData');
  if (!totalDataEl) return;

  totalDataEl.textContent = data.length;

  if (updatedCardCount) {
    const updatedCount = data.filter(isSudahUpdate).length;
    updatedCardCount.textContent = updatedCount;
  }

  const c1_12 = data.filter(item => matchesStuckFilter(item, '1-12')).length;
  const c12_24 = data.filter(item => matchesStuckFilter(item, '12-24')).length;
  const c24_36 = data.filter(item => matchesStuckFilter(item, '24-36')).length;
  const c36_48 = data.filter(item => matchesStuckFilter(item, '36-48')).length;
  const c48_60 = data.filter(item => matchesStuckFilter(item, '48-60')).length;
  const c60_72 = data.filter(item => matchesStuckFilter(item, '60-72')).length;
  const c72_up = data.filter(item => matchesStuckFilter(item, '72-up')).length;

  const count1_12 = document.getElementById('count-1-12');
  const count12_24 = document.getElementById('count-12-24');
  const count24_36 = document.getElementById('count-24-36');
  const count36_48 = document.getElementById('count-36-48');
  const count48_60 = document.getElementById('count-48-60');
  const count60_72 = document.getElementById('count-60-72') || document.getElementById('count-48-72');
  const count72_up = document.getElementById('count-72-up');

  if (count1_12) count1_12.textContent = c1_12;
  if (count12_24) count12_24.textContent = c12_24;
  if (count24_36) count24_36.textContent = c24_36;
  if (count36_48) count36_48.textContent = c36_48;
  if (count48_60) count48_60.textContent = c48_60;
  if (count60_72) count60_72.textContent = c60_72;
  if (count72_up) count72_up.textContent = c72_up;

  // Update ringkasan pada tombol drawer
  const drawerSummaryBadge = document.getElementById('drawerSummaryBadge');
  if (drawerSummaryBadge) {
    const totalCritical = c36_48 + c48_60 + c60_72 + c72_up;
    drawerSummaryBadge.textContent = `> 36 Jam: ${totalCritical} Data`;
  }
}

function escapeTlcHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function closeTlcDropdown() {
  if (tlcDropdownMenu) tlcDropdownMenu.classList.add('hidden');
  if (tlcComboboxWrap) tlcComboboxWrap.classList.remove('is-open');
}

function openTlcDropdown() {
  if (!tlcDropdownMenu) return;
  renderTlcDropdownMenu(tlcFilterInput?.value || '');
  tlcDropdownMenu.classList.remove('hidden');
  if (tlcComboboxWrap) tlcComboboxWrap.classList.add('is-open');
}

function renderTlcDropdownMenu(searchQuery = '') {
  if (!tlcDropdownMenu) return;
  const q = (searchQuery || '').trim().toLowerCase();
  const currentVal = (tlcFilterInput?.value || '').trim().toUpperCase();

  let filteredList = currentAvailableTlcs;
  if (q) {
    filteredList = currentAvailableTlcs.filter((item) => item.code.toLowerCase().includes(q));
  }

  const totalAll = monitoringData ? monitoringData.length : 0;
  let html = `
    <div class="tlc-option-item ${!currentVal ? 'is-selected' : ''}" data-value="all">
      <span class="tlc-opt-name">
        <svg class="tlc-item-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        Semua TLC
      </span>
      <span class="tlc-opt-badge">${totalAll}</span>
    </div>
  `;

  if (filteredList.length === 0) {
    html += `
      <div class="tlc-option-empty">
        <span>Tidak ada TLC "${escapeTlcHtml(searchQuery)}"</span>
      </div>
    `;
  } else {
    filteredList.forEach((item) => {
      const isSelected = currentVal === item.code.toUpperCase();
      html += `
        <div class="tlc-option-item ${isSelected ? 'is-selected' : ''}" data-value="${escapeTlcHtml(item.code)}">
          <span class="tlc-opt-name">
            <svg class="tlc-item-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
            </svg>
            ${escapeTlcHtml(item.code)}
          </span>
          <span class="tlc-opt-badge">${item.count}</span>
        </div>
      `;
    });
  }

  tlcDropdownMenu.innerHTML = html;
}

function applyFilter() {
  const keyword = (searchInput?.value || '').trim().toLowerCase();
  const tlcRaw = (tlcFilterInput?.value || '').trim();
  const tlcQuery = tlcRaw.toLowerCase();
  const selectTlc = (tlcFilter?.value || 'all');

  let filtered = monitoringData;

  if (keyword) {
    filtered = filtered.filter((item) => {
      const formattedTanggal = formatDate(item.tanggal);
      const haystack = [
        item.waybill,
        item.tanggal,
        formattedTanggal,
        item.outlet,
        item.stuck,
        item.tlc,
        item.status,
        item.aksi,
        item.nama_barang,
        item.updated_by,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }

  // Filter TLC: jika ada ketikan di input combobox, gunakan partial match
  // Jika input kosong namun dropdown select tlc ada nilainya bukan 'all', gunakan itu
  if (tlcQuery) {
    filtered = filtered.filter((item) => (item.tlc || '').toLowerCase().includes(tlcQuery));
  } else if (selectTlc !== 'all') {
    filtered = filtered.filter((item) => (item.tlc || '').trim().toLowerCase() === selectTlc.trim().toLowerCase());
  }

  if (currentStuckFilter) {
    filtered = filtered.filter((item) => matchesStuckFilter(item, currentStuckFilter));
  }

  // Tampilkan / sembunyikan tombol clear search & clear tlc
  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('hidden', !keyword);
  }
  if (clearTlcBtn) {
    clearTlcBtn.classList.toggle('hidden', !tlcRaw);
  }

  // Update badge total data di panel header
  if (monitoringTotalBadge) {
    if (filtered.length === monitoringData.length) {
      monitoringTotalBadge.textContent = `${monitoringData.length} Data`;
    } else {
      monitoringTotalBadge.textContent = `${filtered.length} dari ${monitoringData.length} Data`;
    }
  }

  // Sinkronisasi status aktif pada Quick TLC Chips
  if (tlcChipsContainer) {
    const chips = tlcChipsContainer.querySelectorAll('.tlc-chip');
    chips.forEach((c) => {
      const chipVal = (c.dataset.tlc || 'all').toLowerCase();
      if (!tlcQuery || tlcQuery === 'all') {
        c.classList.toggle('active', chipVal === 'all');
      } else {
        c.classList.toggle('active', chipVal === tlcQuery);
      }
    });
  }

  renderTable(filtered);
}

function applyFilters() {
  applyFilter();
}

function populateTlcFilters(data) {
  if (!tlcFilter && !tlcFilterInput) return;

  const currentTlcVal = (tlcFilterInput?.value || tlcFilter?.value || 'all').trim();
  const tlcCounts = {};

  (data || []).forEach((item) => {
    const code = (item.tlc || '').trim();
    if (code && code !== '-') {
      tlcCounts[code] = (tlcCounts[code] || 0) + 1;
    }
  });

  const sortedTlcs = Object.keys(tlcCounts).sort((a, b) => tlcCounts[b] - tlcCounts[a]);
  currentAvailableTlcs = sortedTlcs.map((code) => ({ code, count: tlcCounts[code] }));

  if (tlcFilter) {
    let optionsHtml = `<option value="all">Semua TLC (${data.length})</option>`;
    sortedTlcs.forEach((code) => {
      optionsHtml += `<option value="${code}">${code} (${tlcCounts[code]})</option>`;
    });
    tlcFilter.innerHTML = optionsHtml;

    if (sortedTlcs.includes(currentTlcVal)) {
      tlcFilter.value = currentTlcVal;
    } else {
      tlcFilter.value = 'all';
    }
  }

  // Render Combobox Dropdown Menu
  renderTlcDropdownMenu(tlcFilterInput ? tlcFilterInput.value : '');

  // Render Quick Chips
  if (tlcChipsContainer && tlcQuickChipsBar) {
    if (sortedTlcs.length > 0) {
      tlcQuickChipsBar.classList.remove('hidden');
      const topTlcs = sortedTlcs.slice(0, 6);
      const activeCode = currentTlcVal.toUpperCase();
      let chipsHtml = `
        <button type="button" class="tlc-chip ${!currentTlcVal || currentTlcVal.toLowerCase() === 'all' ? 'active' : ''}" data-tlc="all">
          Semua <span class="chip-count">${data.length}</span>
        </button>
      `;
      topTlcs.forEach((code) => {
        chipsHtml += `
          <button type="button" class="tlc-chip ${activeCode === code ? 'active' : ''}" data-tlc="${code}">
            ${code} <span class="chip-count">${tlcCounts[code]}</span>
          </button>
        `;
      });
      tlcChipsContainer.innerHTML = chipsHtml;
      setTimeout(updateTlcScrollButtons, 50);
    } else {
      tlcQuickChipsBar.classList.add('hidden');
      tlcChipsContainer.innerHTML = '';
    }
  }
}

function resetAllMonitoringFilters() {
  if (searchInput) searchInput.value = '';
  if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
  if (statusFilter) statusFilter.value = 'all';
  if (tlcFilter) tlcFilter.value = 'all';
  if (tlcFilterInput) tlcFilterInput.value = '';
  if (clearTlcBtn) clearTlcBtn.classList.add('hidden');
  closeTlcDropdown();
  currentStuckFilter = null;
  activeSummaryCardId = null;

  document.querySelectorAll('.stat-card').forEach((card) => {
    card.classList.remove('is-active');
  });

  if (monitoringPanel) {
    monitoringPanel.removeAttribute('data-active-card');
  }

  if (tlcChipsContainer) {
    tlcChipsContainer.querySelectorAll('.tlc-chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.tlc === 'all');
    });
  }

  monitoringPage = 1;
  applyFilter();
}

// Tambahkan event listeners untuk card, drawer, dan tab switcher
function initCardFilters() {
  const cards = [
    { id: 'card-total', filter: null },
    { id: 'card-updated', filter: 'updated' },
    { id: 'card-archive', filter: null },
    { id: 'card-1-12', filter: '1-12' },
    { id: 'card-12-24', filter: '12-24' },
    { id: 'card-24-36', filter: '24-36' },
    { id: 'card-36-48', filter: '36-48' },
    { id: 'card-48-60', filter: '48-60' },
    { id: 'card-60-72', filter: '60-72' },
    { id: 'card-48-72', filter: '60-72' },
    { id: 'card-72-up', filter: '72-up' }
  ];

  // 1. Event Drawer Buka-Tutup (Ngumpet)
  const btnToggleStuckDrawer = document.getElementById('btnToggleStuckDrawer');
  const stuckDrawerContainer = document.getElementById('stuckDrawerContainer');
  const chevronStuckDrawer = document.getElementById('chevronStuckDrawer');
  const drawerToggleText = document.getElementById('drawerToggleText');

  if (btnToggleStuckDrawer && stuckDrawerContainer) {
    btnToggleStuckDrawer.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = stuckDrawerContainer.classList.contains('is-open');
      if (isOpen) {
        stuckDrawerContainer.classList.remove('is-open');
        stuckDrawerContainer.classList.add('is-collapsed');
        chevronStuckDrawer?.classList.remove('is-open');
        if (drawerToggleText) drawerToggleText.textContent = 'Buka Kartu';
      } else {
        stuckDrawerContainer.classList.add('is-open');
        stuckDrawerContainer.classList.remove('is-collapsed');
        chevronStuckDrawer?.classList.add('is-open');
        if (drawerToggleText) drawerToggleText.textContent = 'Tutup Kartu';
      }
    });
  }

  // 2. Event Saklar Tab (Prioritas Kritis vs Semua Level)
  const tabStuckPriority = document.getElementById('tabStuckPriority');
  const tabStuckAll = document.getElementById('tabStuckAll');
  const stuckCardsGrid = document.getElementById('stuckCardsGrid');

  if (tabStuckPriority && tabStuckAll) {
    tabStuckPriority.addEventListener('click', (e) => {
      e.preventDefault();
      tabStuckPriority.classList.add('active');
      tabStuckAll.classList.remove('active');
      if (stuckCardsGrid) {
        stuckCardsGrid.classList.add('mode-priority');
        stuckCardsGrid.classList.remove('mode-all');
      }
    });

    tabStuckAll.addEventListener('click', (e) => {
      e.preventDefault();
      tabStuckAll.classList.add('active');
      tabStuckPriority.classList.remove('active');
      if (stuckCardsGrid) {
        stuckCardsGrid.classList.remove('mode-priority');
        stuckCardsGrid.classList.add('mode-all');
      }
    });
  }

  // 3. Event Listener Klik Kartu Filter
  cards.forEach((card) => document.getElementById(card.id)?.classList.remove('is-active'));

  cards.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) {
      el.addEventListener('click', () => {
        if (c.id === 'card-archive') {
          // Buka panel arsip jika card arsip diklik
          monitoringPanel?.classList.add('hidden');
          historyPanel?.classList.add('hidden');
          archivePanel?.classList.remove('hidden');
          cardArchive?.classList.add('is-active');
          document.querySelectorAll('.stat-card').forEach(card => card.classList.remove('is-active'));
          el.classList.add('is-active');
          return;
        }

        monitoringPanel?.classList.remove('hidden');
        historyPanel?.classList.add('hidden');
        archivePanel?.classList.add('hidden');
        cardArchive?.classList.remove('is-active');

        // Toggle filter jika card yang sama diklik ulang.
        const isSameCard = activeSummaryCardId === c.id;
        currentStuckFilter = isSameCard ? null : c.filter;
        activeSummaryCardId = isSameCard ? null : c.id;

        // Beri highlight aktif pada kartu terpilih
        cards.forEach(card => {
          const cardEl = document.getElementById(card.id);
          if (cardEl) {
            cardEl.classList.toggle('is-active', activeSummaryCardId === card.id);
          }
        });

        if (monitoringPanel) {
          if (activeSummaryCardId) {
            monitoringPanel.setAttribute('data-active-card', activeSummaryCardId);
          } else {
            monitoringPanel.removeAttribute('data-active-card');
          }
        }

        monitoringPage = 1;
        applyFilter();
      });
    }
  });
}

initCardFilters();

function initQuickBarToggle() {
  const btnToggleQuickBar = document.getElementById('btnToggleQuickBar');
  const monitoringQuickBar = document.getElementById('monitoringQuickBar');
  const chevronQuickBar = document.getElementById('chevronQuickBar');
  const quickBarToggleText = document.getElementById('quickBarToggleText');
  const quickBarHeader = document.getElementById('quickBarHeader');

  if (!btnToggleQuickBar || !monitoringQuickBar) return;

  const isMobile = window.innerWidth <= 680;

  // Default di HP/PDA: otomatis tertutup (ngumpet) agar layar luas dan tidak makan tempat.
  // Default di Desktop: terbuka.
  if (isMobile) {
    monitoringQuickBar.classList.add('is-collapsed');
    monitoringQuickBar.classList.remove('is-open');
    chevronQuickBar?.classList.remove('is-open');
    if (quickBarToggleText) quickBarToggleText.textContent = 'Buka';
  } else {
    monitoringQuickBar.classList.add('is-open');
    monitoringQuickBar.classList.remove('is-collapsed');
    chevronQuickBar?.classList.add('is-open');
    if (quickBarToggleText) quickBarToggleText.textContent = 'Sembunyikan';
  }

  btnToggleQuickBar.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = monitoringQuickBar.classList.contains('is-open');
    if (isOpen) {
      monitoringQuickBar.classList.remove('is-open');
      monitoringQuickBar.classList.add('is-collapsed');
      chevronQuickBar?.classList.remove('is-open');
      if (quickBarToggleText) quickBarToggleText.textContent = 'Buka';
    } else {
      monitoringQuickBar.classList.add('is-open');
      monitoringQuickBar.classList.remove('is-collapsed');
      chevronQuickBar?.classList.add('is-open');
      if (quickBarToggleText) quickBarToggleText.textContent = 'Sembunyikan';
    }
  });

  if (quickBarHeader) {
    quickBarHeader.addEventListener('click', (e) => {
      if (e.target.closest('#btnToggleQuickBar')) return;
      btnToggleQuickBar.click();
    });
  }
}

initQuickBarToggle();


