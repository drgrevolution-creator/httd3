const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('tuMaTran giữ chuỗi "0123" và xuống dòng, bỏ dòng tiêu đề 2', () => {
  const { Bang } = taiThuan();
  const [k, t] = Bang.dongTieuDe('DM_LinhVuc');
  const dong = k.map((x) => (x === 'maLinhVuc' ? '0123' : x === 'tenLinhVuc' ? 'Dòng 1\nDòng 2' : x === 'tinhTrang' ? 'Hoạt động' : ''));
  const r = Bang.tuMaTran('DM_LinhVuc', [k, t, dong]);
  assert.equal(r.banGhi.length, 1);
  assert.equal(r.banGhi[0].maLinhVuc, '0123');
  assert.equal(r.banGhi[0].tenLinhVuc, 'Dòng 1\nDòng 2');
  assert.deepEqual(r.loi, []);
});

test('tuMaTran parse multiselect/json và số, bỏ dòng trống', () => {
  const { Bang } = taiThuan();
  const [k, t] = Bang.dongTieuDe('DM_NguoiDung');
  const dong = k.map((x) => (x === 'maNguoiDung' ? 'ND-0001' : x === 'vaiTro' ? '["QUANTRI","CHUYENVIEN"]' : x === 'soLanSai' ? 3 : x === 'batBuocDoiMatKhau' ? 'TRUE' : ''));
  const trong = k.map(() => '');
  const r = Bang.tuMaTran('DM_NguoiDung', [k, t, dong, trong]);
  assert.equal(r.banGhi.length, 1);
  assert.deepEqual(r.banGhi[0].vaiTro, ['QUANTRI', 'CHUYENVIEN']);
  assert.equal(r.banGhi[0].soLanSai, 3);
  assert.equal(r.banGhi[0].batBuocDoiMatKhau, true);
});

test('thanhDong xếp đúng thứ tự cột và JSON hóa multiselect', () => {
  const { Bang } = taiThuan();
  const d = Bang.thanhDong('DM_NguoiDung', { maNguoiDung: 'ND-0001', vaiTro: ['QUANTRI', 'CHUYENVIEN'] });
  const [k] = Bang.dongTieuDe('DM_NguoiDung');
  assert.equal(d[k.indexOf('vaiTro')], '["QUANTRI","CHUYENVIEN"]');
  assert.equal(d[k.indexOf('maNguoiDung')], 'ND-0001');
  assert.equal(d.length, k.length);
});

test('kiemTra báo thiếu bắt buộc, sai email, sai tuỳ chọn, sai tham chiếu', () => {
  const { Bang } = taiThuan();
  const r = Bang.kiemTra('DM_NguoiDung', { maNguoiDung: 'ND-0002', email: 'sai', vaiTro: ['KHAC'], danhSachDonVi: ['DV99'], tinhTrang: 'Hoạt động' }, { thamChieu: { DM_DonVi: ['DV01'] } });
  assert.equal(r.hopLe, false);
  const ks = r.loi.map((l) => l.khoa);
  for (const k of ['tenDangNhap', 'hoTen', 'email', 'vaiTro', 'danhSachDonVi']) assert.ok(ks.includes(k), 'thiếu lỗi ' + k + ' trong ' + JSON.stringify(ks));
});

test('kiemTra chấp nhận bản ghi đúng, kể cả date và số', () => {
  const { Bang } = taiThuan();
  const r = Bang.kiemTra('DM_KyBaoCao', { maKy: 'Q3-2026', tenKy: 'Quý III/2026', loaiKy: 'Quý', nam: 2026, tuNgay: '2026-07-01', denNgay: '2026-09-30', hanChot: '2026-09-20', apDungCho: 'Cả hai', tinhTrang: 'Hoạt động' }, {});
  assert.deepEqual(r, { hopLe: true, loi: [] });
  const sai = Bang.kiemTra('DM_KyBaoCao', { maKy: 'Q3-2026', tenKy: 'x', loaiKy: 'Quý', tuNgay: '01/07/2026', nam: 'abc' }, {});
  assert.ok(sai.loi.some((l) => l.khoa === 'tuNgay'));
  assert.ok(sai.loi.some((l) => l.khoa === 'nam'));
});

test('anCotNhayCam bỏ matKhauBam và muoi', () => {
  const { Bang } = taiThuan();
  const r = Bang.anCotNhayCam('DM_NguoiDung', { maNguoiDung: 'x', matKhauBam: 'a', muoi: 'b', phienBanBam: 2 });
  assert.deepEqual(Object.keys(r), ['maNguoiDung']);
});
