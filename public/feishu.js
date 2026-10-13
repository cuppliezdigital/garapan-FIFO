// ==========================================================================
// GENERATOR FEISHU - MONITORING DOKUMEN KENDARAAN (EXCEL-STYLE SPREADSHEET)
// ==========================================================================

let feishuExcelRows = []; // array of { awb: string, outlet: string, gateway: string, pic: string }
let feishuPicMap = null;
let feishuSelectedGreeting = 'Selamat pagi';

// 1. Preload / Ensure Entire 3,180 PIC Mapping in Client Memory (0ms Lookup)
async function ensureFeishuPicMap() {
  if (feishuPicMap && Object.keys(feishuPicMap).length > 0) return feishuPicMap;
  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/pic-map', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      feishuPicMap = data.data || {};
      window.feishuPicMap = feishuPicMap;
    }
  } catch (e) {
    console.error('ensureFeishuPicMap error:', e);
    feishuPicMap = feishuPicMap || {};
  }
  return feishuPicMap;
}

// 2. Resolve Gateway and PIC for a Row
function resolveFeishuRowPic(row) {
  const cleanOutlet = String(row.outlet || '').toUpperCase().trim();
  if (!cleanOutlet || !feishuPicMap) {
    row.gateway = '';
    row.pic = '';
    return;
  }
  const item = feishuPicMap[cleanOutlet];
  if (item) {
    row.gateway = item.nama_gateway || '';
    const rawPic = String(item.tagging_pic || '').trim();
    // Jika tagging belum diisi atau bernilai placeholder 'PIC', kosongkan saja!
    row.pic = (rawPic && rawPic.toUpperCase() !== 'PIC') ? rawPic : '';
  } else {
    row.gateway = '';
    row.pic = '';
  }
}

// 3. Initialize Blank Rows (Default 5 rows like Excel)
function initFeishuExcelRows() {
  if (feishuExcelRows.length === 0) {
    for (let i = 0; i < 5; i++) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
    }
  }
  renderFeishuExcelTable();
  updateFeishuStats();
  generateFeishuPreviewText();
}

