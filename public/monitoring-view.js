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
    const outletParts = [
      item.outlet_asal && item.outlet_asal !== '-' ? `Asal: ${item.outlet_asal}` : null,
      item.outlet && item.outlet !== '-' ? `Tujuan: ${item.outlet}` : null,
      item.tlc && item.tlc !== '-' ? `TLC: ${item.tlc}` : null
    ].filter(Boolean);
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
        <td colspan="11" class="empty-state">Belum ada data monitoring.</td>
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
      <td class="col-waybill" data-label="Waybill">
        <button type="button" class="waybill-interactive-link" data-waybill="${escapeTlcHtml(item.waybill || '')}" title="Klik untuk rincian lengkap waybill">
          <strong class="cell-value">${highlightSearch(item.waybill || '-')}</strong>
          <svg class="waybill-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        </button>
      </td>
      <td class="col-tanggal" data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(item.tanggal))}</span></td>
      <td class="col-outlet-asal" data-label="Outlet Asal"><span class="cell-value font-mono font-bold">${highlightSearch(item.outlet_asal || '-')}</span></td>
      <td class="col-outlet-tujuan" data-label="Outlet Tujuan"><span class="cell-value font-mono font-bold">${highlightSearch(item.outlet || '-')}</span></td>
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
let currentFilteredMonitoringData = [];
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

let currentSortColumn = null;
let currentSortDirection = 'asc';
const columnFilters = {};

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

