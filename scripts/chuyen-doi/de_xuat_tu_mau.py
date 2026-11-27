"""Lập file ĐỀ XUẤT loại giá trị, tử số, mẫu số, hệ số nhân cho chỉ tiêu Phụ lục 699, để Mr. Nobody duyệt.

Chạy: python3 -I scripts/chuyen-doi/de_xuat_tu_mau.py <TU-699.xlsx> <dinh-nghia.json> <file đích>

- Loại giá trị theo quy tắc mặc định `phan_loai` (tên + đơn vị tính); file định nghĩa (Claude soạn tay, lưu ở
  data/rieng/) được quyền đổi loại, đổi hệ số và ghi tử số, mẫu số, ghi chú.
- Mr. Nobody sửa ở cột "MrNobodySua" theo dạng `loai=TY_LE; tuSo=...; mauSo=...; heSo=100` (chỉ ghi phần muốn đổi).
- tu699.py đọc file đã duyệt (đối số tu_mau) để đưa bốn cột vào file nạp TU-699.xlsx.
"""
import json
import os
import re
import sys
import unicodedata

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mau_chuan  # noqa: E402

COT = [('maTrongBo', 'Mã trong bộ', 14), ('tenNguyenVan', 'Tên chỉ tiêu', 46), ('donViTinh', 'Đơn vị tính', 12),
       ('capDuLieu', 'Cấp dữ liệu', 12), ('loaiGiaTri', 'Loại giá trị', 14), ('dinhNghiaTuSo', 'Tử số là gì', 44),
       ('dinhNghiaMauSo', 'Mẫu số là gì', 44), ('heSoNhan', 'Hệ số nhân', 10), ('ghiChuClaude', 'Ghi chú của Claude', 40),
       ('MrNobodySua', 'Mr. Nobody sửa (vd: loai=TOC_DO; tuSo=...; mauSo=...; heSo=100)', 40)]
TEN_LOAI = {'TY_LE': 'Tỷ lệ (tử số/mẫu số)', 'TOC_DO': 'Tốc độ, chỉ số nhận từ cơ quan khác',
            'SO_TUYET_DOI': 'Số tuyệt đối', 'XEP_HANG': 'Xếp hạng, điểm số'}


