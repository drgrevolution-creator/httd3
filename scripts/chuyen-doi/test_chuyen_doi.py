"""Test script chuyển đổi bộ chỉ tiêu. Chạy: python3 -I scripts/chuyen-doi/test_chuyen_doi.py

Assert thuần, không cần pytest. Test TU-699 cần file nội bộ data/rieng/TU-699-nguon.xlsx
(không có trong kho công khai): thiếu file thì bỏ qua, có ghi rõ.
"""
import json
import os
import subprocess
import sys
import tempfile

THU_MUC = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THU_MUC)
GOC = os.path.dirname(os.path.dirname(THU_MUC))
NGUON = os.path.join(GOC, 'data', 'nguon')
NGUON_699 = os.path.join(GOC, 'data', 'rieng', 'TU-699-nguon.xlsx')

import mau_chuan  # noqa: E402
import tu699  # noqa: E402
import van_ban_tw  # noqa: E402
import de_xuat_ghep  # noqa: E402
import de_xuat_tu_mau  # noqa: E402

NAM_TRUONG = ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieu',
              'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap']
KET_QUA = []


def ca(ten):
    def boc(f):
        def chay():
            try:
                f()
                KET_QUA.append((ten, 'ĐẠT', ''))
            except _BoQua as e:
                KET_QUA.append((ten, 'BỎ QUA', str(e)))
            except Exception as e:  # noqa: BLE001
                KET_QUA.append((ten, 'LỖI', '%s: %s' % (type(e).__name__, e)))
        chay.ten = ten
        DS_CA.append(chay)
        return chay
    return boc


class _BoQua(Exception):
    pass


DS_CA = []


def _theo_ma(dongs):
    return {d['maTrongBo']: d for d in dongs}


def _ghi_doc_lai(bo, dongs):
    with tempfile.TemporaryDirectory() as t:
        p = os.path.join(t, 'x.xlsx')
        mau_chuan.ghi_mau(p, bo, dongs)
        return mau_chuan.doc_mau(p)


# ---------- Mẫu chuẩn ----------
@ca('mẫu chuẩn: dòng 1 là khóa cột đúng ChiTieu_TrongBo, dòng 2 là tên hiển thị, mã giữ số 0 đầu')
def _():
    cot = mau_chuan.cot_bang('ChiTieu_TrongBo')
    assert cot[0]['khoa'] == 'maTrongBo' and 'coQuanPhoiHopThuThap' in [c['khoa'] for c in cot]
    assert all(not c['khoa'].startswith(('taoLuc', 'capNhatLuc', 'nguoiTao', 'nguoiCapNhat', 'daXoa')) for c in cot)
    bo = dict(mau_chuan.bo_gieo('TT13-BNV'))
    dongs = [{'maTrongBo': 'TT13-BNV:0101', 'maBo': 'TT13-BNV', 'maGoc': '0101', 'tenNguyenVan': 'Số đơn vị hành chính',
              'mucTieu': [{'giaiDoan': '2026', 'nguyenVan': '>=1.924.469'}], 'coQuanPhoiHopThuThap': '+ A;\n+ B.'}]
    with tempfile.TemporaryDirectory() as t:
        p = os.path.join(t, 'x.xlsx')
        mau_chuan.ghi_mau(p, bo, dongs)
        import openpyxl
        wb = openpyxl.load_workbook(p)
        ws = wb['ChiTieu']
        assert [c.value for c in ws[1]][:3] == ['maTrongBo', 'maBo', 'maGoc'], [c.value for c in ws[1]][:3]
        assert ws.cell(2, 1).value == 'Mã trong bộ'
        assert ws.cell(3, 3).value == '0101' and ws.cell(3, 3).number_format == '@'
        assert wb['Bo'].cell(1, 1).value == 'maBo' and wb['Bo'].cell(3, 1).value == 'TT13-BNV'
        bo2, d2 = mau_chuan.doc_mau(p)
    assert d2[0]['maGoc'] == '0101'
    assert json.loads(d2[0]['mucTieu'])[0]['nguyenVan'] == '>=1.924.469'
    assert d2[0]['coQuanPhoiHopThuThap'] == '+ A;\n+ B.'
    assert bo2['maBo'] == 'TT13-BNV'


