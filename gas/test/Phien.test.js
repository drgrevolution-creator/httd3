const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');
const ND = { maNguoiDung: 'ND-0001', email: 'a@gmail.com', vaiTro: ['QUANTRI'], danhSachDonVi: ['DV03'] };

test('tạo phiên 12 giờ, sao chép vai trò và đơn vị, mã 32 ký tự', () => {
  const { Phien } = taiThuan();
  const p = Phien.tao({ nguoiDung: ND, bayGioIso: '2026-11-15T08:00:00+07:00', thietBi: 'test', ngauNhienHex32: 'a'.repeat(32) });
  assert.equal(p.maPhien, 'a'.repeat(32));
  assert.equal(p.hetHanLuc, '2026-11-15T20:00:00+07:00');
  assert.equal(p.taoLuc, '2026-11-15T08:00:00+07:00');
  assert.deepEqual(p.vaiTro, ['QUANTRI']);
  assert.deepEqual(p.danhSachDonVi, ['DV03']);
  assert.equal(p.trangThaiPhien, 'hoatDong');
  assert.throws(() => Phien.taoMa('abc'), /NGAU_NHIEN/);
});

test('conHan theo thời điểm và trạng thái thu hồi', () => {
  const { Phien } = taiThuan();
  const p = Phien.tao({ nguoiDung: ND, bayGioIso: '2026-11-15T08:00:00+07:00', thietBi: 't', ngauNhienHex32: 'b'.repeat(32) });
  assert.ok(Phien.conHan(p, '2026-11-15T19:59:00+07:00'));
  assert.ok(!Phien.conHan(p, '2026-11-15T20:00:01+07:00'));
  assert.ok(!Phien.conHan(Object.assign({}, p, { trangThaiPhien: 'thuHoi' }), '2026-11-15T09:00:00+07:00'));
  assert.ok(!Phien.conHan(null, '2026-11-15T09:00:00+07:00'));
});

test('gioiHan giữ 5 phiên mới nhất, trả các phiên cần thu hồi', () => {
  const { Phien } = taiThuan();
  const ds = [1, 2, 3, 4, 5, 6].map((i) => ({ maPhien: 'p' + i, taoLuc: '2026-11-1' + i + 'T08:00:00+07:00' }));
  assert.deepEqual(Phien.gioiHan(ds).map((x) => x.maPhien), ['p1']);
  assert.deepEqual(Phien.gioiHan(ds.slice(0, 5)), []);
});

test('kiemTraTheGoogle: đúng aud, sai aud, hết hạn, email chưa xác minh, sai iss', () => {
  const { Phien } = taiThuan();
  const ok = { aud: 'CID', iss: 'https://accounts.google.com', exp: 2000, email: 'a@gmail.com', email_verified: 'true' };
  assert.deepEqual(Phien.kiemTraTheGoogle(ok, { clientId: 'CID', bayGioGiay: 1000 }), { hopLe: true, email: 'a@gmail.com', loi: null });
  assert.equal(Phien.kiemTraTheGoogle({ ...ok, aud: 'X' }, { clientId: 'CID', bayGioGiay: 1000 }).loi, 'SAI_AUD');
  assert.equal(Phien.kiemTraTheGoogle({ ...ok, exp: 999 }, { clientId: 'CID', bayGioGiay: 1000 }).loi, 'HET_HAN');
  assert.equal(Phien.kiemTraTheGoogle({ ...ok, email_verified: 'false' }, { clientId: 'CID', bayGioGiay: 1000 }).loi, 'EMAIL_CHUA_XAC_MINH');
  assert.equal(Phien.kiemTraTheGoogle({ ...ok, iss: 'evil.com' }, { clientId: 'CID', bayGioGiay: 1000 }).loi, 'SAI_ISS');
  assert.equal(Phien.kiemTraTheGoogle({ ...ok, email_verified: true, exp: '2000' }, { clientId: 'CID', bayGioGiay: 1000 }).hopLe, true);
});
