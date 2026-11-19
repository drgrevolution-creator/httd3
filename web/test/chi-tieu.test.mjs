import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { moi, dangNhapMatKhau } from './_trinhDuyet.mjs';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Bốn file mẫu chuẩn thật. TU-699 là dữ liệu nội bộ (data/rieng/, không có trong kho công khai): thiếu thì bỏ phần TU-699.
const FILE = {
  'TU-699': path.join(GOC, 'data/rieng/TU-699.xlsx'),
  'TT13-BNV': path.join(GOC, 'data/bo-chi-tieu/TT13-BNV.xlsx'),
  'TT45-BKHCN': path.join(GOC, 'data/bo-chi-tieu/TT45-BKHCN.xlsx'),
  'LUAT-TK': path.join(GOC, 'data/bo-chi-tieu/LUAT-TK.xlsx')
};
const CO_699 = fs.existsSync(FILE['TU-699']);

// Đọc file mẫu chuẩn giống trình duyệt (SheetJS, raw:false).
function docMau(f) {
  const wb = XLSX.readFile(f);
  const doc = (ws) => {
    const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }), k = m[0];
    return m.slice(2).filter((r) => r.some((v) => String(v).trim())).map((r) => Object.fromEntries(k.map((kk, j) => [kk, String(r[j] ?? '')])));
  };
  return { bo: doc(wb.Sheets.Bo)[0], dong: doc(wb.Sheets.ChiTieu) };
}
const DU_LIEU = Object.fromEntries(Object.entries(FILE).filter(([, f]) => fs.existsSync(f)).map(([ma, f]) => [ma, docMau(f)]));

async function moVaNap(viewport) {
  const ctx = await moi(viewport);
  for (const [ma, d] of Object.entries(DU_LIEU)) {
    const kq = ctx.mc.goiThang('chiTieu.nhap', { bo: d.bo, dong: d.dong, cheDo: 'ghi', canCu: 'nạp sẵn ' + ma });
    assert.equal(kq.soThem, d.dong.length, ma);
  }
  await dangNhapMatKhau(ctx.page, ctx.url); await ctx.page.waitForSelector('[data-test="man-hom-nay"]');
  await ctx.page.click('[data-test="menu-chi-tieu"]'); await ctx.page.waitForSelector('[data-test="man-chi-tieu"]');
  return ctx;
}
const chonBo = async (page, ma) => { await page.click(`[data-test="chon-bo-${ma}"]`); await page.waitForSelector(`[data-test="cay-chi-tieu"][data-bo="${ma}"] tr[data-ma]`); };

test('bộ chỉ tiêu: số chỉ tiêu từng bộ; TU-699 lọc cấp xã đúng số đếm; dòng con thụt dưới cha', async () => {
  const { page, dong } = await moVaNap({ width: 1280, height: 800 });
  try {
    const ky = { 'TT13-BNV': '76', 'TT45-BKHCN': '137', 'LUAT-TK': '230' };
    if (CO_699) ky['TU-699'] = '174';
    for (const [ma, so] of Object.entries(ky)) assert.equal((await page.textContent(`[data-test="so-${ma}"]`)).trim(), so, ma);
    assert.match(await page.textContent('[data-test="nut-nhap-file"]'), /Nhập từ file/);
    if (!CO_699) { console.log('BỎ QUA phần TU-699: thiếu data/rieng/TU-699.xlsx'); return; }
    await chonBo(page, 'TU-699');
    assert.equal(await page.locator('[data-test="cay-chi-tieu"] tr[data-ma]').count(), 174);
    const capXa = DU_LIEU['TU-699'].dong.filter((r) => r.capDuLieu.includes('Xã')).length;
    assert.equal(capXa, 58);
    await page.click('[data-test="loc-cap-xa"]');
    await page.waitForFunction(() => document.querySelector('[data-test="loc-cap-xa"]').getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('[data-test="cay-chi-tieu"] tr[data-khop="true"]').count(), capXa);
    assert.match(await page.textContent('[data-test="so-hien-thi"]'), new RegExp('\\b' + capXa + '\\b'));
    await page.click('[data-test="loc-cap-xa"]');
    const cha = page.locator('[data-test="cay-chi-tieu"] tr[data-ma="TU-699:4"]'), con = page.locator('[data-test="cay-chi-tieu"] tr[data-ma="TU-699:5"]');
    assert.equal(await cha.getAttribute('data-cap'), '0'); assert.equal(await con.getAttribute('data-cap'), '1');
    const thuTu = await page.$$eval('[data-test="cay-chi-tieu"] tr[data-ma]', (ds) => ds.map((t) => t.dataset.ma));
    assert.ok(thuTu.indexOf('TU-699:5') === thuTu.indexOf('TU-699:4') + 1, 'con ngay dưới cha');
    const lui = async (l) => l.locator('td.ten').evaluate((td) => parseFloat(getComputedStyle(td).paddingLeft));
    assert.ok(await lui(con) > await lui(cha), 'dòng con thụt vào');
    // "Trong đó: công nghiệp" (6.1) là con của STT 6 "- Công nghiệp và xây dựng", STT 6 lại là con của STT 4 → cấp 2.
    assert.equal(await page.locator('[data-test="cay-chi-tieu"] tr[data-ma="TU-699:6.1"]').getAttribute('data-cap'), '2');
    // thu gọn cha thì ẩn con
    await cha.locator('[data-test="nut-mo-rong"]').click();
    assert.equal(await con.isVisible(), false);
  } finally { await dong(); }
});

