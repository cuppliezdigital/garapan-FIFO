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

