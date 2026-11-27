const test = require('node:test');
const assert = require('node:assert/strict');
const { taiTatCa } = require('./_moiTruong');

// Gọi API như doPost: trả đối tượng kết quả đã parse.
function goi(ctx, yeuCau) { return JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(yeuCau) } }).getContent()); }
function thietLap(tuyChon) {
  const ctx = taiTatCa(tuyChon);
  ctx.PropertiesService.getScriptProperties().setProperty('GOOGLE_CLIENT_ID', 'CID-TEST');
  const bc = ctx.ThietLap.thietLapLanDau({ emailQuanTri: 'qt@gmail.com', hoTenQuanTri: 'QT' });
  const dong = bc.find((s) => /MẬT KHẨU TẠM/.test(s));
  return { ctx, matKhauTam: dong.split(': ').pop().trim() };
}
function dangNhap(ctx, ten, mk) { const r = goi(ctx, { action: 'xacThuc.dangNhapMatKhau', duLieu: { tenDangNhap: ten, matKhau: mk } }); assert.equal(r.ok, true, JSON.stringify(r)); return r.duLieu; }

test('nạp toàn bộ file theo thứ tự ASCII của clasp không ném lỗi (lỗi tham chiếu lúc nạp)', () => {
  const ctx = taiTatCa();
  assert.ok(ctx.__daNap[0] === 'Main.gs' && ctx.__daNap[1].startsWith('ketnoi/'), 'thứ tự nạp: ' + ctx.__daNap.slice(0, 3).join(', '));
  for (const t of ['SoDo', 'KhoDuLieu', 'XacThuc', 'DanhMucGas', 'ChiTieuGas', 'BoChiTieu', 'LichDem', 'ThietLap']) assert.equal(typeof ctx[t], 'object', 'thiếu ' + t);
  assert.equal(typeof ctx.DanhMucGas.HANDLERS['danhMuc.doc'], 'function');
});

test('thiết lập lần đầu tạo đủ ba file, mọi sheet (kể cả bảng hơn 26 cột), gieo danh mục, tài khoản quản trị, lịch', () => {
  const { ctx } = thietLap();
  for (const f of ctx.SoDo.FILE) assert.ok(ctx.__gia.props['ID_' + f], 'thiếu ' + f);
  const nv = ctx.KhoDuLieu._sheet('NhiemVu');
  assert.equal(nv.getRange(1, 1, 1, ctx.SoDo.BANG.NhiemVu.cot.length).getValues()[0][0], 'maNhiemVu');
  assert.ok(nv.getMaxColumns() >= ctx.SoDo.BANG.NhiemVu.cot.length, 'NhiemVu phải đủ cột');
  assert.equal(ctx.KhoDuLieu.docBang('DM_DonVi').length, 36);
  assert.equal(ctx.KhoDuLieu.docBang('DM_NguoiDung').length, 1);
  assert.deepEqual(ctx.__gia.triggers.map((t) => t.fn + '@' + t.hour).sort(), ['kiemTraToanVenHangDem@2', 'saoLuuHangDem@1']);
  assert.equal(ctx.ThietLap.kiemTraThietLap().thieu.length, 0, 'thiếu: ' + ctx.ThietLap.kiemTraThietLap().thieu.join(', '));
});

test('đăng nhập mật khẩu tạm, khởi động, thêm/sửa/ngừng danh mục, nhật ký — qua doPost', () => {
  const { ctx, matKhauTam } = thietLap();
  const dn = dangNhap(ctx, 'quantri', matKhauTam);
  assert.equal(dn.batBuocDoiMatKhau, true);
  const phien = dn.maPhien;
  // Còn mật khẩu tạm: chỉ được đổi mật khẩu/đăng xuất/khởi động/sức khỏe
  assert.equal(goi(ctx, { phien, action: 'danhMuc.doc', duLieu: { bang: 'DM_LinhVuc' } }).loi.ma, 'KHONG_CO_QUYEN');
  assert.equal(goi(ctx, { phien, action: 'xacThuc.doiMatKhau', duLieu: { matKhauCu: matKhauTam, matKhauMoi: 'Moi12345' } }).ok, true);
  const kd = goi(ctx, { phien, action: 'heThong.khoiDong' }); assert.equal(kd.ok, true); assert.equal(kd.duLieu.soDoDanhMuc.length, ctx.SoDo.danhSachBang('danhmuc').length);
  const them = goi(ctx, { phien, action: 'danhMuc.them', duLieu: { bang: 'DM_LinhVuc', banGhi: { maLinhVuc: '0123', tenLinhVuc: 'Thử số' } } });
  assert.equal(them.ok, true, JSON.stringify(them)); assert.equal(them.duLieu.maLinhVuc, '0123');
  assert.equal(goi(ctx, { phien, action: 'danhMuc.sua', duLieu: { bang: 'DM_LinhVuc', ma: '0123', thayDoi: { tenLinhVuc: 'Đã sửa' } } }).loi.ma, 'DU_LIEU_KHONG_HOP_LE');
  assert.equal(goi(ctx, { phien, action: 'danhMuc.sua', duLieu: { bang: 'DM_LinhVuc', ma: '0123', thayDoi: { tenLinhVuc: 'Đã sửa' }, canCu: 'CV 1' } }).duLieu.tenLinhVuc, 'Đã sửa');
  assert.equal(goi(ctx, { phien, action: 'danhMuc.ngung', duLieu: { bang: 'DM_LinhVuc', ma: '0123', lyDo: 'thử' } }).duLieu.tinhTrang, 'Ngừng');
  const nk = goi(ctx, { phien, action: 'nhatKy.doc', duLieu: { bang: 'DM_LinhVuc', ma: '0123' } }).duLieu;
  assert.deepEqual(nk.map((r) => r.hanhDong), ['NGUNG', 'SUA', 'THEM']);
  assert.equal(ctx.KhoDuLieu._sheet('DM_LinhVuc').rows.find((r) => r[0] === '0123')[0], '0123');
  assert.equal(goi(ctx, { phien, action: 'xacThuc.dangXuat' }).ok, true);
  assert.equal(goi(ctx, { phien, action: 'heThong.khoiDong' }).loi.ma, 'PHIEN_HET_HAN');
});

