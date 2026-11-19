// Máy chủ API giả cho kiểm thử giao diện: phục vụ tĩnh thư mục web/ và POST /api với kho trong bộ nhớ.
// Dùng lại lớp thuần thật (SoDo, Bang, DuLieuGieo, PhanQuyen, DieuPhoi, Phien) để hành vi sát bản triển khai.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { taiThuan } = require('../../gas/test/_moiTruong.js');
const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

export function khoiDong({ cong = 0 } = {}) {
  const T = taiThuan();
  const { SoDo, Bang, DuLieuGieo, DieuPhoi, Phien, ThoiGian } = T;
  const gio = () => ThoiGian.tuMs(Date.now());
  const kho = {};
  for (const t of SoDo.danhSachBang()) kho[t] = [];
  for (const [t, ds] of Object.entries(DuLieuGieo.BANG)) kho[t] = ds.map((r) => ({ ...r, tinhTrang: 'Hoạt động', taoLuc: gio(), taoBoi: 'gieo', capNhatLuc: gio(), capNhatBoi: 'gieo' }));
  kho.DM_NguoiDung.push({ maNguoiDung: 'ND-0001', tenDangNhap: 'quantri', hoTen: 'Quản trị thử', email: 'quantri@gmail.com', vaiTro: ['QUANTRI', 'CHUYENVIEN'], danhSachDonVi: ['DV03'], linhVucPhuTrach: ['CCHC'], matKhau: 'Abc12345', batBuocDoiMatKhau: false, soLanSai: 0, khoaDen: '', trangThai: 'Hoạt động', tinhTrang: 'Hoạt động' });
  const phien = {};
  const dem = { ND: 1, NK: 0, MT: 0, VB: 0 };
  const loi = (ma, thongBao) => { const e = new Error(thongBao); e.ma = ma; e.thongBao = thongBao; throw e; };
  const anND = (u) => { const { matKhau, ...r } = u; return Bang.anCotNhayCam('DM_NguoiDung', r); };
  const ghiNK = (p, hanhDong, bang, ma, truoc, sau, canCu) => kho.NhatKy.push({ maNhatKy: 'NK-' + (++dem.NK), ...T.NhatKy.dong({ phien: p, hanhDong, bang, ma, truoc, sau, canCu, bayGioIso: gio() }), tinhTrang: 'Hoạt động' });
  const timND = (f) => kho.DM_NguoiDung.find(f);
  const hoanTat = (u, thietBi) => {
    if (u.trangThai !== 'Hoạt động') loi('KHONG_CO_QUYEN', 'Tài khoản đang bị khóa');
    const p = Phien.tao({ nguoiDung: u, bayGioIso: gio(), thietBi, ngauNhienHex32: Math.random().toString(16).slice(2).padEnd(32, '0').slice(0, 32) });
    phien[p.maPhien] = p; u.soLanSai = 0; u.khoaDen = '';
    ghiNK(p, 'DANG_NHAP', 'DM_NguoiDung', u.maNguoiDung);
    return { maPhien: p.maPhien, hetHanLuc: p.hetHanLuc, nguoiDung: anND(u), batBuocDoiMatKhau: !!u.batBuocDoiMatKhau };
  };
  const thamChieuCua = (bang) => { const tc = {}; for (const c of SoDo.BANG[bang].cot) if (c.thamChieu) tc[c.thamChieu] = kho[c.thamChieu].filter((r) => r.tinhTrang !== 'Xóa mềm').map((r) => r[SoDo.khoaChinh(c.thamChieu)]); return tc; };
  const them = (bang, r, p, canCu) => {
    const b = SoDo.BANG[bang], kc = SoDo.khoaChinh(bang);
    for (const c of b.cot) if ((r[c.khoa] === undefined || r[c.khoa] === '') && c.macDinh !== undefined) r[c.khoa] = c.macDinh;
    if (b.dinhDangMa !== 'TU_NHAP') { dem[b.tienToMa] = (dem[b.tienToMa] || 0) + 1; r[kc] = T.MaSo.sinh(bang, { soHienTai: dem[b.tienToMa] - 1, nam: 2026, namHienTai: 2026 }).ma; }
    else if (kho[bang].some((x) => x[kc] === r[kc])) loi('DU_LIEU_KHONG_HOP_LE', 'Mã ' + r[kc] + ' đã tồn tại');
    Object.assign(r, { taoLuc: gio(), taoBoi: p?.email || 'he-thong', capNhatLuc: gio(), capNhatBoi: p?.email || 'he-thong', tinhTrang: 'Hoạt động' });
    const kt = Bang.kiemTra(bang, r, { thamChieu: thamChieuCua(bang) });
    if (!kt.hopLe) loi('DU_LIEU_KHONG_HOP_LE', kt.loi.map((l) => l.thongBao).join('; '));
    kho[bang].push(r); ghiNK(p, 'THEM', bang, r[kc], null, r, canCu); return r;
  };
  const sua = (bang, ma, thayDoi, p, canCu, hanhDong = 'SUA') => {
    const kc = SoDo.khoaChinh(bang), cu = kho[bang].find((x) => String(x[kc]) === String(ma));
    if (!cu) loi('KHONG_TIM_THAY', 'Không tìm thấy ' + ma);
    const moi = { ...cu, ...thayDoi, [kc]: cu[kc], capNhatLuc: gio(), capNhatBoi: p?.email || 'he-thong' };
    const kt = Bang.kiemTra(bang, moi, { thamChieu: thamChieuCua(bang) });
    if (!kt.hopLe) loi('DU_LIEU_KHONG_HOP_LE', kt.loi.map((l) => l.thongBao).join('; '));
    kho[bang][kho[bang].indexOf(cu)] = moi; ghiNK(p, hanhDong, bang, ma, cu, moi, canCu); return moi;
  };
  const handlers = {
    'heThong.sucKhoe': () => ({ phienBan: '3.0.0-test', gio: gio(), daThietLap: true, saoLuuCuoi: { thoiGian: gio(), ketQua: 'OK' }, toanVenCuoi: { thoiGian: gio(), ketQua: 'DAT', giaTriHienTai: '0' }, thieu: [] }),
    'xacThuc.dangNhapMatKhau': (d) => {
      const u = timND((x) => x.tenDangNhap.toLowerCase() === String(d.tenDangNhap || '').toLowerCase());
      if (!u) loi('KHONG_CO_QUYEN', 'Tên đăng nhập hoặc mật khẩu không đúng');
      if (u.khoaDen && ThoiGian.truoc(gio(), u.khoaDen)) loi('KHONG_CO_QUYEN', 'Tài khoản bị khóa đến ' + u.khoaDen.slice(11, 16) + ' do nhập sai nhiều lần');
      if (u.matKhau !== d.matKhau) { u.soLanSai = (u.soLanSai || 0) + 1; const k = T.MatKhau.tinhKhoa(u.soLanSai, gio()); u.khoaDen = k.khoaDen || ''; loi('KHONG_CO_QUYEN', k.khoaDen ? 'Sai ' + u.soLanSai + ' lần, tài khoản bị khóa 15 phút' : 'Tên đăng nhập hoặc mật khẩu không đúng'); }
      return hoanTat(u, d.thietBi);
    },
    'xacThuc.dangNhapGoogle': (d) => {
      if (d.idToken === 'TOKEN_OK') return hoanTat(timND((x) => x.tenDangNhap === 'quantri'), d.thietBi);
      if (d.idToken === 'TOKEN_LA') loi('KHONG_CO_QUYEN', 'Email la@gmail.com chưa được cấp tài khoản. Liên hệ quản trị để được thêm.');
      loi('KHONG_CO_QUYEN', 'Thẻ Google không hợp lệ hoặc đã hết hạn, hãy đăng nhập lại');
    },
    'xacThuc.dangXuat': (d, p) => { delete phien[p.maPhien]; return { daDangXuat: true }; },
    'xacThuc.doiMatKhau': (d, p) => {
      const u = timND((x) => x.maNguoiDung === p.maNguoiDung);
      if (u.matKhau && u.matKhau !== d.matKhauCu) loi('KHONG_CO_QUYEN', 'Mật khẩu cũ không đúng');
      const yc = T.MatKhau.datYeuCau(d.matKhauMoi); if (!yc.hopLe) loi('DU_LIEU_KHONG_HOP_LE', yc.loi.join('; '));
      u.matKhau = d.matKhauMoi; u.batBuocDoiMatKhau = false; p.batBuocDoiMatKhau = false; for (const k of Object.keys(phien)) if (phien[k].maNguoiDung === u.maNguoiDung && k !== p.maPhien) delete phien[k]; ghiNK(p, 'DOI_MAT_KHAU', 'DM_NguoiDung', u.maNguoiDung); return { daDoi: true };
    },
    'heThong.khoiDong': (d, p) => ({
      nguoiDung: anND(timND((x) => x.maNguoiDung === p.maNguoiDung)), phien: { maPhien: p.maPhien, hetHanLuc: p.hetHanLuc, vaiTro: p.vaiTro, danhSachDonVi: p.danhSachDonVi, batBuocDoiMatKhau: !!p.batBuocDoiMatKhau },
      soDoDanhMuc: SoDo.danhSachBang('danhmuc').map((t) => ({ bang: t, ten: SoDo.BANG[t].ten, tienToMa: SoDo.BANG[t].tienToMa, dinhDangMa: SoDo.BANG[t].dinhDangMa, khoaChinh: SoDo.khoaChinh(t), cot: SoDo.BANG[t].cot.filter((c) => !c.an) })),
      cauHinh: Object.fromEntries(kho.CauHinh.map((c) => [c.khoa, c.giaTri]))
    }),
    'danhMuc.doc': (d) => { if (!SoDo.BANG[d.bang] || SoDo.BANG[d.bang].nhom !== 'danhmuc' || d.bang === 'DM_NguoiDung') loi('KHONG_TIM_THAY', 'Không có danh mục ' + d.bang); return kho[d.bang].filter((r) => r.tinhTrang !== 'Xóa mềm'); },
    'danhMuc.them': (d, p) => them(d.bang, { ...d.banGhi }, p, d.canCu),
    'danhMuc.sua': (d, p) => { if (!d.canCu?.trim()) loi('DU_LIEU_KHONG_HOP_LE', 'Cần ghi căn cứ khi sửa danh mục'); return sua(d.bang, d.ma, d.thayDoi, p, d.canCu); },
    'danhMuc.ngung': (d, p) => { if (!d.lyDo?.trim()) loi('DU_LIEU_KHONG_HOP_LE', 'Cần ghi lý do ngừng'); return sua(d.bang, d.ma, { tinhTrang: 'Ngừng' }, p, d.lyDo, 'NGUNG'); },
    'nguoiDung.doc': () => kho.DM_NguoiDung.map(anND),
    'nguoiDung.them': (d, p) => { const r = { ...d.banGhi, matKhau: 'Tam' + Math.floor(Math.random() * 90000 + 10000) + 'x', batBuocDoiMatKhau: true, soLanSai: 0, trangThai: 'Hoạt động' }; if (kho.DM_NguoiDung.some((u) => u.tenDangNhap === r.tenDangNhap)) loi('DU_LIEU_KHONG_HOP_LE', 'Tên đăng nhập đã có người dùng'); them('DM_NguoiDung', r, p, d.canCu); return { nguoiDung: anND(r), matKhauTam: r.matKhau }; },
    'nguoiDung.sua': (d, p) => anND(sua('DM_NguoiDung', d.ma, d.thayDoi, p, d.canCu || 'quản trị sửa')),
    'nguoiDung.datLaiMatKhau': (d, p) => { const u = timND((x) => x.maNguoiDung === d.ma); u.matKhau = 'Moi' + Math.floor(Math.random() * 90000 + 10000) + 'y'; u.batBuocDoiMatKhau = true; ghiNK(p, 'DAT_LAI_MAT_KHAU', 'DM_NguoiDung', d.ma); return { matKhauTam: u.matKhau }; },
    'nhatKy.doc': (d) => kho.NhatKy.filter((r) => (!d.bang || r.bang === d.bang) && (!d.ma || String(r.ma) === String(d.ma))).sort((a, b) => b.thoiGian.localeCompare(a.thoiGian)).slice(0, d.gioiHan || 200),
    'lich.chayNgay': (d) => ({ daChay: d.ten, luc: gio() }),
    // Giai đoạn 1b — bộ chỉ tiêu: cùng luồng với gas/ketnoi/ChiTieuGas.gs, dùng BoChiTieu thật.
    'chiTieu.doc': (d) => {
      const ds = kho.ChiTieu_TrongBo.filter((r) => r.tinhTrang !== 'Xóa mềm');
      if (!d.maBo) {
        return { bo: kho.DM_BoChiTieu.filter((b) => b.tinhTrang !== 'Xóa mềm').map((b) => {
          const cua = ds.filter((r) => r.maBo === b.maBo && r.tinhTrangHieuLuc !== 'Hết hiệu lực');
          return { ...b, soChiTieu: cua.length, soCapXa: cua.filter((r) => /Xã/.test(r.capDuLieu || '')).length };
        }) };
      }
      const bo = kho.DM_BoChiTieu.find((b) => b.maBo === d.maBo); if (!bo) loi('KHONG_TIM_THAY', 'Không có bộ chỉ tiêu ' + d.maBo);
      return { bo, dong: ds.filter((r) => r.maBo === d.maBo).map((r) => { const o = { ...r, coNoiDung: NAM_TRUONG.some((k) => String(r[k] || '') !== '') }; for (const k of NAM_TRUONG) delete o[k]; return o; }) };
    },
    'chiTieu.chiTiet': (d) => {
      const r = kho.ChiTieu_TrongBo.find((x) => x.maTrongBo === d.maTrongBo); if (!r) loi('KHONG_TIM_THAY', 'Không có chỉ tiêu ' + d.maTrongBo);
      const chuan = r.maChiTieu ? kho.DM_ChiTieu.find((c) => c.maChiTieu === r.maChiTieu) || null : null;
      const cung = r.maChiTieu ? kho.ChiTieu_TrongBo.filter((x) => x.maChiTieu === r.maChiTieu && x.maTrongBo !== r.maTrongBo).map((x) => ({ maTrongBo: x.maTrongBo, maBo: x.maBo, tenNguyenVan: x.tenNguyenVan })) : [];
      return { dong: r, chuan, cungNoiHam: cung };
    },
    'chiTieu.nhap': (d, p) => {
      if (JSON.stringify(d).length > 900000) loi('DU_LIEU_KHONG_HOP_LE', 'File quá lớn, hãy chia nhóm');
      if (!Array.isArray(d.dong) || !d.dong.length) loi('DU_LIEU_KHONG_HOP_LE', 'File không có dòng chỉ tiêu nào');
      const maBo = String(d.bo?.maBo || '').trim();
      const dong = d.dong.map((r0) => { const r = T.BoChiTieu.chuanHoaDong(r0); if (!r.maBo) r.maBo = maBo; return r; });
      const daCo = kho.ChiTieu_TrongBo.filter((r) => r.maBo === maBo);
      const kt = T.BoChiTieu.kiemTraLo(maBo, dong, { daCo: daCo.map((r) => r.maTrongBo) });
      if (!maBo) kt.loi.unshift({ dong: 0, khoa: 'maBo', thongBao: 'Thiếu mã bộ (sheet Bo, cột maBo)' });
      kt.hopLe = kt.loi.length === 0;
      const kh = T.BoChiTieu.keHoachNhap(daCo, dong);
      const tomTat = { soThem: kh.them.length, soSua: kh.sua.length, soHetHieuLuc: kh.hetHieuLuc.length, giuNguyen: kh.giuNguyen };
      if (d.cheDo !== 'ghi') {
        const chuan = kho.DM_ChiTieu.map((c) => ({ maChiTieu: c.maChiTieu, tenChiTieu: c.tenChiTieu })), goiY = {};
        if (chuan.length) for (const r of dong) { const c = daCo.find((x) => x.maTrongBo === r.maTrongBo); if (r.maChiTieu || c?.maChiTieu) continue; const g = T.BoChiTieu.goiYGhep(r.tenNguyenVan, chuan); if (g.length) goiY[r.maTrongBo] = g; }
        return { kiemTra: kt, keHoach: tomTat, goiYGhep: goiY };
      }
      if (!kt.hopLe) { const e = new Error(kt.loi.length + ' lỗi, chưa ghi dòng nào'); e.ma = 'DU_LIEU_KHONG_HOP_LE'; e.thongBao = e.message; e.chiTiet = kt.loi; throw e; }
      const canCu = d.canCu || 'Nhập file mẫu chuẩn bộ ' + maBo;
      for (const r of kh.them) { const { __dong, ...x } = r; them('ChiTieu_TrongBo', x, p, canCu); }
      for (const s of kh.sua) sua('ChiTieu_TrongBo', s.ma, s.thayDoi, p, canCu);
      for (const ma of kh.hetHieuLuc) sua('ChiTieu_TrongBo', ma, { tinhTrangHieuLuc: 'Hết hiệu lực' }, p, canCu);
      const bo = kho.DM_BoChiTieu.find((b) => b.maBo === maBo);
      if (bo) Object.assign(bo, { ...Object.fromEntries(Object.entries(d.bo).filter(([k, v]) => v !== '' && SoDo.cot('DM_BoChiTieu', k) && !SoDo.cot('DM_BoChiTieu', k).heThong && SoDo.cot('DM_BoChiTieu', k).kieu !== 'number')), soChiTieu: dong.length });
      else them('DM_BoChiTieu', { ...d.bo, soChiTieu: dong.length }, p, canCu);
      return { maBo, ...tomTat };
    },
    'chiTieu.ghep': (d, p) => {
      const r = kho.ChiTieu_TrongBo.find((x) => x.maTrongBo === d.maTrongBo); if (!r) loi('KHONG_TIM_THAY', 'Không có chỉ tiêu ' + d.maTrongBo);
      let ma = d.maChiTieu;
      if (d.taoMoi) {
        const moi = { maChiTieu: d.taoMoi.maChiTieu, tenChiTieu: d.taoMoi.tenChiTieu || r.tenNguyenVan, mucLienQuanCapXa: T.BoChiTieu.mucLienQuanTuCap(r.capDuLieu), nguonSoLieuNoiDung: r.nguonSoLieu };
        for (const k of ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap', 'linhVucLon', 'thuocTinhTongHop', 'capDuLieu', 'kyBaoCaoXa']) if (r[k]) moi[k] = r[k];
        ma = them('DM_ChiTieu', moi, p, d.canCu || 'Ghép nội hàm').maChiTieu;
      } else if (!kho.DM_ChiTieu.some((c) => c.maChiTieu === ma)) loi('KHONG_TIM_THAY', 'Không có chỉ tiêu chuẩn ' + ma);
      return { dong: sua('ChiTieu_TrongBo', r.maTrongBo, { maChiTieu: ma }, p, d.canCu || 'Ghép nội hàm'), chuan: kho.DM_ChiTieu.find((c) => c.maChiTieu === ma) };
    }
  };
  const NAM_TRUONG = ['khaiNiemPhuongPhapTinh', 'phanToChuYeu', 'kyCongBo', 'nguonSoLieu', 'coQuanChuTriThuThap', 'coQuanPhoiHopThuThap'];
  const layPhien = (ma) => (ma === 'het' ? { hetHanLuc: '2020-01-01T00:00:00+07:00', trangThaiPhien: 'hoatDong', vaiTro: [] } : phien[ma] || null);

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api') {
      let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
        let yc; try { yc = JSON.parse(body); } catch { yc = null; }
        const kq = DieuPhoi.xuLy(yc, { handlers, layPhien, bayGioIso: gio() });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(kq));
      }); return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api')) { const kq = DieuPhoi.xuLy({ action: 'heThong.sucKhoe' }, { handlers, layPhien, bayGioIso: gio() }); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(kq)); }
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p === '/config.js') { res.writeHead(200, { 'Content-Type': MIME['.js'] }); return res.end(`window.HTTD3_CONFIG = { API_URL: 'http://127.0.0.1:${server.address().port}/api', GOOGLE_CLIENT_ID: 'TEST' };`); }
    const f = path.join(WEB, p);
    if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(cong, '127.0.0.1', () => resolve({ url: 'http://127.0.0.1:' + server.address().port, kho, dung: () => new Promise((r) => server.close(r)) })));
}
