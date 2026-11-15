// api.js — gọi API Apps Script một cửa. Mọi lời gọi: POST text/plain JSON {phien, action, duLieu}.
window.HTTD3 = window.HTTD3 || {};
HTTD3.api = (function () {
  var KHOA_PHIEN = 'httd3.phien', KHOA_NGUOI_DUNG = 'httd3.nguoiDung';

  function layPhien() { try { return localStorage.getItem(KHOA_PHIEN) || ''; } catch (e) { return ''; } }
  function luuPhien(ma) { try { if (ma) localStorage.setItem(KHOA_PHIEN, ma); else localStorage.removeItem(KHOA_PHIEN); } catch (e) { /* bộ nhớ trình duyệt bị chặn */ } }
  function layNguoiDung() { try { return JSON.parse(localStorage.getItem(KHOA_NGUOI_DUNG) || 'null'); } catch (e) { return null; } }
  function luuNguoiDung(nd) { try { if (nd) localStorage.setItem(KHOA_NGUOI_DUNG, JSON.stringify(nd)); else localStorage.removeItem(KHOA_NGUOI_DUNG); } catch (e) { /* bỏ qua */ } }

  // Gọi một action. Khi phiên hết hạn, phát sự kiện httd3:het-han và chờ đăng nhập lại rồi tự gửi lại.
  async function goiApi(action, duLieu, tuyChon) {
    var cfg = window.HTTD3_CONFIG || {};
    var kq;
    try {
      var resp = await fetch(cfg.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ phien: layPhien(), action: action, duLieu: duLieu || {} }), redirect: 'follow' });
      kq = await resp.json();
    } catch (e) {
      var errMang = new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); errMang.ma = 'MANG'; throw errMang;
    }
    if (kq && kq.ok) return kq.duLieu;
    var loi = (kq && kq.loi) || { ma: 'LOI_HE_THONG', thongBao: 'Phản hồi không hợp lệ từ máy chủ' };
    if (loi.ma === 'PHIEN_HET_HAN' && !(tuyChon && tuyChon.khongThuLai)) {
      return new Promise(function (resolve, reject) {
        window.dispatchEvent(new CustomEvent('httd3:het-han', { detail: {
          thuLai: function () { return goiApi(action, duLieu, { khongThuLai: true }).then(resolve, reject); },
          huy: function () { var e = new Error(loi.thongBao); e.ma = loi.ma; reject(e); }
        } }));
      });
    }
    var err = new Error(loi.thongBao || loi.ma); err.ma = loi.ma; err.chiTiet = loi.chiTiet; throw err;
  }

  return { goiApi: goiApi, layPhien: layPhien, luuPhien: luuPhien, layNguoiDung: layNguoiDung, luuNguoiDung: luuNguoiDung };
})();
