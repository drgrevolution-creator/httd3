const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('tenFile theo mẫu SaoLuu_<tên>_YYYY-MM-DD', () => {
  const { SaoLuu } = taiThuan();
  assert.equal(SaoLuu.tenFile('HTTD3_DuLieu', '2026-11-15'), 'SaoLuu_HTTD3_DuLieu_2026-11-15');
  assert.equal(SaoLuu.tenFile('HTTD3_DuLieu', '2026-11-15T01:00:00+07:00'), 'SaoLuu_HTTD3_DuLieu_2026-11-15');
});

test('canXoa giữ 30 ngày gần nhất và bản ngày 01 trong 24 tháng', () => {
  const { SaoLuu } = taiThuan();
  const fs = [
    { ten: 'SaoLuu_HTTD3_DuLieu_2026-10-01' }, { ten: 'SaoLuu_HTTD3_DuLieu_2026-10-02' }, { ten: 'SaoLuu_HTTD3_DuLieu_2026-11-14' },
    { ten: 'SaoLuu_HTTD3_DuLieu_2024-10-01' }, { ten: 'SaoLuu_HTTD3_DuLieu_2025-01-01' }, { ten: 'khong-phai-sao-luu.txt' }
  ];
  assert.deepEqual(SaoLuu.canXoa(fs, '2026-11-15').map((f) => f.ten), ['SaoLuu_HTTD3_DuLieu_2026-10-02', 'SaoLuu_HTTD3_DuLieu_2024-10-01']);
  assert.deepEqual(SaoLuu.canXoa(fs, '2026-11-15', { giuNgay: 60, giuThang: 24 }).map((f) => f.ten), ['SaoLuu_HTTD3_DuLieu_2024-10-01']);
});
