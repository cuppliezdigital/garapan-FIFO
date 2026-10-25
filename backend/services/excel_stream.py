import sys
import os
import json
import zipfile
import re
import xml.etree.cElementTree as ET

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def parse_col_letter(cell_ref):
    m = re.match(r'([A-Z]+)', cell_ref)
    return m.group(1) if m else ''

def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python excel_stream.py <xlsx_path> [filter_gw] [batch_time]\n")
        sys.exit(1)

    xlsx_path = sys.argv[1]
    filter_gw = sys.argv[2].strip() if len(sys.argv) > 2 else "ALL"
    batch_time = sys.argv[3].strip() if len(sys.argv) > 3 else ""

    if not os.path.exists(xlsx_path):
        sys.stderr.write(f"File not found: {xlsx_path}\n")
        sys.exit(1)

    try:
        with zipfile.ZipFile(xlsx_path) as z:
            # 1. Read sharedStrings.xml
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                with z.open('xl/sharedStrings.xml') as s:
                    for event, elem in ET.iterparse(s):
                        if elem.tag.endswith('si'):
                            shared_strings.append(''.join(elem.itertext()))
                            elem.clear()

            # 2. Find raw data worksheet (usually sheet2.xml)
            sheet_target = None
            for name in z.namelist():
                if name.startswith('xl/worksheets/sheet2.xml'):
                    sheet_target = name
                    break
            if not sheet_target:
                for name in z.namelist():
                    if name.startswith('xl/worksheets/sheet1.xml'):
                        sheet_target = name
                        break

            if not sheet_target:
                sys.stderr.write("No worksheet found in xlsx\n")
                sys.exit(1)

            # Column positions mapping based on headers or defaults
            # A: waybill, B: tanggal_simpan, C: holding_gw, D: status_simpan
            # E: berat, F: volume, G: is_dfod, H: tgl_buka, I: outlet_asal
            # J: tgl_tiba, K: next_stop, L: gw_asal, M: gw_tujuan, N: outlet_tujuan
            # O: frekuensi_kirim, P: durasi_jam, Q: is_problem, R: status_penangguhan
            # S: durasi_kategori, T: rute, U: gw_tujuan_2, W: next_gw, X: outlet_akhir, AA: tipe_jalur
            
            row_idx = 0
            with z.open(sheet_target) as s:
                for event, elem in ET.iterparse(s):
                    if elem.tag.endswith('row'):
                        row_idx += 1
                        if row_idx == 1:
                            elem.clear()
                            continue
                        
                        cell_map = {}
                        for c in elem.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                            ref = c.get('r')
                            if not ref:
                                continue
                            col = parse_col_letter(ref)
                            t = c.get('t')
                            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            val = v.text if v is not None else ''
                            if t == 's' and val.isdigit():
                                idx = int(val)
                                val = shared_strings[idx] if idx < len(shared_strings) else ''
                            cell_map[col] = val.strip() if val else ''

                        elem.clear()

                        waybill = cell_map.get('A', '')
                        if not waybill:
                            continue

                        holding_gw = cell_map.get('C', '')
                        if filter_gw and filter_gw.upper() != 'ALL':
                            # Support comma-separated filter or single
                            allowed = [x.strip().upper() for x in filter_gw.split(',') if x.strip()]
                            if holding_gw.upper() not in allowed:
                                continue

                        # Convert numbers safely
                        berat_str = cell_map.get('E', '0')
                        vol_str = cell_map.get('F', '0')
                        durasi_str = cell_map.get('P', '0')
                        freq_str = cell_map.get('O', '0')

                        try:
                            berat = float(berat_str)
                        except Exception:
                            berat = 0.0

                        try:
                            vol = float(vol_str)
                        except Exception:
                            vol = 0.0

                        try:
                            durasi = float(durasi_str)
                        except Exception:
                            durasi = 0.0

                        try:
                            freq = int(float(freq_str))
                        except Exception:
                            freq = 0

                        record = {
                            "waybill": waybill,
                            "tanggal_simpan": cell_map.get('B', ''),
                            "holding_gw": holding_gw,
                            "status_simpan": cell_map.get('D', ''),
                            "berat": berat,
                            "volume": vol,
                            "is_dfod": cell_map.get('G', ''),
                            "tgl_buka": cell_map.get('H', ''),
                            "outlet_asal": cell_map.get('I', ''),
                            "tgl_tiba": cell_map.get('J', ''),
                            "next_stop": cell_map.get('K', ''),
                            "gw_asal": cell_map.get('L', ''),
                            "gw_tujuan": cell_map.get('M', ''),
                            "outlet_tujuan": cell_map.get('N', ''),
                            "frekuensi_kirim": freq,
                            "durasi_jam": durasi,
                            "durasi_kategori": cell_map.get('S', ''),
                            "is_problem": cell_map.get('Q', ''),
                            "status_penangguhan": cell_map.get('R', ''),
                            "rute": cell_map.get('T', ''),
                            "gw_tujuan_2": cell_map.get('U', ''),
                            "next_gw": cell_map.get('W', ''),
                            "outlet_akhir": cell_map.get('X', ''),
                            "tipe_jalur": cell_map.get('AA', ''),
                            "batch_time": batch_time
                        }

                        sys.stdout.write(json.dumps(record) + '\n')

    except Exception as e:
        sys.stderr.write(f"Error parsing xlsx: {str(e)}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()

