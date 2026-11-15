/**
 * MaSo — sinh mã tăng dần theo định dạng khai báo trong SoDo (SO-4, SO-6, NAM-4) và kiểm tra mã hợp lệ.
 * Lớp thuần. Bộ đếm (soHienTai, nam) do lớp kết nối lưu trong sheet BoDem.
 */
var MaSo = (function () {
  var RE_TU_NHAP = /^[A-Za-z0-9._-]{2,30}$/;

  // Đệm số 0 bên trái cho đủ n chữ số.
  function _dem(so, n) { var s = String(so); while (s.length < n) s = '0' + s; return s; }

  /**
   * Sinh mã tiếp theo cho bảng.
   * boDem = {soHienTai, nam, namHienTai}; namHienTai mặc định là năm hiện tại.
   * Trả {ma, soMoi, nam}. Bảng TU_NHAP ném lỗi có ma = 'MA_TU_NHAP'.
   */
  function sinh(tenBang, boDem) {
    var b = SoDo.BANG[tenBang];
    if (!b) throw _loi('KHONG_TIM_THAY', 'Không có bảng ' + tenBang);
    var soHienTai = (boDem && boDem.soHienTai) || 0;
    switch (b.dinhDangMa) {
      case 'SO-4': return { ma: b.tienToMa + '-' + _dem(soHienTai + 1, 4), soMoi: soHienTai + 1, nam: (boDem && boDem.nam) || null };
      case 'SO-6': return { ma: b.tienToMa + '-' + _dem(soHienTai + 1, 6), soMoi: soHienTai + 1, nam: (boDem && boDem.nam) || null };
      case 'NAM-4': {
        var namHienTai = (boDem && boDem.namHienTai) || new Date().getFullYear();
        var soMoi = (boDem && boDem.nam === namHienTai) ? soHienTai + 1 : 1;
        return { ma: b.tienToMa + '-' + namHienTai + '-' + _dem(soMoi, 4), soMoi: soMoi, nam: namHienTai };
      }
      default: throw _loi('MA_TU_NHAP', 'Bảng ' + tenBang + ' dùng mã tự nhập, không sinh tự động');
    }
  }

  // Mã có đúng định dạng của bảng không.
  function hopLe(tenBang, ma) {
    var b = SoDo.BANG[tenBang];
    if (!b || typeof ma !== 'string') return false;
    var t = b.tienToMa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    switch (b.dinhDangMa) {
      case 'SO-4': return new RegExp('^' + t + '-\\d{4,}$').test(ma);
      case 'SO-6': return new RegExp('^' + t + '-\\d{6,}$').test(ma);
      case 'NAM-4': return new RegExp('^' + t + '-\\d{4}-\\d{4,}$').test(ma);
      default: return RE_TU_NHAP.test(ma);
    }
  }

  function _loi(ma, thongBao) { var e = new Error(ma + ': ' + thongBao); e.ma = ma; return e; }

  return { sinh: sinh, hopLe: hopLe };
})();
