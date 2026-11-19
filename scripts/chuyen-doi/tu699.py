"""Chuyển Phụ lục chỉ tiêu 699 của Thành phố (Excel 28 cột) sang mẫu nhập chuẩn.

Chạy: python3 -I scripts/chuyen-doi/tu699.py <file Excel nguồn> <file mẫu chuẩn đích>

Quy tắc (kế hoạch 1b, Task 3):
- Dòng nhóm La Mã I…VI → nhomMa, nhomTen, linhVucLon.
- Khóa: dòng có STT → TU-699:<STT>; dòng không số → TU-699:<STT liền trước>.<n> (n đếm từ 1 sau mỗi STT).
- Cha con: tên bắt đầu "Trong đó" → con của dòng có số gần nhất phía trên; tên bắt đầu "- " → con của dòng
  có số gần nhất không bắt đầu "- ".
- Ô "[bổ sung thông tin]" → rỗng. Các cột đánh dấu (17, 18, 20…28) → ghiChu dạng "Thuộc: …".
"""
import os
import re
import sys

import openpyxl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mau_chuan  # noqa: E402

MA_BO = 'TU-699'
LINH_VUC = {
    'I': 'Thông tin chung', 'II': 'Kinh tế', 'III': 'Văn hóa – xã hội',
    'IV': 'Đô thị, môi trường', 'V': 'Cải cách hành chính', 'VI': 'Quốc phòng – an ninh',
}
CHO_TRONG = '[bổ sung thông tin]'
# Cột đánh dấu (chỉ số 0-based) → nhãn trong ghi chú "Thuộc: …".
COT_DANH_DAU = [(16, 'NQ 169/NQ-CP'), (17, 'NQ/QĐ Thành phố'), (19, 'NQĐH TQ'), (20, 'NQĐH TP'), (21, 'NQCP'),
                (22, 'VPTW'), (23, 'Cấp TP'), (24, 'Cấp xã'), (25, 'Năm 2026'), (26, 'Khác'), (27, 'Thêm')]
_LA_MA = re.compile(r'^(VI{0,3}|IV|IX|I{1,3}|X)\b\.?\s*(.*)$')


def _o(r, i):
    """Giá trị ô dạng chữ đã làm sạch; ô chờ bổ sung → rỗng."""
    v = r[i] if i < len(r) else None
    if v is None:
        return ''
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = str(v).strip()
    return '' if s == CHO_TRONG else s


def _muc_tieu(giai_doan, nguyen_van):
    m = re.match(r'^(>=|<=|≥|≤|>|<|=)?\s*(.*)$', nguyen_van)
    phep = {'≥': '>=', '≤': '<='}.get(m.group(1), m.group(1) or '=')
    t = re.sub(r'\s', '', m.group(2))
    if re.match(r'^\d{1,3}(\.\d{3})+(,\d+)?$', t):
        t = t.replace('.', '')
    t = t.replace(',', '.', 1)
    try:
        so = float(t)
        so = int(so) if so.is_integer() else so
    except ValueError:
        so = None
    return {'giaiDoan': giai_doan, 'nguyenVan': nguyen_van, 'phep': phep, 'so': so}


def _ghi_chu(r):
    phan = []
    for i in (18, 15):  # Ghi chú (19), phân thuộc tính khác (16)
        if _o(r, i):
            phan.append(_o(r, i))
    thuoc = [nhan for i, nhan in COT_DANH_DAU if _o(r, i)]
    if thuoc:
        phan.append('Thuộc: ' + '; '.join(thuoc))
    return '\n'.join(phan)


def chuyen(duong_dan):
    """Đọc file Excel 699 → (bo, dongs) theo mẫu chuẩn ChiTieu_TrongBo."""
    ws = openpyxl.load_workbook(duong_dan, data_only=True).worksheets[0]
    dongs = []
    nhom_ma = nhom_ten = ''
    neo = None          # (stt, khóa) của dòng có số gần nhất
    neo_khong_gach = None  # khóa dòng có số gần nhất không bắt đầu "- "
    dem_sau = {}
    for so_dong, r in enumerate(ws.iter_rows(min_row=4, values_only=True), 4):
        a, ten = _o(r, 0), _o(r, 1)
        m = _LA_MA.match(a) if a and not a.isdigit() else None
        if m:
            nhom_ma = m.group(1)
            nhom_ten = ten or m.group(2).strip()
            if nhom_ma not in LINH_VUC:
                raise ValueError('Dòng %d: nhóm La Mã lạ "%s"' % (so_dong, a))
            continue
        if not ten:
            continue
        if not nhom_ma:
            raise ValueError('Dòng %d: chỉ tiêu nằm trước dòng nhóm' % so_dong)
        if a:
            if not a.isdigit():
                raise ValueError('Dòng %d: STT "%s" không phải số' % (so_dong, a))
            ma_goc, stt = a, a
            khoa = '%s:%s' % (MA_BO, a)
            cha = neo_khong_gach if ten.startswith('-') else ''
            neo = (a, khoa)
            dem_sau[a] = 0
            if not ten.startswith('-'):
                neo_khong_gach = khoa
            vi_tri = 'Mục %s, STT %s' % (nhom_ma, a)
        else:
            if neo is None:
                raise ValueError('Dòng %d: dòng không số đứng trước mọi dòng có số' % so_dong)
            dem_sau[neo[0]] += 1
            ma_goc, stt = '%s.%d' % (neo[0], dem_sau[neo[0]]), ''
            khoa = '%s:%s' % (MA_BO, ma_goc)
            cha = neo[1] if ten.lower().startswith('trong đó') else ''
            vi_tri = 'Mục %s, dòng không số sau STT %s' % (nhom_ma, neo[0])
        muc_tieu = [_muc_tieu(g, _o(r, i)) for g, i in (('2026', 3), ('2026-2030', 4)) if _o(r, i)]
        cq = []
        if _o(r, 12):
            cq.append('Đối với chỉ tiêu cấp xã: ' + _o(r, 12))
        if _o(r, 13):
            cq.append(_o(r, 13))
        dongs.append({
            'maTrongBo': khoa, 'maBo': MA_BO, 'maGoc': ma_goc, 'sttTrongBo': stt,
            'nhomMa': nhom_ma, 'nhomTen': nhom_ten, 'chaTrongBo': cha, 'tenNguyenVan': ten,
            'nguonSoLieu': _o(r, 11), 'coQuanChuTriThuThap': '\n'.join(cq), 'coQuanPhoiHopThuThap': '',
            'donViTinh': _o(r, 2), 'thuocTinhTongHop': _o(r, 8), 'capDuLieu': _o(r, 5),
            'kyBaoCaoTP': _o(r, 6), 'kyBaoCaoXa': _o(r, 7), 'thoiDiemChotSoLieu': _o(r, 10),
            'mucTieu': muc_tieu, 'viTriTrongVanBan': vi_tri, 'canCuNguyenVan': _o(r, 9),
            'coQuanXacNhanSoLieu': _o(r, 14), 'linhVucLon': LINH_VUC[nhom_ma],
            'tinhTrangHieuLuc': 'Còn hiệu lực', 'ghiChu': _ghi_chu(r),
        })
    bo = mau_chuan.bo_gieo(MA_BO)
    bo['soChiTieu'] = len(dongs)
    return bo, dongs


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    bo, dongs = chuyen(argv[1])
    mau_chuan.ghi_mau(argv[2], bo, dongs)
    print('Đã ghi %s: %d chỉ tiêu' % (argv[2], len(dongs)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
