// nhap-chi-tieu.js — màn Nhập bộ chỉ tiêu từ file mẫu chuẩn (.xlsx): đọc trên trình duyệt, xem trước, ghi.
window.HTTD3 = window.HTTD3 || {};
HTTD3.nhapChiTieu = (function () {
  var ui = HTTD3.ui, api = HTTD3.api, el = ui.el;
  var URL_SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var DONG_DAU_DU_LIEU = 3;   // dòng 1 khóa cột, dòng 2 tên cột, dữ liệu từ dòng 3
  var _taiSheetJS = null;

  // Tải SheetJS một lần, chỉ khi cần (màn Nhập).
  function taiSheetJS() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (_taiSheetJS) return _taiSheetJS;
    _taiSheetJS = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = URL_SHEETJS; s.async = true;
      s.onload = function () { window.XLSX ? resolve(window.XLSX) : reject(new Error('Không nạp được thư viện đọc Excel')); };
      s.onerror = function () { _taiSheetJS = null; reject(new Error('Không tải được thư viện đọc Excel. Kiểm tra mạng rồi chọn lại file.')); };
      document.head.appendChild(s);
    });
    return _taiSheetJS;
  }

  // Một sheet → {khoa, dong:[{banGhi, dongExcel}]}. Đọc ở dạng chữ (raw:false) để giữ "0101" và ">=1.924.469".
  function docSheet(XLSX, ws) {
    var mang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    var khoa = (mang[0] || []).map(function (k) { return String(k).trim(); });
    var dong = [];
    for (var i = DONG_DAU_DU_LIEU - 1; i < mang.length; i++) {
      var r = {}, coGiaTri = false;
      khoa.forEach(function (k, j) { if (!k) return; var v = mang[i][j] === undefined ? '' : String(mang[i][j]); r[k] = v; if (v.trim() !== '') coGiaTri = true; });
      if (coGiaTri) dong.push({ banGhi: r, dongExcel: i + 1 });
    }
    return { khoa: khoa, dong: dong };
  }

  // Đọc file mẫu chuẩn → {bo, dong, dongExcel}. Ném lỗi dễ hiểu nếu file không đúng mẫu.
  function docFile(file) {
    return Promise.all([taiSheetJS(), file.arrayBuffer()]).then(function (kq) {
      var XLSX = kq[0], wb;
      try { wb = XLSX.read(new Uint8Array(kq[1]), { type: 'array' }); } catch (e) { throw new Error('Không đọc được file Excel: ' + e.message); }
      if (!wb.Sheets.Bo || !wb.Sheets.ChiTieu) throw new Error('File không đúng mẫu chuẩn: cần hai sheet "Bo" và "ChiTieu".');
      var bo = docSheet(XLSX, wb.Sheets.Bo), ct = docSheet(XLSX, wb.Sheets.ChiTieu);
      if (ct.khoa.indexOf('maTrongBo') < 0 || ct.khoa.indexOf('tenNguyenVan') < 0) throw new Error('Sheet "ChiTieu" thiếu dòng 1 là mã cột (maTrongBo, tenNguyenVan…). Đừng sửa hoặc xóa dòng 1.');
      if (!bo.dong.length) throw new Error('Sheet "Bo" chưa có thông tin bộ ở dòng 3.');
      return { bo: bo.dong[0].banGhi, dong: ct.dong.map(function (d) { return d.banGhi; }), dongExcel: ct.dong.map(function (d) { return d.dongExcel; }) };
    });
  }

  function chip(nhan, so, test, mau) { return el('span', { class: 'nhan-trang-thai', 'data-mau': so ? (mau || 'xanh') : null, 'data-test': test, text: nhan + ' ' + so }); }

  // Vẽ màn Nhập.
  function ve(goc) {
    goc.innerHTML = '';
    var trang = { file: null, duLieu: null, xemTruoc: null };
    var oFile = el('input', { type: 'file', accept: '.xlsx', id: 'chon-file', class: 'o-nhap', 'data-test': 'chon-file' });
    var oCanCu = el('input', { type: 'text', id: 'can-cu-nhap', class: 'o-nhap', 'data-test': 'o-canCu', placeholder: 'Ví dụ: Nhập theo TT 13/2025/TT-BNV' });
    var nutGhi = el('button', { type: 'button', class: 'nut nut-chinh', 'data-test': 'nut-ghi', disabled: true, text: 'Ghi vào hệ thống' });
    var vungKetQua = el('div', { 'data-test': 'ket-qua-xem-truoc' });

    goc.appendChild(el('div', { class: 'dau-muc', 'data-test': 'man-nhap-chi-tieu' }, [
      el('h1', { text: 'Nhập bộ chỉ tiêu' }),
      el('span', { class: 'phu', text: 'Từ file mẫu chuẩn (.xlsx) · xem trước rồi mới ghi' })
    ]));
    goc.appendChild(el('section', { class: 'the' }, [
      el('p', { text: 'Chọn file mẫu chuẩn có hai sheet "Bo" và "ChiTieu". Hệ thống đọc file ngay trên máy, so với dữ liệu đang có và cho xem trước; chưa ghi gì cho đến khi bấm "Ghi vào hệ thống". Nhập lại cùng bộ là cập nhật: dòng không còn trong file chuyển "Hết hiệu lực", không bị xóa.' }),
      el('div', { class: 'truong' }, [el('label', { for: 'chon-file', text: 'File mẫu chuẩn' }), oFile]),
      el('div', { class: 'truong' }, [el('label', { for: 'can-cu-nhap', text: 'Căn cứ (ghi vào nhật ký)' }), oCanCu])
    ]));
    goc.appendChild(vungKetQua);
    goc.appendChild(el('div', { class: 'hang-nut' }, [nutGhi]));

    function datDangTai(chu) { vungKetQua.innerHTML = ''; vungKetQua.appendChild(el('p', { class: 'dang-tai', text: chu })); nutGhi.disabled = true; }
    function baoLoiChung(thongBao) { vungKetQua.innerHTML = ''; vungKetQua.appendChild(el('section', { class: 'the' }, [el('p', { class: 'loi', 'data-test': 'loi-file', text: thongBao })])); nutGhi.disabled = true; }

    function veXemTruoc() {
      var d = trang.duLieu, x = trang.xemTruoc, kh = x.keHoach, loi = x.kiemTra.loi || [];
      vungKetQua.innerHTML = '';
      var soGoiY = Object.keys(x.goiYGhep || {}).length;
      vungKetQua.appendChild(el('section', { class: 'the' }, [
        el('h2', { text: (d.bo.maBo || '(chưa có mã bộ)') + (d.bo.tenBo ? ' — ' + d.bo.tenBo : '') }),
        el('p', { text: trang.file.name + ' · ' + d.dong.length + ' dòng chỉ tiêu' }),
        el('div', { class: 'chip-loc', 'data-test': 'tom-tat' }, [chip('Thêm', kh.soThem, 'so-them'), chip('Sửa', kh.soSua, 'so-sua'), chip('Hết hiệu lực', kh.soHetHieuLuc, 'so-het', 'do'), chip('Giữ nguyên', kh.giuNguyen, 'so-giu')]),
        soGoiY ? el('p', { class: 'goi-y', text: soGoiY + ' dòng có gợi ý ghép với chỉ tiêu chuẩn đã có — ghép sau khi duyệt danh sách đề xuất, hệ thống không tự ghép.' }) : null
      ]));
      if (loi.length) {
        vungKetQua.appendChild(el('section', { class: 'the' }, [
          el('h2', { class: 'loi', text: loi.length + ' lỗi — sửa trong file rồi chọn lại' }),
          el('ul', { 'data-test': 'loi-nhap' }, loi.map(function (l) {
            var noi = l.dong ? 'Dòng ' + (d.dongExcel[l.dong - 1] || l.dong + DONG_DAU_DU_LIEU - 1) : 'Sheet Bo';
            return el('li', { text: noi + ' · ' + l.khoa + ': ' + l.thongBao });
          }))
        ]));
      } else vungKetQua.appendChild(el('ul', { 'data-test': 'loi-nhap', hidden: true }));
      var COT = [['maTrongBo', 'Mã trong bộ'], ['maGoc', 'Mã gốc'], ['sttTrongBo', 'STT'], ['nhomMa', 'Nhóm'], ['tenNguyenVan', 'Tên chỉ tiêu'], ['capDuLieu', 'Cấp dữ liệu'], ['chaTrongBo', 'Thuộc chỉ tiêu']];
      var dongLoi = {}; loi.forEach(function (l) { if (l.dong) dongLoi[l.dong] = true; });
      vungKetQua.appendChild(el('div', { class: 'cuon-ngang the' }, [el('table', { class: 'bang', 'data-test': 'bang-xem-truoc' }, [
        el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: 'Dòng' })].concat(COT.map(function (c) { return el('th', { scope: 'col', text: c[1] }); })))]),
        el('tbody', {}, d.dong.map(function (r, i) {
          return el('tr', { 'data-ma': r.maTrongBo, 'data-loi': dongLoi[i + 1] ? 'true' : null }, [el('td', { text: String(d.dongExcel[i]) })].concat(COT.map(function (c) {
            var v = r[c[0]] === undefined ? '' : String(r[c[0]]);
            return el('td', { 'data-cot': c[0], title: v, text: v });
          })));
        }))
      ])]));
      // Dòng không còn trong file sẽ chuyển "Hết hiệu lực": bắt xác nhận riêng để tránh nhập nhầm file thiếu dòng.
      var xacNhan = null;
      if (x.kiemTra.hopLe && kh.soHetHieuLuc > 0) {
        xacNhan = el('input', { type: 'checkbox', id: 'xac-nhan-het', 'data-test': 'xac-nhan-het-hieu-luc' });
        vungKetQua.appendChild(el('section', { class: 'the canh-bao-het' }, [
          el('p', { class: 'loi', text: kh.soHetHieuLuc + ' chỉ tiêu đang có trong bộ ' + d.bo.maBo + ' không có trong file này và sẽ chuyển "Hết hiệu lực" (không bị xóa, nhập lại file đầy đủ sẽ khôi phục).' }),
          el('label', { for: 'xac-nhan-het', class: 'nhom-chon' }, [xacNhan, el('span', { text: 'Tôi hiểu, đây là file đầy đủ của bộ' })])
        ]));
      }
      function capNhatNut() {
        nutGhi.disabled = !x.kiemTra.hopLe || (kh.soThem + kh.soSua + kh.soHetHieuLuc === 0) || (xacNhan && !xacNhan.checked);
        nutGhi.title = !x.kiemTra.hopLe ? 'Còn lỗi trong file' : (kh.soThem + kh.soSua + kh.soHetHieuLuc === 0 ? 'File giống hệt dữ liệu đang có, không có gì để ghi' : (xacNhan && !xacNhan.checked ? 'Cần xác nhận các chỉ tiêu sẽ chuyển Hết hiệu lực' : ''));
      }
      if (xacNhan) xacNhan.addEventListener('change', capNhatNut);
      capNhatNut();
    }

    oFile.addEventListener('change', function () {
      var f = oFile.files && oFile.files[0]; if (!f) return;
      trang.file = f; trang.duLieu = null; trang.xemTruoc = null;
      if (!oCanCu.value.trim() || oCanCu.dataset.tuDong === '1') { oCanCu.value = 'Nhập file ' + f.name; oCanCu.dataset.tuDong = '1'; }
      datDangTai('Đang đọc file…');
      docFile(f).then(function (duLieu) {
        trang.duLieu = duLieu;
        datDangTai('Đang so với dữ liệu hiện có…');
        return api.goiApi('chiTieu.nhap', { bo: duLieu.bo, dong: duLieu.dong, cheDo: 'xemTruoc' });
      }).then(function (x) { trang.xemTruoc = x; veXemTruoc(); })
        .catch(function (e) { baoLoiChung(e.message); });
    });
    oCanCu.addEventListener('input', function () { oCanCu.dataset.tuDong = '0'; });

    nutGhi.addEventListener('click', function () {
      if (!trang.duLieu || !trang.xemTruoc) return;
      var d = trang.duLieu;
      nutGhi.disabled = true; nutGhi.setAttribute('aria-busy', 'true');
      api.goiApi('chiTieu.nhap', { bo: d.bo, dong: d.dong, cheDo: 'ghi', canCu: oCanCu.value.trim() }).then(function (kq) {
        ui.thongBao('Đã nhập ' + d.dong.length + ' chỉ tiêu vào bộ ' + kq.maBo + ': thêm ' + kq.soThem + ', sửa ' + kq.soSua + ', hết hiệu lực ' + kq.soHetHieuLuc + ', giữ nguyên ' + kq.giuNguyen + '.', 'thanh-cong');
        trang.duLieu = null; trang.xemTruoc = null; oFile.value = '';
        if (HTTD3.chiTieu) HTTD3.chiTieu.lamMoi();
        vungKetQua.innerHTML = '';
        vungKetQua.appendChild(el('section', { class: 'the' }, [el('p', { text: 'Đã ghi bộ ' + kq.maBo + '. Có thể chọn file khác để nhập tiếp.' })]));
      }).catch(function (e) { ui.thongBao(e.message, 'loi'); nutGhi.disabled = false; })
        .then(function () { nutGhi.removeAttribute('aria-busy'); });
    });
  }

  return { ve: ve, docFile: docFile, taiSheetJS: taiSheetJS };
})();
