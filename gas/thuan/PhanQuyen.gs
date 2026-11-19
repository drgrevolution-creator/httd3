/**
 * PhanQuyen — bảng action → vai trò được phép. Lớp thuần.
 * '*' = không cần phiên; '@' = cần phiên, bất kỳ vai trò; còn lại là danh sách vai trò.
 */
var PhanQuyen = (function () {
  var BANG = {
    'xacThuc.dangNhapGoogle': ['*'],
    'xacThuc.dangNhapMatKhau': ['*'],
    'xacThuc.dangXuat': ['@'],
    'xacThuc.doiMatKhau': ['@'],
    'heThong.khoiDong': ['@'],
    'heThong.sucKhoe': ['*'],
    'danhMuc.doc': ['@'],
    'danhMuc.them': ['QUANTRI'],
    'danhMuc.sua': ['QUANTRI'],
    'danhMuc.ngung': ['QUANTRI'],
    'nguoiDung.doc': ['QUANTRI'],
    'nguoiDung.them': ['QUANTRI'],
    'nguoiDung.sua': ['QUANTRI'],
    'nguoiDung.datLaiMatKhau': ['QUANTRI'],
    'nhatKy.doc': ['QUANTRI', 'KIEMDUYET'],
    'lich.chayNgay': ['QUANTRI'],
    // Giai đoạn 1b: bộ chỉ tiêu
    'chiTieu.doc': ['@'],
    'chiTieu.chiTiet': ['@'],
    'chiTieu.nhap': ['QUANTRI'],
    'chiTieu.ghep': ['QUANTRI']
  };

  // Action có trong bảng không.
  function tonTai(action) { return Object.prototype.hasOwnProperty.call(BANG, action); }

  // Action có cần phiên đăng nhập không.
  function canPhien(action) { return tonTai(action) && BANG[action][0] !== '*'; }

  // Người có các vai trò vaiTro được gọi action không.
  function duocPhep(vaiTro, action) {
    if (!tonTai(action)) return false;
    var q = BANG[action];
    if (q[0] === '*' || q[0] === '@') return true;
    var ds = Array.isArray(vaiTro) ? vaiTro : [];
    return ds.some(function (v) { return q.indexOf(v) >= 0; });
  }

  return { BANG: BANG, tonTai: tonTai, canPhien: canPhien, duocPhep: duocPhep };
})();
