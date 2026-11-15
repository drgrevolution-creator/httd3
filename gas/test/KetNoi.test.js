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
  for (const t of ['SoDo', 'KhoDuLieu', 'XacThuc', 'DanhMucGas', 'LichDem', 'ThietLap']) assert.equal(typeof ctx[t], 'object', 'thiếu ' + t);
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
