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
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const restoreArchiveBtn = document.getElementById('restoreArchiveBtn');
const selectedArchiveCount = document.getElementById('selectedArchiveCount');
const selectedMonitoringArchiveCount = document.getElementById('selectedMonitoringArchiveCount');
const selectedMonitoringDeleteCount = document.getElementById('selectedMonitoringDeleteCount');
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
  fifoReport: document.getElementById('viewFifoReport'),
  advance: document.getElementById('viewAdvance'),
  archive: document.getElementById('viewArchive'),
  history: document.getElementById('viewHistory'),
  users: document.getElementById('viewUsers'),
  permissions: document.getElementById('viewPermissions'),
  audit: document.getElementById('viewAudit'),
  settings: document.getElementById('viewSettings'),
};

const navLinks = {
  monitoring: document.getElementById('navMonitoring'),
  fifoReport: document.getElementById('navFifoReport'),
  advance: document.getElementById('navAdvance'),
  archive: document.getElementById('navArchive'),
  history: document.getElementById('navHistory'),
  users: document.getElementById('navUsers'),
  permissions: document.getElementById('navPermissions'),
  audit: document.getElementById('navAudit'),
  settings: document.getElementById('navSettings'),
};

let currentAdvanceTab = 'reconcile';

function switchAdvanceTab(tabName, updateUrl = true) {
  const validTabs = ['reconcile', 'kendaraan', 'generator-feishu', 'jfs', 'pto', 'barcode', 'print-awb', 'wajib-kirim', 'gudang-rute'];
  const tab = validTabs.includes(tabName) ? tabName : 'reconcile';
  currentAdvanceTab = tab;

  // Update button active state
  document.querySelectorAll('.advance-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-advance-tab') === tab);
  });

  // Update pane visibility
  const paneReconcile = document.getElementById('viewReconcile');
  const paneKendaraan = document.getElementById('viewKendaraan');
  const paneFeishu = document.getElementById('viewFeishuDoc');
  const paneJfs = document.getElementById('viewJfs');
  const panePto = document.getElementById('viewPto');
  const paneBarcode = document.getElementById('viewBarcodeGen');
  const panePrintAwb = document.getElementById('viewPrintAwb');
  const paneWajibKirim = document.getElementById('viewWajibKirim');
  const paneGudangRute = document.getElementById('viewGudangRute');

  if (paneReconcile) {
    paneReconcile.classList.toggle('hidden', tab !== 'reconcile');
    paneReconcile.classList.toggle('active', tab === 'reconcile');
  }
  if (paneKendaraan) {
    paneKendaraan.classList.toggle('hidden', tab !== 'kendaraan');
    paneKendaraan.classList.toggle('active', tab === 'kendaraan');
  }
  if (paneFeishu) {
    paneFeishu.classList.toggle('hidden', tab !== 'generator-feishu');
    paneFeishu.classList.toggle('active', tab === 'generator-feishu');
  }
  if (paneJfs) {
    paneJfs.classList.toggle('hidden', tab !== 'jfs');
    paneJfs.classList.toggle('active', tab === 'jfs');
  }
  if (panePto) {
    panePto.classList.toggle('hidden', tab !== 'pto');
    panePto.classList.toggle('active', tab === 'pto');
  }
  if (paneBarcode) {
    paneBarcode.classList.toggle('hidden', tab !== 'barcode');
    paneBarcode.classList.toggle('active', tab === 'barcode');
  }
  if (paneWajibKirim) {
    paneWajibKirim.classList.toggle('hidden', tab !== 'wajib-kirim');
    paneWajibKirim.classList.toggle('active', tab === 'wajib-kirim');
  }
  if (panePrintAwb) {
    panePrintAwb.classList.toggle('hidden', tab !== 'print-awb');
    panePrintAwb.classList.toggle('active', tab === 'print-awb');
  }
  if (paneGudangRute) {
    paneGudangRute.classList.toggle('hidden', tab !== 'gudang-rute');
    paneGudangRute.classList.toggle('active', tab === 'gudang-rute');
  }

  if (updateUrl) {
    history.replaceState(null, '', `#/advance?tab=${tab}`);
  }

  // Auto-fetch data for active tab
  if (tab === 'kendaraan') {
    fetchKendaraanDashboard();
    fetchKendaraanList();
  } else if (tab === 'generator-feishu') {
    ensureFeishuPicMap();
    if (typeof feishuExcelRows !== 'undefined' && feishuExcelRows.length === 0) {
      initFeishuExcelRows();
    }
  } else if (tab === 'jfs') {
    fetchJfsConfigAndStatus();
    fetchJfsLogs();
  } else if (tab === 'pto') {
    if (typeof initPtoModule === 'function') {
      initPtoModule();
    }
  } else if (tab === 'wajib-kirim') {
    if (typeof window.loadWajibKirimData === 'function') {
      window.loadWajibKirimData();
    }
  } else if (tab === 'print-awb') {
    if (typeof initPrintAwbModule === 'function') {
      initPrintAwbModule();
    }
  } else if (tab === 'gudang-rute') {
    if (typeof loadGudangRuteDashboard === 'function') {
      loadGudangRuteDashboard();
    }
  }
}

