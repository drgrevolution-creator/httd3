/**
 * BoChiTieu — nghiệp vụ bộ chỉ tiêu (lớp thuần): khóa, chuẩn hóa dòng nhập, kiểm tra lô, dựng cây,
 * gợi ý ghép nội hàm, kế hoạch nhập lại. Dùng cho bảng ChiTieu_TrongBo (giai đoạn 1b).
 */
var BoChiTieu = (function () {
  var BANG = 'ChiTieu_TrongBo';
  // Từ dừng khi so tên (CÓ DẤU, bỏ trước khi bỏ dấu để "số" không nuốt "sơ"). Script Python
  // scripts/chuyen-doi/de_xuat_ghep.py đọc BoChiTieu.TU_DUNG qua node — sửa ở đây là đủ cho cả hai.
  var TU_DUNG = ['tỷ lệ', 'số lượng', 'số', 'tổng', 'tốc độ', 'tăng', 'trong đó'];
  // Cột do hệ thống quản lý: file nhập để trống thì giữ giá trị đang có.
  var COT_GIU_KHI_TRONG = { maChiTieu: 1, biThayTheBoi: 1, tinhTrangHieuLuc: 1 };

  // Khóa chỉ tiêu trong bộ: <maBo>:<maGoc>.
  function khoa(maBo, maGoc) { return String(maBo) + ':' + String(maGoc); }

  // Đọc số kiểu Việt Nam: "1.924.469" → 1924469, "0,8" → 0.8, "10" → 10. Không đọc được → null.
  function _soVN(s) {
    var t = String(s).replace(/\s/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '');
    t = t.replace(',', '.');
    var n = Number(t);
    return t !== '' && isFinite(n) ? n : null;
  }
  // Tách phép so sánh và số từ chuỗi mục tiêu nguyên văn.
  function _mucTieu(m) {
    var nv = String(m.nguyenVan === undefined || m.nguyenVan === null ? '' : m.nguyenVan).trim();
    var k = /^(>=|<=|≥|≤|>|<|=)?\s*(.*)$/.exec(nv);
    var phep = { '≥': '>=', '≤': '<=' }[k[1]] || k[1] || '=';
    var so = (m.so !== undefined && m.so !== null && m.so !== '') ? Number(m.so) : _soVN(k[2]);
    return { giaiDoan: String(m.giaiDoan || ''), nguyenVan: nv, phep: phep, so: so };
  }

  // Chuẩn hóa một dòng nhập: chuỗi đã trim cho cột chữ, mã gốc và STT là chuỗi, mucTieu là mảng đã tách số.
  function chuanHoaDong(dong) {
    var r = {};
    Object.keys(dong || {}).forEach(function (k) {
      var v = dong[k], c = SoDo.cot(BANG, k);
      if (k === 'mucTieu') {
        // Chuỗi JSON hợp lệ → mảng đã tách số; rỗng → []; sai dạng → GIỮ NGUYÊN để kiemTraLo báo lỗi dòng.
        var ds = v;
        if (v === undefined || v === null) ds = [];
        else if (typeof v === 'string') { if (!v.trim()) ds = []; else { try { ds = JSON.parse(v); } catch (e) { ds = v; } } }
        r[k] = Array.isArray(ds) ? ds.map(_mucTieu) : v;
      } else if (k === 'maGoc' || k === 'sttTrongBo') r[k] = (v === undefined || v === null) ? '' : String(v).trim();
      else if (c && c.kieu === 'number' && typeof v === 'string') {
        // Số từ file Excel (đọc dạng chữ): "10.000" → 10000; rỗng → ''; không đọc được → giữ chữ để kiemTraLo báo lỗi.
        var n = v.trim() === '' ? '' : _soVN(v);
        r[k] = n === null ? v : n;
      }
      else if (c && c.kieu !== 'number' && c.kieu !== 'json' && c.kieu !== 'boolean' && typeof v !== 'object') r[k] = (v === undefined || v === null) ? '' : String(v).trim();
      else r[k] = v;
    });
    return r;
  }

  // Kiểm tra một lô dòng của bộ maBo. tuyChon.daCo = mã đã có trong hệ thống (cho phép cha nằm ngoài lô).
  // tuyChon.loaiGiaTri = [{maLoaiGiaTri, coTuSoMauSo}] (DM_LoaiGiaTri): có thì kiểm mã loại và cảnh báo thiếu định nghĩa tử/mẫu
  // theo CỜ của loại (loại người dùng thêm sau cũng áp dụng). Cảnh báo không chặn nhập (Mr. Nobody chốt 27/11/2026).
  function kiemTraLo(maBo, dongs, tuyChon) {
    var loi = [], dem = {}, coMa = {}, canhBao = [], loaiTheoMa = null;
    if (tuyChon && tuyChon.loaiGiaTri) { loaiTheoMa = {}; tuyChon.loaiGiaTri.forEach(function (l) { loaiTheoMa[l.maLoaiGiaTri] = l; }); }
    var daCo = (tuyChon && tuyChon.daCo) || [];
    daCo.forEach(function (m) { coMa[m] = true; });
    dongs.forEach(function (r) { if (r.maTrongBo) coMa[r.maTrongBo] = true; });
    var cotChon = SoDo.BANG[BANG].cot.filter(function (c) { return c.kieu === 'select' && !c.heThong; });
    dongs.forEach(function (r, i) {
      var so = i + 1, ma = String(r.maTrongBo || '');
      if (!ma) loi.push({ dong: so, khoa: 'maTrongBo', thongBao: 'Thiếu mã trong bộ' });
      else if (ma.indexOf(maBo + ':') !== 0) loi.push({ dong: so, khoa: 'maTrongBo', thongBao: 'Mã ' + ma + ' không thuộc bộ ' + maBo });
      else if (dem[ma]) loi.push({ dong: so, khoa: 'maTrongBo', thongBao: 'Mã ' + ma + ' trùng với dòng ' + dem[ma] });
      if (ma && !dem[ma]) dem[ma] = so;
      if (!String(r.tenNguyenVan || '').trim()) loi.push({ dong: so, khoa: 'tenNguyenVan', thongBao: 'Thiếu tên chỉ tiêu' });
      if (r.mucTieu !== undefined && r.mucTieu !== '' && !Array.isArray(r.mucTieu)) loi.push({ dong: so, khoa: 'mucTieu', thongBao: 'Mục tiêu phải ghi dạng JSON, ví dụ [{"giaiDoan":"2026","nguyenVan":">=10"}]' });
      if (r.chaTrongBo && !coMa[r.chaTrongBo]) loi.push({ dong: so, khoa: 'chaTrongBo', thongBao: 'Không có chỉ tiêu cha ' + r.chaTrongBo });
      var rongCot = function (v) { return v === undefined || v === null || String(v).trim() === ''; };
      if (!rongCot(r.loaiGiaTri) && loaiTheoMa && !loaiTheoMa[r.loaiGiaTri]) loi.push({ dong: so, khoa: 'loaiGiaTri', thongBao: 'Loại giá trị "' + r.loaiGiaTri + '" không có trong danh mục Loại giá trị' });
      if (!rongCot(r.heSoNhan) && !(typeof r.heSoNhan === 'number' && r.heSoNhan > 0)) loi.push({ dong: so, khoa: 'heSoNhan', thongBao: 'Hệ số nhân phải là số dương, ví dụ 100, 10.000 hoặc 1' });
      var loai = loaiTheoMa && loaiTheoMa[r.loaiGiaTri];
      if (loai && (loai.coTuSoMauSo === true || String(loai.coTuSoMauSo).toUpperCase() === 'TRUE')) {
        [['dinhNghiaTuSo', 'Chưa có định nghĩa tử số'], ['dinhNghiaMauSo', 'Chưa có định nghĩa mẫu số']].forEach(function (x) {
          if (rongCot(r[x[0]])) canhBao.push({ dong: so, khoa: x[0], thongBao: x[1] + ' — Chưa quy định phương pháp tính' });
        });
      }
      cotChon.forEach(function (c) {
        var v = r[c.khoa];
        if (v !== undefined && v !== null && v !== '' && c.tuyChon.indexOf(v) < 0) loi.push({ dong: so, khoa: c.khoa, thongBao: '"' + c.ten + '" không hợp lệ: ' + v });
      });
    });
    return { hopLe: loi.length === 0, loi: loi, canhBao: canhBao };
  }

  // So sánh số thứ tự kiểu "6", "6.1", "10" theo từng phần số.
  function _soSanhStt(a, b) {
    var x = String(a || '').split('.'), y = String(b || '').split('.');
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var p = Number(x[i] || -1), q = Number(y[i] || -1);
      if (isNaN(p) || isNaN(q)) { var s = String(x[i] || '').localeCompare(String(y[i] || '')); if (s) return s; continue; }
      if (p !== q) return p - q;
    }
    return 0;
  }

  // Dựng cây: [{nhomMa, nhomTen, dong:[{dong, con:[...]}]}], nhóm và dòng theo thứ tự văn bản.
  function dungCay(dongs) {
    var theoMa = {}, nhom = {}, thuTuNhom = [];
    dongs.forEach(function (r) { theoMa[r.maTrongBo] = { dong: r, con: [] }; });
    var sx = function (a, b) { return _soSanhStt(a.dong.sttTrongBo, b.dong.sttTrongBo); };
    dongs.forEach(function (r) {
      var nut = theoMa[r.maTrongBo];
      if (r.chaTrongBo && theoMa[r.chaTrongBo]) { theoMa[r.chaTrongBo].con.push(nut); return; }
      var nm = r.nhomMa || '';
      if (!nhom[nm]) { nhom[nm] = { nhomMa: nm, nhomTen: r.nhomTen || '', dong: [] }; thuTuNhom.push(nhom[nm]); }
      if (!nhom[nm].nhomTen && r.nhomTen) nhom[nm].nhomTen = r.nhomTen;
      nhom[nm].dong.push(nut);
    });
    Object.keys(theoMa).forEach(function (m) { theoMa[m].con.sort(sx); });
    thuTuNhom.forEach(function (g) { g.dong.sort(sx); });
    thuTuNhom.sort(function (a, b) { return _soSanhStt(a.dong[0] && a.dong[0].dong.sttTrongBo, b.dong[0] && b.dong[0].dong.sttTrongBo); });
    return thuTuNhom;
  }

  // Bỏ dấu tiếng Việt, chữ thường, bỏ dấu câu và từ dừng.
  function chuanHoaTen(ten) {
    var s = ' ' + String(ten || '').normalize('NFC').toLowerCase().replace(/[^0-9a-z\u00c0-\u024f\u1e00-\u1eff]+/g, ' ') + ' ';
    TU_DUNG.forEach(function (w) { s = s.split(' ' + w + ' ').join(' '); s = s.split(' ' + w + ' ').join(' '); });
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    return s.replace(/\s+/g, ' ').trim();
  }
  // Gợi ý tối đa 3 chỉ tiêu chuẩn có tên gần giống (Jaccard trên tập từ đã chuẩn hóa).
  function goiYGhep(ten, dsChuan, nguong) {
    nguong = nguong === undefined ? 0.6 : nguong;
    var a = _tap(chuanHoaTen(ten)); if (!a.n) return [];
    return (dsChuan || []).map(function (c) {
      var b = _tap(chuanHoaTen(c.tenChiTieu)), chung = 0;
      Object.keys(a.s).forEach(function (w) { if (b.s[w]) chung++; });
      var hop = a.n + b.n - chung;
      return { maChiTieu: c.maChiTieu, tenChiTieu: c.tenChiTieu, diem: hop ? Math.round(chung / hop * 100) / 100 : 0 };
    }).filter(function (x) { return x.diem >= nguong; }).sort(function (x, y) { return y.diem - x.diem; }).slice(0, 3);
  }
  function _tap(s) { var o = {}, n = 0; s.split(' ').forEach(function (w) { if (w && !o[w]) { o[w] = 1; n++; } }); return { s: o, n: n }; }

  // Giá trị so sánh của một ô (rỗng thống nhất, mảng/đối tượng theo JSON).
  // Mảng rỗng coi như ô trống (sheet lưu '' cho mucTieu không có mục tiêu; file thiếu cột cũng là trống).
  function _gt(v) { return (v === undefined || v === null || (Array.isArray(v) && !v.length)) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); }

  // Kế hoạch nhập lại bộ: so dòng đang có với dòng mới theo maTrongBo.
  function keHoachNhap(daCo, moi) {
    var cot = SoDo.BANG[BANG].cot.filter(function (c) { return !c.heThong && !c.khoaChinh; }).map(function (c) { return c.khoa; });
    var cu = {}; daCo.forEach(function (r) { cu[r.maTrongBo] = chuanHoaDong(r); });
    var thay = {}, them = [], sua = [], giuNguyen = 0, boGhep = [];
    moi.forEach(function (r0) {
      var r = chuanHoaDong(r0); thay[r.maTrongBo] = true;
      var c = cu[r.maTrongBo];
      if (!c) { them.push(r); return; }
      var td = {};
      cot.forEach(function (k) {
        if (k === 'tinhTrangHieuLuc') return;
        if (COT_GIU_KHI_TRONG[k] && _gt(r[k]) === '') return;
        if (_gt(r[k]) !== _gt(c[k])) td[k] = r[k] === undefined ? '' : r[k];
      });
      if (c.tinhTrangHieuLuc === 'Hết hiệu lực') td.tinhTrangHieuLuc = 'Còn hiệu lực';
      // Dòng đã ghép mà đổi tên (ví dụ khóa dòng không số bị dịch khi văn bản chèn dòng mới): bỏ ghép để số liệu
      // không gắn nhầm chỉ tiêu chuẩn; file ghi rõ maChiTieu thì theo file. Người dùng ghép lại nếu vẫn cùng nội hàm.
      if (td.tenNguyenVan !== undefined && _gt(c.maChiTieu) !== '' && _gt(r.maChiTieu) === '') {
        td.maChiTieu = '';
        boGhep.push({ ma: r.maTrongBo, maChiTieu: c.maChiTieu, tenCu: c.tenNguyenVan, tenMoi: r.tenNguyenVan });
      }
      if (Object.keys(td).length) sua.push({ ma: r.maTrongBo, thayDoi: td }); else giuNguyen++;
    });
    var het = daCo.filter(function (r) { return !thay[r.maTrongBo] && r.tinhTrangHieuLuc !== 'Hết hiệu lực'; }).map(function (r) { return r.maTrongBo; });
    return { them: them, sua: sua, hetHieuLuc: het, giuNguyen: giuNguyen, boGhep: boGhep };
  }

  // Mức liên quan cấp xã gợi ý từ cấp dữ liệu.
  function mucLienQuanTuCap(capDuLieu) { return /Xã/.test(String(capDuLieu || '')) ? 'A' : 'C'; }

  return { TU_DUNG: TU_DUNG, khoa: khoa, chuanHoaDong: chuanHoaDong, kiemTraLo: kiemTraLo, dungCay: dungCay, chuanHoaTen: chuanHoaTen, goiYGhep: goiYGhep, keHoachNhap: keHoachNhap, mucLienQuanTuCap: mucLienQuanTuCap };
})();
