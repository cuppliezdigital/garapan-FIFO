const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const userPill = document.getElementById('userPill');
const tbody = document.getElementById('tabel-monitoring');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addBtn = document.getElementById('addBtn');
const statusFilter = document.getElementById('statusFilter');
const tlcFilter = document.getElementById('tlcFilter');
const tlcFilterInput = document.getElementById('tlcFilterInput');
const clearTlcBtn = document.getElementById('clearTlcBtn');
const toggleTlcDropdownBtn = document.getElementById('toggleTlcDropdownBtn');
const tlcDropdownMenu = document.getElementById('tlcDropdownMenu');
const tlcComboboxWrap = document.getElementById('tlcComboboxWrap');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const tlcQuickChipsBar = document.getElementById('tlcQuickChipsBar');
const tlcChipsContainer = document.getElementById('tlcChipsContainer');
const monitoringTotalBadge = document.getElementById('monitoringTotalBadge');
const selectedMonitoringCountBadge = document.getElementById('selectedMonitoringCountBadge');
const monitoringModal = document.getElementById('monitoringModal');
const monitoringForm = document.getElementById('monitoringForm');
const modalTitle = document.getElementById('modalTitle');
const actionSelect = document.getElementById('actionSelect');
const actionManual = document.getElementById('actionManual');
const adminControlPanel = document.getElementById('adminControlPanel');
const userPanel = document.getElementById('userPanel');
const historyPanel = document.getElementById('historyPanel');
const archivePanel = document.getElementById('archivePanel');
const monitoringPanel = document.getElementById('monitoringPanel');
const archiveTableBody = document.getElementById('archiveTableBody');
const archiveSearchInput = document.getElementById('archiveSearchInput');
const cardArchive = document.getElementById('card-archive');
const archiveCardCount = document.getElementById('archiveCardCount');
const selectAllArchive = document.getElementById('selectAllArchive');
const bulkArchiveBtn = document.getElementById('bulkArchiveBtn');
const restoreArchiveBtn = document.getElementById('restoreArchiveBtn');
const selectedArchiveCount = document.getElementById('selectedArchiveCount');
const selectedMonitoringArchiveCount = document.getElementById('selectedMonitoringArchiveCount');
const monitoringBulkControls = document.getElementById('monitoringBulkControls');
const selectedArchiveRestoreCount = document.getElementById('selectedArchiveRestoreCount');
const userTableBody = document.getElementById('userTableBody');
const historyTableBody = document.getElementById('historyTableBody');
const updatedCardCount = document.getElementById('updatedCardCount');
const bulkImportInput = document.getElementById('bulkImportInput');
const importBulkBtn = document.getElementById('importBulkBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
const toggleConfigPanelBtn = document.getElementById('toggleConfigPanelBtn');
const configPanel = document.getElementById('configPanel');
const configUserSelect = document.getElementById('configUserSelect');
const configRoleSelect = document.getElementById('configRoleSelect');
const saveRoleBtn = document.getElementById('saveRoleBtn');
const roleMessage = document.getElementById('roleMessage');
const configPermissionsList = document.getElementById('configPermissionsList');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const refreshConfigBtn = document.getElementById('refreshConfigBtn');
const createAccountBtn = document.getElementById('createAccountBtn');
const newAccountUsername = document.getElementById('newAccountUsername');
const newAccountFullName = document.getElementById('newAccountFullName');
const newAccountPassword = document.getElementById('newAccountPassword');
const newAccountRole = document.getElementById('newAccountRole');
const createAccountMessage = document.getElementById('createAccountMessage');
const credNewUsername = document.getElementById('credNewUsername');
const credNewPassword = document.getElementById('credNewPassword');
const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
const credentialsMessage = document.getElementById('credentialsMessage');
const permissionsMessage = document.getElementById('permissionsMessage');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const deleteAllMonitoringBtn = document.getElementById('deleteAllMonitoringBtn');
const toggleUserPanelBtn = document.getElementById('toggleUserPanelBtn');
const logoInput = document.getElementById('logoInput');
const uploadLogoBtn = document.getElementById('uploadLogoBtn');
const deleteLogoBtn = document.getElementById('deleteLogoBtn');
const adminLogoPreview = document.getElementById('adminLogoPreview');
const logoMessage = document.getElementById('logoMessage');
const bgInput = document.getElementById('bgInput');
const uploadBgBtn = document.getElementById('uploadBgBtn');
const deleteBgBtn = document.getElementById('deleteBgBtn');
const adminBgPreview = document.getElementById('adminBgPreview');
const bgMessage = document.getElementById('bgMessage');
const userSearchInput = document.getElementById('userSearchInput');
const selectAllUsers = document.getElementById('selectAllUsers');
const headerSelectAllUsers = document.getElementById('headerSelectAllUsers');
const bulkBlockUsersBtn = document.getElementById('bulkBlockUsers');
const bulkDeleteUsersBtn = document.getElementById('bulkDeleteUsers');
const exportAuditBtn = document.getElementById('exportAuditBtn');
const deleteAuditBtn = document.getElementById('deleteAuditBtn');
const auditSearchInput = document.getElementById('auditSearchInput');
const auditPanel = document.getElementById('auditPanel');
const auditTableBody = document.getElementById('auditTableBody');
const auditDetailModal = document.getElementById('auditDetailModal');
const auditDetailContent = document.getElementById('auditDetailContent');
const closeAuditDetailBtn = document.getElementById('closeAuditDetailBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const registerModal = document.getElementById('registerModal');
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const closeRegisterModalBtn = document.getElementById('closeRegisterModalBtn');
const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
const selectAllMonitoring = document.getElementById('selectAllMonitoring');
const bulkActionSelect = document.getElementById('bulkActionSelect');
const bulkActionManual = document.getElementById('bulkActionManual');
const bulkUpdateBtn = document.getElementById('bulkUpdateBtn');
const selectedMonitoringCount = document.getElementById('selectedMonitoringCount');
const monitoringPagination = document.getElementById('monitoringPagination');
const importProgressModal = document.getElementById('importProgressModal');
const importProgressTitle = document.getElementById('importProgressTitle');
const importProgressDetail = document.getElementById('importProgressDetail');
const importProgressBar = document.getElementById('importProgressBar');
const importProgressPercent = document.getElementById('importProgressPercent');
const importProgressRows = document.getElementById('importProgressRows');
const importProgressPulse = document.getElementById('importProgressPulse');
const importSummary = document.getElementById('importSummary');
const closeImportProgressBtn = document.getElementById('closeImportProgressBtn');
const appAlertModal = document.getElementById('appAlertModal');
const appAlertIcon = document.getElementById('appAlertIcon');
const appAlertTitle = document.getElementById('appAlertTitle');
const appAlertMessage = document.getElementById('appAlertMessage');
const appAlertClose = document.getElementById('appAlertClose');
const summarySkipped = document.getElementById('summarySkipped');
const summaryOverwritten = document.getElementById('summaryOverwritten');
const summaryDeleted = document.getElementById('summaryDeleted');
const summaryHistory = document.getElementById('summaryHistory');

// Router & Layout Elements
const appSidebar = document.getElementById('appSidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const pageTitle = document.getElementById('pageTitle');
const pageEyebrow = document.getElementById('pageEyebrow');

const viewPages = {
  monitoring: document.getElementById('viewMonitoring'),
  archive: document.getElementById('viewArchive'),
  history: document.getElementById('viewHistory'),
  users: document.getElementById('viewUsers'),
  permissions: document.getElementById('viewPermissions'),
  audit: document.getElementById('viewAudit'),
  settings: document.getElementById('viewSettings'),
};

const navLinks = {
  monitoring: document.getElementById('navMonitoring'),
  archive: document.getElementById('navArchive'),
  history: document.getElementById('navHistory'),
  users: document.getElementById('navUsers'),
  permissions: document.getElementById('navPermissions'),
  audit: document.getElementById('navAudit'),
  settings: document.getElementById('navSettings'),
};

function openMobileSidebar() {
  if (appSidebar) appSidebar.classList.add('is-open');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('is-open');
}

function closeMobileSidebar() {
  if (appSidebar) appSidebar.classList.remove('is-open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-open');
}

function handleHashRoute() {
  const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  const activeRoute = rawHash || 'monitoring';

  const routeConfig = {
    monitoring: { title: 'FIFO Dashboard', eyebrow: 'Monitoring System' },
    archive: { title: 'Arsip Waybill', eyebrow: 'Data Management' },
    history: { title: 'History Update', eyebrow: 'Riwayat Perubahan' },
    users: { title: 'Manajemen User', eyebrow: 'Administrasi Sistem' },
    permissions: { title: 'Konfigurasi Akses', eyebrow: 'Hak Akses Pengguna' },
    audit: { title: 'Audit Log', eyebrow: 'Keamanan Sistem' },
    settings: { title: 'Pengaturan Sistem', eyebrow: 'Konfigurasi & Branding' },
  };

  const target = routeConfig[activeRoute] ? activeRoute : 'monitoring';
  const meta = routeConfig[target];

  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageEyebrow) pageEyebrow.textContent = meta.eyebrow;

  Object.entries(viewPages).forEach(([key, element]) => {
    if (!element) return;
    if (key === target) {
      element.classList.remove('hidden');
      element.classList.add('active');
    } else {
      element.classList.add('hidden');
      element.classList.remove('active');
    }
  });

  Object.entries(navLinks).forEach(([key, link]) => {
    if (!link) return;
    link.classList.toggle('active', key === target);
  });

  // Fetch data sesuai view yang aktif
  if (target === 'monitoring') {
    if (!monitoringData.length) fetchMonitoring();
  } else if (target === 'archive') {
    fetchMonitoringArchive();
  } else if (target === 'history') {
    fetchMonitoringHistory();
  } else if (target === 'users') {
    fetchUsers();
  } else if (target === 'permissions') {
    fetchPermissionCatalog();
    fetchConfigUsers();
    if (selectedConfigUserId) loadConfigForUser(selectedConfigUserId);
  } else if (target === 'audit') {
    fetchAuditLogs();
  } else if (target === 'settings') {
    fetchAppLogo();
    fetchAppBackground();
  }

  closeMobileSidebar();
}

let monitoringData = [];
let userData = [];
let auditLogsData = [];
let monitoringHistoryData = [];
let selectedUserIds = new Set();
let editingWaybill = null;
const isFileProtocol = window.location.protocol === 'file:';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
let sessionTimer = null;
let selectedMonitoringWaybills = new Set();
let monitoringPage = 1;
let monitoringPageSize = 20;
let monitoringArchiveData = [];
let selectedArchiveWaybills = new Set();
let editingArchiveWaybill = null;
let currentAvailableTlcs = [];
let authUser = null;
let currentPermissions = {};
let permissionCatalog = [];
let configUsersList = [];
let selectedConfigUserId = null;

function showAppAlert(message) {
  if (!appAlertModal) return;
  const text = String(message || 'Terjadi sesuatu pada aplikasi.');
  const isError = /gagal|error|ditolak|tidak valid|wajib|belum/i.test(text);
  if (appAlertTitle) appAlertTitle.textContent = isError ? 'Proses belum berhasil' : 'Proses berhasil';
  if (appAlertMessage) appAlertMessage.textContent = text;
  if (appAlertIcon) {
    appAlertIcon.textContent = isError ? '!' : '✓';
    appAlertIcon.classList.toggle('error', isError);
  }
  appAlertModal.classList.remove('hidden');
  appAlertModal.setAttribute('aria-hidden', 'false');
  appAlertClose?.focus();
}

function closeAppAlert() {
  if (document.activeElement === appAlertClose) document.activeElement.blur();
  appAlertModal?.classList.add('hidden');
  appAlertModal?.setAttribute('aria-hidden', 'true');
}

window.alert = showAppAlert;

if (appAlertClose) appAlertClose.addEventListener('click', closeAppAlert);
if (appAlertModal) {
  appAlertModal.addEventListener('click', (event) => {
    if (event.target === appAlertModal) closeAppAlert();
  });
}

if (isFileProtocol) {
  console.warn('Aplikasi harus dibuka lewat local server, bukan file langsung. Gunakan http://localhost:3000');
}

function getToken() {
  return authUser ? 'cookie-session' : null;
}

function showLoginView() {
  if (loginView) loginView.classList.remove('hidden');
  if (dashboardView) dashboardView.classList.add('hidden');
}

function showDashboardView() {
  if (loginView) loginView.classList.add('hidden');
  if (dashboardView) dashboardView.classList.remove('hidden');
}

function getCurrentUser() {
  return authUser || JSON.parse(sessionStorage.getItem('monitoring_user') || '{}');
}

function setCurrentPermissions(permissions) {
  currentPermissions = {};
  if (Array.isArray(permissions)) {
    for (const p of permissions) currentPermissions[p.key] = Boolean(p.allowed);
  }
}

function hasPermission(key) {
  const role = getCurrentUser().role;
  if (role === 'super_admin') return true;
  return Boolean(currentPermissions[key]);
}

function applyUIPermissions() {
  const toggle = (el, show) => {
    if (!el) return;
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  };

  const role = getCurrentUser().role;

  toggle(toggleHistoryBtn, hasPermission('view_history'));
  toggle(deleteHistoryBtn, hasPermission('delete_history'));
  toggle(toggleConfigPanelBtn, hasPermission('access_config'));
  toggle(toggleUserPanelBtn, hasPermission('manage_users'));
  toggle(downloadTemplateBtn, hasPermission('download_template'));
  toggle(importBulkBtn, hasPermission('import_bulk'));
  toggle(deleteAllMonitoringBtn, hasPermission('delete_global'));

  // Sidebar navigation visibility
  const canManageUsers = hasPermission('manage_users');
  const canViewHistory = hasPermission('view_history');
  const canAccessConfig = hasPermission('access_config');
  const adminPermissions = ['import_bulk', 'view_history', 'delete_history', 'manage_users', 'access_config', 'download_template', 'delete_global'];
  const hasAdminPermission = role === 'super_admin' || role === 'admin' || adminPermissions.some((key) => hasPermission(key));

  toggle(navLinks.users, canManageUsers);
  toggle(navLinks.history, canViewHistory);
  toggle(navLinks.permissions, canAccessConfig);
  toggle(navLinks.audit, canViewHistory);
  toggle(navLinks.settings, hasAdminPermission);

  document.querySelectorAll('.nav-admin-item').forEach((el) => {
    if (el.classList.contains('nav-label-group')) {
      toggle(el, hasAdminPermission || canManageUsers || canAccessConfig || canViewHistory);
    }
  });

  document.querySelectorAll('.gm-only').forEach((el) => {
    if (role === 'super_admin') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  if (addBtn) {
    addBtn.style.display = hasPermission('import_bulk') ? '' : 'none';
  }

  if (role === 'client') {
    toggle(monitoringBulkControls, hasPermission('edit_monitoring'));
    toggle(bulkArchiveBtn, false);
    toggle(restoreArchiveBtn, false);
  }
}

function setAuthState() {
  const token = getToken();

  if (!token) {
    showLoginView();
    return;
  }

  showDashboardView();
  const user = getCurrentUser();
  const isSuperAdmin = user.role === 'super_admin';
  const isClient = user.role === 'client';

  if (userPill) {
    const roleLabel = user.role ? (isSuperAdmin ? '🔒 GM' : `(${user.role})`) : '';
    userPill.textContent = `${user.full_name || user.username || 'User'} ${roleLabel}`.trim();
    userPill.classList.toggle('is-super-admin', isSuperAdmin);
  }

  if (sidebarUserName) {
    sidebarUserName.textContent = user.full_name || user.username || 'User';
  }
  if (sidebarUserRole) {
    sidebarUserRole.textContent = isSuperAdmin ? 'Super Admin (GM)' : (user.role ? user.role.toUpperCase() : 'USER');
  }

  if (addBtn) {
    addBtn.style.display = 'none';
  }

  // Pastikan panel di dalam masing-masing view tidak terhalang .hidden internal
  if (monitoringPanel) monitoringPanel.classList.remove('hidden');
  if (archivePanel) archivePanel.classList.remove('hidden');
  if (historyPanel) historyPanel.classList.remove('hidden');
  if (userPanel) userPanel.classList.remove('hidden');
  if (configPanel) configPanel.classList.remove('hidden');
  if (auditPanel) auditPanel.classList.remove('hidden');
  if (adminControlPanel) adminControlPanel.classList.remove('hidden');

  const logoSections = document.querySelectorAll('.logo-admin-section');
  logoSections.forEach((section) => section.classList.toggle('hidden', !isSuperAdmin));

  if (monitoringBulkControls) {
    monitoringBulkControls.classList.toggle('hidden', !hasPermission('edit_monitoring'));
  }

  if (bulkArchiveBtn) bulkArchiveBtn.classList.toggle('hidden', isClient);
  if (restoreArchiveBtn) restoreArchiveBtn.classList.toggle('hidden', isClient);

  applyUIPermissions();
  handleHashRoute();

  fetchMonitoring();
  if (hasPermission('manage_users') || hasPermission('view_history')) {
    fetchUsers();
    fetchAuditLogs();
    fetchMonitoringHistory();
    fetchMonitoringArchive();
    fetchConfigUsers();
  } else if (!isClient) {
    fetchMonitoringArchive();
    if (hasPermission('access_config')) fetchConfigUsers();
  }
}

function logout() {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }

  authUser = null;
  sessionStorage.removeItem('monitoring_user');
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${getToken() || ''}` },
  }).catch(() => {});
  selectedUserIds = new Set();
  showLoginView();
}

function resetSessionTimer() {
  const token = getToken();
  if (!token) return;

  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    logout();
    if (loginMessage) {
      loginMessage.textContent = 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.';
      loginMessage.classList.add('error');
    }
    alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.');
  }, SESSION_TIMEOUT_MS);
}

async function parseResponseJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}

async function loginUser(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await parseResponseJson(response);

  if (!response.ok) {
    throw new Error(data.error || 'Login gagal');
  }

  authUser = data.user;
  sessionStorage.setItem('monitoring_user', JSON.stringify(data.user));

  try {
    const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
    if (meResponse.ok) {
      const meData = await meResponse.json();
      setCurrentPermissions(meData.permissions || []);
    } else {
      setCurrentPermissions([]);
    }
  } catch (error) {
    setCurrentPermissions([]);
  }

  setAuthState();
}

async function bootstrapAuth() {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  if (!response.ok) {
    showLoginView();
    return;
  }
  const data = await response.json();
  authUser = data.user;
  sessionStorage.setItem('monitoring_user', JSON.stringify(authUser));
  setCurrentPermissions(data.permissions || []);
  setAuthState();
}

function openModal(mode = 'create', item = null) {
  if (!monitoringModal) return;

  editingWaybill = mode === 'edit' ? item?.waybill || null : null;
  editingArchiveWaybill = mode === 'archive-edit' ? item?.waybill || null : null;
  modalTitle.textContent = mode === 'edit' || mode === 'archive-edit' ? 'Update Data Monitoring' : 'Tambah Data Monitoring';

  monitoringForm.reset();
  document.getElementById('status').value = 'Pending';
  if (actionManual) actionManual.classList.add('hidden');

  if ((mode === 'edit' || mode === 'archive-edit') && item) {
    const savedAction = item.aksi === '-' ? '' : (item.aksi || '');
    const actionOptions = Array.from(actionSelect?.options || []).map((option) => option.value);
    if (actionSelect && actionOptions.includes(savedAction)) {
      actionSelect.value = savedAction;
    } else if (actionSelect) {
      actionSelect.value = savedAction ? 'manual' : '';
      if (actionManual) actionManual.value = savedAction;
    }
    if (actionManual) actionManual.classList.toggle('hidden', actionSelect?.value !== 'manual');
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
    const year = fallback.getUTCFullYear();
    const month = String(fallback.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fallback.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

function syncStatusWithAction() {
  const statusInput = document.getElementById('status');
  if (!statusInput) return;

  const selectedAction = actionSelect?.value === 'manual'
    ? actionManual?.value.trim()
    : actionSelect?.value.trim();
  statusInput.value = selectedAction || 'Pending';
}

function renderStatusOverview(data) {
  const statusChart = document.getElementById('statusChart');
  if (!statusChart) return;

  const counts = {
    Open: 0,
    Pending: 0,
    Closed: 0,
  };

  data.forEach((item) => {
    const status = item.status || 'Open';
    if (counts[status] !== undefined) counts[status] += 1;
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
    tr.className = `${getUrgencyClass(item.stuck)}${isSudahUpdate(item) ? ' is-updated' : ''}`;
    const actionButtons = canMutate
      ? `
        <div class="action-group">
          <button type="button" class="table-btn update-btn" data-action="update" data-waybill="${item.waybill || ''}">UPDATE</button>
        </div>
      `
      : '<span class="read-only-label">Read only</span>';

    tr.innerHTML = `
      <td class="col-check" data-label="Pilih"><input type="checkbox" class="monitoring-select-checkbox" data-waybill="${item.waybill || ''}" ${selectedMonitoringWaybills.has(item.waybill) ? 'checked' : ''} /></td>
      <td class="col-waybill" data-label="Waybill"><strong class="cell-value">${highlightSearch(item.waybill || '-')}</strong></td>
      <td class="col-tanggal" data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(item.tanggal))}</span></td>
      <td class="col-outlet" data-label="Outlet"><span class="cell-value">${highlightSearch(item.outlet || '-')}</span></td>
      <td class="col-stuck" data-label="Stuck"><span class="cell-value"><span class="badge badge-stuck">${highlightSearch(item.stuck || 0)}</span></span></td>
      <td class="col-tlc" data-label="TLC"><span class="cell-value">${highlightSearch(item.tlc || '-')}</span></td>
      <td class="col-status" data-label="Status"><span class="cell-value"><span class="status ${item.status ? item.status.toLowerCase().replace(/\s+/g, '-') : 'open'}">${highlightSearch(item.status || 'Open')}</span></span></td>
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

function updateSelectedMonitoringCount() {
  if (selectedMonitoringCount) selectedMonitoringCount.textContent = selectedMonitoringWaybills.size;
  if (selectedMonitoringArchiveCount) selectedMonitoringArchiveCount.textContent = selectedMonitoringWaybills.size;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = selectedMonitoringWaybills.size === 0;
  const count = selectedMonitoringWaybills.size;
  if (selectedMonitoringCount) selectedMonitoringCount.textContent = count;
  if (selectedMonitoringArchiveCount) selectedMonitoringArchiveCount.textContent = count;
  if (selectedMonitoringCountBadge) selectedMonitoringCountBadge.textContent = count;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = count === 0;
  refreshBulkActionButtonState();
  monitoringBulkControls?.classList.toggle('has-selection', selectedMonitoringWaybills.size > 0);
  monitoringBulkControls?.classList.toggle('has-selection', count > 0);
}

function refreshBulkActionButtonState() {
  if (!bulkUpdateBtn) return;
  const hasSelection = selectedMonitoringWaybills.size > 0;
  const selectedValue = bulkActionSelect?.value || '';
  const manualValue = (bulkActionManual?.value || '').trim();
  const hasAction = (selectedValue === 'manual' ? manualValue : selectedValue).length > 0
    && selectedValue !== ''
    && !(selectedValue === 'manual' && !manualValue);
  bulkUpdateBtn.disabled = !(hasSelection && hasAction);
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

function matchesStuckFilter(item, filter) {
  if (filter === 'updated') return isSudahUpdate(item);

  if (isSudahUpdate(item)) return false;
  const stuck = String(item.stuck || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (filter === '48-60') return /^(?:4\.\s*)?48 jam - 60 jam$/.test(stuck);
  if (filter === '48-72') return /^(?:5\.\s*)?48 jam - 72 jam$/.test(stuck);
  if (filter === '72-up') return /^(?:6\.\s*)?72(?: jam)? up$/.test(stuck);
  return true;
}

function getUrgencyClass(stuckValue) {
  const stuck = String(stuckValue || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (/^(?:4\.\s*)?48 jam - 60 jam$/.test(stuck)) return 'urgency-48-60';
  if (/^(?:5\.\s*)?48 jam - 72 jam$/.test(stuck)) return 'urgency-48-72';
  if (/^(?:6\.\s*)?72(?: jam)? up$/.test(stuck)) return 'urgency-72-up';
  return 'urgency-normal';
}

function updateStats(data) {
  const totalDataEl = document.getElementById('totalData');
  const count48_60 = document.getElementById('count-48-60');
  const count48_72 = document.getElementById('count-48-72');
  const count72_up = document.getElementById('count-72-up');

  if (!totalDataEl) return;

  totalDataEl.textContent = data.length;

  if (updatedCardCount) {
    const updatedCount = data.filter(isSudahUpdate).length;
    updatedCardCount.textContent = updatedCount;
  }

  if (count48_60) {
    count48_60.textContent = data.filter(item => {
      return matchesStuckFilter(item, '48-60');
    }).length;
  }

  if (count48_72) {
    count48_72.textContent = data.filter(item => {
      return matchesStuckFilter(item, '48-72');
    }).length;
  }

  if (count72_up) {
    count72_up.textContent = data.filter(item => {
      return matchesStuckFilter(item, '72-up');
    }).length;
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

  document.querySelectorAll('.summary-strip .stat-card').forEach((card) => {
    card.classList.remove('is-active');
  });

  if (tlcChipsContainer) {
    tlcChipsContainer.querySelectorAll('.tlc-chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.tlc === 'all');
    });
  }

  monitoringPage = 1;
  applyFilter();
}

// Tambahkan event listeners untuk card di akhir file atau setelah DOM load
function initCardFilters() {
  const cards = [
    { id: 'card-total', filter: null },
    { id: 'card-updated', filter: 'updated' },
    { id: 'card-48-60', filter: '48-60' },
    { id: 'card-48-72', filter: '48-72' },
    { id: 'card-72-up', filter: '72-up' }
  ];

  cards.forEach((card) => document.getElementById(card.id)?.classList.remove('is-active'));

  cards.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) {
      el.addEventListener('click', () => {
        monitoringPanel?.classList.remove('hidden');
        historyPanel?.classList.add('hidden');
        archivePanel?.classList.add('hidden');
        cardArchive?.classList.remove('is-active');
        // Toggle filter jika card yang sama diklik ulang.
        const isSameCard = activeSummaryCardId === c.id;
        currentStuckFilter = isSameCard ? null : c.filter;
        activeSummaryCardId = isSameCard ? null : c.id;
        
        // Kasih efek visual dikit biar ketauan mana yang aktif
        cards.forEach(card => {
            const cardEl = document.getElementById(card.id);
          if (cardEl) cardEl.classList.toggle('is-active', activeSummaryCardId === card.id);
        });

        applyFilter();
      });
    }
  });
}

initCardFilters();

  const card48_60 = document.getElementById('card-48-60');
  const card48_72 = document.getElementById('card-48-72');
  const card72_up = document.getElementById('card-72-up');

  if (card48_60) card48_60.style.cursor = 'pointer';
  if (card48_72) card48_72.style.cursor = 'pointer';
  if (card72_up) card72_up.style.cursor = 'pointer';


async function fetchMonitoring() {
  const token = getToken();
  if (!token) {
    showLoginView();
    return;
  }

  const response = await fetch('/api/monitoring', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      return;
    }

    throw new Error('Gagal mengambil data');
  }

  const data = await response.json();
  monitoringData = data;
  populateTlcFilters(data);
  renderTable(data);
  renderStatusOverview(data);
  updateStats(data);
  if (monitoringTotalBadge) monitoringTotalBadge.textContent = `${data.length} Data`;
}

function renderUserTable(users) {
  if (!userTableBody) return;

  userTableBody.innerHTML = '';

  if (!users.length) {
    userTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada user.</td></tr>';
    return;
  }

  const viewer = getCurrentUser();
  const isViewerSuperAdmin = viewer.role === 'super_admin';

  users.forEach((user) => {
    const row = document.createElement('tr');
    const isBlocked = (user.status || 'active') === 'blocked';
    const currentUserId = Number(viewer.id || 0);
    const isSelf = Number(user.id) === currentUserId;
    const canManage = !isSelf && user.role !== 'super_admin';
    const canPromote = isViewerSuperAdmin && !isSelf && user.role === 'user';
    const selected = selectedUserIds.has(Number(user.id));
    const roleDisplay = user.role === 'super_admin'
      ? '<span class="role-badge role-badge-super">🔒 GM</span>'
      : (user.role || 'user');

    row.innerHTML = `
      <td><input type="checkbox" class="user-select-checkbox" data-user-id="${user.id}" ${selected ? 'checked' : ''} ${canManage ? '' : 'disabled'} /></td>
      <td>${user.id}</td>
      <td>${user.username || '-'}</td>
      <td>${user.full_name || '-'}</td>
      <td>${roleDisplay}</td>
      <td><span class="status ${isBlocked ? 'closed' : 'open'}">${isBlocked ? 'Blocked' : 'Active'}</span></td>
      <td>
        <div class="action-group">
          ${isSelf ? '<span class="read-only-label">You</span>' : ''}
          ${canManage ? `<button type="button" class="table-btn" data-user-action="toggle-status" data-user-id="${user.id}" data-status="${isBlocked ? 'active' : 'blocked'}">${isBlocked ? 'Unblock' : 'Block'}</button>` : ''}
          ${canManage && isViewerSuperAdmin ? `<button type="button" class="table-btn delete-btn" data-user-action="delete-user" data-user-id="${user.id}">Delete</button>` : ''}
          ${canPromote ? `<button type="button" class="table-btn promote-btn" data-user-action="promote-admin" data-user-id="${user.id}">Promote Admin</button>` : ''}
        </div>
      </td>
    `;
    userTableBody.appendChild(row);
  });

  if (headerSelectAllUsers) {
    const visibleIds = users.map((user) => Number(user.id));
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.has(id));
    headerSelectAllUsers.checked = allVisibleSelected;
    if (selectAllUsers) selectAllUsers.checked = allVisibleSelected;
  }
}