function applyFilter() {
  const keyword = (searchInput?.value || '').trim().toLowerCase();
  const tlcRaw = (tlcFilterInput?.value || '').trim();
  const tlcQuery = tlcRaw.toLowerCase();
  const selectTlc = (tlcFilter?.value || 'all');

  let filtered = monitoringData || [];
  const tipEl = document.getElementById('monitoringSearchTip');

  // 1. Filter Keyword Global / Shopee Torn Label Smart Match
  if (keyword) {
    const parsedShopee = parseShopeeOrderSn(keyword);
    if (parsedShopee) {
      // Cek apakah ada resi langsung yang cocok
      const directMatches = filtered.filter((item) => (item.waybill || '').toLowerCase().includes(keyword));
      if (directMatches.length > 0) {
        filtered = directMatches;
        if (tipEl) tipEl.classList.add('hidden');
      } else {
        // Mode Pencarian Label Sobek Shopee (Filter berdasarkan tanggal order & Marketplace Shopee)
        filtered = filtered.filter((item) => {
          const tgl = String(item.tanggal || '');
          const isDateMatch = tgl.startsWith(parsedShopee.dateIso);
          const isShopee = String(item.client_name || '').toLowerCase().includes('shopee');
          return isDateMatch && isShopee;
        });
        if (tipEl) {
          tipEl.innerHTML = `💡 Terdeteksi No Pesanan Shopee <strong>${parsedShopee.orderSn}</strong> (Tanggal Order: ${parsedShopee.dateFormatted}). Ditemukan <strong>${filtered.length}</strong> paket Shopee pada tanggal tersebut. Silakan ketik kota/outlet tujuan di kolom filter untuk mencocokkan potongan label sobek!`;
          tipEl.classList.remove('hidden');
        }
      }
    } else {
      if (tipEl) tipEl.classList.add('hidden');
      filtered = filtered.filter((item) => {
        const formattedTanggal = formatDate(item.tanggal);
        const haystack = [
          item.waybill,
          item.tanggal,
          formattedTanggal,
          item.outlet_asal,
          item.origin_city,
          item.outlet,
          item.dest_city,
          item.stuck,
          item.tlc,
          item.status,
          item.aksi,
          item.nama_barang,
          item.updated_by,
          item.client_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      });
    }
  } else {
    if (tipEl) tipEl.classList.add('hidden');
  }

  // 2. Filter TLC Combobox
  if (tlcQuery) {
    filtered = filtered.filter((item) => (item.tlc || '').toLowerCase().includes(tlcQuery));
  } else if (selectTlc !== 'all') {
    filtered = filtered.filter((item) => (item.tlc || '').trim().toLowerCase() === selectTlc.trim().toLowerCase());
  }

  // 3. Filter Kartu Stuck (Aging)
  if (currentStuckFilter) {
    filtered = filtered.filter((item) => matchesStuckFilter(item, currentStuckFilter));
  }

  // 4. Filter Spesifik per Kolom Tabel
  const colKeys = Object.keys(columnFilters);
  if (colKeys.length > 0) {
    filtered = filtered.filter((item) => {
      for (const col of colKeys) {
        const fVal = String(columnFilters[col] || '').trim().toLowerCase();
        if (!fVal) continue;

        if (col === 'stuck') {
          if (!matchesStuckFilter(item, fVal)) return false;
        } else if (col === 'status') {
          const isUpd = isSudahUpdate(item);
          if (fVal === 'pending' && isUpd) return false;
          if (fVal === 'sudah diupdate' && !isUpd) return false;
        } else if (col === 'tanggal') {
          const rawTgl = String(item.tanggal || '').toLowerCase();
          const fmtTgl = formatDate(item.tanggal).toLowerCase();
          if (!rawTgl.includes(fVal) && !fmtTgl.includes(fVal)) return false;
        } else if (col === 'outlet_asal') {
          const valAsal = `${item.outlet_asal || ''} ${item.origin_city || ''}`.toLowerCase();
          if (!valAsal.includes(fVal)) return false;
        } else if (col === 'outlet') {
          const valTujuan = `${item.outlet || ''} ${item.dest_city || ''}`.toLowerCase();
          if (!valTujuan.includes(fVal)) return false;
        } else {
          const itemVal = String(item[col] || '').toLowerCase();
          if (!itemVal.includes(fVal)) return false;
        }
      }
      return true;
    });
  }

  // 5. Sortir per Kolom (Ascending / Descending)
  if (currentSortColumn) {
    filtered = [...filtered].sort((a, b) => {
      const valA = a[currentSortColumn];
      const valB = b[currentSortColumn];

      if (currentSortColumn === 'stuck') {
        const hA = parseInt(String(valA || '0').match(/\d+/)?.[0] || '0', 10);
        const hB = parseInt(String(valB || '0').match(/\d+/)?.[0] || '0', 10);
        return currentSortDirection === 'asc' ? hA - hB : hB - hA;
      }

      if (currentSortColumn === 'tanggal') {
        const dA = new Date(valA || 0).getTime();
        const dB = new Date(valB || 0).getTime();
        return currentSortDirection === 'asc' ? dA - dB : dB - dA;
      }

      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      const cmp = strA.localeCompare(strB, 'id-ID', { numeric: true });
      return currentSortDirection === 'asc' ? cmp : -cmp;
    });
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
    if (filtered.length === (monitoringData || []).length) {
      monitoringTotalBadge.textContent = `${(monitoringData || []).length} Data`;
    } else {
      monitoringTotalBadge.textContent = `${filtered.length} dari ${(monitoringData || []).length} Data`;
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

  currentFilteredMonitoringData = filtered;
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

function initShiftArchiveHandler() {
  const btnArchiveShift = document.getElementById('btnArchiveCompletedShift');
  if (!btnArchiveShift) return;

  btnArchiveShift.addEventListener('click', async () => {
    const confirmShift = confirm(
      'Pindahkan SEMUA waybill yang berstatus "Sudah Diupdate" ke Arsip History?\n\n' +
      'ℹ️ Catatan: Fitur ini digunakan saat pergantian shift agar data yang sudah beres tersimpan rapi di histori dan tidak menumpuk di monitoring aktif.'
    );
    if (!confirmShift) return;

    btnArchiveShift.disabled = true;
    try {
      const token = getToken();
      const res = await fetch('/api/monitoring/archive-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showAppAlert(`✅ ${result.archivedCount} waybill selesai berhasil diarsipkan ke History!`);
        if (typeof fetchMonitoring === 'function') await fetchMonitoring();
        if (typeof fetchMonitoringHistory === 'function') await fetchMonitoringHistory();
      } else {
        showAppAlert(result.error || 'Gagal mengarsipkan data selesai', true);
      }
    } catch (err) {
      showAppAlert('Koneksi gagal: ' + err.message, true);
    } finally {
      btnArchiveShift.disabled = false;
    }
  });
}

initShiftArchiveHandler();
 
let currentDetailWaybillItem = null;

function openWaybillDetailModal(waybill) {
  const modal = document.getElementById('waybillDetailModal');
  if (!modal) return;

  const item = (monitoringData || []).find((m) => m.waybill === waybill);
  if (!item) {
    showAppAlert(`Data untuk waybill ${waybill} tidak ditemukan di tabel monitoring.`, true);
    return;
  }

  currentDetailWaybillItem = item;

  const noEl = document.getElementById('wbDetailWaybillNo');
  const statusEl = document.getElementById('wbDetailStatusBadge');
  const clientBadgeEl = document.getElementById('wbDetailClientBadge');
  const stuckEl = document.getElementById('wbDetailStuckBadge');
  const asalEl = document.getElementById('wbDetailOutletAsal');
  const originCityEl = document.getElementById('wbDetailOriginCity');
  const tujuanEl = document.getElementById('wbDetailOutletTujuan');
  const destCityEl = document.getElementById('wbDetailDestCity');
  const weightKoliEl = document.getElementById('wbDetailWeightKoli');
  const alertBanner = document.getElementById('wbDetailAlertBanner');
  const alertBadges = document.getElementById('wbDetailAlertBadges');
  const tanggalEl = document.getElementById('wbDetailTanggal');
  const scanInTimeEl = document.getElementById('wbDetailScanInTime');
  const tlcEl = document.getElementById('wbDetailTlc');
  const barangEl = document.getElementById('wbDetailNamaBarang');
  const aksiEl = document.getElementById('wbDetailAksi');
  const updatedByEl = document.getElementById('wbDetailUpdatedBy');
  const updatedAtEl = document.getElementById('wbDetailUpdatedAt');

  if (noEl) noEl.textContent = item.waybill || '-';

  const updated = isSudahUpdate(item);
  const currentStatus = item.status && String(item.status).toLowerCase() !== 'open' ? item.status : 'Pending';

  if (statusEl) {
    statusEl.textContent = updated ? (item.aksi && item.aksi !== '-' ? `Sudah Diupdate (${item.aksi})` : 'Sudah Diupdate') : currentStatus;
    statusEl.className = `modern-status-badge ${updated ? 'status-success' : 'status-pending'}`;
  }

  // Client badge (Shopee, TikTok, Tokopedia, JFS, etc)
  if (clientBadgeEl) {
    const client = (item.client_name || 'JFS').trim();
    clientBadgeEl.textContent = client;
    const cLower = client.toLowerCase();
    if (cLower.includes('shopee')) {
      clientBadgeEl.style.background = 'rgba(238, 77, 45, 0.2)';
      clientBadgeEl.style.color = '#ff6b4a';
      clientBadgeEl.style.borderColor = 'rgba(238, 77, 45, 0.4)';
    } else if (cLower.includes('tiktok')) {
      clientBadgeEl.style.background = 'rgba(15, 23, 42, 0.8)';
      clientBadgeEl.style.color = '#38bdf8';
      clientBadgeEl.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    } else if (cLower.includes('tokopedia')) {
      clientBadgeEl.style.background = 'rgba(34, 197, 94, 0.2)';
      clientBadgeEl.style.color = '#4ade80';
      clientBadgeEl.style.borderColor = 'rgba(34, 197, 94, 0.4)';
    } else {
      clientBadgeEl.style.background = 'rgba(168, 85, 247, 0.2)';
      clientBadgeEl.style.color = '#d8b4fe';
      clientBadgeEl.style.borderColor = 'rgba(168, 85, 247, 0.35)';
    }
  }

  if (stuckEl) {
    stuckEl.textContent = item.stuck || '0 Jam (1-12)';
  }

  // Role check: Tombol Cetak Label JFS hanya untuk super_admin dan admin
  const btnPrintOfficialPdf = document.getElementById('btnPrintWbOfficialPdf');
  if (btnPrintOfficialPdf) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const role = (user && user.role) ? String(user.role).toLowerCase().trim() : '';
    const isAdminOrSuperAdmin = role === 'super_admin' || role === 'admin';
    if (isAdminOrSuperAdmin) {
      btnPrintOfficialPdf.classList.remove('hidden');
      btnPrintOfficialPdf.style.display = 'inline-flex';
    } else {
      btnPrintOfficialPdf.classList.add('hidden');
      btnPrintOfficialPdf.style.display = 'none';
    }
  }

  // Problem / Refund / COD Banner (Tampilan elegan tanpa icon norak)
  if (alertBanner && alertBadges) {
    const alerts = [];
    if (item.is_problem) alerts.push('<span class="wb-alert-tag tag-problem">Paket Bermasalah</span>');
    if (item.is_refund) alerts.push('<span class="wb-alert-tag tag-refund">Refund / Retur</span>');
    if (item.is_cod) alerts.push('<span class="wb-alert-tag tag-cod">COD Tagihan</span>');

    if (alerts.length > 0) {
      alertBadges.innerHTML = alerts.join(' ');
      alertBanner.classList.remove('hidden');
    } else {
      alertBanner.classList.add('hidden');
      alertBadges.innerHTML = '';
    }
  }

  if (asalEl) asalEl.textContent = item.outlet_asal || '-';
  if (originCityEl) originCityEl.textContent = item.origin_city ? item.origin_city : 'Standard';
  if (tujuanEl) tujuanEl.textContent = item.outlet || '-';
  if (destCityEl) destCityEl.textContent = item.dest_city ? item.dest_city : 'Standard';

  if (weightKoliEl) {
    const w = parseFloat(item.weight) || 0;
    const k = parseInt(item.package_number, 10) || 1;
    weightKoliEl.textContent = `${w.toFixed(2)} kg • ${k} Koli`;
  }

  if (tlcEl) tlcEl.textContent = item.tlc || '-';
  if (tanggalEl) tanggalEl.textContent = formatDate(item.tanggal) || '-';
  if (scanInTimeEl) {
    scanInTimeEl.textContent = item.scan_in_time ? `Masuk: ${item.scan_in_time}` : (item.jam ? `Jam: ${item.jam}` : 'Waktu Scan: -');
  }

  if (barangEl) barangEl.textContent = item.nama_barang || '-';
  if (aksiEl) {
    aksiEl.textContent = item.aksi && item.aksi !== '-' ? item.aksi : 'Belum ada tindakan (Status Pending)';
    aksiEl.style.color = item.aksi && item.aksi !== '-' ? '#38bdf8' : '#94a3b8';
  }
  if (updatedByEl) updatedByEl.textContent = item.updated_by || 'System';
  if (updatedAtEl) {
    updatedAtEl.textContent = item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-';
  }

  // Draw Barcode on Canvas (Slim & Mobile-Optimized)
  const barcodeCanvas = document.getElementById('wbDetailBarcodeCanvas');
  if (barcodeCanvas && window.renderGlobalWaybillBarcode) {
    const isMobile = window.innerWidth <= 680;
    window.renderGlobalWaybillBarcode(barcodeCanvas, item.waybill, {
      width: isMobile ? 1.7 : 1.9,
      height: isMobile ? 36 : 42,
      fontSize: 12,
      margin: 4,
    });
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeWaybillDetailModal() {
  const modal = document.getElementById('waybillDetailModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentDetailWaybillItem = null;
}

function initWaybillDetailModalHandlers() {
  const modal = document.getElementById('waybillDetailModal');
  if (!modal) return;

  const closeBtn = document.getElementById('closeWaybillDetailBtn');
  const closeBottomBtn = document.getElementById('closeWaybillDetailBottomBtn');
  const btnCopyNo = document.getElementById('btnCopyWbDetailNumber');
  const btnCopyBarcode = document.getElementById('btnCopyWbDetailBarcode');
  const btnDownloadBarcode = document.getElementById('btnDownloadWbDetailBarcode');
  const btnCopyAll = document.getElementById('btnWbDetailCopyAll');
  const btnEditAction = document.getElementById('btnWbDetailEditAction');

  if (closeBtn) closeBtn.addEventListener('click', closeWaybillDetailModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeWaybillDetailModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeWaybillDetailModal();
  });

  if (btnCopyNo) {
    btnCopyNo.addEventListener('click', () => {
      if (currentDetailWaybillItem && currentDetailWaybillItem.waybill) {
        navigator.clipboard.writeText(currentDetailWaybillItem.waybill);
        showAppAlert(`📋 Resi ${currentDetailWaybillItem.waybill} disalin ke clipboard!`);
      }
    });
  }

  if (btnCopyBarcode) {
    btnCopyBarcode.addEventListener('click', async () => {
      const canvas = document.getElementById('wbDetailBarcodeCanvas');
      if (canvas && window.copyBarcodeImageToClipboard) {
        await window.copyBarcodeImageToClipboard(canvas, currentDetailWaybillItem?.waybill || 'Barcode');
      } else if (currentDetailWaybillItem?.waybill) {
        navigator.clipboard.writeText(currentDetailWaybillItem.waybill);
        showAppAlert(`📋 Resi ${currentDetailWaybillItem.waybill} disalin ke clipboard!`);
      }
    });
  }

  if (btnDownloadBarcode) {
    btnDownloadBarcode.addEventListener('click', () => {
      const canvas = document.getElementById('wbDetailBarcodeCanvas');
      if (canvas && window.downloadBarcodeCanvas) {
        window.downloadBarcodeCanvas(canvas, `barcode_${currentDetailWaybillItem?.waybill || 'resi'}.png`);
      }
    });
  }

  const btnPrintOfficialPdf = document.getElementById('btnPrintWbOfficialPdf');
  if (btnPrintOfficialPdf) {
    btnPrintOfficialPdf.addEventListener('click', async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      const role = (user && user.role) ? String(user.role).toLowerCase().trim() : '';
      if (role !== 'super_admin' && role !== 'admin') {
        showAppAlert('Akses dibatasi: Fitur cetak label resmi JFS hanya untuk Super Admin dan Admin.', true);
        return;
      }

      if (!currentDetailWaybillItem || !currentDetailWaybillItem.waybill) return;
      const wb = currentDetailWaybillItem.waybill;

      const origHtml = btnPrintOfficialPdf.innerHTML;
      btnPrintOfficialPdf.disabled = true;
      btnPrintOfficialPdf.innerHTML = `
        <svg class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Memuat PDF...</span>
      `;

      try {
        const token = getToken();
        const res = await fetch('/api/jfs/print-waybill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ waybillNo: wb, type: [4, 5] })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal membuat URL PDF dari server JFS');
        }

        if (json.pdfUrl) {
          window.open(json.pdfUrl, '_blank');
          showAppAlert(`Label PDF JFS untuk ${wb} berhasil dibuka.`);
        } else {
          throw new Error('Server JFS tidak mengembalikan URL PDF');
        }
      } catch (err) {
        showAppAlert(`Gagal mencetak label: ${err.message}`, true);
      } finally {
        btnPrintOfficialPdf.disabled = false;
        btnPrintOfficialPdf.innerHTML = origHtml;
      }
    });
  }

  if (btnCopyAll) {
    btnCopyAll.addEventListener('click', () => {
      if (!currentDetailWaybillItem) return;
      const d = currentDetailWaybillItem;
      const text = [
        `📦 DETAIL WAYBILL: ${d.waybill}`,
        `• Klien/Marketplace: ${d.client_name || 'JFS'}`,
        `• Tanggal: ${formatDate(d.tanggal)}`,
        `• Asal: ${d.outlet_asal || '-'} (${d.origin_city || '-'})`,
        `• Tujuan: ${d.outlet || '-'} (${d.dest_city || '-'})`,
        `• Berat / Koli: ${(parseFloat(d.weight) || 0).toFixed(2)} kg / ${d.package_number || 1} Koli`,
        `• TLC: ${d.tlc || '-'}`,
        `• Stuck: ${d.stuck || '-'}`,
        `• Status: ${d.status || 'Pending'}`,
        `• Tindakan/Aksi: ${d.aksi || '-'}`,
        `• Nama Barang: ${d.nama_barang || '-'}`,
        `• Scan In Gateway: ${d.scan_in_time || '-'}`,
        `• Diupdate Oleh: ${d.updated_by || 'System'}`
      ].join('\n');
      navigator.clipboard.writeText(text);
      showAppAlert('📋 Seluruh detail waybill berhasil disalin!');
    });
  }

  if (btnEditAction) {
    btnEditAction.addEventListener('click', () => {
      if (!currentDetailWaybillItem) return;
      const itemToEdit = currentDetailWaybillItem;
      closeWaybillDetailModal();
      openModal(isSudahUpdate(itemToEdit) ? 'edit' : 'update', itemToEdit);
    });
  }

  // Event delegation untuk link waybill di tabel
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.waybill-interactive-link');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      const wb = link.dataset.waybill;
      if (wb) openWaybillDetailModal(wb);
    }
  });
}

