function sanitizeText(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 255);
}

function validateMonitoringPayload(req, res, next) {
  const payload = req.body || {};

  const waybill = sanitizeText(payload.waybill);
  const tanggal = sanitizeText(payload.tanggal);
  const outlet = sanitizeText(payload.outlet);
  const tlc = sanitizeText(payload.tlc);
  const status = sanitizeText(payload.status);
  const aksi = sanitizeText(payload.aksi);
  const namaBarang = sanitizeText(payload.nama_barang);
  const updatedBy = sanitizeText(payload.updated_by);

  if (!waybill || !tanggal || !outlet) {
    return res.status(400).json({ error: 'Waybill, tanggal, dan outlet wajib diisi' });
  }

  req.body = {
    ...payload,
    waybill,
    tanggal,
    outlet,
    tlc: tlc || '-',
    status: status || 'Pending',
    aksi: aksi || '-',
    nama_barang: namaBarang || '-',
    updated_by: updatedBy || 'System',
    stuck: String(payload.stuck ?? '0').trim() || '0',
  };

  next();
}

module.exports = {
  validateMonitoringPayload,
};
