import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { moi, dangNhapMatKhau } from './_trinhDuyet.mjs';

// File mẫu nhỏ sinh bằng scripts/chuyen-doi/mau_chuan.py từ 10 dòng đầu LUAT-TK (văn bản công khai).
const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mau');
const tomTat = (page) => page.textContent('[data-test="tom-tat"]');

test('nhập bộ chỉ tiêu: xem trước 10 dòng giữ số 0 đầu, ghi, rồi bản sửa một dòng → Sửa 1, giữ nguyên 9', async () => {
  const { page, url, dong, mc } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    assert.equal(await page.evaluate(() => typeof window.XLSX), 'undefined', 'SheetJS chỉ tải khi mở màn Nhập');
    await page.goto(url + '/#/chi-tieu/nhap'); await page.waitForSelector('[data-test="man-nhap-chi-tieu"]');
    await page.setInputFiles('[data-test="chon-file"]', path.join(MAU, 'LUAT-TK-10.xlsx'));
    await page.waitForSelector('[data-test="bang-xem-truoc"] tbody tr');
    assert.equal(await page.locator('[data-test="bang-xem-truoc"] tbody tr').count(), 10);
    assert.match(await tomTat(page), /Thêm 10/);
    assert.equal(await page.locator('[data-test="loi-nhap"] li').count(), 0);
    assert.equal(await page.textContent('[data-test="bang-xem-truoc"] tr[data-ma="LUAT-TK:0101"] [data-cot="maGoc"]'), '0101');
    assert.equal(await page.isDisabled('[data-test="nut-ghi"]'), false);
    await page.click('[data-test="nut-ghi"]');
    await page.waitForFunction(() => /Đã nhập 10/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
    assert.equal(mc.kho.ChiTieu_TrongBo.length, 10);
    assert.equal(mc.kho.ChiTieu_TrongBo[0].maGoc, '0101');
    assert.match(mc.kho.ChiTieu_TrongBo[2].coQuanPhoiHopThuThap, /Bộ Công an;\n/);

    await page.setInputFiles('[data-test="chon-file"]', path.join(MAU, 'LUAT-TK-10-sua-1.xlsx'));
    await page.waitForFunction(() => /Sửa 1/.test(document.querySelector('[data-test="tom-tat"]')?.textContent || ''));
    assert.match(await tomTat(page), /Giữ nguyên 9/);
    assert.match(await tomTat(page), /Thêm 0/);

    // File thiếu một dòng so với bộ đang có → phải xác nhận "Hết hiệu lực" mới được ghi.
    await page.setInputFiles('[data-test="chon-file"]', path.join(MAU, 'LUAT-TK-9.xlsx'));
    await page.waitForFunction(() => /Hết hiệu lực 1/.test(document.querySelector('[data-test="tom-tat"]')?.textContent || ''));
    assert.equal(await page.isDisabled('[data-test="nut-ghi"]'), true, 'chưa xác nhận thì chưa được ghi');
    await page.check('[data-test="xac-nhan-het-hieu-luc"]');
    assert.equal(await page.isDisabled('[data-test="nut-ghi"]'), false);
    await page.click('[data-test="nut-ghi"]');
    await page.waitForFunction(() => /hết hiệu lực 1/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
    assert.equal(mc.kho.ChiTieu_TrongBo.find((r) => r.maTrongBo === 'LUAT-TK:0110').tinhTrangHieuLuc, 'Hết hiệu lực');
  } finally { await dong(); }
});

test('file có dòng thiếu tên → lỗi ghi đúng số dòng Excel, nút Ghi bị khóa', async () => {
  const { page, url, dong, mc } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/chi-tieu/nhap'); await page.waitForSelector('[data-test="man-nhap-chi-tieu"]');
    await page.setInputFiles('[data-test="chon-file"]', path.join(MAU, 'LUAT-TK-10-thieu-ten.xlsx'));
    await page.waitForSelector('[data-test="loi-nhap"] li');
    const loi = await page.textContent('[data-test="loi-nhap"]');
    assert.match(loi, /Dòng 7\b/, loi);
    assert.match(loi, /tên/i);
    assert.equal(await page.isDisabled('[data-test="nut-ghi"]'), true);
    assert.equal(mc.kho.ChiTieu_TrongBo.length, 0);
  } finally { await dong(); }
});

test('DONVI không thấy tuyến Nhập bộ chỉ tiêu', async () => {
  const { page, url, dong, mc } = await moi();
  try {
    mc.kho.DM_NguoiDung.push({ maNguoiDung: 'ND-0009', tenDangNhap: 'dv04', hoTen: 'CV đơn vị', email: '', vaiTro: ['DONVI'], danhSachDonVi: ['DV04'], matKhau: 'Abc12345', batBuocDoiMatKhau: false, soLanSai: 0, khoaDen: '', trangThai: 'Hoạt động', tinhTrang: 'Hoạt động' });
    await dangNhapMatKhau(page, url, 'dv04'); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/chi-tieu/nhap');
    await page.waitForFunction(() => location.hash === '#/hom-nay');
    assert.equal(await page.locator('[data-test="man-nhap-chi-tieu"]').count(), 0);
    assert.equal(await page.locator('[data-test="menu-chi-tieu/nhap"]').count(), 0);
  } finally { await dong(); }
});