test('mọi ghi vào Sheets (kể cả phiên và nhật ký) đều dưới khóa', () => {
  const { ctx, matKhauTam } = thietLap();
  ctx.__gia.ghiKhiKhongKhoa.length = 0;
  dangNhap(ctx, 'quantri', matKhauTam);
  goi(ctx, { action: 'xacThuc.dangNhapMatKhau', duLieu: { tenDangNhap: 'quantri', matKhau: 'sai' } });
  assert.deepEqual(ctx.__gia.ghiKhiKhongKhoa, [], 'ghi ngoài khóa vào: ' + ctx.__gia.ghiKhiKhongKhoa.join(', '));
});

test('đổi mật khẩu thu hồi các phiên khác; khóa tài khoản thu hồi mọi phiên', () => {
  const { ctx, matKhauTam } = thietLap();
  const p1 = dangNhap(ctx, 'quantri', matKhauTam).maPhien;
  const p2 = dangNhap(ctx, 'quantri', matKhauTam).maPhien;
  assert.equal(goi(ctx, { phien: p1, action: 'xacThuc.doiMatKhau', duLieu: { matKhauCu: matKhauTam, matKhauMoi: 'Moi12345' } }).ok, true);
  assert.equal(goi(ctx, { phien: p2, action: 'heThong.khoiDong' }).loi.ma, 'PHIEN_HET_HAN', 'phiên khác phải bị thu hồi');
  assert.equal(goi(ctx, { phien: p1, action: 'heThong.khoiDong' }).ok, true, 'phiên hiện tại giữ nguyên');
  // Tạo người dùng DONVI, đăng nhập, rồi quản trị khóa → phiên DONVI mất hiệu lực ngay
  const t = goi(ctx, { phien: p1, action: 'nguoiDung.them', duLieu: { banGhi: { tenDangNhap: 'dv04', hoTen: 'CV HCC', vaiTro: ['DONVI'], danhSachDonVi: ['DV04'] } } });
  assert.equal(t.ok, true, JSON.stringify(t));
  const pDV = dangNhap(ctx, 'dv04', t.duLieu.matKhauTam).maPhien;
  assert.equal(goi(ctx, { phien: pDV, action: 'heThong.khoiDong' }).ok, true);
  assert.equal(goi(ctx, { phien: p1, action: 'nguoiDung.sua', duLieu: { ma: t.duLieu.nguoiDung.maNguoiDung, thayDoi: { trangThai: 'Khóa' }, canCu: 'thử' } }).ok, true);
  assert.equal(goi(ctx, { phien: pDV, action: 'heThong.khoiDong' }).loi.ma, 'PHIEN_HET_HAN');
});

test('thẻ Google hợp lệ nhưng email lạ, hoặc tài khoản khóa → KHONG_CO_QUYEN rõ ràng', () => {
  const payload = (email) => ({ aud: 'CID-TEST', iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 600, email, email_verified: 'true' });
  const { ctx } = thietLap({ fetch: (url) => ({ code: 200, text: JSON.stringify(payload(decodeURIComponent(url.split('id_token=')[1]))) }) });
  const la = goi(ctx, { action: 'xacThuc.dangNhapGoogle', duLieu: { idToken: 'la@gmail.com' } });
  assert.equal(la.loi.ma, 'KHONG_CO_QUYEN'); assert.match(la.loi.thongBao, /chưa được cấp tài khoản/);
  assert.equal(ctx.KhoDuLieu.docBang('DM_NguoiDung').length, 1, 'không tạo tài khoản ngầm');
  assert.equal(goi(ctx, { action: 'xacThuc.dangNhapGoogle', duLieu: { idToken: 'qt@gmail.com' } }).ok, true);
});

test('sao lưu đêm: thư mục sao lưu bị xóa hoặc Drive đầy → ghi LOI và email quản trị, không ném lỗi', () => {
  const a = thietLap({ copyFails: true });
  const kq = a.ctx.LichDem.saoLuuHangDem();
  assert.ok(kq.every((d) => d.ketQua === 'LOI'));
  assert.equal(a.ctx.KhoDuLieu.docBang('SaoLuu').filter((r) => r.ketQua === 'LOI').length, 3);
  assert.ok(a.ctx.__gia.mail.some((m) => /Sao lưu/.test(m.subject) && m.to === 'qt@gmail.com'));
  const b = thietLap();
  b.ctx.__gia.folders[b.ctx.__gia.props.ID_THU_MUC_SAO_LUU].trashed = true;
  assert.doesNotThrow(() => b.ctx.LichDem.saoLuuHangDem());
  assert.ok(b.ctx.KhoDuLieu.docBang('SaoLuu').some((r) => r.ketQua === 'LOI'));
  assert.ok(b.ctx.__gia.mail.length >= 1);
});

