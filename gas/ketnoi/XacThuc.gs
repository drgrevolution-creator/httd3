/**
 * XacThuc — đăng nhập Google (thẻ định danh), đăng nhập mật khẩu, phiên, đổi mật khẩu, khởi động, sức khỏe.
 */
var XacThuc = (function () {
  var TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo?id_token=';
  var GIAY_CACHE = 21600; // 6 giờ, tối đa của CacheService
  var _loi = KhoDuLieu._loi;

  // SHA-256 dạng hex bằng Utilities (tiêm vào lớp thuần MatKhau).
  function sha256Hex(s) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
      .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  }
  // 32 ký tự hex ngẫu nhiên từ UUID v4.
  function ngauNhienHex32() { return Utilities.getUuid().replace(/-/g, '').toLowerCase(); }
  // Mật khẩu tạm 10 ký tự có chữ và số, tránh ký tự dễ nhầm.
  function taoMatKhauTam() {
    var chu = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', so = '23456789', tat = chu + so, s = '';
    for (var i = 0; i < 8; i++) s += tat.charAt(Math.floor(Math.random() * tat.length));
    return s + so.charAt(Math.floor(Math.random() * so.length)) + chu.charAt(Math.floor(Math.random() * chu.length));
  }

  function _cache() { return CacheService.getScriptCache(); }
  function _khoaCache(maPhien) { return 'phien:' + maPhien; }

  // Lấy phiên theo mã: cache trước, sheet PhienDangNhap sau. Trả null nếu không có.
  function layPhien(maPhien) {
    if (!maPhien) return null;
    var s = _cache().get(_khoaCache(maPhien));
    if (s) { try { return JSON.parse(s); } catch (e) { /* bỏ qua, đọc sheet */ } }
    var p = KhoDuLieu.timDong('PhienDangNhap', maPhien);
    if (p) _cache().put(_khoaCache(maPhien), JSON.stringify(p), GIAY_CACHE);
    return p;
  }
  function _luuPhien(p) { KhoDuLieu.themDongThang('PhienDangNhap', p); _cache().put(_khoaCache(p.maPhien), JSON.stringify(p), GIAY_CACHE); }
  function _thuHoiPhien(maPhien, phienThucHien) {
    KhoDuLieu.capNhatDong('PhienDangNhap', maPhien, { trangThaiPhien: 'thuHoi' }, phienThucHien, 'thu hồi phiên', { hanhDong: 'KHAC' });
    _cache().remove(_khoaCache(maPhien));
  }
  function _phienCuaNguoi(maNguoiDung) {
    return KhoDuLieu.docBang('PhienDangNhap').filter(function (p) { return p.maNguoiDung === maNguoiDung && p.trangThaiPhien === 'hoatDong'; });
  }

  function _timNguoiDung(ham) { return KhoDuLieu.docBang('DM_NguoiDung').filter(ham)[0] || null; }
  function _anNguoiDung(nd) { return Bang.anCotNhayCam('DM_NguoiDung', nd); }

  // Hoàn tất đăng nhập: tạo phiên, giới hạn 5 phiên, cập nhật người dùng, nhật ký.
  function _hoanTatDangNhap(nd, thietBi, cach) {
    if (nd.trangThai !== 'Hoạt động') throw _loi('KHONG_CO_QUYEN', 'Tài khoản đang bị khóa, liên hệ quản trị');
    var gio = KhoDuLieu.bayGioIso();
    var p = Phien.tao({ nguoiDung: nd, bayGioIso: gio, thietBi: thietBi || '', ngauNhienHex32: ngauNhienHex32() });
    Phien.gioiHan(_phienCuaNguoi(nd.maNguoiDung).concat([p])).forEach(function (cu) { if (cu.maPhien !== p.maPhien) _thuHoiPhien(cu.maPhien, p); });
    _luuPhien(p);
    KhoDuLieu.capNhatDong('DM_NguoiDung', nd.maNguoiDung, { lanDangNhapCuoi: gio, soLanSai: 0, khoaDen: '' }, p, 'đăng nhập ' + cach, { hanhDong: 'DANG_NHAP' });
    return { maPhien: p.maPhien, hetHanLuc: p.hetHanLuc, nguoiDung: _anNguoiDung(KhoDuLieu.timDong('DM_NguoiDung', nd.maNguoiDung)) };
  }

  // Đăng nhập bằng thẻ định danh Google do Google Identity Services cấp cho trang.
  function dangNhapGoogle(d) {
    if (!d || !d.idToken) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Thiếu thẻ định danh Google');
    var clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
    if (!clientId) throw _loi('CHUA_THIET_LAP', 'Chưa cấu hình GOOGLE_CLIENT_ID trong Script Properties');
    var resp = UrlFetchApp.fetch(TOKENINFO + encodeURIComponent(d.idToken), { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) throw _loi('KHONG_CO_QUYEN', 'Thẻ Google không hợp lệ hoặc đã hết hạn, hãy đăng nhập lại');
    var kq = Phien.kiemTraTheGoogle(JSON.parse(resp.getContentText()), { clientId: clientId, bayGioGiay: Math.floor(Date.now() / 1000) });
    if (!kq.hopLe) throw _loi('KHONG_CO_QUYEN', 'Thẻ Google không hợp lệ (' + kq.loi + '), hãy đăng nhập lại');
    var nd = _timNguoiDung(function (u) { return String(u.email || '').toLowerCase() === kq.email; });
    if (!nd) throw _loi('KHONG_CO_QUYEN', 'Email ' + kq.email + ' chưa được cấp tài khoản. Liên hệ quản trị để được thêm.');
    return _hoanTatDangNhap(nd, d.thietBi, 'Google');
  }

  // Đăng nhập bằng tên đăng nhập và mật khẩu (dự phòng).
  function dangNhapMatKhau(d) {
    if (!d || !d.tenDangNhap || !d.matKhau) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Nhập tên đăng nhập và mật khẩu');
    var ten = String(d.tenDangNhap).trim().toLowerCase();
    var nd = _timNguoiDung(function (u) { return String(u.tenDangNhap || '').toLowerCase() === ten; });
    var gio = KhoDuLieu.bayGioIso();
    if (!nd) { KhoDuLieu.ghiNhatKy({ hanhDong: 'DANG_NHAP_SAI', bang: 'DM_NguoiDung', ma: ten, canCu: 'không có tài khoản' }); throw _loi('KHONG_CO_QUYEN', 'Tên đăng nhập hoặc mật khẩu không đúng'); }
    if (nd.khoaDen && ThoiGian.truoc(gio, nd.khoaDen)) throw _loi('KHONG_CO_QUYEN', 'Tài khoản bị khóa đến ' + nd.khoaDen.slice(11, 16) + ' do nhập sai nhiều lần');
    if (!nd.matKhauBam) throw _loi('KHONG_CO_QUYEN', 'Tài khoản chưa có mật khẩu. Hãy đăng nhập bằng Google hoặc nhờ quản trị đặt lại mật khẩu');
    if (!MatKhau.khop(d.matKhau, nd.muoi, nd.matKhauBam, sha256Hex)) {
      var sai = (Number(nd.soLanSai) || 0) + 1, k = MatKhau.tinhKhoa(sai, gio);
      KhoDuLieu.capNhatDong('DM_NguoiDung', nd.maNguoiDung, { soLanSai: sai, khoaDen: k.khoaDen || '' }, null, 'sai mật khẩu lần ' + sai, { hanhDong: 'DANG_NHAP_SAI' });
      throw _loi('KHONG_CO_QUYEN', k.khoaDen ? 'Sai ' + sai + ' lần, tài khoản bị khóa 15 phút' : 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
    var kq = _hoanTatDangNhap(nd, d.thietBi, 'mật khẩu');
    kq.batBuocDoiMatKhau = !!nd.batBuocDoiMatKhau;
    return kq;
  }

  function dangXuat(d, phien) {
    _thuHoiPhien(phien.maPhien, phien);
    KhoDuLieu.ghiNhatKy({ phien: phien, hanhDong: 'DANG_XUAT', bang: 'PhienDangNhap', ma: phien.maPhien });
    return { daDangXuat: true };
  }

  // Đổi mật khẩu của chính mình.
  function doiMatKhau(d, phien) {
    var nd = KhoDuLieu.timDong('DM_NguoiDung', phien.maNguoiDung);
    if (!nd) throw _loi('KHONG_TIM_THAY', 'Không tìm thấy tài khoản');
    if (nd.matKhauBam && !MatKhau.khop(d.matKhauCu || '', nd.muoi, nd.matKhauBam, sha256Hex)) throw _loi('KHONG_CO_QUYEN', 'Mật khẩu cũ không đúng');
    var yc = MatKhau.datYeuCau(d.matKhauMoi);
    if (!yc.hopLe) throw _loi('DU_LIEU_KHONG_HOP_LE', yc.loi.join('; '));
    var muoi = ngauNhienHex32();
    KhoDuLieu.capNhatDong('DM_NguoiDung', nd.maNguoiDung, { matKhauBam: MatKhau.bam(d.matKhauMoi, muoi, sha256Hex), muoi: muoi, phienBanBam: 2, batBuocDoiMatKhau: false }, phien, 'người dùng tự đổi', { hanhDong: 'DOI_MAT_KHAU' });
    return { daDoi: true };
  }

  // Đặt mật khẩu tạm cho một người dùng (quản trị gọi, hoặc khi tạo mới). Trả mật khẩu tạm.
  function datMatKhauTam(maNguoiDung, phien, lyDo) {
    var tam = taoMatKhauTam(), muoi = ngauNhienHex32();
    KhoDuLieu.capNhatDong('DM_NguoiDung', maNguoiDung, { matKhauBam: MatKhau.bam(tam, muoi, sha256Hex), muoi: muoi, phienBanBam: 2, batBuocDoiMatKhau: true, soLanSai: 0, khoaDen: '' }, phien, lyDo || 'đặt lại mật khẩu', { hanhDong: 'DAT_LAI_MAT_KHAU' });
    _phienCuaNguoi(maNguoiDung).forEach(function (p) { _thuHoiPhien(p.maPhien, phien); });
    return tam;
  }

  // Dữ liệu khởi động cho trang: người dùng, sơ đồ danh mục (không cột ẩn), cấu hình.
  function khoiDong(d, phien) {
    var nd = KhoDuLieu.timDong('DM_NguoiDung', phien.maNguoiDung);
    var soDo = SoDo.danhSachBang('danhmuc').map(function (t) {
      var b = SoDo.BANG[t];
      return { bang: t, ten: b.ten, tienToMa: b.tienToMa, dinhDangMa: b.dinhDangMa, khoaChinh: SoDo.khoaChinh(t), cot: b.cot.filter(function (c) { return !c.an; }) };
    });
    return { nguoiDung: nd ? _anNguoiDung(nd) : null, phien: { maPhien: phien.maPhien, hetHanLuc: phien.hetHanLuc, vaiTro: phien.vaiTro, danhSachDonVi: phien.danhSachDonVi }, soDoDanhMuc: soDo, cauHinh: KhoDuLieu.docCauHinh() };
  }

  // Sức khỏe hệ thống; không ném lỗi khi chưa thiết lập.
  function sucKhoe() {
    var kq = { phienBan: '3.0.0-gd1', gio: KhoDuLieu.bayGioIso(), daThietLap: true };
    try {
      var ch = KhoDuLieu.docCauHinh(); kq.phienBan = ch.phienBan || kq.phienBan;
      var sl = KhoDuLieu.docBang('SaoLuu'); kq.saoLuuCuoi = sl.length ? sl[sl.length - 1] : null;
      var tv = KhoDuLieu.docBang('KiemTraToanVen').filter(function (r) { return r.quanHe === 'TONG_KET'; }); kq.toanVenCuoi = tv.length ? tv[tv.length - 1] : null;
      if (typeof ThietLap !== 'undefined') kq.thieu = ThietLap.kiemTraThietLap().thieu;
    } catch (e) { kq.daThietLap = false; kq.loi = e.thongBao || e.message; }
    return kq;
  }

  var HANDLERS = {
    'xacThuc.dangNhapGoogle': dangNhapGoogle, 'xacThuc.dangNhapMatKhau': dangNhapMatKhau, 'xacThuc.dangXuat': dangXuat, 'xacThuc.doiMatKhau': doiMatKhau,
    'heThong.khoiDong': khoiDong, 'heThong.sucKhoe': sucKhoe
  };
  return { HANDLERS: HANDLERS, layPhien: layPhien, sha256Hex: sha256Hex, ngauNhienHex32: ngauNhienHex32, taoMatKhauTam: taoMatKhauTam, datMatKhauTam: datMatKhauTam };
})();
