/**
 * NhatKy — dựng dòng nhật ký hệ thống (bảng NhatKy) từ một thao tác. Lớp thuần.
 * Không bao giờ ghi giá trị của cột đánh dấu an:true (mật khẩu băm, muối) vào nhật ký.
 */
var NhatKy = (function () {
  // So sánh nông theo JSON của từng khóa; trả hai đối tượng chỉ chứa khóa khác nhau.
  function khacBiet(truoc, sau) {
    var t = truoc || {}, s = sau || {}, kt = {}, ks = {};
    var khoa = {}; Object.keys(t).concat(Object.keys(s)).forEach(function (k) { khoa[k] = true; });
    Object.keys(khoa).forEach(function (k) {
      if (k === '__dong') return;
      var a = t[k], b = s[k];
      if (JSON.stringify(a === undefined ? null : a) !== JSON.stringify(b === undefined ? null : b)) {
        if (a !== undefined) kt[k] = a;
        if (b !== undefined) ks[k] = b;
      }
    });
    return { truoc: kt, sau: ks };
  }

  // Bỏ các khóa nhạy cảm của bảng.
  function _locNhayCam(bang, o) {
    if (!o) return o;
    var b = SoDo.BANG[bang]; if (!b) return o;
    var r = {}; Object.keys(o).forEach(function (k) { var c = SoDo.cot(bang, k); if (!c || !c.an) r[k] = o[k]; });
    return r;
  }

  /**
   * Dựng dòng nhật ký. o = {phien?, hanhDong, bang, ma, truoc?, sau?, canCu?, bayGioIso}.
   * Không có phiên (việc chạy theo lịch) thì email = 'he-thong'.
   */
  function dong(o) {
    var p = o.phien || {};
    var kb = (o.truoc || o.sau) ? khacBiet(_locNhayCam(o.bang, o.truoc), _locNhayCam(o.bang, o.sau)) : { truoc: {}, sau: {} };
    return {
      thoiGian: o.bayGioIso,
      maNguoiDung: p.maNguoiDung || '',
      email: p.email || 'he-thong',
      vaiTro: JSON.stringify(p.vaiTro || []),
      hanhDong: o.hanhDong,
      bang: o.bang || '',
      ma: o.ma || '',
      truocKhiSua: o.truoc ? JSON.stringify(kb.truoc) : '',
      sauKhiSua: o.sau ? JSON.stringify(kb.sau) : '',
      canCu: o.canCu || ''
    };
  }

  return { dong: dong, khacBiet: khacBiet };
})();