test('1b: thiết lập lại xóa sheet ChiTieu_NguonQuyDinh trống, tạo ChiTieu_TrongBo, không ghi đè tiêu đề sheet đã có dữ liệu bị sửa tay', () => {
  const { ctx } = thietLap();
  const ss = ctx.KhoDuLieu._ss('HTTD3_DuLieu');
  const cu = ss.insertSheet('ChiTieu_NguonQuyDinh'); cu.getRange(1, 1, 2, 2).setValues([['a', 'b'], ['A', 'B']]);
  ss.deleteSheet(ss.getSheetByName('ChiTieu_TrongBo'));
  const dv = ctx.KhoDuLieu._sheet('DM_DonVi');
  dv.getRange(1, 1, 1, 1).setValues([['maDonViSuaTay']]);
  const bc = ctx.ThietLap.thietLapLanDau({ emailQuanTri: 'qt@gmail.com', hoTenQuanTri: 'QT' });
  assert.equal(ss.getSheetByName('ChiTieu_NguonQuyDinh'), null, 'sheet cũ trống phải bị xóa');
  assert.ok(ss.getSheetByName('ChiTieu_TrongBo'));
  assert.equal(dv.getRange(1, 1, 1, 1).getValues()[0][0], 'maDonViSuaTay', 'không được ghi đè tiêu đề sheet có dữ liệu');
  assert.ok(bc.some((s) => /DM_DonVi/.test(s) && /tiêu đề/.test(s)), 'phải có cảnh báo tiêu đề lệch');
  assert.equal(ctx.KhoDuLieu.docBang('DM_BoChiTieu').length, 5);
});

// ---------- Giai đoạn 1b: ghi lô và API bộ chỉ tiêu ----------
function quanTri() {
  const { ctx, matKhauTam } = thietLap();
  const phien = dangNhap(ctx, 'quantri', matKhauTam).maPhien;
  assert.equal(goi(ctx, { phien, action: 'xacThuc.doiMatKhau', duLieu: { matKhauCu: matKhauTam, matKhauMoi: 'Moi12345' } }).ok, true);
  return { ctx, phien };
}
const BO = (maBo) => ({ maBo, tenBo: 'Bộ ' + maBo, loaiHeThong: 'Quốc gia' });
function loMau(maBo, n, them) {
  return Array.from({ length: n }, (_, i) => {
    const ma = String(i + 1).padStart(4, '0');
    return Object.assign({
      maTrongBo: maBo + ':' + ma, maBo, maGoc: ma, sttTrongBo: String(i + 1), nhomMa: String(Math.floor(i / 11) + 1).padStart(2, '0'),
      nhomTen: 'Nhóm thử', tenNguyenVan: 'Chỉ tiêu thử số ' + (i + 1),
      khaiNiemPhuongPhapTinh: ('Khái niệm dòng một\n- ý a;\n+ ý b. ').repeat(15), phanToChuYeu: '- Tỉnh, thành phố', kyCongBo: 'Năm.',
      nguonSoLieu: '- Chế độ báo cáo', coQuanChuTriThuThap: 'Bộ Kế hoạch và Đầu tư (Tổng cục Thống kê)', coQuanPhoiHopThuThap: '+ Bộ Công an;\n+ Bộ Tư pháp.',
      mucTieu: '[{"giaiDoan":"2026","nguyenVan":">=1.924.469"}]'
    }, them ? them(i) : {});
  });
}
const nhap = (ctx, phien, maBo, dong, cheDo, canCu) => goi(ctx, { phien, action: 'chiTieu.nhap', duLieu: { bo: BO(maBo), dong, cheDo, canCu } });
function docMoi(ctx, bang, tc) { ctx.KhoDuLieu._xoaCache(bang); return ctx.KhoDuLieu.docBang(bang, tc); }

