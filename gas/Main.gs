/**
 * Main — điểm vào web app Apps Script: doGet (chỉ sức khỏe) và doPost (API một cửa).
 * Thân POST là JSON {phien, action, duLieu}; trả {ok, duLieu} hoặc {ok:false, loi:{ma, thongBao}}.
 */

// GET chỉ phục vụ ?action=heThong.sucKhoe để kiểm tra nhanh bản triển khai.
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action !== 'heThong.sucKhoe') {
    return _traJson({ ok: false, loi: { ma: 'ACTION_KHONG_TON_TAI', thongBao: 'GET chỉ hỗ trợ action=heThong.sucKhoe; các thao tác khác dùng POST' } });
  }
  return _traJson(_xuLyYeuCau({ action: 'heThong.sucKhoe' }));
}

// POST: parse JSON rồi chuyển cho bộ điều phối thuần.
function doPost(e) {
  var yeuCau;
  try {
    yeuCau = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '');
  } catch (err) {
    return _traJson({ ok: false, loi: { ma: 'DU_LIEU_KHONG_HOP_LE', thongBao: 'Thân yêu cầu phải là JSON' } });
  }
  return _traJson(_xuLyYeuCau(yeuCau));
}

// Lắp các handler của lớp kết nối vào bộ điều phối.
function _xuLyYeuCau(yeuCau) {
  var handlers = {};
  [XacThuc.HANDLERS, DanhMucGas.HANDLERS, (typeof LichDem !== 'undefined' ? LichDem.HANDLERS : {})].forEach(function (h) {
    Object.keys(h).forEach(function (k) { handlers[k] = h[k]; });
  });
  return DieuPhoi.xuLy(yeuCau, { handlers: handlers, layPhien: XacThuc.layPhien, bayGioIso: KhoDuLieu.bayGioIso() });
}

// Trả JSON qua ContentService (trình duyệt gọi được từ nguồn khác).
function _traJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
