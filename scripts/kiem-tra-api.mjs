#!/usr/bin/env node
// Kiểm tra nhanh bản API Apps Script đã triển khai. Chạy TRÊN MÁY của người quản trị:
//   node scripts/kiem-tra-api.mjs <API_URL> <tenDangNhap> <matKhau>
// In bảng ĐẠT/LỖI từng bước; thoát mã 1 nếu có LỖI. Không ghi gì ngoài một lĩnh vực thử (rồi ngừng ngay).
const [,, API_URL, TEN, MK] = process.argv;
if (!API_URL || !TEN || !MK) { console.error('Cách dùng: node scripts/kiem-tra-api.mjs <API_URL> <tenDangNhap> <matKhau>'); process.exit(2); }

let phien = '';
const ketQua = [];
const ghi = (buoc, dat, chiTiet) => { ketQua.push({ buoc, dat, chiTiet }); console.log((dat ? 'ĐẠT ' : 'LỖI ') + buoc + (chiTiet ? '  — ' + chiTiet : '')); };
async function goi(action, duLieu) {
  const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ phien, action, duLieu: duLieu || {} }), redirect: 'follow' });
  const t = await r.text();
  let kq; try { kq = JSON.parse(t); } catch { throw new Error('Phản hồi không phải JSON (HTTP ' + r.status + '): ' + t.slice(0, 120)); }
  if (!kq.ok) throw new Error(kq.loi.ma + ': ' + kq.loi.thongBao);
  return kq.duLieu;
}
async function buoc(ten, fn) { try { const ct = await fn(); ghi(ten, true, ct); } catch (e) { ghi(ten, false, e.message); } }

await buoc('GET heThong.sucKhoe', async () => { const r = await fetch(API_URL + '?action=heThong.sucKhoe', { redirect: 'follow' }); const kq = await r.json(); if (!kq.ok) throw new Error(JSON.stringify(kq)); const sk = kq.duLieu; return 'phiên bản ' + sk.phienBan + ', thiếu: ' + ((sk.thieu && sk.thieu.join(', ')) || 'không'); });
await buoc('xacThuc.dangNhapMatKhau', async () => { const d = await goi('xacThuc.dangNhapMatKhau', { tenDangNhap: TEN, matKhau: MK, thietBi: 'kiem-tra-api' }); phien = d.maPhien; return d.nguoiDung.hoTen + ' · hết hạn ' + d.hetHanLuc; });
await buoc('heThong.khoiDong', async () => { const d = await goi('heThong.khoiDong'); return d.soDoDanhMuc.length + ' bảng danh mục, vai trò ' + (d.phien.vaiTro || []).join('/'); });
await buoc('danhMuc.doc DM_DonVi (mong 36 dòng)', async () => { const ds = await goi('danhMuc.doc', { bang: 'DM_DonVi' }); if (ds.length !== 36) throw new Error('có ' + ds.length + ' dòng'); return '36 dòng'; });
const maThu = 'THU' + Date.now().toString(36).toUpperCase().slice(-5);
await buoc('danhMuc.them DM_LinhVuc ' + maThu, async () => { const r = await goi('danhMuc.them', { bang: 'DM_LinhVuc', banGhi: { maLinhVuc: maThu, tenLinhVuc: 'Lĩnh vực thử (kiem-tra-api)', thuTu: 999 } }); return 'tạo lúc ' + r.taoLuc; });
await buoc('danhMuc.ngung ' + maThu, async () => { const r = await goi('danhMuc.ngung', { bang: 'DM_LinhVuc', ma: maThu, lyDo: 'dòng thử của kiem-tra-api' }); return 'tinhTrang = ' + r.tinhTrang; });
await buoc('nhatKy.doc cho ' + maThu + ' (mong ≥ 2 dòng)', async () => { const ds = await goi('nhatKy.doc', { bang: 'DM_LinhVuc', ma: maThu }); if (ds.length < 2) throw new Error('có ' + ds.length + ' dòng'); return ds.map((x) => x.hanhDong).join(', '); });
await buoc('xacThuc.dangXuat', async () => { await goi('xacThuc.dangXuat'); return 'đã thu hồi phiên'; });
await buoc('gọi lại sau đăng xuất phải bị từ chối', async () => { try { await goi('heThong.khoiDong'); throw new Error('vẫn gọi được'); } catch (e) { if (!/PHIEN_HET_HAN/.test(e.message)) throw e; return 'PHIEN_HET_HAN đúng'; } });

const soLoi = ketQua.filter((k) => !k.dat).length;
console.log('\nTổng: ' + (ketQua.length - soLoi) + ' ĐẠT, ' + soLoi + ' LỖI');
process.exit(soLoi ? 1 : 0);
