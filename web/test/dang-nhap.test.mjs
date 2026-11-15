import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moi, dangNhapMatKhau } from './_trinhDuyet.mjs';

test('đăng nhập mật khẩu sai rồi đúng, vào màn Hôm nay trên điện thoại', async () => {
  const { page, url, dong } = await moi();
  try {
    await dangNhapMatKhau(page, url, 'quantri', 'sai');
    await page.waitForSelector('[data-test="thong-bao"]');
    assert.match(await page.textContent('[data-test="thong-bao"]'), /không đúng/);
    await page.fill('[data-test="mat-khau"]', 'Abc12345');
    await page.click('[data-test="nut-dang-nhap"]');
    await page.waitForSelector('[data-test="man-hom-nay"]');
    assert.equal(await page.evaluate(() => location.hash), '#/hom-nay');
    assert.ok(await page.evaluate(() => !!localStorage.getItem('httd3.phien')));
    const nav = await page.locator('[data-test="dieu-huong"]').boundingBox();
    assert.ok(nav && nav.y > 600, 'thanh điều hướng phải nằm dưới cùng, y=' + (nav && nav.y));
    assert.ok(await page.isVisible('text=Danh mục'), 'QUANTRI thấy mục Danh mục');
  } finally { await dong(); }
});

test('khóa sau 5 lần sai', async () => {
  const { page, url, dong } = await moi();
  try {
    await dangNhapMatKhau(page, url, 'quantri', 'sai');
    for (let i = 0; i < 4; i++) { await page.click('[data-test="nut-dang-nhap"]'); await page.waitForTimeout(100); }
    await page.waitForFunction(() => /khóa 15 phút/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
  } finally { await dong(); }
});

test('thẻ Google qua callback giả: hợp lệ và chưa được cấp tài khoản', async () => {
  const { page, url, dong } = await moi();
  try {
    await page.goto(url + '/');
    await page.waitForSelector('[data-test="nut-dang-nhap"]');
    await page.evaluate(() => window.__httd3.xuLyTheGoogle({ credential: 'TOKEN_LA' }));
    await page.waitForFunction(() => /chưa được cấp tài khoản/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
    await page.evaluate(() => window.__httd3.xuLyTheGoogle({ credential: 'TOKEN_OK' }));
    await page.waitForSelector('[data-test="man-hom-nay"]');
  } finally { await dong(); }
});

test('phiên hết hạn giữa chừng giữ dữ liệu đang nhập và gửi lại sau đăng nhập', async () => {
  const { page, url, dong } = await moi();
  try {
    await dangNhapMatKhau(page, url);
    await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.goto(url + '/#/quan-tri');
    await page.waitForSelector('[data-test="doi-mat-khau"]');
    await page.waitForSelector('[data-test="vung-suc-khoe"] .nhan-trang-thai'); // các lời gọi nền đã xong với phiên còn hạn
    await page.evaluate(() => localStorage.setItem('httd3.phien', 'het')); // phiên hết hạn GIỮA CHỪNG khi đang điền
    await page.fill('[data-test="mat-khau-cu"]', 'Abc12345');
    await page.fill('[data-test="mat-khau-moi"]', 'Xyz98765');
    await page.fill('[data-test="mat-khau-lai"]', 'Xyz98765');
    await page.click('[data-test="nut-doi-mat-khau"]');
    await page.waitForSelector('[data-test="tam-truot-dang-nhap"]');
    await page.fill('[data-test="tam-truot-dang-nhap"] [data-test="ten-dang-nhap"]', 'quantri');
    await page.fill('[data-test="tam-truot-dang-nhap"] [data-test="mat-khau"]', 'Abc12345');
    await page.click('[data-test="tam-truot-dang-nhap"] [data-test="nut-dang-nhap"]');
    await page.waitForFunction(() => /Đã đổi mật khẩu/.test(document.querySelector('[data-test="thong-bao"]')?.textContent || ''));
    assert.equal(await page.inputValue('[data-test="mat-khau-moi"]'), '');
  } finally { await dong(); }
});

test('máy tính 1280px: điều hướng bên trái', async () => {
  const { page, url, dong } = await moi({ width: 1280, height: 800 });
  try {
    await dangNhapMatKhau(page, url);
    await page.waitForSelector('[data-test="man-hom-nay"]');
    const nav = await page.locator('[data-test="dieu-huong"]').boundingBox();
    assert.ok(nav && nav.x < 300 && nav.height > 400, 'thanh bên trái, x=' + nav?.x + ' h=' + nav?.height);
  } finally { await dong(); }
});
