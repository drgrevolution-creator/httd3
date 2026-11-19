const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');
const d = (o) => Object.assign({ maBo: 'TU-699', tenNguyenVan: 'Chỉ tiêu' }, o);

test('khoa ghép mã bộ và mã gốc', () => {
  const { BoChiTieu } = taiThuan();
  assert.equal(BoChiTieu.khoa('TT13-BNV', '0101'), 'TT13-BNV:0101');
  assert.equal(BoChiTieu.khoa('TU-699', 6), 'TU-699:6');
});

test('chuanHoaDong giữ mã gốc dạng chuỗi, đọc số kiểu Việt Nam trong mục tiêu', () => {
  const { BoChiTieu } = taiThuan();
  assert.equal(BoChiTieu.chuanHoaDong({ maGoc: '0101' }).maGoc, '0101');
  assert.equal(BoChiTieu.chuanHoaDong({ maGoc: 101 }).maGoc, '101');
  assert.equal(BoChiTieu.chuanHoaDong({ tenNguyenVan: '  Diện tích \n' }).tenNguyenVan, 'Diện tích');
  const r = BoChiTieu.chuanHoaDong({ mucTieu: '[{"giaiDoan":"2026","nguyenVan":">=1.924.469"},{"giaiDoan":"2026-2030","nguyenVan":">0,8"},{"giaiDoan":"2026","nguyenVan":"<=5"}]' });
  assert.equal(r.mucTieu[0].so, 1924469); assert.equal(r.mucTieu[0].phep, '>='); assert.equal(r.mucTieu[0].nguyenVan, '>=1.924.469');
  assert.equal(r.mucTieu[1].so, 0.8); assert.equal(r.mucTieu[1].phep, '>');
  assert.equal(r.mucTieu[2].so, 5); assert.equal(r.mucTieu[2].phep, '<=');
  assert.deepEqual(BoChiTieu.chuanHoaDong({ mucTieu: '' }).mucTieu, []);
  assert.equal(BoChiTieu.chuanHoaDong({ mucTieu: [{ giaiDoan: '2026', nguyenVan: '100' }] }).mucTieu[0].so, 100);
});

test('kiemTraLo báo bốn loại lỗi và chỉ đúng số dòng', () => {
  const { BoChiTieu } = taiThuan();
  const r = BoChiTieu.kiemTraLo('TU-699', [
    d({ maTrongBo: 'TU-699:1' }),
    d({ maTrongBo: 'TU-699:1' }),                              // trùng
    d({ maTrongBo: 'TU-699:3', tenNguyenVan: '' }),            // thiếu tên
    d({ maTrongBo: 'TT13-BNV:0101' }),                         // sai tiền tố bộ
    d({ maTrongBo: 'TU-699:5', chaTrongBo: 'TU-699:99' }),     // cha không có
    d({ maTrongBo: 'TU-699:6', capDuLieu: 'Huyện' })           // ngoài tùy chọn
  ]);
  assert.equal(r.hopLe, false);
  const theoDong = r.loi.map((l) => l.dong + ':' + l.khoa).sort();
  assert.deepEqual(theoDong, ['2:maTrongBo', '3:tenNguyenVan', '4:maTrongBo', '5:chaTrongBo', '6:capDuLieu'].sort());
  assert.equal(BoChiTieu.kiemTraLo('TU-699', [d({ maTrongBo: 'TU-699:5', chaTrongBo: 'TU-699:1' })], { daCo: ['TU-699:1'] }).hopLe, true);
});

test('dungCay đặt con dưới cha, giữ thứ tự văn bản, nhóm theo nhomMa', () => {
  const { BoChiTieu } = taiThuan();
  const cay = BoChiTieu.dungCay([
    d({ maTrongBo: 'TU-699:6.1', chaTrongBo: 'TU-699:6', nhomMa: 'II', sttTrongBo: '6.1' }),
    d({ maTrongBo: 'TU-699:6', nhomMa: 'II', nhomTen: 'Kinh tế', sttTrongBo: '6' }),
    d({ maTrongBo: 'TU-699:1', nhomMa: 'I', nhomTen: 'Thông tin chung', sttTrongBo: '1' }),
    d({ maTrongBo: 'TU-699:4', nhomMa: 'II', sttTrongBo: '4' })
  ]);
  assert.deepEqual(cay.map((n) => n.nhomMa), ['I', 'II']);
  assert.deepEqual(cay[1].dong.map((x) => x.dong.maTrongBo), ['TU-699:4', 'TU-699:6']);
  assert.equal(cay[1].dong[1].con[0].dong.maTrongBo, 'TU-699:6.1');
});

