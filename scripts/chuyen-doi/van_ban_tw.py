"""Chuyển văn bản Trung ương (.docx) sang mẫu nhập chuẩn: danh mục chỉ tiêu + năm mục nội dung.

Chạy: python3 -I scripts/chuyen-doi/van_ban_tw.py <maBo> <thư mục văn bản nguồn> <thư mục đích>
  maBo ∈ TT13-BNV, TT45-BKHCN, LUAT-TK. Ghi hai file: <maBo>.xlsx (theo quy tắc nạp giai đoạn 1b)
  và <maBo>-day-du.xlsx (đủ năm mục cho mọi chỉ tiêu).

Năm mục: 1. Khái niệm, phương pháp tính · 2. Phân tổ chủ yếu · 3. Kỳ công bố · 4. Nguồn số liệu ·
5. Cơ quan (đơn vị) chịu trách nhiệm thu thập, tổng hợp — có "- Chủ trì:" thì tách Chủ trì / Phối hợp,
không có thì toàn bộ vào Chủ trì. Nội dung lưu nguyên văn, giữ xuống dòng.
"""
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import docx_doc  # noqa: E402
import mau_chuan  # noqa: E402

CAU_HINH = {
    'TT13-BNV': {
        'danh_muc': 'TT13-2025-BNV.docx', 'ds_tu': r'^PHỤ LỤC 1$', 'ds_den': r'^PHỤ LỤC 2$',
        'noi_dung': ['TT13-2025-BNV.docx'], 'nd_tu': r'^PHỤ LỤC 2$', 'nd_den': None,
        # Quy tắc nạp 1b: chỉ ba chỉ tiêu có phân tổ đến cấp xã được nạp năm mục.
        'nap_noi_dung': {'0101', '0203', '0205'}, 'ghi_chu_nap': '',
    },
    'TT45-BKHCN': {
        'danh_muc': 'TT45-2025-BKHCN.docx', 'ds_tu': r'^I\. DANH MỤC CHỈ TIÊU', 'ds_den': r'^II\. NỘI DUNG CHỈ TIÊU',
        'noi_dung': ['TT45-2025-BKHCN.docx'], 'nd_tu': r'^II\. NỘI DUNG CHỈ TIÊU', 'nd_den': r'^Phụ lục II$',
        'nap_noi_dung': set(), 'ghi_chu_nap': '',
    },
    'LUAT-TK': {
        'danh_muc': 'LUAT-TK-VBHN37.docx', 'ds_tu': r'^DANH MỤC CHỈ TIÊU THỐNG KÊ QUỐC GIA$', 'ds_den': None,
        'noi_dung': ['ND94-2022-phan%d.docx' % i for i in (1, 2, 3, 4)], 'nd_tu': None, 'nd_den': r'^Phụ lục II$',
        'nap_noi_dung': set(), 'ghi_chu_nap': 'Nội dung theo NĐ 94/2022/NĐ-CP',
        'ghi_chu_day_du': 'Nội dung trích Phụ lục NĐ 94/2022/NĐ-CP',
    },
}

NAM_TRUONG = ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieu',
              'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap']
# Nhận mục theo TỪ KHÓA, không theo số: NĐ 94 có chỉ tiêu bỏ mục "Phân tổ" nên các mục sau lùi số
# (0506: "2. Kỳ công bố", "3. Nguồn số liệu", "4. Cơ quan..."); số thứ tự lồng trong mục 1 ("2. Dân số trung bình")
# không trùng từ khóa nên không bị nhận nhầm.
_MUC = [
    (r'Khái niệm', 'khaiNiemPhuongPhapTinh'),
    (r'Phân tổ', 'phanToChuYeu'),
    (r'Kỳ công bố', 'kyCongBo'),
    (r'Nguồn số liệu', 'nguonSoLieu'),
    (r'(?:Cơ quan|Đơn vị) chịu trách nhiệm', 'muc5'),
]
_RE_MUC = re.compile(r'^[1-6]\.\s*([^:]*?)\s*(?::\s*(.*))?$')
_RE_CHI_TIEU_DS = re.compile(r'^(\d*)\s*¦\s*(\d{4})\s*¦\s*(.+)$', re.S)
_RE_NHOM_DS = re.compile(r'^(?:¦\s*)?(\d{2})(?:\.|\s*¦)\s*(.+)$')
_RE_TIEU_DE = re.compile(r'^(\d{4})\.\s+(.+)$')
_RE_NHOM = re.compile(r'^(\d{2})\.\s+(.+)$')


