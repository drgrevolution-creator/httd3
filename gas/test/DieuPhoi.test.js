const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');
const GIO = '2026-11-15T08:00:00+07:00';
const PHIEN_OK = (vaiTro, email) => ({ hetHanLuc: '2026-11-15T20:00:00+07:00', trangThaiPhien: 'hoatDong', vaiTro, email: email || 'u@x.com' });

test('PhanQuyen: *, @ và vai trò cụ thể', () => {
  const { PhanQuyen } = taiThuan();
  assert.ok(PhanQuyen.duocPhep([], 'heThong.sucKhoe'));
  assert.ok(PhanQuyen.duocPhep(['DONVI'], 'danhMuc.doc'));
  assert.ok(!PhanQuyen.duocPhep(['DONVI'], 'danhMuc.them'));
  assert.ok(PhanQuyen.duocPhep(['DONVI', 'QUANTRI'], 'danhMuc.them'));
  assert.ok(PhanQuyen.duocPhep(['KIEMDUYET'], 'nhatKy.doc'));
  assert.ok(!PhanQuyen.duocPhep(['CHUYENVIEN'], 'nguoiDung.doc'));
  assert.equal(PhanQuyen.canPhien('heThong.sucKhoe'), false);
  assert.equal(PhanQuyen.canPhien('danhMuc.doc'), true);
});

test('action không tồn tại', () => {
  const { DieuPhoi } = taiThuan();
  const r = DieuPhoi.xuLy({ action: 'x.y' }, { handlers: {}, layPhien: () => null, bayGioIso: GIO });
  assert.equal(r.ok, false);
  assert.equal(r.loi.ma, 'ACTION_KHONG_TON_TAI');
});

test('thiếu phiên hoặc hết hạn', () => {
  const { DieuPhoi } = taiThuan();
  const nc = { handlers: { 'danhMuc.doc': () => [] }, layPhien: (m) => (m === 'het' ? { hetHanLuc: '2026-11-15T07:00:00+07:00', trangThaiPhien: 'hoatDong', vaiTro: ['QUANTRI'] } : null), bayGioIso: GIO };
  assert.equal(DieuPhoi.xuLy({ action: 'danhMuc.doc' }, nc).loi.ma, 'PHIEN_HET_HAN');
  assert.equal(DieuPhoi.xuLy({ action: 'danhMuc.doc', phien: 'het' }, nc).loi.ma, 'PHIEN_HET_HAN');
  assert.equal(DieuPhoi.xuLy({ action: 'danhMuc.doc', phien: 'khong-co' }, nc).loi.ma, 'PHIEN_HET_HAN');
});

test('không có quyền và có quyền; handler nhận (duLieu, phien)', () => {
  const { DieuPhoi } = taiThuan();
  const nc = { handlers: { 'danhMuc.them': (d, p) => ({ da: true, boi: p.email, bang: d.bang }) }, layPhien: () => PHIEN_OK(['DONVI']), bayGioIso: GIO };
  assert.equal(DieuPhoi.xuLy({ action: 'danhMuc.them', phien: 'p', duLieu: { bang: 'DM_LinhVuc' } }, nc).loi.ma, 'KHONG_CO_QUYEN');
  nc.layPhien = () => PHIEN_OK(['QUANTRI'], 'q@x.com');
  assert.deepEqual(DieuPhoi.xuLy({ action: 'danhMuc.them', phien: 'p', duLieu: { bang: 'DM_LinhVuc' } }, nc), { ok: true, duLieu: { da: true, boi: 'q@x.com', bang: 'DM_LinhVuc' } });
});

test('action * chạy không cần phiên; lỗi handler được bao gói', () => {
  const { DieuPhoi } = taiThuan();
  const nc = { handlers: { 'heThong.sucKhoe': () => { const e = new Error('x'); e.ma = 'KHONG_TIM_THAY'; throw e; }, 'xacThuc.dangNhapMatKhau': () => { throw new TypeError('bug'); } }, layPhien: () => null, bayGioIso: GIO };
  assert.equal(DieuPhoi.xuLy({ action: 'heThong.sucKhoe' }, nc).loi.ma, 'KHONG_TIM_THAY');
  const r = DieuPhoi.xuLy({ action: 'xacThuc.dangNhapMatKhau', duLieu: {} }, nc);
  assert.equal(r.loi.ma, 'LOI_HE_THONG');
  assert.ok(!/bug/.test(r.loi.thongBao) || r.loi.thongBao.length < 200);
});

test('yêu cầu thiếu action hoặc không phải đối tượng', () => {
  const { DieuPhoi } = taiThuan();
  const nc = { handlers: {}, layPhien: () => null, bayGioIso: GIO };
  assert.equal(DieuPhoi.xuLy(null, nc).loi.ma, 'DU_LIEU_KHONG_HOP_LE');
  assert.equal(DieuPhoi.xuLy({}, nc).loi.ma, 'DU_LIEU_KHONG_HOP_LE');
});