@ca('mẫu chuẩn: giá trị chọn ngoài danh sách bị từ chối khi ghi')
def _():
    try:
        mau_chuan.ghi_mau(os.path.join(tempfile.gettempdir(), 'khong-ghi.xlsx'), dict(mau_chuan.bo_gieo('TT13-BNV')),
                          [{'maTrongBo': 'TT13-BNV:1', 'maBo': 'TT13-BNV', 'tenNguyenVan': 'x', 'capDuLieu': 'Huyện'}])
    except ValueError as e:
        assert 'capDuLieu' in str(e)
        return
    raise AssertionError('phải báo lỗi capDuLieu')


# ---------- TU-699 ----------
def _can_699():
    if not os.path.exists(NGUON_699):
        raise _BoQua('thiếu ' + NGUON_699)


@ca('TU-699: 174 dòng chỉ tiêu, số dòng cấp xã đúng bằng đếm trực tiếp')
def _():
    _can_699()
    bo, dongs = tu699.chuyen(NGUON_699)
    assert len(dongs) == 174, len(dongs)
    assert bo['maBo'] == 'TU-699' and bo['soChiTieu'] == 174
    import openpyxl
    ws = openpyxl.load_workbook(NGUON_699, data_only=True).worksheets[0]
    dem = 0
    for r in ws.iter_rows(min_row=4, values_only=True):
        a = str(r[0] or '').strip()
        if r[1] and not (a and not a.isdigit()) and 'Xã' in str(r[5] or ''):
            dem += 1
    assert dem > 0
    assert sum(1 for d in dongs if 'Xã' in d.get('capDuLieu', '')) == dem
    assert all(d['tenNguyenVan'] for d in dongs)
    assert all('[bổ sung thông tin]' not in ' '.join(str(v) for v in d.values()) for d in dongs)
    assert {d['nhomMa'] for d in dongs} == {'I', 'II', 'III', 'IV', 'V', 'VI'}
    assert {d['linhVucLon'] for d in dongs if d['nhomMa'] == 'VI'} == {'Quốc phòng – an ninh'}


@ca('TU-699: mục tiêu 2026 và 2026-2030 của STT 4, cha con "Trong đó" và "- "')
def _():
    _can_699()
    _, dongs = tu699.chuyen(NGUON_699)
    m = _theo_ma(dongs)
    mt = m['TU-699:4']['mucTieu']
    assert [x['giaiDoan'] for x in mt] == ['2026', '2026-2030'], mt
    assert mt[0]['nguyenVan'] == '>=10' and mt[0]['phep'] == '>=' and mt[0]['so'] == 10, mt
    con = [d for d in dongs if d['tenNguyenVan'] == 'Trong đó: công nghiệp']
    assert len(con) == 1 and con[0]['chaTrongBo'] == 'TU-699:6', con
    assert m['TU-699:5']['chaTrongBo'] == 'TU-699:4' and m['TU-699:8']['chaTrongBo'] == 'TU-699:4'
    assert m['TU-699:4']['chaTrongBo'] == ''
    for d in dongs:
        if d['chaTrongBo']:
            assert d['chaTrongBo'] in m, d['chaTrongBo']
    assert len(m) == len(dongs), 'khóa trùng'
    assert 'Thuộc:' in m['TU-699:4']['ghiChu'] and 'NQĐH TP' in m['TU-699:4']['ghiChu']


@ca('TU-699: chạy hai lần ra khóa giống hệt, đọc lại từ file mẫu không đổi')
def _():
    _can_699()
    _, a = tu699.chuyen(NGUON_699)
    _, b = tu699.chuyen(NGUON_699)
    assert [d['maTrongBo'] for d in a] == [d['maTrongBo'] for d in b]
    bo, c = _ghi_doc_lai(*tu699.chuyen(NGUON_699))
    assert [d['maTrongBo'] for d in c] == [d['maTrongBo'] for d in a]
    assert json.loads(_theo_ma(c)['TU-699:4']['mucTieu'])[1]['giaiDoan'] == '2026-2030'


# ---------- Văn bản Trung ương ----------
_CACHE = {}


def _tw(ma):
    if ma not in _CACHE:
        _CACHE[ma] = van_ban_tw.chuyen(ma, NGUON)
    return _CACHE[ma]


