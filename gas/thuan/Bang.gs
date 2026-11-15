/**
 * Bang — chuyển đổi giữa ma trận ô của Sheets và bản ghi (đối tượng), kiểm tra bản ghi theo SoDo.
 * Lớp thuần: không gọi dịch vụ Google.
 */
var Bang = (function () {
  var RE_NGAY = /^\d{4}-\d{2}-\d{2}$/;
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Hai dòng tiêu đề của bảng: [khóa cột[], tên hiển thị[]].
  function dongTieuDe(tenBang) {
    var cot = SoDo.BANG[tenBang].cot;
    return [cot.map(function (c) { return c.khoa; }), cot.map(function (c) { return c.ten; })];
  }

  // Chuyển một ô thô của Sheets thành giá trị theo kiểu cột. Giữ nguyên chuỗi cho text.
  function _tuO(cot, o) {
    if (o === null || o === undefined || o === '') return cot.kieu === 'multiselect' ? [] : '';
    switch (cot.kieu) {
      case 'number': { var n = typeof o === 'number' ? o : Number(String(o).replace(',', '.')); return isNaN(n) ? String(o) : n; }
      case 'boolean': return o === true || String(o).toUpperCase() === 'TRUE' || o === 1 || o === '1';
      case 'multiselect': case 'json': {
        if (typeof o !== 'string') return o;
        try { return JSON.parse(o); } catch (e) { return cot.kieu === 'multiselect' ? String(o).split(';').map(function (x) { return x.trim(); }).filter(Boolean) : o; }
      }
      case 'date': case 'datetime': return (o instanceof Date) ? _dinhDangNgay(o, cot.kieu) : String(o);
      default: return String(o);
    }
  }
  // Định dạng Date (nếu Sheets tự đổi kiểu) về chuỗi chuẩn; giờ Việt Nam giả định đã đúng ở lớp kết nối.
  function _dinhDangNgay(d, kieu) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    if (kieu === 'date') return s;
    return s + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + '+07:00';
  }

  // Ma trận (dòng 1 khóa, dòng 2 tên, dữ liệu từ dòng 3) → {banGhi, loi}. Dòng trống bị bỏ qua.
  function tuMaTran(tenBang, maTran) {
    var cotTheoKhoa = {}; SoDo.BANG[tenBang].cot.forEach(function (c) { cotTheoKhoa[c.khoa] = c; });
    var khoa = (maTran[0] || []).map(String), banGhi = [], loi = [];
    for (var i = 2; i < maTran.length; i++) {
      var dong = maTran[i], rong = true, r = {};
      for (var j = 0; j < khoa.length; j++) {
        var o = dong[j], c = cotTheoKhoa[khoa[j]];
        if (!c) continue;
        if (o !== '' && o !== null && o !== undefined) rong = false;
        r[c.khoa] = _tuO(c, o);
        if ((c.kieu === 'multiselect' || c.kieu === 'json') && typeof o === 'string' && o && typeof r[c.khoa] === 'string') loi.push('Dòng ' + (i + 1) + ' cột ' + c.khoa + ': JSON không hợp lệ');
      }
      if (!rong) { r.__dong = i + 1; banGhi.push(r); }
    }
    return { banGhi: banGhi, loi: loi };
  }

  // Bản ghi → mảng ô theo thứ tự cột của sơ đồ (multiselect/json thành chuỗi JSON).
  function thanhDong(tenBang, banGhi) {
    return SoDo.BANG[tenBang].cot.map(function (c) {
      var v = banGhi[c.khoa];
      if (v === undefined || v === null) return '';
      if (c.kieu === 'multiselect' || c.kieu === 'json') return typeof v === 'string' ? v : JSON.stringify(v);
      if (c.kieu === 'boolean') return v ? 'TRUE' : 'FALSE';
      return v;
    });
  }

  // Kiểm tra bản ghi theo sơ đồ. tuyChon.thamChieu = {tenBang: [mã...]} dùng cho cột ref/multiselect có thamChieu.
  function kiemTra(tenBang, banGhi, tuyChon) {
    var thamChieu = (tuyChon && tuyChon.thamChieu) || {};
    var loi = [];
    SoDo.BANG[tenBang].cot.forEach(function (c) {
      var v = banGhi[c.khoa];
      var rong = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (c.batBuoc && rong) { loi.push({ khoa: c.khoa, thongBao: 'Thiếu "' + c.ten + '"' }); return; }
      if (rong) return;
      switch (c.kieu) {
        case 'number': if (typeof v !== 'number' || isNaN(v)) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" phải là số' }); break;
        case 'date': if (!RE_NGAY.test(String(v))) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" phải dạng YYYY-MM-DD' }); break;
        case 'email': if (!RE_EMAIL.test(String(v))) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" không phải email hợp lệ' }); break;
        case 'boolean': if (typeof v !== 'boolean') loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" phải là đúng/sai' }); break;
        case 'select': if (c.tuyChon && c.tuyChon.indexOf(v) < 0) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" ngoài danh sách cho phép' }); break;
        case 'multiselect': {
          if (!Array.isArray(v)) { loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" phải là danh sách' }); break; }
          var ds = c.thamChieu ? thamChieu[c.thamChieu] : c.tuyChon;
          if (ds) { var sai = v.filter(function (x) { return ds.indexOf(x) < 0; }); if (sai.length) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" có giá trị không hợp lệ: ' + sai.join(', ') }); }
          break;
        }
        case 'ref': { var ds2 = thamChieu[c.thamChieu]; if (ds2 && ds2.indexOf(v) < 0) loi.push({ khoa: c.khoa, thongBao: '"' + c.ten + '" trỏ tới mã không tồn tại: ' + v }); break; }
        default: break;
      }
    });
    return { hopLe: loi.length === 0, loi: loi };
  }

  // Bỏ các cột đánh dấu an:true (mật khẩu băm, muối...) trước khi trả ra ngoài.
  function anCotNhayCam(tenBang, banGhi) {
    var an = {}; SoDo.BANG[tenBang].cot.forEach(function (c) { if (c.an) an[c.khoa] = true; });
    var r = {}; Object.keys(banGhi).forEach(function (k) { if (!an[k] && k !== '__dong') r[k] = banGhi[k]; });
    return r;
  }

  return { dongTieuDe: dongTieuDe, tuMaTran: tuMaTran, thanhDong: thanhDong, kiemTra: kiemTra, anCotNhayCam: anCotNhayCam };
})();
