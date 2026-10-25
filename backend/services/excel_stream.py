import sys
import os
import json
import zipfile
import xml.etree.cElementTree as ET

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def parse_col_letter(cell_ref):
    return cell_ref.rstrip('0123456789')

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

    allowed_gws = None
    if filter_gw and filter_gw.upper() != 'ALL':
        allowed_gws = set(x.strip().upper() for x in filter_gw.split(',') if x.strip())

    try:
        with zipfile.ZipFile(xlsx_path) as z:
            # 1. Read sharedStrings.xml with root.clear() to avoid memory accumulation
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                with z.open('xl/sharedStrings.xml') as s:
                    context = ET.iterparse(s, events=('start', 'end'))
                    _, root = next(context)
                    for event, elem in context:
                        if event == 'end' and elem.tag.endswith('si'):
                            shared_strings.append(''.join(elem.itertext()))
                            elem.clear()
                            root.clear()

            # 2. Find ALL raw data worksheets (handles multi-sheet workbooks when rows > 1,000,000)
            raw_sheets = []
            if 'xl/workbook.xml' in z.namelist() and 'xl/_rels/workbook.xml.rels' in z.namelist():
                try:
                    wb = ET.fromstring(z.read('xl/workbook.xml'))
                    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
                    rel_map = {r.attrib.get('Id'): r.attrib.get('Target') for r in rels}
                    sheets = wb.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheets/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
                    for s in sheets:
                        sname = s.attrib.get('name', '')
                        rId = s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                        target = rel_map.get(rId, '')
                        if 'raw data' in sname.lower() or '数据源' in sname:
                            full_target = 'xl/' + target if not target.startswith('xl/') else target
                            if full_target in z.namelist():
                                raw_sheets.append((sname, full_target))
                except Exception as ex:
                    sys.stderr.write(f"Warning parsing workbook.xml: {ex}\n")

            # Fallback if no matching sheet names in workbook.xml
            if not raw_sheets:
                for target_candidate in ['xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml']:
                    if target_candidate in z.namelist():
                        raw_sheets.append((target_candidate, target_candidate))
                if not raw_sheets:
                    for name in z.namelist():
                        if name.startswith('xl/worksheets/sheet1.xml'):
                            raw_sheets.append((name, name))
                            break

            if not raw_sheets:
                sys.stderr.write("No raw data worksheet found in xlsx\n")
                sys.exit(1)

            emitted_count = 0
            for sheet_name, sheet_path in raw_sheets:
                with z.open(sheet_path) as s:
                    context = ET.iterparse(s, events=('start', 'end'))
                    _, root = next(context)
                    row_idx = 0
                    for event, elem in context:
                        if event == 'end' and elem.tag.endswith('row'):
                            row_idx += 1
                            if row_idx == 1:
                                elem.clear()
                                root.clear()
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
                            root.clear()

                            waybill = cell_map.get('A', '')
                            if not waybill:
                                continue

                            holding_gw = cell_map.get('C', '')
                            if allowed_gws and (holding_gw.upper() not in allowed_gws):
                                continue

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
                            emitted_count += 1
                            if emitted_count % 500 == 0:
                                sys.stdout.flush()

            sys.stdout.flush()

    except Exception as e:
        sys.stderr.write(f"Error parsing xlsx: {str(e)}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
