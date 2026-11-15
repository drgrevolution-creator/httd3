/**
 * LichDem — việc chạy theo lịch: sao lưu 01:00, kiểm tra toàn vẹn 02:00, và cài đặt lịch.
 */
var LichDem = (function () {
  // Tham chiếu LƯỜI tới KhoDuLieu: Apps Script nạp file theo thứ tự tên, KhoDuLieu có thể chưa tồn tại lúc file này nạp.
  function _loi(ma, thongBao, chiTiet) { return KhoDuLieu._loi(ma, thongBao, chiTiet); }
  var TEN_HAM_SAO_LUU = 'saoLuuHangDem', TEN_HAM_TOAN_VEN = 'kiemTraToanVenHangDem';

  function _props() { return PropertiesService.getScriptProperties(); }
  function _thuMuc(khoa) {
    var id = _props().getProperty(khoa);
    if (!id) throw _loi('CHUA_THIET_LAP', 'Chưa có thư mục ' + khoa + '. Chạy ThietLap.thietLapLanDau.');
    return DriveApp.getFolderById(id);
  }
  // Gửi email cảnh báo cho quản trị nếu có cấu hình emailQuanTri; không ném lỗi.
  function _baoQuanTri(tieuDe, noiDung) {
    try {
      var email = KhoDuLieu.docCauHinh().emailQuanTri;
      if (email) MailApp.sendEmail(email, '[HTTD 3.0] ' + tieuDe, noiDung);
    } catch (e) { console.error('Không gửi được email cảnh báo: ' + e); }
  }

  // Sao lưu ba file Sheets vào HTTD3/SaoLuu, dọn bản cũ theo quy tắc SaoLuu.canXoa. Trả danh sách kết quả.
  function saoLuuHangDem() {
    var kq = [], homNay = KhoDuLieu.bayGioIso(), thuMuc = null;
    try { thuMuc = _thuMuc('ID_THU_MUC_SAO_LUU'); } catch (e) {
      SoDo.FILE.forEach(function (ten) { var d = { thoiGian: homNay, tenFileGoc: ten, tenFileSaoLuu: '', fileId: '', ketQua: 'LOI', ghiChu: 'Không mở được thư mục sao lưu: ' + (e.thongBao || e.message) }; KhoDuLieu.themDongThang('SaoLuu', d); kq.push(d); });
      _baoQuanTri('Sao lưu đêm thất bại: không mở được thư mục sao lưu', String(e.thongBao || e.message));
      return kq;
    }
    SoDo.FILE.forEach(function (ten) {
      var dong = { thoiGian: homNay, tenFileGoc: ten, tenFileSaoLuu: SaoLuu.tenFile(ten, homNay), fileId: '', ketQua: 'OK', ghiChu: '' };
      try {
        var f = DriveApp.getFileById(KhoDuLieu.idFile(ten)).makeCopy(dong.tenFileSaoLuu, thuMuc);
        dong.fileId = f.getId();
      } catch (e) { dong.ketQua = 'LOI'; dong.ghiChu = String(e && e.message || e); }
      KhoDuLieu.themDongThang('SaoLuu', dong);
      kq.push(dong);
    });
    // Dọn bản cũ
    try {
      var files = [], it = thuMuc.getFiles();
      while (it.hasNext()) { var x = it.next(); files.push({ ten: x.getName(), file: x }); }
      SaoLuu.canXoa(files, homNay).forEach(function (f) { f.file.setTrashed(true); });
    } catch (e) { kq.push({ ketQua: 'LOI', ghiChu: 'Dọn bản cũ: ' + e }); }
    var loi = kq.filter(function (d) { return d.ketQua === 'LOI'; });
    if (loi.length) _baoQuanTri('Sao lưu đêm có lỗi', loi.map(function (d) { return (d.tenFileGoc || '') + ': ' + d.ghiChu; }).join('\n'));
    KhoDuLieu.ghiNhatKy({ hanhDong: 'SAO_LUU', bang: 'SaoLuu', ma: homNay.slice(0, 10), canCu: loi.length ? loi.length + ' lỗi' : 'OK' });
    return kq;
  }

  // Kiểm tra toàn vẹn mọi bảng danh mục và nghiệp vụ; ghi KiemTraToanVen; email nếu lệch.
  function kiemTraToanVenHangDem() {
    var gio = KhoDuLieu.bayGioIso(), duLieu = {};
    SoDo.danhSachBang('danhmuc').concat(SoDo.danhSachBang('nghiepvu')).forEach(function (t) {
      if (t === 'BoDem') return;
      try { duLieu[t] = KhoDuLieu.docBang(t, { baoGomXoaMem: true }); } catch (e) { /* bảng thiếu sẽ do kiemTraThietLap báo */ }
    });
    var lech = ToanVen.kiemTra(duLieu);
    KhoDuLieu.themDongThang('KiemTraToanVen', { thoiGian: gio, quanHe: 'TONG_KET', bang: '', ma: '', giaTriHienTai: String(lech.length), giaTriDung: '0', ketQua: lech.length ? 'LECH' : 'DAT', ghiChu: 'Lần chạy ' + gio + ' — ' + lech.length + ' chỗ lệch' });
    lech.slice(0, 500).forEach(function (l) { KhoDuLieu.themDongThang('KiemTraToanVen', Object.assign({ thoiGian: gio }, l)); });
    if (lech.length) _baoQuanTri('Kiểm tra toàn vẹn: ' + lech.length + ' chỗ lệch', lech.slice(0, 50).map(function (l) { return l.quanHe + ' ' + l.bang + ' ' + l.ma + ': ' + l.giaTriHienTai + ' (đúng: ' + l.giaTriDung + ')'; }).join('\n'));
    KhoDuLieu.ghiNhatKy({ hanhDong: 'TOAN_VEN', bang: 'KiemTraToanVen', ma: gio.slice(0, 10), canCu: lech.length + ' chỗ lệch' });
    return { soLech: lech.length, lech: lech.slice(0, 50) };
  }

  // Xóa trigger cũ của hai hàm rồi tạo lại: sao lưu 01:00, toàn vẹn 02:00 hằng ngày.
  function caiDatLich() {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === TEN_HAM_SAO_LUU || t.getHandlerFunction() === TEN_HAM_TOAN_VEN) ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger(TEN_HAM_SAO_LUU).timeBased().everyDays(1).atHour(1).create();
    ScriptApp.newTrigger(TEN_HAM_TOAN_VEN).timeBased().everyDays(1).atHour(2).create();
    return { daCai: [TEN_HAM_SAO_LUU + ' 01:00', TEN_HAM_TOAN_VEN + ' 02:00'] };
  }

  // Quản trị chạy tay một việc theo lịch.
  function chayNgay(d, phien) {
    if (d.ten === 'saoLuu') return saoLuuHangDem();
    if (d.ten === 'toanVen') return kiemTraToanVenHangDem();
    if (d.ten === 'caiDatLich') return caiDatLich();
    throw _loi('DU_LIEU_KHONG_HOP_LE', 'ten phải là saoLuu, toanVen hoặc caiDatLich');
  }

  var HANDLERS = { 'lich.chayNgay': chayNgay };
  return { HANDLERS: HANDLERS, saoLuuHangDem: saoLuuHangDem, kiemTraToanVenHangDem: kiemTraToanVenHangDem, caiDatLich: caiDatLich };
})();

// Hai hàm toàn cục để trigger gọi được theo tên.
function saoLuuHangDem() { return LichDem.saoLuuHangDem(); }
function kiemTraToanVenHangDem() { return LichDem.kiemTraToanVenHangDem(); }
