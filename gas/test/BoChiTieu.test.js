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
  assert.deepEqual(JSON.parse(JSON.stringify(BoChiTieu.keHoachNhap(daCo.slice(0, 2), moi))), { them: [], sua: [], hetHieuLuc: [], giuNguyen: 2, boGhep: [] });
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

test('soát 3: mucTieu sai JSON là lỗi dòng; thiếu cột mucTieu hoặc mucTieu rỗng không sinh Sửa', () => {
  const { BoChiTieu } = taiThuan();
  const d = (o) => Object.assign({ maBo: 'TU-699', tenNguyenVan: 'Tên' }, o);
  assert.equal(BoChiTieu.chuanHoaDong({ mucTieu: '>=10' }).mucTieu, '>=10', 'giữ chuỗi sai để báo lỗi');
  const r = BoChiTieu.kiemTraLo('TU-699', [d({ maTrongBo: 'TU-699:1', mucTieu: '[]' }), d({ maTrongBo: 'TU-699:2', mucTieu: '>=10' })].map(BoChiTieu.chuanHoaDong));
  assert.deepEqual(r.loi.map((l) => l.dong + ':' + l.khoa), ['2:mucTieu']);
  const daCo = [d({ maTrongBo: 'TU-699:1', mucTieu: [] }), d({ maTrongBo: 'TU-699:2', mucTieu: '' })];
  const kh = BoChiTieu.keHoachNhap(daCo, [d({ maTrongBo: 'TU-699:1' }), d({ maTrongBo: 'TU-699:2', mucTieu: '' })]);
  assert.equal(kh.giuNguyen, 2, JSON.stringify(kh.sua));
});

test('soát 2: đổi tên dòng đã ghép → bỏ ghép (trừ khi file ghi rõ mã chuẩn); đổi cột khác thì giữ ghép', () => {
  const { BoChiTieu } = taiThuan();
  const d = (o) => Object.assign({ maBo: 'TU-699' }, o);
  const daCo = [d({ maTrongBo: 'TU-699:1', tenNguyenVan: 'A', maChiTieu: 'CT-A' }), d({ maTrongBo: 'TU-699:2', tenNguyenVan: 'B', maChiTieu: 'CT-B', donViTinh: '%' })];
  const kh = BoChiTieu.keHoachNhap(daCo, [d({ maTrongBo: 'TU-699:1', tenNguyenVan: 'A khác' }), d({ maTrongBo: 'TU-699:2', tenNguyenVan: 'B', donViTinh: 'Người' })]);
  assert.deepEqual(JSON.parse(JSON.stringify(kh.sua)), [{ ma: 'TU-699:1', thayDoi: { tenNguyenVan: 'A khác', maChiTieu: '' } }, { ma: 'TU-699:2', thayDoi: { donViTinh: 'Người' } }]);
  assert.deepEqual(JSON.parse(JSON.stringify(kh.boGhep)), [{ ma: 'TU-699:1', maChiTieu: 'CT-A', tenCu: 'A', tenMoi: 'A khác' }]);
  const giu = BoChiTieu.keHoachNhap(daCo, [d({ maTrongBo: 'TU-699:1', tenNguyenVan: 'A khác', maChiTieu: 'CT-A' })]);
  assert.deepEqual(JSON.parse(JSON.stringify(giu.sua[0].thayDoi)), { tenNguyenVan: 'A khác' });
  assert.deepEqual(giu.boGhep, []);
});

test('tử/mẫu: hệ số, loại lạ, cảnh báo thiếu định nghĩa', () => {
  const { BoChiTieu } = taiThuan();
  const d = (o) => Object.assign({ maBo: 'TU-699', tenNguyenVan: 'Tên' }, o);
  const LGT = [{ maLoaiGiaTri: 'TY_LE', coTuSoMauSo: true }, { maLoaiGiaTri: 'SO_TUYET_DOI', coTuSoMauSo: false }, { maLoaiGiaTri: 'MOI', coTuSoMauSo: true }];
  assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '10.000' }).heSoNhan, 10000);
  assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '100' }).heSoNhan, 100);
  assert.equal(BoChiTieu.chuanHoaDong({ heSoNhan: '' }).heSoNhan, '');
  const kt = BoChiTieu.kiemTraLo('TU-699', [
    d({ maTrongBo: 'TU-699:1', loaiGiaTri: 'TY_LE', dinhNghiaTuSo: 'A', dinhNghiaMauSo: 'B', heSoNhan: '100' }),
    d({ maTrongBo: 'TU-699:2', loaiGiaTri: 'TY_LE', dinhNghiaTuSo: '' }),
    d({ maTrongBo: 'TU-699:3', loaiGiaTri: 'KHONG_CO' }),
    d({ maTrongBo: 'TU-699:4', loaiGiaTri: 'SO_TUYET_DOI', heSoNhan: 'mười' }),
    d({ maTrongBo: 'TU-699:5', loaiGiaTri: 'MOI' }),
    d({ maTrongBo: 'TU-699:6', heSoNhan: '-5' })
  ].map(BoChiTieu.chuanHoaDong), { loaiGiaTri: LGT });
  assert.deepEqual(kt.loi.map((l) => l.dong + ':' + l.khoa).sort(), ['3:loaiGiaTri', '4:heSoNhan', '6:heSoNhan']);
  assert.deepEqual(kt.canhBao.map((l) => l.dong + ':' + l.khoa), ['2:dinhNghiaTuSo', '2:dinhNghiaMauSo', '5:dinhNghiaTuSo', '5:dinhNghiaMauSo']);
  assert.match(kt.canhBao[0].thongBao, /Chưa quy định phương pháp tính/);
  const khong = BoChiTieu.kiemTraLo('TU-699', [d({ maTrongBo: 'TU-699:9', loaiGiaTri: 'X' })]);
  assert.equal(khong.hopLe, true, 'không truyền danh mục thì không kiểm mã loại');
  assert.equal(khong.canhBao.length, 0);
});

test('tử/mẫu: dòng thiếu bốn cột mới không sinh Sửa so với dòng đã lưu có bốn cột rỗng', () => {
  const { BoChiTieu } = taiThuan();
  const daCo = [{ maTrongBo: 'TU-699:1', maBo: 'TU-699', tenNguyenVan: 'Tên', loaiGiaTri: '', dinhNghiaTuSo: '', dinhNghiaMauSo: '', heSoNhan: '' }];
  const kh = BoChiTieu.keHoachNhap(daCo, [{ maTrongBo: 'TU-699:1', maBo: 'TU-699', tenNguyenVan: 'Tên' }]);
  assert.equal(kh.giuNguyen, 1, JSON.stringify(kh.sua));
  const kh2 = BoChiTieu.keHoachNhap([Object.assign({}, daCo[0], { heSoNhan: 100 })], [{ maTrongBo: 'TU-699:1', maBo: 'TU-699', tenNguyenVan: 'Tên', heSoNhan: '100' }]);
  assert.equal(kh2.giuNguyen, 1, 'hệ số 100 (số) và "100" (chữ từ file) là như nhau');
});