function applyUserFilter() {
  const keyword = (userSearchInput?.value || '').trim().toLowerCase();
  if (!userData.length) return;

  const filtered = !keyword
    ? userData
    : userData.filter((user) => {
        const haystack = [user.username, user.full_name, user.role, user.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      });

  renderUserTable(filtered);
}

async function fetchUsers() {
  const token = getToken();
  if (!token) return;

  const response = await fetch('/api/auth/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      return;
    }

    return;
  }

  const users = await response.json();
  userData = (users || []).filter((user) => user.role !== 'super_admin' || getCurrentUser().role === 'super_admin');
  applyUserFilter();
  updateStats(monitoringData);
}

function renderAuditLogs(logs) {
  if (!auditTableBody) return;

  auditTableBody.innerHTML = '';

  if (!logs.length) {
    auditTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada log audit.</td></tr>';
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement('tr');
    const details = log.details ? JSON.stringify(log.details) : '';
    row.dataset.logId = log.id;
    row.innerHTML = `
      <td>${log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</td>
      <td>${log.username || '-'}</td>
      <td>${log.details?.actorRole || '-'}</td>
      <td>${log.action || '-'}</td>
      <td>${log.entity_type || log.entityType || '-'}</td>
      <td title="${details}">${details ? details.slice(0, 80) + (details.length > 80 ? '...' : '') : '-'}</td>
    `;
    auditTableBody.appendChild(row);
  });
}

