// Pastikan fetch selalu menyertakan session cookie (credentials: 'include') secara global
const _nativeFetch = window.fetch;
window.fetch = function (resource, init = {}) {
  const options = Object.assign({}, init);
  if (!options.credentials) {
    options.credentials = 'include';
  }
  return _nativeFetch.call(this, resource, options);
};

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const userPill = document.getElementById('userPill');
const tbody = document.getElementById('tabel-monitoring');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshToggleBtn = document.getElementById('autoRefreshToggleBtn');
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
const bulkRestoreUpdateBtn = document.getElementById('bulkRestoreUpdateBtn');
const restoreArchiveBtn = document.getElementById('restoreArchiveBtn');
const selectedArchiveCount = document.getElementById('selectedArchiveCount');
const selectedMonitoringArchiveCount = document.getElementById('selectedMonitoringArchiveCount');
const monitoringBulkControls = document.getElementById('monitoringBulkControls');
const selectedArchiveRestoreCount = document.getElementById('selectedArchiveRestoreCount');
const userTableBody = document.getElementById('userTableBody');
const historyTableBody = document.getElementById('historyTableBody');
const historySearchInput = document.getElementById('historySearchInput');
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
const sidebarLogoInput = document.getElementById('sidebarLogoInput');
const uploadSidebarLogoBtn = document.getElementById('uploadSidebarLogoBtn');
const deleteSidebarLogoBtn = document.getElementById('deleteSidebarLogoBtn');
const adminSidebarLogoPreview = document.getElementById('adminSidebarLogoPreview');
const sidebarLogoMessage = document.getElementById('sidebarLogoMessage');
const sidebarLogoSizeSlider = document.getElementById('sidebarLogoSizeSlider');
const sidebarLogoSizeVal = document.getElementById('sidebarLogoSizeVal');

const loginLogoInput = document.getElementById('loginLogoInput');
const uploadLoginLogoBtn = document.getElementById('uploadLoginLogoBtn');
const deleteLoginLogoBtn = document.getElementById('deleteLoginLogoBtn');
const adminLoginLogoPreview = document.getElementById('adminLoginLogoPreview');
const loginLogoMessage = document.getElementById('loginLogoMessage');
const loginLogoSizeSlider = document.getElementById('loginLogoSizeSlider');
const loginLogoSizeVal = document.getElementById('loginLogoSizeVal');

const bgInput = document.getElementById('bgInput');
const uploadBgBtn = document.getElementById('uploadBgBtn');
const deleteBgBtn = document.getElementById('deleteBgBtn');
const adminBgPreview = document.getElementById('adminBgPreview');
const bgMessage = document.getElementById('bgMessage');
const bgOpacitySlider = document.getElementById('bgOpacitySlider');
const bgOpacityVal = document.getElementById('bgOpacityVal');
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
const bulkActionManualWrapper = document.getElementById('bulkActionManualWrapper');
const bulkUpdateBtn = document.getElementById('bulkUpdateBtn');
const bulkUpdateBtnText = document.getElementById('bulkUpdateBtnText');
const selectedMonitoringCount = document.getElementById('selectedMonitoringCount');
const bulkWaybillChipsStrip = document.getElementById('bulkWaybillChipsStrip');
const bulkQuickChips = document.getElementById('bulkQuickChips');
const clearMonitoringSelectionBtn = document.getElementById('clearMonitoringSelectionBtn');
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
    permissions: { title: 'Hak Akses', eyebrow: 'Hak Akses Pengguna' },
    audit: { title: 'Audit Log', eyebrow: 'Keamanan Sistem' },
    settings: { title: 'Pengaturan', eyebrow: 'Konfigurasi & Branding' },
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