window.switchAdvanceTab = switchAdvanceTab;

let advanceTabsInitialized = false;
function initAdvanceTabs() {
  if (advanceTabsInitialized) return;
  advanceTabsInitialized = true;

  document.querySelectorAll('.advance-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-advance-tab');
      if (tab) switchAdvanceTab(tab, true);
    });
  });
}

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
  const baseRoute = rawHash.split('?')[0] || 'monitoring';
  const queryStr = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  const urlParams = new URLSearchParams(queryStr);

  const advanceSubTabs = ['reconcile', 'kendaraan', 'generator-feishu', 'jfs', 'pto', 'barcode', 'print-awb', 'wajib-kirim', 'gudang-rute'];
  let target = baseRoute;
  let advanceSubTab = 'reconcile';
  if (baseRoute === 'fifo-report' || baseRoute === 'fiforeport') {
    target = 'fifoReport';
  }

  if (advanceSubTabs.includes(baseRoute)) {
    target = 'advance';
    advanceSubTab = baseRoute;
  } else if (baseRoute === 'advance') {
    target = 'advance';
    const tabParam = urlParams.get('tab');
    if (tabParam && advanceSubTabs.includes(tabParam)) {
      advanceSubTab = tabParam;
    } else {
      advanceSubTab = currentAdvanceTab || 'reconcile';
    }
  }

  const routeConfig = {
    monitoring: { title: 'FIFO Dashboard', eyebrow: 'Monitoring System' },
    fifoReport: { title: 'Laporan FIFO Spot', eyebrow: 'Matriks Loading Bay & TLC Tujuan Realtime JFS' },
    advance: { title: 'Advance Operations & Intelligence', eyebrow: 'Pusat Rekonsiliasi, Kendaraan, Feishu, JFS & PTO' },
    archive: { title: 'Arsip Waybill', eyebrow: 'Data Management' },
    history: { title: 'History Update', eyebrow: 'Riwayat Perubahan' },
    users: { title: 'Manajemen User', eyebrow: 'Administrasi Sistem' },
    permissions: { title: 'Hak Akses', eyebrow: 'Hak Akses Pengguna' },
    audit: { title: 'Audit Log', eyebrow: 'Keamanan Sistem' },
    settings: { title: 'Pengaturan', eyebrow: 'Konfigurasi & Branding' },
  };

  const finalTarget = routeConfig[target] ? target : 'monitoring';
  const meta = routeConfig[finalTarget];

  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageEyebrow) pageEyebrow.textContent = meta.eyebrow;

  Object.entries(viewPages).forEach(([key, element]) => {
    if (!element) return;
    if (key === finalTarget) {
      element.classList.remove('hidden');
      element.classList.add('active');
    } else {
      element.classList.add('hidden');
      element.classList.remove('active');
    }
  });

  Object.entries(navLinks).forEach(([key, link]) => {
    if (!link) return;
    link.classList.toggle('active', key === finalTarget);
  });

  // Fetch data sesuai view yang aktif hanya jika user sudah login
  if (!authUser) {
    closeMobileSidebar();
    return;
  }

  if (finalTarget === 'advance') {
    const userRole = (authUser && authUser.role) ? authUser.role : (getCurrentUser().role || '');
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      showAppAlert('Akses Ditolak: Menu Advance hanya dapat diakses oleh Admin dan GM.', true);
      window.location.hash = '#/monitoring';
      return;
    }
    switchAdvanceTab(advanceSubTab, false);
  } else if (finalTarget === 'fifoReport') {
    const userRole = (authUser && authUser.role) ? authUser.role : (getCurrentUser().role || '');
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      showAppAlert('Akses Ditolak: Laporan FIFO Spot hanya dapat diakses oleh Admin dan GM.', true);
      window.location.hash = '#/monitoring';
      return;
    }
    if (typeof loadFifoSpotReport === 'function') {
      loadFifoSpotReport();
    }
  } else if (finalTarget === 'monitoring') {
    if (!monitoringData.length) fetchMonitoring();
  } else if (finalTarget === 'archive') {
    fetchMonitoringArchive();
  } else if (finalTarget === 'history') {
    fetchMonitoringHistory();
  } else if (finalTarget === 'users') {
    fetchUsers();
  } else if (finalTarget === 'permissions') {
    fetchPermissionCatalog();
    fetchConfigUsers();
    if (selectedConfigUserId) loadConfigForUser(selectedConfigUserId);
  } else if (finalTarget === 'audit') {
    fetchAuditLogs();
  } else if (finalTarget === 'settings') {
    loadLogo();
    loadBackground();
    if (typeof loadTheme === 'function') loadTheme();
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
    : (!/berhasil|sukses|disalin|selesai/i.test(text) && /gagal|error|ditolak|batal|salah|kadaluarsa|unauthorized|forbidden|invalid|belum berhasil/i.test(text));
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
  const jwt = sessionStorage.getItem('monitoring_jwt');
  if (jwt) return jwt;
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
  toggle(bulkDeleteBtn, hasPermission('delete_selected'));

  // Sidebar navigation visibility
  const canManageUsers = hasPermission('manage_users');
  const canViewHistory = hasPermission('view_history');
  const canAccessConfig = hasPermission('access_config');
  const canCreateUser = hasPermission('create_user');
  const adminPermissions = ['import_bulk', 'view_history', 'delete_history', 'manage_users', 'access_config', 'download_template', 'delete_global', 'create_user', 'restore_updated', 'delete_selected'];
  const hasAdminPermission = role === 'super_admin' || role === 'admin' || adminPermissions.some((key) => hasPermission(key));

  toggle(navLinks.fifoReport, role === 'super_admin' || role === 'admin');
  toggle(navLinks.advance, role === 'super_admin' || role === 'admin');
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

  const canManageTheme = role === 'super_admin' || role === 'admin';
  const themeCard = document.getElementById('themeSettingCard');
  if (themeCard) toggle(themeCard, canManageTheme);


  if (addBtn) {
    addBtn.style.display = hasPermission('import_bulk') ? '' : 'none';
  }

  if (role === 'client') {
    toggle(monitoringBulkControls, hasPermission('edit_monitoring'));
    toggle(bulkArchiveBtn, false);
    toggle(bulkDeleteBtn, false);
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
}

function logout(message = null) {
  stopAutoRefresh();
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }

  authUser = null;
  sessionStorage.removeItem('monitoring_user');
  sessionStorage.removeItem('monitoring_jwt');
  window.location.hash = '#/monitoring';
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
  selectedUserIds = new Set();
  showLoginView();
  if (message && loginMessage) {
    loginMessage.textContent = message;
    loginMessage.classList.add('error');
  }
}