function renderMonitoringHistory(rows) {
  if (!historyTableBody) return;

  historyTableBody.innerHTML = '';

  if (!rows.length) {
    historyTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data di history.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Waybill"><span class="cell-value">${highlightSearch(row.waybill || '-')}</span></td>
      <td data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(row.tanggal))}</span></td>
      <td data-label="Outlet"><span class="cell-value">${highlightSearch(row.outlet || '-')}</span></td>
      <td data-label="Status"><span class="cell-value"><span class="status ${String(row.status || 'Open').toLowerCase().replace(/\s+/g, '-')}">${row.status || 'Open'}</span></span></td>
      <td data-label="Aksi"><span class="cell-value">${highlightSearch(row.aksi || '-')}</span></td>
      <td data-label="Updated By"><span class="cell-value">${highlightSearch(row.updated_by || '-')}</span></td>
      <td data-label="Archived At"><span class="cell-value">${row.archived_at ? new Date(row.archived_at).toLocaleString('id-ID') : '-'}</span></td>
    `;
    historyTableBody.appendChild(tr);
  });
}

function renderMonitoringArchive(rows) {
  if (!archiveTableBody) return;
  const keyword = (archiveSearchInput?.value || '').trim().toLowerCase();
  const filtered = rows.filter((row) => [row.waybill, row.outlet, row.nama_barang, row.status, row.aksi].filter(Boolean).join(' ').toLowerCase().includes(keyword));
  archiveTableBody.innerHTML = filtered.length ? filtered.map((row) => `
    <tr>
      <td class="col-check" data-label="Pilih"><input type="checkbox" class="archive-select-checkbox" data-waybill="${row.waybill}" ${selectedArchiveWaybills.has(row.waybill) ? 'checked' : ''}></td>
      <td class="col-waybill" data-label="Waybill"><span class="cell-value">${highlightSearch(row.waybill || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-tanggal" data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(row.tanggal), archiveSearchInput?.value)}</span></td>
      <td class="col-outlet" data-label="Outlet"><span class="cell-value">${highlightSearch(row.outlet || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-stuck" data-label="Stuck"><span class="cell-value">${highlightSearch(row.stuck || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-status" data-label="Status"><span class="cell-value">${highlightSearch(row.status || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-aksi-text" data-label="Aksi"><span class="cell-value">${highlightSearch(row.aksi || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-updated" data-label="Updated By"><span class="cell-value">${highlightSearch(row.updated_by || '-', archiveSearchInput?.value)}</span></td>
      <td class="col-aksi" data-label="Update"><button type="button" class="table-btn update-btn archive-update-btn" data-waybill="${row.waybill}">UPDATE</button></td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty-state">Belum ada arsip waybill.</td></tr>';
  if (archiveCardCount) archiveCardCount.textContent = rows.length;
  updateArchiveSelectionCount();
}

function updateArchiveSelectionCount() {
  if (selectedArchiveCount) selectedArchiveCount.textContent = selectedArchiveWaybills.size;
  if (selectedArchiveRestoreCount) selectedArchiveRestoreCount.textContent = selectedArchiveWaybills.size;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = selectedMonitoringWaybills.size === 0;
  if (restoreArchiveBtn) restoreArchiveBtn.disabled = selectedArchiveWaybills.size === 0;
}

async function fetchMonitoringArchive() {
  const response = await fetch('/api/monitoring/archive', { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) return;
  monitoringArchiveData = await response.json();
  renderMonitoringArchive(monitoringArchiveData);
}

async function moveSelectedToArchive() {
  const waybills = [...selectedMonitoringWaybills];
  if (!waybills.length) return alert('Pilih data yang ingin diarsipkan.');
  const response = await fetch('/api/monitoring/archive', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ waybills }) });
  const result = await parseResponseJson(response);
  if (!response.ok) return alert(result.error || 'Gagal mengarsipkan data');
  selectedMonitoringWaybills.clear();
  await fetchMonitoring();
  await fetchMonitoringArchive();
  alert(`${result.archivedCount || 0} waybill berhasil diarsipkan.`);
}

async function restoreSelectedArchive() {
  const waybills = [...selectedArchiveWaybills];
  if (!waybills.length) return alert('Pilih arsip yang ingin dipulihkan.');
  const response = await fetch('/api/monitoring/archive/restore', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ waybills }) });
  const result = await parseResponseJson(response);
  if (!response.ok) return alert(result.error || 'Gagal memulihkan arsip');
  selectedArchiveWaybills.clear();
  await fetchMonitoring();
  await fetchMonitoringArchive();
  alert(`${result.restoredCount || 0} waybill berhasil dipulihkan.`);
}

