/**
 * KhoDuLieu — lớp kết nối Google Sheets: đọc bảng, thêm, cập nhật, cấp mã, ghi nhật ký.
 * Mọi ghi vào bảng nghiệp vụ/danh mục đi qua khóa LockService 30 giây.
 */
var KhoDuLieu = (function () {
  var _cacheSS = {}, _cacheBang = {};
  var KIEU_CHU = { text: 1, textarea: 1, email: 1, json: 1, multiselect: 1, date: 1, datetime: 1, select: 1, ref: 1 };

  function _loi(ma, thongBao, chiTiet) { var e = new Error(ma + ': ' + thongBao); e.ma = ma; e.thongBao = thongBao; if (chiTiet) e.chiTiet = chiTiet; return e; }
  function _props() { return PropertiesService.getScriptProperties(); }

  // ID spreadsheet theo tên file, lưu trong Script Properties khóa ID_<tenFile>.
  function idFile(tenFile) {
    var id = _props().getProperty('ID_' + tenFile);
    if (!id) throw _loi('CHUA_THIET_LAP', 'Chưa thiết lập file ' + tenFile + '. Chạy ThietLap.thietLapLanDau trước.');
    return id;
  }
  function _ss(tenFile) { if (!_cacheSS[tenFile]) _cacheSS[tenFile] = SpreadsheetApp.openById(idFile(tenFile)); return _cacheSS[tenFile]; }
  function _sheet(tenBang) {
    var b = SoDo.BANG[tenBang]; if (!b) throw _loi('KHONG_TIM_THAY', 'Không có bảng ' + tenBang);
    var sh = _ss(b.file).getSheetByName(tenBang);
    if (!sh) throw _loi('CHUA_THIET_LAP', 'Thiếu sheet ' + tenBang + ' trong ' + b.file);
    return sh;
  }

  // Thời điểm hiện tại dạng ISO +07:00.
  function bayGioIso() { return ThoiGian.tuMs(Date.now()); }

  // Chạy fn dưới khóa toàn cục 30 giây. Tái nhập được: nếu lần chạy này đang giữ khóa thì chạy thẳng.
  var _dangGiuKhoa = false;
  function khoa(fn) {
    if (_dangGiuKhoa) return fn();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw _loi('HE_THONG_BAN', 'Hệ thống đang bận, vui lòng thử lại sau ít giây');
    _dangGiuKhoa = true;
    try { return fn(); } finally { _dangGiuKhoa = false; lock.releaseLock(); }
  }

  // Tiêu đề dòng 1 phải khớp sơ đồ (cột thừa ở cuối được bỏ qua). Lệch → trả thông báo, khớp → null.
  // Ghi theo thứ tự cột sơ đồ vào sheet lệch tiêu đề sẽ làm lệch dữ liệu, nên mọi đọc/ghi bảng đó phải dừng.
  function _lechTieuDe(tenBang, hang1) {
    var cot = SoDo.BANG[tenBang].cot;
    for (var i = 0; i < cot.length; i++) {
      if (String(hang1[i] === undefined ? '' : hang1[i]) !== cot[i].khoa) {
        return 'Sheet ' + tenBang + ' có tiêu đề cột khác sơ đồ (cột ' + (i + 1) + ': "' + (hang1[i] === undefined ? '' : hang1[i]) + '" thay vì "' + cot[i].khoa + '"). Chạy lại chayThietLapLanDau; nếu vẫn báo, liên hệ quản trị.';
      }
    }
    return null;
  }
  function kiemTieuDe(tenBang) {
    var sh = _sheet(tenBang);
    if (sh.getLastRow() < 1) return null;
    return _lechTieuDe(tenBang, sh.getRange(1, 1, 1, SoDo.BANG[tenBang].cot.length).getValues()[0]);
  }

  // Đọc toàn bộ bản ghi của bảng (cache trong một lần chạy). tuyChon.baoGomXoaMem = true để lấy cả bản ghi xóa mềm.
  function docBang(tenBang, tuyChon) {
    if (!_cacheBang[tenBang]) {
      var sh = _sheet(tenBang);
      var gt = sh.getLastRow() >= 1 ? sh.getRange(1, 1, Math.max(sh.getLastRow(), 2), SoDo.BANG[tenBang].cot.length).getValues() : [[], []];
      var lech = sh.getLastRow() >= 1 ? _lechTieuDe(tenBang, gt[0]) : null;
      if (lech) throw _loi('CHUA_THIET_LAP', lech);
      _cacheBang[tenBang] = Bang.tuMaTran(tenBang, gt).banGhi;
    }
    var ds = _cacheBang[tenBang];
    return (tuyChon && tuyChon.baoGomXoaMem) ? ds.slice() : ds.filter(function (r) { return r.tinhTrang !== 'Xóa mềm'; });
  }
  function _xoaCache(tenBang) { delete _cacheBang[tenBang]; }

  // Tìm một bản ghi theo khóa chính (kể cả xóa mềm). Trả null nếu không có.
  function timDong(tenBang, ma) {
    var kc = SoDo.khoaChinh(tenBang);
    return docBang(tenBang, { baoGomXoaMem: true }).filter(function (r) { return String(r[kc]) === String(ma); })[0] || null;
  }

  // Bản đồ tham chiếu {bang: [mã...]} cho các cột ref/multiselect của bảng.
  function thamChieuCua(tenBang) {
    var tc = {};
    SoDo.BANG[tenBang].cot.forEach(function (c) {
      if (c.thamChieu && !tc[c.thamChieu]) { var kc = SoDo.khoaChinh(c.thamChieu); tc[c.thamChieu] = docBang(c.thamChieu).map(function (r) { return r[kc]; }); }
    });
    return tc;
  }

  // Định dạng ô của một dòng: cột chữ là '@' để Sheets không tự đổi kiểu.
  function _ghiDong(sh, viTri, tenBang, banGhi) {
    var cot = SoDo.BANG[tenBang].cot;
    var rg = sh.getRange(viTri, 1, 1, cot.length);
    rg.setNumberFormats([cot.map(function (c) { return KIEU_CHU[c.kieu] ? '@' : 'General'; })]);
    rg.setValues([Bang.thanhDong(tenBang, banGhi)]);
  }

  // Cấp mã tiếp theo cho bảng từ sheet BoDem (gọi bên trong khóa).
  function capMa(tenBang) {
    var b = SoDo.BANG[tenBang];
    var sh = _sheet('BoDem'), gt = sh.getLastRow() >= 3 ? sh.getRange(3, 1, sh.getLastRow() - 2, 3).getValues() : [];
    var nam = new Date().getFullYear(), viTri = -1, soHienTai = 0, namLuu = nam;
    for (var i = 0; i < gt.length; i++) if (String(gt[i][0]) === b.tienToMa) { viTri = i + 3; namLuu = Number(gt[i][1]) || nam; soHienTai = Number(gt[i][2]) || 0; break; }
    var kq = MaSo.sinh(tenBang, { soHienTai: soHienTai, nam: namLuu, namHienTai: nam });
    if (viTri < 0) sh.appendRow([b.tienToMa, kq.nam || nam, kq.soMoi]); else sh.getRange(viTri, 2, 1, 2).setValues([[kq.nam || nam, kq.soMoi]]);
    return kq.ma;
  }

  // Mã theo thời gian cho bảng nhật ký: <tienTo>-<yyyyMMddHHmmss>-<4 ký tự>.
  function maThoiGian(tenBang) {
    var t = bayGioIso().replace(/[-:T]/g, '').slice(0, 14);
    return SoDo.BANG[tenBang].tienToMa + '-' + t + '-' + Utilities.getUuid().slice(0, 4);
  }

  // Thêm dòng không kiểm tra sơ đồ (nhật ký, phiên, lịch sử), nhưng vẫn dưới khóa để hai lần ghi đồng thời không đè nhau.
  function themDongThang(tenBang, banGhi) {
    var kc = SoDo.khoaChinh(tenBang), r = Object.assign({}, banGhi);
    if (!r[kc]) r[kc] = maThoiGian(tenBang);
    if (!r.tinhTrang) r.tinhTrang = 'Hoạt động';
    if (!r.taoLuc) r.taoLuc = bayGioIso();
    return khoa(function () {
      var sh = _sheet(tenBang);
      _ghiDong(sh, sh.getLastRow() + 1, tenBang, r);
      _xoaCache(tenBang);
      return r;
    });
  }

  // Ghi một dòng nhật ký hệ thống.
  function ghiNhatKy(o) {
    var d = NhatKy.dong(Object.assign({ bayGioIso: bayGioIso() }, o));
    return themDongThang('NhatKy', d);
  }

  // Điền giá trị mặc định của sơ đồ cho cột còn trống.
  function _dienMacDinh(tenBang, r) {
    SoDo.BANG[tenBang].cot.forEach(function (c) { if ((r[c.khoa] === undefined || r[c.khoa] === '') && c.macDinh !== undefined) r[c.khoa] = c.macDinh; });
    return r;
  }

  // Thêm bản ghi có kiểm tra, cấp mã, nhật ký. Trả bản ghi đã ghi.
  function themDong(tenBang, banGhi, phien, canCu) {
    var b = SoDo.BANG[tenBang], kc = SoDo.khoaChinh(tenBang), gio = bayGioIso();
    return khoa(function () {
      _xoaCache(tenBang);
      var r = _dienMacDinh(tenBang, Object.assign({}, banGhi));
      if (b.dinhDangMa !== 'TU_NHAP') r[kc] = capMa(tenBang);
      else {
        if (!MaSo.hopLe(tenBang, String(r[kc] || ''))) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Mã "' + (r[kc] || '') + '" không hợp lệ (2–30 ký tự chữ, số, . _ -)', [{ khoa: kc }]);
        if (timDong(tenBang, r[kc])) throw _loi('DU_LIEU_KHONG_HOP_LE', 'Mã ' + r[kc] + ' đã tồn tại', [{ khoa: kc }]);
      }
      r.taoLuc = gio; r.taoBoi = (phien && phien.email) || 'he-thong'; r.capNhatLuc = gio; r.capNhatBoi = r.taoBoi; r.tinhTrang = 'Hoạt động';
      var kt = Bang.kiemTra(tenBang, r, { thamChieu: thamChieuCua(tenBang) });
      if (!kt.hopLe) throw _loi('DU_LIEU_KHONG_HOP_LE', kt.loi.map(function (l) { return l.thongBao; }).join('; '), kt.loi);
      var sh = _sheet(tenBang);
      _ghiDong(sh, sh.getLastRow() + 1, tenBang, r);
      _xoaCache(tenBang);
      ghiNhatKy({ phien: phien, hanhDong: 'THEM', bang: tenBang, ma: r[kc], sau: r, canCu: canCu || '' });
      return r;
    });
  }

  // Cập nhật một phần bản ghi theo khóa chính; ghi nhật ký khác biệt. tuyChon.hanhDong mặc định 'SUA'.
  function capNhatDong(tenBang, ma, thayDoi, phien, canCu, tuyChon) {
    var kc = SoDo.khoaChinh(tenBang), gio = bayGioIso();
    return khoa(function () {
      _xoaCache(tenBang);
      var cu = timDong(tenBang, ma);
      if (!cu) throw _loi('KHONG_TIM_THAY', 'Không tìm thấy ' + tenBang + ' có mã ' + ma);
      var moi = Object.assign({}, cu, thayDoi);
      moi[kc] = cu[kc]; moi.taoLuc = cu.taoLuc; moi.taoBoi = cu.taoBoi; moi.capNhatLuc = gio; moi.capNhatBoi = (phien && phien.email) || 'he-thong';
      delete moi.__dong;
      var kt = Bang.kiemTra(tenBang, moi, { thamChieu: thamChieuCua(tenBang) });
      if (!kt.hopLe) throw _loi('DU_LIEU_KHONG_HOP_LE', kt.loi.map(function (l) { return l.thongBao; }).join('; '), kt.loi);
      _ghiDong(_sheet(tenBang), cu.__dong, tenBang, moi);
      _xoaCache(tenBang);
      ghiNhatKy({ phien: phien, hanhDong: (tuyChon && tuyChon.hanhDong) || 'SUA', bang: tenBang, ma: ma, truoc: cu, sau: moi, canCu: canCu || '' });
      return moi;
    });
  }

  // Ghi nhiều bản ghi liền nhau bằng MỘT lần setValues (định dạng ô như _ghiDong).
  function _ghiKhoi(sh, viTri, tenBang, dsBanGhi) {
    if (!dsBanGhi.length) return;
    var cot = SoDo.BANG[tenBang].cot;
    var dinhDang = cot.map(function (c) { return KIEU_CHU[c.kieu] ? '@' : 'General'; });
    var rg = sh.getRange(viTri, 1, dsBanGhi.length, cot.length);
    rg.setNumberFormats(dsBanGhi.map(function () { return dinhDang; }));
    rg.setValues(dsBanGhi.map(function (r) { return Bang.thanhDong(tenBang, r); }));
  }

  // Ghi một lô vào bảng tự nhập mã: lo = {them:[banGhi], sua:[{ma, thayDoi, hanhDong?}]}.
  // Một khóa; kiểm tra MỌI dòng trước khi ghi (một dòng lỗi → không ghi gì); thêm bằng một setValues khối;
  // sửa theo __dong, các dòng liền nhau gộp một setValues; nhật ký một dòng mỗi bản ghi, ghi một khối.
  // Mã không qua MaSo.hopLe: bảng dùng ghiLo (ChiTieu_TrongBo) có khóa dạng <maBo>:<maGoc> do BoChiTieu kiểm tra.
  // tuyChon.thamChieuThem = {bang: [mã]} — mã sẽ có trong cùng lần khóa (ví dụ bộ sắp được thêm).
  function ghiLo(tenBang, lo, phien, canCu, tuyChon) {
    var b = SoDo.BANG[tenBang], kc = SoDo.khoaChinh(tenBang), gio = bayGioIso();
    var nguoi = (phien && phien.email) || 'he-thong';
    var them = (lo && lo.them) || [], sua = (lo && lo.sua) || [];
    if (!b || b.dinhDangMa !== 'TU_NHAP') throw _loi('LOI_HE_THONG', 'ghiLo chỉ dùng cho bảng tự nhập mã: ' + tenBang);
    return khoa(function () {
      _xoaCache(tenBang);
      var hienCo = {}; docBang(tenBang, { baoGomXoaMem: true }).forEach(function (r) { hienCo[String(r[kc])] = r; });
      var tc = thamChieuCua(tenBang);
      if (tc[tenBang]) tc[tenBang] = tc[tenBang].concat(them.map(function (r) { return String(r[kc] || ''); }));
      var them2 = (tuyChon && tuyChon.thamChieuThem) || {};
      Object.keys(them2).forEach(function (bg) { if (tc[bg]) tc[bg] = tc[bg].concat(them2[bg]); });
      var loi = [], dongThem = [], capNhat = [], nk = [], trongLo = {};
      function _baoLoi(viTri, ma, ds) { ds.forEach(function (l) { loi.push({ dong: viTri, ma: ma, khoa: l.khoa, thongBao: (ma ? ma + ': ' : '') + l.thongBao }); }); }
      them.forEach(function (r0, i) {
        var r = _dienMacDinh(tenBang, Object.assign({}, r0)), ma = String(r[kc] || '');
        delete r.__dong;
        if (!ma) return _baoLoi(i + 1, '', [{ khoa: kc, thongBao: 'Thiếu mã' }]);
        if (hienCo[ma] || trongLo[ma]) return _baoLoi(i + 1, ma, [{ khoa: kc, thongBao: 'Mã đã tồn tại' }]);
        trongLo[ma] = true;
        r.taoLuc = gio; r.taoBoi = nguoi; r.capNhatLuc = gio; r.capNhatBoi = nguoi; r.tinhTrang = 'Hoạt động';
        _baoLoi(i + 1, ma, Bang.kiemTra(tenBang, r, { thamChieu: tc }).loi);
        dongThem.push(r);
        nk.push({ phien: phien, hanhDong: 'THEM', bang: tenBang, ma: ma, sau: r, canCu: canCu || '' });
      });
      sua.forEach(function (s, i) {
        var cu = hienCo[String(s.ma)];
        if (!cu) return _baoLoi(them.length + i + 1, String(s.ma), [{ khoa: kc, thongBao: 'Không tìm thấy bản ghi' }]);
        var moi = Object.assign({}, cu, s.thayDoi);
        moi[kc] = cu[kc]; moi.taoLuc = cu.taoLuc; moi.taoBoi = cu.taoBoi; moi.capNhatLuc = gio; moi.capNhatBoi = nguoi;
        delete moi.__dong;
        _baoLoi(them.length + i + 1, String(s.ma), Bang.kiemTra(tenBang, moi, { thamChieu: tc }).loi);
        capNhat.push({ dong: cu.__dong, banGhi: moi });
        nk.push({ phien: phien, hanhDong: s.hanhDong || 'SUA', bang: tenBang, ma: String(s.ma), truoc: cu, sau: moi, canCu: canCu || '' });
      });
      if (loi.length) throw _loi('DU_LIEU_KHONG_HOP_LE', loi.length + ' lỗi: ' + loi.slice(0, 5).map(function (l) { return l.thongBao; }).join('; '), loi);
      var sh = _sheet(tenBang);
      _ghiKhoi(sh, sh.getLastRow() + 1, tenBang, dongThem);
      capNhat.sort(function (x, y) { return x.dong - y.dong; });
      for (var i = 0; i < capNhat.length;) {
        var j = i; while (j + 1 < capNhat.length && capNhat[j + 1].dong === capNhat[j].dong + 1) j++;
        _ghiKhoi(sh, capNhat[i].dong, tenBang, capNhat.slice(i, j + 1).map(function (c) { return c.banGhi; }));
        i = j + 1;
      }
      _xoaCache(tenBang);
      if (nk.length) {
        var kcNk = SoDo.khoaChinh('NhatKy'), daCap = {};
        var dongNk = nk.map(function (o) {
          var d = NhatKy.dong(Object.assign({ bayGioIso: gio }, o)), ma;
          do { ma = maThoiGian('NhatKy'); } while (daCap[ma]);
          daCap[ma] = true;
          d[kcNk] = ma; d.tinhTrang = 'Hoạt động'; d.taoLuc = gio;
          return d;
        });
        var shNk = _sheet('NhatKy');
        _ghiKhoi(shNk, shNk.getLastRow() + 1, 'NhatKy', dongNk);
        _xoaCache('NhatKy');
      }
      return { soThem: dongThem.length, soSua: capNhat.length };
    });
  }

  // Cấu hình chung dạng {khoa: giaTri}.
  function docCauHinh() {
    var o = {}; docBang('CauHinh').forEach(function (r) { o[r.khoa] = r.giaTri; }); return o;
  }

  return { idFile: idFile, bayGioIso: bayGioIso, khoa: khoa, docBang: docBang, timDong: timDong, thamChieuCua: thamChieuCua, capMa: capMa, maThoiGian: maThoiGian,
    themDongThang: themDongThang, ghiNhatKy: ghiNhatKy, themDong: themDong, capNhatDong: capNhatDong, ghiLo: ghiLo, docCauHinh: docCauHinh, kiemTieuDe: kiemTieuDe, _sheet: _sheet, _ss: _ss, _xoaCache: _xoaCache, _loi: _loi };
})();
