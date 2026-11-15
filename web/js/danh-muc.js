// danh-muc.js — màn Danh mục chung (một màn cho mọi bảng danh mục, sinh từ sơ đồ) và màn Nhật ký.
window.HTTD3 = window.HTTD3 || {};
HTTD3.danhMuc = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var _duLieu = {};        // cache bản ghi theo bảng
  var _bangDangChon = null, _loc = 'tat-ca', _timKiem = '';
  var BANG_AN = { DM_NguoiDung: 1 };  // người dùng có màn riêng

  function soDoBang(trangThai, bang) { return trangThai.soDoDanhMuc.find(function (b) { return b.bang === bang; }); }
  function cotTen(sd) { var c = sd.cot.find(function (x) { return x.khoa.indexOf('ten') === 0 && x.kieu === 'text'; }); return c ? c.khoa : (sd.cot[1] ? sd.cot[1].khoa : sd.khoaChinh); }

  // Đọc một bảng (cache), ép tải lại khi lamMoi = true.
  function docBang(bang, lamMoi) {
    if (_duLieu[bang] && !lamMoi) return Promise.resolve(_duLieu[bang]);
    return api.goiApi('danhMuc.doc', { bang: bang }).then(function (ds) { _duLieu[bang] = ds; return ds; });
  }

  // Bản đồ tham chiếu {bang: [{ma, ten}]} cho các cột ref/multiselect của một bảng.
  function napThamChieu(trangThai, sd) {
    var cacBang = []; sd.cot.forEach(function (c) { if (c.thamChieu && cacBang.indexOf(c.thamChieu) < 0 && !BANG_AN[c.thamChieu]) cacBang.push(c.thamChieu); });
    return Promise.all(cacBang.map(function (b) { return docBang(b).catch(function () { return []; }); })).then(function (kq) {
      var tc = {};
      cacBang.forEach(function (b, i) { var sdB = soDoBang(trangThai, b); var kt = sdB ? cotTen(sdB) : null; var kc = sdB ? sdB.khoaChinh : 'ma'; tc[b] = kq[i].filter(function (r) { return r.tinhTrang !== 'Ngừng'; }).map(function (r) { return { ma: r[kc], ten: kt ? r[kt] : r[kc] }; }); });
      return tc;
    });
  }

  // ----- Màn Danh mục -----
  function ve(goc, trangThai) {
    goc.innerHTML = '';
    var cacBang = trangThai.soDoDanhMuc.filter(function (b) { return !BANG_AN[b.bang]; });
    if (!_bangDangChon || !cacBang.some(function (b) { return b.bang === _bangDangChon; })) _bangDangChon = cacBang[0] && cacBang[0].bang;
    var danhSach = el('div', { class: 'danh-sach-chon the', role: 'tablist' }, cacBang.map(function (b) {
      return el('button', { type: 'button', 'data-test': 'chon-bang-' + b.bang, 'aria-current': b.bang === _bangDangChon ? 'true' : null, text: b.ten, onclick: function () { _bangDangChon = b.bang; _timKiem = ''; ve(goc, trangThai); } });
    }));
    var phai = el('div', {});
    goc.appendChild(el('div', { class: 'dau-muc', 'data-test': 'man-danh-muc' }, [el('h1', { text: 'Danh mục' }), el('span', { class: 'phu', text: cacBang.length + ' bảng · một màn dùng chung, sinh từ sơ đồ dữ liệu' })]));
    goc.appendChild(el('div', { class: 'hai-cot' }, [danhSach, phai]));
    veBangDanhMuc(phai, trangThai);
  }

  function veBangDanhMuc(phai, trangThai) {
    var sd = soDoBang(trangThai, _bangDangChon); if (!sd) return;
    phai.innerHTML = '';
    var oTim = el('input', { class: 'o-nhap', type: 'search', placeholder: 'Tìm trong ' + sd.ten.toLowerCase() + '…', value: _timKiem, 'aria-label': 'Tìm kiếm', 'data-test': 'o-tim', oninput: function (ev) { _timKiem = ev.target.value; veDong(); } });
    var nutThem = el('button', { type: 'button', class: 'nut nut-chinh', 'data-test': 'nut-them', text: '+ Thêm', onclick: function () { moBieuMau(trangThai, sd, null, phai); } });
    var chips = el('div', { class: 'chip-loc' }, [['tat-ca', 'Tất cả'], ['hoat-dong', 'Hoạt động'], ['ngung', 'Ngừng']].map(function (c) {
      return el('button', { type: 'button', 'aria-pressed': _loc === c[0] ? 'true' : 'false', text: c[1], onclick: function () { _loc = c[0]; veBangDanhMuc(phai, trangThai); } });
    }));
    var vungBang = el('div', { 'data-test': 'vung-bang' }, [el('p', { class: 'dang-tai', text: 'Đang tải…' })]);
    phai.appendChild(el('div', { class: 'dau-muc' }, [el('h2', { text: sd.ten }), el('div', { class: 'hang-nut', style: 'margin:0' }, [nutThem])]));
    phai.appendChild(el('div', { class: 'truong' }, [oTim]));
    phai.appendChild(chips);
    phai.appendChild(vungBang);
    var thamChieu = {};
    function veDong() {
      var ds = _duLieu[sd.bang] || [];
      if (_loc === 'hoat-dong') ds = ds.filter(function (r) { return r.tinhTrang === 'Hoạt động'; });
      if (_loc === 'ngung') ds = ds.filter(function (r) { return r.tinhTrang === 'Ngừng'; });
      var q = _timKiem.trim().toLowerCase();
      if (q) ds = ds.filter(function (r) { return Object.keys(r).some(function (k) { return String(r[k]).toLowerCase().indexOf(q) >= 0; }); });
      vungBang.innerHTML = '';
      vungBang.appendChild(ui.veBang({ cot: sd.cot, dong: ds, khoaChinh: sd.khoaChinh, thamChieu: thamChieu, thongBaoRong: q ? 'Không có dòng nào khớp "' + q + '".' : 'Chưa có dữ liệu. Bấm "+ Thêm" để tạo dòng đầu tiên.', khiBamDong: function (r) { moBieuMau(trangThai, sd, r, phai); } }));
      vungBang.appendChild(el('p', { class: 'phu', text: ds.length + ' dòng' }));
    }
    Promise.all([docBang(sd.bang), napThamChieu(trangThai, sd)]).then(function (kq) { thamChieu = kq[1]; veDong(); }).catch(function (e) { vungBang.innerHTML = ''; vungBang.appendChild(el('p', { class: 'loi', text: e.message })); });
  }

  // Tấm trượt thêm/sửa một bản ghi; banGhi = null khi thêm mới.
  function moBieuMau(trangThai, sd, banGhi, phai) {
    var sua = !!banGhi, khung = el('div');
    ui.moTamTruot((sua ? 'Sửa: ' : 'Thêm ') + sd.ten.toLowerCase() + (sua ? ' ' + banGhi[sd.khoaChinh] : ''), khung);
    khung.appendChild(el('p', { class: 'dang-tai', text: 'Đang tải…' }));
    napThamChieu(trangThai, sd).then(function (thamChieu) {
      khung.innerHTML = '';
      var tabThongTin = el('button', { type: 'button', role: 'tab', 'aria-selected': 'true', text: 'Thông tin', 'data-test': 'tab-thong-tin' });
      var tabNhatKy = el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', text: 'Nhật ký', 'data-test': 'tab-nhat-ky' });
      var vungTT = el('div'), vungNK = el('div', { hidden: true });
      tabThongTin.onclick = function () { tabThongTin.setAttribute('aria-selected', 'true'); tabNhatKy.setAttribute('aria-selected', 'false'); vungTT.hidden = false; vungNK.hidden = true; };
      tabNhatKy.onclick = function () { tabNhatKy.setAttribute('aria-selected', 'true'); tabThongTin.setAttribute('aria-selected', 'false'); vungTT.hidden = true; vungNK.hidden = false; veNhatKyBanGhi(vungNK, sd.bang, banGhi[sd.khoaChinh]); };
      if (sua) khung.appendChild(el('div', { class: 'tab', role: 'tablist' }, [tabThongTin, tabNhatKy]));
      khung.appendChild(vungTT); khung.appendChild(vungNK);

      var oCanCu = sua ? el('input', { class: 'o-nhap', id: 'o-canCu', 'data-test': 'o-canCu', placeholder: 'Ví dụ: Công văn 123/UBND ngày 10/11/2026' }) : null;
      var themTruong = sua ? [el('div', { class: 'truong', 'data-khoa': 'canCu' }, [el('label', { for: 'o-canCu' }, ['Căn cứ sửa', el('span', { class: 'bat-buoc', text: ' *' })]), oCanCu, el('div', { class: 'loi', 'data-loi': 'canCu' })])] : [];
      var bm = ui.veBieuMau({ cot: sd.cot, banGhi: banGhi || {}, thamChieu: thamChieu, suaBanGhi: sua, them: themTruong, khiGui: luu });
      var nutLuu = el('button', { type: 'submit', class: 'nut nut-chinh', 'data-test': 'nut-luu', text: 'Lưu' });
      var nutHuy = el('button', { type: 'button', class: 'nut nut-phu', text: 'Hủy', onclick: ui.dongTamTruot });
      var hangNut = el('div', { class: 'hang-nut' }, [nutLuu, nutHuy]);
      var vungNgung = el('div', { hidden: true, class: 'the' }, []);
      if (sua && banGhi.tinhTrang !== 'Ngừng') {
        var oLyDo = el('input', { class: 'o-nhap', id: 'o-lyDo', 'data-test': 'o-lyDo', placeholder: 'Lý do ngừng' });
        var nutXN = el('button', { type: 'button', class: 'nut nut-nguy-hiem', 'data-test': 'nut-xac-nhan-ngung', text: 'Xác nhận ngừng', onclick: function () {
          if (!oLyDo.value.trim()) { ui.thongBao('Cần ghi lý do ngừng', 'loi'); oLyDo.focus(); return; }
          ui.ban(nutXN, api.goiApi('danhMuc.ngung', { bang: sd.bang, ma: banGhi[sd.khoaChinh], lyDo: oLyDo.value.trim() }).then(function () { ui.thongBao('Đã ngừng ' + banGhi[sd.khoaChinh], 'thanh-cong'); return docBang(sd.bang, true); }).then(function () { ui.dongTamTruot(); veBangDanhMuc(phai, trangThai); }).catch(function (e) { ui.thongBao(e.message, 'loi'); }));
        } });
        vungNgung.appendChild(el('div', { class: 'truong' }, [el('label', { for: 'o-lyDo', text: 'Lý do ngừng' }), oLyDo]));
        vungNgung.appendChild(nutXN);
        hangNut.appendChild(el('button', { type: 'button', class: 'nut nut-nguy-hiem', 'data-test': 'nut-ngung', text: 'Ngừng', onclick: function () { vungNgung.hidden = false; oLyDo.focus(); } }));
      }
      if (sua && banGhi.tinhTrang === 'Ngừng') vungTT.appendChild(el('p', { class: 'phu' }, [ui.nhanTrangThai('Đã ngừng', 'do'), ' Bản ghi này đã ngừng áp dụng.']));
      bm.phanTu.appendChild(hangNut);
      vungTT.appendChild(bm.phanTu); vungTT.appendChild(vungNgung);

      function luu() {
        bm.xoaLoi();
        var gt = bm.layGiaTri();
        if (sua) {
          if (!oCanCu.value.trim()) { bm.datLoi('canCu', 'Cần ghi căn cứ khi sửa danh mục'); oCanCu.focus(); return; }
          var thayDoi = {}; Object.keys(gt).forEach(function (k) { if (k !== sd.khoaChinh && JSON.stringify(gt[k]) !== JSON.stringify(banGhi[k] === undefined ? '' : banGhi[k])) thayDoi[k] = gt[k]; });
          if (!Object.keys(thayDoi).length) { ui.thongBao('Không có gì thay đổi', 'thuong'); return; }
          ui.ban(nutLuu, api.goiApi('danhMuc.sua', { bang: sd.bang, ma: banGhi[sd.khoaChinh], thayDoi: thayDoi, canCu: oCanCu.value.trim() }).then(xong).catch(function (e) { ui.apLoi(bm, e); }));
        } else {
          ui.ban(nutLuu, api.goiApi('danhMuc.them', { bang: sd.bang, banGhi: gt }).then(xong).catch(function (e) { ui.apLoi(bm, e); }));
        }
      }
      function xong(r) { ui.thongBao((sua ? 'Đã lưu ' : 'Đã thêm ') + r[sd.khoaChinh], 'thanh-cong'); return docBang(sd.bang, true).then(function () { ui.dongTamTruot(); veBangDanhMuc(phai, trangThai); }); }
    });
  }

  // Nhật ký của một bản ghi trong tấm trượt.
  function veNhatKyBanGhi(vung, bang, ma) {
    vung.innerHTML = ''; vung.appendChild(el('p', { class: 'dang-tai', text: 'Đang tải nhật ký…' }));
    api.goiApi('nhatKy.doc', { bang: bang, ma: ma, gioiHan: 100 }).then(function (ds) {
      vung.innerHTML = '';
      var ul = el('div', { 'data-test': 'nhat-ky-ban-ghi' }, ds.length ? ds.map(dongNhatKy) : [el('p', { class: 'rong', text: 'Chưa có nhật ký cho bản ghi này.' })]);
      vung.appendChild(ul);
    }).catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
  }
  function dongNhatKy(r) {
    var mau = { THEM: 'xanh', SUA: 'vang', NGUNG: 'do', DANG_NHAP_SAI: 'do', DAT_LAI_MAT_KHAU: 'tim' }[r.hanhDong] || null;
    var kb = [];
    try { var t = r.truocKhiSua ? JSON.parse(r.truocKhiSua) : {}, s = r.sauKhiSua ? JSON.parse(r.sauKhiSua) : {}; Object.keys(Object.assign({}, t, s)).forEach(function (k) { kb.push(k + ': ' + (t[k] !== undefined ? JSON.stringify(t[k]) : '∅') + ' → ' + (s[k] !== undefined ? JSON.stringify(s[k]) : '∅')); }); } catch (e) { /* bỏ qua */ }
    return el('div', { class: 'the', style: 'padding:12px' }, [
      el('div', {}, [ui.nhanTrangThai(r.hanhDong, mau), ' ', el('strong', { text: String(r.thoiGian).replace('T', ' ').slice(0, 16) }), ' · ', r.email || '']),
      r.bang ? el('div', { class: 'phu', text: r.bang + (r.ma ? ' / ' + r.ma : '') }) : null,
      kb.length ? el('ul', { style: 'margin:6px 0 0 18px;padding:0;font-size:13px' }, kb.slice(0, 12).map(function (x) { return el('li', { text: x }); })) : null,
      r.canCu ? el('div', { class: 'phu', text: 'Căn cứ: ' + r.canCu }) : null
    ]);
  }

  // ----- Màn Nhật ký toàn hệ thống -----
  function veNhatKy(goc, trangThai) {
    goc.innerHTML = '';
    var chon = el('select', { class: 'o-nhap', 'aria-label': 'Lọc theo bảng', 'data-test': 'loc-bang' }, [el('option', { value: '', text: 'Mọi bảng' })].concat(trangThai.soDoDanhMuc.map(function (b) { return el('option', { value: b.bang, text: b.ten }); })));
    var vung = el('div');
    goc.appendChild(el('div', { class: 'dau-muc', 'data-test': 'man-nhat-ky' }, [el('h1', { text: 'Nhật ký hệ thống' }), el('span', { class: 'phu', text: '200 dòng mới nhất' })]));
    goc.appendChild(el('div', { class: 'truong' }, [chon])); goc.appendChild(vung);
    function tai() {
      vung.innerHTML = ''; vung.appendChild(el('p', { class: 'dang-tai', text: 'Đang tải…' }));
      api.goiApi('nhatKy.doc', { bang: chon.value || undefined, gioiHan: 200 }).then(function (ds) { vung.innerHTML = ''; ds.length ? ds.forEach(function (r) { vung.appendChild(dongNhatKy(r)); }) : vung.appendChild(el('p', { class: 'rong', text: 'Chưa có nhật ký.' })); }).catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
    }
    chon.onchange = tai; tai();
  }

  return { ve: ve, veNhatKy: veNhatKy, docBang: docBang, napThamChieu: napThamChieu, soDoBang: soDoBang, dongNhatKy: dongNhatKy };
})();
