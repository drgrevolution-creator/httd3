// Tiện ích chung cho test giao diện: mở trình duyệt, máy chủ giả, đăng nhập nhanh.
import { createRequire } from 'node:module';
import { khoiDong } from './may-chu-gia.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export async function moi(viewport = { width: 360, height: 740 }) {
  const mc = await khoiDong();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.setDefaultTimeout(8000);
  await page.route(/accounts\.google\.com|fonts\.g(oogleapis|static)\.com/, (r) => r.abort());
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  const dong = async () => { await browser.close(); await mc.dung(); };
  return { mc, browser, page, dong, url: mc.url };
}

export async function dangNhapMatKhau(page, url, ten = 'quantri', mk = 'Abc12345') {
  await page.goto(url + '/#/hom-nay');
  await page.fill('[data-test="ten-dang-nhap"]', ten);
  await page.fill('[data-test="mat-khau"]', mk);
  await page.click('[data-test="nut-dang-nhap"]');
}
