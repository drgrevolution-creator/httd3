// quan-tri.js — màn Quản trị / Tài khoản: đổi mật khẩu của tôi (mọi vai trò); người dùng và sức khỏe (QUANTRI, thêm ở Task 12).
window.HTTD3 = window.HTTD3 || {};
HTTD3.quanTri = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;

  // Thẻ đổi mật khẩu của chính mình. Dữ liệu đang nhập được giữ nếu phiên hết hạn (biểu mẫu không vẽ lại).
  function theDoiMatKhau(nd) {
    var oCu = el('input', { class: 'o-nhap', id: 'mk-cu', type: 'password', autocomplete: 'current-password', 'data-test': 'mat-khau-cu' });
    var oMoi = el('input', { class: 'o-nhap', id: 'mk-moi', type: 'password', autocomplete: 'new-password', 'data-test': 'mat-khau-moi' });
    var oLai = el('input', { class: 'o-nhap', id: 'mk-lai', type: 'password', autocomplete: 'new-password', 'data-test': 'mat-khau-lai' });
    var nut = el('button', { type: 'submit', class: 'nut nut-chinh', 'data-test': 'nut-doi-mat-khau', text: 'Đổi mật khẩu' });
    var form = el('form', { novalidate: true, 'data-test': 'doi-mat-khau', onsubmit: function (ev) {
      ev.preventDefault();
      if (oMoi.value !== oLai.value) { ui.thongBao('Mật khẩu nhập lại chưa khớp', 'loi'); oLai.focus(); return; }
      ui.ban(nut, api.goiApi('xacThuc.doiMatKhau', { matKhauCu: oCu.value, matKhauMoi: oMoi.value })
        .then(function () { ui.thongBao('Đã đổi mật khẩu', 'thanh-cong'); form.reset(); if (nd) { nd.batBuocDoiMatKhau = false; api.luuNguoiDung(nd); } var nhac = document.querySelector('[data-test="nhac-doi-mat-khau"]'); if (nhac) nhac.remove(); })
        .catch(function (e) { ui.thongBao(e.message, 'loi'); }));
    } }, [
      el('div', { class: 'truong' }, [el('label', { for: 'mk-cu', text: 'Mật khẩu hiện tại' }), oCu, el('div', { class: 'goi-y', text: 'Tài khoản mới đăng nhập Google lần đầu: để trống' })]),
      el('div', { class: 'truong' }, [el('label', { for: 'mk-moi', text: 'Mật khẩu mới' }), oMoi, el('div', { class: 'goi-y', text: 'Ít nhất 8 ký tự, có chữ và số' })]),
      el('div', { class: 'truong' }, [el('label', { for: 'mk-lai', text: 'Nhập lại mật khẩu mới' }), oLai]),
      el('div', { class: 'hang-nut' }, [nut])
    ]);
    return el('section', { class: 'the' }, [el('h2', { text: 'Đổi mật khẩu của tôi' }), form]);
  }

  // Vẽ màn Quản trị vào goc theo vai trò trong trangThai.
  function ve(goc, trangThai) {
    var nd = trangThai.nguoiDung || {}, laQT = (trangThai.vaiTro || []).indexOf('QUANTRI') >= 0;
    goc.innerHTML = '';
    goc.appendChild(el('div', { class: 'dau-muc' }, [el('h1', { text: laQT ? 'Quản trị' : 'Tài khoản' }), el('span', { class: 'phu', text: (nd.hoTen || '') + (nd.email ? ' · ' + nd.email : '') })]));
    if (nd.batBuocDoiMatKhau) goc.appendChild(el('div', { class: 'the', 'data-test': 'nhac-doi-mat-khau' }, [el('strong', { text: 'Bạn đang dùng mật khẩu tạm. ' }), 'Hãy đổi mật khẩu ngay bên dưới.']));
    if (laQT && HTTD3.quanTri.veNguoiDung) goc.appendChild(HTTD3.quanTri.veNguoiDung(trangThai));
    if (laQT && HTTD3.quanTri.veSucKhoe) goc.appendChild(HTTD3.quanTri.veSucKhoe(trangThai));
    goc.appendChild(theDoiMatKhau(nd));
    goc.appendChild(el('section', { class: 'the' }, [el('h2', { text: 'Phiên làm việc' }), el('p', { class: 'phu', text: 'Phiên hết hạn sau 12 giờ kể từ lúc đăng nhập.' }), el('button', { type: 'button', class: 'nut nut-phu', 'data-test': 'nut-dang-xuat', text: 'Đăng xuất', onclick: function () { HTTD3.app.dangXuat(); } })]));
  }

  return { ve: ve, theDoiMatKhau: theDoiMatKhau };
})();

