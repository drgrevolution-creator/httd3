import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moi, dangNhapMatKhau } from './_trinhDuyet.mjs';


test('thêm một lĩnh vực và thấy dòng nhật ký THEM', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.click('[data-test="menu-danh-muc"]');
    await page.waitForSelector('[data-test="man-danh-muc"]');
    await page.click('[data-test="chon-bang-DM_LinhVuc"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="CCHC"]');
    await page.click('[data-test="nut-them"]');
    await page.waitForSelector('[data-test="tam-truot"] form');
    await page.fill('[data-test="o-maLinhVuc"]', 'ATTT');
    await page.fill('[data-test="o-tenLinhVuc"]', 'An toàn thông tin');
    await page.click('[data-test="nut-luu"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="ATTT"]');
    await page.click('[data-test="bang"] tr[data-ma="ATTT"]');
    await page.waitForSelector('[data-test="tam-truot"]');
    await page.click('[data-test="tab-nhat-ky"]');
    await page.waitForFunction(() => /THEM/.test(document.querySelector('[data-test="nhat-ky-ban-ghi"]')?.textContent || ''));
  } finally { await dong(); }
});

test('sửa yêu cầu căn cứ, ngừng yêu cầu lý do', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/danh-muc'); await page.waitForSelector('[data-test="man-danh-muc"]');
    await page.click('[data-test="chon-bang-DM_LinhVuc"]');
    await page.click('[data-test="bang"] tr[data-ma="KHAC"]');
    await page.waitForSelector('[data-test="tam-truot"] form');
    await page.fill('[data-test="o-tenLinhVuc"]', 'Khác (đã sửa)');
    await page.click('[data-test="nut-luu"]');
    await page.waitForFunction(() => /căn cứ/i.test(document.querySelector('[data-loi="canCu"]')?.textContent || ''));
    await page.fill('[data-test="o-canCu"]', 'Theo chỉ đạo ngày 15/11');
    await page.click('[data-test="nut-luu"]');
    await page.waitForFunction(() => document.querySelector('[data-test="bang"] tr[data-ma="KHAC"]')?.textContent.includes('Khác (đã sửa)'));
    await page.click('[data-test="bang"] tr[data-ma="KHAC"]');
    await page.waitForSelector('[data-test="nut-ngung"]');
    await page.click('[data-test="nut-ngung"]');
    await page.waitForSelector('[data-test="o-lyDo"]');
    await page.fill('[data-test="o-lyDo"]', 'Không còn dùng');
    await page.click('[data-test="nut-xac-nhan-ngung"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="KHAC"][data-ngung="true"]');
  } finally { await dong(); }
});

test('người dùng: thêm trả mật khẩu tạm một lần; DONVI không thấy Danh mục và phải đổi mật khẩu', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/quan-tri'); await page.waitForSelector('[data-test="nut-them-nguoi-dung"]');
    await page.click('[data-test="nut-them-nguoi-dung"]');
    await page.waitForSelector('[data-test="tam-truot"] form');
    await page.fill('[data-test="o-tenDangNhap"]', 'ttpvhcc');
    await page.fill('[data-test="o-hoTen"]', 'CV Trung tâm HCC');
    await page.fill('[data-test="o-email"]', 'ttpvhcc.cv@gmail.com');
    await page.check('[data-test="o-vaiTro"] input[value="DONVI"]');
    await page.check('[data-test="o-danhSachDonVi"] input[value="DV04"]');
    await page.click('[data-test="nut-luu"]');
    await page.waitForSelector('[data-test="mat-khau-tam"]');
    const tam = (await page.textContent('[data-test="mat-khau-tam"]')).trim();
    assert.ok(tam.length >= 8, 'mật khẩu tạm: ' + tam);
    await page.click('[data-test="nut-dong-mat-khau-tam"]');
    await page.waitForSelector('[data-test="bang-nguoi-dung"] tr[data-ma]');
    await page.click('[data-test="nut-dang-xuat"]');
    await page.waitForSelector('[data-test="nut-dang-nhap"]');
    await page.fill('[data-test="ten-dang-nhap"]', 'ttpvhcc'); await page.fill('[data-test="mat-khau"]', tam); await page.click('[data-test="nut-dang-nhap"]');
    await page.waitForSelector('[data-test="nhac-doi-mat-khau"]');
    assert.equal(await page.evaluate(() => location.hash), '#/quan-tri');
    assert.equal(await page.isVisible('[data-test="menu-danh-muc"]'), false);
    await page.fill('[data-test="mat-khau-cu"]', tam); await page.fill('[data-test="mat-khau-moi"]', 'Moi12345x'); await page.fill('[data-test="mat-khau-lai"]', 'Moi12345x');
    await page.click('[data-test="nut-doi-mat-khau"]');
    await page.waitForFunction(() => /Đã đổi mật khẩu/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
  } finally { await dong(); }
});