test('1b: chiTieu.nhap 230 dòng — một khóa, ít lần setValues; nhập lại giống hệt không ghi gì; bỏ một dòng → Hết hiệu lực', () => {
  const { ctx, phien } = quanTri();
  const dong = loMau('LUAT-TK', 230);
  const xt = nhap(ctx, phien, 'LUAT-TK', dong, 'xemTruoc');
  assert.equal(xt.ok, true, JSON.stringify(xt).slice(0, 400));
  assert.equal(xt.duLieu.kiemTra.hopLe, true);
  assert.deepEqual(xt.duLieu.keHoach, { soThem: 230, soSua: 0, soHetHieuLuc: 0, giuNguyen: 0, soBoGhep: 0 });
  assert.equal(docMoi(ctx, 'ChiTieu_TrongBo').length, 0, 'xem trước không được ghi');

  const k0 = ctx.__gia.lockCount; ctx.__gia.setValuesDem = {}; ctx.__gia.ghiKhiKhongKhoa.length = 0;
  const g = nhap(ctx, phien, 'LUAT-TK', dong, 'ghi', 'Luật Thống kê hợp nhất');
  assert.equal(g.ok, true, JSON.stringify(g).slice(0, 400));
  assert.equal(g.duLieu.soThem, 230);
  assert.equal(ctx.__gia.lockCount - k0, 1, 'cả lần nhập chỉ một khóa');
  assert.ok((ctx.__gia.setValuesDem.ChiTieu_TrongBo || 0) <= 3, 'setValues ChiTieu_TrongBo: ' + ctx.__gia.setValuesDem.ChiTieu_TrongBo);
  assert.ok((ctx.__gia.setValuesDem.NhatKy || 0) <= 3, 'setValues NhatKy: ' + ctx.__gia.setValuesDem.NhatKy);
  assert.deepEqual(ctx.__gia.ghiKhiKhongKhoa, []);
  const ds = docMoi(ctx, 'ChiTieu_TrongBo');
  assert.equal(ds.length, 230);
  assert.equal(ds[0].maGoc, '0001');
  assert.equal(ds[5].coQuanPhoiHopThuThap, '+ Bộ Công an;\n+ Bộ Tư pháp.');
  assert.equal(ds[5].mucTieu[0].so, 1924469);
  assert.equal(docMoi(ctx, 'DM_BoChiTieu').find((b) => b.maBo === 'LUAT-TK').soChiTieu, 230);
  const nk = docMoi(ctx, 'NhatKy', { baoGomXoaMem: true });
  assert.equal(nk.filter((r) => r.bang === 'ChiTieu_TrongBo').length, 230, 'mỗi bản ghi một dòng nhật ký');
  assert.equal(new Set(nk.map((r) => r.maNhatKy)).size, nk.length, 'mã nhật ký không trùng');

  const nk0 = nk.length;
  const g2 = nhap(ctx, phien, 'LUAT-TK', dong, 'ghi', 'nhập lại');
  assert.equal(g2.ok, true, JSON.stringify(g2).slice(0, 400));
  assert.equal(g2.duLieu.soThem, 0); assert.equal(g2.duLieu.soSua, 0); assert.equal(g2.duLieu.giuNguyen, 230);
  assert.equal(docMoi(ctx, 'NhatKy', { baoGomXoaMem: true }).length, nk0, 'nhập lại giống hệt không ghi nhật ký');

  const g3 = nhap(ctx, phien, 'LUAT-TK', dong.slice(1), 'ghi', 'bỏ 0001');
  assert.equal(g3.ok, true, JSON.stringify(g3).slice(0, 400));
  assert.equal(g3.duLieu.soHetHieuLuc, 1);
  ctx.KhoDuLieu._xoaCache('ChiTieu_TrongBo');
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'LUAT-TK:0001').tinhTrangHieuLuc, 'Hết hiệu lực');
  assert.equal(docMoi(ctx, 'ChiTieu_TrongBo').length, 230, 'không xóa dòng');
  assert.equal(docMoi(ctx, 'DM_BoChiTieu').find((b) => b.maBo === 'LUAT-TK').soChiTieu, 229);
});

test('1b: lô có lỗi — xem trước báo dòng lỗi, ghi bị từ chối và không ghi dòng nào; ghiLo kiểm tra hết trước khi ghi', () => {
  const { ctx, phien } = quanTri();
  const xau = loMau('TT13-BNV', 3); xau[2].chaTrongBo = 'TT13-BNV:9999';
  const xt = nhap(ctx, phien, 'TT13-BNV', xau, 'xemTruoc');
  assert.equal(xt.ok, true);
  assert.equal(xt.duLieu.kiemTra.hopLe, false);
  assert.deepEqual(xt.duLieu.kiemTra.loi.map((l) => l.dong + ':' + l.khoa), ['3:chaTrongBo']);
  const g = nhap(ctx, phien, 'TT13-BNV', xau, 'ghi', 'thử');
  assert.equal(g.ok, false); assert.equal(g.loi.ma, 'DU_LIEU_KHONG_HOP_LE');
  assert.equal(docMoi(ctx, 'ChiTieu_TrongBo').length, 0);
  assert.equal(docMoi(ctx, 'DM_BoChiTieu').find((b) => b.maBo === 'TT13-BNV').tenBo, 'Hệ thống chỉ tiêu thống kê ngành Nội vụ', 'bộ không bị sửa khi lô lỗi');
  const sh = ctx.KhoDuLieu._sheet('ChiTieu_TrongBo'), dongSheet = sh.getLastRow();
  const tot = loMau('TT13-BNV', 2), hong = Object.assign(loMau('TT13-BNV', 3)[2], { maBo: 'KHONG-CO' });
  assert.throws(() => ctx.KhoDuLieu.ghiLo('ChiTieu_TrongBo', { them: tot.concat([hong]) }, null, 'thử'), /DU_LIEU_KHONG_HOP_LE/);
  assert.equal(sh.getLastRow(), dongSheet, 'ghiLo lỗi một dòng thì không ghi dòng nào');
});

