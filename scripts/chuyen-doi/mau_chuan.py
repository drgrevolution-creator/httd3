"""Mẫu nhập chuẩn bộ chỉ tiêu (.xlsx) — cửa ngõ duy nhất để đưa bộ chỉ tiêu vào HTTD 3.0.

Cấu trúc file:
  - sheet "Bo":       dòng 1 khóa cột DM_BoChiTieu, dòng 2 tên hiển thị, dòng 3 thông tin bộ.
  - sheet "ChiTieu":  dòng 1 khóa cột ChiTieu_TrongBo, dòng 2 tên hiển thị, từ dòng 3 mỗi dòng một chỉ tiêu.
  - sheet "HuongDan": ghi chú cho người dùng (hệ thống không đọc).
Mọi ô ghi ở dạng chữ (định dạng "@") để giữ số 0 đầu và mục tiêu nguyên văn.

Danh sách cột lấy thẳng từ gas/thuan/SoDo.gs (chạy node), nên chỉ có một nguồn sự thật.
"""
import functools
import json
import os
import subprocess

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_JS = (
    "require('./gas/test/_moiTruong.js').taiThuan();"
    "const o={cot:{}};"
    "for (const b of ['DM_BoChiTieu','ChiTieu_TrongBo'])"
    " o.cot[b]=SoDo.BANG[b].cot.filter(c=>!c.heThong).map(c=>({khoa:c.khoa,ten:c.ten,kieu:c.kieu,tuyChon:c.tuyChon||null}));"
    "o.gieo=DuLieuGieo.BANG.DM_BoChiTieu; o.tuDung=BoChiTieu.TU_DUNG;"
    "process.stdout.write(JSON.stringify(o));"
)


@functools.lru_cache(maxsize=1)
def _so_do():
    kq = subprocess.run(['node', '-e', _JS], cwd=GOC, capture_output=True, text=True, check=True)
    return json.loads(kq.stdout)


def cot_bang(ten_bang):
    """Các cột người dùng nhập của bảng (không gồm cột hệ thống), đúng thứ tự sơ đồ."""
    return _so_do()['cot'][ten_bang]


def tu_dung():
    """Danh sách từ dừng khi so tên — đọc từ BoChiTieu.TU_DUNG để Python và hệ thống dùng chung."""
    return list(_so_do()['tuDung'])


def bo_gieo(ma_bo):
    """Thông tin bộ như dữ liệu gieo (DuLieuGieo.BANG.DM_BoChiTieu)."""
    for b in _so_do()['gieo']:
        if b['maBo'] == ma_bo:
            return dict(b)
    raise KeyError(ma_bo)


def _chu(v):
    if v is None:
        return ''
    if isinstance(v, (list, dict)):
        return json.dumps(v, ensure_ascii=False) if v else ''
    return str(v)


def _kiem_tra(ten_bang, ban_ghi, so_dong):
    cot = {c['khoa']: c for c in cot_bang(ten_bang)}
    for k, v in ban_ghi.items():
        if k not in cot:
            raise ValueError('%s dòng %d: cột "%s" không có trong sơ đồ' % (ten_bang, so_dong, k))
        c = cot[k]
        if c['kieu'] == 'select' and v not in ('', None) and v not in c['tuyChon']:
            raise ValueError('%s dòng %d: %s = "%s" ngoài danh sách %s' % (ten_bang, so_dong, k, v, c['tuyChon']))


_NEN_KHOA = PatternFill('solid', fgColor='E7E6E6')
_NEN_TEN = PatternFill('solid', fgColor='DDEBF7')


def _ghi_sheet(ws, ten_bang, dongs):
    cot = cot_bang(ten_bang)
    for j, c in enumerate(cot, 1):
        o1 = ws.cell(1, j, c['khoa'])
        o1.font = Font(size=9, color='595959')
        o1.fill = _NEN_KHOA
        o2 = ws.cell(2, j, c['ten'])
        o2.font = Font(bold=True)
        o2.fill = _NEN_TEN
        o2.alignment = Alignment(wrap_text=True, vertical='top')
        rong = 48 if c['kieu'] in ('textarea', 'json') else 20
        ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = rong
    for i, d in enumerate(dongs, 3):
        _kiem_tra(ten_bang, d, i)
        for j, c in enumerate(cot, 1):
            o = ws.cell(i, j)
            o.number_format = '@'
            gt = _chu(d.get(c['khoa']))
            if gt != '':
                o.value = gt
            if c['kieu'] in ('textarea', 'json'):
                o.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'C3'


_HUONG_DAN = [
    'MẪU NHẬP CHUẨN BỘ CHỈ TIÊU — HTTD 3.0',
    '',
    'Sheet "Bo": thông tin bộ chỉ tiêu (một dòng, dòng 3).',
    'Sheet "ChiTieu": mỗi dòng (từ dòng 3) là một chỉ tiêu trong bộ.',
    'Dòng 1 là mã cột hệ thống đọc — KHÔNG sửa. Dòng 2 là tên cột cho người đọc.',
    'maTrongBo = <maBo>:<mã gốc>. Văn bản không có mã thì dùng số thứ tự; dòng không số dùng <STT liền trước>.<n>.',
    'Mọi ô ở dạng chữ để giữ số 0 đầu (0101) và mục tiêu nguyên văn (>=1.924.469).',
    'mucTieu ghi dạng JSON: [{"giaiDoan":"2026","nguyenVan":">=10"}].',
    'Năm trường nội dung (khái niệm, phân tổ, kỳ công bố, nguồn số liệu, cơ quan chủ trì/phối hợp) lưu nguyên văn, giữ xuống dòng.',
    'Nhập lại cùng bộ: hệ thống cập nhật theo maTrongBo; dòng không còn trong file chuyển "Hết hiệu lực", không xóa.',
]


def ghi_mau(duong_dan, bo, dongs):
    """Ghi file mẫu chuẩn. Báo ValueError nếu cột lạ hoặc giá trị chọn ngoài danh sách."""
    wb = openpyxl.Workbook()
    ws_bo = wb.active
    ws_bo.title = 'Bo'
    _ghi_sheet(ws_bo, 'DM_BoChiTieu', [bo])
    _ghi_sheet(wb.create_sheet('ChiTieu'), 'ChiTieu_TrongBo', dongs)
    hd = wb.create_sheet('HuongDan')
    for i, s in enumerate(_HUONG_DAN, 1):
        hd.cell(i, 1, s).font = Font(bold=(i == 1))
    hd.column_dimensions['A'].width = 120
    os.makedirs(os.path.dirname(os.path.abspath(duong_dan)), exist_ok=True)
    wb.save(duong_dan)


def _doc_sheet(ws):
    hang = list(ws.iter_rows(values_only=True))
    khoa = [k for k in hang[0] if k]
    ra = []
    for r in hang[2:]:
        d = {k: ('' if r[j] is None else str(r[j])) for j, k in enumerate(khoa)}
        if any(d.values()):
            ra.append(d)
    return ra


def doc_mau(duong_dan):
    """Đọc lại file mẫu chuẩn → (bo, dongs), mọi giá trị là chuỗi."""
    wb = openpyxl.load_workbook(duong_dan)
    return _doc_sheet(wb['Bo'])[0], _doc_sheet(wb['ChiTieu'])
