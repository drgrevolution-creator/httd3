"""Lập danh sách ĐỀ XUẤT ghép nội hàm giữa chỉ tiêu TU-699 và chỉ tiêu các bộ Trung ương, để Mr. Nobody duyệt.

Chạy: python3 -I scripts/chuyen-doi/de_xuat_ghep.py <TU-699.xlsx> <file đích> <file bộ TW> [<file bộ TW> ...]

Thuật toán giống hệt BoChiTieu.chuanHoaTen + goiYGhep trong hệ thống (gas/thuan/BoChiTieu.gs): bỏ từ dừng (có dấu)
rồi bỏ dấu, so tập từ bằng Jaccard, ngưỡng 0,6, lấy tối đa 3 gợi ý. Từ dừng đọc từ BoChiTieu.TU_DUNG.
Không ghép gì cả: chỉ xuất bảng, cột "Đồng ý" để trống cho người duyệt.
"""
import os
import re
import sys
import unicodedata

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mau_chuan  # noqa: E402


def chuan_hoa_ten(ten):
    s = ' ' + re.sub(r'[^0-9a-zÀ-ɏḀ-ỿ]+', ' ',
                     unicodedata.normalize('NFC', str(ten or '')).lower()) + ' '
    for w in mau_chuan.tu_dung():
        s = s.replace(' ' + w + ' ', ' ').replace(' ' + w + ' ', ' ')
    s = unicodedata.normalize('NFD', s)
    s = re.sub(r'[̀-ͯ]', '', s).replace('đ', 'd')
    return re.sub(r'\s+', ' ', s).strip()


def _tap(s):
    return {w for w in s.split(' ') if w}


def _lam_tron(x):
    # Giống Math.round(x * 100) / 100 của JavaScript (làm tròn nửa lên).
    import math
    return math.floor(x * 100 + 0.5) / 100


def goi_y(ten, ds_chuan, nguong=0.6):
    a = _tap(chuan_hoa_ten(ten))
    if not a:
        return []
    ra = []
    for c in ds_chuan:
        b = _tap(chuan_hoa_ten(c['tenChiTieu']))
        chung = len(a & b)
        hop = len(a) + len(b) - chung
        diem = _lam_tron(chung / hop) if hop else 0
        ra.append({'maChiTieu': c['maChiTieu'], 'tenChiTieu': c['tenChiTieu'], 'diem': diem})
    ra = [x for x in ra if x['diem'] >= nguong]
    ra.sort(key=lambda x: -x['diem'])  # sort ổn định như Array.prototype.sort hiện nay
    for x in ra:
        if float(x['diem']).is_integer():
            x['diem'] = int(x['diem'])
    return ra[:3]


def lap_bang(dongs_699, dongs_tw):
    """Mỗi chỉ tiêu TU-699 ít nhất một dòng; có gợi ý thì mỗi gợi ý một dòng."""
    ds = [{'maChiTieu': d['maTrongBo'], 'tenChiTieu': d['tenNguyenVan']} for d in dongs_tw]
    bang = []
    for d in dongs_699:
        gy = goi_y(d['tenNguyenVan'], ds)
        if not gy:
            bang.append({'maTrongBo': d['maTrongBo'], 'ten': d['tenNguyenVan'], 'capDuLieu': d.get('capDuLieu', ''),
                         'goiY': '', 'tenGoiY': '', 'diem': '', 'dongY': ''})
        for g in gy:
            bang.append({'maTrongBo': d['maTrongBo'], 'ten': d['tenNguyenVan'], 'capDuLieu': d.get('capDuLieu', ''),
                         'goiY': g['maChiTieu'], 'tenGoiY': g['tenChiTieu'], 'diem': g['diem'], 'dongY': ''})
    return bang


COT = [('maTrongBo', 'Mã trong bộ TU-699', 16), ('ten', 'Tên chỉ tiêu TU-699', 50), ('capDuLieu', 'Cấp dữ liệu', 14),
       ('goiY', 'Gợi ý ghép với (mã)', 18), ('tenGoiY', 'Tên chỉ tiêu gợi ý', 50), ('diem', 'Điểm giống tên (0–1)', 12),
       ('dongY', 'Đồng ý (ghi C = đồng ý; ghi mã khác nếu muốn ghép với chỉ tiêu khác; để trống = không ghép)', 30)]


def ghi(duong_dan, bang):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'DeXuatGhep'
    for j, (k, ten, rong) in enumerate(COT, 1):
        o = ws.cell(1, j, ten)
        o.font = Font(bold=True)
        o.fill = PatternFill('solid', fgColor='DDEBF7')
        o.alignment = Alignment(wrap_text=True, vertical='top')
        ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = rong
    for i, r in enumerate(bang, 2):
        for j, (k, _, _) in enumerate(COT, 1):
            o = ws.cell(i, j, r[k] if r[k] != '' else None)
            if k != 'diem':
                o.number_format = '@'
            o.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'B2'
    ws.auto_filter.ref = ws.dimensions
    wb.save(duong_dan)


def main(argv):
    if len(argv) < 4:
        print(__doc__)
        return 2
    _, d699 = mau_chuan.doc_mau(argv[1])
    tw = []
    for p in argv[3:]:
        tw.extend(mau_chuan.doc_mau(p)[1])
    bang = lap_bang(d699, tw)
    ghi(argv[2], bang)
    co = len({r['maTrongBo'] for r in bang if r['goiY']})
    print('Đã ghi %s: %d chỉ tiêu TU-699, %d có gợi ý, %d dòng' % (argv[2], len(d699), co, len(bang)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
