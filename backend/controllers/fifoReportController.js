const db = require('../config/db');
const jfsService = require('../services/jfsService');

const DEFAULT_SPOTS = [
  { code: 'JKT99A', name: 'GW-Jakarta', patterns: 'gw-jakarta,jkt99a' },
  { code: 'JKM99V', name: 'GW-Jakarta Muara', patterns: 'gw-jakarta muara,gw-muara,jkm99v,jkm,kapuk' },
  { code: 'JKS99V', name: 'GW-Jakarta Selatan', patterns: 'gw-jakarta selatan,jks99v,jks' },
  { code: 'JTI99V', name: 'GW-Jakarta Timur', patterns: 'gw-jakarta timur,gw-jakarta timur 2,jti99v,jti' },
  { code: 'JKP99M', name: 'GW-Jakarta Pusat 2', patterns: 'gw-jakarta pusat,gw-jakarta pusat 2,jkp99m,jkp' },
  { code: 'BGR99A', name: 'GW-Bogor', patterns: 'gw-bogor,bgr99a,bgr' },
  { code: 'BKI99A', name: 'GW-Bekasi', patterns: 'gw-bekasi,bki99a,bki' },
  { code: 'DPK99A', name: 'GW-Depok', patterns: 'gw-depok,dpk99a,dpk' },
  { code: 'TGR99A', name: 'GW-Tangerang', patterns: 'gw-tangerang,gw-tangerang selatan,tgr99a,tgr' },
  { code: 'TGS99A', name: 'GW-Tigaraksa', patterns: 'gw-tigaraksa,tgs99a,tgs' },
  { code: 'SEG99A', name: 'GW-Serang', patterns: 'gw-serang,seg99a,seg' },
  { code: 'BDO99A', name: 'GW-Bandung', patterns: 'gw-bandung,gw-sumedangmitra,gw-cirebon,gw-indramayu,bdo99a,bdo' },
  { code: 'SBG99V', name: 'GW-Subang', patterns: 'gw-subang,sbg99v,sbg' },
  { code: 'GRT99M', name: 'GW-Garut', patterns: 'gw-garut,gw-garutmitra,grt99m,grt' },
  { code: 'CJR99M', name: 'GW-Cianjur', patterns: 'gw-cianjur,gw-cianjurmitra,cjr99m,cjr' },
  { code: 'SMI99A', name: 'GW-Sukabumi', patterns: 'gw-sukabumi,smi99a,smi' },
  { code: 'SOG99A', name: 'GW-Soreang', patterns: 'gw-soreang,sog99a,sog' },
  { code: 'TSK99A', name: 'GW-Tasikmalaya', patterns: 'gw-tasikmalaya,gw-banjar,tsk99a,tsk' },
  { code: 'JOG99A', name: 'GW-Yogyakarta', patterns: 'gw-yogyakarta,gw-bantul,gw-kulonprogo,gw-wonosarimitra,jog99a,jog' },
  { code: 'KBT99M', name: 'GW-Kebumen Virtual', patterns: 'gw-kebumen virtual,kbt99m,kbt' },
  { code: 'KBM99A', name: 'GW-Kebumen', patterns: 'gw-kebumen,gw-purwokertoo,gw-purworejomitra,gw-purbalinggamitra,gw-banjarnegaramitra,gw-wonosobo,kbm99a,kbm' },
  { code: 'SOC99A', name: 'GW-Solo', patterns: 'gw-solo,gw-klaten,soc99a,soc' },
  { code: 'SRG99A', name: 'GW-Semarang', patterns: 'gw-semarang,gw-salatiga,gw-kendal,gw-ungaran,srg99a,srg' },
  { code: 'KDS99A', name: 'GW-Kudus', patterns: 'gw-kudus,gw-jepara,gw-patii,gw-rembang,gw-blora,kds99a,kds' },
  { code: 'DMK99V', name: 'GW-Demak', patterns: 'gw-demak,dmk99v,dmk' },
  { code: 'TGL99A', name: 'GW-Tegal', patterns: 'gw-tegal,gw-slawi,gw-brebes,gw-brebes atas,gw-brebes bawah,gw-pekalongan,gw-pemalangmitra,tgl99a,tgl' },
  { code: 'JBR99A', name: 'GW-Jember', patterns: 'gw-jember,gw-banyuwangi,jbr99a,jbr' },
  { code: 'KDR99A', name: 'GW-Kediri', patterns: 'gw-kediri,gw-madiun,kdr99a,kdr' },
  { code: 'MLG99A', name: 'GW-Malang', patterns: 'gw-malang,mlg99a,mlg' },
  { code: 'PRO99A', name: 'GW-Probolinggo', patterns: 'gw-probolinggo,pro99a,pro' },
  { code: 'SEA99A', name: 'GW-SurabayaSEA', patterns: 'gw-surabayasea,gw-ambon,gw-ternate,gw-gorontalo,gw-sofifi,gw-morowali,gw-manado,gw-kendari,gw-palu,gw-makassar,gw-kupang,gw-polewali,sea99a,sea' },
  { code: 'SUB99A', name: 'GW-Surabaya', patterns: 'gw-surabaya,gw-lamongan,bws,gsk,sub99a,sub' },
  { code: 'DJB99A', name: 'GW-Jambi', patterns: 'gw-jambi,gw-bangko,djb99a,djb' },
  { code: 'BKO99V', name: 'GW-Bengkulu', patterns: 'gw-bengkulu,bko99v,bko' },
  { code: 'MES99A', name: 'GW-Medan', patterns: 'gw-medan,gw-aceh,gw-kuala simpang,gw-lhokseumawe,gw-takengon,gw-aek,gw-rantau,gw-ujung tanjung,lsw,lsw99a,mes99a,mes' },
  { code: 'PDG99A', name: 'GW-Padang', patterns: 'gw-padang,gw-bukittinggi,gw-virtual padang,gw-padang sidempuan,pdg99a,pdg' },
  { code: 'PKU99A', name: 'GW-Pekanbaru', patterns: 'gw-pekanbaru,gw-rengat,gw-rengatmitra,gw-batam,gw-batam barat,gw-batam selatan,gw-karimun,gw-tanjung pinang,pku99a,pku' },
  { code: 'PLM99A', name: 'GW-Palembang', patterns: 'gw-palembang,gw-prabumulih,gw-lubuk linggau,gw-bangka belitung,plm99a,plm' },
  { code: 'TKG99A', name: 'GW-Lampung', patterns: 'gw-lampung,tkg99a,tkg' },
  { code: 'BDJ99A', name: 'GW-Banjarmasin', patterns: 'gw-banjarmasin,gw-palangkaraya,gw-palangkarayav,gw-pangkalanbun,gw-kotawaringintimur,gw-samarinda,gw-balikpapan,bdj99a,bdj' },
  { code: 'PNK99A', name: 'GW-Pontianak', patterns: 'gw-pontianak,pnk99a,pnk' },
  { code: 'DPS99A', name: 'GW-Denpasar', patterns: 'gw-denpasar,gw-bali,gw-tabanan,gw-lombok,dps99a,dps' },
  { code: 'VPG99V', name: 'GW-VIP Transit', patterns: 'gw-vip,gw-vip transit,vpg99v,vpg' }
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
    } else {
      // Perbarui mapping default agar pattern collision GW-Jakarta vs GW-Jakarta Pusat/Timur/Selatan tidak terjadi
      for (const dSpot of DEFAULT_SPOTS) {
        await db.query(
          'UPDATE master_spot_mapping SET tlc_patterns = ? WHERE spot_code = ? AND (tlc_patterns = ? OR tlc_patterns LIKE "%GW-Jakarta,JKT%")',
          [dSpot.patterns, dSpot.code, dSpot.code]
        );
      }
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

// Ekstrak jam numerik & tentukan bucket sesuai template Excel FIFO
function getAgingLevel(stuckValue) {
  if (!stuckValue) return null;
  const raw = String(stuckValue).trim();
  const lower = raw.toLowerCase();

  // 1. Cek string category
  if (lower.includes('(24-36)') || lower.includes('24 jam - 36 jam')) return '24_36';
  // Baris 4 di Excel: kategori 36-48 Jam (di header tertulis 4. 48 Jam - 60 Jam)
  if (lower.includes('(36-48)') || lower.includes('36 jam - 48 jam')) return '48_60';
  // Baris 5 di Excel: kategori 48-72 Jam (mencakup 48-60 Jam dan 60-72 Jam)
  if (lower.includes('(48-60)') || lower.includes('(60-72)') || lower.includes('(48-72)') || lower.includes('48 jam - 72 jam') || lower.includes('48 jam - 60 jam') || lower.includes('60 jam - 72 jam')) return '48_72';
  if (lower.includes('(72 up)') || lower.includes('(72-up)') || lower.includes('72 up') || lower.includes('72+')) return '72_up';

  // 2. Fallback jam numerik
  const m = raw.match(/(\d+)\s*Jam/i) || raw.match(/^(\d+)/);
  if (!m) return null;
  const h = parseInt(m[1], 10);

  if (h >= 24 && h < 36) return '24_36';
  if (h >= 36 && h < 48) return '48_60'; // Baris 4 Excel: 36-48 Jam (53 paket)
  if (h >= 48 && h < 72) return '48_72'; // Baris 5 Excel: 48-72 Jam (gabungan 48-60h dan 60-72h = 256 paket)
  if (h >= 72) return '72_up';          // Baris 6 Excel: 72h UP (244 paket)

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

    // Siapkan daftar pattern terurut panjang menurun agar yang spesifik mendahului yang umum
    const allPatternsSorted = [];
    spotList.forEach((s) => {
      s.patterns.forEach((p) => {
        allPatternsSorted.push({ spot: s, pattern: p, len: p.length });
      });
    });
    allPatternsSorted.sort((a, b) => b.len - a.len);

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

      // 1. Exact match TLC terhadap salah satu pattern
      for (const entry of spotList) {
        if (entry.patterns.some((p) => p === tlc)) {
          matchedSpot = entry;
          break;
        }
      }

      // 2. Substring TLC match (pola lebih panjang / spesifik dievaluasi lebih dulu)
      if (!matchedSpot) {
        for (const item of allPatternsSorted) {
          if (tlc && tlc.includes(item.pattern)) {
            // Cegah GW-Jakarta menelan GW-Jakarta Pusat, Timur, Selatan, Muara
            if (item.pattern === 'gw-jakarta' || item.pattern === 'jkt' || item.pattern === 'jkt99a') {
              if (tlc.includes('selatan') || tlc.includes('timur') || tlc.includes('pusat') || tlc.includes('muara') || tlc.includes('barat') || tlc.includes('utara')) {
                continue;
              }
            }
            if (item.pattern === 'gw-surabaya' || item.pattern === 'sub') {
              if (tlc.includes('sea')) continue;
            }
            if (item.pattern === 'gw-kebumen' || item.pattern === 'kbm') {
              if (tlc.includes('virtual') || tlc.includes('kbt')) continue;
            }
            matchedSpot = item.spot;
            break;
          }
        }
      }

      // 3. Fallback outlet matching atau TLC berupa kode outlet Jakarta langsung (misal JKT062A, JKT253A)
      if (!matchedSpot) {
        if (tlc.startsWith('jkt') && !tlc.includes('selatan') && !tlc.includes('timur') && !tlc.includes('pusat') && !tlc.includes('muara')) {
          matchedSpot = spotMap.get('JKT99A') || null;
        } else if (!tlc || tlc === '-' || tlc === 'gw-jakarta') {
          for (const item of allPatternsSorted) {
            if (item.pattern.length >= 3 && outlet.startsWith(item.pattern)) {
              matchedSpot = item.spot;
              break;
            }
          }
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