function resetSessionTimer() {
  // Sesi 30 hari dikelola via server cookie & heartbeat otomatis tiap 10 menit
}

// Background Heartbeat: perpanjang sesi secara otomatis setiap 10 menit
setInterval(async () => {
  if (!authUser) return;
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.status === 401) {
      logout();
    }
  } catch (_) {}
}, 10 * 60 * 1000);

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
  if (data.token) {
    sessionStorage.setItem('monitoring_jwt', data.token);
  }

  try {
    const token = data.token || getToken();
    const meHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const meResponse = await fetch('/api/auth/me', { credentials: 'include', headers: meHeaders });
    if (meResponse.ok) {
      const meData = await meResponse.json();
      setCurrentPermissions(meData.permissions || []);
      if (meData.token) sessionStorage.setItem('monitoring_jwt', meData.token);
    } else {
      setCurrentPermissions([]);
    }
  } catch (error) {
    setCurrentPermissions([]);
  }

  const currentHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
  if (!currentHash) {
    window.location.hash = '#/monitoring';
  }
  setAuthState();
  if (localStorage.getItem('pending_jfs_token') && typeof checkUrlForJfsToken === 'function') {
    checkUrlForJfsToken();
  }
}

async function bootstrapAuth() {
  try {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch('/api/auth/me', { credentials: 'include', headers });
    if (!response.ok) {
      authUser = null;
      sessionStorage.removeItem('monitoring_user');
      sessionStorage.removeItem('monitoring_jwt');
      showLoginView();
      return;
    }
    const data = await response.json();
    authUser = data.user;
    sessionStorage.setItem('monitoring_user', JSON.stringify(authUser));
    if (data.token) {
      sessionStorage.setItem('monitoring_jwt', data.token);
    }
    setCurrentPermissions(data.permissions || []);
    setAuthState();
    if (localStorage.getItem('pending_jfs_token') && typeof checkUrlForJfsToken === 'function') {
      checkUrlForJfsToken();
    }
  } catch (err) {
    authUser = null;
    sessionStorage.removeItem('monitoring_user');
    sessionStorage.removeItem('monitoring_jwt');
    showLoginView();
  }
}

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

  if (!autoRefreshInterval && typeof startAutoRefresh === 'function') {
    startAutoRefresh();
  }
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