// ----- Phần quản trị (QUANTRI): người dùng và sức khỏe hệ thống -----
(function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var AN_KHI_NHAP = ['batBuocDoiMatKhau', 'soLanSai', 'khoaDen', 'lanDangNhapCuoi', 'phienBanBam'];
  var COT_BANG = ['maNguoiDung', 'tenDangNhap', 'hoTen', 'email', 'vaiTro', 'danhSachDonVi', 'trangThai', 'lanDangNhapCuoi'];

  function hienMatKhauTam(tam, tenDangNhap, sauKhiDong) {
    var khung = el('div', {}, [
      el('p', {}, ['Mật khẩu tạm của tài khoản ', el('strong', { text: tenDangNhap }), ' (chỉ hiện một lần, hãy gửi riêng cho người dùng):']),
      el('div', { class: 'ma-tam', 'data-test': 'mat-khau-tam', text: tam }),
      el('p', { class: 'phu', text: 'Người dùng sẽ phải đổi mật khẩu ngay lần đăng nhập đầu.' }),
      el('div', { class: 'hang-nut' }, [el('button', { type: 'button', class: 'nut nut-chinh', 'data-test': 'nut-dong-mat-khau-tam', text: 'Đã ghi lại, đóng', onclick: function () { ui.dongTamTruot(); sauKhiDong && sauKhiDong(); } })])
    ]);
    ui.moTamTruot('Mật khẩu tạm', khung, { test: 'tam-truot-mat-khau-tam', khongDongKhiBamNen: true });
  }

  // Thẻ Người dùng với bảng, thêm, sửa, đặt lại mật khẩu, khóa/mở.
  HTTD3.quanTri.veNguoiDung = function (trangThai) {
    var sd = HTTD3.danhMuc.soDoBang(trangThai, 'DM_NguoiDung');
    var vung = el('div', { 'data-test': 'vung-nguoi-dung' }, [el('p', { class: 'dang-tai', text: 'Đang tải…' })]);
    var nutThem = el('button', { type: 'button', class: 'nut nut-chinh', 'data-test': 'nut-them-nguoi-dung', text: '+ Thêm người dùng', onclick: function () { moBieuMauNguoiDung(null); } });
    var the = el('section', { class: 'the' }, [el('div', { class: 'dau-muc' }, [el('h2', { text: 'Người dùng' }), nutThem]), vung]);
    var thamChieu = {};
    function tai() {
      return Promise.all([api.goiApi('nguoiDung.doc'), HTTD3.danhMuc.napThamChieu(trangThai, sd)]).then(function (kq) {
        thamChieu = kq[1];
        var cot = COT_BANG.map(function (k) { return sd.cot.find(function (c) { return c.khoa === k; }); }).filter(Boolean);
        vung.innerHTML = '';
        var b = ui.veBang({ cot: cot, dong: kq[0], khoaChinh: 'maNguoiDung', thamChieu: thamChieu, khiBamDong: function (r) { moBieuMauNguoiDung(r); } });
        var table = b.querySelector && b.querySelector('table'); if (table) table.setAttribute('data-test', 'bang-nguoi-dung');
        vung.appendChild(b);
      }).catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
    }
    function moBieuMauNguoiDung(nd) {
      var sua = !!nd, khung = el('div');
      ui.moTamTruot(sua ? 'Người dùng ' + nd.tenDangNhap : 'Thêm người dùng', khung);
      var bm = ui.veBieuMau({ cot: sd.cot, banGhi: nd || { vaiTro: [], trangThai: 'Hoạt động' }, thamChieu: thamChieu, suaBanGhi: sua, an: AN_KHI_NHAP, khiGui: luu });
      var nutLuu = el('button', { type: 'submit', class: 'nut nut-chinh', 'data-test': 'nut-luu', text: sua ? 'Lưu' : 'Tạo tài khoản' });
      var hang = el('div', { class: 'hang-nut' }, [nutLuu, el('button', { type: 'button', class: 'nut nut-phu', text: 'Hủy', onclick: ui.dongTamTruot })]);
      if (sua) {
        hang.appendChild(el('button', { type: 'button', class: 'nut nut-phu', 'data-test': 'nut-dat-lai-mat-khau', text: 'Đặt lại mật khẩu', onclick: function (ev) {
          if (!confirm('Đặt lại mật khẩu cho ' + nd.tenDangNhap + '? Mọi phiên của người này sẽ bị thu hồi.')) return;
          ui.ban(ev.currentTarget, api.goiApi('nguoiDung.datLaiMatKhau', { ma: nd.maNguoiDung }).then(function (kq) { hienMatKhauTam(kq.matKhauTam, nd.tenDangNhap, tai); }).catch(function (e) { ui.thongBao(e.message, 'loi'); }));
        } }));
        var khoa = nd.trangThai === 'Khóa';
        hang.appendChild(el('button', { type: 'button', class: khoa ? 'nut nut-phu' : 'nut nut-nguy-hiem', 'data-test': 'nut-khoa', text: khoa ? 'Mở khóa' : 'Khóa tài khoản', onclick: function (ev) {
          ui.ban(ev.currentTarget, api.goiApi('nguoiDung.sua', { ma: nd.maNguoiDung, thayDoi: { trangThai: khoa ? 'Hoạt động' : 'Khóa' }, canCu: khoa ? 'mở khóa' : 'khóa tài khoản' }).then(function () { ui.thongBao(khoa ? 'Đã mở khóa' : 'Đã khóa tài khoản', 'thanh-cong'); ui.dongTamTruot(); return tai(); }).catch(function (e) { ui.thongBao(e.message, 'loi'); }));
        } }));
      }
      bm.phanTu.appendChild(hang); khung.appendChild(bm.phanTu);
      function luu() {
        bm.xoaLoi(); var gt = bm.layGiaTri();
        if (!gt.vaiTro || !gt.vaiTro.length) { bm.datLoi('vaiTro', 'Chọn ít nhất một vai trò'); return; }
        if (sua) {
          var thayDoi = {}; Object.keys(gt).forEach(function (k) { if (k !== 'maNguoiDung' && JSON.stringify(gt[k]) !== JSON.stringify(nd[k] === undefined ? '' : nd[k])) thayDoi[k] = gt[k]; });
          if (!Object.keys(thayDoi).length) { ui.thongBao('Không có gì thay đổi', 'thuong'); return; }
          ui.ban(nutLuu, api.goiApi('nguoiDung.sua', { ma: nd.maNguoiDung, thayDoi: thayDoi, canCu: 'quản trị sửa' }).then(function () { ui.thongBao('Đã lưu', 'thanh-cong'); ui.dongTamTruot(); return tai(); }).catch(function (e) { ui.apLoi(bm, e); }));
        } else {
          ui.ban(nutLuu, api.goiApi('nguoiDung.them', { banGhi: gt }).then(function (kq) { hienMatKhauTam(kq.matKhauTam, kq.nguoiDung.tenDangNhap, tai); }).catch(function (e) { ui.apLoi(bm, e); }));
        }
      }
    }
    tai();
    return the;
  };

  // Thẻ Sức khỏe hệ thống với ba nút chạy tay.
  HTTD3.quanTri.veSucKhoe = function () {
    var vung = el('div', { 'data-test': 'vung-suc-khoe' }, [el('p', { class: 'dang-tai', text: 'Đang kiểm tra…' })]);
    function nut(ten, nhan) { return el('button', { type: 'button', class: 'nut nut-phu', 'data-test': 'nut-chay-' + ten, text: nhan, onclick: function (ev) { ui.ban(ev.currentTarget, api.goiApi('lich.chayNgay', { ten: ten }).then(function (kq) { ui.thongBao('Đã chạy: ' + nhan + (kq && kq.soLech !== undefined ? ' — ' + kq.soLech + ' chỗ lệch' : ''), 'thanh-cong'); return tai(); }).catch(function (e) { ui.thongBao(e.message, 'loi'); })); } }); }
    var the = el('section', { class: 'the' }, [el('h2', { text: 'Sức khỏe hệ thống' }), vung, el('div', { class: 'hang-nut' }, [nut('saoLuu', 'Chạy sao lưu ngay'), nut('toanVen', 'Chạy kiểm tra toàn vẹn ngay'), nut('caiDatLich', 'Cài lại lịch đêm')])]);
    function tai() {
      return api.goiApi('heThong.sucKhoe').then(function (sk) {
        vung.innerHTML = '';
        vung.appendChild(el('p', {}, ['Phiên bản ' + sk.phienBan + ' · giờ máy chủ ' + String(sk.gio).replace('T', ' ').slice(0, 16)]));
        vung.appendChild(el('p', {}, ['Sao lưu gần nhất: ', sk.saoLuuCuoi ? ui.nhanTrangThai(String(sk.saoLuuCuoi.thoiGian).replace('T', ' ').slice(0, 16) + ' · ' + sk.saoLuuCuoi.ketQua, sk.saoLuuCuoi.ketQua === 'OK' ? 'xanh' : 'do') : ui.nhanTrangThai('chưa chạy', 'vang')]));
        vung.appendChild(el('p', {}, ['Toàn vẹn gần nhất: ', sk.toanVenCuoi ? ui.nhanTrangThai(String(sk.toanVenCuoi.thoiGian).replace('T', ' ').slice(0, 16) + ' · ' + sk.toanVenCuoi.ketQua + ' (' + sk.toanVenCuoi.giaTriHienTai + ' lệch)', sk.toanVenCuoi.ketQua === 'DAT' ? 'xanh' : 'do') : ui.nhanTrangThai('chưa chạy', 'vang')]));
        if (sk.thieu && sk.thieu.length) vung.appendChild(el('p', { class: 'loi', text: 'Thiếu thiết lập: ' + sk.thieu.join(', ') }));
        if (sk.daThietLap === false) vung.appendChild(el('p', { class: 'loi', text: 'Chưa thiết lập: ' + (sk.loi || '') }));
      }).catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
    }
    tai();
    return the;
  };
})();