def _sach(s):
    # NFC: một số đoạn trong văn bản gốc lưu chữ Việt dạng tổ hợp (NFD) — so khớp từ khóa sẽ trượt nếu không chuẩn hóa.
    return unicodedata.normalize('NFC', s).replace('\xa0', ' ').strip()


def _rut(s):
    """So tên không phân biệt hoa thường, khoảng trắng."""
    return re.sub(r'\s+', ' ', s).strip().lower()


def doc_danh_muc(duong_dan, ds_tu, ds_den):
    """Danh mục: [{stt, ma, ten, nhomMa, nhomTen}] theo thứ tự văn bản."""
    dong = [_sach(x) for x in docx_doc.doc_dong(duong_dan)]
    ra, nhom, trong = [], ('', ''), False
    for s in dong:
        if not trong:
            trong = bool(re.match(ds_tu, s))
            continue
        if ds_den and re.match(ds_den, s):
            break
        m = _RE_CHI_TIEU_DS.match(s)
        if m:
            ra.append({'stt': m.group(1), 'ma': m.group(2), 'ten': re.sub(r'\s*\n\s*', ' ', m.group(3)).strip(),
                       'nhomMa': nhom[0], 'nhomTen': nhom[1]})
            continue
        m = _RE_NHOM_DS.match(s)
        if m and '¦' not in m.group(2):
            nhom = (m.group(1), m.group(2).strip())
    if not ra:
        raise ValueError('Không tìm thấy danh mục chỉ tiêu trong ' + duong_dan)
    return ra


def _tach_muc5(dong):
    """Tách dòng mục 5 thành (chủ trì, phối hợp)."""
    chu_tri, phoi_hop, dang = [], [], None
    for s in dong:
        m = re.match(r'^-?\s*Chủ trì\s*:\s*(.*)$', s)
        if m:
            dang = chu_tri
            if m.group(1):
                chu_tri.append(m.group(1))
            continue
        m = re.match(r'^-?\s*Phối hợp\s*:\s*(.*)$', s)
        if m:
            dang = phoi_hop
            if m.group(1):
                phoi_hop.append(m.group(1))
            continue
        (dang if dang is not None else chu_tri).append(s)
    return '\n'.join(chu_tri), '\n'.join(phoi_hop)


def doc_noi_dung(cac_duong_dan, ma_hop_le, nhom_hop_le, nd_tu, nd_den):
    """Nội dung năm mục: {ma: {truong: chữ, 'tenTrongNoiDung': ...}}; mỗi mã lấy lần xuất hiện đầu."""
    dong = []
    for p in cac_duong_dan:
        dong.extend(_sach(x) for x in docx_doc.doc_dong(p))
    ra, hien, muc, trong = {}, None, None, nd_tu is None
    for s in dong:
        if not trong:
            trong = bool(re.match(nd_tu, s))
            continue
        if nd_den and ra and re.match(nd_den, s):
            break
        if not s:
            continue
        m = _RE_TIEU_DE.match(s)
        if m and m.group(1) in ma_hop_le and m.group(1) not in ra:
            hien = {'tenTrongNoiDung': m.group(2).strip()}
            ra[m.group(1)] = hien
            muc = None
            continue
        m = _RE_NHOM.match(s)
        if m and m.group(1) in nhom_hop_le and _rut(m.group(2)).startswith(nhom_hop_le[m.group(1)][:12]):
            hien, muc = None, None
            continue
        if hien is None:
            continue
        m = _RE_MUC.match(s)
        moi = m and next((t for k, t in _MUC if re.match(k, m.group(1))), None)
        if moi:
            muc = moi
            hien.setdefault(muc, [])
            if m.group(2):
                hien[muc].append(m.group(2).strip())
            continue
        if muc:
            hien[muc].append(s)
    kq = {}
    for ma, h in ra.items():
        r = {'tenTrongNoiDung': h['tenTrongNoiDung']}
        for k in NAM_TRUONG[:4]:
            r[k] = '\n'.join(h.get(k, []))
        r['coQuanChuTriThuThap'], r['coQuanPhoiHopThuThap'] = _tach_muc5(h.get('muc5', []))
        for k in NAM_TRUONG:
            r[k] = re.sub(r'\s*/\.$', '', r[k]).strip()  # dấu kết thúc văn bản "./." → "."
        kq[ma] = r
    return kq