function applyAuditFilter() {
  const keyword = (auditSearchInput?.value || '').trim().toLowerCase();
  if (!auditLogsData.length) return;

  const filtered = !keyword
    ? auditLogsData
    : auditLogsData.filter((log) => {
        const detailText = log.details ? JSON.stringify(log.details).toLowerCase() : '';
        const haystack = [
          log.username,
          log.action,
          log.entity_type,
          log.entityType,
          log.details?.actorRole,
          detailText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      });

  renderAuditLogs(filtered);
}

async function fetchAuditLogs() {
  const token = getToken();
  if (!token) return;

  const response = await fetch('/api/audit', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      return;
    }

    return;
  }

  const logs = await response.json();
  auditLogsData = logs || [];
  applyAuditFilter();
}

async function deleteAllAuditLogs() {
  const token = getToken();
  if (!token || getCurrentUser().role !== 'admin') return;

  const confirmed = window.confirm('PERINGATAN: semua audit log akan dihapus permanen dan tidak dapat dikembalikan. Lanjutkan?');
  if (!confirmed) return;

  const response = await fetch('/api/audit', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await parseResponseJson(response);

  if (!response.ok) {
    if (response.status === 401) logout();
    alert(result.error || 'Gagal menghapus semua audit log');
    return;
  }

  alert(`Berhasil menghapus permanen ${result.deletedCount || 0} log.`);
  await fetchAuditLogs();
}

async function fetchMonitoringHistory() {
  const token = getToken();
  if (!token) return;

  const response = await fetch('/api/monitoring/history', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      return;
    }
    return;
  }

  const data = await response.json();
  monitoringHistoryData = data || [];
  renderMonitoringHistory(monitoringHistoryData);
}

async function deleteAllMonitoringHistory() {
  const token = getToken();
  if (!token || getCurrentUser().role !== 'admin') return;

  const confirmed = window.confirm('Yakin mau menghapus semua history arsip? Data yang dihapus tidak dapat dikembalikan.');
  if (!confirmed) return;

  const response = await fetch('/api/monitoring/history', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await parseResponseJson(response);

  if (!response.ok) {
    if (response.status === 401) logout();
    alert(result.error || 'Gagal menghapus semua history');
    return;
  }

  alert(`Berhasil menghapus ${result.deletedCount || 0} history.`);
  await fetchMonitoringHistory();
  await fetchAuditLogs();
}

function downloadImportTemplate() {
  const header = ['Waybill', 'Tanggal', 'Outlet', 'Stuck', 'TLC', 'NamaBarang'];
  const sampleRow = ['WB12345', '2026-08-30', 'Outlet A', '2', 'TLC-001', 'Nama Barang'];
  const csv = [header, sampleRow].map((row) => row.map(escapeCsvValue).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template_monitoring.csv';
  link.click();
  URL.revokeObjectURL(url);
}

async function handleBulkImport(file) {
  if (!file) return;

  setImportProgress(4, 'Membaca file...', 'Menganalisis isi data', 0, false);
  const text = await file.text();
  const rows = parseMonitoringCsv(text);

  if (!rows.length) {
    hideImportProgress();
    alert('Format file tidak valid. Gunakan template yang sudah disediakan.');
    return;
  }

  const token = getToken();
  setImportProgress(8, 'Menyiapkan data...', `${rows.length.toLocaleString('id-ID')} baris siap dikirim`, rows.length, false);
  let response;
  try {
    response = await uploadImportWithProgress(rows, token);
  } catch (error) {
    hideImportProgress();
    alert(error.message || 'Import gagal karena koneksi terputus');
    return;
  }

  const result = await parseResponseJson(response);
  if (!response.ok) {
    hideImportProgress();
    alert(result.error || 'Import gagal');
    return;
  }

  setImportProgress(100, 'Import selesai', `${result.importedCount || 0} data berhasil diproses oleh server`, result.importedCount || rows.length, false);
  showImportSummary(result);
  await fetchMonitoring();
  if (hasPermission('view_history')) {
    await fetchMonitoringHistory();
  }
}

function setImportProgress(percent, title, detail, rowCount, processing) {
  importProgressModal?.classList.remove('hidden');
  if (importProgressTitle) importProgressTitle.textContent = title;
  if (importProgressDetail) importProgressDetail.textContent = detail;
  if (importProgressBar) {
    importProgressBar.style.width = `${percent}%`;
    importProgressBar.classList.toggle('is-processing', processing);
  }
  if (importProgressPercent) importProgressPercent.textContent = `${Math.round(percent)}%`;
  if (importProgressRows) importProgressRows.textContent = `${Number(rowCount || 0).toLocaleString('id-ID')} data`;
  importProgressPulse?.classList.toggle('hidden', !processing);
}

function showImportSummary(result) {
  importSummary?.classList.remove('hidden');
  closeImportProgressBtn?.classList.remove('hidden');
  if (summarySkipped) summarySkipped.textContent = Number(result.skippedCount || 0).toLocaleString('id-ID');
  if (summaryOverwritten) summaryOverwritten.textContent = Number(result.overwrittenCount || 0).toLocaleString('id-ID');
  if (summaryDeleted) summaryDeleted.textContent = Number(result.deletedCount || 0).toLocaleString('id-ID');
  if (summaryHistory) summaryHistory.textContent = Number(result.historyCount || 0).toLocaleString('id-ID');
}

function hideImportProgress() {
  importProgressModal?.classList.add('hidden');
  importSummary?.classList.add('hidden');
  closeImportProgressBtn?.classList.add('hidden');
}

function uploadImportWithProgress(rows, token) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/monitoring/import');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      const percent = 8 + (event.loaded / event.total) * 72;
      setImportProgress(percent, 'Mengirim data...', `Upload ${(event.loaded / 1024 / 1024).toFixed(1)} / ${(event.total / 1024 / 1024).toFixed(1)} MB`, rows.length, false);
    });
    request.upload.addEventListener('load', () => {
      setImportProgress(82, 'Memproses data...', 'Server sedang menyimpan dan mencocokkan data', rows.length, true);
    });
    request.addEventListener('load', () => resolve(new Response(request.responseText, { status: request.status, statusText: request.statusText })));
    request.addEventListener('error', () => reject(new Error('Koneksi import gagal')));
    request.send(JSON.stringify({ rows }));
  });
}

if (closeImportProgressBtn) closeImportProgressBtn.addEventListener('click', hideImportProgress);

function parseMonitoringCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
  const parseLine = (line) => {
    const cells = [];
    let current = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"' && insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = !insideQuotes;
      } else if (character === delimiter && !insideQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += character;
      }
    }

    cells.push(current.trim());
    return cells;
  };

  const parseStuckValue = (value) => String(value ?? '').trim() || '0';

  const rows = [];
  const headers = parseLine(lines[0]).map((header) => header.toLowerCase().replace(/[\s_]+/g, '').replace(/\uFEFF/g, ''));
  const headerIndex = (names) => headers.findIndex((header) => names.includes(header));
  const waybillIndex = headerIndex(['waybill', 'awb', 'resi']);
  const tanggalIndex = headerIndex(['tanggal', 'date']);
  const outletIndex = headerIndex(['outlet', 'outletname']);
  const stuckIndex = headers.findIndex((header) => header.includes('stuck') || header.includes('aging'));
  const tlcIndex = headerIndex(['tlc']);
  const namaBarangIndex = headerIndex(['namabarang', 'barang', 'product']);

  if (waybillIndex < 0 || stuckIndex < 0) return [];

  for (let i = 1; i < lines.length; i += 1) {
    const raw = parseLine(lines[i]);
    if (raw.length <= Math.max(waybillIndex, stuckIndex)) continue;

    const waybill = raw[waybillIndex];
    const tanggal = tanggalIndex >= 0 ? raw[tanggalIndex] : '';
    const outlet = outletIndex >= 0 ? raw[outletIndex] : '-';
    const stuck = raw[stuckIndex];
    const tlc = tlcIndex >= 0 ? raw[tlcIndex] : '-';
    const namaBarang = namaBarangIndex >= 0 ? raw[namaBarangIndex] : '-';
    if (!waybill) continue;

    const normalizedStuck = parseStuckValue(stuck);
    rows.push({
      waybill,
      tanggal,
      outlet,
      stuck: normalizedStuck,
      tlc: tlc || '-',
      status: 'Pending',
      aksi: '-',
      nama_barang: namaBarang || '-',
      updated_by: 'System',
    });
  }

  return rows;
}

async function deleteAllMonitoringData() {
  const token = getToken();
  const totalData = monitoringData.length;
  const confirmed = window.confirm(
    `PERINGATAN: ${totalData} data monitoring aktif akan dihapus permanen dan tidak dapat dikembalikan. Lanjutkan?`
  );
  if (!confirmed) return;

  const response = await fetch('/api/monitoring/all', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await parseResponseJson(response);
  if (!response.ok) {
    alert(result.error || 'Gagal menghapus semua data');
    return;
  }

  alert(`Berhasil menghapus permanen ${result.deletedCount || 0} data monitoring.`);
  await fetchMonitoring();
  await fetchAuditLogs();
}

async function saveMonitoring(event) {
  event.preventDefault();

  const token = getToken();
  if (!token) {
    logout();
    return;
  }

  const existingItem = editingArchiveWaybill
    ? monitoringArchiveData.find((item) => item.waybill === editingArchiveWaybill)
    : (editingWaybill ? monitoringData.find((item) => item.waybill === editingWaybill) : null);
  const existingTanggal = normalizeDateString(existingItem?.tanggal);
  const payload = {
    waybill: editingArchiveWaybill || editingWaybill || '',
    tanggal: existingTanggal,
    outlet: existingItem?.outlet || '-',
    stuck: existingItem?.stuck ?? '0',
    tlc: existingItem?.tlc || '-',
    status: document.getElementById('status').value || 'Pending',
    aksi: actionSelect?.value === 'manual'
      ? actionManual.value.trim()
      : actionSelect?.value || '-',
    nama_barang: existingItem?.nama_barang || '-',
    updated_by: existingItem?.updated_by || 'System',
  };

  const isArchiveEdit = Boolean(editingArchiveWaybill);
  const isEdit = Boolean(editingWaybill);
  const url = isArchiveEdit
    ? `/api/monitoring/archive/${encodeURIComponent(editingArchiveWaybill)}`
    : (isEdit ? `/api/monitoring/${encodeURIComponent(editingWaybill)}` : '/api/monitoring');
  const method = isEdit ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    alert(result.error || 'Gagal menyimpan data monitoring');
    return;
  }

  closeModal();
  await fetchMonitoring();
  if (isArchiveEdit) await fetchMonitoringArchive();
  if (hasPermission('view_history')) {
    await fetchAuditLogs();
  }
}

async function handleBulkMonitoringUpdate() {
  const selectedValue = bulkActionSelect?.value || '';
  const manualValue = (bulkActionManual?.value || '').trim();
  const aksiRaw = selectedValue === 'manual' ? manualValue : selectedValue;
  const aksi = aksiRaw.trim();
  const waybills = [...selectedMonitoringWaybills];

  if (!waybills.length) {
    alert('Pilih minimal 1 data monitoring terlebih dahulu.');
    if (bulkUpdateBtn) bulkUpdateBtn.disabled = true;
    return;
  }

  if (!aksi || aksi === '-' || selectedValue === '') {
    alert('Pilih aksi dari dropdown terlebih dahulu. Update dibatalkan.');
    if (bulkActionSelect) {
      bulkActionSelect.focus();
      bulkActionSelect.classList.add('input-error');
      setTimeout(() => bulkActionSelect.classList.remove('input-error'), 1800);
    }
    return;
  }

  if (selectedValue === 'manual' && !manualValue) {
    alert('Ketik aksi manual terlebih dahulu. Update dibatalkan.');
    bulkActionManual?.focus();
    bulkActionManual?.classList.add('input-error');
    setTimeout(() => bulkActionManual?.classList.remove('input-error'), 1800);
    return;
  }

  const confirmed = window.confirm(`Update ${waybills.length} data dengan aksi "${aksi}"?`);
  if (!confirmed) return;

  const response = await fetch('/api/monitoring/bulk-update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ waybills, aksi }),
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    alert(result.error || 'Bulk update gagal');
    return;
  }

  selectedMonitoringWaybills.clear();
  if (bulkActionSelect) bulkActionSelect.value = '';
  if (bulkActionManual) {
    bulkActionManual.value = '';
    bulkActionManual.classList.add('hidden');
  }
  alert(`${result.updatedCount || 0} data berhasil diupdate.`);
  await fetchMonitoring();
  await fetchAuditLogs();
}

async function handleTableAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const waybill = button.dataset.waybill;
  const action = button.dataset.action;

  const user = getCurrentUser();

  if (action === 'update' || action === 'edit') {
    const item = monitoringData.find((entry) => entry.waybill === waybill);
    if (item) openModal('edit', item);
    return;
  }

  if (action === 'delete') {
    if (user.role !== 'admin') {
      alert('Akses ditolak. Hanya admin yang dapat menghapus data monitoring.');
      return;
    }

    const confirmed = window.confirm(`Hapus data waybill ${waybill}?`);
    if (!confirmed) return;

    const token = getToken();
    const response = await fetch(`/api/monitoring/${encodeURIComponent(waybill)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Gagal menghapus data');
      return;
    }

    await fetchMonitoring();
    if (hasPermission('view_history')) {
      await fetchAuditLogs();
    }
  }
}

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportMonitoringCsv() {
  const visibleRows = monitoringData;

  if (!visibleRows.length) {
    alert('Belum ada data monitoring untuk diekspor.');
    return;
  }

  const headers = ['Waybill', 'Tanggal', 'Outlet', 'Stuck', 'TLC', 'Status', 'Aksi', 'Nama Barang', 'Updated By'];
  const rows = visibleRows.map((item) => [
    item.waybill || '',
    item.tanggal || '',
    item.outlet || '',
    item.stuck || 0,
    item.tlc || '',
    item.status || 'Open',
    item.aksi || '',
    item.nama_barang || '',
    item.updated_by || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'monitoring_fifo.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openAuditDetail(log) {
  if (!auditDetailModal || !auditDetailContent) return;

  const details = log.details || {};
  const detailMarkup = `
    <div class="detail-grid">
      <div><span>Time</span><strong>${log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</strong></div>
      <div><span>User</span><strong>${log.username || '-'}</strong></div>
      <div><span>Role</span><strong>${details.actorRole || '-'}</strong></div>
      <div><span>Action</span><strong>${log.action || '-'}</strong></div>
      <div><span>Entity</span><strong>${log.entity_type || log.entityType || '-'}</strong></div>
      <div><span>Entity ID</span><strong>${log.entity_id || '-'}</strong></div>
    </div>
    <div class="detail-json">
      <h4>Detail Payload</h4>
      <pre>${JSON.stringify(details, null, 2)}</pre>
    </div>
  `;

  auditDetailContent.innerHTML = detailMarkup;
  auditDetailModal.classList.remove('hidden');
  auditDetailModal.setAttribute('aria-hidden', 'false');
}

function closeAuditDetail() {
  if (!auditDetailModal) return;
  auditDetailModal.classList.add('hidden');
  auditDetailModal.setAttribute('aria-hidden', 'true');
}

async function exportAuditLogs() {
  if (!auditLogsData.length) {
    alert('Belum ada log audit untuk diekspor.');
    return;
  }

  const headers = ['Waktu', 'User', 'Role', 'Aksi', 'Entity', 'Detail'];
  const rows = auditLogsData.map((log) => [
    log.created_at || '-',
    log.username || '-',
    log.details?.actorRole || '-',
    log.action || '-',
    log.entity_type || log.entityType || '-',
    JSON.stringify(log.details || {}),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit_log.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleBulkUserAction(action) {
  const ids = [...selectedUserIds];
  if (!ids.length) {
    alert('Pilih minimal satu user untuk diproses.');
    return;
  }

  const token = getToken();
  if (!token) {
    logout();
    return;
  }

  const isDelete = action === 'delete';
  const confirmed = isDelete
    ? window.confirm(`Hapus ${ids.length} user yang dipilih?`)
    : window.confirm(`Block ${ids.length} user yang dipilih?`);

  if (!confirmed) return;

  for (const userId of ids) {
    if (Number(userId) === Number(getCurrentUser().id)) continue;

    if (isDelete) {
      await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      continue;
    }

    await fetch(`/api/auth/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'blocked' }),
    });
  }

  selectedUserIds = new Set();
  if (headerSelectAllUsers) headerSelectAllUsers.checked = false;
  if (selectAllUsers) selectAllUsers.checked = false;
  await fetchUsers();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isFileProtocol) {
      loginMessage.textContent = 'Buka aplikasi melalui http://localhost:3000, bukan file HTML langsung.';
      loginMessage.classList.add('error');
      return;
    }

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      loginMessage.textContent = 'Memproses login...';
      loginMessage.classList.remove('error');
      await loginUser(username, password);
      resetSessionTimer();
    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.classList.add('error');
    }
  });
}

