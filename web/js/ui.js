// ui.js — thành phần giao diện dùng chung: tạo phần tử, thông báo nổi, tấm trượt, bảng, biểu mẫu theo sơ đồ, ô số.
window.HTTD3 = window.HTTD3 || {};
HTTD3.ui = (function () {
  // Tạo phần tử: el('div', {class:'x', 'data-test':'y', onclick: fn}, [con...]).
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : (children !== undefined ? [children] : [])).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // Thông báo nổi; loai: 'thanh-cong' | 'loi' | 'thuong'. Tự ẩn sau 6 giây (lỗi: 10 giây).
  function thongBao(noiDung, loai) {
    var goc = document.getElementById('thong-bao');
    var muc = el('div', { class: 'muc', 'data-loai': loai || 'thuong', 'data-test': 'thong-bao' }, [el('span', { text: noiDung }), el('button', { type: 'button', 'aria-label': 'Đóng', text: '×', onclick: function () { muc.remove(); } })]);
    goc.querySelectorAll('.muc').forEach(function (m) { m.remove(); });
    goc.appendChild(muc);
    setTimeout(function () { if (muc.parentNode) muc.remove(); }, loai === 'loi' ? 10000 : 6000);
    return muc;
  }

  // Tấm trượt: phải trên máy tính, toàn màn trên điện thoại. Trả phần tử nội dung.
  function moTamTruot(tieuDe, phanTu, tuyChon) {
    var goc = document.getElementById('tam-truot');
    goc.innerHTML = '';
    var noi = el('div', { class: 'noi', role: 'dialog', 'aria-modal': 'true', 'aria-label': tieuDe, 'data-test': (tuyChon && tuyChon.test) || 'tam-truot' }, [
      el('div', { class: 'dau' }, [el('h2', { text: tieuDe }), el('button', { type: 'button', class: 'nut nut-phu nut-bieu-tuong', 'aria-label': 'Đóng', text: '×', onclick: dongTamTruot })]),
      phanTu
    ]);
    goc.appendChild(noi);
    goc.hidden = false;
    goc.onclick = function (ev) { if (ev.target === goc && !(tuyChon && tuyChon.khongDongKhiBamNen)) dongTamTruot(); };
    var oDau = noi.querySelector('input, select, textarea, button.nut-chinh'); if (oDau) setTimeout(function () { oDau.focus(); }, 50);
    return noi;
  }
  function dongTamTruot() { var goc = document.getElementById('tam-truot'); goc.hidden = true; goc.innerHTML = ''; }

  // Hiển thị một giá trị theo kiểu cột.
  function hienThi(c, v, thamChieu) {
    if (v === undefined || v === null || v === '') return '';
    if (c.kieu === 'boolean') return v ? 'Có' : 'Không';
    if (c.kieu === 'multiselect') return (Array.isArray(v) ? v : [v]).map(function (x) { return tenThamChieu(c, x, thamChieu); }).join(', ');
    if (c.kieu === 'ref') return tenThamChieu(c, v, thamChieu);
    if (c.kieu === 'json') return typeof v === 'string' ? v : JSON.stringify(v);
    if (c.kieu === 'datetime') return String(v).replace('T', ' ').slice(0, 16);
    return String(v);
  }
  function tenThamChieu(c, ma, thamChieu) {
    var ds = c.thamChieu && thamChieu && thamChieu[c.thamChieu];
    if (!ds) return ma;
    var r = ds.find(function (x) { return x.ma === ma; });
    return r ? (r.ten + ' (' + ma + ')') : ma;
  }

  // Bảng dữ liệu: cot = cột của sơ đồ, dong = bản ghi, khiBamDong(banGhi).
  function veBang(o) {
    var cot = o.cot.filter(function (c) { return !c.heThong || c.khoa === 'tinhTrang'; });
    var thead = el('thead', {}, [el('tr', {}, cot.map(function (c) { return el('th', { text: c.ten, scope: 'col' }); }))]);
    var tbody = el('tbody', {}, o.dong.map(function (r) {
      return el('tr', { 'data-ma': r[o.khoaChinh], 'data-ngung': r.tinhTrang === 'Ngừng' ? 'true' : null, tabindex: '0', onclick: function () { o.khiBamDong && o.khiBamDong(r); }, onkeydown: function (ev) { if (ev.key === 'Enter') o.khiBamDong && o.khiBamDong(r); } },
        cot.map(function (c) { var v = hienThi(c, r[c.khoa], o.thamChieu); return el('td', { title: v, text: v }); }));
    }));
    if (!o.dong.length) return el('div', { class: 'rong' }, [el('div', { class: 'bieu-tuong', text: '📭' }), el('p', { text: o.thongBaoRong || 'Chưa có dữ liệu. Bấm "Thêm" để tạo dòng đầu tiên.' })]);
    return el('div', { class: 'cuon-ngang' }, [el('table', { class: 'bang', 'data-test': 'bang' }, [thead, tbody])]);
  }

  // Biểu mẫu sinh từ sơ đồ. Trả {phanTu, layGiaTri(), datLoi(khoa, thongBao), xoaLoi()}.
  function veBieuMau(o) {
    var cot = o.cot.filter(function (c) { return !c.heThong && !c.chiDoc && !(o.an && o.an.indexOf(c.khoa) >= 0); });
    var banGhi = o.banGhi || {}, truongTheoKhoa = {};
    var form = el('form', { class: 'bieu-mau', novalidate: true, onsubmit: function (ev) { ev.preventDefault(); o.khiGui && o.khiGui(); } });
    cot.forEach(function (c) {
      var id = 'o-' + c.khoa, dieuKhien, giaTri = banGhi[c.khoa];
      var khoaChinhDaCo = c.khoaChinh && o.suaBanGhi;
      if (c.kieu === 'select' || (c.kieu === 'ref' && o.thamChieu && o.thamChieu[c.thamChieu])) {
        var ds = c.kieu === 'select' ? (c.tuyChon || []).map(function (x) { return { ma: x, ten: x }; }) : o.thamChieu[c.thamChieu];
        dieuKhien = el('select', { id: id, name: c.khoa, 'data-test': 'o-' + c.khoa, disabled: khoaChinhDaCo }, [el('option', { value: '', text: '— chọn —' })].concat(ds.map(function (x) { return el('option', { value: x.ma, text: x.ma === x.ten ? x.ten : x.ten + ' (' + x.ma + ')', selected: giaTri === x.ma }); })));
      } else if (c.kieu === 'multiselect') {
        var tuy = c.tuyChon ? c.tuyChon.map(function (x) { return { ma: x, ten: x }; }) : ((o.thamChieu && o.thamChieu[c.thamChieu]) || []);
        var chon = Array.isArray(giaTri) ? giaTri : [];
        dieuKhien = el('div', { class: 'nhom-chon', id: id, 'data-test': 'o-' + c.khoa }, tuy.map(function (x) { return el('label', {}, [el('input', { type: 'checkbox', name: c.khoa, value: x.ma, checked: chon.indexOf(x.ma) >= 0 }), el('span', { text: x.ma === x.ten ? x.ten : x.ten + ' (' + x.ma + ')' })]); }));
      } else if (c.kieu === 'boolean') {
        dieuKhien = el('div', { class: 'nhom-chon', id: id, 'data-test': 'o-' + c.khoa }, [el('label', {}, [el('input', { type: 'checkbox', name: c.khoa, checked: !!giaTri }), el('span', { text: 'Có' })])]);
      } else if (c.kieu === 'textarea' || c.kieu === 'json') {
        dieuKhien = el('textarea', { id: id, name: c.khoa, 'data-test': 'o-' + c.khoa, text: c.kieu === 'json' && giaTri && typeof giaTri !== 'string' ? JSON.stringify(giaTri, null, 2) : (giaTri || '') });
      } else {
        var type = c.kieu === 'number' ? 'number' : c.kieu === 'date' ? 'date' : c.kieu === 'email' ? 'email' : c.kieu === 'datetime' ? 'datetime-local' : 'text';
        dieuKhien = el('input', { class: 'o-nhap', id: id, name: c.khoa, type: type, step: c.kieu === 'number' ? 'any' : null, value: giaTri === undefined || giaTri === null ? '' : (c.kieu === 'datetime' ? String(giaTri).slice(0, 16) : giaTri), 'data-test': 'o-' + c.khoa, readonly: khoaChinhDaCo, inputmode: c.kieu === 'number' ? 'decimal' : null });
      }
      var truong = el('div', { class: 'truong', 'data-khoa': c.khoa }, [
        el('label', { for: id }, [c.ten, c.batBuoc ? el('span', { class: 'bat-buoc', text: ' *', 'aria-hidden': 'true' }) : null]),
        dieuKhien,
        c.goiY ? el('div', { class: 'goi-y', text: c.goiY }) : null,
        el('div', { class: 'loi', 'data-loi': c.khoa })
      ]);
      truongTheoKhoa[c.khoa] = truong; form.appendChild(truong);
    });
    if (o.them) o.them.forEach(function (p) { form.appendChild(p); });
    function layGiaTri() {
      var r = {};
      cot.forEach(function (c) {
        var ten = c.khoa;
        if (c.kieu === 'multiselect') r[ten] = Array.prototype.map.call(form.querySelectorAll('input[name="' + ten + '"]:checked'), function (i) { return i.value; });
        else if (c.kieu === 'boolean') r[ten] = !!form.querySelector('input[name="' + ten + '"]').checked;
        else {
          var v = form.elements[ten] ? form.elements[ten].value : '';
          if (c.kieu === 'number') r[ten] = v === '' ? '' : Number(v);
          else if (c.kieu === 'json') { try { r[ten] = v ? JSON.parse(v) : ''; } catch (e) { r[ten] = v; } }
          else if (c.kieu === 'datetime' && v) r[ten] = v.length === 16 ? v + ':00+07:00' : v;
          else r[ten] = typeof v === 'string' ? v.trim() : v;
        }
      });
      return r;
    }
    function datLoi(khoa, thongBao) { var t = truongTheoKhoa[khoa] || form.querySelector('[data-khoa="' + khoa + '"]'); if (!t) return; t.classList.add('co-loi'); var l = t.querySelector('.loi'); if (l) l.textContent = thongBao; }
    function xoaLoi() { form.querySelectorAll('.truong.co-loi').forEach(function (t) { t.classList.remove('co-loi'); t.querySelector('.loi').textContent = ''; }); }
    return { phanTu: form, layGiaTri: layGiaTri, datLoi: datLoi, xoaLoi: xoaLoi };
  }

  // Áp lỗi API lên biểu mẫu: chiTiet = [{khoa, thongBao}].
  function apLoi(bieuMau, err) {
    bieuMau.xoaLoi();
    if (err && Array.isArray(err.chiTiet)) err.chiTiet.forEach(function (l) { bieuMau.datLoi(l.khoa, l.thongBao || err.message); });
    thongBao(err && err.message ? err.message : 'Có lỗi xảy ra', 'loi');
  }

  function oSo(nhan, giaTri, muc, test) { return el('div', { class: 'o-so', 'data-muc': muc || null, 'data-test': test || null }, [el('div', { class: 'gia-tri', text: String(giaTri) }), el('div', { class: 'nhan', text: nhan })]); }

  function nhanTrangThai(ten, mau) { return el('span', { class: 'nhan-trang-thai', 'data-mau': mau || null, text: ten }); }

  // Nút có trạng thái bận trong khi chờ Promise.
  function ban(nut, promise) { nut.setAttribute('aria-busy', 'true'); nut.disabled = true; return promise.finally(function () { nut.removeAttribute('aria-busy'); nut.disabled = false; }); }

  return { el: el, thongBao: thongBao, moTamTruot: moTamTruot, dongTamTruot: dongTamTruot, veBang: veBang, veBieuMau: veBieuMau, apLoi: apLoi, oSo: oSo, nhanTrangThai: nhanTrangThai, hienThi: hienThi, ban: ban };
})();