def chuyen(ma_bo, thu_muc_nguon):
    """→ (bo, dongs_day_du, dongs_nap) cho một bộ Trung ương."""
    ch = CAU_HINH[ma_bo]
    ds = doc_danh_muc(os.path.join(thu_muc_nguon, ch['danh_muc']), ch['ds_tu'], ch['ds_den'])
    ma_hop_le = {d['ma'] for d in ds}
    if len(ma_hop_le) != len(ds):
        raise ValueError('%s: mã trùng trong danh mục' % ma_bo)
    nhom_hop_le = {}
    for d in ds:
        nhom_hop_le.setdefault(d['nhomMa'], _rut(d['nhomTen']))
    nd = doc_noi_dung([os.path.join(thu_muc_nguon, p) for p in ch['noi_dung']], ma_hop_le, nhom_hop_le,
                      ch['nd_tu'], ch['nd_den'])
    day_du, nap = [], []
    for d in ds:
        n = nd.get(d['ma'], {})
        ghi_chu = ch.get('ghi_chu_day_du', '')
        if n.get('tenTrongNoiDung') and _rut(n['tenTrongNoiDung']) != _rut(d['ten']):
            ghi_chu = (ghi_chu + '\n' if ghi_chu else '') + 'Tên ở phần nội dung: ' + n['tenTrongNoiDung']
        dong = {
            'maTrongBo': '%s:%s' % (ma_bo, d['ma']), 'maBo': ma_bo, 'maGoc': d['ma'], 'sttTrongBo': d['stt'],
            'nhomMa': d['nhomMa'], 'nhomTen': d['nhomTen'], 'chaTrongBo': '', 'tenNguyenVan': d['ten'],
            'tinhTrangHieuLuc': 'Còn hiệu lực', 'ghiChu': ghi_chu,
        }
        for k in NAM_TRUONG:
            dong[k] = n.get(k, '')
        day_du.append(dong)
        rut = dict(dong)
        if d['ma'] not in ch['nap_noi_dung']:
            for k in NAM_TRUONG:
                rut[k] = ''
        rut['ghiChu'] = ch['ghi_chu_nap']
        nap.append(rut)
    bo = mau_chuan.bo_gieo(ma_bo)
    bo['soChiTieu'] = len(ds)
    return bo, day_du, nap


def main(argv):
    if len(argv) != 4 or argv[1] not in CAU_HINH:
        print(__doc__)
        return 2
    bo, day_du, nap = chuyen(argv[1], argv[2])
    mau_chuan.ghi_mau(os.path.join(argv[3], argv[1] + '.xlsx'), bo, nap)
    mau_chuan.ghi_mau(os.path.join(argv[3], argv[1] + '-day-du.xlsx'), bo, day_du)
    thieu = [d['maGoc'] for d in day_du if not d['khaiNiemPhuongPhapTinh']]
    print('%s: %d chỉ tiêu, %d nhóm; thiếu nội dung: %s' % (argv[1], len(day_du), len({d['nhomMa'] for d in day_du}),
                                                          ', '.join(thieu) or 'không'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