test('chi tiết: TT13-BNV:0101 đủ năm mục, Chủ trì đúng nguyên văn; LUAT-TK:0101 "Chưa có nội dung"; QUANTRI có nút Ghép nội hàm', async () => {
  const { page, dong } = await moVaNap({ width: 1280, height: 800 });
  try {
    await chonBo(page, 'TT13-BNV');
    await page.click('[data-test="cay-chi-tieu"] tr[data-ma="TT13-BNV:0101"]');
    await page.waitForSelector('[data-test="tam-truot"] [data-test="muc-5"]');
    for (const [i, tieuDe] of [[1, '1. Khái niệm, phương pháp tính'], [2, '2. Phân tổ chủ yếu'], [3, '3. Kỳ công bố'], [4, '4. Nguồn số liệu'], [5, '5. Cơ quan chịu trách nhiệm thu thập, tổng hợp']]) {
      assert.match(await page.textContent(`[data-test="muc-${i}"] h3`), new RegExp(tieuDe.replace(/[.()]/g, '\\$&')));
    }
    assert.equal((await page.textContent('[data-test="muc-5-chu-tri"]')).trim(), 'Vụ Chính quyền địa phương, Bộ Nội vụ.');
    const ws = await page.locator('[data-test="muc-1"] .noi-dung-chi-tieu').evaluate((n) => getComputedStyle(n).whiteSpace);
    assert.equal(ws, 'pre-line');
    assert.ok(await page.locator('[data-test="nut-ghep"]').count() === 1);
    await page.click('[data-test="tam-truot"] button[aria-label="Đóng"]');
    await chonBo(page, 'LUAT-TK');
    await page.click('[data-test="cay-chi-tieu"] tr[data-ma="LUAT-TK:0101"]');
    await page.waitForSelector('[data-test="chua-co-noi-dung"]');
    assert.match(await page.textContent('[data-test="chua-co-noi-dung"]'), /Chưa có nội dung — theo NĐ 94\/2022\/NĐ-CP/);
  } finally { await dong(); }
});

test('chỉ tiêu chuẩn: danh sách một nội hàm một mã kèm số bộ; mở ra thấy các dòng đang ghép', async () => {
  const ctx = await moi({ width: 1280, height: 800 });
  const { page, url, dong, mc } = ctx;
  try {
    for (const ma of ['TT13-BNV', 'LUAT-TK']) mc.goiThang('chiTieu.nhap', { ...DU_LIEU[ma], cheDo: 'ghi', canCu: 'nạp' });
    mc.goiThang('chiTieu.ghep', { maTrongBo: 'LUAT-TK:0101', taoMoi: { maChiTieu: 'DT-01', tenChiTieu: 'Diện tích và cơ cấu đất' } });
    mc.goiThang('chiTieu.ghep', { maTrongBo: 'TT13-BNV:0101', maChiTieu: 'DT-01' });
    await dangNhapMatKhau(page, url); await page.waitForSelector('[data-test="man-hom-nay"]');
    await page.click('[data-test="menu-chi-tieu"]'); await page.waitForSelector('[data-test="man-chi-tieu"]');
    await page.click('[data-test="tab-chuan"]');
    await page.waitForSelector('[data-test="bang-chuan"] tr[data-ma="DT-01"]');
    assert.equal((await page.textContent('[data-test="bang-chuan"] tr[data-ma="DT-01"] [data-cot="soBo"]')).trim(), '2');
    await page.click('[data-test="bang-chuan"] tr[data-ma="DT-01"]');
    await page.waitForSelector('[data-test="tam-truot"] [data-test="dong-ghep"]');
    const ds = await page.textContent('[data-test="dong-ghep"]');
    assert.match(ds, /LUAT-TK:0101/); assert.match(ds, /TT13-BNV:0101/);
    await page.click('[data-test="tam-truot"] button[aria-label="Đóng"]');
    await page.click('[data-test="tab-theo-bo"]');
    await page.waitForSelector('[data-test="cay-chi-tieu"] tr[data-ma]');
  } finally { await dong(); }
});

test('điện thoại 360 px: không cuộn ngang trang, tìm chỉ tiêu theo tên', async () => {
  const { page, dong } = await moVaNap({ width: 360, height: 740 });
  try {
    await chonBo(page, 'LUAT-TK');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'trang bị cuộn ngang');
    await page.fill('[data-test="tim-chi-tieu"]', 'tuổi thọ');
    await page.waitForFunction(() => document.querySelectorAll('[data-test="cay-chi-tieu"] tr[data-khop="true"]').length === 1);
    assert.equal(await page.locator('[data-test="cay-chi-tieu"] tr[data-khop="true"]').getAttribute('data-ma'), 'LUAT-TK:0109');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  } finally { await dong(); }
});