test('goiYGhep tìm chỉ tiêu chuẩn gần giống, bỏ qua tên không liên quan', () => {
  const { BoChiTieu } = taiThuan();
  const ds = [{ maChiTieu: 'KTS-01', tenChiTieu: 'Tỷ trọng kinh tế số trong GRDP' }, { maChiTieu: 'DS-01', tenChiTieu: 'Dân số trung bình năm' }];
  assert.equal(BoChiTieu.goiYGhep('Tỷ trọng kinh tế số', ds)[0].maChiTieu, 'KTS-01');
  assert.equal(BoChiTieu.goiYGhep('Dân số trung bình', ds)[0].maChiTieu, 'DS-01');
  assert.ok(BoChiTieu.goiYGhep('Tỷ trọng kinh tế số', ds)[0].diem >= 0.6);
  assert.deepEqual(BoChiTieu.goiYGhep('Số vụ cháy, nổ cấp III', ds), []);
  assert.equal(BoChiTieu.chuanHoaTen('Tỷ lệ hồ sơ được số hóa!'), 'ho so duoc hoa');
});

test('keHoachNhap: giống hệt, bỏ dòng, sửa một ô, khôi phục dòng hết hiệu lực', () => {
  const { BoChiTieu } = taiThuan();
  const daCo = [d({ maTrongBo: 'TU-699:1', taoLuc: 'x', __dong: 3 }), d({ maTrongBo: 'TU-699:2' }), d({ maTrongBo: 'TU-699:3', tinhTrangHieuLuc: 'Hết hiệu lực' })];
  const moi = [d({ maTrongBo: 'TU-699:1' }), d({ maTrongBo: 'TU-699:2' })];
  assert.deepEqual(JSON.parse(JSON.stringify(BoChiTieu.keHoachNhap(daCo.slice(0, 2), moi))), { them: [], sua: [], hetHieuLuc: [], giuNguyen: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(BoChiTieu.keHoachNhap(daCo.slice(0, 2), moi.slice(0, 1)))).hetHieuLuc, ['TU-699:2']);
  const k = BoChiTieu.keHoachNhap(daCo.slice(0, 2), [d({ maTrongBo: 'TU-699:1', donViTinh: '%' }), d({ maTrongBo: 'TU-699:2' }), d({ maTrongBo: 'TU-699:9' })]);
  assert.deepEqual(JSON.parse(JSON.stringify(k.sua)), [{ ma: 'TU-699:1', thayDoi: { donViTinh: '%' } }]);
  assert.equal(k.them.length, 1); assert.equal(k.them[0].maTrongBo, 'TU-699:9');
  const kh = BoChiTieu.keHoachNhap(daCo, [d({ maTrongBo: 'TU-699:1' }), d({ maTrongBo: 'TU-699:2' }), d({ maTrongBo: 'TU-699:3' })]);
  assert.deepEqual(JSON.parse(JSON.stringify(kh.sua)), [{ ma: 'TU-699:3', thayDoi: { tinhTrangHieuLuc: 'Còn hiệu lực' } }]);
  assert.deepEqual(JSON.parse(JSON.stringify(BoChiTieu.keHoachNhap(daCo, moi))).hetHieuLuc, [], 'dòng đã hết hiệu lực không bị đánh dấu lại');
});

test('mucLienQuanTuCap', () => {
  const { BoChiTieu } = taiThuan();
  assert.equal(BoChiTieu.mucLienQuanTuCap('Xã'), 'A');
  assert.equal(BoChiTieu.mucLienQuanTuCap('Thành phố/Xã'), 'A');
  assert.equal(BoChiTieu.mucLienQuanTuCap('Thành phố'), 'C');
  assert.equal(BoChiTieu.mucLienQuanTuCap(''), 'C');
});
