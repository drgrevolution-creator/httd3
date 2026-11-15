/**
 * SaoLuu — quy tắc đặt tên file sao lưu và chọn bản cũ cần xóa. Lớp thuần.
 * Giữ mọi bản trong giuNgay ngày gần nhất; ngoài ra giữ bản ngày 01 mỗi tháng trong giuThang tháng.
 */
var SaoLuu = (function () {
  var RE_TEN = /^SaoLuu_(.+)_(\d{4}-\d{2}-\d{2})$/;
  var MS_NGAY = 24 * 60 * 60 * 1000;

  function tenFile(tenGoc, ngayIso) { return 'SaoLuu_' + tenGoc + '_' + String(ngayIso).slice(0, 10); }

  // files = [{ten, ...}]; trả các file nên xóa theo quy tắc giữ.
  function canXoa(files, homNayIso, tuyChon) {
    var giuNgay = (tuyChon && tuyChon.giuNgay) || 30, giuThang = (tuyChon && tuyChon.giuThang) || 24;
    var homNay = Date.parse(String(homNayIso).slice(0, 10) + 'T00:00:00Z');
    var moc = new Date(homNay); moc.setUTCMonth(moc.getUTCMonth() - giuThang);
    return files.filter(function (f) {
      var m = RE_TEN.exec(f.ten || ''); if (!m) return false;
      var ngay = Date.parse(m[2] + 'T00:00:00Z');
      if ((homNay - ngay) / MS_NGAY <= giuNgay) return false;
      if (m[2].slice(8, 10) === '01' && ngay >= moc.getTime()) return false;
      return true;
    });
  }

  return { tenFile: tenFile, canXoa: canXoa };
})();
