/**
 * ToanVen — kiểm tra toàn vẹn dữ liệu thuần trên {tenBang: banGhi[]}.
 * Quan hệ: KHOA_TRUNG, THAM_CHIEU, TUY_CHON, BAT_BUOC. Kết quả rỗng = đạt.
 */
var ToanVen = (function () {
  function _lech(quanHe, bang, ma, hienTai, dung, ghiChu) {
    return { quanHe: quanHe, bang: bang, ma: ma, giaTriHienTai: String(hienTai), giaTriDung: String(dung), ketQua: 'LECH', ghiChu: ghiChu || '' };
  }

  function kiemTra(duLieu) {
    var kq = [];
    // Tập mã còn hiệu lực (không Xóa mềm) của từng bảng, dùng cho tham chiếu.
    var maHieuLuc = {};
    Object.keys(duLieu).forEach(function (bang) {
      var kc = SoDo.khoaChinh(bang); if (!kc) return;
      maHieuLuc[bang] = {};
      duLieu[bang].forEach(function (r) { if (r.tinhTrang !== 'Xóa mềm') maHieuLuc[bang][r[kc]] = true; });
    });
    Object.keys(duLieu).forEach(function (bang) {
      var b = SoDo.BANG[bang]; if (!b) return;
      var kc = SoDo.khoaChinh(bang), daThay = {};
      duLieu[bang].forEach(function (r) {
        var ma = r[kc];
        // (1) khóa trùng
        if (daThay[ma]) kq.push(_lech('KHOA_TRUNG', bang, ma, 'xuất hiện ' + (daThay[ma] + 1) + ' lần', 'duy nhất', 'Khóa chính lặp'));
        daThay[ma] = (daThay[ma] || 0) + 1;
        if (r.tinhTrang === 'Xóa mềm') return;
        b.cot.forEach(function (c) {
          var v = r[c.khoa];
          var rong = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
          // (4) bắt buộc rỗng ở bản ghi đang hoạt động
          if (c.batBuoc && rong && !c.khoaChinh) { kq.push(_lech('BAT_BUOC', bang, ma, '(rỗng)', 'có giá trị', 'Thiếu cột bắt buộc ' + c.khoa)); return; }
          if (rong) return;
          // (3) tùy chọn sai
          if (c.kieu === 'select' && c.tuyChon && c.tuyChon.indexOf(v) < 0) kq.push(_lech('TUY_CHON', bang, ma, v, c.tuyChon.join(' | '), 'Cột ' + c.khoa));
          if (c.kieu === 'multiselect' && c.tuyChon && !c.thamChieu) {
            var sai = (Array.isArray(v) ? v : []).filter(function (x) { return c.tuyChon.indexOf(x) < 0; });
            if (sai.length) kq.push(_lech('TUY_CHON', bang, ma, sai.join(', '), c.tuyChon.join(' | '), 'Cột ' + c.khoa));
          }
          // (2) tham chiếu gãy (chỉ khi bảng đích có trong dữ liệu)
          if (c.thamChieu && maHieuLuc[c.thamChieu]) {
            var ds = c.kieu === 'multiselect' ? (Array.isArray(v) ? v : []) : [v];
            ds.forEach(function (x) { if (!maHieuLuc[c.thamChieu][x]) kq.push(_lech('THAM_CHIEU', bang, ma, c.khoa + ' = ' + x, 'mã có trong ' + c.thamChieu, 'Mã không tồn tại hoặc đã xóa mềm')); });
          }
        });
      });
    });
    return kq;
  }

  return { kiemTra: kiemTra };
})();