test('trên 1280 px bảng có cột mã cố định khi cuộn ngang; trên 360 px vẫn dùng được', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/danh-muc'); await page.waitForSelector('[data-test="man-danh-muc"]');
    await page.click('[data-test="chon-bang-DM_DonVi"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="DV01"]');
    const truoc = await page.locator('[data-test="bang"] tr[data-ma="DV01"] td:first-child').boundingBox();
    await page.evaluate(() => { document.querySelector('.cuon-ngang').scrollLeft = 400; });
    const sau = await page.locator('[data-test="bang"] tr[data-ma="DV01"] td:first-child').boundingBox();
    assert.ok(Math.abs(truoc.x - sau.x) < 2, 'cột mã phải cố định: ' + truoc.x + ' → ' + sau.x);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.click('[data-test="chon-bang-DM_LinhVuc"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="CCHC"]');
  } finally { await dong(); }
});

test('hết hạn phiên đúng lúc bấm Lưu trong tấm trượt: biểu mẫu còn nguyên, máy chủ báo lỗi sau đăng nhập lại vẫn thấy dữ liệu', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/danh-muc'); await page.waitForSelector('[data-test="man-danh-muc"]');
    await page.click('[data-test="chon-bang-DM_LinhVuc"]'); await page.waitForSelector('[data-test="bang"] tr[data-ma="CCHC"]');
    await page.click('[data-test="nut-them"]'); await page.waitForSelector('[data-test="tam-truot"] form');
    await page.fill('[data-test="o-maLinhVuc"]', 'CCHC');            // mã đã tồn tại → máy chủ sẽ báo lỗi
    await page.fill('[data-test="o-tenLinhVuc"]', 'Trùng mã thử');
    await page.evaluate(() => localStorage.setItem('httd3.phien', 'het'));
    await page.click('[data-test="nut-luu"]');
    await page.waitForSelector('[data-test="tam-truot-dang-nhap"]');
    assert.equal(await page.inputValue('[data-test="o-tenLinhVuc"]'), 'Trùng mã thử', 'biểu mẫu phải còn trong trang khi đăng nhập lại');
    await page.fill('[data-test="tam-truot-dang-nhap"] [data-test="ten-dang-nhap"]', 'quantri');
    await page.fill('[data-test="tam-truot-dang-nhap"] [data-test="mat-khau"]', 'Abc12345');
    await page.click('[data-test="tam-truot-dang-nhap"] [data-test="nut-dang-nhap"]');
    await page.waitForFunction(() => /đã tồn tại/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
    assert.equal(await page.inputValue('[data-test="o-tenLinhVuc"]'), 'Trùng mã thử', 'dữ liệu đã gõ phải còn nguyên sau lỗi');
    await page.fill('[data-test="o-maLinhVuc"]', 'CCHC2');
    await page.click('[data-test="nut-luu"]');
    await page.waitForSelector('[data-test="bang"] tr[data-ma="CCHC2"]');
  } finally { await dong(); }
});
