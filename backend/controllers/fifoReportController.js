const db = require('../config/db');
const jfsService = require('../services/jfsService');

const DEFAULT_SPOTS = [
  { code: 'JKT99A', name: 'GW-Jakarta', patterns: 'GW-Jakarta,JKT' },
  { code: 'JKM99V', name: 'GW-Jakarta Muara', patterns: 'GW-Jakarta Muara,JKM,Kapuk' },
  { code: 'JKS99V', name: 'GW-Jakarta Selatan', patterns: 'GW-Jakarta Selatan,JKS' },
  { code: 'JTI99V', name: 'GW-Jakarta Timur', patterns: 'GW-Jakarta Timur,GW-Jakarta Timur 2,JTI' },
  { code: 'JKP99M', name: 'GW-Jakarta Pusat 2', patterns: 'GW-Jakarta Pusat,JKP' },
  { code: 'BGR99A', name: 'GW-Bogor', patterns: 'GW-Bogor,BGR' },
  { code: 'BKI99A', name: 'GW-Bekasi', patterns: 'GW-Bekasi,BKI' },
  { code: 'DPK99A', name: 'GW-Depok', patterns: 'GW-Depok,DPK' },
  { code: 'TGR99A', name: 'GW-Tangerang', patterns: 'GW-Tangerang,GW-Tangerang Selatan,TGR' },
  { code: 'TGS99A', name: 'GW-Tigaraksa', patterns: 'GW-Tigaraksa,TGS' },
  { code: 'SEG99A', name: 'GW-Serang', patterns: 'GW-Serang,SEG' },
  { code: 'BDO99A', name: 'GW-Bandung', patterns: 'GW-Bandung,BDO' },
  { code: 'SBG99V', name: 'GW-Subang', patterns: 'GW-Subang,SBG' },
  { code: 'GRT99M', name: 'GW-Garut', patterns: 'GW-Garut,GW-GarutMitra,GRT' },
  { code: 'CJR99M', name: 'GW-Cianjur', patterns: 'GW-Cianjur,GW-CianjurMitra,CJR' },
  { code: 'SMI99A', name: 'GW-Sukabumi', patterns: 'GW-Sukabumi,SMI' },
  { code: 'SOG99A', name: 'GW-Soreang', patterns: 'GW-Soreang,SOG' },
  { code: 'TSK99A', name: 'GW-Tasikmalaya', patterns: 'GW-Tasikmalaya,TSK' },
  { code: 'JOG99A', name: 'GW-Yogyakarta', patterns: 'GW-Yogyakarta,GW-Bantul,JOG' },
  { code: 'KBT99M', name: 'GW-Kebumen Virtual', patterns: 'GW-Kebumen Virtual,KBT' },
  { code: 'KBM99A', name: 'GW-Kebumen', patterns: 'GW-Kebumen,KBM' },
  { code: 'SOC99A', name: 'GW-Solo', patterns: 'GW-Solo,GW-Klaten,SOC' },
  { code: 'SRG99A', name: 'GW-Semarang', patterns: 'GW-Semarang,GW-Salatiga,SRG' },
  { code: 'KDS99A', name: 'GW-Kudus', patterns: 'GW-Kudus,GW-Jepara,GW-Patii,KDS' },
  { code: 'DMK99V', name: 'GW-Demak', patterns: 'GW-Demak,DMK' },
  { code: 'TGL99A', name: 'GW-Tegal', patterns: 'GW-Tegal,GW-Slawi,GW-Brebes,TGL' },
  { code: 'JBR99A', name: 'GW-Jember', patterns: 'GW-Jember,GW-Banyuwangi,JBR' },
  { code: 'KDR99A', name: 'GW-Kediri', patterns: 'GW-Kediri,GW-Madiun,KDR' },
  { code: 'MLG99A', name: 'GW-Malang', patterns: 'GW-Malang,MLG' },
  { code: 'PRO99A', name: 'GW-Probolinggo', patterns: 'GW-Probolinggo,PRO' },
  { code: 'SEA99A', name: 'GW-SurabayaSEA', patterns: 'GW-SurabayaSEA,SEA' },
  { code: 'SUB99A', name: 'GW-Surabaya', patterns: 'GW-Surabaya,GW-Lamongan,SUB' },
  { code: 'DJB99A', name: 'GW-Jambi', patterns: 'GW-Jambi,GW-Bangko,DJB' },
  { code: 'BKO99V', name: 'GW-Bengkulu', patterns: 'GW-Bengkulu,BKO' },
  { code: 'MES99A', name: 'GW-Medan', patterns: 'GW-Medan,GW-Aceh,MES' },
  { code: 'PDG99A', name: 'GW-Padang', patterns: 'GW-Padang,GW-Bukittinggi,PDG' },
  { code: 'PKU99A', name: 'GW-Pekanbaru', patterns: 'GW-Pekanbaru,GW-Rengat,PKU' },
  { code: 'PLM99A', name: 'GW-Palembang', patterns: 'GW-Palembang,GW-Prabumulih,PLM' },
  { code: 'TKG99A', name: 'GW-Lampung', patterns: 'GW-Lampung,TKG' },
  { code: 'BDJ99A', name: 'GW-Banjarmasin', patterns: 'GW-Banjarmasin,BDJ' },
  { code: 'PNK99A', name: 'GW-Pontianak', patterns: 'GW-Pontianak,PNK' },
  { code: 'DPS99A', name: 'GW-Denpasar', patterns: 'GW-Denpasar,GW-Bali,GW-Tabanan,GW-Lombok,DPS' },
  { code: 'VPG99V', name: 'GW-VIP Transit', patterns: 'GW-VIP,VPG' }
];