@ca('TT13-BNV: 76 dòng, chỉ 3 dòng có năm trường (0101, 0203, 0205); 0101 chủ trì đúng, phối hợp rỗng')
def _():
    bo, day_du, nap = _tw('TT13-BNV')
    assert len(nap) == 76 and len(day_du) == 76
    co = sorted(d['maGoc'] for d in nap if any(d.get(k) for k in NAM_TRUONG))
    assert co == ['0101', '0203', '0205'], co
    d = _theo_ma(nap)['TT13-BNV:0101']
    assert d['coQuanChuTriThuThap'] == 'Vụ Chính quyền địa phương, Bộ Nội vụ.', repr(d['coQuanChuTriThuThap'])
    assert d['coQuanPhoiHopThuThap'] == ''
    assert d['kyCongBo'] == 'Năm' and d['khaiNiemPhuongPhapTinh'].startswith('- Các đơn vị hành chính')
    assert d['nhomMa'] == '01' and d['sttTrongBo'] == '1' and d['tenNguyenVan'] == 'Số đơn vị hành chính'
    assert len({x['nhomMa'] for x in nap}) == 8


@ca('TT45-BKHCN: 137 dòng, 9 nhóm, bản nạp không có năm trường; bản đầy đủ có đủ mục 1 và 5')
def _():
    bo, day_du, nap = _tw('TT45-BKHCN')
    assert len(nap) == 137 and len({d['nhomMa'] for d in nap}) == 9
    assert not any(d.get(k) for d in nap for k in NAM_TRUONG)
    thieu = [d['maGoc'] for d in day_du if not (d['khaiNiemPhuongPhapTinh'] and d['coQuanChuTriThuThap'])]
    assert not thieu, thieu
    assert _theo_ma(day_du)['TT45-BKHCN:0101']['coQuanChuTriThuThap'] == 'Cục Thông tin, Thống kê.'
    assert _theo_ma(day_du)['TT45-BKHCN:0101']['kyCongBo'] == 'Năm.'


@ca('LUAT-TK: 230 dòng, 21 nhóm, năm trường rỗng, ghi chú NĐ 94; bản đầy đủ 0103 tách chủ trì/phối hợp')
def _():
    bo, day_du, nap = _tw('LUAT-TK')
    assert len(nap) == 230 and len({d['nhomMa'] for d in nap}) == 21
    assert not any(d.get(k) for d in nap for k in NAM_TRUONG)
    assert all('NĐ 94/2022/NĐ-CP' in d['ghiChu'] for d in nap)
    assert nap[-1]['maGoc'] == '2111' and nap[0]['maGoc'] == '0101'
    thieu = [d['maGoc'] for d in day_du if not (d['khaiNiemPhuongPhapTinh'] and d['coQuanChuTriThuThap'])]
    assert thieu == ['1505'], thieu  # 1505: Công báo NĐ 94 không in mục 1 — thiếu ở văn bản gốc
    assert not [d['maGoc'] for d in day_du if not d['kyCongBo']]
    assert _theo_ma(day_du)['LUAT-TK:0506']['kyCongBo'].startswith('Quý')  # chỉ tiêu không có mục Phân tổ
    d = _theo_ma(day_du)['LUAT-TK:0103']
    assert d['coQuanChuTriThuThap'].startswith('Bộ Kế hoạch và Đầu tư'), d['coQuanChuTriThuThap']
    dong = d['coQuanPhoiHopThuThap'].split('\n')
    i = [k for k, s in enumerate(dong) if 'Bộ Công an' in s]
    j = [k for k, s in enumerate(dong) if 'Bộ Tư pháp' in s]
    assert i and j and i[0] != j[0], dong
    cuoi = _theo_ma(day_du)['LUAT-TK:2111']
    assert 'Phụ lục' not in cuoi['coQuanChuTriThuThap'] and not cuoi['coQuanChuTriThuThap'].endswith('/.')


@ca('TW: hai lần chạy ra cùng khóa; ghi rồi đọc lại giữ nguyên năm trường nhiều dòng')
def _():
    a = van_ban_tw.chuyen('TT13-BNV', NGUON)[1]
    assert [d['maTrongBo'] for d in a] == [d['maTrongBo'] for d in _tw('TT13-BNV')[1]]
    bo, day_du, _ = _tw('LUAT-TK')
    _, c = _ghi_doc_lai(bo, day_du)
    assert _theo_ma(c)['LUAT-TK:0103']['coQuanPhoiHopThuThap'] == _theo_ma(day_du)['LUAT-TK:0103']['coQuanPhoiHopThuThap']