// 4. Update Stat Strip
function updateFeishuStats() {
  const totalEl = document.getElementById('feishuTotalAwb');
  const mappedEl = document.getElementById('feishuMappedAwb');
  const timeEl = document.getElementById('feishuTimestamp');
  const dateEl = document.getElementById('feishuDateStr');
  const countEl = document.getElementById('feishuTableCount');

  const filledRows = feishuExcelRows.filter(r => r.awb && r.awb.trim().length > 0);
  const total = filledRows.length;
  const mapped = filledRows.filter(d => d.gateway).length;

  if (totalEl) totalEl.textContent = `${total} Resi`;
  if (mappedEl) mappedEl.textContent = `${mapped} / ${total}`;
  if (countEl) countEl.textContent = `${total} Baris`;

  const now = new Date();
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// 5. Render Excel Grid Table
function renderFeishuExcelTable() {
  const tbody = document.getElementById('feishuExcelTableBody');
  if (!tbody) return;

  tbody.innerHTML = feishuExcelRows.map((row, idx) => {
    const awb = row.awb || '';
    const outlet = row.outlet || '';
    const gw = row.gateway || '';
    const pic = row.pic || '';
    const reportCount = row.reportCount || 1;

    let resultHtml = '<span class="cell-empty-dash">-</span>';
    if (outlet) {
      if (gw) {
        const cleanPic = (pic && pic.toUpperCase() !== 'PIC') ? pic.trim() : '';
        const picTag = cleanPic
          ? `<span class="badge-pic-tag">${cleanPic.startsWith('@') ? cleanPic : '@' + cleanPic}</span>`
          : '';
        resultHtml = `
          <div class="excel-cell-result">
            <span class="badge-gw-tag">${escKendaraanHtml(gw)}</span>
            ${picTag}
          </div>
        `;
      } else {
        resultHtml = `
          <div class="unregistered-outlet-wrap" style="display: inline-flex; align-items: center; gap: 6px;">
            <span style="color: #fb7185; font-size: 0.74rem;">Outlet belum terdaftar</span>
            <button type="button" class="btn-inline-register-outlet" onclick="openRegisterOutletModal('${escKendaraanHtml(outlet)}', ${idx})" title="Daftarkan outlet ${escKendaraanHtml(outlet)}">+ Daftarkan</button>
          </div>
        `;
      }
    }

    // Status Report Pill button
    let reportPillHtml = '';
    if (reportCount >= 3) {
      reportPillHtml = `
        <button type="button" class="btn-report-pill pill-rep-3" onclick="cycleFeishuReportCount(${idx})" title="Klik untuk ubah: Sudah 3x report! Akan diberi ultimatum retur">
          <span class="pulse-red-dot"></span>
          <span>🚨 Report 3+ (Ultimatum)</span>
        </button>
      `;
    } else if (reportCount === 2) {
      reportPillHtml = `
        <button type="button" class="btn-report-pill pill-rep-2" onclick="cycleFeishuReportCount(${idx})" title="Klik untuk ubah: Follow-up ke-2">
          <span>Report 2 (Follow-up)</span>
        </button>
      `;
    } else {
      reportPillHtml = `
        <button type="button" class="btn-report-pill pill-rep-1" onclick="cycleFeishuReportCount(${idx})" title="Klik untuk ubah: Penagihan pertama kali">
          <span>Report 1</span>
        </button>
      `;
    }

    return `
      <tr data-row-idx="${idx}" class="${reportCount >= 3 ? 'row-report-ultimatum' : ''}">
        <td style="text-align: center; color: #94a3b8; font-size: 0.8rem;">${idx + 1}</td>
        <td>
          <input type="text" class="excel-cell-input awb-cell" data-idx="${idx}" data-field="awb" value="${escKendaraanHtml(awb)}" placeholder="201807259055" />
        </td>
        <td>
          <input type="text" class="excel-cell-input outlet-cell" data-idx="${idx}" data-field="outlet" value="${escKendaraanHtml(outlet)}" placeholder="JKT074A" />
        </td>
        <td>
          <div id="resultCell_${idx}">${resultHtml}</div>
        </td>
        <td style="text-align: center;">
          ${reportPillHtml}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-grid-row-del" onclick="deleteFeishuExcelRow(${idx})" title="Hapus baris ini">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Cycle report count on click (1 -> 2 -> 3 -> 1)
window.cycleFeishuReportCount = function(idx) {
  if (idx >= 0 && idx < feishuExcelRows.length) {
    const current = feishuExcelRows[idx].reportCount || 1;
    feishuExcelRows[idx].reportCount = (current % 3) + 1;
    renderFeishuExcelTable();
    generateFeishuPreviewText();
  }
};

// 6. Delete Row
window.deleteFeishuExcelRow = function(index) {
  if (index >= 0 && index < feishuExcelRows.length) {
    feishuExcelRows.splice(index, 1);
    if (feishuExcelRows.length === 0) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
    }
    renderFeishuExcelTable();
    updateFeishuStats();
    generateFeishuPreviewText();
  }
};

// 7. Add Rows (+1 / +5)
function addFeishuExcelRow(count = 1) {
  for (let i = 0; i < count; i++) {
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
  }
  renderFeishuExcelTable();
  updateFeishuStats();

  const lastInputs = document.querySelectorAll('#feishuExcelTableBody .awb-cell');
  if (lastInputs.length > 0) {
    lastInputs[lastInputs.length - count].focus();
  }
}

// 8. Reset / Clear Table
function clearFeishuExcelTable() {
  feishuExcelRows = [];
  for (let i = 0; i < 5; i++) {
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
  }
  renderFeishuExcelTable();
  updateFeishuStats();
  generateFeishuPreviewText();
  showAppAlert('Tabel input direset.');
}

// 9. Handle Table Input Event Delegation
function handleExcelTableInput(e) {
  const target = e.target;
  if (!target || !target.classList.contains('excel-cell-input')) return;

  const idx = parseInt(target.getAttribute('data-idx'), 10);
  const field = target.getAttribute('data-field');
  if (isNaN(idx) || !feishuExcelRows[idx]) return;

  const rawVal = target.value;
  feishuExcelRows[idx][field] = field === 'outlet' ? rawVal.toUpperCase().trim() : rawVal.trim();

  if (field === 'outlet') {
    resolveFeishuRowPic(feishuExcelRows[idx]);
    const resCell = document.getElementById(`resultCell_${idx}`);
    if (resCell) {
      const gw = feishuExcelRows[idx].gateway;
      const pic = feishuExcelRows[idx].pic;
      if (feishuExcelRows[idx].outlet) {
        if (gw) {
          const cleanPic = (pic && pic.toUpperCase() !== 'PIC') ? pic.trim() : '';
          const picTag = cleanPic
            ? `<span class="badge-pic-tag">${cleanPic.startsWith('@') ? cleanPic : '@' + cleanPic}</span>`
            : '';
          resCell.innerHTML = `
            <div class="excel-cell-result">
              <span class="badge-gw-tag">${escKendaraanHtml(gw)}</span>
              ${picTag}
            </div>
          `;
        } else {
          const rawOt = feishuExcelRows[idx].outlet;
          resCell.innerHTML = `
            <div class="unregistered-outlet-wrap" style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="color: #fb7185; font-size: 0.74rem;">Outlet belum terdaftar</span>
              <button type="button" class="btn-inline-register-outlet" onclick="openRegisterOutletModal('${escKendaraanHtml(rawOt)}', ${idx})" title="Daftarkan outlet ${escKendaraanHtml(rawOt)}">+ Daftarkan</button>
            </div>
          `;
        }
      } else {
        resCell.innerHTML = `<span class="cell-empty-dash">-</span>`;
      }
    }
  }

  updateFeishuStats();
  generateFeishuPreviewText();
}

// 10. Handle Clipboard Paste (Direct Excel Paste onto Table)
function handleExcelTablePaste(e) {
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return;
  const pastedText = clipboardData.getData('text');
  if (!pastedText) return;

  if (pastedText.includes('\t') || pastedText.includes('\n')) {
    e.preventDefault();
    parseAndInsertExcelData(pastedText);
  }
}

// Helper to fetch report counts from DB
async function fetchAwbReportCounts(awbList) {
  if (!awbList || awbList.length === 0) return {};
  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/report-counts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({ awbs: awbList })
    });
    if (res.ok) {
      const data = await res.json();
      return data.counts || {};
    }
  } catch (err) {
    console.warn('Gagal memuat riwayat report count:', err);
  }
  return {};
}

// 11. Parse Excel Text Data
async function parseAndInsertExcelData(text) {
  await ensureFeishuPicMap();

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return;

  feishuExcelRows = feishuExcelRows.filter(r => r.awb || r.outlet);

  let addedCount = 0;
  const newRows = [];
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (lower.includes('nomor awb') || lower.includes('outlet / asal') || lower.includes('waybill')) {
      return;
    }

    let awb = '';
    let outlet = '';

    if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim());
      awb = parts[0] || '';
      outlet = (parts[1] || '').toUpperCase();
    } else if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      awb = parts[0] || '';
      outlet = (parts[1] || '').toUpperCase();
    } else if (line.includes(' ')) {
      const parts = line.split(/\s+/).map(p => p.trim());
      awb = parts[0] || '';
      outlet = (parts[1] || '').toUpperCase();
    } else {
      awb = line.trim();
    }

    if (awb || outlet) {
      const row = { awb, outlet, gateway: '', pic: '', reportCount: 1 };
      resolveFeishuRowPic(row);
      newRows.push(row);
      addedCount++;
    }
  });

  // Query DB report counts for all new AWBs
  const awbsToLookup = newRows.map(r => r.awb).filter(Boolean);
  if (awbsToLookup.length > 0) {
    const countsMap = await fetchAwbReportCounts(awbsToLookup);
    newRows.forEach(r => {
      if (r.awb && countsMap[r.awb]) {
        const prevCount = countsMap[r.awb].count || 0;
        r.reportCount = prevCount >= 1 ? prevCount + 1 : 1;
      }
    });
  }

  feishuExcelRows.push(...newRows);

  while (feishuExcelRows.length < 5) {
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
  }

  renderFeishuExcelTable();
  updateFeishuStats();
  generateFeishuPreviewText();

  showAppAlert(`Berhasil memasukkan ${addedCount} baris dari Excel!`);
}

// 12. Generate Live Preview Text for Feishu / WhatsApp
function generateFeishuPreviewText() {
  const preview = document.getElementById('feishuDynamicPreview');
  if (!preview) return;

  const validRows = feishuExcelRows.filter(r => r.awb && r.awb.trim().length > 0);

  if (validRows.length === 0) {
    preview.textContent = 'Belum ada data resi. Masukkan Nomor AWB & Outlet Asal pada tabel di sebelah kiri untuk menghasilkan format pesan otomatis.';
    return;
  }

  let text = `${feishuSelectedGreeting} kak, tolong dibantu untuk kelengkapan dokumen kendaraan dengan awb berikut terimakasih :\n`;

  let hasUltimatum = false;

  validRows.forEach(row => {
    const awb = row.awb.trim();
    const outlet = (row.outlet || '').toUpperCase().trim();
    const gw = row.gateway || '';
    const cleanPic = (row.pic && row.pic.toUpperCase() !== 'PIC') ? row.pic.trim() : '';
    const rep = row.reportCount || 1;

    let line = `${awb}`;
    if (outlet) {
      line += ` ${outlet}`;
      if (gw) {
        line += ` ${gw}`;
        if (cleanPic) {
          const picFormatted = cleanPic.startsWith('@') ? cleanPic : `@${cleanPic}`;
          line += ` ${picFormatted}`;
        }
      }
    }

    if (rep >= 3) {
      hasUltimatum = true;
      line += ` -> (tolong segera lengkapi atau kami retur)`;
    }

    text += `${line}\n`;
  });

  if (hasUltimatum) {
    text += `\n⚠️ *Peringatan Khusus Resi 3x Report:* Mohon untuk resi yang bertanda *(tolong segera lengkapi atau kami retur)* segera dilengkapi dokumen fisiknya hari ini juga, apabila belum ada kepastian terpaksa paket akan kami proses retur ke outlet asal. Terima kasih.\n`;
  }

  preview.textContent = text.trim();
}

// 13. Pull HOLD Units from Database
async function fetchFeishuHoldList(isManual = false) {
  const btnPull = document.getElementById('btnPullFeishuHold');
  if (btnPull && isManual) btnPull.classList.add('is-loading');

  try {
    await ensureFeishuPicMap();
    const token = getToken();
    const res = await fetch('/api/kendaraan/feishu-hold-list', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    if (!res.ok) throw new Error('Gagal memuat data HOLD Feishu');
    const data = await res.json();
    const holdItems = data.data || [];

    if (holdItems.length === 0) {
      if (isManual) {
        showAppAlert('Tidak ada unit kendaraan yang sedang berstatus HOLD.');
      }
      return;
    }

    const awbList = holdItems.map(item => item.awb).filter(Boolean);
    const countsMap = await fetchAwbReportCounts(awbList);

    feishuExcelRows = holdItems.map(item => {
      const awb = item.awb || '';
      const prevCount = (countsMap[awb] && countsMap[awb].count) ? countsMap[awb].count : 0;
      const reportCount = prevCount >= 1 ? prevCount + 1 : 1;
      const row = {
        awb: awb,
        outlet: (item.effective_outlet || item.kode_outlet || '').toUpperCase(),
        gateway: item.effective_gateway || item.nama_gateway || '',
        pic: item.effective_pic || item.tagging_pic || '',
        reportCount: reportCount
      };
      if (row.outlet && (!row.gateway || !row.pic)) {
        resolveFeishuRowPic(row);
      }
      return row;
    });

    while (feishuExcelRows.length < 5) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '', reportCount: 1 });
    }

    renderFeishuExcelTable();
    updateFeishuStats();
    generateFeishuPreviewText();

    if (isManual) {
      showAppAlert(`Berhasil menarik ${holdItems.length} unit motor HOLD ke tabel.`);
    }
  } catch (err) {
    console.error('fetchFeishuHoldList error:', err);
    if (isManual) {
      showAppAlert(err.message, true);
    }
  } finally {
    if (btnPull && isManual) btnPull.classList.remove('is-loading');
  }
}

// 14. Batch Paste Modal Handling
function openFeishuBatchModal() {
  const modal = document.getElementById('feishuBatchModal');
  const textarea = document.getElementById('feishuBatchTextarea');
  if (textarea) textarea.value = '';
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => { if (textarea) textarea.focus(); }, 150);
  }
}

function closeFeishuBatchModal() {
  const modal = document.getElementById('feishuBatchModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function submitFeishuBatchForm(e) {
  e.preventDefault();
  const textarea = document.getElementById('feishuBatchTextarea');
  if (!textarea || !textarea.value.trim()) {
    showAppAlert('Masukkan atau tempel setidaknya satu baris dari Excel.');
    return;
  }

  await parseAndInsertExcelData(textarea.value.trim());
  closeFeishuBatchModal();
}

// 16. Event Listeners for Generator Feishu Module
let feishuListenersInitialized = false;
function initFeishuEventListeners() {
  if (feishuListenersInitialized) return;
  feishuListenersInitialized = true;

  // Preload PIC Map
  ensureFeishuPicMap().then(() => {
    initFeishuExcelRows();
  });

  // Pull button
  const btnPull = document.getElementById('btnPullFeishuHold');
  if (btnPull) btnPull.addEventListener('click', () => fetchFeishuHoldList(true));

  // Add Row buttons
  const btnAdd = document.getElementById('btnAddExcelRow');
  if (btnAdd) btnAdd.addEventListener('click', () => addFeishuExcelRow(1));

  const btnAddBottom = document.getElementById('btnAddExcelRowBottom');
  if (btnAddBottom) btnAddBottom.addEventListener('click', () => addFeishuExcelRow(1));

  const btnAdd5 = document.getElementById('btnAdd5ExcelRows');
  if (btnAdd5) btnAdd5.addEventListener('click', () => addFeishuExcelRow(5));

  // Reset / Clear button
  const btnClear = document.getElementById('btnClearExcelTable');
  if (btnClear) btnClear.addEventListener('click', clearFeishuExcelTable);

  // Table Event Delegation (Input & Paste)
  const excelTbody = document.getElementById('feishuExcelTableBody');
  if (excelTbody) {
    excelTbody.addEventListener('input', handleExcelTableInput);
    excelTbody.addEventListener('paste', handleExcelTablePaste);
  }

  // Also support paste on table container
  const tableWrap = document.querySelector('.feishu-excel-wrap');
  if (tableWrap) {
    tableWrap.addEventListener('paste', handleExcelTablePaste);
  }

  // Batch paste modal buttons
  const btnBatch = document.getElementById('btnOpenBatchAwbModal');
  if (btnBatch) btnBatch.addEventListener('click', openFeishuBatchModal);

  const closeBatchBtn = document.getElementById('closeFeishuBatchModalBtn');
  const cancelBatchBtn = document.getElementById('cancelFeishuBatchModalBtn');
  if (closeBatchBtn) closeBatchBtn.addEventListener('click', closeFeishuBatchModal);
  if (cancelBatchBtn) cancelBatchBtn.addEventListener('click', closeFeishuBatchModal);

  const batchForm = document.getElementById('feishuBatchForm');
  if (batchForm) batchForm.addEventListener('submit', submitFeishuBatchForm);

  // Open Master Gateways from Feishu
  const btnGw = document.getElementById('btnOpenMasterGatewaysFromFeishu');
  if (btnGw) btnGw.addEventListener('click', openMasterGatewaysModal);

  // Greeting Chips
  document.querySelectorAll('.chip-greeting').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-greeting').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      feishuSelectedGreeting = chip.getAttribute('data-greeting') || 'Selamat pagi';
      generateFeishuPreviewText();
    });
  });

  // Copy WhatsApp Message
  const btnCopy = document.getElementById('btnCopyFeishuMessage');
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const preview = document.getElementById('feishuDynamicPreview');
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent);
        const span = document.getElementById('btnCopyFeishuMessageText');
        if (span) span.textContent = 'Tersalin ke Clipboard! ✅';
        setTimeout(() => { if (span) span.textContent = 'Salin Pesan WhatsApp'; }, 2000);

        // Record / increment report counts for all valid AWBs in the table
        const validAwbs = feishuExcelRows
          .filter(r => r.awb && r.awb.trim().length > 0)
          .map(r => r.awb.trim());

        if (validAwbs.length > 0) {
          try {
            const token = getToken();
            await fetch('/api/kendaraan/increment-report', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              credentials: 'include',
              body: JSON.stringify({ awbs: validAwbs })
            });
          } catch (e) {
            console.warn('Gagal increment report count:', e);
          }
        }
      }
    });
  }

  // Register Outlet Modal buttons
  const btnOpenReg = document.getElementById('btnOpenRegisterOutletModal');
  if (btnOpenReg) btnOpenReg.addEventListener('click', () => openRegisterOutletModal(''));

  const closeRegBtn = document.getElementById('closeRegisterOutletBtn');
  const cancelRegBtn = document.getElementById('cancelRegisterOutletBtn');
  if (closeRegBtn) closeRegBtn.addEventListener('click', closeRegisterOutletModal);
  if (cancelRegBtn) cancelRegBtn.addEventListener('click', closeRegisterOutletModal);

  const regForm = document.getElementById('registerOutletForm');
  if (regForm) regForm.addEventListener('submit', submitRegisterOutletForm);
}

// ============================================================
// MODAL DAFTARKAN OUTLET BARU KE GATEWAY & PIC
// ============================================================
window.openRegisterOutletModal = async function(defaultOutlet = '', targetIdx = null) {
  const modal = document.getElementById('registerOutletModal');
  if (!modal) return;
  const codeInput = document.getElementById('regOutletCode');
  const gwInput = document.getElementById('regOutletGateway');
  const picInput = document.getElementById('regOutletPic');
  const dl = document.getElementById('regGatewayDatalist');

  if (codeInput) codeInput.value = (defaultOutlet || '').toUpperCase().trim();
  if (gwInput) gwInput.value = '';
  if (picInput) picInput.value = '';

  // Populate gateway datalist from masterGatewaysData if available, else fetch
  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/gateways', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const d = await res.json();
      const list = d.data || [];
      if (dl) {
        dl.innerHTML = list.map(g => `<option value="${escKendaraanHtml(g.nama_gateway)}">${escKendaraanHtml(g.nama_gateway)}${g.tagging_pic ? ' (PIC: @' + escKendaraanHtml(g.tagging_pic) + ')' : ''}</option>`).join('');
      }
    }
  } catch (err) {
    console.warn('Failed to load gateways for datalist:', err);
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    if (codeInput && !defaultOutlet) codeInput.focus();
    else if (gwInput) gwInput.focus();
  }, 100);
};

function closeRegisterOutletModal() {
  const modal = document.getElementById('registerOutletModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function submitRegisterOutletForm(e) {
  if (e) e.preventDefault();
  const token = getToken();
  if (!token) return;

  const codeInput = document.getElementById('regOutletCode');
  const gwInput = document.getElementById('regOutletGateway');
  const picInput = document.getElementById('regOutletPic');
  const submitBtn = document.getElementById('btnSubmitRegisterOutlet');

  const kode_outlet = (codeInput?.value || '').toUpperCase().trim();
  const nama_gateway = (gwInput?.value || '').trim();
  const tagging_pic = (picInput?.value || '').trim();

  if (!kode_outlet || !nama_gateway) {
    alert('Kode Outlet dan Nama Gateway wajib diisi!');
    return;
  }

  const origHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Menyimpan...</span>';
  }

  try {
    const res = await fetch('/api/kendaraan/outlets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kode_outlet, nama_gateway, tagging_pic }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mendaftarkan outlet');
    }

    // Update local client pic-map cache immediately
    if (!feishuPicMap) feishuPicMap = {};
    feishuPicMap[kode_outlet] = {
      nama_gateway: data.data.nama_gateway,
      tagging_pic: data.data.tagging_pic || '',
      display: data.data.display_gateway_pic,
    };

    // Re-resolve all rows in the spreadsheet that have this outlet
    feishuExcelRows.forEach(row => {
      if (String(row.outlet || '').toUpperCase().trim() === kode_outlet) {
        resolveFeishuRowPic(row);
      }
    });

    renderFeishuExcelTable();
    updateFeishuStats();
    generateFeishuPreviewText();

    closeRegisterOutletModal();
    showAppAlert(`✅ Outlet ${kode_outlet} berhasil didaftarkan ke ${nama_gateway}!`);
  } catch (err) {
    console.error('submitRegisterOutletForm error:', err);
    alert(`❌ Gagal: ${err.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHtml;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeishuEventListeners);
} else {
  initFeishuEventListeners();
}