if (showRegisterBtn) {
  showRegisterBtn.addEventListener('click', openRegisterModal);
}

if (closeRegisterModalBtn) {
  closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
}

if (cancelRegisterBtn) {
  cancelRegisterBtn.addEventListener('click', closeRegisterModal);
}

if (registerModal) {
  registerModal.addEventListener('click', (event) => {
    if (event.target === registerModal) closeRegisterModal();
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const full_name = username;
    const role = document.getElementById('registerRole')?.value === 'client' ? 'client' : 'user';

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(password)) {
      registerMessage.textContent = 'Password minimal 8 karakter, harus ada huruf besar, kecil, dan angka.';
      registerMessage.classList.add('error');
      return;
    }

    try {
      registerMessage.textContent = 'Membuat akun...';
      registerMessage.classList.remove('error');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, full_name, role }),
      });

      const data = await parseResponseJson(response);

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      registerMessage.textContent = `Akun ${username} (${role}) berhasil dibuat.`;
      registerMessage.classList.remove('error');
      registerForm.reset();
      const roleSelect = document.getElementById('registerRole');
      if (roleSelect) roleSelect.value = 'user';

      setTimeout(() => {
        closeRegisterModal();
      }, 1200);
    } catch (error) {
      registerMessage.textContent = error.message;
      registerMessage.classList.add('error');
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    monitoringPage = 1;
    applyFilter();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      searchInput.focus();
      monitoringPage = 1;
      applyFilter();
    }
  });
}

if (tlcFilter) {
  tlcFilter.addEventListener('change', () => {
    if (tlcFilterInput) {
      tlcFilterInput.value = tlcFilter.value === 'all' ? '' : tlcFilter.value;
    }
    monitoringPage = 1;
    applyFilter();
  });
}

if (tlcFilterInput) {
  // Ketik untuk filter real-time sekaligus filter opsi di dropdown
  tlcFilterInput.addEventListener('input', () => {
    openTlcDropdown();
    if (tlcFilter) {
      const typed = tlcFilterInput.value.trim().toUpperCase();
      const matched = currentAvailableTlcs.find((t) => t.code === typed);
      tlcFilter.value = matched ? matched.code : (typed || 'all');
    }
    monitoringPage = 1;
    applyFilter();
  });

  // Klik atau fokus pada input untuk memunculkan dropdown list
  tlcFilterInput.addEventListener('focus', () => {
    openTlcDropdown();
  });

  // Navigasi keyboard (Escape untuk menutup dropdown, Enter untuk submit filter)
  tlcFilterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTlcDropdown();
    } else if (e.key === 'Enter') {
      closeTlcDropdown();
      monitoringPage = 1;
      applyFilter();
    }
  });
}

if (toggleTlcDropdownBtn) {
  toggleTlcDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tlcDropdownMenu && !tlcDropdownMenu.classList.contains('hidden')) {
      closeTlcDropdown();
    } else {
      openTlcDropdown();
      if (tlcFilterInput) tlcFilterInput.focus();
    }
  });
}

if (clearTlcBtn) {
  clearTlcBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tlcFilterInput) tlcFilterInput.value = '';
    if (tlcFilter) tlcFilter.value = 'all';
    clearTlcBtn.classList.add('hidden');
    closeTlcDropdown();
    monitoringPage = 1;
    applyFilter();
    if (tlcFilterInput) tlcFilterInput.focus();
  });
}

if (tlcDropdownMenu) {
  tlcDropdownMenu.addEventListener('click', (e) => {
    const opt = e.target.closest('.tlc-option-item');
    if (!opt) return;
    const val = opt.dataset.value;
    if (val === 'all') {
      if (tlcFilterInput) tlcFilterInput.value = '';
      if (tlcFilter) tlcFilter.value = 'all';
    } else {
      if (tlcFilterInput) tlcFilterInput.value = val;
      if (tlcFilter) tlcFilter.value = val;
    }
    closeTlcDropdown();
    monitoringPage = 1;
    applyFilter();
  });
}

// Tutup dropdown saat klik di luar combobox wrap
document.addEventListener('click', (e) => {
  if (tlcComboboxWrap && !tlcComboboxWrap.contains(e.target)) {
    closeTlcDropdown();
  }
});

if (statusFilter) {
  statusFilter.addEventListener('change', applyFilters);
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener('click', resetAllMonitoringFilters);
}

if (tlcChipsContainer) {
  tlcChipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.tlc-chip');
    if (!chip) return;
    const selectedTlc = chip.dataset.tlc || 'all';
    if (tlcFilter) {
      tlcFilter.value = selectedTlc;
    }
    if (tlcFilterInput) {
      tlcFilterInput.value = selectedTlc === 'all' ? '' : selectedTlc;
    }
    closeTlcDropdown();
    monitoringPage = 1;
    applyFilter();
  });
}

if (userSearchInput) {
  userSearchInput.addEventListener('input', applyUserFilter);
}

if (auditSearchInput) {
  auditSearchInput.addEventListener('input', applyAuditFilter);
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    if (refreshBtn.disabled) return;

    const originalLabel = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.classList.add('is-loading');
    refreshBtn.innerHTML = '<span class="refresh-spinner" aria-hidden="true"></span> Memuat...';

    try {
      await fetchMonitoring();
      if (hasPermission('manage_users') || hasPermission('view_history')) {
        await Promise.all([
          fetchUsers(),
          fetchAuditLogs(),
          fetchMonitoringHistory(),
          fetchMonitoringArchive(),
        ]);
      } else if (hasPermission('edit_monitoring')) {
        await fetchMonitoringArchive();
      }
    } catch (error) {
      alert(error.message || 'Gagal memuat ulang data');
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('is-loading');
      refreshBtn.innerHTML = originalLabel;
    }
  });
}

if (downloadTemplateBtn) {
  downloadTemplateBtn.addEventListener('click', downloadImportTemplate);
}

if (bulkImportInput) {
  bulkImportInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      await handleBulkImport(file);
      bulkImportInput.value = '';
    }
  });
}

if (importBulkBtn) {
  importBulkBtn.addEventListener('click', () => bulkImportInput && bulkImportInput.click());
}

if (deleteAllMonitoringBtn) {
  deleteAllMonitoringBtn.addEventListener('click', deleteAllMonitoringData);
}

if (deleteHistoryBtn) {
  deleteHistoryBtn.addEventListener('click', deleteAllMonitoringHistory);
}

function syncPanelButtonStates() {
  if (toggleHistoryBtn) {
    toggleHistoryBtn.classList.toggle('active', !historyPanel?.classList.contains('hidden'));
  }

  if (toggleUserPanelBtn) {
    toggleUserPanelBtn.classList.toggle('active', !userPanel?.classList.contains('hidden'));
  }

  if (toggleConfigPanelBtn) {
    toggleConfigPanelBtn.classList.toggle('active', !configPanel?.classList.contains('hidden'));
  }
}

async function fetchConfigUsers() {
  if (!hasPermission('access_config') && getCurrentUser().role !== 'admin') return;
  const response = await fetch('/api/auth/users', { credentials: 'include' });
  if (!response.ok) return;
  configUsersList = await response.json();
  if (configUserSelect) {
    configUserSelect.innerHTML = '<option value="">-- Pilih user --</option>' +
      configUsersList.map((u) => `<option value="${u.id}">${u.username} (${u.full_name || '-'}) — ${u.role}</option>`).join('');
    if (selectedConfigUserId) configUserSelect.value = String(selectedConfigUserId);
  }
}

async function fetchPermissionCatalog() {
  if (!hasPermission('access_config') && getCurrentUser().role !== 'admin') return;
  const response = await fetch('/api/auth/permissions/catalog', { credentials: 'include' });
  if (!response.ok) return;
  const data = await response.json();
  permissionCatalog = data.catalog || [];
}

async function fetchUserPermissions(userId) {
  const response = await fetch(`/api/auth/users/${userId}/permissions`, { credentials: 'include' });
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

function renderConfigPermissions(permissions) {
  if (!configPermissionsList) return;
  if (!permissions || !permissions.length) {
    configPermissionsList.innerHTML = '<p class="empty-state">Pilih user terlebih dahulu.</p>';
    return;
  }

  configPermissionsList.innerHTML = permissions.map((p) => `
    <label class="permission-row ${p.allowed ? 'is-allowed' : 'is-denied'}" data-key="${p.key}">
      <div class="permission-meta">
        <strong>${p.label || p.key}</strong>
        <span class="permission-desc">${p.description || ''}</span>
        <code class="permission-key">${p.key}</code>
      </div>
      <input type="checkbox" class="permission-toggle" data-key="${p.key}" ${p.allowed ? 'checked' : ''} />
    </label>
  `).join('');

  configPermissionsList.querySelectorAll('.permission-toggle').forEach((toggle) => {
    toggle.addEventListener('change', (event) => {
      const key = event.target.dataset.key;
      const isFull = key === 'full_access';
      if (isFull && event.target.checked) {
        configPermissionsList.querySelectorAll('.permission-toggle').forEach((other) => {
          if (other.dataset.key !== 'full_access') {
            other.checked = true;
            other.disabled = true;
            other.closest('.permission-row')?.classList.add('is-locked');
          }
        });
      } else if (isFull && !event.target.checked) {
        configPermissionsList.querySelectorAll('.permission-toggle').forEach((other) => {
          if (other.dataset.key !== 'full_access') {
            other.checked = false;
            other.disabled = false;
            other.closest('.permission-row')?.classList.remove('is-locked');
          }
        });
      }
    });
  });

  const fullToggle = configPermissionsList.querySelector('.permission-toggle[data-key="full_access"]');
  if (fullToggle && fullToggle.checked) fullToggle.dispatchEvent(new Event('change'));
}

async function loadConfigForUser(userId) {
  if (!userId) {
    if (configPermissionsList) configPermissionsList.innerHTML = '<p class="empty-state">Pilih user terlebih dahulu.</p>';
    if (configRoleSelect) configRoleSelect.value = 'user';
    return;
  }
  selectedConfigUserId = Number(userId);
  const data = await fetchUserPermissions(userId);
  if (!data) return;
  if (configRoleSelect) {
    configRoleSelect.value = data.role;
    configRoleSelect.disabled = data.role === 'super_admin';
  }
  renderConfigPermissions(data.permissions);
  if (roleMessage) roleMessage.textContent = '';
  if (permissionsMessage) permissionsMessage.textContent = '';
}

async function saveConfigPermissions() {
  if (!selectedConfigUserId) {
    alert('Pilih user terlebih dahulu.');
    return;
  }
  const overrides = {};
  configPermissionsList.querySelectorAll('.permission-toggle').forEach((toggle) => {
    overrides[toggle.dataset.key] = toggle.checked;
  });
  const response = await fetch(`/api/auth/users/${selectedConfigUserId}/permissions`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions: overrides }),
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (permissionsMessage) {
      permissionsMessage.textContent = result.error || 'Gagal menyimpan izin';
      permissionsMessage.classList.add('error');
    }
    return;
  }
  if (permissionsMessage) {
    permissionsMessage.textContent = 'Izin berhasil diperbarui.';
    permissionsMessage.classList.remove('error');
  }
  alert('Izin berhasil diperbarui.');
  renderConfigPermissions(result.permissions);

  if (selectedConfigUserId === getCurrentUser().id) {
    try {
      const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setCurrentPermissions(meData.permissions || []);
        applyUIPermissions();
      }
    } catch (error) {
      console.error('Failed to refresh current permissions:', error);
    }
  } else {
    loadConfigForUser(selectedConfigUserId);
  }
}

