// Chụp ảnh màn hình để người soát xem bằng mắt (không phải test). Chạy: node web/test/chup-anh.mjs
import { moi, dangNhapMatKhau } from './_trinhDuyet.mjs';
for (const [ten, vp] of [['dien-thoai', { width: 360, height: 740 }], ['may-tinh', { width: 1280, height: 800 }]]) {
  const { page, url, dong } = await moi(vp);
  await page.goto(url + '/'); await page.waitForSelector('[data-test="nut-dang-nhap"]');
  await page.screenshot({ path: `web/test/anh/${ten}-dang-nhap.png` });
  await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="the-suc-khoe"] .nhan-trang-thai');
  await page.screenshot({ path: `web/test/anh/${ten}-hom-nay.png`, fullPage: true });
  await page.goto(url + '/#/quan-tri'); await page.waitForSelector('[data-test="doi-mat-khau"]');
  await page.screenshot({ path: `web/test/anh/${ten}-quan-tri.png`, fullPage: true });
  await dong();
}
console.log('đã chụp vào web/test/anh/');
