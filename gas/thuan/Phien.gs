/**
 * Phien — phiên đăng nhập và kiểm tra thẻ định danh Google. Lớp thuần.
 */
var Phien = (function () {
  var HAN_MS = 12 * 60 * 60 * 1000;   // 12 giờ
  var SO_PHIEN_TOI_DA = 5;
  var ISS_HOP_LE = ['accounts.google.com', 'https://accounts.google.com'];

  // Mã phiên từ 32 ký tự hex ngẫu nhiên do lớp kết nối cấp.
  function taoMa(ngauNhienHex32) {
    if (!/^[0-9a-f]{32}$/i.test(String(ngauNhienHex32 || ''))) { var e = new Error('NGAU_NHIEN: cần 32 ký tự hex'); e.ma = 'NGAU_NHIEN'; throw e; }
    return String(ngauNhienHex32).toLowerCase();
  }

  // Tạo bản ghi phiên từ người dùng đã xác thực.
  function tao(o) {
    var nd = o.nguoiDung;
    return {
      maPhien: taoMa(o.ngauNhienHex32), maNguoiDung: nd.maNguoiDung, email: nd.email,
      vaiTro: (nd.vaiTro || []).slice(), danhSachDonVi: (nd.danhSachDonVi || []).slice(),
      taoLuc: o.bayGioIso, hetHanLuc: ThoiGian.cong(o.bayGioIso, HAN_MS), thietBi: o.thietBi || '', trangThaiPhien: 'hoatDong',
      batBuocDoiMatKhau: !!nd.batBuocDoiMatKhau
    };
  }

  // Phiên còn hiệu lực tại thời điểm bayGioIso?
  function conHan(phien, bayGioIso) {
    if (!phien || !phien.hetHanLuc) return false;
    if (phien.trangThaiPhien && phien.trangThaiPhien !== 'hoatDong') return false;
    return ThoiGian.truoc(bayGioIso, phien.hetHanLuc);
  }

  // Trong danh sách phiên của một người, trả những phiên cũ cần thu hồi để chỉ còn SO_PHIEN_TOI_DA phiên mới nhất.
  function gioiHan(danhSach) {
    var ds = danhSach.slice().sort(function (a, b) { return ThoiGian.sangMs(b.taoLuc) - ThoiGian.sangMs(a.taoLuc); });
    return ds.slice(SO_PHIEN_TOI_DA);
  }

  // Kiểm tra payload thẻ Google (đã được Google xác minh chữ ký qua tokeninfo).
  function kiemTraTheGoogle(payload, o) {
    if (!payload || typeof payload !== 'object') return { hopLe: false, email: null, loi: 'THE_RONG' };
    if (payload.aud !== o.clientId) return { hopLe: false, email: null, loi: 'SAI_AUD' };
    if (ISS_HOP_LE.indexOf(payload.iss) < 0) return { hopLe: false, email: null, loi: 'SAI_ISS' };
    if (!(Number(payload.exp) > Number(o.bayGioGiay))) return { hopLe: false, email: null, loi: 'HET_HAN' };
    if (!(payload.email_verified === true || payload.email_verified === 'true')) return { hopLe: false, email: null, loi: 'EMAIL_CHUA_XAC_MINH' };
    if (!payload.email) return { hopLe: false, email: null, loi: 'THIEU_EMAIL' };
    return { hopLe: true, email: String(payload.email).toLowerCase(), loi: null };
  }

  return { HAN_MS: HAN_MS, SO_PHIEN_TOI_DA: SO_PHIEN_TOI_DA, taoMa: taoMa, tao: tao, conHan: conHan, gioiHan: gioiHan, kiemTraTheGoogle: kiemTraTheGoogle };
})();
