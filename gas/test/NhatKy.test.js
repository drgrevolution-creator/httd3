const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');
const PHIEN = { email: 'q@x.com', maNguoiDung: 'ND-0001', vaiTro: ['QUANTRI'] };

test('dòng nhật ký đúng cột, chỉ ghi khóa thay đổi, không rò mật khẩu', () => {
  const { NhatKy, SoDo } = taiThuan();
  const d = NhatKy.dong({ phien: PHIEN, hanhDong: 'SUA', bang: 'DM_NguoiDung', ma: 'ND-0002', truoc: { hoTen: 'A', email: 'a@x.com', matKhauBam: '1', muoi: 'm1' }, sau: { hoTen: 'B', email: 'a@x.com', matKhauBam: '2', muoi: 'm2' }, canCu: 'CV 12', bayGioIso: '2026-11-15T08:00:00+07:00' });
  const cot = SoDo.BANG.NhatKy.cot.map((c) => c.khoa);
  for (const k of Object.keys(d)) assert.ok(cot.includes(k), 'cột lạ ' + k);
  assert.equal(d.hanhDong, 'SUA');
  assert.equal(d.thoiGian, '2026-11-15T08:00:00+07:00');
  assert.equal(d.email, 'q@x.com');
  assert.deepEqual(JSON.parse(d.vaiTro), ['QUANTRI']);
  assert.deepEqual(JSON.parse(d.truocKhiSua), { hoTen: 'A' });
  assert.deepEqual(JSON.parse(d.sauKhiSua), { hoTen: 'B' });
  assert.ok(!d.truocKhiSua.includes('matKhauBam') && !d.sauKhiSua.includes('muoi'));
  assert.equal(d.canCu, 'CV 12');
});

test('dòng THEM không có truoc; dòng hệ thống không có phiên', () => {
  const { NhatKy } = taiThuan();
  const d = NhatKy.dong({ phien: PHIEN, hanhDong: 'THEM', bang: 'DM_LinhVuc', ma: 'ATTT', sau: { maLinhVuc: 'ATTT', tenLinhVuc: 'An toàn thông tin' }, bayGioIso: '2026-11-15T08:00:00+07:00' });
  assert.equal(d.truocKhiSua, '');
  assert.deepEqual(JSON.parse(d.sauKhiSua), { maLinhVuc: 'ATTT', tenLinhVuc: 'An toàn thông tin' });
  const h = NhatKy.dong({ hanhDong: 'SAO_LUU', bang: 'SaoLuu', ma: 'x', canCu: 'lịch 01:00', bayGioIso: '2026-11-15T01:00:00+07:00' });
  assert.equal(h.email, 'he-thong');
});

test('khacBiet bỏ qua khóa không đổi và so sánh mảng theo nội dung', () => {
  const { NhatKy } = taiThuan();
  assert.deepEqual(NhatKy.khacBiet({ a: 1, b: [1, 2], c: 'x' }, { a: 1, b: [1, 2], c: 'y', d: 5 }), { truoc: { c: 'x' }, sau: { c: 'y', d: 5 } });
});