test('1b: chiTieu.chiTiet giữ xuống dòng; chiTieu.ghep tạo chuẩn mới, ghép dòng bộ khác, cungNoiHam; nhập lại không xóa liên kết', () => {
  const { ctx, phien } = quanTri();
  const tt13 = loMau('TT13-BNV', 1, () => ({ tenNguyenVan: 'Số đơn vị hành chính', capDuLieu: 'Thành phố/Xã', khaiNiemPhuongPhapTinh: '- Dòng một;\n+ Dòng hai.', coQuanChuTriThuThap: 'Vụ Chính quyền địa phương, Bộ Nội vụ.', coQuanPhoiHopThuThap: '' }));
  tt13[0].maTrongBo = 'TT13-BNV:0101'; tt13[0].maGoc = '0101';
  assert.equal(nhap(ctx, phien, 'TT13-BNV', tt13, 'ghi', 'TT13').ok, true);
  assert.equal(nhap(ctx, phien, 'TU-699', loMau('TU-699', 1, () => ({ tenNguyenVan: 'Số đơn vị hành chính cấp xã', capDuLieu: 'Thành phố' })), 'ghi', '699').ok, true);

  const ct = goi(ctx, { phien, action: 'chiTieu.chiTiet', duLieu: { maTrongBo: 'TT13-BNV:0101' } });
  assert.equal(ct.ok, true, JSON.stringify(ct));
  assert.equal(ct.duLieu.dong.khaiNiemPhuongPhapTinh, '- Dòng một;\n+ Dòng hai.');
  assert.equal(ct.duLieu.dong.coQuanChuTriThuThap, 'Vụ Chính quyền địa phương, Bộ Nội vụ.');
  assert.equal(ct.duLieu.chuan, null); assert.deepEqual(ct.duLieu.cungNoiHam, []);
  assert.equal(goi(ctx, { phien, action: 'chiTieu.chiTiet', duLieu: { maTrongBo: 'X:1' } }).loi.ma, 'KHONG_TIM_THAY');

  const g1 = goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TT13-BNV:0101', taoMoi: { maChiTieu: 'DVHC-01', tenChiTieu: 'Số đơn vị hành chính' } } });
  assert.equal(g1.ok, true, JSON.stringify(g1));
  const chuan = docMoi(ctx, 'DM_ChiTieu').find((r) => r.maChiTieu === 'DVHC-01');
  assert.equal(chuan.khaiNiemPhuongPhapTinh, '- Dòng một;\n+ Dòng hai.');
  assert.equal(chuan.nguonSoLieuNoiDung, '- Chế độ báo cáo');
  assert.equal(chuan.mucLienQuanCapXa, 'A');
  assert.equal(goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0001', maChiTieu: 'DVHC-01' } }).ok, true);
  assert.equal(goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0001', maChiTieu: 'KHONG-CO' } }).loi.ma, 'KHONG_TIM_THAY');

  const ct2 = goi(ctx, { phien, action: 'chiTieu.chiTiet', duLieu: { maTrongBo: 'TT13-BNV:0101' } }).duLieu;
  assert.equal(ct2.chuan.maChiTieu, 'DVHC-01');
  assert.deepEqual(ct2.cungNoiHam, [{ maTrongBo: 'TU-699:0001', maBo: 'TU-699', tenNguyenVan: 'Số đơn vị hành chính cấp xã' }]);

  const lai = nhap(ctx, phien, 'TT13-BNV', tt13, 'ghi', 'nhập lại');
  assert.equal(lai.duLieu.soSua, 0, 'file để trống maChiTieu không xóa liên kết');
  ctx.KhoDuLieu._xoaCache('ChiTieu_TrongBo');
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TT13-BNV:0101').maChiTieu, 'DVHC-01');

  const doc = goi(ctx, { phien, action: 'chiTieu.doc', duLieu: {} }).duLieu;
  const b = doc.bo.find((x) => x.maBo === 'TT13-BNV');
  assert.equal(b.soChiTieu, 1); assert.equal(b.soCapXa, 1);
  assert.equal(doc.bo.length, 5);
  const mot = goi(ctx, { phien, action: 'chiTieu.doc', duLieu: { maBo: 'TT13-BNV' } }).duLieu;
  assert.equal(mot.bo.maBo, 'TT13-BNV'); assert.equal(mot.dong.length, 1);
  assert.equal(mot.dong[0].khaiNiemPhuongPhapTinh, undefined, 'danh sách không kèm năm trường');
  assert.equal(mot.dong[0].coNoiDung, true);

  const xt = goi(ctx, { phien, action: 'chiTieu.nhap', duLieu: { bo: BO('TT45-BKHCN'), dong: loMau('TT45-BKHCN', 1, () => ({ tenNguyenVan: 'Số đơn vị hành chính' })), cheDo: 'xemTruoc' } }).duLieu;
  assert.deepEqual(xt.goiYGhep['TT45-BKHCN:0001'].map((x) => x.maChiTieu), ['DVHC-01']);
});

test('1b: DONVI đọc được bộ chỉ tiêu nhưng không nhập/ghép; thân quá lớn bị từ chối', () => {
  const { ctx, phien } = quanTri();
  const t = goi(ctx, { phien, action: 'nguoiDung.them', duLieu: { banGhi: { tenDangNhap: 'dv04', hoTen: 'CV HCC', vaiTro: ['DONVI'], danhSachDonVi: ['DV04'] } } });
  const pDV = dangNhap(ctx, 'dv04', t.duLieu.matKhauTam).maPhien;
  assert.equal(goi(ctx, { phien: pDV, action: 'xacThuc.doiMatKhau', duLieu: { matKhauCu: t.duLieu.matKhauTam, matKhauMoi: 'Dv123456' } }).ok, true);
  assert.equal(goi(ctx, { phien: pDV, action: 'chiTieu.doc', duLieu: {} }).ok, true);
  assert.equal(nhap(ctx, pDV, 'TT13-BNV', loMau('TT13-BNV', 1), 'ghi', 'x').loi.ma, 'KHONG_CO_QUYEN');
  assert.equal(goi(ctx, { phien: pDV, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TT13-BNV:0001', maChiTieu: 'A' } }).loi.ma, 'KHONG_CO_QUYEN');
  const to = nhap(ctx, phien, 'TT13-BNV', loMau('TT13-BNV', 1, () => ({ khaiNiemPhuongPhapTinh: 'x'.repeat(950000) })), 'xemTruoc');
  assert.equal(to.loi.ma, 'DU_LIEU_KHONG_HOP_LE'); assert.match(to.loi.thongBao, /quá lớn/);
});

// ---------- Sửa sau soát toàn nhánh 1b ----------
const COT_1B_DM_CHITIEU = ['chaChiTieu', 'linhVucLon', 'thuocTinhTongHop', 'capDuLieu', 'kyBaoCaoXa', 'khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieuNoiDung', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap'];

test('soát 1: DM_ChiTieu kiểu giai đoạn 1 đã có dòng → thiết lập lại chèn cột mới đúng chỗ, dữ liệu cũ giữ nguyên; sửa và ghép đọc lại đúng', () => {
  const { ctx, phien } = quanTri();
  const sh = ctx.KhoDuLieu._sheet('DM_ChiTieu');
  const cot = ctx.SoDo.BANG.DM_ChiTieu.cot, cu = cot.filter((c) => !COT_1B_DM_CHITIEU.includes(c.khoa));
  const gio = '2026-11-16T08:00:00+07:00';
  const giaTri = { maChiTieu: 'CT-CU', tenChiTieu: 'Chỉ tiêu cũ', mucLienQuanCapXa: 'B', taoLuc: gio, taoBoi: 'qt@gmail.com', capNhatLuc: gio, capNhatBoi: 'qt@gmail.com', tinhTrang: 'Hoạt động' };
  sh.rows = [cu.map((c) => c.khoa), cu.map((c) => c.ten), cu.map((c) => giaTri[c.khoa] ?? '')];
  const bc = ctx.ThietLap.thietLapLanDau({ emailQuanTri: 'qt@gmail.com', hoTenQuanTri: 'QT' });
  assert.ok(bc.some((s) => /DM_ChiTieu/.test(s) && /bổ sung/i.test(s)), bc.join('\n'));
  assert.ok(!bc.some((s) => /CẢNH BÁO DM_ChiTieu/.test(s)), bc.join('\n'));
  assert.deepEqual(sh.rows[0].slice(0, cot.length), cot.map((c) => c.khoa));
  ctx.KhoDuLieu._xoaCache('DM_ChiTieu');
  const r = ctx.KhoDuLieu.timDong('DM_ChiTieu', 'CT-CU');
  assert.equal(r.tenChiTieu, 'Chỉ tiêu cũ'); assert.equal(r.mucLienQuanCapXa, 'B'); assert.equal(r.taoLuc, gio); assert.equal(r.tinhTrang, 'Hoạt động'); assert.equal(r.khaiNiemPhuongPhapTinh, '');
  const s = goi(ctx, { phien, action: 'danhMuc.sua', duLieu: { bang: 'DM_ChiTieu', ma: 'CT-CU', thayDoi: { tenChiTieu: 'Đã sửa' }, canCu: 'thử' } });
  assert.equal(s.ok, true, JSON.stringify(s));
  ctx.KhoDuLieu._xoaCache('DM_ChiTieu');
  const r2 = ctx.KhoDuLieu.timDong('DM_ChiTieu', 'CT-CU');
  assert.equal(r2.tenChiTieu, 'Đã sửa'); assert.equal(r2.taoLuc, gio); assert.equal(r2.tinhTrang, 'Hoạt động');
  assert.equal(nhap(ctx, phien, 'TT13-BNV', loMau('TT13-BNV', 1), 'ghi', 'x').ok, true);
  assert.equal(goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TT13-BNV:0001', taoMoi: { maChiTieu: 'CT-MOI', tenChiTieu: 'Mới' } } }).ok, true);
  ctx.KhoDuLieu._xoaCache('DM_ChiTieu');
  const r3 = ctx.KhoDuLieu.timDong('DM_ChiTieu', 'CT-MOI');
  assert.equal(r3.tinhTrang, 'Hoạt động'); assert.equal(r3.coQuanChuTriThuThap, 'Bộ Kế hoạch và Đầu tư (Tổng cục Thống kê)'); assert.ok(r3.taoLuc);
  const kt = ctx.ThietLap.kiemTraThietLap({ tieuDe: true }).thieu; assert.equal(kt.length, 0, kt.join(', '));
});

test('soát 1: tiêu đề lệch không tự chuyển được → đọc/ghi bảng đó dừng với CHUA_THIET_LAP, kiểm tra thiết lập báo, thiết lập lại không ném lỗi', () => {
  const { ctx, phien } = quanTri();
  const dv = ctx.KhoDuLieu._sheet('DM_DonVi');
  dv.getRange(1, 2, 1, 1).setValues([['tenSuaTay']]);
  ctx.KhoDuLieu._xoaCache('DM_DonVi');
  assert.throws(() => ctx.KhoDuLieu.docBang('DM_DonVi'), /CHUA_THIET_LAP/);
  const r = goi(ctx, { phien, action: 'danhMuc.sua', duLieu: { bang: 'DM_DonVi', ma: 'DV01', thayDoi: { tenDayDu: 'x' }, canCu: 'thử' } });
  assert.equal(r.ok, false); assert.equal(r.loi.ma, 'CHUA_THIET_LAP');
  assert.ok(ctx.ThietLap.kiemTraThietLap({ tieuDe: true }).thieu.some((t) => /tiêu đề DM_DonVi/.test(t)), JSON.stringify(ctx.ThietLap.kiemTraThietLap({ tieuDe: true })));
  assert.doesNotThrow(() => ctx.ThietLap.thietLapLanDau({ emailQuanTri: 'qt@gmail.com', hoTenQuanTri: 'QT' }));
});

test('soát 2: nhập lại đổi tên một dòng đã ghép → bỏ ghép dòng đó, xem trước liệt kê; danh sách Sửa có cột đổi', () => {
  const { ctx, phien } = quanTri();
  assert.equal(nhap(ctx, phien, 'TU-699', loMau('TU-699', 3), 'ghi', 'x').ok, true);
  assert.equal(goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0002', taoMoi: { maChiTieu: 'CT-B', tenChiTieu: 'B' } } }).ok, true);
  const moi = loMau('TU-699', 3); moi[1].tenNguyenVan = 'Một chỉ tiêu khác hẳn';
  const xt = nhap(ctx, phien, 'TU-699', moi, 'xemTruoc').duLieu;
  assert.equal(xt.keHoach.soBoGhep, 1);
  assert.deepEqual(xt.boGhep, [{ ma: 'TU-699:0002', maChiTieu: 'CT-B', tenCu: 'Chỉ tiêu thử số 2', tenMoi: 'Một chỉ tiêu khác hẳn' }]);
  assert.equal(xt.chiTietSua.length, 1); assert.equal(xt.chiTietSua[0].ma, 'TU-699:0002'); assert.ok(xt.chiTietSua[0].cot.includes('tenNguyenVan'));
  const g = nhap(ctx, phien, 'TU-699', moi, 'ghi', 'x');
  assert.equal(g.ok, true, JSON.stringify(g)); assert.equal(g.duLieu.soBoGhep, 1);
  ctx.KhoDuLieu._xoaCache('ChiTieu_TrongBo');
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:0002').maChiTieu, '');
  assert.equal(goi(ctx, { phien, action: 'chiTieu.chiTiet', duLieu: { maTrongBo: 'TU-699:0002' } }).duLieu.chuan, null);
});

test('soát 4: chiTieu.doc trả danh sách chỉ tiêu chuẩn kèm số bộ', () => {
  const { ctx, phien } = quanTri();
  nhap(ctx, phien, 'TT13-BNV', loMau('TT13-BNV', 1), 'ghi', 'x');
  nhap(ctx, phien, 'TU-699', loMau('TU-699', 2), 'ghi', 'x');
  goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TT13-BNV:0001', taoMoi: { maChiTieu: 'CT-A', tenChiTieu: 'A' } } });
  goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0001', maChiTieu: 'CT-A' } });
  goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0002', taoMoi: { maChiTieu: 'CT-B', tenChiTieu: 'B' } } });
  const ds = goi(ctx, { phien, action: 'chiTieu.doc', duLieu: {} }).duLieu.chuan;
  const a = ds.find((c) => c.maChiTieu === 'CT-A'), b = ds.find((c) => c.maChiTieu === 'CT-B');
  assert.equal(a.soBo, 2); assert.deepEqual(a.cacBo, ['TT13-BNV', 'TU-699']); assert.equal(a.tenChiTieu, 'A');
  assert.equal(b.soBo, 1);
  assert.equal(a.khaiNiemPhuongPhapTinh, undefined, 'danh sách không kèm năm trường');
});

// ---------- Tử số / mẫu số ----------
const COT_TU_MAU = ['loaiGiaTri', 'dinhNghiaTuSo', 'dinhNghiaMauSo', 'heSoNhan'];
test('tử/mẫu: thiết lập lại chèn 4 cột vào ChiTieu_TrongBo và DM_ChiTieu đã có dữ liệu kiểu 1b, gieo DM_LoaiGiaTri', () => {
  const { ctx } = quanTri();
  const gio = '2026-11-20T08:00:00+07:00';
  const he = { taoLuc: gio, taoBoi: 'qt@gmail.com', capNhatLuc: gio, capNhatBoi: 'qt@gmail.com', tinhTrang: 'Hoạt động' };
  const dung = {
    ChiTieu_TrongBo: Object.assign({ maTrongBo: 'TU-699:1', maBo: 'TU-699', maGoc: '1', tenNguyenVan: 'Diện tích', tinhTrangHieuLuc: 'Còn hiệu lực' }, he),
    DM_ChiTieu: Object.assign({ maChiTieu: 'CT-1', tenChiTieu: 'Chỉ tiêu một' }, he)
  };
  for (const t of Object.keys(dung)) {
    const cu = ctx.SoDo.BANG[t].cot.filter((c) => !COT_TU_MAU.includes(c.khoa));
    ctx.KhoDuLieu._sheet(t).rows = [cu.map((c) => c.khoa), cu.map((c) => c.ten), cu.map((c) => dung[t][c.khoa] ?? '')];
  }
  const ssDM = ctx.KhoDuLieu._ss('HTTD3_DanhMuc'), cuLGT = ssDM.getSheetByName('DM_LoaiGiaTri');
  if (cuLGT) ssDM.deleteSheet(cuLGT);
  const bc = ctx.ThietLap.thietLapLanDau({ emailQuanTri: 'qt@gmail.com', hoTenQuanTri: 'QT' });
  for (const t of Object.keys(dung)) {
    const sh = ctx.KhoDuLieu._sheet(t), cot = ctx.SoDo.BANG[t].cot;
    assert.deepEqual(sh.rows[0].slice(0, cot.length), cot.map((c) => c.khoa), t + ': ' + bc.join(' | '));
    ctx.KhoDuLieu._xoaCache(t);
  }
  const r = ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:1');
  assert.equal(r.tenNguyenVan, 'Diện tích'); assert.equal(r.tinhTrangHieuLuc, 'Còn hiệu lực'); assert.equal(r.taoLuc, gio); assert.equal(r.loaiGiaTri, '');
  assert.equal(ctx.KhoDuLieu.timDong('DM_ChiTieu', 'CT-1').tenChiTieu, 'Chỉ tiêu một');
  ctx.KhoDuLieu._xoaCache('DM_LoaiGiaTri');
  assert.equal(ctx.KhoDuLieu.docBang('DM_LoaiGiaTri').length, 4);
  const kt = ctx.ThietLap.kiemTraThietLap({ tieuDe: true }).thieu; assert.equal(kt.length, 0, kt.join(', '));
});

test('tử/mẫu: nhập có cảnh báo vẫn ghi; hệ số thành số; ghép sao bốn cột; chi tiết có danh mục loại; file cũ nhập lại giữ nguyên', () => {
  const { ctx, phien } = quanTri();
  const lo = loMau('TU-699', 3, (i) => [
    { loaiGiaTri: 'TY_LE', dinhNghiaTuSo: 'Số hồ sơ đúng hạn', dinhNghiaMauSo: 'Tổng số hồ sơ', heSoNhan: '100' },
    { loaiGiaTri: 'TY_LE' },
    {}
  ][i]);
  const xt = nhap(ctx, phien, 'TU-699', lo, 'xemTruoc');
  assert.equal(xt.ok, true, JSON.stringify(xt).slice(0, 300));
  assert.equal(xt.duLieu.kiemTra.hopLe, true);
  assert.ok(xt.duLieu.kiemTra.canhBao.some((c) => c.dong === 2 && /Chưa quy định phương pháp tính/.test(c.thongBao)), JSON.stringify(xt.duLieu.kiemTra.canhBao));
  const g = nhap(ctx, phien, 'TU-699', lo, 'ghi', 'thử');
  assert.equal(g.ok, true, JSON.stringify(g));
  ctx.KhoDuLieu._xoaCache('ChiTieu_TrongBo');
  const r1 = ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:0001');
  assert.equal(r1.heSoNhan, 100); assert.equal(r1.loaiGiaTri, 'TY_LE');
  const sai = loMau('TU-699', 1, () => ({ loaiGiaTri: 'KHONG_CO' }));
  assert.equal(nhap(ctx, phien, 'TU-699', sai, 'xemTruoc').duLieu.kiemTra.hopLe, false);
  const gp = goi(ctx, { phien, action: 'chiTieu.ghep', duLieu: { maTrongBo: 'TU-699:0001', taoMoi: { maChiTieu: 'TL-01', tenChiTieu: 'Tỷ lệ hồ sơ' } } });
  assert.equal(gp.ok, true, JSON.stringify(gp));
  ctx.KhoDuLieu._xoaCache('DM_ChiTieu');
  const ch = ctx.KhoDuLieu.timDong('DM_ChiTieu', 'TL-01');
  assert.equal(ch.dinhNghiaTuSo, 'Số hồ sơ đúng hạn'); assert.equal(ch.dinhNghiaMauSo, 'Tổng số hồ sơ'); assert.equal(ch.heSoNhan, 100); assert.equal(ch.loaiGiaTri, 'TY_LE');
  const ct = goi(ctx, { phien, action: 'chiTieu.chiTiet', duLieu: { maTrongBo: 'TU-699:0001' } }).duLieu;
  assert.equal(ct.dsLoaiGiaTri.length, 4); assert.ok(ct.dsLoaiGiaTri.some((l) => l.maLoaiGiaTri === 'TY_LE' && l.coTuSoMauSo === true));
  assert.equal(nhap(ctx, phien, 'TT13-BNV', loMau('TT13-BNV', 2), 'ghi', 'x').ok, true);
  const lai = nhap(ctx, phien, 'TT13-BNV', loMau('TT13-BNV', 2), 'ghi', 'x');
  assert.equal(lai.duLieu.soSua, 0, 'file chưa có bốn cột mới nhập lại phải giữ nguyên');
});

test('soát tử/mẫu 1: hệ số gõ dạng chữ trên máy chủ thật — "10.000"→10000, "1,5"→1,5, "10,000"→10000, "mười" lỗi', () => {
  const { ctx, phien } = quanTri();
  const lo = loMau('TU-699', 3, (i) => ({ loaiGiaTri: 'TY_LE', dinhNghiaTuSo: 'A', dinhNghiaMauSo: 'B', heSoNhan: ['10.000', '1,5', '10,000'][i] }));
  const g = nhap(ctx, phien, 'TU-699', lo, 'ghi', 'thử');
  assert.equal(g.ok, true, JSON.stringify(g));
  ctx.KhoDuLieu._xoaCache('ChiTieu_TrongBo');
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:0001').heSoNhan, 10000);
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:0002').heSoNhan, 1.5);
  assert.equal(ctx.KhoDuLieu.timDong('ChiTieu_TrongBo', 'TU-699:0003').heSoNhan, 10000);
  const sai = nhap(ctx, phien, 'TU-699', loMau('TU-699', 1, () => ({ heSoNhan: 'mười' })), 'xemTruoc');
  assert.ok(sai.duLieu.kiemTra.loi.some((l) => l.khoa === 'heSoNhan'), JSON.stringify(sai.duLieu.kiemTra));
});
