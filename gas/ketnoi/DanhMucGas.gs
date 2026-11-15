/**
 * DanhMucGas — handler danh mục chung, người dùng và nhật ký.
 */
var DanhMucGas = (function () {
  // Tham chiếu LƯỜI tới KhoDuLieu: Apps Script nạp file theo thứ tự tên, KhoDuLieu có thể chưa tồn tại lúc file này nạp.
  function _loi(ma, thongBao, chiTiet) { return KhoDuLieu._loi(ma, thongBao, chiTiet); }
  var COT_KHONG_NHAN = { taoLuc: 1, taoBoi: 1, capNhatLuc: 1, capNhatBoi: 1, tinhTrang: 1, matKhauBam: 1, muoi: 1, phienBanBam: 1, soLanSai: 1, khoaDen: 1, lanDangNhapCuoi: 1, __dong: 1 };

  // Chỉ cho phép bảng nhóm danh mục; người dùng đi qua nguoiDung.*
  function _bangDanhMuc(bang) {
    var b = SoDo.BANG[bang];
    if (!b || b.nhom !== 'danhmuc') throw _loi('KHONG_TIM_THAY', 'Không có danh mục ' + bang);
    if (bang === 'DM_NguoiDung') throw _loi('KHONG_CO_QUYEN', 'Người dùng quản lý qua màn Quản trị');
    return b;
  }
  // Bỏ các cột hệ thống/nhạy cảm từ dữ liệu trang gửi lên.
  function _loc(o) { var r = {}; Object.keys(o || {}).forEach(function (k) { if (!COT_KHONG_NHAN[k]) r[k] = o[k]; }); return r; }
  function _anDS(bang, ds) { return ds.map(function (r) { return Bang.anCotNhayCam(bang, r); }); }

  function danhMucDoc(d) { _bangDanhMuc(d.bang); return _anDS(d.bang, KhoDuLieu.docBang(d.bang)); }
  function danhMucThem(d, phien) { _bangDanhMuc(d.bang); return Bang.anCotNhayCam(d.bang, KhoDuLieu.themDong(d.bang, _loc(d.banGhi), phien, d.canCu)); }
  function danhMucSua(d, phien) {
    _bangDanhMuc(d.bang);
    if (!d.canCu || !String(d.canCu).trim()) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Cần ghi căn cứ khi sửa danh mục', [{ khoa: 'canCu' }]);
    var td = _loc(d.thayDoi); delete td[SoDo.khoaChinh(d.bang)];
    return Bang.anCotNhayCam(d.bang, KhoDuLieu.capNhatDong(d.bang, d.ma, td, phien, d.canCu));
  }
  function danhMucNgung(d, phien) {
    _bangDanhMuc(d.bang);
    if (!d.lyDo || !String(d.lyDo).trim()) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Cần ghi lý do ngừng', [{ khoa: 'lyDo' }]);
    return Bang.anCotNhayCam(d.bang, KhoDuLieu.capNhatDong(d.bang, d.ma, { tinhTrang: 'Ngừng' }, phien, d.lyDo, { hanhDong: 'NGUNG' }));
  }

  function _kiemTrung(banGhi, maBoQua) {
    var ds = KhoDuLieu.docBang('DM_NguoiDung');
    var ten = String(banGhi.tenDangNhap || '').toLowerCase(), email = String(banGhi.email || '').toLowerCase();
    ds.forEach(function (u) {
      if (u.maNguoiDung === maBoQua) return;
      if (ten && String(u.tenDangNhap || '').toLowerCase() === ten) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Tên đăng nhập đã có người dùng', [{ khoa: 'tenDangNhap' }]);
      if (email && String(u.email || '').toLowerCase() === email) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Email đã gắn với tài khoản khác', [{ khoa: 'email' }]);
    });
  }
  function nguoiDungDoc() { return _anDS('DM_NguoiDung', KhoDuLieu.docBang('DM_NguoiDung')); }
  // Thêm người dùng: sinh mật khẩu tạm, trả về một lần duy nhất.
  function nguoiDungThem(d, phien) {
    var r = _loc(d.banGhi); r.email = String(r.email || '').trim().toLowerCase(); r.tenDangNhap = String(r.tenDangNhap || '').trim();
    _kiemTrung(r);
    var tam = XacThuc.taoMatKhauTam(), muoi = XacThuc.ngauNhienHex32();
    r.matKhauBam = MatKhau.bam(tam, muoi, XacThuc.sha256Hex); r.muoi = muoi; r.phienBanBam = 2; r.batBuocDoiMatKhau = true; r.soLanSai = 0; r.trangThai = r.trangThai || 'Hoạt động';
    var nd = KhoDuLieu.themDong('DM_NguoiDung', r, phien, d.canCu);
    return { nguoiDung: Bang.anCotNhayCam('DM_NguoiDung', nd), matKhauTam: tam };
  }
  function nguoiDungSua(d, phien) {
    var td = _loc(d.thayDoi); delete td.maNguoiDung;
    if (td.email !== undefined) td.email = String(td.email).trim().toLowerCase();
    _kiemTrung(td, d.ma);
    var kq = KhoDuLieu.capNhatDong('DM_NguoiDung', d.ma, td, phien, d.canCu || 'quản trị sửa');
    if (td.trangThai === 'Khóa') XacThuc.thuHoiMoiPhien(d.ma, phien);   // §10: khóa tài khoản thu hồi mọi phiên
    return Bang.anCotNhayCam('DM_NguoiDung', kq);
  }
  function nguoiDungDatLaiMatKhau(d, phien) { return { matKhauTam: XacThuc.datMatKhauTam(d.ma, phien, d.lyDo) }; }

  // Nhật ký mới nhất trước, lọc theo bảng và mã nếu có.
  function nhatKyDoc(d) {
    var ds = KhoDuLieu.docBang('NhatKy', { baoGomXoaMem: true });
    if (d.bang) ds = ds.filter(function (r) { return r.bang === d.bang; });
    if (d.ma) ds = ds.filter(function (r) { return String(r.ma) === String(d.ma); });
    // Mới nhất trước; cùng thời điểm (ghi trong cùng giây) thì dòng ghi sau đứng trước.
    ds.sort(function (a, b) { var c = String(b.thoiGian).localeCompare(String(a.thoiGian)); return c !== 0 ? c : (b.__dong || 0) - (a.__dong || 0); });
    return ds.slice(0, Math.min(Number(d.gioiHan) || 200, 1000)).map(function (r) { var o = Object.assign({}, r); delete o.__dong; return o; });
  }

  var HANDLERS = {
    'danhMuc.doc': danhMucDoc, 'danhMuc.them': danhMucThem, 'danhMuc.sua': danhMucSua, 'danhMuc.ngung': danhMucNgung,
    'nguoiDung.doc': nguoiDungDoc, 'nguoiDung.them': nguoiDungThem, 'nguoiDung.sua': nguoiDungSua, 'nguoiDung.datLaiMatKhau': nguoiDungDatLaiMatKhau,
    'nhatKy.doc': nhatKyDoc
  };
  return { HANDLERS: HANDLERS };
})();
