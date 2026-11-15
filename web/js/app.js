// app.js — khởi động, định tuyến theo hash, thanh điều hướng theo vai trò, xử lý phiên hết hạn.
window.HTTD3 = window.HTTD3 || {};
HTTD3.app = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var trangThai = { nguoiDung: null, vaiTro: [], soDoDanhMuc: [], cauHinh: {}, daKhoiDong: false };
  var TUYEN = {
    '#/hom-nay': { ten: 'Hôm nay', bieuTuong: '🏠', vaiTro: ['*'], ve: veHomNay },
    '#/danh-muc': { ten: 'Danh mục', bieuTuong: '📚', vaiTro: ['QUANTRI'], ve: function (goc) { return HTTD3.danhMuc ? HTTD3.danhMuc.ve(goc, trangThai) : veDangXay(goc, 'Danh mục'); } },
    '#/nhat-ky': { ten: 'Nhật ký', bieuTuong: '🧾', vaiTro: ['QUANTRI', 'KIEMDUYET'], ve: function (goc) { return HTTD3.danhMuc && HTTD3.danhMuc.veNhatKy ? HTTD3.danhMuc.veNhatKy(goc, trangThai) : veDangXay(goc, 'Nhật ký'); } },
    '#/quan-tri': { ten: 'Quản trị', tenKhac: 'Tài khoản', bieuTuong: '⚙️', vaiTro: ['*'], ve: function (goc) { return HTTD3.quanTri.ve(goc, trangThai); } }
  };

  function coQuyen(t) { return t.vaiTro[0] === '*' || t.vaiTro.some(function (v) { return trangThai.vaiTro.indexOf(v) >= 0; }); }
  function laQT() { return trangThai.vaiTro.indexOf('QUANTRI') >= 0; }

  function veDangXay(goc, ten) { goc.innerHTML = ''; goc.appendChild(el('div', { class: 'rong' }, [el('div', { class: 'bieu-tuong', text: '🚧' }), el('p', { text: ten + ' đang được xây dựng ở tác vụ kế tiếp.' })])); }

  // Màn Hôm nay (giai đoạn 1): lời chào và bốn ô số từ sức khỏe hệ thống.
  function veHomNay(goc) {
    goc.innerHTML = '';
    var nd = trangThai.nguoiDung || {};
    goc.appendChild(el('div', { class: 'dau-muc', 'data-test': 'man-hom-nay' }, [el('h1', { text: 'Hôm nay' }), el('span', { class: 'phu', text: new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) })]));
    goc.appendChild(el('p', { text: 'Xin chào ' + (nd.hoTen || '') + '. Giai đoạn 1 đang chạy: danh mục, người dùng, nhật ký, sao lưu.' }));
    var luoi = el('div', { class: 'luoi-o-so' }, [ui.oSo('Quá hạn', '–', null, 'o-qua-han'), ui.oSo('Đến hạn 3 ngày', '–', null, 'o-den-han'), ui.oSo('Chờ xác nhận', '–', null, 'o-cho-xac-nhan'), ui.oSo('Cần nhắc', '–', null, 'o-can-nhac')]);
    goc.appendChild(luoi);
    var the = el('section', { class: 'the', 'data-test': 'the-suc-khoe' }, [el('h2', { text: 'Hệ thống' }), el('p', { class: 'dang-tai', text: 'Đang kiểm tra…' })]);
    goc.appendChild(the);
    api.goiApi('heThong.sucKhoe').then(function (sk) {
      the.innerHTML = ''; the.appendChild(el('h2', { text: 'Hệ thống' }));
      the.appendChild(el('p', {}, ['Phiên bản ' + sk.phienBan + ' · giờ máy chủ ' + String(sk.gio).replace('T', ' ').slice(0, 16)]));
      the.appendChild(el('p', {}, ['Sao lưu gần nhất: ', sk.saoLuuCuoi ? ui.nhanTrangThai(String(sk.saoLuuCuoi.thoiGian).slice(0, 16).replace('T', ' ') + ' · ' + sk.saoLuuCuoi.ketQua, sk.saoLuuCuoi.ketQua === 'OK' ? 'xanh' : 'do') : ui.nhanTrangThai('chưa có', 'vang')]));
      the.appendChild(el('p', {}, ['Toàn vẹn gần nhất: ', sk.toanVenCuoi ? ui.nhanTrangThai(String(sk.toanVenCuoi.thoiGian).slice(0, 16).replace('T', ' ') + ' · ' + sk.toanVenCuoi.ketQua + ' (' + sk.toanVenCuoi.giaTriHienTai + ' lệch)', sk.toanVenCuoi.ketQua === 'DAT' ? 'xanh' : 'do') : ui.nhanTrangThai('chưa có', 'vang')]));
      if (sk.thieu && sk.thieu.length) the.appendChild(el('p', { class: 'loi', text: 'Thiếu thiết lập: ' + sk.thieu.join(', ') }));
    }).catch(function (e) { the.querySelector('.dang-tai').textContent = 'Không đọc được sức khỏe hệ thống: ' + e.message; });
  }

  // Vẽ thanh điều hướng theo vai trò.
  function veDieuHuong() {
    var nav = document.getElementById('dieu-huong'); nav.innerHTML = '';
    nav.appendChild(el('div', { class: 'ten-he-thong', text: 'HTTD 3.0' }));
    Object.keys(TUYEN).forEach(function (h) {
      var t = TUYEN[h]; if (!coQuyen(t)) return;
      var ten = (h === '#/quan-tri' && !laQT()) ? t.tenKhac : t.ten;
      nav.appendChild(el('a', { href: h, 'data-test': 'menu-' + h.slice(2), 'aria-current': location.hash === h ? 'page' : null }, [el('span', { class: 'bieu-tuong', 'aria-hidden': 'true', text: t.bieuTuong }), el('span', { text: ten })]));
    });
    nav.hidden = false;
  }

  // Định tuyến theo hash.
  function dinhTuyen() {
    var goc = document.getElementById('noi-dung');
    if (!api.layPhien()) { document.getElementById('dieu-huong').hidden = true; HTTD3.dangNhap.veManDangNhap(goc, { khiThanhCong: khoiDong }); return; }
    if (!trangThai.daKhoiDong) { khoiDong(); return; }
    var h = location.hash || '#/hom-nay', t = TUYEN[h];
    if (!t || !coQuyen(t)) { location.hash = '#/hom-nay'; return; }
    veDieuHuong(); ui.dongTamTruot();
    t.ve(goc);
    window.scrollTo(0, 0);
  }

  // Tải dữ liệu khởi động sau khi có phiên.
  function khoiDong(kqDangNhap) {
    var goc = document.getElementById('noi-dung');
    goc.innerHTML = ''; goc.appendChild(el('p', { class: 'dang-tai', text: 'Đang tải…' }));
    return api.goiApi('heThong.khoiDong', {}, { khongThuLai: true }).then(function (d) {
      trangThai.nguoiDung = d.nguoiDung; trangThai.vaiTro = (d.phien && d.phien.vaiTro) || (d.nguoiDung && d.nguoiDung.vaiTro) || []; trangThai.soDoDanhMuc = d.soDoDanhMuc || []; trangThai.cauHinh = d.cauHinh || {}; trangThai.daKhoiDong = true;
      api.luuNguoiDung(d.nguoiDung);
      if (kqDangNhap && kqDangNhap.batBuocDoiMatKhau) { if (trangThai.nguoiDung) trangThai.nguoiDung.batBuocDoiMatKhau = true; ui.thongBao('Bạn đang dùng mật khẩu tạm, hãy đổi mật khẩu', 'thuong'); location.hash = '#/quan-tri'; }
      else if (!location.hash || location.hash === '#/') location.hash = '#/hom-nay';
      dinhTuyen();
    }).catch(function (e) {
      if (e.ma === 'PHIEN_HET_HAN' || e.ma === 'KHONG_CO_QUYEN') { api.luuPhien(''); trangThai.daKhoiDong = false; dinhTuyen(); return; }
      goc.innerHTML = ''; goc.appendChild(el('div', { class: 'rong' }, [el('div', { class: 'bieu-tuong', text: '📡' }), el('p', { text: e.message }), el('button', { type: 'button', class: 'nut nut-chinh', text: 'Thử lại', onclick: function () { khoiDong(); } })]));
    });
  }

  function dangXuat() {
    api.goiApi('xacThuc.dangXuat', {}, { khongThuLai: true }).catch(function () { /* phiên có thể đã hết */ }).then(function () {
      api.luuPhien(''); api.luuNguoiDung(null); trangThai = { nguoiDung: null, vaiTro: [], soDoDanhMuc: [], cauHinh: {}, daKhoiDong: false };
      location.hash = '#/hom-nay'; dinhTuyen();
    });
  }

  // Phiên hết hạn giữa chừng: mở tấm trượt đăng nhập, xong thì gửi lại yêu cầu đang chờ.
  var _hangDoiThuLai = [];
  window.addEventListener('httd3:het-han', function (ev) {
    _hangDoiThuLai.push(ev.detail);
    if (document.querySelector('[data-test="tam-truot-dang-nhap"]')) return;
    var khung = el('div');
    ui.moTamTruot('Đăng nhập lại', khung, { test: 'tam-truot-dang-nhap', khongDongKhiBamNen: true });
    HTTD3.dangNhap.veManDangNhap(khung, { gon: true, khiThanhCong: function () {
      ui.dongTamTruot();
      var ds = _hangDoiThuLai.splice(0); ds.forEach(function (d) { d.thuLai(); });
    } });
  });

  window.addEventListener('hashchange', dinhTuyen);
  document.addEventListener('DOMContentLoaded', function () { document.getElementById('ung-dung').dataset.trangThai = 'san-sang'; dinhTuyen(); });

  return { trangThai: function () { return trangThai; }, dinhTuyen: dinhTuyen, khoiDong: khoiDong, dangXuat: dangXuat, TUYEN: TUYEN };
})();
