const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('NAM-4 tăng dần trong năm và reset về 1 khi sang năm mới', () => {
  const { MaSo } = taiThuan();
  assert.deepEqual(MaSo.sinh('NhiemVu', { soHienTai: 12, nam: 2026, namHienTai: 2026 }), { ma: 'NV-2026-0013', soMoi: 13, nam: 2026 });
  assert.deepEqual(MaSo.sinh('NhiemVu', { soHienTai: 12, nam: 2025, namHienTai: 2026 }), { ma: 'NV-2026-0001', soMoi: 1, nam: 2026 });
});

test('SO-6 giữ định dạng HTTD cho báo cáo, SO-4 cho danh mục', () => {
  const { MaSo } = taiThuan();
  assert.equal(MaSo.sinh('BaoCaoNhiemVu', { soHienTai: 2 }).ma, 'BC-000003');
  assert.equal(MaSo.sinh('DM_MucTieu', { soHienTai: 0 }).ma, 'MT-0001');
});

test('TU_NHAP không sinh, nhưng kiểm tra hợp lệ', () => {
  const { MaSo } = taiThuan();
  assert.throws(() => MaSo.sinh('DM_DonVi', { soHienTai: 0 }), /MA_TU_NHAP/);
  assert.ok(MaSo.hopLe('DM_DonVi', 'DV01'));
  assert.ok(MaSo.hopLe('DM_ChiTieu', 'CPS-01'));
  assert.ok(!MaSo.hopLe('DM_DonVi', 'DV 01'));
  assert.ok(!MaSo.hopLe('DM_DonVi', 'D'));
});

test('hopLe kiểm tra đúng định dạng sinh tự động', () => {
  const { MaSo } = taiThuan();
  assert.ok(MaSo.hopLe('NhiemVu', 'NV-2026-0013'));
  assert.ok(!MaSo.hopLe('NhiemVu', 'NV-13'));
  assert.ok(MaSo.hopLe('BaoCaoNhiemVu', 'BC-000003'));
  assert.ok(!MaSo.hopLe('BaoCaoNhiemVu', 'BC-3'));
});
