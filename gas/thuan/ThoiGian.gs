/**
 * ThoiGian — tiện ích thời gian thuần cho múi giờ Việt Nam (+07:00).
 * Mọi thời điểm trong hệ thống là chuỗi ISO 8601 có hậu tố +07:00.
 */
var ThoiGian = (function () {
  var LECH_MS = 7 * 60 * 60 * 1000;
  function _dem(n) { return (n < 10 ? '0' : '') + n; }

  // Chuỗi ISO (+07:00 hoặc Z) → mili giây kể từ epoch.
  function sangMs(iso) { var t = Date.parse(iso); if (isNaN(t)) throw new Error('THOI_GIAN_SAI: ' + iso); return t; }

  // Mili giây → chuỗi ISO giờ Việt Nam 'YYYY-MM-DDTHH:mm:ss+07:00'.
  function tuMs(ms) {
    var d = new Date(ms + LECH_MS);
    return d.getUTCFullYear() + '-' + _dem(d.getUTCMonth() + 1) + '-' + _dem(d.getUTCDate()) + 'T' +
      _dem(d.getUTCHours()) + ':' + _dem(d.getUTCMinutes()) + ':' + _dem(d.getUTCSeconds()) + '+07:00';
  }

  // Cộng thêm mili giây vào một chuỗi ISO.
  function cong(iso, ms) { return tuMs(sangMs(iso) + ms); }

  // Phần ngày 'YYYY-MM-DD' theo giờ Việt Nam.
  function ngay(iso) { return tuMs(sangMs(iso)).slice(0, 10); }

  // So sánh: a trước b?
  function truoc(aIso, bIso) { return sangMs(aIso) < sangMs(bIso); }

  return { sangMs: sangMs, tuMs: tuMs, cong: cong, ngay: ngay, truoc: truoc };
})();
