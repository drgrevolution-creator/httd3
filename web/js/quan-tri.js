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
        .then(function () { ui.thongBao('Đã đổi mật khẩu', 'thanh-cong'); form.reset(); if (nd) { nd.batBuocDoiMatKhau = false; api.luuNguoiDung(nd); } })
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
