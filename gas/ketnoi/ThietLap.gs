/**
 * ThietLap — thiết lập lần đầu: tạo ba file Sheets, mọi sheet, thư mục Drive, gieo danh mục,
 * tài khoản quản trị đầu tiên, khóa API Claude, lịch đêm. Chạy lại an toàn (chỉ thêm phần còn thiếu).
 *
 * CÁCH CHẠY (một lần, trong trình soạn Apps Script):
 *   1. Mở Project Settings → Script Properties, thêm EMAIL_QUAN_TRI = <Gmail của bạn>, HO_TEN_QUAN_TRI = <Họ tên>.
 *   2. Chọn hàm chayThietLapLanDau rồi bấm Run; cấp quyền khi được hỏi.
 *   3. Đọc Execution log: mật khẩu tạm của tài khoản 'quantri' in ra MỘT LẦN.
 */
var ThietLap = (function () {
  // Tham chiếu LƯỜI tới KhoDuLieu: Apps Script nạp file theo thứ tự tên, KhoDuLieu có thể chưa tồn tại lúc file này nạp.
  function _loi(ma, thongBao, chiTiet) { return KhoDuLieu._loi(ma, thongBao, chiTiet); }
  var KIEU_CHU = { text: 1, textarea: 1, email: 1, json: 1, multiselect: 1, date: 1, datetime: 1, select: 1, ref: 1 };
  function _props() { return PropertiesService.getScriptProperties(); }

  // Thư mục con theo đường dẫn trong thư mục gốc HTTD3; tạo nếu chưa có.
  function _thuMucCon(cha, ten) { var it = cha.getFoldersByName(ten); return it.hasNext() ? it.next() : cha.createFolder(ten); }

  // Tạo (hoặc lấy) sheet của một bảng với hai dòng tiêu đề, định dạng cột, đóng băng.
  function _taoSheet(ss, tenBang) {
    var sh = ss.getSheetByName(tenBang), moi = false;
    if (!sh) { sh = ss.insertSheet(tenBang); moi = true; }
    var cot = SoDo.BANG[tenBang].cot, td = Bang.dongTieuDe(tenBang);
    // Sheet đã có dữ liệu mà tiêu đề khác sơ đồ: KHÔNG ghi đè (tránh lệch cột dữ liệu), chỉ cảnh báo.
    if (!moi && sh.getLastRow() >= 3) {
      var hienCo = sh.getRange(1, 1, 1, Math.min(sh.getMaxColumns(), cot.length)).getValues()[0].map(String);
      var khop = td[0].every(function (k, i) { return hienCo[i] === k; });
      if (!khop) { var cb = 'CẢNH BÁO ' + tenBang + ': tiêu đề hiện có khác sơ đồ, không ghi đè vì sheet đã có dữ liệu'; console.log(cb); return { canhBao: cb }; }
      return { moi: false };
    }
    if (sh.getMaxColumns() < cot.length) sh.insertColumnsAfter(sh.getMaxColumns(), cot.length - sh.getMaxColumns());  // sheet mới chỉ có 26 cột
    sh.getRange(1, 1, 2, cot.length).setValues(td);
    sh.getRange(1, 1, 1, cot.length).setFontWeight('bold').setBackground('#e8eaed');
    sh.getRange(2, 1, 1, cot.length).setFontStyle('italic').setFontColor('#5f6368');
    sh.setFrozenRows(2);
    // Định dạng chữ cho cột chữ trên 5.000 dòng đầu (dòng ghi sau vẫn được đặt lại định dạng khi ghi).
    cot.forEach(function (c, i) { if (KIEU_CHU[c.kieu]) sh.getRange(3, i + 1, 5000, 1).setNumberFormat('@'); });
    return { moi: moi };
  }

  // Tạo hoặc lấy file Sheets theo tên; lưu ID vào Script Properties.
  function _taoFile(tenFile, thuMucGoc) {
    var id = _props().getProperty('ID_' + tenFile), ss;
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
    if (!ss) {
      ss = SpreadsheetApp.create(tenFile);
      DriveApp.getFileById(ss.getId()).moveTo(thuMucGoc);
      _props().setProperty('ID_' + tenFile, ss.getId());
    }
    var cacBang = SoDo.danhSachBang().filter(function (t) { return SoDo.BANG[t].file === tenFile; });
    var canhBao = [];
    cacBang.forEach(function (t) { var kq = _taoSheet(ss, t); if (kq && kq.canhBao) canhBao.push(kq.canhBao); });
    // Bảng cũ đã bỏ khỏi sơ đồ: xóa nếu còn trống (chỉ có 2 dòng tiêu đề)
    ['ChiTieu_NguonQuyDinh'].forEach(function (ten) { var s = ss.getSheetByName(ten); if (s && s.getLastRow() <= 2 && ss.getSheets().length > 1) ss.deleteSheet(s); });
    ss.__canhBao = canhBao;
    // Xóa sheet mặc định "Sheet1"/"Trang tính1" nếu còn và không phải bảng
    ss.getSheets().forEach(function (s) { if (/^(Sheet1|Trang tính1)$/.test(s.getName()) && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s); });
    return ss;
  }

  // Gieo một bảng danh mục nếu bảng còn trống.
  function _gieo(tenBang, ds) {
    KhoDuLieu._xoaCache(tenBang);
    if (KhoDuLieu.docBang(tenBang, { baoGomXoaMem: true }).length) return 0;
    var sh = KhoDuLieu._sheet(tenBang), gio = KhoDuLieu.bayGioIso(), cot = SoDo.BANG[tenBang].cot;
    var dong = ds.map(function (r) {
      var o = Object.assign({}, r); cot.forEach(function (c) { if (o[c.khoa] === undefined && c.macDinh !== undefined) o[c.khoa] = c.macDinh; });
      o.taoLuc = gio; o.taoBoi = 'thiet-lap'; o.capNhatLuc = gio; o.capNhatBoi = 'thiet-lap'; o.tinhTrang = 'Hoạt động';
      return Bang.thanhDong(tenBang, o);
    });
    if (dong.length) sh.getRange(3, 1, dong.length, cot.length).setValues(dong);
    KhoDuLieu._xoaCache(tenBang);
    return dong.length;
  }

  // Thiết lập lần đầu. tuyChon = {emailQuanTri, hoTenQuanTri}.
  function thietLapLanDau(tuyChon) {
    var emailQT = String((tuyChon && tuyChon.emailQuanTri) || _props().getProperty('EMAIL_QUAN_TRI') || '').trim().toLowerCase();
    var hoTenQT = (tuyChon && tuyChon.hoTenQuanTri) || _props().getProperty('HO_TEN_QUAN_TRI') || 'Quản trị hệ thống';
    if (!emailQT) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Cần EMAIL_QUAN_TRI (Script Properties) hoặc tuyChon.emailQuanTri');
    var baoCao = [];

    // 1. Thư mục Drive
    var goc; var idGoc = _props().getProperty('ID_THU_MUC_GOC');
    if (idGoc) { try { goc = DriveApp.getFolderById(idGoc); } catch (e) { goc = null; } }
    if (!goc) { var it = DriveApp.getRootFolder().getFoldersByName('HTTD3'); goc = it.hasNext() ? it.next() : DriveApp.createFolder('HTTD3'); _props().setProperty('ID_THU_MUC_GOC', goc.getId()); }
    var mc = _thuMucCon(goc, 'MinhChung'), sl = _thuMucCon(goc, 'SaoLuu'), xd = _thuMucCon(goc, 'XuatDuLieu'), ht = _thuMucCon(goc, 'HopThuClaude');
    _props().setProperties({ ID_THU_MUC_MINH_CHUNG: mc.getId(), ID_THU_MUC_SAO_LUU: sl.getId(), ID_THU_MUC_XUAT: xd.getId(), ID_THU_MUC_HOP_THU: ht.getId(),
      ID_THU_MUC_HOP_THU_CHO_NHAP: _thuMucCon(ht, 'ChoNhap').getId(), ID_THU_MUC_HOP_THU_DA_NHAP: _thuMucCon(ht, 'DaNhap').getId(), ID_THU_MUC_HOP_THU_KET_QUA: _thuMucCon(ht, 'KetQua').getId() });
    baoCao.push('Thư mục Drive: HTTD3/' + goc.getId());

    // 2. Ba file Sheets và mọi bảng
    SoDo.FILE.forEach(function (ten) { var ss = _taoFile(ten, goc); baoCao.push('File ' + ten + ': ' + _props().getProperty('ID_' + ten)); (ss.__canhBao || []).forEach(function (cb) { baoCao.push(cb); }); });

    // 3. Gieo danh mục
    Object.keys(DuLieuGieo.BANG).forEach(function (t) { var n = _gieo(t, DuLieuGieo.BANG[t]); if (n) baoCao.push('Gieo ' + t + ': ' + n + ' dòng'); });
    var nCT = _gieo('DM_CauTruc', DuLieuGieo.cauTruc()); if (nCT) baoCao.push('Gieo DM_CauTruc: ' + nCT + ' dòng');
    // emailQuanTri trong CauHinh
    var ch = KhoDuLieu.timDong('CauHinh', 'emailQuanTri');
    if (ch && ch.giaTri !== emailQT) KhoDuLieu.capNhatDong('CauHinh', 'emailQuanTri', { giaTri: emailQT }, null, 'thiết lập', { hanhDong: 'THIET_LAP' });

    // 4. Tài khoản quản trị đầu tiên
    var daCo = KhoDuLieu.docBang('DM_NguoiDung').some(function (u) { return String(u.email || '').toLowerCase() === emailQT || u.tenDangNhap === 'quantri'; });
    if (!daCo) {
      var tam = XacThuc.taoMatKhauTam(), muoi = XacThuc.ngauNhienHex32();
      KhoDuLieu.themDong('DM_NguoiDung', { tenDangNhap: 'quantri', hoTen: hoTenQT, email: emailQT, vaiTro: ['QUANTRI', 'CHUYENVIEN'], danhSachDonVi: ['DV03'], linhVucPhuTrach: ['CCHC', 'CDS', 'KHCN', 'DMST', 'SHTT', 'TDC', 'TTTT'],
        matKhauBam: MatKhau.bam(tam, muoi, XacThuc.sha256Hex), muoi: muoi, phienBanBam: 2, batBuocDoiMatKhau: true, soLanSai: 0, trangThai: 'Hoạt động' }, null, 'thiết lập lần đầu');
      baoCao.push('Tài khoản quantri (' + emailQT + ') — MẬT KHẨU TẠM (chỉ hiện một lần): ' + tam);
    } else baoCao.push('Tài khoản quản trị đã có, không tạo lại');

    // 5. Khóa API cho Claude (đường B) nếu chưa có
    if (!_props().getProperty('KHOA_API_CLAUDE')) { _props().setProperty('KHOA_API_CLAUDE', XacThuc.ngauNhienHex32() + XacThuc.ngauNhienHex32()); baoCao.push('Đã tạo KHOA_API_CLAUDE (xem trong Script Properties)'); }

    // 6. Lịch đêm
    baoCao.push('Lịch: ' + LichDem.caiDatLich().daCai.join(', '));
    KhoDuLieu.ghiNhatKy({ hanhDong: 'THIET_LAP', bang: '', ma: '', canCu: baoCao.filter(function (s) { return s.indexOf('MẬT KHẨU') < 0; }).join(' | ') });
    baoCao.forEach(function (s) { console.log(s); });
    return baoCao;
  }

  // Những gì còn thiếu để hệ thống chạy được.
  function kiemTraThietLap() {
    var thieu = [];
    SoDo.FILE.forEach(function (ten) { if (!_props().getProperty('ID_' + ten)) thieu.push('ID_' + ten); });
    ['ID_THU_MUC_GOC', 'ID_THU_MUC_SAO_LUU', 'ID_THU_MUC_MINH_CHUNG', 'ID_THU_MUC_HOP_THU_CHO_NHAP', 'GOOGLE_CLIENT_ID', 'KHOA_API_CLAUDE'].forEach(function (k) { if (!_props().getProperty(k)) thieu.push(k); });
    if (!thieu.some(function (k) { return k.indexOf('ID_HTTD3') === 0; })) {
      SoDo.danhSachBang().forEach(function (t) { try { KhoDuLieu._sheet(t); } catch (e) { thieu.push('sheet ' + t); } });
    }
    var cacTrigger = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
    if (cacTrigger.indexOf('saoLuuHangDem') < 0) thieu.push('trigger saoLuuHangDem');
    if (cacTrigger.indexOf('kiemTraToanVenHangDem') < 0) thieu.push('trigger kiemTraToanVenHangDem');
    return { thieu: thieu };
  }

  return { thietLapLanDau: thietLapLanDau, kiemTraThietLap: kiemTraThietLap };
})();

// Hàm toàn cục để chọn và Run trong trình soạn Apps Script.
function chayThietLapLanDau() { return ThietLap.thietLapLanDau(); }
function chayKiemTraThietLap() { var kq = ThietLap.kiemTraThietLap(); console.log(JSON.stringify(kq)); return kq; }
