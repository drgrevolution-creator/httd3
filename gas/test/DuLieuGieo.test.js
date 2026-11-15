const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('mọi bản ghi gieo hợp lệ theo sơ đồ và tham chiếu nội bộ', () => {
  const { DuLieuGieo, Bang, SoDo } = taiThuan();
  const thamChieu = {};
  for (const [b, ds] of Object.entries(DuLieuGieo.BANG)) thamChieu[b] = ds.map((r) => r[SoDo.khoaChinh(b)]);
  for (const [b, ds] of Object.entries(DuLieuGieo.BANG)) for (const r of ds) {
    const k = Bang.kiemTra(b, Object.assign({ tinhTrang: 'Hoạt động' }, r), { thamChieu });
    assert.ok(k.hopLe, b + ' ' + r[SoDo.khoaChinh(b)] + ': ' + JSON.stringify(k.loi));
  }
});

test('36 đầu mối, 11 lĩnh vực, 4 chương trình, 6 kỳ, cấu hình đủ khóa', () => {
  const { DuLieuGieo } = taiThuan();
  assert.equal(DuLieuGieo.BANG.DM_DonVi.length, 36);
  assert.equal(DuLieuGieo.BANG.DM_DonVi.filter((d) => d.nhom === 'DV').length, 9);
  assert.equal(DuLieuGieo.BANG.DM_DonVi.filter((d) => d.nhom === 'TH').length, 16);
  assert.equal(DuLieuGieo.BANG.DM_DonVi.filter((d) => d.nhom === 'AP').length, 11);
  assert.equal(DuLieuGieo.BANG.DM_DonVi.find((d) => d.maDonVi === 'DV04').tenVietTat, 'TTPVHCC');
  assert.equal(DuLieuGieo.BANG.DM_DonVi.find((d) => d.maDonVi === 'DV08').tenVietTat, 'CAX');
  assert.equal(DuLieuGieo.BANG.DM_LinhVuc.length, 11);
  assert.ok(['CDS', 'CCHC', 'KHCN', 'TTTT', 'DMST', 'SHTT', 'TDC', 'HTTT', 'KTS', 'XHS', 'KHAC'].every((m) => DuLieuGieo.BANG.DM_LinhVuc.some((l) => l.maLinhVuc === m)));
  assert.equal(DuLieuGieo.BANG.DM_ChuongTrinh.length, 4);
  assert.equal(DuLieuGieo.BANG.DM_ChuongTrinh.find((c) => c.maChuongTrinh === 'KH09').soKyHieu, '09/KH-UBND');
  assert.equal(DuLieuGieo.BANG.DM_KyBaoCao.length, 6);
  assert.equal(DuLieuGieo.BANG.DM_KyBaoCao.find((k) => k.tenKy === 'Quý III/2026').hanChot, '2026-09-20');
  const ch = Object.fromEntries(DuLieuGieo.BANG.CauHinh.map((c) => [c.khoa, c.giaTri]));
  for (const k of ['tenCoQuan', 'diaDanh', 'soNgayNhacHan', 'chiTinhSoLieuDaDuyet', 'noiNhanBaoCao', 'mauTinNhac', 'mauTinNhacQuaHan', 'ngayDauTuan', 'emailQuanTri']) assert.ok(k in ch, 'thiếu cấu hình ' + k);
  assert.equal(ch.soNgayNhacHan, '7');
});

test('trạng thái và mức độ theo thiết kế 7.4', () => {
  const { DuLieuGieo } = taiThuan();
  const tt = DuLieuGieo.BANG.DM_TrangThai.map((t) => t.maTrangThai);
  for (const m of ['CHO_XAC_NHAN', 'CHUA_TRIEN_KHAI', 'DANG_THUC_HIEN', 'CHO_DAU_VAO', 'CHO_KY', 'HOAN_THANH', 'QUA_HAN', 'TAM_DUNG', 'HUY', 'CHO_DUYET', 'DA_DUYET', 'TRA_LAI', 'CHUA_GUI', 'DA_GUI', 'DA_NHAN', 'NHAN_CHUA_DAT']) assert.ok(tt.includes(m), m);
  assert.equal(DuLieuGieo.BANG.DM_TrangThai.find((t) => t.maTrangThai === 'HOAN_THANH').mucDoHoanThanh, 100);
  assert.ok(DuLieuGieo.BANG.DM_MucDo.some((m) => m.mauSacHienThi === 'Đỏ' && m.doiTuongApDung === 'Nhiệm vụ'));
  assert.ok(DuLieuGieo.BANG.DM_DonViDo.some((d) => d.kyHieu === '%'));
});

test('DM_CauTruc sinh đủ cột của mọi danh mục', () => {
  const { DuLieuGieo, SoDo } = taiThuan();
  const ct = DuLieuGieo.cauTruc();
  const tong = SoDo.danhSachBang('danhmuc').reduce((s, t) => s + SoDo.BANG[t].cot.length, 0);
  assert.equal(ct.length, tong);
  assert.ok(ct.every((r) => r.maCauTruc && r.bang && r.khoa && r.kieu));
});