def _khong_dau(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    return re.sub(r'[̀-ͯ]', '', s).replace('đ', 'd')


def phan_loai(ten, don_vi):
    """Quy tắc mặc định → (maLoai, heSo | None)."""
    t, dv = _khong_dau(ten), str(don_vi or '').strip()
    if dv.startswith('%') and ('toc do' in t or 'tang truong' in t):
        return 'TOC_DO', None
    if dv.startswith('%'):
        return 'TY_LE', 100
    if '/10.000 dan' in t:
        return 'TY_LE', 10000
    if dv.endswith('/người') or 'binh quan dau nguoi' in t:
        return 'TY_LE', 1
    if dv == 'Hạng' or t.startswith('xep hang'):
        return 'XEP_HANG', None
    return 'SO_TUYET_DOI', None


def doc_dinh_nghia(duong_dan):
    with open(duong_dan, encoding='utf-8') as f:
        d = json.load(f)
    return {k: v for k, v in d.items() if not k.startswith('_')}


def lap_de_xuat(dongs_699, dinh_nghia):
    """Mỗi chỉ tiêu một dòng đề xuất; MrNobodySua để trống."""
    ra = []
    for d in dongs_699:
        loai, he_so = phan_loai(d['tenNguyenVan'], d.get('donViTinh', ''))
        dn = dinh_nghia.get(d['maTrongBo'], {})
        loai = dn.get('loai', loai)
        if loai != 'TY_LE':
            he_so = None
        he_so = dn.get('heSo', he_so)
        ghi_chu = '; '.join(x for x in (dn.get('chac', ''), dn.get('ghiChu', '')) if x)
        ra.append({'maTrongBo': d['maTrongBo'], 'tenNguyenVan': d['tenNguyenVan'], 'donViTinh': d.get('donViTinh', ''),
                   'capDuLieu': d.get('capDuLieu', ''), 'loaiGiaTri': loai, 'dinhNghiaTuSo': dn.get('tuSo', ''),
                   'dinhNghiaMauSo': dn.get('mauSo', ''), 'heSoNhan': he_so if he_so is not None else '',
                   'ghiChuClaude': ghi_chu, 'MrNobodySua': ''})
    return ra


def ghi(duong_dan, bang):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'DeXuat'
    for j, (k, ten, rong) in enumerate(COT, 1):
        o = ws.cell(1, j, ten)
        o.font = Font(bold=True)
        o.fill = PatternFill('solid', fgColor='DDEBF7')
        o.alignment = Alignment(wrap_text=True, vertical='top')
        ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = rong
    for i, r in enumerate(bang, 2):
        for j, (k, _, _) in enumerate(COT, 1):
            o = ws.cell(i, j, r.get(k, '') if r.get(k, '') != '' else None)
            o.number_format = '@' if k != 'heSoNhan' else 'General'
            o.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'C2'
    ws.auto_filter.ref = ws.dimensions
    hd = wb.create_sheet('LoaiGiaTri')
    hd.append(['Mã', 'Tên loại giá trị'])
    for k, v in TEN_LOAI.items():
        hd.append([k, v])
    wb.save(duong_dan)


# Khóa trong cột MrNobodySua, so sau khi bỏ dấu và khoảng trắng: "Tử số", "tuSo", "tu so" đều là tử số.
_KHOA_SUA = {'loai': 'loaiGiaTri', 'loaigiatri': 'loaiGiaTri', 'tuso': 'dinhNghiaTuSo', 'mauso': 'dinhNghiaMauSo',
             'heso': 'heSoNhan', 'hesonhan': 'heSoNhan'}
_LENH_BO = {'bo', 'xoa', 'khong', 'boqua'}
_BON_COT = ('loaiGiaTri', 'dinhNghiaTuSo', 'dinhNghiaMauSo', 'heSoNhan')


def _khoa_sua(k):
    return _KHOA_SUA.get(re.sub(r'\s', '', _khong_dau(k)))


def _he_so_chu(v):
    """Hệ số kiểu Việt Nam → chữ số thường ("10.000" → "10000", "1,5" → "1.5", "10,000" → "10000"); không đọc được → giữ nguyên."""
    t = re.sub(r'\s', '', str(v))
    if re.fullmatch(r'\d+\.0', t):
        return t[:-2]
    if re.fullmatch(r'\d{1,3}([.,]\d{3})+', t):
        return t.replace('.', '').replace(',', '')
    if re.fullmatch(r'\d+,\d+', t):
        return t.replace(',', '.')
    return t


def _tach_lenh(chuoi):
    """Tách "k=v; k=v": chỉ tách tại dấu ; đứng trước một khóa đã biết (giữ ; trong nội dung). → (lệnh [(cột, giá trị)], bỏ?, phần không hiểu)."""
    lenh, khong_hieu, bo = [], [], False
    for phan in chuoi.split(';'):
        p = phan.strip()
        if not p:
            continue
        if '=' in p and _khoa_sua(p.split('=', 1)[0]):
            k, v = p.split('=', 1)
            lenh.append([_khoa_sua(k), v.strip()])
        elif re.sub(r'\s', '', _khong_dau(p)) in _LENH_BO:
            bo = True
        elif lenh:
            lenh[-1][1] = lenh[-1][1] + '; ' + p   # dấu ; nằm trong nội dung của lệnh trước
        else:
            khong_hieu.append(p)
    return lenh, bo, khong_hieu


def doc_da_duyet(duong_dan, bao_cao=None):
    """File đề xuất đã duyệt → {maTrongBo: {loaiGiaTri, dinhNghiaTuSo, dinhNghiaMauSo, heSoNhan}} (chữ), đã áp cột MrNobodySua.

    MrNobodySua: "loai=…; tuSo=…; mauSo=…; heSo=…" (khóa có dấu hay không đều được), hoặc "bỏ" để không nạp bốn cột.
    Đổi sang loại không có tử/mẫu mà không ghi tử/mẫu/hệ số → các ô đó được xóa. bao_cao (list) nhận từng dòng
    "mã: đã áp …" và "mã: KHÔNG HIỂU …" để Claude báo lại Mr. Nobody.
    """
    ws = openpyxl.load_workbook(duong_dan, data_only=True)['DeXuat']
    hang = list(ws.iter_rows(values_only=True))
    khoa = [k for k, _, _ in COT]
    ra = {}
    for r in hang[1:]:
        d = {k: ('' if r[j] is None else str(r[j]).strip()) for j, k in enumerate(khoa) if j < len(r)}
        ma = d.get('maTrongBo')
        if not ma:
            continue
        d['heSoNhan'] = _he_so_chu(d.get('heSoNhan', ''))
        lenh, bo, khong_hieu = _tach_lenh(d.get('MrNobodySua', ''))
        if bo:
            for k in _BON_COT:
                d[k] = ''
        da_dat = set()
        for cot, v in lenh:
            if cot == 'loaiGiaTri':
                v = re.sub(r'\s', '', v).upper()
            elif cot == 'heSoNhan':
                v = _he_so_chu(v)
            d[cot] = v
            da_dat.add(cot)
        if 'loaiGiaTri' in da_dat and d['loaiGiaTri'] in TEN_LOAI and d['loaiGiaTri'] != 'TY_LE':
            for k in ('dinhNghiaTuSo', 'dinhNghiaMauSo', 'heSoNhan'):
                if k not in da_dat:
                    d[k] = ''
        if bao_cao is not None:
            if bo:
                bao_cao.append('%s: đã áp "bỏ" (không nạp loại giá trị, tử số, mẫu số, hệ số)' % ma)
            if lenh:
                bao_cao.append('%s: đã áp %s' % (ma, '; '.join('%s=%s' % (c, v) for c, v in lenh)))
            if 'loaiGiaTri' in da_dat and d['loaiGiaTri'] not in TEN_LOAI:
                bao_cao.append('%s: loại "%s" không phải 4 loại gieo sẵn — phải có trong danh mục Loại giá trị' % (ma, d['loaiGiaTri']))
            for p in khong_hieu:
                bao_cao.append('%s: KHÔNG HIỂU "%s" (bỏ qua)' % (ma, p))
        ra[ma] = {k: d.get(k, '') for k in _BON_COT}
    return ra


def main(argv):
    if len(argv) != 4:
        print(__doc__)
        return 2
    _, d699 = mau_chuan.doc_mau(argv[1])
    bang = lap_de_xuat(d699, doc_dinh_nghia(argv[2]))
    ghi(argv[3], bang)
    print('Đã ghi %s: %d dòng (%d tỷ lệ)' % (argv[3], len(bang), sum(r['loaiGiaTri'] == 'TY_LE' for r in bang)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