function initTableSortingAndColumnFilters() {
  const sortableHeaders = document.querySelectorAll('.monitoring-table th.sortable-th');
  sortableHeaders.forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (!col) return;

      if (currentSortColumn === col) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = col;
        currentSortDirection = 'asc';
      }

      sortableHeaders.forEach((otherTh) => {
        const ind = otherTh.querySelector('.sort-indicator');
        if (otherTh === th) {
          otherTh.classList.add('active-sort');
          if (ind) ind.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
        } else {
          otherTh.classList.remove('active-sort');
          if (ind) ind.textContent = '↕';
        }
      });

      applyFilter();
    });
  });

  const filterInputs = document.querySelectorAll('.col-filter-input, .col-filter-select');
  filterInputs.forEach((input) => {
    const handleFilterChange = () => {
      const col = input.dataset.col;
      const val = input.value.trim();
      if (val) {
        columnFilters[col] = val;
      } else {
        delete columnFilters[col];
      }
      applyFilter();
    };

    if (input.tagName === 'SELECT') {
      input.addEventListener('change', handleFilterChange);
    } else {
      input.addEventListener('input', handleFilterChange);
    }
  });

  const btnClearCols = document.getElementById('btnClearColumnFilters');
  if (btnClearCols) {
    btnClearCols.addEventListener('click', () => {
      filterInputs.forEach((input) => {
        input.value = '';
      });
      for (const k in columnFilters) {
        delete columnFilters[k];
      }
      applyFilter();
    });
  }
}

