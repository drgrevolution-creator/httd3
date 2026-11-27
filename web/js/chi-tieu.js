// chi-tieu.js — màn Bộ chỉ tiêu: danh sách bộ theo loại hệ thống, cây nhóm → chỉ tiêu → chỉ tiêu con, chi tiết năm mục nội dung.
window.HTTD3 = window.HTTD3 || {};
HTTD3.chiTieu = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var LOAI = ['Quốc gia', 'Bộ, ngành', 'Địa phương', 'Theo dõi, đánh giá'];
  var LINH_VUC_LON = ['Thông tin chung', 'Kinh tế', 'Văn hóa – xã hội', 'Đô thị, môi trường', 'Cải cách hành chính', 'Quốc phòng – an ninh', 'Xây dựng Đảng', 'Hệ thống chính trị', 'Khác'];
  var MUC = [
    ['khaiNiemPhuongPhapTinh', '1. Khái niệm, phương pháp tính'],
    ['phanToChuYeu', '2. Phân tổ chủ yếu'],
    ['kyCongBo', '3. Kỳ công bố'],
    ['nguonSoLieu', '4. Nguồn số liệu']
  ];
  var _boChon = null, _dsBo = null, _dsChuan = [], _dongCuaBo = {}, _loc = { capXa: false, linhVuc: '', tim: '' }, _thuGon = {};
  var _cheDo = 'bo', _timChuan = '';

  function laQT(trangThai) { return (trangThai.vaiTro || []).indexOf('QUANTRI') >= 0; }
  function rong(v) { return v === undefined || v === null || String(v).trim() === ''; }
  function boDau(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
  function laCapXa(r) { return /Xã/.test(String(r.capDuLieu || '')); }

  // ----- Cây: nhóm theo thứ tự xuất hiện, con nằm ngay dưới cha (thứ tự văn bản giữ như file nhập) -----
  function dungCay(dong) {
    var theoMa = {}, nhom = [], theoNhom = {};
    dong.forEach(function (r) { theoMa[r.maTrongBo] = { r: r, con: [] }; });
    dong.forEach(function (r) {
      var nut = theoMa[r.maTrongBo];
      if (r.chaTrongBo && theoMa[r.chaTrongBo] && r.chaTrongBo !== r.maTrongBo) { theoMa[r.chaTrongBo].con.push(nut); return; }
      var k = r.nhomMa || '';
      if (!theoNhom[k]) { theoNhom[k] = { nhomMa: k, nhomTen: r.nhomTen || '', goc: [] }; nhom.push(theoNhom[k]); }
      theoNhom[k].goc.push(nut);
    });
    return nhom;
  }

  // Dòng có khớp bộ lọc không.
  function khop(r) {
    if (_loc.capXa && !laCapXa(r)) return false;
    if (_loc.linhVuc && r.linhVucLon !== _loc.linhVuc) return false;
    if (_loc.tim) {
      var t = boDau(_loc.tim);
      if (boDau(r.tenNguyenVan).indexOf(t) < 0 && boDau(r.maGoc).indexOf(t) < 0 && boDau(r.maTrongBo).indexOf(t) < 0) return false;
    }
    return true;
  }
  function dangLoc() { return _loc.capXa || !!_loc.linhVuc || !!_loc.tim; }

  // ----- Màn chính -----
  function ve(goc, trangThai) {
    goc.innerHTML = '';
    var dau = el('div', { class: 'dau-muc', 'data-test': 'man-chi-tieu' }, [
      el('h1', { text: 'Bộ chỉ tiêu' }),
      el('span', { class: 'phu', text: 'Hệ thống → bộ → nhóm → chỉ tiêu · năm mục nội dung theo văn bản' })
    ]);
    if (laQT(trangThai)) dau.appendChild(el('a', { class: 'nut nut-phu', href: '#/chi-tieu/nhap', 'data-test': 'nut-nhap-file', text: '📥 Nhập từ file' }));
    goc.appendChild(dau);
    var vung = el('div');
    function chonCheDo(cd) { _cheDo = cd; nutBo.setAttribute('aria-pressed', cd === 'bo' ? 'true' : 'false'); nutChuan.setAttribute('aria-pressed', cd === 'chuan' ? 'true' : 'false'); veCheDo(vung, trangThai); }
    var nutBo = el('button', { type: 'button', 'data-test': 'tab-theo-bo', 'aria-pressed': _cheDo === 'bo' ? 'true' : 'false', text: 'Theo bộ', onclick: function () { chonCheDo('bo'); } });
    var nutChuan = el('button', { type: 'button', 'data-test': 'tab-chuan', 'aria-pressed': _cheDo === 'chuan' ? 'true' : 'false', text: 'Chỉ tiêu chuẩn', onclick: function () { chonCheDo('chuan'); } });
    goc.appendChild(el('div', { class: 'chip-loc tab-che-do', role: 'group', 'aria-label': 'Cách xem' }, [nutBo, nutChuan]));
    goc.appendChild(vung);
    vung.appendChild(el('p', { class: 'dang-tai', text: 'Đang tải…' }));
    api.goiApi('chiTieu.doc', {}).then(function (kq) {
      _dsBo = kq.bo || []; _dsChuan = kq.chuan || [];
      veCheDo(vung, trangThai);
    }).catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
  }

  function veCheDo(vung, trangThai) {
    vung.innerHTML = '';
    if (_dsBo === null) return;
    if (_cheDo === 'chuan') { veChuan(vung, trangThai); return; }
    var trai = el('div', { class: 'danh-sach-chon the danh-sach-bo', 'data-test': 'danh-sach-bo' });
    var phai = el('div', { class: 'cot-phai' });
    vung.appendChild(el('div', { class: 'hai-cot' }, [trai, phai]));
    (function () {
      if (!_boChon || !_dsBo.some(function (b) { return b.maBo === _boChon; })) {
        var coDong = _dsBo.filter(function (b) { return b.soChiTieu > 0; });
        _boChon = (coDong[0] || _dsBo[0] || {}).maBo || null;
      }
      veDanhSachBo(trai, phai, trangThai);
      veBo(phai, trangThai);
    })();
  }

  // ----- Chỉ tiêu chuẩn: một nội hàm một mã, mỗi dòng cho biết thuộc bao nhiêu bộ -----
  function veChuan(vung, trangThai) {
    var oTim = el('input', { type: 'search', class: 'o-nhap o-loc', 'data-test': 'tim-chuan', placeholder: 'Tìm theo tên hoặc mã', 'aria-label': 'Tìm chỉ tiêu chuẩn', value: _timChuan });
    var khung = el('div', { class: 'cuon-ngang' });
    vung.appendChild(el('section', { class: 'the' }, [
      el('p', { class: 'phu', text: 'Mỗi chỉ tiêu chuẩn là một nội hàm, dùng chung cho các bộ đã ghép. Số liệu (giai đoạn sau) gắn vào chỉ tiêu chuẩn.' }),
      el('div', { class: 'thanh-loc' }, [oTim, el('span', { class: 'phu', text: _dsChuan.length + ' chỉ tiêu chuẩn' })])
    ]));
    vung.appendChild(khung);
    function veBangChuan() {
      var t = boDau(_timChuan);
      var ds = _dsChuan.filter(function (c) { return !t || boDau(c.tenChiTieu).indexOf(t) >= 0 || boDau(c.maChiTieu).indexOf(t) >= 0; });
      khung.innerHTML = '';
      if (!_dsChuan.length) { khung.appendChild(el('p', { class: 'rong', text: 'Chưa có chỉ tiêu chuẩn nào. Ghép nội hàm ở màn "Theo bộ" để tạo.' })); return; }
      khung.appendChild(el('table', { class: 'bang', 'data-test': 'bang-chuan' }, [
        el('thead', {}, [el('tr', {}, ['Mã', 'Tên chỉ tiêu', 'Lĩnh vực lớn', 'Liên quan xã', 'Số bộ', 'Thuộc các bộ'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]),
        el('tbody', {}, ds.map(function (c) {
          return el('tr', { 'data-ma': c.maChiTieu, tabindex: '0', onclick: function () { moChuan(c, trangThai); }, onkeydown: function (ev) { if (ev.key === 'Enter') moChuan(c, trangThai); } }, [
            el('td', { class: 'ma', text: c.maChiTieu }), el('td', { text: c.tenChiTieu || '' }), el('td', { text: c.linhVucLon || '' }),
            el('td', { text: c.mucLienQuanCapXa || '' }), el('td', { 'data-cot': 'soBo', text: String(c.soBo || 0) }), el('td', { text: (c.cacBo || []).join(', ') })
          ]);
        }))
      ]));
    }
    var hen = null;
    oTim.addEventListener('input', function () { clearTimeout(hen); hen = setTimeout(function () { _timChuan = oTim.value.trim(); veBangChuan(); }, 150); });
    veBangChuan();
  }

  function moChuan(c, trangThai) {
    var khung = el('div', { class: 'chi-tiet-chi-tieu' });
    ui.moTamTruot('Chỉ tiêu chuẩn ' + c.maChiTieu, khung);
    khung.appendChild(el('h3', { class: 'ten-chi-tieu', text: c.tenChiTieu || '' }));
    khung.appendChild(el('div', { class: 'luoi-tt' }, [dongTT('Lĩnh vực lớn', c.linhVucLon), dongTT('Cấp dữ liệu', c.capDuLieu), dongTT('Mức liên quan cấp xã', c.mucLienQuanCapXa), dongTT('Kỳ báo cáo xã', c.kyBaoCaoXa)].filter(Boolean)));
    var dg = c.cacDong || [];
    khung.appendChild(el('section', { class: 'muc-chi-tiet' }, [
      el('h3', { text: 'Đang ghép ở ' + (c.soBo || 0) + ' bộ' }),
      dg.length ? el('ul', { 'data-test': 'dong-ghep' }, dg.map(function (x) {
        var b = (_dsBo || []).find(function (y) { return y.maBo === x.maBo; }) || { maBo: x.maBo };
        return el('li', {}, [el('button', { type: 'button', class: 'nut-lien-ket', text: x.maTrongBo + ' — ' + x.tenNguyenVan, onclick: function () { moChiTiet(x.maTrongBo, b, trangThai); } })]);
      })) : el('p', { class: 'phu', 'data-test': 'dong-ghep', text: 'Chưa có dòng nào ghép với chỉ tiêu này.' })
    ]));
    var vungND = el('div', {}, dg.length ? [el('p', { class: 'dang-tai', text: 'Đang tải nội dung…' })] : []);
    khung.appendChild(vungND);
    if (!dg.length) return;
    api.goiApi('chiTieu.chiTiet', { maTrongBo: dg[0].maTrongBo }).then(function (kq) {
      var ch = kq.chuan || {};
      vungND.innerHTML = '';
      [['khaiNiemPhuongPhapTinh', '1. Khái niệm, phương pháp tính'], ['phanToChuYeu', '2. Phân tổ chủ yếu'], ['kyCongBo', '3. Kỳ công bố'], ['nguonSoLieuNoiDung', '4. Nguồn số liệu']].forEach(function (m) {
        vungND.appendChild(el('section', { class: 'muc-chi-tiet' }, [el('h3', { text: m[1] }), doanNoiDung(ch[m[0]])]));
      });
      vungND.appendChild(el('section', { class: 'muc-chi-tiet' }, [el('h3', { text: '5. Cơ quan chịu trách nhiệm thu thập, tổng hợp' }),
        el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Chủ trì:' }), doanNoiDung(ch.coQuanChuTriThuThap)]),
        el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Phối hợp:' }), doanNoiDung(ch.coQuanPhoiHopThuThap)])]));
      var ctc = veCachTinh(ch, kq.dsLoaiGiaTri);
      if (ctc) vungND.appendChild(ctc);
    }).catch(function (e) { vungND.innerHTML = ''; vungND.appendChild(el('p', { class: 'loi', text: e.message })); });
  }

  function veDanhSachBo(trai, phai, trangThai) {
    trai.innerHTML = '';
    LOAI.concat(['']).forEach(function (loai) {
      var ds = _dsBo.filter(function (b) { return loai ? b.loaiHeThong === loai : LOAI.indexOf(b.loaiHeThong) < 0; });
      if (!ds.length) return;
      trai.appendChild(el('div', { class: 'tieu-de-nhom-bo', text: loai || 'Khác' }));
      ds.forEach(function (b) {
        trai.appendChild(el('button', { type: 'button', 'data-test': 'chon-bo-' + b.maBo, 'aria-current': b.maBo === _boChon ? 'true' : null, title: b.tenBo, onclick: function () {
          _boChon = b.maBo; _loc = { capXa: false, linhVuc: '', tim: '' };
          veDanhSachBo(trai, phai, trangThai); veBo(phai, trangThai);
        } }, [el('span', { class: 'ten-bo', text: b.maBo }), el('span', { class: 'so-bo', 'data-test': 'so-' + b.maBo, text: String(b.soChiTieu || 0) })]));
      });
    });
  }

  function veBo(phai, trangThai) {
    phai.innerHTML = '';
    var b = (_dsBo || []).find(function (x) { return x.maBo === _boChon; });
    if (!b) { phai.appendChild(el('div', { class: 'rong' }, [el('p', { text: 'Chưa có bộ chỉ tiêu nào.' })])); return; }
    phai.appendChild(el('section', { class: 'the' }, [
      el('h2', { text: b.tenBo || b.maBo }),
      el('p', { class: 'phu', text: [b.loaiHeThong, b.soKyHieuVanBan, b.coQuanBanHanh, b.giaiDoan].filter(Boolean).join(' · ') }),
      el('p', {}, [ui.nhanTrangThai((b.soChiTieu || 0) + ' chỉ tiêu', 'xanh'), ' ', b.soCapXa ? ui.nhanTrangThai(b.soCapXa + ' có cấp xã', 'tim') : null]),
      b.ghiChu ? el('p', { class: 'goi-y', text: b.ghiChu }) : null
    ]));
    var vung = el('div', {}, [el('p', { class: 'dang-tai', text: 'Đang tải chỉ tiêu…' })]);
    phai.appendChild(vung);
    var tai = _dongCuaBo[b.maBo] ? Promise.resolve(_dongCuaBo[b.maBo]) : api.goiApi('chiTieu.doc', { maBo: b.maBo }).then(function (kq) { _dongCuaBo[b.maBo] = kq.dong || []; return _dongCuaBo[b.maBo]; });
    tai.then(function (dong) { veLocVaCay(vung, b, dong, trangThai); })
      .catch(function (e) { vung.innerHTML = ''; vung.appendChild(el('p', { class: 'loi', text: e.message })); });
  }

  function veLocVaCay(vung, b, dong, trangThai) {
    vung.innerHTML = '';
    if (!dong.length) { vung.appendChild(el('div', { class: 'rong' }, [el('p', { text: 'Bộ này chưa có chỉ tiêu. ' + (laQT(trangThai) ? 'Dùng "Nhập từ file" để nạp.' : '') })])); return; }
    var linhVucCo = LINH_VUC_LON.filter(function (lv) { return dong.some(function (r) { return r.linhVucLon === lv; }); });
    var nutXa = el('button', { type: 'button', 'data-test': 'loc-cap-xa', 'aria-pressed': _loc.capXa ? 'true' : 'false', text: 'Chỉ cấp xã' });
    var chonLv = el('select', { 'data-test': 'loc-linh-vuc', 'aria-label': 'Lĩnh vực lớn', class: 'o-nhap o-loc' }, [el('option', { value: '', text: 'Mọi lĩnh vực' })].concat(linhVucCo.map(function (lv) { return el('option', { value: lv, text: lv, selected: _loc.linhVuc === lv }); })));
    var oTim = el('input', { type: 'search', class: 'o-nhap o-loc', 'data-test': 'tim-chi-tieu', placeholder: 'Tìm theo tên hoặc mã', 'aria-label': 'Tìm chỉ tiêu', value: _loc.tim });
    var soHienThi = el('span', { class: 'phu', 'data-test': 'so-hien-thi' });
    var khungCay = el('div', { class: 'cuon-ngang' });
    vung.appendChild(el('div', { class: 'thanh-loc' }, [el('div', { class: 'chip-loc' }, [nutXa]), linhVucCo.length ? chonLv : null, oTim, soHienThi]));
    vung.appendChild(khungCay);
    function veLai() { veCay(khungCay, b, dong, soHienThi, trangThai); }
    nutXa.addEventListener('click', function () { _loc.capXa = !_loc.capXa; nutXa.setAttribute('aria-pressed', _loc.capXa ? 'true' : 'false'); veLai(); });
    chonLv.addEventListener('change', function () { _loc.linhVuc = chonLv.value; veLai(); });
    var hen = null;
    oTim.addEventListener('input', function () { clearTimeout(hen); hen = setTimeout(function () { _loc.tim = oTim.value.trim(); veLai(); }, 150); });
    veLai();
  }

  // Vẽ cây dạng bảng: dòng nhóm, dòng chỉ tiêu thụt theo cấp. Khi lọc: hiện dòng khớp và các dòng cha của nó.
  function veCay(khung, b, dong, soHienThi, trangThai) {
    var nhom = dungCay(dong), loc = dangLoc(), soKhop = 0;
    var coCay = dong.some(function (r) { return !!r.chaTrongBo; });   // bộ không có dòng con thì không chừa chỗ nút mở
    var tbody = el('tbody');
    function giuLai(nut) { // có dòng khớp trong nhánh không
      if (!loc) return true;
      nut.__khop = khop(nut.r);
      var conGiu = nut.con.map(giuLai).some(Boolean);
      return nut.__khop || conGiu;
    }
    function veNut(nut, cap, an) {
      if (!giuLai(nut)) return;
      var r = nut.r, khopDong = loc ? nut.__khop : true;
      if (khopDong) soKhop++;
      var coCon = nut.con.length > 0, thuGon = !loc && _thuGon[r.maTrongBo];
      var nutMo = coCon ? el('button', { type: 'button', class: 'nut-mo', 'data-test': 'nut-mo-rong', 'aria-expanded': thuGon ? 'false' : 'true', 'aria-label': (thuGon ? 'Mở' : 'Thu gọn') + ' chỉ tiêu con', text: thuGon ? '▸' : '▾', onclick: function (ev) {
        ev.stopPropagation(); _thuGon[r.maTrongBo] = !_thuGon[r.maTrongBo]; veCay(khung, b, dong, soHienThi, trangThai);
      } }) : (coCay ? el('span', { class: 'nut-mo-trong', 'aria-hidden': 'true' }) : null);
      var tr = el('tr', { 'data-ma': r.maTrongBo, 'data-cap': String(cap), 'data-khop': khopDong ? 'true' : 'false', 'data-het-hieu-luc': r.tinhTrangHieuLuc === 'Hết hiệu lực' ? 'true' : null, hidden: an || null, tabindex: '0',
        onclick: function () { moChiTiet(r.maTrongBo, b, trangThai); }, onkeydown: function (ev) { if (ev.key === 'Enter') moChiTiet(r.maTrongBo, b, trangThai); } }, [
        el('td', { class: 'ma', text: r.maGoc || '' }),
        el('td', { class: 'ten', style: '--cap:' + cap }, [el('div', { class: 'ten-dong' }, [nutMo, el('span', {}, [r.tenNguyenVan || '', r.tinhTrangHieuLuc === 'Hết hiệu lực' ? el('span', { class: 'phu', text: ' (hết hiệu lực)' }) : null])])]),
        el('td', { text: r.donViTinh || '' }),
        el('td', { text: r.kyBaoCaoXa || r.kyBaoCaoTP || '' }),
        el('td', {}, [laCapXa(r) ? ui.nhanTrangThai('Cấp xã', 'tim') : null])
      ]);
      tbody.appendChild(tr);
      nut.con.forEach(function (c) { veNut(c, cap + 1, an || thuGon); });
    }
    nhom.forEach(function (g) {
      var giu = g.goc.filter(giuLai);
      if (!giu.length) return;
      tbody.appendChild(el('tr', { class: 'dong-nhom' }, [el('th', { colspan: '5', scope: 'colgroup', text: (g.nhomMa ? g.nhomMa + '. ' : '') + (g.nhomTen || '') })]));
      g.goc.forEach(function (n) { veNut(n, 0, false); });
    });
    khung.innerHTML = '';
    khung.appendChild(el('table', { class: 'bang bang-cay', 'data-test': 'cay-chi-tieu', 'data-bo': b.maBo }, [
      el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: 'Mã' }), el('th', { scope: 'col', text: 'Tên chỉ tiêu' }), el('th', { scope: 'col', text: 'Đơn vị' }), el('th', { scope: 'col', text: 'Kỳ báo cáo' }), el('th', { scope: 'col', text: '' })])]),
      tbody
    ]));
    soHienThi.textContent = loc ? soKhop + ' chỉ tiêu khớp / ' + dong.length : dong.length + ' chỉ tiêu';
    if (loc && !soKhop) khung.appendChild(el('p', { class: 'rong', text: 'Không có chỉ tiêu nào khớp bộ lọc.' }));
  }

  // ----- Chi tiết một chỉ tiêu (tấm trượt) -----
  function doanNoiDung(v) { return el('div', { class: 'noi-dung-chi-tieu', text: rong(v) ? '—' : String(v) }); }
  // Mục "Cách tính" (tử số/mẫu số) của một chỉ tiêu trong bộ hoặc chỉ tiêu chuẩn; null nếu chưa có loại giá trị.
  function veCachTinh(rec, dsLoai) {
    if (!rec || rong(rec.loaiGiaTri)) return null;
    var loai = (dsLoai || []).find(function (l) { return l.maLoaiGiaTri === rec.loaiGiaTri; }) || { tenLoaiGiaTri: rec.loaiGiaTri };
    var coTuMau = loai.coTuSoMauSo === true || String(loai.coTuSoMauSo).toUpperCase() === 'TRUE';
    var sec = el('section', { class: 'muc-chi-tiet', 'data-test': 'cach-tinh' }, [el('h3', { text: 'Cách tính' }),
      el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Loại giá trị:' }), el('span', { text: loai.tenLoaiGiaTri || rec.loaiGiaTri })])]);
    var heSo = !rong(rec.heSoNhan) ? Number(rec.heSoNhan) : (!rong(loai.heSoNhanMacDinh) ? Number(loai.heSoNhanMacDinh) : null);
    if (coTuMau) {
      if (rong(rec.dinhNghiaTuSo) || rong(rec.dinhNghiaMauSo)) sec.appendChild(el('p', { class: 'goi-y', text: 'Chưa quy định phương pháp tính' }));
      sec.appendChild(el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Tử số:' }), doanNoiDung(rec.dinhNghiaTuSo)]));
      sec.appendChild(el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Mẫu số:' }), doanNoiDung(rec.dinhNghiaMauSo)]));
      if (heSo) sec.appendChild(el('p', { class: 'cong-thuc', text: 'Giá trị = Tử số ÷ Mẫu số × ' + heSo.toLocaleString('vi-VN') + (heSo === 100 ? ' (%)' : '') }));
    } else if (heSo) sec.appendChild(el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Hệ số nhân:' }), el('span', { text: heSo.toLocaleString('vi-VN') })]));
    return sec;
  }

  function dongTT(nhan, v) { return rong(v) ? null : el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: nhan }), el('span', { class: 'noi-dung-chi-tieu', text: String(v) })]); }

  function moChiTiet(maTrongBo, b, trangThai) {
    var khung = el('div', { class: 'chi-tiet-chi-tieu' }, [el('p', { class: 'dang-tai', text: 'Đang tải…' })]);
    ui.moTamTruot('Chỉ tiêu ' + maTrongBo, khung);
    api.goiApi('chiTieu.chiTiet', { maTrongBo: maTrongBo }).then(function (kq) { veChiTiet(khung, kq, b, trangThai); })
      .catch(function (e) { khung.innerHTML = ''; khung.appendChild(el('p', { class: 'loi', text: e.message })); });
  }

  function veChiTiet(khung, kq, b, trangThai) {
    var r = kq.dong;
    khung.innerHTML = '';
    khung.appendChild(el('h3', { class: 'ten-chi-tieu', 'data-test': 'ten-chi-tieu', text: r.tenNguyenVan }));
    khung.appendChild(el('p', {}, [ui.nhanTrangThai(b.maBo, null), ' ', laCapXa(r) ? ui.nhanTrangThai('Cấp xã', 'tim') : null, ' ', r.tinhTrangHieuLuc === 'Hết hiệu lực' ? ui.nhanTrangThai('Hết hiệu lực', 'do') : null]));
    khung.appendChild(el('div', { class: 'luoi-tt' }, [
      dongTT('Mã gốc', r.maGoc), dongTT('Số thứ tự', r.sttTrongBo), dongTT('Nhóm', [r.nhomMa, r.nhomTen].filter(Boolean).join('. ')),
      dongTT('Đơn vị tính', r.donViTinh), dongTT('Cấp dữ liệu', r.capDuLieu), dongTT('Thuộc tính', r.thuocTinhTongHop),
      dongTT('Kỳ báo cáo Thành phố', r.kyBaoCaoTP), dongTT('Kỳ báo cáo xã', r.kyBaoCaoXa), dongTT('Thời điểm chốt số liệu', r.thoiDiemChotSoLieu),
      dongTT('Lĩnh vực lớn', r.linhVucLon), dongTT('Thuộc chỉ tiêu', r.chaTrongBo)
    ]));
    var mt = Array.isArray(r.mucTieu) ? r.mucTieu : [];
    if (mt.length) khung.appendChild(el('section', { class: 'muc-chi-tiet', 'data-test': 'muc-tieu' }, [el('h3', { text: 'Mục tiêu' }), el('ul', {}, mt.map(function (m) { return el('li', { text: 'Giai đoạn ' + m.giaiDoan + ': ' + m.nguyenVan }); }))]));

    var coNoiDung = MUC.some(function (m) { return !rong(r[m[0]]); }) || !rong(r.coQuanChuTriThuThap) || !rong(r.coQuanPhoiHopThuThap);
    if (!coNoiDung) {
      var vb = /NĐ 94\/2022\/NĐ-CP/.test(String(r.ghiChu || '') + ' ' + String(b.ghiChu || '')) ? 'NĐ 94/2022/NĐ-CP' : (b.soKyHieuVanBan || 'văn bản ban hành bộ');
      khung.appendChild(el('section', { class: 'muc-chi-tiet' }, [el('h3', { text: 'Nội dung chỉ tiêu' }), el('p', { class: 'goi-y', 'data-test': 'chua-co-noi-dung', text: 'Chưa có nội dung — theo ' + vb })]));
    } else {
      MUC.forEach(function (m, i) { khung.appendChild(el('section', { class: 'muc-chi-tiet', 'data-test': 'muc-' + (i + 1) }, [el('h3', { text: m[1] }), doanNoiDung(r[m[0]])])); });
      khung.appendChild(el('section', { class: 'muc-chi-tiet', 'data-test': 'muc-5' }, [
        el('h3', { text: '5. Cơ quan chịu trách nhiệm thu thập, tổng hợp' }),
        el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Chủ trì:' }), el('div', { class: 'noi-dung-chi-tieu', 'data-test': 'muc-5-chu-tri', text: rong(r.coQuanChuTriThuThap) ? '—' : r.coQuanChuTriThuThap })]),
        el('div', { class: 'dong-tt' }, [el('span', { class: 'nhan-tt', text: 'Phối hợp:' }), el('div', { class: 'noi-dung-chi-tieu', 'data-test': 'muc-5-phoi-hop', text: rong(r.coQuanPhoiHopThuThap) ? '—' : r.coQuanPhoiHopThuThap })])
      ]));
    }
    var cachTinh = veCachTinh(r, kq.dsLoaiGiaTri);
    if (cachTinh) khung.appendChild(cachTinh);
    var canCu = [dongTT('Căn cứ', r.canCuNguyenVan), dongTT('Vị trí trong văn bản', r.viTriTrongVanBan), dongTT('Cơ quan xác nhận số liệu', r.coQuanXacNhanSoLieu), dongTT('Ghi chú', r.ghiChu)].filter(Boolean);
    if (canCu.length) khung.appendChild(el('section', { class: 'muc-chi-tiet' }, [el('h3', { text: 'Căn cứ, ghi chú' })].concat(canCu)));

    var noiHam = el('section', { class: 'muc-chi-tiet', 'data-test': 'cung-noi-ham' }, [el('h3', { text: 'Cùng nội hàm ở các bộ khác' })]);
    if (kq.chuan) noiHam.appendChild(el('p', {}, ['Chỉ tiêu chuẩn: ', el('strong', { text: kq.chuan.maChiTieu + ' — ' + kq.chuan.tenChiTieu })]));
    if (kq.cungNoiHam && kq.cungNoiHam.length) noiHam.appendChild(el('ul', {}, kq.cungNoiHam.map(function (x) { return el('li', { text: x.maTrongBo + ' — ' + x.tenNguyenVan }); })));
    else noiHam.appendChild(el('p', { class: 'phu', text: kq.chuan ? 'Chưa có bộ khác ghép cùng chỉ tiêu chuẩn này.' : 'Chưa ghép với chỉ tiêu chuẩn nào.' }));
    if (laQT(trangThai)) noiHam.appendChild(el('button', { type: 'button', class: 'nut nut-phu', 'data-test': 'nut-ghep', text: '🔗 Ghép nội hàm', onclick: function () { veGhep(noiHam, r, b, trangThai); } }));
    khung.appendChild(noiHam);
  }

  // Biểu mẫu ghép: chọn chỉ tiêu chuẩn có sẵn hoặc tạo mới (sao năm mục từ dòng này). Chỉ ghép theo danh sách đã duyệt.
  function veGhep(noiHam, r, b, trangThai) {
    var cu = noiHam.querySelector('[data-test="bieu-mau-ghep"]'); if (cu) { cu.remove(); return; }
    var chon = el('select', { class: 'o-nhap', 'data-test': 'o-ghep-ma', 'aria-label': 'Chỉ tiêu chuẩn' }, [el('option', { value: '', text: 'Đang tải chỉ tiêu chuẩn…' })]);
    var oMa = el('input', { class: 'o-nhap', 'data-test': 'o-ghep-ma-moi', placeholder: 'Mã mới, ví dụ DS-01', 'aria-label': 'Mã chỉ tiêu chuẩn mới' });
    var oTen = el('input', { class: 'o-nhap', 'data-test': 'o-ghep-ten-moi', value: r.tenNguyenVan || '', 'aria-label': 'Tên chỉ tiêu chuẩn mới' });
    var oCanCu = el('input', { class: 'o-nhap', 'data-test': 'o-ghep-can-cu', value: 'Theo danh sách đề xuất ghép đã duyệt', 'aria-label': 'Căn cứ ghép' });
    var nutLuu = el('button', { type: 'button', class: 'nut nut-chinh', 'data-test': 'nut-luu-ghep', text: 'Ghép' });
    var form = el('div', { class: 'bieu-mau-ghep the', 'data-test': 'bieu-mau-ghep' }, [
      el('div', { class: 'truong' }, [el('label', { text: 'Ghép với chỉ tiêu chuẩn có sẵn' }), chon]),
      el('p', { class: 'phu', text: 'hoặc tạo chỉ tiêu chuẩn mới (năm mục nội dung sao từ chỉ tiêu này):' }),
      el('div', { class: 'truong' }, [el('label', { text: 'Mã mới' }), oMa]),
      el('div', { class: 'truong' }, [el('label', { text: 'Tên' }), oTen]),
      el('div', { class: 'truong' }, [el('label', { text: 'Căn cứ' }), oCanCu]),
      el('div', { class: 'hang-nut' }, [nutLuu])
    ]);
    noiHam.appendChild(form);
    api.goiApi('danhMuc.doc', { bang: 'DM_ChiTieu' }).then(function (ds) {
      chon.innerHTML = '';
      chon.appendChild(el('option', { value: '', text: ds.length ? '— chọn —' : 'Chưa có chỉ tiêu chuẩn nào' }));
      ds.forEach(function (c) { chon.appendChild(el('option', { value: c.maChiTieu, text: c.maChiTieu + ' — ' + c.tenChiTieu, selected: c.maChiTieu === r.maChiTieu })); });
    }).catch(function () { chon.innerHTML = ''; chon.appendChild(el('option', { value: '', text: 'Không tải được danh sách' })); });
    nutLuu.addEventListener('click', function () {
      var d = { maTrongBo: r.maTrongBo, canCu: oCanCu.value.trim() };
      if (oMa.value.trim()) d.taoMoi = { maChiTieu: oMa.value.trim(), tenChiTieu: oTen.value.trim() };
      else if (chon.value) d.maChiTieu = chon.value;
      else { ui.thongBao('Chọn chỉ tiêu chuẩn có sẵn hoặc nhập mã mới', 'loi'); return; }
      ui.ban(nutLuu, api.goiApi('chiTieu.ghep', d).then(function () {
        ui.thongBao('Đã ghép ' + r.maTrongBo + ' với ' + (d.maChiTieu || d.taoMoi.maChiTieu), 'thanh-cong');
        delete _dongCuaBo[b.maBo];
        api.goiApi('chiTieu.doc', {}).then(function (kq) { _dsBo = kq.bo || _dsBo; _dsChuan = kq.chuan || _dsChuan; }).catch(function () { /* làm mới lần sau */ });
        moChiTiet(r.maTrongBo, b, trangThai);
      }).catch(function (e) { ui.thongBao(e.message, 'loi'); }));
    });
  }

  // Xóa bộ nhớ đệm (sau khi nhập file) để lần mở sau đọc lại từ máy chủ.
  function lamMoi() { _dsBo = null; _dongCuaBo = {}; }

  return { ve: ve, lamMoi: lamMoi, dungCay: dungCay };
})();