let tableInitialized = false;

async function ensureTableInitialized() {
  if (tableInitialized) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS master_spot_mapping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spot_code VARCHAR(30) NOT NULL UNIQUE,
        spot_name VARCHAR(100) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        tlc_patterns TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    const [existing] = await db.query('SELECT COUNT(*) as count FROM master_spot_mapping');
    if (existing[0].count === 0) {
      for (let i = 0; i < DEFAULT_SPOTS.length; i++) {
        await db.query(
          'INSERT INTO master_spot_mapping (spot_code, spot_name, sort_order, tlc_patterns) VALUES (?, ?, ?, ?)',
          [DEFAULT_SPOTS[i].code, DEFAULT_SPOTS[i].name, i + 1, DEFAULT_SPOTS[i].patterns]
        );
      }
      console.log('✅ Berhasil inisialisasi 43 default Master Mapping SPOT FIFO.');
    }
    tableInitialized = true;
  } catch (err) {
    console.error('Error initializing master_spot_mapping:', err);
  }
}

// Helper untuk format timestamp live (e.g. 10/23/2026, 06:58:09 AM)
function getLiveFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const yyyy = now.getFullYear();

  let hours = now.getHours();
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? pad(hours) : '12';

  return {
    dateOnly: `${mm}/${dd}/${yyyy}`,
    timeOnly: `${hours}:${minutes}:${seconds} ${ampm}`,
    full: `${mm}/${dd}/${yyyy}  ${hours}:${minutes}:${seconds} ${ampm}`
  };
}

// Ekstrak jam numerik & tentukan bucket
function getAgingLevel(stuckValue) {
  if (!stuckValue) return null;
  const raw = String(stuckValue).trim();
  const lower = raw.toLowerCase();

  if (lower.includes('(24-36)') || lower.includes('24 jam - 36 jam')) return '24_36';
  if (lower.includes('(48-60)') || lower.includes('48 jam - 60 jam')) return '48_60';
  if (lower.includes('(60-72)') || lower.includes('(48-72)') || lower.includes('48 jam - 72 jam') || lower.includes('60 jam - 72 jam')) return '48_72';
  if (lower.includes('(72 up)') || lower.includes('(72-up)') || lower.includes('72 up') || lower.includes('72+')) return '72_up';

  const m = raw.match(/(\d+)\s*Jam/i) || raw.match(/^(\d+)/);
  if (!m) return null;
  const h = parseInt(m[1], 10);

  if (h >= 24 && h < 36) return '24_36';
  if (h >= 48 && h < 60) return '48_60';
  if (h >= 60 && h < 72) return '48_72';
  if (h >= 72) return '72_up';

  return null;
}

