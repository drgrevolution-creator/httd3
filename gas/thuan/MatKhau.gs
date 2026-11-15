/**
 * MatKhau — băm, so sánh mật khẩu và quy tắc khóa tài khoản. Lớp thuần.
 * Hàm băm sha256Hex(chuoi) → hex được tiêm từ ngoài: Node dùng crypto, Apps Script dùng Utilities.computeDigest.
 */
var MatKhau = (function () {
  var SO_LAN_LAP = 5000;      // số vòng băm (phienBanBam = 2)
  var NGUONG_KHOA = 5;        // sai liên tiếp bấy nhiêu lần thì khóa
  var PHUT_KHOA = 15;

  // Băm mật khẩu với muối: lặp SO_LAN_LAP lần sha256Hex(truoc + muoiHex).
  function bam(matKhau, muoiHex, sha256Hex) {
    var h = String(matKhau);
    for (var i = 0; i < SO_LAN_LAP; i++) h = sha256Hex(h + muoiHex);
    return h;
  }

  // So sánh mật khẩu nhập với băm đã lưu.
  function khop(matKhau, muoiHex, bamLuu, sha256Hex) {
    return bam(matKhau, muoiHex, sha256Hex) === bamLuu;
  }

  // Sau lần sai thứ soLanSaiMoi: trả {khoaDen} (ISO +07:00) nếu đủ ngưỡng, ngược lại null.
  function tinhKhoa(soLanSaiMoi, bayGioIso) {
    if (soLanSaiMoi < NGUONG_KHOA) return { khoaDen: null };
    return { khoaDen: ThoiGian.cong(bayGioIso, PHUT_KHOA * 60 * 1000) };
  }

  // Yêu cầu tối thiểu của mật khẩu mới.
  function datYeuCau(matKhau) {
    var loi = [], s = String(matKhau || '');
    if (s.length < 8) loi.push('Mật khẩu phải có ít nhất 8 ký tự');
    if (!/[A-Za-z]/.test(s)) loi.push('Mật khẩu phải có chữ cái');
    if (!/\d/.test(s)) loi.push('Mật khẩu phải có chữ số');
    return { hopLe: loi.length === 0, loi: loi };
  }

  return { SO_LAN_LAP: SO_LAN_LAP, NGUONG_KHOA: NGUONG_KHOA, PHUT_KHOA: PHUT_KHOA, bam: bam, khop: khop, tinhKhoa: tinhKhoa, datYeuCau: datYeuCau };
})();