async function saveConfigRole() {
  if (!selectedConfigUserId) {
    alert('Pilih user terlebih dahulu.');
    return;
  }
  const newRole = configRoleSelect?.value;
  if (!newRole) return;
  const response = await fetch(`/api/auth/users/${selectedConfigUserId}/role`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: newRole }),
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (roleMessage) {
      roleMessage.textContent = result.error || 'Gagal mengubah role';
      roleMessage.classList.add('error');
    }
    return;
  }
  if (roleMessage) {
    roleMessage.textContent = `Role berhasil diubah ke ${newRole}.`;
    roleMessage.classList.remove('error');
  }
  alert(`Role berhasil diubah ke ${newRole}.`);
  fetchConfigUsers();

  if (selectedConfigUserId === getCurrentUser().id) {
    try {
      const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setCurrentPermissions(meData.permissions || []);
        applyUIPermissions();
      }
    } catch (error) {
      console.error('Failed to refresh current permissions after role change:', error);
    }
  } else {
    loadConfigForUser(selectedConfigUserId);
  }
}

async function uploadLogo() {
  const file = logoInput?.files?.[0];
  if (!file) return alert('Pilih file logo terlebih dahulu.');
  const form = new FormData();
  form.append('logo', file);
  const response = await fetch('/api/auth/logo', {
    method: 'PUT',
    credentials: 'include',
    body: form,
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (logoMessage) {
      logoMessage.textContent = result.error || 'Gagal upload logo';
      logoMessage.classList.add('error');
    }
    return;
  }
  if (logoMessage) {
    logoMessage.textContent = 'Logo berhasil diperbarui.';
    logoMessage.classList.remove('error');
  }
  await loadLogo();
}

async function loadLogo() {
  const response = await fetch('/api/auth/logo', { credentials: 'include' });
  const result = await parseResponseJson(response);
  if (!response.ok) return;
  const preview = adminLogoPreview;
  const logoPlaceholder = document.getElementById('logoEmptyPlaceholder');
  const loginLogo = document.getElementById('loginLogo');
  const loginDefaultIcon = document.getElementById('loginDefaultIcon');
  const sidebarLogo = document.getElementById('sidebarLogoImg');
  const sidebarDefaultIcon = document.getElementById('sidebarDefaultIcon');
  const sidebarBrand = document.querySelector('.sidebar-brand');

  const applySidebarLogoAspect = () => {
    if (!sidebarLogo) return;
    if (sidebarLogo.naturalWidth && sidebarLogo.naturalHeight) {
      const ratio = sidebarLogo.naturalWidth / sidebarLogo.naturalHeight;
      if (ratio > 1.4) {
        sidebarBrand?.classList.add('brand-wide-layout');
      } else {
        sidebarBrand?.classList.remove('brand-wide-layout');
      }
    }
  };

  if (result.logo && result.logo.data) {
    const src = `data:${result.logo.mime};base64,${result.logo.data}`;
    if (preview) {
      preview.src = src;
      preview.classList.remove('hidden');
    }
    if (logoPlaceholder) logoPlaceholder.classList.add('hidden');
    if (loginLogo) {
      loginLogo.src = src;
      loginLogo.classList.remove('hidden');
    }
    if (loginDefaultIcon) loginDefaultIcon.classList.add('hidden');
    if (sidebarLogo) {
      sidebarLogo.src = src;
      sidebarLogo.classList.remove('hidden');
      sidebarLogo.onload = applySidebarLogoAspect;
      if (sidebarLogo.complete) applySidebarLogoAspect();
    }
    if (sidebarDefaultIcon) sidebarDefaultIcon.classList.add('hidden');
  } else {
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    if (logoPlaceholder) logoPlaceholder.classList.remove('hidden');
    if (loginLogo) {
      loginLogo.src = '';
      loginLogo.classList.add('hidden');
    }
    if (loginDefaultIcon) loginDefaultIcon.classList.remove('hidden');
    if (sidebarLogo) {
      sidebarLogo.src = '';
      sidebarLogo.classList.add('hidden');
    }
    if (sidebarDefaultIcon) sidebarDefaultIcon.classList.remove('hidden');
    if (sidebarBrand) sidebarBrand.classList.remove('brand-wide-layout');
  }
}

async function removeAppLogo() {
  const response = await fetch('/api/auth/logo', {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (logoMessage) {
      logoMessage.textContent = result.error || 'Gagal menghapus logo';
      logoMessage.classList.add('error');
    }
    return;
  }
  if (logoMessage) {
    logoMessage.textContent = 'Logo berhasil dihapus.';
    logoMessage.classList.remove('error');
  }
  await loadLogo();
}

async function uploadBackground() {
  const file = bgInput?.files?.[0];
  if (!file) return alert('Pilih file gambar latar belakang terlebih dahulu.');
  const form = new FormData();
  form.append('background', file);
  const response = await fetch('/api/auth/background', {
    method: 'PUT',
    credentials: 'include',
    body: form,
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (bgMessage) {
      bgMessage.textContent = result.error || 'Gagal mengunggah latar belakang';
      bgMessage.classList.add('error');
    }
    return;
  }
  if (bgMessage) {
    bgMessage.textContent = 'Latar belakang berhasil diperbarui.';
    bgMessage.classList.remove('error');
  }
  await loadBackground();
}

async function loadBackground() {
  const response = await fetch('/api/auth/background', { credentials: 'include' });
  const result = await parseResponseJson(response);
  if (!response.ok) return;
  const preview = adminBgPreview;
  const bgPlaceholder = document.getElementById('bgEmptyPlaceholder');
  const loginPage = document.getElementById('loginView');
  if (result.background) {
    const src = `data:${result.background.mime};base64,${result.background.data}`;
    if (preview) {
      preview.src = src;
      preview.classList.remove('hidden');
    }
    if (bgPlaceholder) bgPlaceholder.classList.add('hidden');
    if (loginPage) {
      loginPage.style.setProperty('--auth-bg-image', `url('${src}')`);
      loginPage.style.setProperty('--auth-bg-opacity', String(result.background.opacity ?? 0.35));
    }
  } else {
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    if (bgPlaceholder) bgPlaceholder.classList.remove('hidden');
    if (loginPage) {
      loginPage.style.setProperty('--auth-bg-image', 'none');
      loginPage.style.setProperty('--auth-bg-opacity', '0');
    }
  }
}

async function removeAppBackground() {
  const response = await fetch('/api/auth/background', {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (bgMessage) {
      bgMessage.textContent = result.error || 'Gagal menghapus latar belakang';
      bgMessage.classList.add('error');
    }
    return;
  }
  if (bgMessage) {
    bgMessage.textContent = 'Latar belakang berhasil dihapus.';
    bgMessage.classList.remove('error');
  }
  await loadBackground();
}

async function createAccountHandler() {
  if (getCurrentUser().role !== 'super_admin') {
    if (createAccountMessage) {
      createAccountMessage.textContent = 'Hanya super_admin yang dapat membuat akun.';
      createAccountMessage.classList.add('error');
    }
    return;
  }

  const username = (newAccountUsername?.value || '').trim();
  const fullName = (newAccountFullName?.value || '').trim();
  const password = newAccountPassword?.value || '';
  const role = newAccountRole?.value || 'user';

  if (!username || !password) {
    if (createAccountMessage) {
      createAccountMessage.textContent = 'Username dan password wajib diisi.';
      createAccountMessage.classList.add('error');
    }
    return;
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(password)) {
    if (createAccountMessage) {
      createAccountMessage.textContent = 'Password min 8 char, harus ada huruf besar, kecil, dan angka.';
      createAccountMessage.classList.add('error');
    }
    return;
  }

  if (createAccountMessage) {
    createAccountMessage.textContent = 'Membuat akun...';
    createAccountMessage.classList.remove('error');
  }

  const response = await fetch('/api/auth/users', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, full_name: fullName || username, role }),
  });

  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (createAccountMessage) {
      createAccountMessage.textContent = result.error || 'Gagal membuat akun.';
      createAccountMessage.classList.add('error');
    }
    return;
  }

  if (createAccountMessage) {
    createAccountMessage.textContent = result.message || `Akun ${username} berhasil dibuat.`;
    createAccountMessage.classList.remove('error');
  }

  if (newAccountUsername) newAccountUsername.value = '';
  if (newAccountFullName) newAccountFullName.value = '';
  if (newAccountPassword) newAccountPassword.value = '';
  if (newAccountRole) newAccountRole.value = 'user';

  await fetchConfigUsers();
}

if (createAccountBtn) {
  createAccountBtn.addEventListener('click', createAccountHandler);
}

async function saveCredentialsHandler() {
  if (getCurrentUser().role !== 'super_admin') {
    if (credentialsMessage) {
      credentialsMessage.textContent = 'Hanya super_admin yang dapat mengubah kredensial.';
      credentialsMessage.classList.add('error');
    }
    return;
  }

  if (!selectedConfigUserId) {
    if (credentialsMessage) {
      credentialsMessage.textContent = 'Pilih user terlebih dahulu dari dropdown atas.';
      credentialsMessage.classList.add('error');
    }
    return;
  }

  const newUsername = (credNewUsername?.value || '').trim();
  const newPassword = credNewPassword?.value || '';

  if (!newUsername && !newPassword) {
    if (credentialsMessage) {
      credentialsMessage.textContent = 'Isi username baru atau password baru (minimal salah satu).';
      credentialsMessage.classList.add('error');
    }
    return;
  }

  if (newPassword) {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pattern.test(newPassword)) {
      if (credentialsMessage) {
        credentialsMessage.textContent = 'Password min 8 char, harus ada huruf besar, kecil, dan angka.';
        credentialsMessage.classList.add('error');
      }
      return;
    }
  }

  const payload = {};
  if (newUsername) payload.username = newUsername;
  if (newPassword) payload.password = newPassword;

  if (credentialsMessage) {
    credentialsMessage.textContent = 'Menyimpan...';
    credentialsMessage.classList.remove('error');
  }

  const response = await fetch(`/api/auth/users/${selectedConfigUserId}/credentials`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (credentialsMessage) {
      credentialsMessage.textContent = result.error || 'Gagal menyimpan kredensial.';
      credentialsMessage.classList.add('error');
    }
    return;
  }

  if (credentialsMessage) {
    credentialsMessage.textContent = result.message || 'Kredensial berhasil diperbarui.';
    credentialsMessage.classList.remove('error');
  }

  if (credNewUsername) credNewUsername.value = '';
  if (credNewPassword) credNewPassword.value = '';

  await fetchConfigUsers();
}