exports.getFifoSpotReport = async (req, res) => {
  try {
    await ensureTableInitialized();

    const [mappings] = await db.query('SELECT * FROM master_spot_mapping ORDER BY sort_order ASC, id ASC');
    const [packages] = await db.query(`
      SELECT waybill, tlc, outlet, outlet_asal, stuck, nama_barang, tanggal, status, aksi 
      FROM monitoring_stuck 
      WHERE (status IS NULL OR LOWER(status) != 'sudah diupdate' AND LOWER(status) != 'sudah scan kirim')
    `);

    // Inisialisasi map spot
    const spotMap = new Map();
    const spotList = [];

    mappings.forEach((m) => {
      const patterns = (m.tlc_patterns || '')
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      const entry = {
        id: m.id,
        spot_code: m.spot_code,
        spot_name: m.spot_name,
        sort_order: m.sort_order,
        patterns,
        c24_36: 0,
        c48_60: 0,
        c48_72: 0,
        c72_up: 0,
        total: 0,
        waybills: {
          '24_36': [],
          '48_60': [],
          '48_72': [],
          '72_up': []
        }
      };
      spotMap.set(m.spot_code, entry);
      spotList.push(entry);
    });

    let total24_36 = 0;
    let total48_60 = 0;
    let total48_72 = 0;
    let total72_up = 0;
    let unmappedCount = 0;

    for (const pkg of packages) {
      const level = getAgingLevel(pkg.stuck);
      if (!level) continue; // Hanya level 24-36, 48-60, 48-72, 72 UP yang dihitung sesuai SOP

      const tlc = (pkg.tlc || '').toLowerCase();
      const outlet = (pkg.outlet || '').toLowerCase();

      let matchedSpot = null;

      // Cari spot yang cocok berdasarkan pattern
      for (const entry of spotList) {
        if (entry.patterns.some((p) => tlc.includes(p) || outlet.startsWith(p))) {
          matchedSpot = entry;
          break;
        }
      }

      if (matchedSpot) {
        matchedSpot[`c${level}`]++;
        matchedSpot.total++;
        if (matchedSpot.waybills[level].length < 100) {
          matchedSpot.waybills[level].push({
            waybill: pkg.waybill,
            outlet: pkg.outlet,
            outlet_asal: pkg.outlet_asal,
            stuck: pkg.stuck,
            nama_barang: pkg.nama_barang,
            tanggal: pkg.tanggal
          });
        }
      } else {
        unmappedCount++;
      }

      if (level === '24_36') total24_36++;
      else if (level === '48_60') total48_60++;
      else if (level === '48_72') total48_72++;
      else if (level === '72_up') total72_up++;
    }

    const timestamp = getLiveFormattedTimestamp();

    return res.json({
      success: true,
      timestamp,
      summary: {
        c24_36: total24_36,
        c48_60: total48_60,
        c48_72: total48_72,
        c72_up: total72_up,
        total_stuck: total24_36 + total48_60 + total48_72 + total72_up,
        unmapped_count: unmappedCount,
        total_active_packages: packages.length
      },
      spots: spotList.map((s) => ({
        id: s.id,
        spot_code: s.spot_code,
        spot_name: s.spot_name,
        sort_order: s.sort_order,
        c24_36: s.c24_36,
        c48_60: s.c48_60,
        c48_72: s.c48_72,
        c72_up: s.c72_up,
        total: s.total,
        waybills: s.waybills
      }))
    });
  } catch (err) {
    console.error('Error generating FIFO Spot report:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat laporan FIFO Spot: ' + err.message });
  }
};

exports.syncFifoSpotData = async (req, res) => {
  try {
    if (typeof jfsService.syncJfsToDatabase === 'function') {
      const syncResult = await jfsService.syncJfsToDatabase('Report FIFO Auto-Sync');
      return exports.getFifoSpotReport(req, res);
    }
    return exports.getFifoSpotReport(req, res);
  } catch (err) {
    console.error('Error syncing FIFO Spot data:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyinkronkan data JFS: ' + err.message });
  }
};

exports.getSpotMappings = async (req, res) => {
  try {
    await ensureTableInitialized();
    const [rows] = await db.query('SELECT * FROM master_spot_mapping ORDER BY sort_order ASC, id ASC');
    const [unmapped] = await db.query(`
      SELECT tlc, count(*) as count 
      FROM monitoring_stuck 
      GROUP BY tlc 
      ORDER BY count DESC 
      LIMIT 25
    `);
    return res.json({ success: true, mappings: rows, top_tlcs: unmapped });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveSpotMapping = async (req, res) => {
  try {
    await ensureTableInitialized();
    const { id, spot_code, spot_name, sort_order, tlc_patterns } = req.body;
    if (!spot_code || !spot_name) {
      return res.status(400).json({ success: false, message: 'Kode SPOT dan Nama SPOT wajib diisi.' });
    }

    if (id) {
      await db.query(
        'UPDATE master_spot_mapping SET spot_code = ?, spot_name = ?, sort_order = ?, tlc_patterns = ? WHERE id = ?',
        [spot_code.trim().toUpperCase(), spot_name.trim(), Number(sort_order || 0), tlc_patterns || '', id]
      );
    } else {
      await db.query(
        'INSERT INTO master_spot_mapping (spot_code, spot_name, sort_order, tlc_patterns) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE spot_name = VALUES(spot_name), tlc_patterns = VALUES(tlc_patterns), sort_order = VALUES(sort_order)',
        [spot_code.trim().toUpperCase(), spot_name.trim(), Number(sort_order || 0), tlc_patterns || '']
      );
    }
    return res.json({ success: true, message: 'Mapping SPOT berhasil disimpan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSpotMapping = async (req, res) => {
  try {
    await ensureTableInitialized();
    const { id } = req.params;
    await db.query('DELETE FROM master_spot_mapping WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Mapping SPOT berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