# ---------- Đề xuất ghép ----------
def _goi_y_js(ten, ds):
    js = ("require('./gas/test/_moiTruong.js').taiThuan();"
          "const a=JSON.parse(process.argv[1]);process.stdout.write(JSON.stringify(BoChiTieu.goiYGhep(a[0],a[1])));")
    out = subprocess.run(['node', '-e', js, json.dumps([ten, ds], ensure_ascii=False)], cwd=GOC,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


@ca('đề xuất ghép: Python cho kết quả giống BoChiTieu.goiYGhep (JS) trên 5 cặp mẫu')
def _():
    ds = [{'maChiTieu': 'A', 'tenChiTieu': 'Dân số trung bình'},
          {'maChiTieu': 'B', 'tenChiTieu': 'Tỷ lệ hồ sơ được số hóa'},
          {'maChiTieu': 'C', 'tenChiTieu': 'Tuổi thọ trung bình tính từ lúc sinh'},
          {'maChiTieu': 'D', 'tenChiTieu': 'Số vụ tai nạn giao thông'},
          {'maChiTieu': 'E', 'tenChiTieu': 'Tỷ trọng kinh tế số trong GRDP'}]
    mau = ['Dân số trung bình năm', 'Tỷ lệ hồ sơ TTHC được số hóa', 'Tuổi thọ trung bình tính từ lúc sinh',
           'Số vụ tai nạn giao thông đường bộ', 'Số vụ cháy, nổ cấp III']
    for ten in mau:
        assert de_xuat_ghep.goi_y(ten, ds) == _goi_y_js(ten, ds), ten
    assert de_xuat_ghep.chuan_hoa_ten('Tỷ lệ hồ sơ được số hóa!') == 'ho so duoc hoa'


@ca('đề xuất ghép: Python = JS trên toàn bộ tên TU-699 so với ba bộ Trung ương')
def _():
    _can_699()
    _, d699 = tu699.chuyen(NGUON_699)
    tw = _tw('LUAT-TK')[2] + _tw('TT13-BNV')[2] + _tw('TT45-BKHCN')[2]
    ds = [{'maChiTieu': d['maTrongBo'], 'tenChiTieu': d['tenNguyenVan']} for d in tw]
    ten = [d['tenNguyenVan'] for d in d699]
    js = ("require('./gas/test/_moiTruong.js').taiThuan();const a=JSON.parse(require('fs').readFileSync(0,'utf8'));"
          "process.stdout.write(JSON.stringify(a.n.map(t=>BoChiTieu.goiYGhep(t,a.ds))));")
    ra = json.loads(subprocess.run(['node', '-e', js], input=json.dumps({'n': ten, 'ds': ds}, ensure_ascii=False),
                                   cwd=GOC, capture_output=True, text=True, check=True).stdout)
    py = [de_xuat_ghep.goi_y(t, ds) for t in ten]
    khac = [t for t, a, b in zip(ten, ra, py) if a != b]
    assert not khac, khac[:3]
    assert sum(bool(x) for x in py) >= 10


@ca('đề xuất ghép: mỗi chỉ tiêu TU-699 có ít nhất một dòng, cột Đồng ý để trống')
def _():
    _can_699()
    _, d699 = tu699.chuyen(NGUON_699)
    tw = _tw('LUAT-TK')[2] + _tw('TT13-BNV')[2] + _tw('TT45-BKHCN')[2]
    bang = de_xuat_ghep.lap_bang(d699, tw)
    assert {r['maTrongBo'] for r in bang} == {d['maTrongBo'] for d in d699}
    assert all(r['dongY'] == '' for r in bang)
    tuoi_tho = [r for r in bang if r['ten'] == 'Tuổi thọ trung bình tính từ lúc sinh']
    assert tuoi_tho and tuoi_tho[0]['goiY'] == 'LUAT-TK:0109' and tuoi_tho[0]['diem'] == 1, tuoi_tho[:1]
    assert all(r['diem'] == '' or 0.6 <= r['diem'] <= 1 for r in bang)


# ---------- Tử số / mẫu số ----------
DINH_NGHIA = os.path.join(GOC, 'data', 'rieng', 'dinh-nghia-tu-mau-TU-699.json')


@ca('tử/mẫu: quy tắc phân loại mặc định')
def _():
    p = de_xuat_tu_mau.phan_loai
    assert p('Tốc độ tăng trưởng GRDP', '%') == ('TOC_DO', None)
    assert p('Tỷ lệ hồ sơ giải quyết đúng hạn', '%') == ('TY_LE', 100)
    assert p('Số bác sĩ/10.000 dân', 'Bác sĩ') == ('TY_LE', 10000)
    assert p('Thu nhập bình quân đầu người', 'VND/người') == ('TY_LE', 1)
    assert p('Xếp hạng Chỉ số năng lực cạnh tranh cấp tỉnh', 'Hạng') == ('XEP_HANG', None)
    assert p('Tổng vốn đầu tư thực hiện trên địa bàn', 'Tỷ đồng') == ('SO_TUYET_DOI', None)


@ca('tử/mẫu: đề xuất đủ 174 dòng; 77 dòng % là tỷ lệ hoặc tốc độ; mọi tỷ lệ có định nghĩa; tốc độ tăng không thành tỷ lệ')
def _():
    _can_699()
    if not os.path.exists(DINH_NGHIA):
        raise _BoQua('thiếu ' + DINH_NGHIA)
    _, d = tu699.chuyen(NGUON_699)
    dx = de_xuat_tu_mau.lap_de_xuat(d, de_xuat_tu_mau.doc_dinh_nghia(DINH_NGHIA))
    assert len(dx) == 174
    m = {r['maTrongBo']: r for r in dx}
    phan_tram = [r for r in dx if r['donViTinh'].startswith('%')]
    assert len(phan_tram) == 77
    assert all(r['loaiGiaTri'] in ('TY_LE', 'TOC_DO') for r in phan_tram)
    thieu = [r['maTrongBo'] for r in dx if r['loaiGiaTri'] == 'TY_LE' and not (r['dinhNghiaTuSo'] and r['dinhNghiaMauSo'])]
    assert not thieu, thieu
    assert m['TU-699:4']['loaiGiaTri'] == 'TOC_DO'
    assert m['TU-699:6.4']['loaiGiaTri'] == 'TOC_DO'  # "Tố độ" (lỗi chính tả trong văn bản)
    assert m['TU-699:56']['loaiGiaTri'] == 'TOC_DO'  # chỉ số giá
    assert m['TU-699:79']['heSoNhan'] == 10000 and m['TU-699:12']['heSoNhan'] == 1
    assert m['TU-699:128']['loaiGiaTri'] == 'XEP_HANG'
    assert all(r['MrNobodySua'] == '' for r in dx)


@ca('tử/mẫu: trộn file duyệt vào tu699; không có file duyệt thì bốn cột rỗng')
def _():
    _can_699()
    _, d = tu699.chuyen(NGUON_699)
    assert all(r['loaiGiaTri'] == '' and r['dinhNghiaTuSo'] == '' and r['heSoNhan'] == '' for r in d)
    dx = [{'maTrongBo': 'TU-699:124', 'tenNguyenVan': 'x', 'donViTinh': '%', 'capDuLieu': '', 'loaiGiaTri': 'TY_LE',
           'dinhNghiaTuSo': 'Số hồ sơ đúng hạn', 'dinhNghiaMauSo': 'Tổng số hồ sơ', 'heSoNhan': 100, 'ghiChuClaude': '',
           'MrNobodySua': 'tuSo=X; heSo=1'},
          {'maTrongBo': 'TU-699:4', 'tenNguyenVan': 'y', 'donViTinh': '%', 'capDuLieu': '', 'loaiGiaTri': 'TOC_DO',
           'dinhNghiaTuSo': '', 'dinhNghiaMauSo': '', 'heSoNhan': '', 'ghiChuClaude': '', 'MrNobodySua': ''}]
    with tempfile.TemporaryDirectory() as t:
        f = os.path.join(t, 'duyet.xlsx')
        de_xuat_tu_mau.ghi(f, dx)
        _, d2 = tu699.chuyen(NGUON_699, tu_mau=f)
    m = _theo_ma(d2)
    assert m['TU-699:124']['dinhNghiaTuSo'] == 'X' and m['TU-699:124']['dinhNghiaMauSo'] == 'Tổng số hồ sơ'
    assert m['TU-699:124']['heSoNhan'] == '1' and m['TU-699:124']['loaiGiaTri'] == 'TY_LE'
    assert m['TU-699:4']['loaiGiaTri'] == 'TOC_DO' and m['TU-699:4']['heSoNhan'] == ''
    assert m['TU-699:1']['loaiGiaTri'] == ''


@ca('soát tử/mẫu 2: đọc cột MrNobodySua — có dấu, "bỏ", dấu ; trong nội dung, đổi loại, hệ số kiểu Việt Nam, báo cáo')
def _():
    goc = {'tenNguyenVan': 'x', 'donViTinh': '%', 'capDuLieu': '', 'ghiChuClaude': ''}
    def dong(ma, sua, **kw):
        r = dict(goc, maTrongBo=ma, loaiGiaTri='TY_LE', dinhNghiaTuSo='Tử cũ', dinhNghiaMauSo='Mẫu cũ', heSoNhan=100, MrNobodySua=sua)
        r.update(kw)
        return r
    bang = [dong('TU-699:1', 'Tử số = X'), dong('TU-699:2', 'bỏ'), dong('TU-699:3', 'tuSo=Số hộ nghèo; cận nghèo'),
            dong('TU-699:4', 'loai = toc_do'), dong('TU-699:5', 'heSo=10.000'), dong('TU-699:6', 'heso=1,5'),
            dong('TU-699:7', 'abc; mauSo=Y'), dong('TU-699:8', '')]
    bc = []
    with tempfile.TemporaryDirectory() as t:
        f = os.path.join(t, 'duyet.xlsx')
        de_xuat_tu_mau.ghi(f, bang)
        m = de_xuat_tu_mau.doc_da_duyet(f, bao_cao=bc)
    assert m['TU-699:1']['dinhNghiaTuSo'] == 'X' and m['TU-699:1']['dinhNghiaMauSo'] == 'Mẫu cũ'
    assert m['TU-699:2'] == {'loaiGiaTri': '', 'dinhNghiaTuSo': '', 'dinhNghiaMauSo': '', 'heSoNhan': ''}
    assert m['TU-699:3']['dinhNghiaTuSo'] == 'Số hộ nghèo; cận nghèo', m['TU-699:3']
    assert m['TU-699:4'] == {'loaiGiaTri': 'TOC_DO', 'dinhNghiaTuSo': '', 'dinhNghiaMauSo': '', 'heSoNhan': ''}, m['TU-699:4']
    assert m['TU-699:5']['heSoNhan'] == '10000' and m['TU-699:6']['heSoNhan'] == '1.5'
    assert m['TU-699:7']['dinhNghiaMauSo'] == 'Y'
    assert m['TU-699:8']['heSoNhan'] == '100' and m['TU-699:8']['dinhNghiaTuSo'] == 'Tử cũ'
    chu = '\n'.join(bc)
    assert 'TU-699:7' in chu and 'abc' in chu, chu   # phần không hiểu được báo lại
    assert 'TU-699:1' in chu                          # phần đã áp dụng cũng được báo


@ca('soát tử/mẫu 2: file duyệt có mã không tồn tại thì báo lỗi, không bỏ qua')
def _():
    _can_699()
    bang = [{'maTrongBo': 'TU-699:999', 'tenNguyenVan': 'x', 'donViTinh': '%', 'capDuLieu': '', 'loaiGiaTri': 'TY_LE',
             'dinhNghiaTuSo': 'a', 'dinhNghiaMauSo': 'b', 'heSoNhan': 100, 'ghiChuClaude': '', 'MrNobodySua': ''}]
    with tempfile.TemporaryDirectory() as t:
        f = os.path.join(t, 'duyet.xlsx')
        de_xuat_tu_mau.ghi(f, bang)
        try:
            tu699.chuyen(NGUON_699, tu_mau=f)
        except ValueError as e:
            assert 'TU-699:999' in str(e)
            return
    raise AssertionError('phải báo mã không tồn tại')


@ca('soát tử/mẫu 3: ghi TU-699 khi CHƯA có file duyệt thì thông báo rõ')
def _():
    _can_699()
    import chay_tat_ca
    with tempfile.TemporaryDirectory() as t:
        tb = chay_tat_ca.ghi_tu699(NGUON_699, os.path.join(t, 'TU-699.xlsx'), os.path.join(t, 'khong-co.xlsx'))
    assert 'CHƯA' in tb and 'tử số' in tb, tb


if __name__ == '__main__':
    for f in DS_CA:
        f()
    loi = 0
    for ten, kq, ct in KET_QUA:
        print('%-7s %s%s' % (kq, ten, (' — ' + ct) if ct else ''))
        loi += kq == 'LỖI'
    print('\n%d ca: %d đạt, %d bỏ qua, %d lỗi' % (len(KET_QUA), sum(k == 'ĐẠT' for _, k, _ in KET_QUA),
                                             sum(k == 'BỎ QUA' for _, k, _ in KET_QUA), loi))
    sys.exit(1 if loi else 0)