if (saveCredentialsBtn) {
  saveCredentialsBtn.addEventListener('click', saveCredentialsHandler);
}

if (toggleHistoryBtn) {
  toggleHistoryBtn.addEventListener('click', () => {
    window.location.hash = '#/history';
  });
}

if (toggleUserPanelBtn) {
  toggleUserPanelBtn.addEventListener('click', () => {
    window.location.hash = '#/users';
  });
}

if (toggleConfigPanelBtn) {
  toggleConfigPanelBtn.addEventListener('click', () => {
    window.location.hash = '#/permissions';
  });
}

if (configUserSelect) {
  configUserSelect.addEventListener('change', (event) => {
    loadConfigForUser(event.target.value);
  });
}

if (saveRoleBtn) saveRoleBtn.addEventListener('click', saveConfigRole);
if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfigPermissions);
if (refreshConfigBtn) {
  refreshConfigBtn.addEventListener('click', async () => {
    await fetchConfigUsers();
    if (selectedConfigUserId) loadConfigForUser(selectedConfigUserId);
  });
}

syncPanelButtonStates();

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (addBtn) {
  addBtn.addEventListener('click', () => {
    const user = getCurrentUser();
    if (user.role === 'client') {
      alert('Akses ditolak. Role client hanya dapat melihat data.');
      return;
    }
    if (user.role !== 'admin') {
      alert('Akses ditolak. Hanya admin yang dapat menambah data monitoring.');
      return;
    }

    openModal('create');
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeModal);
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeModal);
}

if (monitoringModal) {
  monitoringModal.addEventListener('click', (event) => {
    if (event.target === monitoringModal) closeModal();
  });
}

if (monitoringForm) {
  monitoringForm.addEventListener('submit', saveMonitoring);
}

if (actionSelect) {
  actionSelect.addEventListener('change', () => {
    const isManual = actionSelect.value === 'manual';
    actionManual?.classList.toggle('hidden', !isManual);
    syncStatusWithAction();
    if (isManual) actionManual?.focus();
  });
}

if (actionManual) {
  actionManual.addEventListener('input', syncStatusWithAction);
}

if (tbody) {
  tbody.addEventListener('click', (event) => {
    const checkbox = event.target.closest('.monitoring-select-checkbox');
    if (checkbox) {
      if (checkbox.checked) selectedMonitoringWaybills.add(checkbox.dataset.waybill);
      else selectedMonitoringWaybills.delete(checkbox.dataset.waybill);
      updateSelectedMonitoringCount();
      return;
    }
    handleTableAction(event);
  });
}

if (archiveTableBody) {
  archiveTableBody.addEventListener('click', (event) => {
    const checkbox = event.target.closest('.archive-select-checkbox');
    if (checkbox) {
      if (checkbox.checked) selectedArchiveWaybills.add(checkbox.dataset.waybill);
      else selectedArchiveWaybills.delete(checkbox.dataset.waybill);
      updateArchiveSelectionCount();
      return;
    }
    const row = event.target.closest('tr');
    const waybill = row?.querySelector('.archive-select-checkbox')?.dataset.waybill;
    const item = monitoringArchiveData.find((entry) => entry.waybill === waybill);
    if (item && !event.target.closest('input')) openModal('archive-edit', item);
  });
}

if (archiveSearchInput) archiveSearchInput.addEventListener('input', () => renderMonitoringArchive(monitoringArchiveData));
if (bulkArchiveBtn) bulkArchiveBtn.addEventListener('click', moveSelectedToArchive);
if (restoreArchiveBtn) restoreArchiveBtn.addEventListener('click', restoreSelectedArchive);
if (selectAllArchive) {
  selectAllArchive.addEventListener('change', () => {
    archiveTableBody?.querySelectorAll('.archive-select-checkbox').forEach((checkbox) => {
      checkbox.checked = selectAllArchive.checked;
      if (checkbox.checked) selectedArchiveWaybills.add(checkbox.dataset.waybill);
      else selectedArchiveWaybills.delete(checkbox.dataset.waybill);
    });
    updateArchiveSelectionCount();
  });
}

if (cardArchive) {
  cardArchive.addEventListener('click', () => {
    window.location.hash = '#/archive';
  });
}

if (selectAllMonitoring) {
  selectAllMonitoring.addEventListener('change', () => {
    tbody?.querySelectorAll('.monitoring-select-checkbox').forEach((checkbox) => {
      checkbox.checked = selectAllMonitoring.checked;
      if (checkbox.checked) selectedMonitoringWaybills.add(checkbox.dataset.waybill);
      else selectedMonitoringWaybills.delete(checkbox.dataset.waybill);
    });
    updateSelectedMonitoringCount();
  });
}

if (bulkUpdateBtn) bulkUpdateBtn.addEventListener('click', handleBulkMonitoringUpdate);

if (bulkActionSelect) {
  bulkActionSelect.addEventListener('change', () => {
    const isManual = bulkActionSelect.value === 'manual';
    bulkActionManual?.classList.toggle('hidden', !isManual);
    if (isManual) bulkActionManual?.focus();
    refreshBulkActionButtonState();
  });
}

if (bulkActionManual) {
  bulkActionManual.addEventListener('input', refreshBulkActionButtonState);
}

if (monitoringPagination) {
  monitoringPagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    monitoringPage = Number(button.dataset.page) || 1;
    applyFilter();
  });
  monitoringPagination.addEventListener('change', (event) => {
    if (event.target.id !== 'monitoringPageSize') return;
    monitoringPageSize = Number(event.target.value) || 20;
    monitoringPage = 1;
    applyFilter();
  });
}

if (userTableBody) {
  userTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;

    const userId = Number(button.dataset.userId);
    const action = button.dataset.userAction;
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    if (action === 'toggle-status') {
      const nextStatus = button.dataset.status === 'blocked' ? 'blocked' : 'active';
      const response = await fetch(`/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await parseResponseJson(response);
      if (!response.ok) {
        alert(data.error || 'Gagal mengubah status user');
        return;
      }

      await fetchUsers();
      return;
    }

    if (action === 'delete-user') {
      const confirmed = window.confirm('Hapus user ini?');
      if (!confirmed) return;

      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseResponseJson(response);
      if (!response.ok) {
        alert(data.error || 'Gagal menghapus user');
        return;
      }

      selectedUserIds.delete(userId);
      await fetchUsers();
    }

    if (action === 'promote-admin') {
      const confirmed = window.confirm('Promosikan user ini menjadi admin?');
      if (!confirmed) return;
      const response = await fetch(`/api/auth/users/${userId}/promote-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponseJson(response);
      if (!response.ok) {
        alert(data.error || 'Gagal promote user');
        return;
      }
      await fetchUsers();
    }
  });

  userTableBody.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.user-select-checkbox');
    if (!checkbox) return;

    const userId = Number(checkbox.dataset.userId);
    if (checkbox.checked) {
      selectedUserIds.add(userId);
    } else {
      selectedUserIds.delete(userId);
    }

    if (headerSelectAllUsers) {
      const visibleIds = [...userTableBody.querySelectorAll('.user-select-checkbox')].map((input) => Number(input.dataset.userId));
      headerSelectAllUsers.checked = visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.has(id));
    }
  });
}

if (headerSelectAllUsers) {
  headerSelectAllUsers.addEventListener('change', () => {
    const checkboxes = userTableBody ? userTableBody.querySelectorAll('.user-select-checkbox') : [];
    checkboxes.forEach((checkbox) => {
      const userId = Number(checkbox.dataset.userId);
      checkbox.checked = headerSelectAllUsers.checked;
      if (headerSelectAllUsers.checked) {
        selectedUserIds.add(userId);
      } else {
        selectedUserIds.delete(userId);
      }
    });
  });
}

if (bulkBlockUsersBtn) {
  bulkBlockUsersBtn.addEventListener('click', () => handleBulkUserAction('block'));
}

if (bulkDeleteUsersBtn) {
  bulkDeleteUsersBtn.addEventListener('click', () => handleBulkUserAction('delete'));
}

if (exportAuditBtn) {
  exportAuditBtn.addEventListener('click', exportAuditLogs);
}

if (deleteAuditBtn) {
  deleteAuditBtn.addEventListener('click', deleteAllAuditLogs);
}

if (closeAuditDetailBtn) {
  closeAuditDetailBtn.addEventListener('click', closeAuditDetail);
}

if (auditDetailModal) {
  auditDetailModal.addEventListener('click', (event) => {
    if (event.target === auditDetailModal) closeAuditDetail();
  });
}

if (auditTableBody) {
  auditTableBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row || !row.dataset.logId) return;

    const log = auditLogsData.find((item) => String(item.id) === String(row.dataset.logId));
    if (log) openAuditDetail(log);
  });
}

['mousemove', 'keydown', 'click', 'scroll'].forEach((eventName) => {
  document.addEventListener(eventName, resetSessionTimer);
});

if (uploadLogoBtn) {
  uploadLogoBtn.addEventListener('click', () => logoInput && logoInput.click());
}

if (logoInput) {
  logoInput.addEventListener('change', () => {
    if (logoInput.files?.[0]) uploadLogo();
  });
}

if (deleteLogoBtn) {
  deleteLogoBtn.addEventListener('click', removeAppLogo);
}

if (uploadBgBtn) {
  uploadBgBtn.addEventListener('click', () => bgInput && bgInput.click());
}

if (bgInput) {
  bgInput.addEventListener('change', () => {
    if (bgInput.files?.[0]) uploadBackground();
  });
}

if (deleteBgBtn) {
  deleteBgBtn.addEventListener('click', removeAppBackground);
}

// Sidebar Drawer & Router Events
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', openMobileSidebar);
}
if (sidebarCloseBtn) {
  sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
}
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', closeMobileSidebar);
}
if (sidebarLogoutBtn) {
  sidebarLogoutBtn.addEventListener('click', logout);
}
window.addEventListener('hashchange', handleHashRoute);

loadLogo();
loadBackground();

bootstrapAuth();