function showAppAlert(message, isErrorOverride = null) {
  if (!appAlertModal) return;
  const text = String(message || 'Terjadi sesuatu pada aplikasi.');
  const isError = isErrorOverride !== null
    ? Boolean(isErrorOverride)
    : /gagal|error|ditolak|tidak|batal|salah|habis|kadaluarsa|unauthorized|forbidden|invalid|wajib|belum/i.test(text);
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

function toggle(el, show) {
  if (!el) return;
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function applyUIPermissions() {
  const role = getCurrentUser().role;

  toggle(toggleHistoryBtn, hasPermission('view_history'));
  toggle(deleteHistoryBtn, hasPermission('delete_history'));
  toggle(toggleConfigPanelBtn, hasPermission('access_config'));
  toggle(toggleUserPanelBtn, hasPermission('manage_users'));
  toggle(downloadTemplateBtn, hasPermission('download_template'));
  toggle(importBulkBtn, hasPermission('import_bulk'));
  toggle(deleteAllMonitoringBtn, hasPermission('delete_global'));

  const createAccountCard = document.getElementById('createAccountCard');
  toggle(createAccountCard, hasPermission('create_user'));
  toggle(bulkRestoreUpdateBtn, hasPermission('restore_updated'));

  // Sidebar navigation visibility
  const canManageUsers = hasPermission('manage_users');
  const canViewHistory = hasPermission('view_history');
  const canAccessConfig = hasPermission('access_config');
  const canCreateUser = hasPermission('create_user');
  const adminPermissions = ['import_bulk', 'view_history', 'delete_history', 'manage_users', 'access_config', 'download_template', 'delete_global', 'create_user', 'restore_updated'];
  const hasAdminPermission = role === 'super_admin' || role === 'admin' || adminPermissions.some((key) => hasPermission(key));

  toggle(navLinks.users, canManageUsers);
  toggle(navLinks.history, canViewHistory);
  toggle(navLinks.permissions, canAccessConfig || canCreateUser);
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

function renderRoleBadge(role) {
  const norm = String(role || 'user').toLowerCase().trim();
  if (norm === 'super_admin') {
    return `
      <span class="role-badge-pill role-super-admin">
        <svg class="role-badge-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
        </svg>
        <span class="role-badge-text">GM</span>
      </span>
    `;
  }
  if (norm === 'admin') {
    return `
      <span class="role-badge-pill role-admin">
        <svg class="role-badge-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span class="role-badge-text">ADMIN</span>
      </span>
    `;
  }
  if (norm === 'client') {
    return `
      <span class="role-badge-pill role-client">
        <svg class="role-badge-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h12l4 6-10 13L2 9z"/>
        </svg>
        <span class="role-badge-text">CLIENT</span>
      </span>
    `;
  }
  return `
    <span class="role-badge-pill role-operator">
      <svg class="role-badge-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <span class="role-badge-text">OPERATOR</span>
    </span>
  `;
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
    const fullName = user.full_name || user.username || 'User';
    userPill.innerHTML = `
      <span class="user-pill-name">${escapeTlcHtml(fullName)}</span>
      ${renderRoleBadge(user.role)}
    `;
    userPill.className = `user-pill is-${user.role ? user.role.replace(/_/g, '-') : 'user'}`;
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
  stopAutoRefresh();
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }

  authUser = null;
  sessionStorage.removeItem('monitoring_user');
  window.location.hash = '#/monitoring';
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

  window.location.hash = '#/monitoring';
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
    const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');

    tr.innerHTML = `
      <td class="col-check" data-label="Pilih"><input type="checkbox" class="monitoring-select-checkbox" data-waybill="${item.waybill || ''}" ${selectedMonitoringWaybills.has(item.waybill) ? 'checked' : ''} /></td>
      <td class="col-waybill" data-label="Waybill"><strong class="cell-value">${highlightSearch(item.waybill || '-')}</strong></td>
      <td class="col-tanggal" data-label="Tanggal"><span class="cell-value">${highlightSearch(formatDate(item.tanggal))}</span></td>
      <td class="col-outlet" data-label="Outlet"><span class="cell-value">${highlightSearch(item.outlet || '-')}</span></td>
      <td class="col-stuck" data-label="Stuck"><span class="cell-value"><span class="badge badge-stuck">${highlightSearch(item.stuck || 0)}</span></span></td>
      <td class="col-tlc" data-label="TLC"><span class="cell-value">${highlightSearch(item.tlc || '-')}</span></td>
      <td class="col-status" data-label="Status"><span class="cell-value"><span class="status ${statusClass}">${highlightSearch(currentStatus)}</span></span></td>
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
  if (selectedMonitoringCountBadge) selectedMonitoringCountBadge.textContent = count;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = count === 0;

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
  if (h <= 59) return `${h} Jam (48-60)`;
  if (h <= 71) return `${h} Jam (60-72)`;
  return `${h} Jam (72 UP)`;
}

function normalizeStuckCategory(value) {
  if (value === null || value === undefined) return '0 Jam (1-12)';

  const rawStr = String(value).trim();
  if (!rawStr) return '0 Jam (1-12)';

  const normalized = rawStr.toLowerCase().replace(/\s+/g, ' ');

  // 1. Dukungan format teks lama dengan penomoran (1. 12 Jam, 4. 48 Jam - 60 Jam, dsb)
  if (/^1\.\s*(?:12\s*jam|1-12)/.test(normalized)) return '12 Jam (1-12)';
  if (/^2\.\s*(?:12\s*jam\s*-\s*24\s*jam|12-24)/.test(normalized)) return '24 Jam (12-24)';
  if (/^3\.\s*(?:24\s*jam\s*-\s*36\s*jam|24-36)/.test(normalized)) return '36 Jam (24-36)';
  if (/^4\.\s*(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '48 Jam (48-60)';
  if (/^5\.\s*(?:(?:48|60)\s*jam\s*-\s*72\s*jam|(?:48-72|60-72))/.test(normalized)) return '60 Jam (60-72)';
  if (/^6\.\s*(?:72(?:\s*jam)?\s*(?:up|\+)|72-up)/.test(normalized)) return '72 Jam (72 UP)';

  // Dukungan teks format lama tanpa penomoran
  if (/^48\s*jam\s*-\s*60\s*jam$/.test(normalized)) return '48 Jam (48-60)';
  if (/^(?:48|60)\s*jam\s*-\s*72\s*jam$/.test(normalized)) return '60 Jam (60-72)';
  if (/^72(?:\s*jam)?\s*(?:up|\+)$/.test(normalized)) return '72 Jam (72 UP)';
  if (/^12\s*jam\s*-\s*24\s*jam$/.test(normalized)) return '24 Jam (12-24)';
  if (/^24\s*jam\s*-\s*36\s*jam$/.test(normalized)) return '36 Jam (24-36)';
  if (/^12\s*jam$/.test(normalized)) return '12 Jam (1-12)';

  // 2. Input jam numerik (e.g. 45, 45 Jam, 45h, 45 Jam (48-60))
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

function matchesStuckFilter(item, filter) {
  if (filter === 'updated') return isSudahUpdate(item);
  if (isSudahUpdate(item)) return false;

  const rawStuck = String(item.stuck || '').trim();
  const hours = getStuckNumericHours(rawStuck);
  const normalized = rawStuck.toLowerCase().replace(/\s+/g, ' ');

  if (hours !== null) {
    if (filter === '1-12') return hours <= 11;
    if (filter === '12-24') return hours >= 12 && hours <= 23;
    if (filter === '24-36') return hours >= 24 && hours <= 35;
    if (filter === '48-60') return hours >= 36 && hours <= 59;
    if (filter === '48-72' || filter === '60-72') return hours >= 60 && hours <= 71;
    if (filter === '72-up') return hours >= 72;
  }

  // Fallback string matching untuk data lama tanpa angka jam terdepan
  if (filter === '1-12') return /^(?:1\.\s*)?12\s*jam$|^1-12/.test(normalized);
  if (filter === '12-24') return /^(?:2\.\s*)?12\s*jam\s*-\s*24\s*jam$|^12-24/.test(normalized);
  if (filter === '24-36') return /^(?:3\.\s*)?24\s*jam\s*-\s*36\s*jam$|^24-36/.test(normalized);
  if (filter === '48-60') return /^(?:4\.\s*)?48\s*jam\s*-\s*60\s*jam$|^48-60/.test(normalized);
  if (filter === '48-72' || filter === '60-72') return /^(?:5\.\s*)?(?:48|60)\s*jam\s*-\s*72\s*jam$|^(?:48-72|60-72)/.test(normalized);
  if (filter === '72-up') return /^(?:6\.\s*)?72(?:\s*jam)?\s*(?:up|\+)$|^72-up/.test(normalized);

  return true;
}

function getUrgencyClass(stuckValue) {
  const hours = getStuckNumericHours(stuckValue);
  if (hours !== null) {
    if (hours <= 11) return 'urgency-1-12';
    if (hours <= 23) return 'urgency-12-24';
    if (hours <= 35) return 'urgency-24-36';
    if (hours <= 59) return 'urgency-48-60';
    if (hours <= 71) return 'urgency-60-72';
    return 'urgency-72-up';
  }

  const stuck = String(stuckValue || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (/^(?:1\.\s*)?12\s*jam$|^1-12/.test(stuck)) return 'urgency-1-12';
  if (/^(?:2\.\s*)?12\s*jam\s*-\s*24\s*jam$|^12-24/.test(stuck)) return 'urgency-12-24';
  if (/^(?:3\.\s*)?24\s*jam\s*-\s*36\s*jam$|^24-36/.test(stuck)) return 'urgency-24-36';
  if (/^(?:4\.\s*)?48\s*jam\s*-\s*60\s*jam$|^48-60/.test(stuck)) return 'urgency-48-60';
  if (/^(?:5\.\s*)?(?:48|60)\s*jam\s*-\s*72\s*jam$|^(?:48-72|60-72)/.test(stuck)) return 'urgency-60-72';
  if (/^(?:6\.\s*)?72(?:\s*jam)?\s*(?:up|\+)$|^72-up/.test(stuck)) return 'urgency-72-up';
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
  const c48_60 = data.filter(item => matchesStuckFilter(item, '48-60')).length;
  const c60_72 = data.filter(item => matchesStuckFilter(item, '60-72')).length;
  const c72_up = data.filter(item => matchesStuckFilter(item, '72-up')).length;

  const count1_12 = document.getElementById('count-1-12');
  const count12_24 = document.getElementById('count-12-24');
  const count24_36 = document.getElementById('count-24-36');
  const count48_60 = document.getElementById('count-48-60');
  const count48_72 = document.getElementById('count-48-72');
  const count72_up = document.getElementById('count-72-up');

  if (count1_12) count1_12.textContent = c1_12;
  if (count12_24) count12_24.textContent = c12_24;
  if (count24_36) count24_36.textContent = c24_36;
  if (count48_60) count48_60.textContent = c48_60;
  if (count48_72) count48_72.textContent = c60_72;
  if (count72_up) count72_up.textContent = c72_up;

  // Update ringkasan pada tombol drawer
  const drawerSummaryBadge = document.getElementById('drawerSummaryBadge');
  if (drawerSummaryBadge) {
    const totalCritical = c48_60 + c60_72 + c72_up;
    drawerSummaryBadge.textContent = `36h+: ${totalCritical} Data`;
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
    { id: 'card-48-60', filter: '48-60' },
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
  const quickBarToggleText = document.getElementById('quickBarToggleText');
  const chevronQuickBar = document.getElementById('chevronQuickBar');

  if (!btnToggleQuickBar || !monitoringQuickBar) return;

  const isMobile = window.innerWidth <= 680;

  // Default di HP/PDA: otomatis tertutup (ngumpet) agar layar luas dan tidak makan tempat.
  // Default di Desktop: terbuka.
  if (isMobile) {
    monitoringQuickBar.classList.add('is-collapsed');
    monitoringQuickBar.classList.remove('is-open');
    if (quickBarToggleText) quickBarToggleText.textContent = 'Buka Tools';
    chevronQuickBar?.classList.remove('is-open');
  } else {
    monitoringQuickBar.classList.add('is-open');
    monitoringQuickBar.classList.remove('is-collapsed');
    if (quickBarToggleText) quickBarToggleText.textContent = 'Sembunyikan';
    chevronQuickBar?.classList.add('is-open');
  }

  btnToggleQuickBar.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = monitoringQuickBar.classList.contains('is-open');
    if (isOpen) {
      monitoringQuickBar.classList.remove('is-open');
      monitoringQuickBar.classList.add('is-collapsed');
      if (quickBarToggleText) quickBarToggleText.textContent = 'Buka Tools';
      chevronQuickBar?.classList.remove('is-open');
    } else {
      monitoringQuickBar.classList.add('is-open');
      monitoringQuickBar.classList.remove('is-collapsed');
      if (quickBarToggleText) quickBarToggleText.textContent = 'Sembunyikan';
      chevronQuickBar?.classList.add('is-open');
    }
  });
}

initQuickBarToggle();


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
  renderStatusOverview(data);
  updateStats(data);
  applyFilter();
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

  const keyword = (historySearchInput?.value || '').trim().toLowerCase();
  const filtered = (rows || []).filter((row) =>
    [row.waybill, row.outlet, row.status, row.aksi, row.updated_by]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  );

  const countBadge = document.getElementById('historyCountBadge');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} riwayat`;
  }

  historyTableBody.innerHTML = '';

  if (!filtered.length) {
    historyTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data di history.</td></tr>';
    return;
  }

  filtered.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = 'history-item-row';
    const statusVal = row.status && String(row.status).toLowerCase() !== 'open' ? row.status : 'Pending';
    const statusClass = String(statusVal).toLowerCase().replace(/\s+/g, '-');
    tr.innerHTML = `
      <td class="history-col-waybill" data-label="Waybill">
        <span class="cell-value">
          <span class="history-waybill-badge">${highlightSearch(row.waybill || '-', historySearchInput?.value)}</span>
        </span>
      </td>
      <td class="history-col-tanggal" data-label="Tanggal">
        <span class="cell-value">${highlightSearch(formatDate(row.tanggal), historySearchInput?.value)}</span>
      </td>
      <td class="history-col-outlet" data-label="Outlet">
        <span class="cell-value">
          <span class="history-outlet-tag">${highlightSearch(row.outlet || '-', historySearchInput?.value)}</span>
        </span>
      </td>
      <td class="history-col-status" data-label="Status">
        <span class="cell-value">
          <span class="status ${statusClass}">${statusVal}</span>
        </span>
      </td>
      <td class="history-col-aksi" data-label="Aksi">
        <span class="cell-value">
          <span class="history-aksi-badge">${highlightSearch(row.aksi || '-', historySearchInput?.value)}</span>
        </span>
      </td>
      <td class="history-col-updater" data-label="Updated By">
        <span class="cell-value">
          <span class="history-user-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${highlightSearch(row.updated_by || '-', historySearchInput?.value)}
          </span>
        </span>
      </td>
      <td class="history-col-archived" data-label="Archived At">
        <span class="cell-value">
          <span class="history-time-badge">${row.archived_at ? new Date(row.archived_at).toLocaleString('id-ID') : '-'}</span>
        </span>
      </td>
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
  const role = getCurrentUser().role;
  if (!token || (role !== 'admin' && role !== 'super_admin')) {
    alert('Akses ditolak. Hanya Admin dan Super Admin yang dapat menghapus audit log.');
    return;
  }

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
  if (!token || !hasPermission('delete_history')) {
    alert('Akses ditolak. Anda tidak memiliki izin untuk menghapus history.');
    return;
  }

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
    request.withCredentials = true;
    request.open('POST', '/api/monitoring/import');
    request.setRequestHeader('Content-Type', 'application/json');
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }
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

  const parseStuckValue = (value) => normalizeStuckCategory(value);

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
    credentials: 'include',
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
  bulkActionManualWrapper?.classList.add('hidden');
  updateBulkQuickChipsUI('');
  updateSelectedMonitoringCount();
  alert(`${result.updatedCount || 0} data berhasil diupdate.`);
  await fetchMonitoring();
  await fetchAuditLogs();
}

async function handleBulkRestoreUpdate() {
  if (!hasPermission('restore_updated')) {
    alert('Akses ditolak. Anda tidak memiliki izin untuk memulihkan status waybill.');
    return;
  }

  const waybills = [...selectedMonitoringWaybills];
  if (!waybills.length) {
    alert('Pilih minimal 1 data monitoring terlebih dahulu.');
    return;
  }

  const targetWaybills = monitoringData
    .filter((item) => selectedMonitoringWaybills.has(item.waybill) && isSudahUpdate(item))
    .map((item) => item.waybill);

  if (!targetWaybills.length) {
    alert('Tidak ada waybill terpilih yang berstatus "Sudah Diupdate".');
    return;
  }

  const confirmed = window.confirm(`Kembalikan ${targetWaybills.length} waybill terpilih ke status Pending?`);
  if (!confirmed) return;

  try {
    const response = await fetch('/api/monitoring/restore-update', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ waybills: targetWaybills }),
    });

    const result = await parseResponseJson(response);
    if (!response.ok) {
      alert(result.error || 'Gagal memulihkan data monitoring');
      return;
    }

    selectedMonitoringWaybills.clear();
    alert(result.message || `${targetWaybills.length} data berhasil dikembalikan ke status Pending.`);
    await fetchMonitoring();
    if (hasPermission('view_history')) {
      await fetchAuditLogs();
    }
  } catch (err) {
    console.error('Error bulk restore update:', err);
    alert('Terjadi kesalahan saat memulihkan data.');
  }
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

  if (action === 'restore-update') {
    if (!hasPermission('restore_updated')) {
      alert('Akses ditolak. Anda tidak memiliki izin untuk memulihkan status waybill ini.');
      return;
    }

    const confirmed = window.confirm(`Kembalikan waybill ${waybill} ke status Pending?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/monitoring/${encodeURIComponent(waybill)}/restore-update`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const result = await parseResponseJson(response);
      if (!response.ok) {
        alert(result.error || 'Gagal memulihkan status waybill');
        return;
      }

      alert(result.message || `Waybill ${waybill} berhasil dikembalikan ke status Pending.`);
      await fetchMonitoring();
      if (hasPermission('view_history')) {
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Error restore update:', err);
      alert('Terjadi kesalahan saat memulihkan waybill.');
    }
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
    item.status && String(item.status).toLowerCase() !== 'open' ? item.status : 'Pending',
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

let searchDebounceTimer = null;
if (searchInput) {
  searchInput.addEventListener('input', () => {
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('hidden', !searchInput.value.trim());
    }
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      monitoringPage = 1;
      applyFilter();
    }, 180);
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) {
      clearTimeout(searchDebounceTimer);
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

function updateTlcScrollButtons() {
  if (!tlcChipsContainer) return;
  const leftBtn = document.getElementById('tlcScrollLeftBtn');
  const rightBtn = document.getElementById('tlcScrollRightBtn');
  if (!leftBtn || !rightBtn) return;
  const maxScroll = tlcChipsContainer.scrollWidth - tlcChipsContainer.clientWidth;
  if (maxScroll <= 4) {
    leftBtn.classList.add('hidden');
    rightBtn.classList.add('hidden');
    return;
  }
  leftBtn.classList.toggle('hidden', tlcChipsContainer.scrollLeft <= 4);
  rightBtn.classList.toggle('hidden', tlcChipsContainer.scrollLeft >= maxScroll - 4);
}

if (tlcChipsContainer) {
  tlcChipsContainer.addEventListener('scroll', updateTlcScrollButtons, { passive: true });
  tlcChipsContainer.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      tlcChipsContainer.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

const tlcScrollLeftBtn = document.getElementById('tlcScrollLeftBtn');
const tlcScrollRightBtn = document.getElementById('tlcScrollRightBtn');
if (tlcScrollLeftBtn) {
  tlcScrollLeftBtn.addEventListener('click', () => {
    tlcChipsContainer?.scrollBy({ left: -160, behavior: 'smooth' });
  });
}
if (tlcScrollRightBtn) {
  tlcScrollRightBtn.addEventListener('click', () => {
    tlcChipsContainer?.scrollBy({ left: 160, behavior: 'smooth' });
  });
}
window.addEventListener('resize', updateTlcScrollButtons);

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

// AUTO-REFRESH (60s) LOGIC UNTUK LAYAR DISPLAY / MONITORING GUDANG
let autoRefreshInterval = null;
let autoRefreshCountdown = 60;
let autoRefreshCountdownInterval = null;

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  if (autoRefreshCountdownInterval) {
    clearInterval(autoRefreshCountdownInterval);
    autoRefreshCountdownInterval = null;
  }
  if (autoRefreshToggleBtn) {
    autoRefreshToggleBtn.classList.remove('is-active');
    autoRefreshToggleBtn.setAttribute('aria-pressed', 'false');
    const textEl = autoRefreshToggleBtn.querySelector('.auto-refresh-text');
    if (textEl) textEl.innerHTML = 'Auto 60s: <strong>OFF</strong>';
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (!autoRefreshToggleBtn) return;

  autoRefreshToggleBtn.classList.add('is-active');
  autoRefreshToggleBtn.setAttribute('aria-pressed', 'true');
  autoRefreshCountdown = 60;

  const updateLabel = () => {
    const textEl = autoRefreshToggleBtn.querySelector('.auto-refresh-text');
    if (textEl) textEl.innerHTML = `Auto: <strong>${autoRefreshCountdown}s</strong>`;
  };
  updateLabel();

  autoRefreshCountdownInterval = setInterval(() => {
    autoRefreshCountdown -= 1;
    if (autoRefreshCountdown <= 0) {
      autoRefreshCountdown = 60;
    }
    updateLabel();
  }, 1000);

  autoRefreshInterval = setInterval(async () => {
    // Jangan refresh jika user sedang membuka modal form atau ada waybill terpilih
    const isModalOpen = monitoringModal && !monitoringModal.classList.contains('hidden');
    const isRegisterOpen = registerModal && !registerModal.classList.contains('hidden');
    const isImportOpen = importProgressModal && !importProgressModal.classList.contains('hidden');
    const hasActiveSelection = selectedMonitoringWaybills && selectedMonitoringWaybills.size > 0;

    if (isModalOpen || isRegisterOpen || isImportOpen || hasActiveSelection) {
      return;
    }

    // Jangan refresh jika tab di background browser (hemat resource)
    if (document.hidden) {
      return;
    }

    try {
      await fetchMonitoring();
    } catch (err) {
      console.warn('Auto-refresh silent error:', err.message);
    }
  }, 60000);
}

if (autoRefreshToggleBtn) {
  autoRefreshToggleBtn.addEventListener('click', () => {
    const isActive = autoRefreshToggleBtn.classList.contains('is-active');
    if (isActive) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
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
  if (!hasPermission('access_config') && !hasPermission('create_user') && getCurrentUser().role !== 'admin') return;
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

async function uploadSidebarLogo() {
  const file = sidebarLogoInput?.files?.[0];
  if (!file) return alert('Pilih file logo sidebar terlebih dahulu.');
  const form = new FormData();
  form.append('logo', file);
  form.append('size_mode', sidebarLogoSizeSlider?.value || '44');
  const response = await fetch('/api/auth/logo/sidebar', {
    method: 'PUT',
    credentials: 'include',
    body: form,
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (sidebarLogoMessage) {
      sidebarLogoMessage.textContent = result.error || 'Gagal upload logo sidebar';
      sidebarLogoMessage.classList.add('error');
    }
    return;
  }
  if (sidebarLogoMessage) {
    sidebarLogoMessage.textContent = 'Logo sidebar berhasil diperbarui.';
    sidebarLogoMessage.classList.remove('error');
    setTimeout(() => { if (sidebarLogoMessage) sidebarLogoMessage.textContent = ''; }, 3500);
  }
  await loadLogo();
}

async function uploadLoginLogo() {
  const file = loginLogoInput?.files?.[0];
  if (!file) return alert('Pilih file logo login terlebih dahulu.');
  const form = new FormData();
  form.append('logo', file);
  form.append('size_mode', loginLogoSizeSlider?.value || '140');
  const response = await fetch('/api/auth/logo/login', {
    method: 'PUT',
    credentials: 'include',
    body: form,
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (loginLogoMessage) {
      loginLogoMessage.textContent = result.error || 'Gagal upload logo login';
      loginLogoMessage.classList.add('error');
    }
    return;
  }
  if (loginLogoMessage) {
    loginLogoMessage.textContent = 'Logo login berhasil diperbarui.';
    loginLogoMessage.classList.remove('error');
    setTimeout(() => { if (loginLogoMessage) loginLogoMessage.textContent = ''; }, 3500);
  }
  await loadLogo();
}

async function removeSidebarLogo() {
  if (!confirm('Yakin ingin menghapus logo sidebar? Logo bawaan akan digunakan kembali.')) return;
  const response = await fetch('/api/auth/logo/sidebar', {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (sidebarLogoMessage) {
      sidebarLogoMessage.textContent = result.error || 'Gagal menghapus logo sidebar';
      sidebarLogoMessage.classList.add('error');
    }
    return;
  }
  if (sidebarLogoMessage) {
    sidebarLogoMessage.textContent = 'Logo sidebar berhasil dihapus.';
    sidebarLogoMessage.classList.remove('error');
    setTimeout(() => { if (sidebarLogoMessage) sidebarLogoMessage.textContent = ''; }, 3500);
  }
  await loadLogo();
}

async function removeLoginLogo() {
  if (!confirm('Yakin ingin menghapus logo khusus login? Halaman login akan menggunakan logo sidebar / bawaan.')) return;
  const response = await fetch('/api/auth/logo/login', {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await parseResponseJson(response);
  if (!response.ok) {
    if (loginLogoMessage) {
      loginLogoMessage.textContent = result.error || 'Gagal menghapus logo login';
      loginLogoMessage.classList.add('error');
    }
    return;
  }
  if (loginLogoMessage) {
    loginLogoMessage.textContent = 'Logo login berhasil dihapus.';
    loginLogoMessage.classList.remove('error');
    setTimeout(() => { if (loginLogoMessage) loginLogoMessage.textContent = ''; }, 3500);
  }
  await loadLogo();
}

function applySidebarLogoSize(size) {
  const numSize = Math.max(24, Math.min(90, Number(size) || 44));
  const sidebarLogo = document.getElementById('sidebarLogoImg');
  const sidebarBrand = document.querySelector('.sidebar-brand');

  if (sidebarLogoSizeSlider) sidebarLogoSizeSlider.value = numSize;
  if (sidebarLogoSizeVal) sidebarLogoSizeVal.textContent = `${numSize}px`;

  if (sidebarLogo) {
    sidebarLogo.style.setProperty('--sidebar-logo-size', `${numSize}px`);
    if (sidebarLogo.naturalWidth && sidebarLogo.naturalHeight && (sidebarLogo.naturalWidth / sidebarLogo.naturalHeight > 1.4)) {
      sidebarBrand?.classList.add('brand-wide-layout');
      sidebarLogo.style.width = 'auto';
      sidebarLogo.style.height = 'auto';
      sidebarLogo.style.maxHeight = `${numSize}px`;
      sidebarLogo.style.maxWidth = `${Math.min(210, Math.round(numSize * 3.5))}px`;
    } else {
      sidebarBrand?.classList.remove('brand-wide-layout');
      sidebarLogo.style.width = `${numSize}px`;
      sidebarLogo.style.height = `${numSize}px`;
      sidebarLogo.style.minWidth = `${numSize}px`;
      sidebarLogo.style.maxWidth = `${numSize}px`;
      sidebarLogo.style.maxHeight = `${numSize}px`;
    }
  }
}

function applyLoginLogoSize(size) {
  const numSize = Math.max(24, Math.min(280, Number(size) || 52));
  const loginLogo = document.getElementById('loginLogo');

  if (loginLogoSizeSlider) loginLogoSizeSlider.value = numSize;
  if (loginLogoSizeVal) loginLogoSizeVal.textContent = `${numSize}px`;

  if (loginLogo) {
    loginLogo.style.setProperty('--login-logo-size', `${numSize}px`);
    loginLogo.style.maxHeight = `${numSize}px`;
    loginLogo.style.width = 'auto';
  }
}

let sidebarLogoDebounceTimer = null;
function onSidebarLogoSizeInput(e) {
  const size = Number(e.target.value) || 44;
  applySidebarLogoSize(size);

  clearTimeout(sidebarLogoDebounceTimer);
  sidebarLogoDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch('/api/auth/logo/sidebar/size', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ size_mode: String(size) }),
      });
      const res = await parseResponseJson(response);
      if (!response.ok && sidebarLogoMessage) {
        sidebarLogoMessage.textContent = res.error || 'Gagal mengubah ukuran logo sidebar';
        sidebarLogoMessage.classList.add('error');
      }
    } catch (err) {
      console.error('Error saving sidebar logo size:', err);
    }
  }, 300);
}

let loginLogoDebounceTimer = null;
function onLoginLogoSizeInput(e) {
  const size = Number(e.target.value) || 140;
  applyLoginLogoSize(size);

  clearTimeout(loginLogoDebounceTimer);
  loginLogoDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch('/api/auth/logo/login/size', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ size_mode: String(size) }),
      });
      const res = await parseResponseJson(response);
      if (!response.ok && loginLogoMessage) {
        loginLogoMessage.textContent = res.error || 'Gagal mengubah ukuran logo login';
        loginLogoMessage.classList.add('error');
      }
    } catch (err) {
      console.error('Error saving login logo size:', err);
    }
  }, 300);
}

async function loadLogo() {
  const response = await fetch('/api/auth/logo', { credentials: 'include' });
  const result = await parseResponseJson(response);
  if (!response.ok) return;

  const logos = result.logos || {};
  const sidebarData = logos.sidebar || result.logo;
  const loginData = logos.login || null;

  const sidebarLogo = document.getElementById('sidebarLogoImg');
  const sidebarDefaultIcon = document.getElementById('sidebarDefaultIcon');
  const sidebarBrand = document.querySelector('.sidebar-brand');
  const sidebarPlaceholder = document.getElementById('sidebarLogoEmptyPlaceholder');
  const sidebarPreview = adminSidebarLogoPreview;

  const loginLogo = document.getElementById('loginLogo');
  const loginDefaultIcon = document.getElementById('loginDefaultIcon');
  const loginPlaceholder = document.getElementById('loginLogoEmptyPlaceholder');
  const loginPreview = adminLoginLogoPreview;

  const parseSize = (raw, fallback, map = {}) => {
    if (map[raw]) return map[raw];
    const n = Number(raw);
    return (!isNaN(n) && n > 0) ? n : fallback;
  };

  const sidebarSize = parseSize(sidebarData?.size, 44, { small: 38, normal: 44, large: 52, banner: 48 });
  const loginSize = parseSize(loginData?.size, 52, { compact: 36, normal: 52, large: 80, jumbo: 140 });

  // --- 1. SIDEBAR LOGO ---
  if (sidebarData && sidebarData.data) {
    const src = `data:${sidebarData.mime};base64,${sidebarData.data}`;
    if (sidebarPreview) {
      sidebarPreview.src = src;
      sidebarPreview.classList.remove('hidden');
    }
    if (sidebarPlaceholder) sidebarPlaceholder.classList.add('hidden');
    if (sidebarLogo) {
      sidebarLogo.src = src;
      sidebarLogo.classList.remove('hidden');
      applySidebarLogoSize(sidebarSize);
      sidebarLogo.onload = () => applySidebarLogoSize(sidebarSize);
    }
    if (sidebarDefaultIcon) sidebarDefaultIcon.classList.add('hidden');
  } else {
    if (sidebarPreview) {
      sidebarPreview.src = '';
      sidebarPreview.classList.add('hidden');
    }
    if (sidebarPlaceholder) sidebarPlaceholder.classList.remove('hidden');
    if (sidebarLogo) {
      sidebarLogo.src = '';
      sidebarLogo.classList.add('hidden');
    }
    if (sidebarDefaultIcon) sidebarDefaultIcon.classList.remove('hidden');
    if (sidebarBrand) sidebarBrand.classList.remove('brand-wide-layout');
    applySidebarLogoSize(44);
  }

  // --- 2. LOGIN LOGO ---
  if (loginData && loginData.data) {
    const src = `data:${loginData.mime};base64,${loginData.data}`;
    if (loginPreview) {
      loginPreview.src = src;
      loginPreview.classList.remove('hidden');
    }
    if (loginPlaceholder) {
      if (loginData.isFallback) {
        loginPlaceholder.textContent = 'Menggunakan logo sidebar (belum ada logo login terpisah)';
        loginPlaceholder.classList.remove('hidden');
      } else {
        loginPlaceholder.classList.add('hidden');
      }
    }
    if (loginLogo) {
      loginLogo.src = src;
      loginLogo.classList.remove('hidden');
      applyLoginLogoSize(loginSize);
    }
    if (loginDefaultIcon) loginDefaultIcon.classList.add('hidden');
  } else {
    if (loginPreview) {
      loginPreview.src = '';
      loginPreview.classList.add('hidden');
    }
    if (loginPlaceholder) {
      loginPlaceholder.textContent = 'Belum ada logo khusus login (mengikuti logo sidebar)';
      loginPlaceholder.classList.remove('hidden');
    }
    if (loginLogo) {
      loginLogo.src = '';
      loginLogo.classList.add('hidden');
    }
    if (loginDefaultIcon) loginDefaultIcon.classList.remove('hidden');
    applyLoginLogoSize(52);
  }
}

async function uploadBackground() {
  const file = bgInput?.files?.[0];
  if (!file) return alert('Pilih file gambar latar belakang terlebih dahulu.');
  const form = new FormData();
  form.append('background', file);
  form.append('opacity', bgOpacitySlider?.value || 0.35);
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
    setTimeout(() => { if (bgMessage) bgMessage.textContent = ''; }, 3500);
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
  const opacity = result.background?.opacity !== undefined ? Number(result.background.opacity) : 0.35;

  if (bgOpacitySlider) {
    bgOpacitySlider.value = opacity;
  }
  if (bgOpacityVal) {
    bgOpacityVal.textContent = Math.round(opacity * 100) + '%';
  }

  if (result.background && result.background.data) {
    const src = `data:${result.background.mime};base64,${result.background.data}`;
    if (preview) {
      preview.src = src;
      preview.classList.remove('hidden');
    }
    if (bgPlaceholder) bgPlaceholder.classList.add('hidden');
    if (loginPage) {
      loginPage.style.setProperty('--auth-bg-image', `url('${src}')`);
      loginPage.style.setProperty('--auth-bg-opacity', String(opacity));
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

let bgOpacityDebounceTimer = null;
function onBgOpacityChange(e) {
  const val = Number(e.target.value);
  if (bgOpacityVal) {
    bgOpacityVal.textContent = Math.round(val * 100) + '%';
  }
  const loginPage = document.getElementById('loginView');
  if (loginPage) {
    loginPage.style.setProperty('--auth-bg-opacity', String(val));
  }
  clearTimeout(bgOpacityDebounceTimer);
  bgOpacityDebounceTimer = setTimeout(async () => {
    try {
      await fetch('/api/auth/background/opacity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ opacity: val }),
      });
    } catch (err) {
      console.error('Error saving background opacity:', err);
    }
  }, 350);
}

async function removeAppBackground() {
  if (!confirm('Yakin ingin menghapus latar belakang kustom? Halaman login akan kembali ke tema gelap bawaan.')) return;
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
    setTimeout(() => { if (bgMessage) bgMessage.textContent = ''; }, 3500);
  }
  await loadBackground();
}

async function createAccountHandler() {
  if (!hasPermission('create_user') && getCurrentUser().role !== 'super_admin') {
    if (createAccountMessage) {
      createAccountMessage.textContent = 'Anda tidak memiliki izin untuk membuat akun.';
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
    const manualWrapper = document.getElementById('manualActionWrapper');
    actionManual?.classList.toggle('hidden', !isManual);
    if (manualWrapper) manualWrapper.classList.toggle('hidden', !isManual);
    updateQuickChipsUI(actionSelect.value);
    syncStatusWithAction();
    if (isManual) actionManual?.focus();
  });
}

if (actionManual) {
  actionManual.addEventListener('input', () => {
    syncStatusWithAction();
  });
}

const modalQuickChips = document.getElementById('modalQuickChips');
if (modalQuickChips) {
  modalQuickChips.addEventListener('click', (event) => {
    const chip = event.target.closest('.quick-chip-btn');
    if (!chip) return;

    const actionVal = chip.dataset.action;
    const manualWrapper = document.getElementById('manualActionWrapper');

    if (actionVal === 'manual') {
      if (actionSelect) actionSelect.value = 'manual';
      actionManual?.classList.remove('hidden');
      if (manualWrapper) manualWrapper.classList.remove('hidden');
      updateQuickChipsUI('manual');
      actionManual?.focus();
    } else {
      if (actionSelect) actionSelect.value = actionVal;
      actionManual?.classList.add('hidden');
      if (manualWrapper) manualWrapper.classList.add('hidden');
      if (actionManual) actionManual.value = '';
      updateQuickChipsUI(actionVal);
    }
    syncStatusWithAction();
  });
}

const modalCopyWaybillBtn = document.getElementById('modalCopyWaybillBtn');
if (modalCopyWaybillBtn) {
  modalCopyWaybillBtn.addEventListener('click', () => {
    const waybillText = document.getElementById('modalWaybillText')?.textContent?.trim();
    if (waybillText && waybillText !== '-') {
      navigator.clipboard.writeText(waybillText).then(() => {
        const copyLabel = modalCopyWaybillBtn.querySelector('.copy-label') || modalCopyWaybillBtn;
        const originalText = copyLabel.textContent;
        copyLabel.textContent = 'Tersalin! ✓';
        modalCopyWaybillBtn.classList.add('copied');
        setTimeout(() => {
          copyLabel.textContent = originalText;
          modalCopyWaybillBtn.classList.remove('copied');
        }, 1500);
      }).catch(() => {});
    }
  });
}

if (tbody) {
  tbody.addEventListener('click', (event) => {
    const colCheck = event.target.closest('.col-check');
    if (colCheck) {
      const checkbox = colCheck.querySelector('.monitoring-select-checkbox');
      if (checkbox) {
        if (event.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        if (checkbox.checked) selectedMonitoringWaybills.add(checkbox.dataset.waybill);
        else selectedMonitoringWaybills.delete(checkbox.dataset.waybill);
        checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
        updateSelectedMonitoringCount();
      }
      return;
    }
    const colBarang = event.target.closest('.col-barang');
    if (colBarang) {
      const willExpand = !colBarang.classList.contains('is-expanded');
      tbody.querySelectorAll('.col-barang.is-expanded').forEach((el) => {
        if (el !== colBarang) el.classList.remove('is-expanded');
      });
      colBarang.classList.toggle('is-expanded', willExpand);
      return;
    }
    handleTableAction(event);
  });
}

if (archiveTableBody) {
  archiveTableBody.addEventListener('click', (event) => {
    const colCheck = event.target.closest('.col-check');
    if (colCheck) {
      const checkbox = colCheck.querySelector('.archive-select-checkbox');
      if (checkbox) {
        if (event.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        if (checkbox.checked) selectedArchiveWaybills.add(checkbox.dataset.waybill);
        else selectedArchiveWaybills.delete(checkbox.dataset.waybill);
        checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
        updateArchiveSelectionCount();
      }
      return;
    }
    const colAksiText = event.target.closest('.col-aksi-text');
    if (colAksiText) {
      const willExpand = !colAksiText.classList.contains('is-expanded');
      archiveTableBody.querySelectorAll('.col-aksi-text.is-expanded').forEach((el) => {
        if (el !== colAksiText) el.classList.remove('is-expanded');
      });
      colAksiText.classList.toggle('is-expanded', willExpand);
      return;
    }
    const row = event.target.closest('tr');
    const waybill = row?.querySelector('.archive-select-checkbox')?.dataset.waybill;
    const item = monitoringArchiveData.find((entry) => entry.waybill === waybill);
    if (item && !event.target.closest('input')) openModal('archive-edit', item);
  });
}

let archiveSearchDebounceTimer = null;
if (archiveSearchInput) {
  archiveSearchInput.addEventListener('input', () => {
    clearTimeout(archiveSearchDebounceTimer);
    archiveSearchDebounceTimer = setTimeout(() => {
      renderMonitoringArchive(monitoringArchiveData);
    }, 180);
  });
}

let historySearchDebounceTimer = null;
if (historySearchInput) {
  historySearchInput.addEventListener('input', () => {
    clearTimeout(historySearchDebounceTimer);
    historySearchDebounceTimer = setTimeout(() => {
      renderMonitoringHistory(monitoringHistoryData);
    }, 180);
  });
}
if (bulkArchiveBtn) bulkArchiveBtn.addEventListener('click', moveSelectedToArchive);
if (restoreArchiveBtn) restoreArchiveBtn.addEventListener('click', restoreSelectedArchive);
if (selectAllArchive) {
  selectAllArchive.addEventListener('change', () => {
    archiveTableBody?.querySelectorAll('.archive-select-checkbox').forEach((checkbox) => {
      checkbox.checked = selectAllArchive.checked;
      if (checkbox.checked) selectedArchiveWaybills.add(checkbox.dataset.waybill);
      else selectedArchiveWaybills.delete(checkbox.dataset.waybill);
      checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
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
      checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
    });
    updateSelectedMonitoringCount();
  });
}

if (clearMonitoringSelectionBtn) {
  clearMonitoringSelectionBtn.addEventListener('click', () => {
    selectedMonitoringWaybills.clear();
    if (selectAllMonitoring) selectAllMonitoring.checked = false;
    tbody?.querySelectorAll('.monitoring-select-checkbox').forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.closest('tr')?.classList.remove('is-selected');
    });
    if (bulkActionSelect) bulkActionSelect.value = '';
    if (bulkActionManual) bulkActionManual.value = '';
    bulkActionManualWrapper?.classList.add('hidden');
    bulkActionManual?.classList.add('hidden');
    updateBulkQuickChipsUI('');
    updateSelectedMonitoringCount();
  });
}

if (bulkQuickChips) {
  bulkQuickChips.addEventListener('click', (event) => {
    const chip = event.target.closest('.bulk-quick-chip');
    if (!chip) return;
    const action = chip.dataset.action;
    const isManual = action === 'manual';

    if (bulkActionSelect) {
      bulkActionSelect.value = action;
    }

    if (bulkActionManualWrapper) {
      bulkActionManualWrapper.classList.toggle('hidden', !isManual);
    }
    if (bulkActionManual) {
      bulkActionManual.classList.toggle('hidden', !isManual);
      if (isManual) {
        bulkActionManual.focus();
      }
    }

    updateBulkQuickChipsUI(action);
    refreshBulkActionButtonState();
  });
}

if (bulkWaybillChipsStrip) {
  bulkWaybillChipsStrip.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.wb-remove-btn');
    if (!removeBtn) return;
    const wb = removeBtn.dataset.wb;
    if (wb && selectedMonitoringWaybills.has(wb)) {
      selectedMonitoringWaybills.delete(wb);
      const rowCheckbox = tbody?.querySelector(`.monitoring-select-checkbox[data-waybill="${wb}"]`);
      if (rowCheckbox) {
        rowCheckbox.checked = false;
        rowCheckbox.closest('tr')?.classList.remove('is-selected');
      }
      if (selectAllMonitoring && selectedMonitoringWaybills.size === 0) {
        selectAllMonitoring.checked = false;
      }
      updateSelectedMonitoringCount();
    }
  });
}

if (bulkUpdateBtn) bulkUpdateBtn.addEventListener('click', handleBulkMonitoringUpdate);
if (bulkRestoreUpdateBtn) bulkRestoreUpdateBtn.addEventListener('click', handleBulkRestoreUpdate);

if (bulkActionSelect) {
  bulkActionSelect.addEventListener('change', () => {
    const isManual = bulkActionSelect.value === 'manual';
    bulkActionManualWrapper?.classList.toggle('hidden', !isManual);
    bulkActionManual?.classList.toggle('hidden', !isManual);
    if (isManual) bulkActionManual?.focus();
    updateBulkQuickChipsUI(bulkActionSelect.value);
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

// Sidebar Logo Controls
if (uploadSidebarLogoBtn) {
  uploadSidebarLogoBtn.addEventListener('click', () => sidebarLogoInput && sidebarLogoInput.click());
}
if (sidebarLogoInput) {
  sidebarLogoInput.addEventListener('change', () => {
    if (sidebarLogoInput.files?.[0]) uploadSidebarLogo();
  });
}
if (deleteSidebarLogoBtn) {
  deleteSidebarLogoBtn.addEventListener('click', removeSidebarLogo);
}
if (sidebarLogoSizeSlider) {
  sidebarLogoSizeSlider.addEventListener('input', onSidebarLogoSizeInput);
}

// Login Logo Controls
if (uploadLoginLogoBtn) {
  uploadLoginLogoBtn.addEventListener('click', () => loginLogoInput && loginLogoInput.click());
}
if (loginLogoInput) {
  loginLogoInput.addEventListener('change', () => {
    if (loginLogoInput.files?.[0]) uploadLoginLogo();
  });
}
if (deleteLoginLogoBtn) {
  deleteLoginLogoBtn.addEventListener('click', removeLoginLogo);
}
if (loginLogoSizeSlider) {
  loginLogoSizeSlider.addEventListener('input', onLoginLogoSizeInput);
}

// Login Background & Opacity Controls
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
if (bgOpacitySlider) {
  bgOpacitySlider.addEventListener('input', onBgOpacityChange);
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

// Password Visibility Toggle Helpers
function setupPasswordToggle(inputId, btnId) {
  const input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
  const btn = typeof btnId === 'string' ? document.getElementById(btnId) : btnId;
  if (!input || !btn) return;
  const eyeOpen = btn.querySelector('.eye-open');
  const eyeClosed = btn.querySelector('.eye-closed');

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (eyeOpen) eyeOpen.classList.toggle('hidden', !isPassword);
    if (eyeClosed) eyeClosed.classList.toggle('hidden', isPassword);
    btn.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Lihat password');
    input.focus();
  });
}

setupPasswordToggle('loginPassword', 'toggleLoginPasswordBtn');
setupPasswordToggle('registerPassword', 'toggleRegisterPasswordBtn');

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
    // Gunakan TLC pertama yang tersedia jika ada
    quickAddTlc.value = (currentAvailableTlcs && currentAvailableTlcs.length > 0) ? currentAvailableTlcs[0].code : '-';
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
    } else if (ageDays === 2 || matchesStuckFilter(item, '48-60')) {
      fifoBadgeClass = 'fifo-badge-warning';
      fifoBorderClass = 'border-warning';
      fifoLabel = 'FIFO Waspada (48-60 Jam)';
      chipDotClass = 'dot-warning';
    } else if (ageDays === 3 || matchesStuckFilter(item, '48-72')) {
      fifoBadgeClass = 'fifo-badge-alert';
      fifoBorderClass = 'border-alert';
      fifoLabel = 'FIFO Peringatan (48-72 Jam)';
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
      const targetAksi = scannerActionSelect ? scannerActionSelect.value : 'Sudah Scan Kirim';

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
        <button type="button" class="btn-quick-register" onclick="openQuickAddModal('${escapeTlcHtml(waybill)}')">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>+ Daftarkan Paket Ini Sekarang</span>
        </button>
        <button type="button" class="btn-note-unregistered" onclick="document.getElementById('unknownScansDrawer')?.classList.remove('hidden')">
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
      <div class="recent-scan-chip" onclick="handleScannedWaybill('${escapeTlcHtml(scan.waybill)}')">
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
          <button type="button" class="small-btn primary-btn" style="padding: 2px 8px; font-size: 0.7rem;" onclick="openQuickAddModal('${escapeTlcHtml(u.waybill)}')">+ Input</button>
        </div>
      </div>
    `;
  });
  unknownScansList.innerHTML = html;
}

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
    setTimeout(focusScannerInput, 60);
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
