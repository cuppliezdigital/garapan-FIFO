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
    row.pic = item.tagging_pic || 'PIC';
  } else {
    row.gateway = '';
    row.pic = '';
  }
}

// 3. Initialize Blank Rows (Default 5 rows like Excel)
function initFeishuExcelRows() {
  if (feishuExcelRows.length === 0) {
    for (let i = 0; i < 5; i++) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
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

    let resultHtml = '<span class="cell-empty-dash">-</span>';
    if (outlet) {
      if (gw) {
        resultHtml = `
          <div class="excel-cell-result">
            <span class="badge-gw-tag">${escKendaraanHtml(gw)}</span>
            <span class="badge-pic-tag">@${escKendaraanHtml(pic || 'PIC')}</span>
          </div>
        `;
      } else {
        resultHtml = `<span style="color: #fb7185; font-size: 0.74rem;">Outlet belum terdaftar</span>`;
      }
    }

    return `
      <tr data-row-idx="${idx}">
        <td>${idx + 1}</td>
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
          <button type="button" class="btn-grid-row-del" onclick="deleteFeishuExcelRow(${idx})" title="Hapus baris ini">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 6. Delete Row
window.deleteFeishuExcelRow = function(index) {
  if (index >= 0 && index < feishuExcelRows.length) {
    feishuExcelRows.splice(index, 1);
    if (feishuExcelRows.length === 0) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
    }
    renderFeishuExcelTable();
    updateFeishuStats();
    generateFeishuPreviewText();
  }
};

// 7. Add Rows (+1 / +5)
function addFeishuExcelRow(count = 1) {
  for (let i = 0; i < count; i++) {
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
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
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
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
          resCell.innerHTML = `
            <div class="excel-cell-result">
              <span class="badge-gw-tag">${escKendaraanHtml(gw)}</span>
              <span class="badge-pic-tag">@${escKendaraanHtml(pic || 'PIC')}</span>
            </div>
          `;
        } else {
          resCell.innerHTML = `<span style="color: #fb7185; font-size: 0.74rem;">Outlet belum terdaftar</span>`;
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

// 11. Parse Excel Text Data
async function parseAndInsertExcelData(text) {
  await ensureFeishuPicMap();

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return;

  feishuExcelRows = feishuExcelRows.filter(r => r.awb || r.outlet);

  let addedCount = 0;
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
      const row = { awb, outlet, gateway: '', pic: '' };
      resolveFeishuRowPic(row);
      feishuExcelRows.push(row);
      addedCount++;
    }
  });

  while (feishuExcelRows.length < 5) {
    feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
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

  validRows.forEach(row => {
    const awb = row.awb.trim();
    const outlet = (row.outlet || '').toUpperCase().trim();
    const gw = row.gateway || '';
    const pic = row.pic || 'PIC';

    if (!outlet) {
      text += `${awb}\n`;
    } else {
      const picFormatted = pic.startsWith('@') ? pic : `@${pic}`;
      if (gw) {
        text += `${awb} ${outlet} ${gw} ${picFormatted}\n`;
      } else {
        text += `${awb} ${outlet}\n`;
      }
    }
  });

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

    feishuExcelRows = holdItems.map(item => {
      const row = {
        awb: item.awb || '',
        outlet: (item.effective_outlet || item.kode_outlet || '').toUpperCase(),
        gateway: item.effective_gateway || item.nama_gateway || '',
        pic: item.effective_pic || item.tagging_pic || ''
      };
      if (row.outlet && (!row.gateway || !row.pic)) {
        resolveFeishuRowPic(row);
      }
      return row;
    });

    while (feishuExcelRows.length < 5) {
      feishuExcelRows.push({ awb: '', outlet: '', gateway: '', pic: '' });
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

// 15. Feishu Send Confirmation Modal Handling (Review before sending!)
function openFeishuConfirmModal() {
  const preview = document.getElementById('feishuDynamicPreview');
  const previewText = preview ? preview.textContent.trim() : '';

  const validRows = feishuExcelRows.filter(r => r.awb && r.awb.trim().length > 0);
  if (validRows.length === 0 || !previewText || previewText.startsWith('Belum ada data')) {
    showAppAlert('Tidak ada pesan tagihan untuk dikirim. Masukkan nomor AWB terlebih dahulu.');
    return;
  }

  const modal = document.getElementById('feishuConfirmModal');
  const textarea = document.getElementById('feishuConfirmTextarea');
  const countBadge = document.getElementById('feishuConfirmResiCount');

  if (textarea) textarea.value = previewText;
  if (countBadge) countBadge.textContent = `${validRows.length} Resi Terlampir`;

  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => { if (textarea) textarea.focus(); }, 150);
  }
}

function closeFeishuConfirmModal() {
  const modal = document.getElementById('feishuConfirmModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function executeSendFeishu() {
  const textarea = document.getElementById('feishuConfirmTextarea');
  const btn = document.getElementById('btnExecuteSendFeishu');
  const textToSend = textarea ? textarea.value.trim() : '';

  if (!textToSend) {
    showAppAlert('Pesan tidak boleh kosong.');
    return;
  }

  if (btn) btn.classList.add('is-loading');

  try {
    const token = getToken();
    const res = await fetch('/api/kendaraan/push-feishu', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text: textToSend })
    });
    if (res.status === 401) {
      logout('Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengirim ke grup Feishu');
    }

    closeFeishuConfirmModal();
    showAppAlert('Pesan berhasil terkirim ke Bot Feishu grup!');
  } catch (err) {
    showAppAlert(err.message, true);
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
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

  // Feishu Confirm Modal buttons
  const closeConfirmBtn = document.getElementById('closeFeishuConfirmModalBtn');
  const cancelConfirmBtn = document.getElementById('cancelFeishuConfirmBtn');
  const doSendBtn = document.getElementById('btnExecuteSendFeishu');
  if (closeConfirmBtn) closeConfirmBtn.addEventListener('click', closeFeishuConfirmModal);
  if (cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', closeFeishuConfirmModal);
  if (doSendBtn) doSendBtn.addEventListener('click', executeSendFeishu);

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
    btnCopy.addEventListener('click', () => {
      const preview = document.getElementById('feishuDynamicPreview');
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent);
        const span = document.getElementById('btnCopyFeishuMessageText');
        if (span) span.textContent = 'Tersalin ke Clipboard! ✅';
        setTimeout(() => { if (span) span.textContent = 'Salin Pesan WhatsApp'; }, 2000);
      }
    });
  }

  // Send to Feishu Bot (Opens Confirmation Modal first!)
  const btnBot = document.getElementById('btnSendToFeishuBot');
  if (btnBot) {
    btnBot.addEventListener('click', openFeishuConfirmModal);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeishuEventListeners);
} else {
  initFeishuEventListeners();
}