initWaybillDetailModalHandlers();
initTableSortingAndColumnFilters();

async function copyMonitoringAwbs() {
  const keyword = (searchInput?.value || '').trim();
  const tlcRaw = (tlcFilterInput?.value || '').trim();
  const selectTlc = (tlcFilter?.value || 'all');
  const hasColumnFilter = Object.keys(columnFilters || {}).some((k) => Boolean(String(columnFilters[k] || '').trim()));
  const isFiltered = Boolean(keyword || tlcRaw || selectTlc !== 'all' || currentStuckFilter || hasColumnFilter);

  // Jika sedang difilter/dicari: gunakan data hasil filter.
  // Jika tidak ada yang diketik dan tidak difilter: gunakan seluruh data monitoringData.
  const sourceList = isFiltered ? (currentFilteredMonitoringData || []) : (monitoringData || []);

  const awbs = [];
  const seen = new Set();
  sourceList.forEach((item) => {
    const wb = (item && item.waybill ? String(item.waybill).trim() : '');
    if (wb && !seen.has(wb)) {
      seen.add(wb);
      awbs.push(wb);
    }
  });

  if (awbs.length === 0) {
    if (typeof showAppAlert === 'function') {
      showAppAlert(
        isFiltered
          ? 'Tidak ada nomor AWB yang cocok dengan pencarian / filter saat ini.'
          : 'Tidak ada data AWB pada tabel monitoring untuk disalin.',
        true
      );
    }
    return;
  }

  const textToCopy = awbs.join('\n');
  let success = false;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      success = true;
    } catch (_) {
      success = false;
    }
  }

  if (!success) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (_) {
      success = false;
    }
  }

  if (success) {
    const btn = document.getElementById('copyMonitoringAwbBtn');
    const textSpan = document.getElementById('copyMonitoringAwbBtnText');
    if (btn) btn.classList.add('copied');
    if (textSpan) {
      const origText = textSpan.textContent;
      textSpan.textContent = `✓ Tersalin (${awbs.length})`;
      setTimeout(() => {
        textSpan.textContent = origText;
        if (btn) btn.classList.remove('copied');
      }, 2000);
    }

    const scopeDesc = isFiltered ? `hasil pencarian (${awbs.length} AWB)` : `seluruh data (${awbs.length} AWB)`;
    if (typeof showAppAlert === 'function') {
      showAppAlert(`Berhasil menyalin ${scopeDesc} ke clipboard! Siap di-paste ke Excel / WhatsApp.`, false);
    }
  } else {
    if (typeof showAppAlert === 'function') {
      showAppAlert('Gagal menyalin ke clipboard. Mohon izinkan akses clipboard pada browser Anda.', true);
    }
  }
}

function initCopyMonitoringAwbHandler() {
  const btn = document.getElementById('copyMonitoringAwbBtn');
  if (btn) {
    btn.removeEventListener('click', copyMonitoringAwbs);
    btn.addEventListener('click', copyMonitoringAwbs);
  }
}

window.copyMonitoringAwbs = copyMonitoringAwbs;

initCopyMonitoringAwbHandler();


