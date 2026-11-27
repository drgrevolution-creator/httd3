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

test('1b: ChiTieu_TrongBo có khóa maTrongBo, đủ sáu cột năm trường, tham chiếu đúng', () => {
  const { SoDo } = taiThuan();
  const b = SoDo.BANG.ChiTieu_TrongBo;
  assert.ok(b && b.file === 'HTTD3_DuLieu' && b.nhom === 'nghiepvu' && b.dinhDangMa === 'TU_NHAP');
  assert.equal(SoDo.khoaChinh('ChiTieu_TrongBo'), 'maTrongBo');
  for (const k of ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieu', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap']) assert.ok(SoDo.cot('ChiTieu_TrongBo', k), 'thiếu ' + k);
  assert.equal(SoDo.cot('ChiTieu_TrongBo', 'maBo').thamChieu, 'DM_BoChiTieu');
  assert.equal(SoDo.cot('ChiTieu_TrongBo', 'maChiTieu').thamChieu, 'DM_ChiTieu');
  assert.equal(SoDo.cot('ChiTieu_TrongBo', 'chaTrongBo').thamChieu, 'ChiTieu_TrongBo');
  assert.equal(SoDo.cot('ChiTieu_TrongBo', 'mucTieu').kieu, 'json');
  assert.deepEqual([...SoDo.cot('ChiTieu_TrongBo', 'thuocTinhTongHop').tuyChon], ['Tỷ lệ', 'Lũy kế từ đầu năm', 'Thời điểm', 'Phát sinh trong kỳ']);
  assert.deepEqual([...SoDo.cot('ChiTieu_TrongBo', 'capDuLieu').tuyChon], ['Trung ương', 'Thành phố', 'Xã', 'Thành phố/Xã']);
  assert.equal(SoDo.BANG.ChiTieu_NguonQuyDinh, undefined);
});

test('1b: DM_BoChiTieu bốn loại hệ thống; DM_ChiTieu có cột mới trước cột hệ thống', () => {
  const { SoDo } = taiThuan();
  assert.equal(SoDo.khoaChinh('DM_BoChiTieu'), 'maBo');
  assert.equal(SoDo.BANG.DM_BoChiTieu.nhom, 'danhmuc');
  assert.deepEqual([...SoDo.cot('DM_BoChiTieu', 'loaiHeThong').tuyChon], ['Quốc gia', 'Bộ, ngành', 'Địa phương', 'Theo dõi, đánh giá']);
  const ks = SoDo.BANG.DM_ChiTieu.cot.map((c) => c.khoa);
  for (const k of ['chaChiTieu', 'linhVucLon', 'thuocTinhTongHop', 'capDuLieu', 'kyBaoCaoXa', 'khaiNiemPhuongPhapTinh', 'coQuanPhoiHopThuThap']) assert.ok(ks.includes(k), 'thiếu ' + k);
  assert.ok(ks.indexOf('coQuanPhoiHopThuThap') < ks.indexOf('maThanhPho'), 'cột mới phải đứng trước cột hệ thống');
  assert.ok(SoDo.cot('DM_ChiTieu', 'linhVucLon').tuyChon.includes('Thông tin chung'));
});

test('tử/mẫu: DM_LoaiGiaTri đúng 5 cột; bốn cột mới ở ChiTieu_TrongBo và DM_ChiTieu là bốn cột cuối trước cột hệ thống', () => {
  const { SoDo } = taiThuan();
  const b = SoDo.BANG.DM_LoaiGiaTri;
  assert.ok(b, 'thiếu DM_LoaiGiaTri');
  assert.equal(b.nhom, 'danhmuc'); assert.equal(b.file, 'HTTD3_DanhMuc'); assert.equal(b.tienToMa, 'LGT'); assert.equal(b.dinhDangMa, 'TU_NHAP');
  assert.deepEqual(b.cot.filter((c) => !c.heThong).map((c) => c.khoa), ['maLoaiGiaTri', 'tenLoaiGiaTri', 'coTuSoMauSo', 'heSoNhanMacDinh', 'ghiChu']);
  assert.equal(SoDo.cot('DM_LoaiGiaTri', 'coTuSoMauSo').kieu, 'boolean'); assert.equal(SoDo.cot('DM_LoaiGiaTri', 'heSoNhanMacDinh').kieu, 'number');
  const MOI = ['loaiGiaTri', 'dinhNghiaTuSo', 'dinhNghiaMauSo', 'heSoNhan'];
  for (const t of ['ChiTieu_TrongBo', 'DM_ChiTieu']) {
    const nd = SoDo.BANG[t].cot.filter((c) => !c.heThong).map((c) => c.khoa);
    assert.deepEqual(nd.slice(-4), MOI, t);
    assert.equal(SoDo.cot(t, 'loaiGiaTri').thamChieu, 'DM_LoaiGiaTri');
    assert.equal(SoDo.cot(t, 'heSoNhan').kieu, 'number');
    assert.equal(SoDo.cot(t, 'dinhNghiaTuSo').kieu, 'textarea');
    assert.equal(SoDo.cot(t, 'dinhNghiaTuSo').ten, 'Tử số là gì');
  }
});
