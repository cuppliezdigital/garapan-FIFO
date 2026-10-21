// ========================================================
// MODUL REKONSILIASI MUAT - BONGKAR & NON-AWB HUNTER
// ========================================================

(function initReconcileModule() {
  let currentReconcileMode = 'single'; // 'single' | 'multi'
  let multiUploadedFiles = { muat: [], bongkar: [] };
  let activeKpiFilter = 'missing'; // 'missing' | 'matched' | 'all'

  let reconcileDataMode1 = null; // Stored results for Mode 1 (1 File Resi Tugas)
  let reconcileDataMode2 = null; // Stored results for Mode 2 (Multi-File Transitan)

  let reconcileDataState = {
    totalLoaded: 0,
    totalLoadedWeight: 0,
    totalUnloaded: 0,
    allList: [],       // All loaded waybills with status: 'belum_bongkar' | 'sudah_bongkar'
    matchedList: [],   // Waybills with scan bongkar
    unmatchedList: [], // Waybills without scan bongkar
    origins: new Set(),
    destinations: new Set()
  };

  let filterState = {
    keyword: '',
    weight: null,
    tolerance: 1.0,
    perKoli: true,
    origin: '',
    destination: ''
  };

  // DOM Elements
  const tabSingle = document.getElementById('tabModeSingle');
  const tabMulti = document.getElementById('tabModeMulti');
  const areaSingle = document.getElementById('reconcileSingleUploadArea');
  const areaMulti = document.getElementById('reconcileMultiUploadArea');
  const dropzoneSingle = document.getElementById('dropzoneSingle');
  const inputSingle = document.getElementById('reconcileSingleFileInput');
  const btnBrowseSingle = document.getElementById('btnBrowseSingle');

  const dropzoneMuat = document.getElementById('dropzoneMuat');
  const inputMuat = document.getElementById('reconcileMuatFileInput');
  const btnBrowseMuat = document.getElementById('btnBrowseMuat');
  const listMuat = document.getElementById('selectedMuatFilesList');

  const dropzoneBongkar = document.getElementById('dropzoneBongkar');
  const inputBongkar = document.getElementById('reconcileBongkarFileInput');
  const btnBrowseBongkar = document.getElementById('btnBrowseBongkar');
  const listBongkar = document.getElementById('selectedBongkarFilesList');

  const btnExecuteMulti = document.getElementById('btnExecuteMultiReconcile');
  const loadingBar = document.getElementById('reconcileLoadingBar');
  const progressText = document.getElementById('reconcileProgressText');
  const progressSub = document.getElementById('reconcileProgressSub');

  const resultsSection = document.getElementById('reconcileResultsSection');
  
  // Interactive KPI Cards
  const kpiCardTotal = document.getElementById('kpiCardTotal');
  const kpiCardBongkar = document.getElementById('kpiCardBongkar');
  const kpiCardBelumBongkar = document.getElementById('kpiCardBelumBongkar');

  const kpiTotalMuat = document.getElementById('kpiTotalMuat');
  const kpiTotalMuatBerat = document.getElementById('kpiTotalMuatBerat');
  const kpiTotalBongkar = document.getElementById('kpiTotalBongkar');
  const kpiPersenBongkar = document.getElementById('kpiPersenBongkar');
  const kpiTotalBelumBongkar = document.getElementById('kpiTotalBelumBongkar');
  const kpiBelumBongkarBerat = document.getElementById('kpiBelumBongkarBerat');

  // Filter DOM
  const filterKeyword = document.getElementById('filterKeyword');
  const btnClearKeyword = document.getElementById('btnClearKeyword');
  const filterOrigin = document.getElementById('filterOrigin');
  const filterDestination = document.getElementById('filterDestination');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // Table & Action DOM
  const tableHead = document.getElementById('reconcileTableHead');
  const tableBody = document.getElementById('reconcileTableBody');
  const visibleCountEl = document.getElementById('visibleCount');
  const totalUnmatchedCountEl = document.getElementById('totalUnmatchedCount');
  const resultsCountBadge = document.getElementById('resultsCountBadge');
  const emptyState = document.getElementById('reconcileEmptyState');
  const noMatchState = document.getElementById('reconcileNoMatchState');
  const btnCopyAll = document.getElementById('btnCopyAllUnmatched');
  const btnCopyAllText = document.getElementById('btnCopyAllText');
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnRestart = document.getElementById('btnRestartReconcile');

  // Pagination DOM
  const paginationBar = document.getElementById('reconcilePaginationBar');
  const pageSizeSelect = document.getElementById('reconcilePageSize');
  const pageInfoCurrent = document.getElementById('reconcileCurrentPage');
  const pageInfoTotal = document.getElementById('reconcileTotalPages');
  const pageInfoRows = document.getElementById('reconcileTotalRows');
  const btnPrevPage = document.getElementById('reconcilePrevPage');
  const btnNextPage = document.getElementById('reconcileNextPage');

  // Filter, Sorting & Pagination State
  let currentFilteredList = [];
  let reconcileSortColumn = 'waybill';
  let reconcileSortDir = 'asc';
  let reconcilePageSize = 20;
  let reconcileCurrentPage = 1;
  let reconcileColumnFilters = {
    waybill: '',
    status: '',
    namaBarang: '',
    weight: '',
    route: '',
    waktu: '',
    waktuBongkar: '',
    gwAsal: '',
    petugas: '',
    resiTugas: '',
  };

  // 1. Tab Switching (Single vs Multi file)
  if (tabSingle && tabMulti) {
    tabSingle.addEventListener('click', () => switchMode('single'));
    tabMulti.addEventListener('click', () => switchMode('multi'));
  }

  function switchMode(mode) {
    currentReconcileMode = mode;
    reconcileCurrentPage = 1;
    if (mode === 'single') {
      tabSingle.classList.add('active');
      tabSingle.setAttribute('aria-selected', 'true');
      tabMulti.classList.remove('active');
      tabMulti.setAttribute('aria-selected', 'false');
      if (areaSingle) areaSingle.classList.remove('hidden');
      if (areaMulti) areaMulti.classList.add('hidden');

      if (reconcileDataMode1) {
        reconcileDataState = reconcileDataMode1;
        renderResults(false);
      } else {
        if (resultsSection) resultsSection.classList.add('hidden');
        if (paginationBar) paginationBar.classList.add('hidden');
      }
    } else {
      tabMulti.classList.add('active');
      tabMulti.setAttribute('aria-selected', 'true');
      tabSingle.classList.remove('active');
      tabSingle.setAttribute('aria-selected', 'false');
      if (areaMulti) areaMulti.classList.remove('hidden');
      if (areaSingle) areaSingle.classList.add('hidden');

      if (reconcileDataMode2) {
        reconcileDataState = reconcileDataMode2;
        renderResults(false);
      } else {
        if (resultsSection) resultsSection.classList.add('hidden');
        if (paginationBar) paginationBar.classList.add('hidden');
      }
    }
  }

  // 2. Interactive Clickable KPI Cards Setup
  function setupKpiCardClicks() {
    const cards = [
      { el: kpiCardTotal, filter: 'all' },
      { el: kpiCardBongkar, filter: 'matched' },
      { el: kpiCardBelumBongkar, filter: 'missing' }
    ];

    cards.forEach(({ el, filter }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        setKpiFilter(filter);
      });
    });
  }

  function setKpiFilter(filter) {
    activeKpiFilter = filter;
    reconcileCurrentPage = 1;
    updateKpiCardsVisual();
    renderTableHead();
    applyFiltersAndRenderTable();
  }

  function updateKpiCardsVisual() {
    const cardMap = {
      all: kpiCardTotal,
      matched: kpiCardBongkar,
      missing: kpiCardBelumBongkar
    };

    Object.entries(cardMap).forEach(([key, el]) => {
      if (!el) return;
      const isActive = key === activeKpiFilter;
      el.classList.toggle('is-active', isActive);
    });

    // Update export button label
    if (btnExportExcel) {
      const labels = {
        missing: 'Download Excel Belum Bongkar (.xlsx)',
        matched: 'Download Excel Sudah Bongkar (.xlsx)',
        all: 'Download Excel Semua Data (.xlsx)'
      };
      const span = btnExportExcel.querySelector('span');
      if (span) span.textContent = labels[activeKpiFilter] || 'Download Excel (.xlsx)';
    }
  }

  setupKpiCardClicks();

  // 3. File Parsing Helper using SheetJS
  async function parseFileRows(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          if (typeof XLSX === 'undefined') {
            throw new Error('Pustaka SheetJS belum termuat. Harap periksa koneksi internet atau muat ulang halaman.');
          }
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file ' + file.name));
      reader.readAsArrayBuffer(file);
    });
  }

  // Helper: Find value from multiple possible header keys
  function getFieldValue(row, possibleKeys) {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return row[key];
      }
    }
    const lowerKeys = Object.keys(row).reduce((acc, k) => {
      acc[k.trim().toLowerCase()] = row[k];
      return acc;
    }, {});
    for (const key of possibleKeys) {
      const lk = key.trim().toLowerCase();
      if (lowerKeys[lk] !== undefined && lowerKeys[lk] !== null && String(lowerKeys[lk]).trim() !== '') {
        return lowerKeys[lk];
      }
    }
    return '';
  }

  // Normalize row to standard object
  function normalizeRow(r) {
    const waybill = String(getFieldValue(r, ['Kode Waybill', 'nomor waybill utama', 'Waybill', 'waybill', 'No Waybill', 'resi', 'AWB'])).trim();
    const scanType = String(getFieldValue(r, ['jenis scan', 'Jenis Scan', 'scan_type', 'tipe scan'])).trim();
    const scanTime = String(getFieldValue(r, ['waktu scan', 'Waktu Scan', 'waktu unggah', 'scan_time'])).trim();
    const origin = String(getFieldValue(r, ['outlet pemindai', 'Outlet Pemindai', 'Outlet pengiriman', 'asal', 'Asal', 'Stasiun'])).trim();
    const destination = String(getFieldValue(r, [
      'Perhentian sebelumnya atau perhentian berikutnya next',
      'Pemberhentian sebelumnya/berikutnya',
      'Pemberhentian berikutnya',
      'Perhentian berikutnya',
      'Stasiun Berikutnya',
      'tujuan',
      'Tujuan',
      'Outlet penerima'
    ])).trim();

    const prevStop = String(getFieldValue(r, [
      'Pemberhentian sebelumnya',
      'Perhentian sebelumnya',
      'Stasiun Sebelumnya'
    ])).trim();

    const nextStop = String(getFieldValue(r, [
      'Pemberhentian berikutnya',
      'Perhentian berikutnya',
      'Stasiun Berikutnya'
    ])).trim();

    const outletPengiriman = String(getFieldValue(r, ['Outlet pengiriman', 'outlet pengiriman', 'asal kirim'])).trim();

    let rawWeight = getFieldValue(r, ['Berat', 'Total berat scan', 'berat', 'Perhitungan biaya berat']);
    let weight = parseFloat(rawWeight) || 0;

    let rawVolWeight = getFieldValue(r, ['berat volumetrik', 'Total volume scan', 'Perhitungan biaya berat']);
    let volWeight = parseFloat(rawVolWeight) || 0;

    let rawKoli = getFieldValue(r, ['Jumlah Koli', 'Jumlah koli', 'koli', 'Koli', 'Qty', 'qty']);
    let koli = parseInt(rawKoli, 10) || 1;
    if (koli < 1) koli = 1;

    const namaBarang = String(getFieldValue(r, ['Nama Barang', 'nama barang', 'Deskripsi', 'deskripsi barang yang disimpan di gudang', 'Komoditas'])).trim();
    const kemasan = String(getFieldValue(r, ['jenis kemasan', 'kemasan', 'Packaging'])).trim();
    const pemindai = String(getFieldValue(r, ['pemindai', 'Pemindai', 'petugas', 'nomor staf scan'])).trim();
    const resiTugas = String(getFieldValue(r, ['Nomor resi tugas', 'resi tugas', 'segel mobil', 'No Tugas'])).trim();

    return {
      waybill,
      scanType,
      scanTime,
      origin,
      destination,
      prevStop,
      nextStop,
      outletPengiriman,
      weight,
      volWeight,
      koli,
      namaBarang,
      kemasan,
      pemindai,
      resiTugas,
      raw: r
    };
  }

  // Unified Waybill Builder
  function buildOrUpdateWaybill(waybillsMap, norm, forcedType = null) {
    if (!norm || !norm.waybill) return;
    const wb = norm.waybill;
    const st = (norm.scanType || '').toLowerCase();

    const isMuat = forcedType === 'muat' || (!forcedType && (st.includes('kirim') || st.includes('muat')));
    const isBongkar = forcedType === 'bongkar' || (!forcedType && st.includes('bongkar'));
    const isSampai = !forcedType && (st.includes('sampai') || st.includes('tiba'));

    if (!waybillsMap.has(wb)) {
      waybillsMap.set(wb, {
        waybill: wb,
        status: 'belum_bongkar',
        namaBarang: norm.namaBarang || '',
        kemasan: norm.kemasan || '',
        weight: norm.weight || 0,
        volWeight: norm.volWeight || 0,
        koli: norm.koli || 1,
        resiTugas: norm.resiTugas || '',
        waktuMuat: '',
        gwMuat: '',
        petugasMuat: '',
        waktuBongkar: '',
        gwBongkar: '',
        petugasBongkar: '',
        origin: '',
        destination: '',
        asalBongkar: '',
        tujuanKirim: '',
        outletPengiriman: norm.outletPengiriman || '',
        pemindai: norm.pemindai || '',
        hasMuatScan: false,
        hasBongkarScan: false
      });
    }

    const item = waybillsMap.get(wb);

    if (norm.namaBarang && !item.namaBarang) item.namaBarang = norm.namaBarang;
    if (norm.kemasan && !item.kemasan) item.kemasan = norm.kemasan;
    if (norm.weight && !item.weight) item.weight = norm.weight;
    if (norm.volWeight && !item.volWeight) item.volWeight = norm.volWeight;
    if (norm.koli > 1 && item.koli === 1) item.koli = norm.koli;
    if (norm.resiTugas && !item.resiTugas) item.resiTugas = norm.resiTugas;
    if (norm.outletPengiriman && !item.outletPengiriman) item.outletPengiriman = norm.outletPengiriman;

    if (isMuat) {
      item.hasMuatScan = true;
      // Waktu Muat: simpan waktu scan kirim (ambil yang paling awal bila ada duplicate kirim)
      if (!item.waktuMuat || (norm.scanTime && norm.scanTime < item.waktuMuat)) {
        item.waktuMuat = norm.scanTime;
      }
      if (norm.origin) item.gwMuat = norm.origin;
      if (norm.nextStop || norm.destination) item.tujuanKirim = norm.nextStop || norm.destination;
      if (norm.pemindai) item.petugasMuat = norm.pemindai;
      if (norm.resiTugas) item.resiTugas = norm.resiTugas;
    } else if (isBongkar) {
      item.hasBongkarScan = true;
      // Waktu Bongkar: simpan waktu scan bongkar mobil terbaru
      if (!item.waktuBongkar || (norm.scanTime && norm.scanTime > item.waktuBongkar)) {
        item.waktuBongkar = norm.scanTime;
      }
      if (norm.origin) item.gwBongkar = norm.origin;
      if (norm.prevStop || norm.destination || norm.outletPengiriman) {
        item.asalBongkar = norm.prevStop || norm.destination || norm.outletPengiriman;
      }
      if (norm.pemindai) item.petugasBongkar = norm.pemindai;
      if (norm.resiTugas) item.resiTugas = norm.resiTugas;
    } else if (isSampai) {
      // Paket sampai GW adalah status kedatangan di tujuan (bongkar / arrival), bukan muat
      if (!item.hasBongkarScan) {
        item.hasBongkarScan = true;
        if (!item.waktuBongkar) item.waktuBongkar = norm.scanTime;
        if (norm.origin && !item.gwBongkar) item.gwBongkar = norm.origin;
        if ((norm.prevStop || norm.destination || norm.outletPengiriman) && !item.asalBongkar) {
          item.asalBongkar = norm.prevStop || norm.destination || norm.outletPengiriman;
        }
        if (norm.pemindai && !item.petugasBongkar) item.petugasBongkar = norm.pemindai;
      }
    }
  }

  // Finalize reconciled dataset
  function finalizeReconciliation(waybillsMap) {
    const allList = [];
    const matchedList = [];
    const unmatchedList = [];
    const origins = new Set();
    const destinations = new Set();
    let countMuat = 0;
    let countBongkar = 0;
    let totalLoadedWeight = 0;

    for (const item of waybillsMap.values()) {
      // Route direction: origin (loading outlet / gateway) -> destination (unloading gateway)
      let origin = item.gwMuat || item.asalBongkar || item.outletPengiriman || '—';
      let destination = item.gwBongkar || item.tujuanKirim || '—';

      // Anti-loop safety: Jika origin sama dengan destination padahal ada asal sebenarnya
      if (origin === destination && origin !== '—') {
        if (item.asalBongkar && item.asalBongkar !== destination) {
          origin = item.asalBongkar;
        } else if (item.outletPengiriman && item.outletPengiriman !== destination) {
          origin = item.outletPengiriman;
        } else if (item.tujuanKirim && item.tujuanKirim !== origin) {
          destination = item.tujuanKirim;
        }
      }

      item.origin = origin;
      item.destination = destination;

      if (origin && origin !== '—') origins.add(origin);
      if (destination && destination !== '—') destinations.add(destination);

      if (item.hasBongkarScan) {
        item.status = 'sudah_bongkar';
        countBongkar++;
      } else {
        item.status = 'belum_bongkar';
      }

      if (item.hasMuatScan || !item.hasBongkarScan) {
        countMuat++;
        totalLoadedWeight += (item.weight || 0);
      } else if (item.hasBongkarScan && !item.hasMuatScan) {
        countMuat++;
        totalLoadedWeight += (item.weight || 0);
      }

      allList.push(item);

      if (item.status === 'sudah_bongkar') {
        matchedList.push(item);
      } else {
        unmatchedList.push(item);
      }
    }

    const totalLoaded = allList.length;
    const totalUnloaded = countBongkar;

    return {
      totalLoaded,
      totalLoadedWeight,
      totalUnloaded,
      allList,
      matchedList,
      unmatchedList,
      origins,
      destinations
    };
  }

  // 4. Single File Mode Handler
  if (btnBrowseSingle && inputSingle) {
    btnBrowseSingle.addEventListener('click', (e) => {
      e.stopPropagation();
      inputSingle.click();
    });
  }

  if (dropzoneSingle && inputSingle) {
    dropzoneSingle.addEventListener('click', () => inputSingle.click());

    dropzoneSingle.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneSingle.classList.add('drag-over');
    });

    dropzoneSingle.addEventListener('dragleave', () => {
      dropzoneSingle.classList.remove('drag-over');
    });

    dropzoneSingle.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneSingle.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processSingleFile(e.dataTransfer.files[0]);
      }
    });

    inputSingle.addEventListener('change', () => {
      if (inputSingle.files && inputSingle.files.length > 0) {
        processSingleFile(inputSingle.files[0]);
      }
    });
  }

  function showLoading(mainMsg, subMsg) {
    if (loadingBar) {
      loadingBar.classList.remove('hidden');
      if (progressText) progressText.textContent = mainMsg;
      if (progressSub) progressSub.textContent = subMsg;
    }
  }

  function hideLoading() {
    if (loadingBar) loadingBar.classList.add('hidden');
  }

  async function processSingleFile(file) {
    if (!file) return;
    try {
      showLoading('Membaca file ' + file.name + '...', 'Mengekstrak data lembar kerja...');
      const rawRows = await parseFileRows(file);

      if (!rawRows || !rawRows.length) {
        alert('File kosong atau format tidak dapat dikenali.');
        hideLoading();
        return;
      }

      showLoading('Menganalisis ' + rawRows.length.toLocaleString('id-ID') + ' baris...', 'Memilah scan muat vs scan bongkar...');

      const waybillsMap = new Map();

      for (const r of rawRows) {
        const item = normalizeRow(r);
        if (!item.waybill) continue;
        buildOrUpdateWaybill(waybillsMap, item);
      }

      reconcileDataMode1 = finalizeReconciliation(waybillsMap);
      reconcileDataState = reconcileDataMode1;

      activeKpiFilter = 'missing'; // Default view: Belum Bongkar
      reconcileCurrentPage = 1;
      hideLoading();
      renderResults(true);

    } catch (err) {
      hideLoading();
      alert('Terjadi kesalahan saat memproses file: ' + err.message);
    }
  }

  // 5. Multi-File Mode Handler
  function setupMultiDropzone(dropzoneEl, inputEl, btnBrowseEl, listEl, type) {
    if (btnBrowseEl && inputEl) {
      btnBrowseEl.addEventListener('click', (e) => {
        e.stopPropagation();
        inputEl.click();
      });
    }

    if (dropzoneEl && inputEl) {
      dropzoneEl.addEventListener('click', () => inputEl.click());

      dropzoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneEl.classList.add('drag-over');
      });

      dropzoneEl.addEventListener('dragleave', () => {
        dropzoneEl.classList.remove('drag-over');
      });

      dropzoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleMultiFilesSelected(Array.from(e.dataTransfer.files), type, listEl);
        }
      });

      inputEl.addEventListener('change', () => {
        if (inputEl.files && inputEl.files.length > 0) {
          handleMultiFilesSelected(Array.from(inputEl.files), type, listEl);
        }
      });
    }
  }

  setupMultiDropzone(dropzoneMuat, inputMuat, btnBrowseMuat, listMuat, 'muat');
  setupMultiDropzone(dropzoneBongkar, inputBongkar, btnBrowseBongkar, listBongkar, 'bongkar');

  async function handleMultiFilesSelected(files, type, listEl) {
    for (const f of files) {
      multiUploadedFiles[type].push(f);
    }
    renderMultiFilesList(type, listEl);
    checkMultiExecuteReady();
  }

  function renderMultiFilesList(type, listEl) {
    if (!listEl) return;
    listEl.innerHTML = '';
    multiUploadedFiles[type].forEach((file, idx) => {
      const pill = document.createElement('div');
      pill.className = 'selected-file-pill';
      pill.innerHTML = `
        <div class="file-pill-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          </svg>
          <span class="file-pill-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <span class="file-pill-rows">(${(file.size / 1024).toFixed(0)} KB)</span>
        </div>
        <button type="button" class="file-pill-remove" title="Hapus file" data-type="${type}" data-idx="${idx}">×</button>
      `;
      listEl.appendChild(pill);
    });

    listEl.querySelectorAll('.file-pill-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = btn.getAttribute('data-type');
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        multiUploadedFiles[t].splice(i, 1);
        renderMultiFilesList(t, listEl);
        checkMultiExecuteReady();
      });
    });
  }

  function checkMultiExecuteReady() {
    if (!btnExecuteMulti) return;
    const hasMuat = multiUploadedFiles.muat.length > 0;
    const hasBongkar = multiUploadedFiles.bongkar.length > 0;
    btnExecuteMulti.disabled = !(hasMuat && hasBongkar);
  }

  if (btnExecuteMulti) {
    btnExecuteMulti.addEventListener('click', processMultiFiles);
  }

  async function processMultiFiles() {
    if (!multiUploadedFiles.muat.length || !multiUploadedFiles.bongkar.length) return;

    try {
      showLoading('Membaca semua file Muat & Bongkar...', 'Menggabungkan data transitan...');

      const waybillsMap = new Map();

      // 1. Process all Muat files
      for (let i = 0; i < multiUploadedFiles.muat.length; i++) {
        const file = multiUploadedFiles.muat[i];
        showLoading(`Membaca file Muat (${i + 1}/${multiUploadedFiles.muat.length}): ${file.name}...`, 'Menguraikan data muat...');
        const rows = await parseFileRows(file);
        for (const r of rows) {
          const item = normalizeRow(r);
          if (!item.waybill) continue;
          buildOrUpdateWaybill(waybillsMap, item, 'muat');
        }
      }

      // 2. Process all Bongkar files
      for (let i = 0; i < multiUploadedFiles.bongkar.length; i++) {
        const file = multiUploadedFiles.bongkar[i];
        showLoading(`Membaca file Bongkar (${i + 1}/${multiUploadedFiles.bongkar.length}): ${file.name}...`, 'Menguraikan data bongkar...');
        const rows = await parseFileRows(file);
        for (const r of rows) {
          const item = normalizeRow(r);
          if (!item.waybill) continue;
          buildOrUpdateWaybill(waybillsMap, item, 'bongkar');
        }
      }

      showLoading('Mencocokkan selisih transitan...', 'Menghitung hasil rekonsiliasi...');

      reconcileDataMode2 = finalizeReconciliation(waybillsMap);
      reconcileDataState = reconcileDataMode2;

      activeKpiFilter = 'missing';
      reconcileCurrentPage = 1;
      hideLoading();
      renderResults(true);

    } catch (err) {
      hideLoading();
      alert('Gagal merekonsiliasi multi-file: ' + err.message);
    }
  }

  // 6. Results & KPI Display
  function renderResults(autoScroll = true) {
    if (!resultsSection) return;
    resultsSection.classList.remove('hidden');

    const totalMuat = reconcileDataState.totalLoaded;
    const totalBongkar = reconcileDataState.totalUnloaded;
    const unmatchedCount = reconcileDataState.unmatchedList.length;
    const totalMuatWeight = reconcileDataState.totalLoadedWeight;

    let totalUnmatchedWeight = 0;
    let totalUnmatchedKoli = 0;
    reconcileDataState.unmatchedList.forEach((it) => {
      totalUnmatchedWeight += (it.weight || 0);
      totalUnmatchedKoli += (it.koli || 1);
    });

    const percentBongkar = totalMuat > 0 ? ((totalBongkar / totalMuat) * 100).toFixed(1) : 0;
    const percentMissing = totalMuat > 0 ? ((unmatchedCount / totalMuat) * 100).toFixed(1) : 0;

    if (kpiTotalMuat) kpiTotalMuat.textContent = totalMuat.toLocaleString('id-ID');
    if (kpiTotalMuatBerat) kpiTotalMuatBerat.textContent = `${totalMuatWeight.toFixed(1)} kg total muat`;

    if (kpiTotalBongkar) kpiTotalBongkar.textContent = totalBongkar.toLocaleString('id-ID');
    if (kpiPersenBongkar) kpiPersenBongkar.textContent = `${percentBongkar}% terselesaikan`;

    if (kpiTotalBelumBongkar) kpiTotalBelumBongkar.textContent = unmatchedCount.toLocaleString('id-ID');
    if (kpiBelumBongkarBerat) kpiBelumBongkarBerat.textContent = `${totalUnmatchedWeight.toFixed(1)} kg selisih (${percentMissing}%)`;

    updateKpiCardsVisual();
    populateFilterDropdowns();
    resetFilterValues();
    renderTableHead();
    applyFiltersAndRenderTable();

    if (autoScroll) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function populateFilterDropdowns() {
    if (filterOrigin) {
      filterOrigin.innerHTML = '<option value="">Semua Asal</option>';
      Array.from(reconcileDataState.origins).sort().forEach((orig) => {
        if (!orig) return;
        const opt = document.createElement('option');
        opt.value = orig;
        opt.textContent = orig;
        filterOrigin.appendChild(opt);
      });
    }

    if (filterDestination) {
      filterDestination.innerHTML = '<option value="">Semua Tujuan</option>';
      Array.from(reconcileDataState.destinations).sort().forEach((dest) => {
        if (!dest) return;
        const opt = document.createElement('option');
        opt.value = dest;
        opt.textContent = dest;
        filterDestination.appendChild(opt);
      });
    }
  }

  // 7. Filter Controls
  if (filterKeyword) {
    filterKeyword.addEventListener('input', () => {
      filterState.keyword = filterKeyword.value.trim().toLowerCase();
      if (btnClearKeyword) btnClearKeyword.classList.toggle('hidden', !filterState.keyword);
      reconcileCurrentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  if (btnClearKeyword) {
    btnClearKeyword.addEventListener('click', () => {
      if (filterKeyword) filterKeyword.value = '';
      filterState.keyword = '';
      btnClearKeyword.classList.add('hidden');
      reconcileCurrentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  if (filterOrigin) {
    filterOrigin.addEventListener('change', () => {
      filterState.origin = filterOrigin.value;
      reconcileCurrentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  if (filterDestination) {
    filterDestination.addEventListener('change', () => {
      filterState.destination = filterDestination.value;
      reconcileCurrentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', resetFilterValuesAndApply);
  }

  function resetFilterValues() {
    filterState = {
      keyword: '',
      origin: '',
      destination: ''
    };
    if (filterKeyword) filterKeyword.value = '';
    if (btnClearKeyword) btnClearKeyword.classList.add('hidden');
    if (filterOrigin) filterOrigin.value = '';
    if (filterDestination) filterDestination.value = '';
    reconcileColumnFilters = {
      waybill: '',
      status: '',
      namaBarang: '',
      weight: '',
      route: '',
      waktu: '',
      waktuBongkar: '',
      gwAsal: '',
      petugas: '',
      resiTugas: '',
    };
    if (tableHead) {
      tableHead.querySelectorAll('.reconcile-col-filter').forEach((inp) => {
        inp.value = '';
      });
    }
    reconcileCurrentPage = 1;
  }

  function resetFilterValuesAndApply() {
    resetFilterValues();
    applyFiltersAndRenderTable();
  }

  // Helper to render dynamic thead based on active tab and sort state
  function renderTableHead() {
    if (!tableHead) return;

    const makeTh = (colKey, label, extraStyle = '') => {
      const isSorted = reconcileSortColumn === colKey;
      const icon = isSorted ? (reconcileSortDir === 'asc' ? '▲' : '▼') : '↕';
      const activeClass = isSorted ? 'sort-active' : '';
      return `
        <th class="sortable-th ${activeClass}" data-sort="${colKey}" style="${extraStyle}" title="Klik untuk mengurutkan ${label}">
          <div class="th-content">
            <span>${label}</span>
            <span class="sort-icon">${icon}</span>
          </div>
        </th>
      `;
    };

    let headersHtml = '';
    let filterRowHtml = '';

    if (activeKpiFilter === 'missing') {
      // TAB: BELUM SCAN BONGKAR
      headersHtml = `
        <tr>
          <th style="width: 48px; text-align: center;">No</th>
          ${makeTh('waybill', 'Kode Waybill')}
          <th style="width: 140px;">Status</th>
          <th>Nama Barang &amp; Kemasan</th>
          ${makeTh('weight', 'Berat (Koli)')}
          ${makeTh('route', 'Rute Pengiriman')}
          ${makeTh('waktuMuat', 'Waktu Muat')}
          ${makeTh('gwMuat', 'GW Asal (Muat)')}
          <th style="min-width: 130px;">Petugas Muat</th>
          ${makeTh('resiTugas', 'Nomor Resi Tugas')}
        </tr>
      `;
      filterRowHtml = `
        <tr class="reconcile-filter-row" style="background: rgba(15, 23, 42, 0.95);">
          <th style="text-align: center; padding: 4px;">
            <button type="button" class="btn-clear-col-filters" id="btnClearReconcileFilters" title="Reset semua filter kolom" style="padding: 2px 5px; font-size: 0.68rem; border-radius: 4px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); cursor: pointer;">✕</button>
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waybill" placeholder="Cari Resi..." value="${escapeHtml(reconcileColumnFilters.waybill || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="status" placeholder="Cari Status..." value="${escapeHtml(reconcileColumnFilters.status || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="namaBarang" placeholder="Cari Barang..." value="${escapeHtml(reconcileColumnFilters.namaBarang || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="weight" placeholder="Cari Berat..." value="${escapeHtml(reconcileColumnFilters.weight || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="route" placeholder="Cari Rute..." value="${escapeHtml(reconcileColumnFilters.route || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waktu" placeholder="Cari Waktu..." value="${escapeHtml(reconcileColumnFilters.waktu || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="gwAsal" placeholder="Cari GW..." value="${escapeHtml(reconcileColumnFilters.gwAsal || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="petugas" placeholder="Cari Petugas..." value="${escapeHtml(reconcileColumnFilters.petugas || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="resiTugas" placeholder="Cari Resi Tugas..." value="${escapeHtml(reconcileColumnFilters.resiTugas || '')}">
          </th>
        </tr>
      `;
    } else if (activeKpiFilter === 'matched') {
      // TAB: SUDAH SCAN BONGKAR
      headersHtml = `
        <tr>
          <th style="width: 48px; text-align: center;">No</th>
          ${makeTh('waybill', 'Kode Waybill')}
          <th style="width: 140px;">Status</th>
          <th>Nama Barang &amp; Kemasan</th>
          ${makeTh('weight', 'Berat (Koli)')}
          ${makeTh('route', 'Rute Pengiriman')}
          ${makeTh('waktuBongkar', 'Waktu Bongkar')}
          ${makeTh('gwBongkar', 'GW Bongkar')}
          <th style="min-width: 130px;">Petugas Bongkar</th>
          ${makeTh('resiTugas', 'Nomor Resi Tugas')}
        </tr>
      `;
      filterRowHtml = `
        <tr class="reconcile-filter-row" style="background: rgba(15, 23, 42, 0.95);">
          <th style="text-align: center; padding: 4px;">
            <button type="button" class="btn-clear-col-filters" id="btnClearReconcileFilters" title="Reset semua filter kolom" style="padding: 2px 5px; font-size: 0.68rem; border-radius: 4px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); cursor: pointer;">✕</button>
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waybill" placeholder="Cari Resi..." value="${escapeHtml(reconcileColumnFilters.waybill || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="status" placeholder="Cari Status..." value="${escapeHtml(reconcileColumnFilters.status || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="namaBarang" placeholder="Cari Barang..." value="${escapeHtml(reconcileColumnFilters.namaBarang || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="weight" placeholder="Cari Berat..." value="${escapeHtml(reconcileColumnFilters.weight || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="route" placeholder="Cari Rute..." value="${escapeHtml(reconcileColumnFilters.route || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waktu" placeholder="Cari Waktu..." value="${escapeHtml(reconcileColumnFilters.waktu || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="gwAsal" placeholder="Cari GW..." value="${escapeHtml(reconcileColumnFilters.gwAsal || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="petugas" placeholder="Cari Petugas..." value="${escapeHtml(reconcileColumnFilters.petugas || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="resiTugas" placeholder="Cari Resi Tugas..." value="${escapeHtml(reconcileColumnFilters.resiTugas || '')}">
          </th>
        </tr>
      `;
    } else {
      // TAB: TOTAL DIMUAT (ALL)
      headersHtml = `
        <tr>
          <th style="width: 45px; text-align: center;">No</th>
          ${makeTh('waybill', 'Kode Waybill')}
          <th style="width: 130px;">Status</th>
          <th>Nama Barang &amp; Kemasan</th>
          ${makeTh('weight', 'Berat (Koli)')}
          ${makeTh('route', 'Rute Pengiriman')}
          ${makeTh('waktuMuat', 'Waktu Muat')}
          ${makeTh('waktuBongkar', 'Waktu Bongkar')}
          ${makeTh('gwMuat', 'GW Pemindai')}
          ${makeTh('resiTugas', 'Nomor Resi Tugas')}
        </tr>
      `;
      filterRowHtml = `
        <tr class="reconcile-filter-row" style="background: rgba(15, 23, 42, 0.95);">
          <th style="text-align: center; padding: 4px;">
            <button type="button" class="btn-clear-col-filters" id="btnClearReconcileFilters" title="Reset semua filter kolom" style="padding: 2px 5px; font-size: 0.68rem; border-radius: 4px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); cursor: pointer;">✕</button>
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waybill" placeholder="Cari Resi..." value="${escapeHtml(reconcileColumnFilters.waybill || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="status" placeholder="Cari Status..." value="${escapeHtml(reconcileColumnFilters.status || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="namaBarang" placeholder="Cari Barang..." value="${escapeHtml(reconcileColumnFilters.namaBarang || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="weight" placeholder="Cari Berat..." value="${escapeHtml(reconcileColumnFilters.weight || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="route" placeholder="Cari Rute..." value="${escapeHtml(reconcileColumnFilters.route || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waktu" placeholder="Cari Waktu..." value="${escapeHtml(reconcileColumnFilters.waktu || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="waktuBongkar" placeholder="Cari Waktu Bongkar..." value="${escapeHtml(reconcileColumnFilters.waktuBongkar || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="gwAsal" placeholder="Cari GW..." value="${escapeHtml(reconcileColumnFilters.gwAsal || '')}">
          </th>
          <th style="padding: 4px 6px;">
            <input type="text" class="col-filter-input reconcile-col-filter" data-col="resiTugas" placeholder="Cari Resi Tugas..." value="${escapeHtml(reconcileColumnFilters.resiTugas || '')}">
          </th>
        </tr>
      `;
    }

    tableHead.innerHTML = headersHtml + filterRowHtml;

    // Helper to update sort indicators without rebuilding thead inputs
    function updateSortHeadersVisual() {
      tableHead.querySelectorAll('.sortable-th').forEach((th) => {
        const sortKey = th.getAttribute('data-sort');
        const isSorted = reconcileSortColumn === sortKey;
        th.classList.toggle('sort-active', isSorted);
        const iconEl = th.querySelector('.sort-icon');
        if (iconEl) {
          iconEl.textContent = isSorted ? (reconcileSortDir === 'asc' ? '▲' : '▼') : '↕';
        }
      });
    }

    // Attach click listeners for sorting without destroying inputs
    tableHead.querySelectorAll('.sortable-th').forEach((th) => {
      th.addEventListener('click', () => {
        const sortKey = th.getAttribute('data-sort');
        if (!sortKey) return;
        if (reconcileSortColumn === sortKey) {
          reconcileSortDir = reconcileSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          reconcileSortColumn = sortKey;
          reconcileSortDir = (sortKey === 'waktuMuat' || sortKey === 'waktuBongkar') ? 'desc' : 'asc';
        }
        updateSortHeadersVisual();
        applyFiltersAndRenderTable();
      });
    });

    // Attach input listeners for per-column search filters with debounce and without recreating inputs
    let colFilterDebounceTimer = null;
    tableHead.querySelectorAll('.reconcile-col-filter').forEach((input) => {
      input.addEventListener('input', (e) => {
        const col = e.target.getAttribute('data-col');
        if (!col) return;
        reconcileColumnFilters[col] = e.target.value.trim().toLowerCase();
        reconcileCurrentPage = 1;
        clearTimeout(colFilterDebounceTimer);
        colFilterDebounceTimer = setTimeout(() => {
          applyFiltersAndRenderTable();
        }, 150);
      });
    });

    // Reset button for column filters
    const btnClearFilters = tableHead.querySelector('#btnClearReconcileFilters');
    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', () => {
        reconcileColumnFilters = {
          waybill: '',
          status: '',
          namaBarang: '',
          weight: '',
          route: '',
          waktu: '',
          waktuBongkar: '',
          gwAsal: '',
          petugas: '',
          resiTugas: '',
        };
        tableHead.querySelectorAll('.reconcile-col-filter').forEach((inp) => {
          inp.value = '';
        });
        reconcileCurrentPage = 1;
        applyFiltersAndRenderTable();
      });
    }
  }

  // 8. Filter Execution and Table Rendering
  function applyFiltersAndRenderTable() {
    if (!tableBody) return;

    let baseList = [];
    let filterTitle = 'AWB';

    if (activeKpiFilter === 'missing') {
      baseList = reconcileDataState.unmatchedList || [];
      filterTitle = 'AWB Belum Dibongkar';
    } else if (activeKpiFilter === 'matched') {
      baseList = reconcileDataState.matchedList || [];
      filterTitle = 'AWB Sudah Scan Bongkar';
    } else {
      baseList = reconcileDataState.allList || [];
      filterTitle = 'AWB Total Dimuat';
    }

    const filtered = baseList.filter((item) => {
      // Global Keyword filter
      if (filterState.keyword) {
        const kw = filterState.keyword;
        const wbMatch = item.waybill && item.waybill.toLowerCase().includes(kw);
        const nameMatch = item.namaBarang && item.namaBarang.toLowerCase().includes(kw);
        const originMatch = item.origin && item.origin.toLowerCase().includes(kw);
        const destMatch = item.destination && item.destination.toLowerCase().includes(kw);
        const gwMuatMatch = item.gwMuat && item.gwMuat.toLowerCase().includes(kw);
        const gwBongkarMatch = item.gwBongkar && item.gwBongkar.toLowerCase().includes(kw);
        const picMatch = (item.petugasMuat && item.petugasMuat.toLowerCase().includes(kw)) ||
                         (item.petugasBongkar && item.petugasBongkar.toLowerCase().includes(kw)) ||
                         (item.pemindai && item.pemindai.toLowerCase().includes(kw));
        const resiTugasMatch = item.resiTugas && item.resiTugas.toLowerCase().includes(kw);
        if (!wbMatch && !nameMatch && !originMatch && !destMatch && !gwMuatMatch && !gwBongkarMatch && !picMatch && !resiTugasMatch) {
          return false;
        }
      }

      // Column Specific Filters
      if (reconcileColumnFilters.waybill) {
        if (!item.waybill || !item.waybill.toLowerCase().includes(reconcileColumnFilters.waybill)) return false;
      }
      if (reconcileColumnFilters.status) {
        const st = String(item.status || (activeKpiFilter === 'matched' ? 'sudah scan bongkar' : 'belum scan bongkar')).toLowerCase();
        if (!st.includes(reconcileColumnFilters.status)) return false;
      }
      if (reconcileColumnFilters.namaBarang) {
        const nb = `${item.namaBarang || ''} ${item.kemasan || ''}`.toLowerCase();
        if (!nb.includes(reconcileColumnFilters.namaBarang)) return false;
      }
      if (reconcileColumnFilters.weight) {
        const wtStr = `${item.weight || ''} ${item.packageNumber || ''} ${item.koli || ''}`.toLowerCase();
        if (!wtStr.includes(reconcileColumnFilters.weight)) return false;
      }
      if (reconcileColumnFilters.route) {
        const rtStr = `${item.origin || ''} ${item.destination || ''} ${item.route || ''}`.toLowerCase();
        if (!rtStr.includes(reconcileColumnFilters.route)) return false;
      }
      if (reconcileColumnFilters.waktu) {
        const timeStr = `${item.waktuMuat || ''} ${item.waktuBongkar || ''} ${item.jam || ''} ${item.tanggal || ''}`.toLowerCase();
        if (!timeStr.includes(reconcileColumnFilters.waktu)) return false;
      }
      if (reconcileColumnFilters.waktuBongkar) {
        const wbStr = `${item.waktuBongkar || ''}`.toLowerCase();
        if (!wbStr.includes(reconcileColumnFilters.waktuBongkar)) return false;
      }
      if (reconcileColumnFilters.gwAsal) {
        const gwStr = `${item.gwMuat || ''} ${item.gwBongkar || ''} ${item.pemindai || ''}`.toLowerCase();
        if (!gwStr.includes(reconcileColumnFilters.gwAsal)) return false;
      }
      if (reconcileColumnFilters.petugas) {
        const picStr = `${item.petugasMuat || ''} ${item.petugasBongkar || ''} ${item.pemindai || ''}`.toLowerCase();
        if (!picStr.includes(reconcileColumnFilters.petugas)) return false;
      }
      if (reconcileColumnFilters.resiTugas) {
        if (!item.resiTugas || !item.resiTugas.toLowerCase().includes(reconcileColumnFilters.resiTugas)) return false;
      }

      // Origin filter
      if (filterState.origin && item.origin !== filterState.origin && item.gwMuat !== filterState.origin) {
        return false;
      }

      // Destination filter
      if (filterState.destination && item.destination !== filterState.destination && item.gwBongkar !== filterState.destination) {
        return false;
      }

      return true;
    });

    currentFilteredList = filtered;

    // Sorting
    filtered.sort((a, b) => {
      let valA, valB;
      switch (reconcileSortColumn) {
        case 'waybill':
          valA = a.waybill || '';
          valB = b.waybill || '';
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'weight':
          valA = a.weight || 0;
          valB = b.weight || 0;
          return reconcileSortDir === 'asc' ? valA - valB : valB - valA;
        case 'route':
          valA = `${a.origin || ''} ${a.destination || ''}`;
          valB = `${b.origin || ''} ${b.destination || ''}`;
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'waktuMuat':
          valA = a.waktuMuat || '';
          valB = b.waktuMuat || '';
          if (!valA && !valB) return 0;
          if (!valA) return 1;
          if (!valB) return -1;
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'waktuBongkar':
          valA = a.waktuBongkar || '';
          valB = b.waktuBongkar || '';
          if (!valA && !valB) return 0;
          if (!valA) return 1;
          if (!valB) return -1;
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'gwMuat':
          valA = a.gwMuat || a.origin || '';
          valB = b.gwMuat || b.origin || '';
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'gwBongkar':
          valA = a.gwBongkar || a.destination || '';
          valB = b.gwBongkar || b.destination || '';
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'resiTugas':
          valA = a.resiTugas || '';
          valB = b.resiTugas || '';
          return reconcileSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        default:
          return 0;
      }
    });

    if (resultsCountBadge) {
      resultsCountBadge.innerHTML = `Menampilkan <strong id="visibleCount">${filtered.length.toLocaleString('id-ID')}</strong> dari <strong id="totalUnmatchedCount">${baseList.length.toLocaleString('id-ID')}</strong> ${filterTitle}`;
    }

    tableBody.innerHTML = '';

    if (baseList.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (noMatchState) noMatchState.classList.add('hidden');
      if (paginationBar) paginationBar.classList.add('hidden');
      return;
    }

    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.add('hidden');
      if (noMatchState) noMatchState.classList.remove('hidden');
      if (paginationBar) paginationBar.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (noMatchState) noMatchState.classList.add('hidden');

    // Pagination calculations
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / reconcilePageSize));

    if (reconcileCurrentPage > totalPages) {
      reconcileCurrentPage = totalPages;
    }
    if (reconcileCurrentPage < 1) {
      reconcileCurrentPage = 1;
    }

    const startIdx = (reconcileCurrentPage - 1) * reconcilePageSize;
    const endIdx = startIdx + reconcilePageSize;
    const pageItems = filtered.slice(startIdx, endIdx);

    if (paginationBar) {
      paginationBar.classList.remove('hidden');
    }
    if (pageInfoCurrent) pageInfoCurrent.textContent = reconcileCurrentPage;
    if (pageInfoTotal) pageInfoTotal.textContent = totalPages;
    if (pageInfoRows) pageInfoRows.textContent = totalItems.toLocaleString('id-ID');
    if (btnPrevPage) btnPrevPage.disabled = (reconcileCurrentPage <= 1);
    if (btnNextPage) btnNextPage.disabled = (reconcileCurrentPage >= totalPages);

    const fragment = document.createDocumentFragment();

    pageItems.forEach((item, index) => {
      const tr = document.createElement('tr');
      const estPerKoli = item.koli > 1 && item.weight > 0 ? (item.weight / item.koli).toFixed(1) : null;
      const isBelumBongkar = item.status === 'belum_bongkar';

      let dynamicCols = '';
      if (activeKpiFilter === 'missing') {
        const scanTimePart = item.waktuMuat ? item.waktuMuat.split(' ') : ['—', ''];
        dynamicCols = `
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; color: #e2e8f0;">${scanTimePart[1] || scanTimePart[0]}</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">${scanTimePart[1] ? scanTimePart[0] : ''}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #38bdf8; font-weight: 600;">${escapeHtml(item.gwMuat || item.origin || '—')}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #f1f5f9; font-weight: 500;">${escapeHtml(item.petugasMuat || item.pemindai || '—')}</div>
          </td>
          <td>
            <div style="font-size: 0.76rem; font-family: monospace; color: #94a3b8;">${escapeHtml(item.resiTugas || '—')}</div>
          </td>
        `;
      } else if (activeKpiFilter === 'matched') {
        const scanTimePart = item.waktuBongkar ? item.waktuBongkar.split(' ') : ['—', ''];
        dynamicCols = `
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; color: #e2e8f0;">${scanTimePart[1] || scanTimePart[0]}</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">${scanTimePart[1] ? scanTimePart[0] : ''}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #10b981; font-weight: 600;">${escapeHtml(item.gwBongkar || item.destination || '—')}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #f1f5f9; font-weight: 500;">${escapeHtml(item.petugasBongkar || item.pemindai || '—')}</div>
          </td>
          <td>
            <div style="font-size: 0.76rem; font-family: monospace; color: #94a3b8;">${escapeHtml(item.resiTugas || '—')}</div>
          </td>
        `;
      } else {
        const muatPart = item.waktuMuat ? item.waktuMuat.split(' ') : ['—', ''];
        const bongkarPart = item.waktuBongkar ? item.waktuBongkar.split(' ') : ['—', ''];
        dynamicCols = `
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; color: #e2e8f0;">${muatPart[1] || muatPart[0]}</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">${muatPart[1] ? muatPart[0] : ''}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; color: ${item.waktuBongkar ? '#10b981' : '#64748b'};">${bongkarPart[1] || bongkarPart[0]}</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">${bongkarPart[1] ? bongkarPart[0] : ''}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: #cbd5e1;">${escapeHtml(item.gwMuat || item.gwBongkar || item.origin || '—')}</div>
          </td>
          <td>
            <div style="font-size: 0.76rem; font-family: monospace; color: #94a3b8;">${escapeHtml(item.resiTugas || '—')}</div>
          </td>
        `;
      }

      tr.innerHTML = `
        <td style="color: #94a3b8; font-size: 0.8rem; text-align: center;">${startIdx + index + 1}</td>
        <td>
          <div class="reconcile-waybill-cell">
            <span class="reconcile-waybill-code">${item.waybill}</span>
            <button type="button" class="btn-copy-waybill" title="Copy nomor resi" data-waybill="${item.waybill}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        </td>
        <td>
          ${isBelumBongkar
            ? `<span class="reconcile-status-badge status-missing"><span class="status-dot-pulse"></span>Belum Bongkar</span>`
            : `<span class="reconcile-status-badge status-matched"><span class="status-dot-pulse"></span>Sudah Bongkar</span>`
          }
        </td>
        <td>
          <div class="reconcile-barang-name" title="${escapeHtml(item.namaBarang || 'Tanpa Keterangan')}">
            ${escapeHtml(item.namaBarang || '—')}
          </div>
          ${item.kemasan ? `<div class="reconcile-barang-sub">📦 Kemasan: ${escapeHtml(item.kemasan)}</div>` : ''}
        </td>
        <td>
          <div class="reconcile-weight-primary">${item.weight ? item.weight.toFixed(1) + ' kg' : '—'}</div>
          <div class="reconcile-weight-sub">${item.koli} Koli${estPerKoli ? ` (±${estPerKoli} kg/koli)` : ''}</div>
        </td>
        <td>
          <div class="reconcile-route-badge">
            <span>${escapeHtml(item.origin || '?')}</span>
            <span class="route-arrow">➔</span>
            <span>${escapeHtml(item.destination || '?')}</span>
          </div>
        </td>
        ${dynamicCols}
      `;

      fragment.appendChild(tr);
    });

    tableBody.appendChild(fragment);

    // Setup Copy Waybill Buttons on rendered rows
    tableBody.querySelectorAll('.btn-copy-waybill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wb = btn.getAttribute('data-waybill');
        if (!wb) return;
        navigator.clipboard.writeText(wb).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            `;
          }, 1500);
        });
      });
    });
  }

  // Setup Pagination Event Listeners
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', () => {
      const val = pageSizeSelect.value;
      reconcilePageSize = val === 'all' ? 999999 : (parseInt(val, 10) || 20);
      reconcileCurrentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  if (btnPrevPage) {
    btnPrevPage.addEventListener('click', () => {
      if (reconcileCurrentPage > 1) {
        reconcileCurrentPage--;
        applyFiltersAndRenderTable();
      }
    });
  }

  if (btnNextPage) {
    btnNextPage.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(currentFilteredList.length / reconcilePageSize));
      if (reconcileCurrentPage < totalPages) {
        reconcileCurrentPage++;
        applyFiltersAndRenderTable();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 9. Copy Filtered Waybills (Rule: If search/filter active, copy only search results. If empty, copy all in tab)
  if (btnCopyAll) {
    btnCopyAll.addEventListener('click', () => {
      let baseList = [];
      if (activeKpiFilter === 'missing') {
        baseList = reconcileDataState.unmatchedList || [];
      } else if (activeKpiFilter === 'matched') {
        baseList = reconcileDataState.matchedList || [];
      } else {
        baseList = reconcileDataState.allList || [];
      }

      const hasActiveFilter = Boolean(filterState.keyword || filterState.origin || filterState.destination);
      const itemsToCopy = hasActiveFilter ? currentFilteredList : baseList;

      if (!itemsToCopy || !itemsToCopy.length) {
        alert(hasActiveFilter ? 'Tidak ada resi dari hasil pencarian/filter untuk disalin.' : 'Tidak ada resi untuk disalin.');
        return;
      }

      const waybillText = itemsToCopy.map((it) => it.waybill).filter(Boolean).join('\n');
      navigator.clipboard.writeText(waybillText).then(() => {
        if (btnCopyAllText) {
          const orig = btnCopyAllText.textContent;
          const label = hasActiveFilter ? `Tersalin ${itemsToCopy.length} Resi Filter! ✓` : `Tersalin ${itemsToCopy.length} Resi! ✓`;
          btnCopyAllText.textContent = label;
          setTimeout(() => {
            btnCopyAllText.textContent = orig;
          }, 2000);
        }
      });
    });
  }

  // 10. Export to Excel using SheetJS (Exports current filtered data, matching active tab columns)
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', exportFilteredToExcel);
  }

  function exportFilteredToExcel() {
    let baseList = [];
    let sheetName = 'Belum Scan Bongkar';
    let filePrefix = 'REKONSILIASI_BELUM_BONGKAR';

    if (activeKpiFilter === 'missing') {
      baseList = reconcileDataState.unmatchedList || [];
      sheetName = 'Belum Scan Bongkar';
      filePrefix = 'REKONSILIASI_BELUM_BONGKAR';
    } else if (activeKpiFilter === 'matched') {
      baseList = reconcileDataState.matchedList || [];
      sheetName = 'Sudah Scan Bongkar';
      filePrefix = 'REKONSILIASI_SUDAH_BONGKAR';
    } else {
      baseList = reconcileDataState.allList || [];
      sheetName = 'Semua Muatan';
      filePrefix = 'REKONSILIASI_SEMUA_DATA';
    }

    const hasColumnFilter = Object.values(reconcileColumnFilters || {}).some((v) => Boolean(v));
    const hasActiveFilter = Boolean(filterState.keyword || filterState.origin || filterState.destination || hasColumnFilter);
    const items = hasActiveFilter ? currentFilteredList : baseList;

    if (!items || !items.length) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('Pustaka SheetJS belum tersedia.');
      return;
    }

    let exportRows = [];
    let colWidths = [];

    if (activeKpiFilter === 'missing') {
      exportRows = items.map((item, idx) => ({
        'No': idx + 1,
        'Kode Waybill': item.waybill,
        'Status': 'Belum Bongkar',
        'Nama Barang': item.namaBarang || '',
        'Jenis Kemasan': item.kemasan || '',
        'Berat (Kg)': item.weight || 0,
        'Jumlah Koli': item.koli || 1,
        'Estimasi Berat/Koli (Kg)': item.koli > 1 && item.weight > 0 ? parseFloat((item.weight / item.koli).toFixed(2)) : item.weight || 0,
        'GW Asal (Muat)': item.gwMuat || item.origin || '',
        'Tujuan': item.destination || '',
        'Waktu Scan Muat': item.waktuMuat || '',
        'Petugas Muat': item.petugasMuat || item.pemindai || '',
        'Nomor Resi Tugas': item.resiTugas || ''
      }));

      colWidths = [
        { wch: 6 },  // No
        { wch: 18 }, // Kode Waybill
        { wch: 16 }, // Status
        { wch: 35 }, // Nama Barang
        { wch: 15 }, // Kemasan
        { wch: 12 }, // Berat
        { wch: 12 }, // Koli
        { wch: 22 }, // Est Berat/koli
        { wch: 18 }, // GW Asal (Muat)
        { wch: 18 }, // Tujuan
        { wch: 20 }, // Waktu Scan Muat
        { wch: 20 }, // Petugas Muat
        { wch: 22 }  // Resi Tugas
      ];
    } else if (activeKpiFilter === 'matched') {
      exportRows = items.map((item, idx) => ({
        'No': idx + 1,
        'Kode Waybill': item.waybill,
        'Status': 'Sudah Bongkar',
        'Nama Barang': item.namaBarang || '',
        'Jenis Kemasan': item.kemasan || '',
        'Berat (Kg)': item.weight || 0,
        'Jumlah Koli': item.koli || 1,
        'Estimasi Berat/Koli (Kg)': item.koli > 1 && item.weight > 0 ? parseFloat((item.weight / item.koli).toFixed(2)) : item.weight || 0,
        'Asal': item.origin || '',
        'GW Bongkar': item.gwBongkar || item.destination || '',
        'Waktu Scan Bongkar': item.waktuBongkar || '',
        'Petugas Bongkar': item.petugasBongkar || item.pemindai || '',
        'Nomor Resi Tugas': item.resiTugas || ''
      }));

      colWidths = [
        { wch: 6 },  // No
        { wch: 18 }, // Kode Waybill
        { wch: 16 }, // Status
        { wch: 35 }, // Nama Barang
        { wch: 15 }, // Kemasan
        { wch: 12 }, // Berat
        { wch: 12 }, // Koli
        { wch: 22 }, // Est Berat/koli
        { wch: 18 }, // Asal
        { wch: 18 }, // GW Bongkar
        { wch: 20 }, // Waktu Scan Bongkar
        { wch: 20 }, // Petugas Bongkar
        { wch: 22 }  // Resi Tugas
      ];
    } else {
      exportRows = items.map((item, idx) => ({
        'No': idx + 1,
        'Kode Waybill': item.waybill,
        'Status': item.status === 'sudah_bongkar' ? 'Sudah Bongkar' : 'Belum Bongkar',
        'Nama Barang': item.namaBarang || '',
        'Jenis Kemasan': item.kemasan || '',
        'Berat (Kg)': item.weight || 0,
        'Jumlah Koli': item.koli || 1,
        'Estimasi Berat/Koli (Kg)': item.koli > 1 && item.weight > 0 ? parseFloat((item.weight / item.koli).toFixed(2)) : item.weight || 0,
        'Asal': item.origin || '',
        'Tujuan': item.destination || '',
        'Waktu Scan Muat': item.waktuMuat || '',
        'Waktu Scan Bongkar': item.waktuBongkar || '',
        'GW Pemindai': item.gwMuat || item.gwBongkar || item.origin || '',
        'Nomor Resi Tugas': item.resiTugas || ''
      }));

      colWidths = [
        { wch: 6 },  // No
        { wch: 18 }, // Kode Waybill
        { wch: 16 }, // Status
        { wch: 35 }, // Nama Barang
        { wch: 15 }, // Kemasan
        { wch: 12 }, // Berat
        { wch: 12 }, // Koli
        { wch: 22 }, // Est Berat/koli
        { wch: 18 }, // Asal
        { wch: 18 }, // Tujuan
        { wch: 20 }, // Waktu Scan Muat
        { wch: 20 }, // Waktu Scan Bongkar
        { wch: 20 }, // GW Pemindai
        { wch: 22 }  // Resi Tugas
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const filterSuffix = hasActiveFilter ? '_FILTERED' : '';
    const fileName = `${filePrefix}${filterSuffix}_${dateStr}_${timeStr}.xlsx`;

    try {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (_) {
      XLSX.writeFile(workbook, fileName);
    }
  }

  // 11. Restart / Upload Ulang
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      const modeName = currentReconcileMode === 'single' ? '1 File Resi Tugas' : 'Multi-File Transitan';
      if (confirm(`Mulai rekonsiliasi baru untuk mode ${modeName}? Data pada mode ini akan direset.`)) {
        if (resultsSection) resultsSection.classList.add('hidden');
        if (paginationBar) paginationBar.classList.add('hidden');
        if (currentReconcileMode === 'single') {
          if (inputSingle) inputSingle.value = '';
          reconcileDataMode1 = null;
        } else {
          if (inputMuat) inputMuat.value = '';
          if (inputBongkar) inputBongkar.value = '';
          multiUploadedFiles = { muat: [], bongkar: [] };
          if (listMuat) listMuat.innerHTML = '';
          if (listBongkar) listBongkar.innerHTML = '';
          checkMultiExecuteReady();
          reconcileDataMode2 = null;
        }
        reconcileDataState = {
          totalLoaded: 0,
          totalLoadedWeight: 0,
          totalUnloaded: 0,
          allList: [],
          matchedList: [],
          unmatchedList: [],
          origins: new Set(),
          destinations: new Set()
        };
        currentFilteredList = [];
        reconcileCurrentPage = 1;
        resetFilterValues();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
})();

