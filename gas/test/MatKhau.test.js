const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { taiThuan } = require('./_moiTruong');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

test('bam ổn định, 64 ký tự hex, khop đúng/sai', () => {
  const { MatKhau } = taiThuan();
  const b = MatKhau.bam('Abc12345', '00ff', sha);
  assert.equal(b.length, 64);
  assert.equal(b, MatKhau.bam('Abc12345', '00ff', sha));
  assert.notEqual(b, MatKhau.bam('Abc12345', '00fe', sha));
  assert.ok(MatKhau.khop('Abc12345', '00ff', b, sha));
  assert.ok(!MatKhau.khop('Abc12346', '00ff', b, sha));
});

test('bam lặp 5000 lần (khác băm một lần)', () => {
  const { MatKhau } = taiThuan();
  assert.notEqual(MatKhau.bam('Abc12345', '00ff', sha), sha('Abc12345' + '00ff'));
  assert.equal(MatKhau.SO_LAN_LAP, 5000);
});

test('khóa 15 phút sau 5 lần sai, chưa khóa khi 4 lần', () => {
  const { MatKhau } = taiThuan();
  assert.equal(MatKhau.tinhKhoa(4, '2026-11-15T08:00:00+07:00').khoaDen, null);
  assert.equal(MatKhau.tinhKhoa(5, '2026-11-15T08:00:00+07:00').khoaDen, '2026-11-15T08:15:00+07:00');
  assert.equal(MatKhau.tinhKhoa(7, '2026-11-15T23:50:00+07:00').khoaDen, '2026-11-16T00:05:00+07:00');
});

test('datYeuCau: tối thiểu 8 ký tự, có chữ và số', () => {
  const { MatKhau } = taiThuan();
  assert.equal(MatKhau.datYeuCau('Abc12345').hopLe, true);
  assert.equal(MatKhau.datYeuCau('abc').hopLe, false);
  assert.equal(MatKhau.datYeuCau('abcdefgh').hopLe, false);
  assert.equal(MatKhau.datYeuCau('12345678').hopLe, false);
});
