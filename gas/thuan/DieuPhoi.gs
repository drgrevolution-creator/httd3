/**
 * DieuPhoi — bộ điều phối thuần của API một cửa.
 * xuLy(yeuCau, nguCanh): yeuCau = {phien, action, duLieu}; nguCanh = {layPhien(maPhien), bayGioIso, handlers}.
 * Thứ tự: dữ liệu hợp lệ → action tồn tại → phiên (nếu cần) → quyền → gọi handler trong try/catch.
 */
var DieuPhoi = (function () {
  function _loi(ma, thongBao) { return { ok: false, loi: { ma: ma, thongBao: thongBao } }; }
  // Khi còn dùng mật khẩu tạm, chỉ cho phép các action này.
  var CHO_PHEP_KHI_MAT_KHAU_TAM = ['xacThuc.doiMatKhau', 'xacThuc.dangXuat', 'heThong.khoiDong', 'heThong.sucKhoe'];

  function xuLy(yeuCau, nguCanh) {
    if (!yeuCau || typeof yeuCau !== 'object' || typeof yeuCau.action !== 'string' || !yeuCau.action) return _loi('DU_LIEU_KHONG_HOP_LE', 'Yêu cầu phải có action');
    var action = yeuCau.action;
    if (!PhanQuyen.tonTai(action)) return _loi('ACTION_KHONG_TON_TAI', 'Không có action ' + action);
    var phien = null;
    if (PhanQuyen.canPhien(action)) {
      phien = yeuCau.phien ? nguCanh.layPhien(yeuCau.phien) : null;
      if (!Phien.conHan(phien, nguCanh.bayGioIso)) return _loi('PHIEN_HET_HAN', 'Phiên không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại');
      if (!PhanQuyen.duocPhep(phien.vaiTro, action)) return _loi('KHONG_CO_QUYEN', 'Tài khoản không có quyền thực hiện thao tác này');
      if (phien.batBuocDoiMatKhau && CHO_PHEP_KHI_MAT_KHAU_TAM.indexOf(action) < 0) return _loi('KHONG_CO_QUYEN', 'Bạn đang dùng mật khẩu tạm, hãy đổi mật khẩu trước khi thao tác');
    }
    var handler = nguCanh.handlers && nguCanh.handlers[action];
    if (typeof handler !== 'function') return _loi('ACTION_KHONG_TON_TAI', 'Chưa cài đặt action ' + action);
    try {
      var kq = handler(yeuCau.duLieu || {}, phien);
      return { ok: true, duLieu: kq === undefined ? null : kq };
    } catch (e) {
      if (e && e.ma) return _loi(e.ma, e.thongBao || (e.message || '').replace(/^[A-Z_]+:\s*/, ''));
      console.error('[' + action + '] ' + ((e && e.stack) || e));   // để chẩn đoán trên Execution log
      return _loi('LOI_HE_THONG', 'Hệ thống gặp lỗi khi xử lý ' + action + '. Vui lòng thử lại hoặc báo quản trị.');
    }
  }

  return { xuLy: xuLy };
})();
