// dang-nhap.js — màn đăng nhập: nút Google (Google Identity Services) và biểu mẫu tên + mật khẩu.
window.HTTD3 = window.HTTD3 || {};
HTTD3.dangNhap = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var _khiThanhCong = null; // callback của lần vẽ gần nhất (màn chính hoặc tấm trượt)

  function _thietBi() { return (navigator.userAgent || '').slice(0, 80); }

  // Sau khi API trả về phiên: lưu, phát sự kiện, gọi callback.
  function _hoanTat(kq) {
    api.luuPhien(kq.maPhien); api.luuNguoiDung(kq.nguoiDung);
    window.dispatchEvent(new CustomEvent('httd3:da-dang-nhap', { detail: kq }));
    if (_khiThanhCong) _khiThanhCong(kq);
  }

  // Callback của Google Identity Services: {credential: <ID token>}.
  function xuLyTheGoogle(resp) {
    if (!resp || !resp.credential) { ui.thongBao('Không nhận được thẻ Google, thử lại', 'loi'); return Promise.resolve(); }
    return api.goiApi('xacThuc.dangNhapGoogle', { idToken: resp.credential, thietBi: _thietBi() }, { khongThuLai: true })
      .then(_hoanTat).catch(function (e) { ui.thongBao(e.message, 'loi'); });
  }

  // Khởi tạo nút Google khi thư viện đã tải (thử lại tối đa 10 lần, mỗi giây).
  function _khoiTaoGoogle(khung, lan) {
    var cfg = window.HTTD3_CONFIG || {};
    if (!cfg.GOOGLE_CLIENT_ID || cfg.GOOGLE_CLIENT_ID.indexOf('DIEN_') === 0) { khung.textContent = 'Đăng nhập Google chưa được cấu hình (thiếu Client ID).'; khung.classList.add('goi-y'); return; }
    if (window.google && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.initialize({ client_id: cfg.GOOGLE_CLIENT_ID, callback: xuLyTheGoogle, ux_mode: 'popup', auto_select: false });
        khung.innerHTML = '';
        google.accounts.id.renderButton(khung, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 320, locale: 'vi' });
      } catch (e) { khung.textContent = 'Không khởi tạo được nút Google: ' + e.message; }
      return;
    }
    if ((lan || 0) < 10) setTimeout(function () { _khoiTaoGoogle(khung, (lan || 0) + 1); }, 1000);
    else khung.textContent = 'Không tải được thư viện Google. Dùng đăng nhập bằng mật khẩu bên dưới.';
  }

  // Vẽ biểu mẫu đăng nhập vào goc. tuyChon.khiThanhCong(kq); tuyChon.gon = true khi vẽ trong tấm trượt.
  function veManDangNhap(goc, tuyChon) {
    tuyChon = tuyChon || {}; _khiThanhCong = tuyChon.khiThanhCong || null;
    var oTen = el('input', { class: 'o-nhap', id: 'ten-dang-nhap', name: 'tenDangNhap', autocomplete: 'username', 'data-test': 'ten-dang-nhap', required: true });
    var oMk = el('input', { class: 'o-nhap', id: 'mat-khau', name: 'matKhau', type: 'password', autocomplete: 'current-password', 'data-test': 'mat-khau', required: true });
    var nut = el('button', { type: 'submit', class: 'nut nut-chinh nut-rong', 'data-test': 'nut-dang-nhap', text: 'Đăng nhập' });
    var form = el('form', { novalidate: true, onsubmit: function (ev) {
      ev.preventDefault();
      if (!oTen.value.trim() || !oMk.value) { ui.thongBao('Nhập tên đăng nhập và mật khẩu', 'loi'); return; }
      ui.ban(nut, api.goiApi('xacThuc.dangNhapMatKhau', { tenDangNhap: oTen.value.trim(), matKhau: oMk.value, thietBi: _thietBi() }, { khongThuLai: true })
        .then(_hoanTat).catch(function (e) { ui.thongBao(e.message, 'loi'); }));
    } }, [
      el('div', { class: 'truong' }, [el('label', { for: 'ten-dang-nhap', text: 'Tên đăng nhập' }), oTen]),
      el('div', { class: 'truong' }, [el('label', { for: 'mat-khau', text: 'Mật khẩu' }), oMk]),
      nut
    ]);
    var khungGoogle = el('div', { class: 'nut-google', 'data-test': 'nut-google', text: 'Đang tải nút Google…' });
    var man = el('div', { class: tuyChon.gon ? '' : 'man-dang-nhap', 'data-test': 'man-dang-nhap' }, [
      tuyChon.gon ? el('p', { class: 'phu', text: 'Phiên làm việc đã hết hạn. Đăng nhập lại để tiếp tục, dữ liệu đang nhập vẫn được giữ.' }) : el('div', { class: 'the' }, [el('div', { class: 'logo', text: '🏛️' }), el('h1', { text: 'HTTD 3.0' }), el('p', { class: 'phu', text: 'Hệ thống quản lý nhiệm vụ, chỉ tiêu và chỉ số đánh giá — UBND xã Phước Hải' })]),
      el('div', { class: 'the' }, [khungGoogle, el('div', { class: 'ngan-cach', text: 'hoặc' }), form])
    ]);
    goc.innerHTML = ''; goc.appendChild(man);
    _khoiTaoGoogle(khungGoogle, 0);
    return man;
  }

  window.__httd3 = window.__httd3 || {}; window.__httd3.xuLyTheGoogle = xuLyTheGoogle;
  return { veManDangNhap: veManDangNhap, xuLyTheGoogle: xuLyTheGoogle };
})();