async function deleteSelectedMonitoring() {
  const waybills = [...selectedMonitoringWaybills];
  if (!waybills.length) {
    alert('Pilih minimal satu nomor resi (AWB) yang ingin dihapus.');
    return;
  }

  if (!hasPermission('delete_selected')) {
    alert('Akses ditolak. Anda tidak memiliki izin untuk menghapus data AWB terpilih.');
    return;
  }

  const confirmed = confirm(`⚠️ PERINGATAN HAPUS PERMANEN!\n\nApakah Anda yakin ingin menghapus ${waybills.length} nomor resi terpilih secara permanen?\n\nData yang dihapus TIDAK DAPAT dikembalikan.`);
  if (!confirmed) return;

  try {
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = true;

    const response = await fetch('/api/monitoring/bulk', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ waybills }),
    });

    const result = await parseResponseJson(response);
    if (!response.ok) {
      alert(result.error || 'Gagal menghapus data monitoring terpilih.');
      return;
    }

    selectedMonitoringWaybills.clear();
    if (selectAllMonitoring) selectAllMonitoring.checked = false;
    updateSelectedMonitoringCount();

    await fetchMonitoring();
    if (hasPermission('view_history')) {
      await fetchAuditLogs();
    }

    alert(`${result.deletedCount || waybills.length} waybill terpilih berhasil dihapus permanen.`);
  } catch (err) {
    console.error('deleteSelectedMonitoring error:', err);
    alert('Terjadi kesalahan sistem saat menghapus data terpilih.');
  } finally {
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = false;
  }
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
    if (response.status === 401) {
      logout('Sesi Anda telah berakhir atau belum login. Silakan login kembali.');
      return;
    }
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
  importProgressModal?.setAttribute('aria-hidden', 'false');
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
  if (document.activeElement && importProgressModal?.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  importProgressModal?.classList.add('hidden');
  importProgressModal?.setAttribute('aria-hidden', 'true');
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
  if (!content) return [];

  // Tentukan delimiter: koma, titik-koma, atau tab
  let delimiter = ',';
  const firstNewline = content.indexOf('\n');
  const firstLine = firstNewline >= 0 ? content.slice(0, firstNewline) : content;
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  // RFC 4180 parser mendukung quoted multiline cells
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    String(header || '')
      .toLowerCase()
      .replace(/[\s_]+/g, '')
      .replace(/\uFEFF/g, '')
  );
  const headerIndex = (names) => headers.findIndex((h) => names.includes(h));
  const waybillIndex = headerIndex(['waybill', 'awb', 'resi']);
  const tanggalIndex = headerIndex(['tanggal', 'date']);
  const outletIndex = headerIndex(['outlet', 'outletname']);
  const stuckIndex = headers.findIndex((h) => h.includes('stuck') || h.includes('aging'));
  const tlcIndex = headerIndex(['tlc']);
  const namaBarangIndex = headerIndex(['namabarang', 'barang', 'product']);

  if (waybillIndex < 0 || stuckIndex < 0) return [];

  const parsedData = [];
  for (let i = 1; i < rows.length; i += 1) {
    const raw = rows[i];
    if (raw.length <= Math.max(waybillIndex, stuckIndex)) continue;

    const waybill = raw[waybillIndex];
    if (!waybill) continue;

    const tanggal = tanggalIndex >= 0 ? raw[tanggalIndex] : '';
    const outlet = outletIndex >= 0 ? raw[outletIndex] : '-';
    const stuck = raw[stuckIndex];
    const tlc = tlcIndex >= 0 ? raw[tlcIndex] : '-';
    const namaBarang = namaBarangIndex >= 0 ? raw[namaBarangIndex] : '-';

    const normalizedStuck = normalizeStuckCategory(stuck);
    parsedData.push({
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

  return parsedData;
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
    if (response.status === 401) {
      logout();
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      return;
    }
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
  showRegisterBtn.addEventListener('click', () => openRegisterModal());
}

if (closeRegisterModalBtn) {
  closeRegisterModalBtn.addEventListener('click', () => closeRegisterModal());
}

if (cancelRegisterBtn) {
  cancelRegisterBtn.addEventListener('click', () => closeRegisterModal());
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
  statusFilter.addEventListener('change', () => applyFilters());
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener('click', () => resetAllMonitoringFilters());
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

    refreshBtn.disabled = true;
    refreshBtn.classList.add('is-loading');

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
    if (!authUser) return;

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
  closeModalBtn.addEventListener('click', () => closeModal());
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => closeModal());
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
if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', deleteSelectedMonitoring);
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
  bulkActionManual.addEventListener('input', () => refreshBulkActionButtonState());
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



// Desktop Mini Sidebar Toggle Helper (Icon-only mode)
function toggleDesktopSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('is-collapsed');
  document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  try {
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
  } catch (_) {}
}

function initDesktopSidebarState() {
  if (window.innerWidth <= 992) return;
  try {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      const sidebar = document.getElementById('appSidebar');
      if (sidebar) {
        sidebar.classList.add('is-collapsed');
        document.body.classList.add('sidebar-collapsed');
      }
    }
  } catch (_) {}
}

// Inisialisasi posisi mini-sidebar saat halaman pertama kali dibuka
initDesktopSidebarState();
window.addEventListener('resize', () => {
  if (window.innerWidth <= 992) {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) sidebar.classList.remove('is-collapsed');
    document.body.classList.remove('sidebar-collapsed');
  } else {
    initDesktopSidebarState();
  }
});

// Sidebar Drawer, Mini-Sidebar & Router Events
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    if (window.innerWidth > 992) {
      toggleDesktopSidebar();
    } else {
      openMobileSidebar();
    }
  });
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvanceTabs);
} else {
  initAdvanceTabs();
}
