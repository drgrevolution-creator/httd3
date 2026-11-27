/**
 * ChiTieuGas — handler bộ chỉ tiêu (giai đoạn 1b): đọc bộ, xem chi tiết một chỉ tiêu, nhập file mẫu chuẩn, ghép nội hàm.
 */
var ChiTieuGas = (function () {
  // Tham chiếu LƯỜI tới KhoDuLieu (Apps Script nạp file theo thứ tự tên).
  function _loi(ma, thongBao, chiTiet) { return KhoDuLieu._loi(ma, thongBao, chiTiet); }
  var BANG = 'ChiTieu_TrongBo';
  var NAM_TRUONG = ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieu', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap'];
  var NAM_TRUONG_CHUAN = ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieuNoiDung', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap'];
  var GIOI_HAN_THAN = 900000;

  function _sach(r) { if (!r) return r; var o = Object.assign({}, r); delete o.__dong; return o; }
  function _rong(v) { return v === undefined || v === null || String(v).trim() === ''; }
  function _conHieuLuc(r) { return r.tinhTrangHieuLuc !== 'Hết hiệu lực'; }

  // chiTieu.doc: không có maBo → danh sách bộ kèm số chỉ tiêu còn hiệu lực và số chỉ tiêu có cấp xã;
  // có maBo → bộ đó và các dòng của bộ (không kèm năm trường nội dung, có cờ coNoiDung).
  function doc(d) {
    var maBo = d && d.maBo, ds = KhoDuLieu.docBang(BANG);
    if (!maBo) {
      var dem = {};
      ds.forEach(function (r) {
        if (!_conHieuLuc(r)) return;
        var e = dem[r.maBo] || (dem[r.maBo] = { so: 0, xa: 0 });
        e.so++; if (/Xã/.test(String(r.capDuLieu || ''))) e.xa++;
      });
      // Chỉ tiêu chuẩn (một nội hàm một mã) kèm các bộ và dòng đang ghép (dòng còn hiệu lực).
      var ghep = {};
      ds.forEach(function (r) {
        if (!_conHieuLuc(r) || _rong(r.maChiTieu)) return;
        (ghep[r.maChiTieu] || (ghep[r.maChiTieu] = [])).push({ maTrongBo: r.maTrongBo, maBo: r.maBo, tenNguyenVan: r.tenNguyenVan });
      });
      return {
        bo: KhoDuLieu.docBang('DM_BoChiTieu').map(function (b) {
          var e = dem[b.maBo] || { so: 0, xa: 0 }, o = _sach(b);
          o.soChiTieu = e.so; o.soCapXa = e.xa;
          return o;
        }),
        chuan: KhoDuLieu.docBang('DM_ChiTieu').map(function (c) {
          var o = _sach(c), dg = ghep[c.maChiTieu] || [], cacBo = [];
          NAM_TRUONG_CHUAN.forEach(function (k) { delete o[k]; });
          dg.forEach(function (x) { if (cacBo.indexOf(x.maBo) < 0) cacBo.push(x.maBo); });
          o.cacBo = cacBo.sort(); o.soBo = cacBo.length; o.cacDong = dg;
          return o;
        })
      };
    }
    var bo = KhoDuLieu.timDong('DM_BoChiTieu', maBo);
    if (!bo || bo.tinhTrang === 'Xóa mềm') throw _loi('KHONG_TIM_THAY', 'Không có bộ chỉ tiêu ' + maBo);
    return { bo: _sach(bo), dong: ds.filter(function (r) { return r.maBo === maBo; }).map(function (r) {
      var o = _sach(r);
      o.coNoiDung = NAM_TRUONG.some(function (k) { return !_rong(r[k]); });
      NAM_TRUONG.forEach(function (k) { delete o[k]; });
      return o;
    }) };
  }

  // chiTieu.chiTiet: dòng đủ năm trường, chỉ tiêu chuẩn đã ghép (nếu có), các dòng ở bộ khác cùng nội hàm.
  function chiTiet(d) {
    var r = KhoDuLieu.timDong(BANG, d && d.maTrongBo);
    if (!r || r.tinhTrang === 'Xóa mềm') throw _loi('KHONG_TIM_THAY', 'Không có chỉ tiêu ' + (d && d.maTrongBo));
    var chuan = r.maChiTieu ? KhoDuLieu.timDong('DM_ChiTieu', r.maChiTieu) : null;
    var cung = !r.maChiTieu ? [] : KhoDuLieu.docBang(BANG).filter(function (x) { return x.maChiTieu === r.maChiTieu && x.maTrongBo !== r.maTrongBo; })
      .map(function (x) { return { maTrongBo: x.maTrongBo, maBo: x.maBo, tenNguyenVan: x.tenNguyenVan }; });
    return { dong: _sach(r), chuan: chuan ? _sach(chuan) : null, cungNoiHam: cung,
      dsLoaiGiaTri: KhoDuLieu.docBang('DM_LoaiGiaTri').map(_sach) };
  }

  // Chỉ giữ cột người dùng nhập của bảng; cột số đổi sang số.
  // giuChuSo = true: cột số dạng chữ giữ nguyên để BoChiTieu.chuanHoaDong đọc theo quy tắc số Việt Nam
  // (Number("10.000") = 10 là sai — soát 27/11/2026).
  function _locCot(tenBang, o, giuChuSo) {
    var r = {};
    SoDo.BANG[tenBang].cot.forEach(function (c) {
      if (c.heThong || o[c.khoa] === undefined || o[c.khoa] === null) return;
      if (c.kieu === 'number' && giuChuSo && typeof o[c.khoa] === 'string') r[c.khoa] = o[c.khoa];
      else if (c.kieu === 'number') { if (!_rong(o[c.khoa])) r[c.khoa] = Number(o[c.khoa]); }
      else r[c.khoa] = o[c.khoa];
    });
    return r;
  }

  // Kiểm tra thông tin bộ (sheet Bo) như khi thêm/sửa DM_BoChiTieu, không ghi. Trả {banGhi, boCu, thayDoi, loi}.
  function _kiemTraBo(boFile) {
    var bo = _locCot('DM_BoChiTieu', boFile || {});
    Object.keys(bo).forEach(function (k) { if (typeof bo[k] === 'string') bo[k] = bo[k].trim(); if (bo[k] === '') delete bo[k]; });
    var boCu = bo.maBo ? KhoDuLieu.timDong('DM_BoChiTieu', bo.maBo) : null, loi = [];
    if (!bo.maBo) loi.push({ dong: 0, khoa: 'maBo', thongBao: 'Thiếu mã bộ (sheet Bo, cột maBo)' });
    else if (!boCu && !MaSo.hopLe('DM_BoChiTieu', bo.maBo)) loi.push({ dong: 0, khoa: 'maBo', thongBao: 'Mã bộ "' + bo.maBo + '" không hợp lệ' });
    var hop = Object.assign({}, _sach(boCu) || {}, bo);
    if (!boCu) SoDo.BANG.DM_BoChiTieu.cot.forEach(function (c) { if (_rong(hop[c.khoa]) && c.macDinh !== undefined) hop[c.khoa] = c.macDinh; });
    Bang.kiemTra('DM_BoChiTieu', hop, { thamChieu: KhoDuLieu.thamChieuCua('DM_BoChiTieu') }).loi.forEach(function (l) {
      loi.push({ dong: 0, khoa: l.khoa, thongBao: 'Sheet Bo: ' + l.thongBao });
    });
    var thayDoi = {};
    if (boCu) Object.keys(bo).forEach(function (k) { if (k !== 'maBo' && String(bo[k]) !== String(_rong(boCu[k]) ? '' : boCu[k])) thayDoi[k] = bo[k]; });
    return { banGhi: bo, boCu: boCu, thayDoi: thayDoi, loi: loi };
  }

  // chiTieu.nhap({bo, dong, cheDo:'xemTruoc'|'ghi', canCu}).
  function nhap(d, phien) {
    d = d || {};
    if (JSON.stringify(d).length > GIOI_HAN_THAN) throw _loi('DU_LIEU_KHONG_HOP_LE', 'File quá lớn để gửi một lần (tối đa khoảng 900 000 ký tự). Không tách file của cùng một bộ — dòng thiếu trong file sẽ bị chuyển Hết hiệu lực; hãy nhập bản không kèm năm mục nội dung hoặc báo quản trị.');
    if (!Array.isArray(d.dong) || !d.dong.length) throw _loi('DU_LIEU_KHONG_HOP_LE', 'File không có dòng chỉ tiêu nào (sheet ChiTieu, từ dòng 3)');
    return KhoDuLieu.khoa(function () {
      var kb = _kiemTraBo(d.bo), maBo = kb.banGhi.maBo || '';
      var dong = d.dong.map(function (r0) {
        var r = BoChiTieu.chuanHoaDong(_locCot(BANG, r0 || {}, true));
        if (_rong(r.maBo)) r.maBo = maBo;
        return r;
      });
      var daCo = KhoDuLieu.docBang(BANG).filter(function (r) { return r.maBo === maBo; });
      var dsLoai = KhoDuLieu.docBang('DM_LoaiGiaTri').filter(function (l) { return l.tinhTrang !== 'Ngừng'; })
        .map(function (l) { return { maLoaiGiaTri: l.maLoaiGiaTri, coTuSoMauSo: l.coTuSoMauSo }; });
      var kt = BoChiTieu.kiemTraLo(maBo, dong, { daCo: daCo.map(function (r) { return r.maTrongBo; }), loaiGiaTri: dsLoai });
      dong.forEach(function (r, i) { if (r.maBo !== maBo) kt.loi.push({ dong: i + 1, khoa: 'maBo', thongBao: 'Dòng ghi bộ ' + r.maBo + ', không phải ' + maBo }); });
      kt.loi = kb.loi.concat(kt.loi); kt.hopLe = kt.loi.length === 0;
      var kh = BoChiTieu.keHoachNhap(daCo, dong);
      var tomTat = { soThem: kh.them.length, soSua: kh.sua.length, soHetHieuLuc: kh.hetHieuLuc.length, giuNguyen: kh.giuNguyen, soBoGhep: kh.boGhep.length };

      if (d.cheDo !== 'ghi') {
        var chuan = KhoDuLieu.docBang('DM_ChiTieu').map(function (c) { return { maChiTieu: c.maChiTieu, tenChiTieu: c.tenChiTieu }; });
        var cu = {}, goiY = {};
        daCo.forEach(function (r) { cu[r.maTrongBo] = r; });
        if (chuan.length) dong.forEach(function (r) {
          if (!_rong(r.maChiTieu) || (cu[r.maTrongBo] && !_rong(cu[r.maTrongBo].maChiTieu))) return;
          var g = BoChiTieu.goiYGhep(r.tenNguyenVan, chuan);
          if (g.length) goiY[r.maTrongBo] = g;
        });
        var chiTietSua = kh.sua.slice(0, 500).map(function (s) { return { ma: s.ma, cot: Object.keys(s.thayDoi) }; });
        var tenCot = {}; SoDo.BANG[BANG].cot.forEach(function (c) { tenCot[c.khoa] = c.ten; });
        return { kiemTra: kt, keHoach: tomTat, goiYGhep: goiY, chiTietSua: chiTietSua, boGhep: kh.boGhep, tenCot: tenCot };
      }

      if (!kt.hopLe) throw _loi('DU_LIEU_KHONG_HOP_LE', kt.loi.length + ' lỗi, chưa ghi dòng nào: ' + kt.loi.slice(0, 5).map(function (l) { return (l.dong ? 'dòng ' + l.dong + ': ' : '') + l.thongBao; }).join('; '), kt.loi);
      var canCu = String(d.canCu || '').trim() || ('Nhập file mẫu chuẩn bộ ' + maBo);
      var het = kh.hetHieuLuc.map(function (ma) { return { ma: ma, thayDoi: { tinhTrangHieuLuc: 'Hết hiệu lực' } }; });
      // Ghi dòng trước (ghiLo kiểm tra hết rồi mới ghi), sau đó mới thêm/sửa bộ — bộ đã được kiểm tra ở _kiemTraBo.
      var kq = KhoDuLieu.ghiLo(BANG, { them: kh.them, sua: kh.sua.concat(het) }, phien, canCu, { thamChieuThem: { DM_BoChiTieu: [maBo] } });
      var soConHieuLuc = dong.length;
      if (!kb.boCu) KhoDuLieu.themDong('DM_BoChiTieu', Object.assign({}, kb.banGhi, { soChiTieu: soConHieuLuc }), phien, canCu);
      else {
        var td = Object.assign({}, kb.thayDoi);
        if (Number(kb.boCu.soChiTieu) !== soConHieuLuc) td.soChiTieu = soConHieuLuc; else delete td.soChiTieu;
        if (Object.keys(td).length) KhoDuLieu.capNhatDong('DM_BoChiTieu', maBo, td, phien, canCu);
      }
      return { maBo: maBo, soThem: kq.soThem, soSua: kh.sua.length, soHetHieuLuc: het.length, giuNguyen: kh.giuNguyen, soBoGhep: kh.boGhep.length };
    });
  }

  // chiTieu.ghep({maTrongBo, maChiTieu | taoMoi:{maChiTieu, tenChiTieu}, canCu}) — chỉ theo danh sách đã duyệt.
  function ghep(d, phien) {
    d = d || {};
    return KhoDuLieu.khoa(function () {
      var r = KhoDuLieu.timDong(BANG, d.maTrongBo);
      if (!r || r.tinhTrang === 'Xóa mềm') throw _loi('KHONG_TIM_THAY', 'Không có chỉ tiêu ' + d.maTrongBo);
      var canCu = String(d.canCu || '').trim() || 'Ghép nội hàm theo danh sách đã duyệt', maChiTieu;
      if (d.taoMoi) {
        var moi = {
          maChiTieu: String(d.taoMoi.maChiTieu || '').trim(), tenChiTieu: String(d.taoMoi.tenChiTieu || r.tenNguyenVan || '').trim(),
          linhVucLon: r.linhVucLon, thuocTinhTongHop: r.thuocTinhTongHop, capDuLieu: r.capDuLieu, kyBaoCaoXa: r.kyBaoCaoXa,
          khaiNiemPhuongPhapTinh: r.khaiNiemPhuongPhapTinh, phanToChuYeu: r.phanToChuYeu, kyCongBo: r.kyCongBo,
          nguonSoLieuNoiDung: r.nguonSoLieu, coQuanChuTriThuThap: r.coQuanChuTriThuThap, coQuanPhoiHopThuThap: r.coQuanPhoiHopThuThap,
          loaiGiaTri: r.loaiGiaTri, dinhNghiaTuSo: r.dinhNghiaTuSo, dinhNghiaMauSo: r.dinhNghiaMauSo, heSoNhan: r.heSoNhan,
          mucLienQuanCapXa: BoChiTieu.mucLienQuanTuCap(r.capDuLieu)
        };
        var cha = r.chaTrongBo ? KhoDuLieu.timDong(BANG, r.chaTrongBo) : null;
        if (cha && !_rong(cha.maChiTieu)) moi.chaChiTieu = cha.maChiTieu;
        Object.keys(moi).forEach(function (k) { if (_rong(moi[k])) delete moi[k]; });
        maChiTieu = KhoDuLieu.themDong('DM_ChiTieu', moi, phien, canCu).maChiTieu;
      } else {
        maChiTieu = String(d.maChiTieu || '').trim();
        var c = maChiTieu ? KhoDuLieu.timDong('DM_ChiTieu', maChiTieu) : null;
        if (!c || c.tinhTrang === 'Xóa mềm') throw _loi('KHONG_TIM_THAY', 'Không có chỉ tiêu chuẩn ' + (maChiTieu || '(trống)'));
      }
      var dongMoi = String(r.maChiTieu || '') === maChiTieu ? r : KhoDuLieu.capNhatDong(BANG, r.maTrongBo, { maChiTieu: maChiTieu }, phien, canCu);
      return { dong: _sach(dongMoi), chuan: _sach(KhoDuLieu.timDong('DM_ChiTieu', maChiTieu)) };
    });
  }

  var HANDLERS = { 'chiTieu.doc': doc, 'chiTieu.chiTiet': chiTiet, 'chiTieu.nhap': nhap, 'chiTieu.ghep': ghep };
  return { HANDLERS: HANDLERS };
})();
