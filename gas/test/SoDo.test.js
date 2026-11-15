const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('đủ ba file và mọi bảng thuộc đúng file', () => {
  const { SoDo } = taiThuan();
  assert.deepEqual(SoDo.FILE, ['HTTD3_DanhMuc', 'HTTD3_DuLieu', 'HTTD3_NhatKy']);
  for (const b of Object.values(SoDo.BANG)) assert.ok(SoDo.FILE.includes(b.file));
});

test('13 danh mục Thành phố có đúng cột đầu tiên theo Phụ lục A', () => {
  const { SoDo } = taiThuan();
  assert.equal(SoDo.BANG.DM_MucTieu.cot[0].khoa, 'maMucTieu');
  assert.equal(SoDo.BANG.DM_MucTieu.cot.filter((c) => !c.heThong).length, 14);
  assert.equal(SoDo.BANG.DM_ChiSo.cot[0].khoa, 'maChiSo');
  assert.equal(SoDo.BANG.DM_MoHinh.cot.filter((c) => !c.heThong).length, 18);
});

test('mọi bảng có khóa chính và cột hệ thống', () => {
  const { SoDo } = taiThuan();
  for (const t of SoDo.danhSachBang()) {
    assert.equal(typeof SoDo.khoaChinh(t), 'string', t + ' thiếu khóa chính');
    const ks = SoDo.BANG[t].cot.map((c) => c.khoa);
    for (const k of ['taoLuc', 'taoBoi', 'capNhatLuc', 'capNhatBoi', 'tinhTrang']) assert.ok(ks.includes(k), t + ' thiếu ' + k);
  }
});

test('danh mục có maThanhPho, bảng nghiệp vụ không có', () => {
  const { SoDo } = taiThuan();
  assert.ok(SoDo.BANG.DM_DonVi.cot.some((c) => c.khoa === 'maThanhPho'));
  assert.ok(!SoDo.BANG.NhiemVu.cot.some((c) => c.khoa === 'maThanhPho'));
});

test('kiểu cột hợp lệ và cột ẩn của người dùng', () => {
  const { SoDo } = taiThuan();
  for (const b of Object.values(SoDo.BANG)) for (const c of b.cot) assert.ok(SoDo.KIEU.includes(c.kieu), c.khoa + ' kiểu ' + c.kieu);
  assert.ok(SoDo.BANG.DM_NguoiDung.cot.find((c) => c.khoa === 'matKhauBam').an);
});

test('NhiemVu có đủ cột 4 nhóm của thiết kế 7.3', () => {
  const { SoDo } = taiThuan();
  const ks = SoDo.BANG.NhiemVu.cot.map((c) => c.khoa);
  for (const k of ['maNhiemVu', 'tenNhiemVu', 'nguon', 'loaiSanPham', 'maCDS', 'trangThaiXacNhan', 'lienKetNhiemVu', 'minhChung', 'maChiSo']) assert.ok(ks.includes(k), k);
});

test('mỗi bảng có tên hiển thị, khóa cột không trùng, ref trỏ tới bảng có thật', () => {
  const { SoDo } = taiThuan();
  for (const [t, b] of Object.entries(SoDo.BANG)) {
    assert.ok(b.ten && b.ten.length > 2, t + ' thiếu ten');
    const ks = b.cot.map((c) => c.khoa);
    assert.equal(new Set(ks).size, ks.length, t + ' trùng khóa cột');
    for (const c of b.cot) if (c.thamChieu) assert.ok(SoDo.BANG[c.thamChieu], t + '.' + c.khoa + ' tham chiếu ' + c.thamChieu);
  }
  assert.ok(SoDo.BANG.BoDem && SoDo.BANG.NhatKy && SoDo.BANG.PhienDangNhap);
});
