'use strict';
// Bộ nạp lớp thuần: chạy mọi file gas/thuan/*.gs trong phạm vi toàn cục của tiến trình test
// (vm.runInThisContext), mô phỏng phạm vi toàn cục của Apps Script: `var` cấp file thành biến toàn cục.
// Dùng cùng realm với test để assert.deepEqual so sánh được nguyên mẫu; mỗi file test là một tiến trình riêng.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const THU_MUC_THUAN = path.join(__dirname, '..', 'thuan');

// Trả về ngữ cảnh đã nạp: ctx.SoDo, ctx.Bang, ... và ctx.__daNap (danh sách file theo thứ tự nạp).
function taiThuan() {
  const ctx = globalThis;
  const files = fs.existsSync(THU_MUC_THUAN)
    ? fs.readdirSync(THU_MUC_THUAN).filter((f) => f.endsWith('.gs')).sort()
    : [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(THU_MUC_THUAN, f), 'utf8');
    vm.runInThisContext(src, { filename: f });
  }
  ctx.__daNap = files;
  return ctx;
}


// Nạp TOÀN BỘ mã Apps Script (Main.gs, ketnoi/*, thuan/*) vào một ngữ cảnh vm riêng, đúng THỨ TỰ ASCII của đường dẫn
// như clasp đẩy lên (Main.gs < ketnoi/... < thuan/...), với dịch vụ Google giả lập. Dùng để bắt lỗi lúc nạp và chạy lớp kết nối.
function taiTatCa(tuyChon) {
  const { taoDichVuGia } = require('./_gia');
  const gia = taoDichVuGia(tuyChon);
  const ctx = vm.createContext(Object.assign({}, gia.G));
  const goc = path.join(__dirname, '..');
  const ds = [];
  (function quet(d, rel) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (e.name === 'test') return; const r = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) quet(path.join(d, e.name), r); else if (e.name.endsWith('.gs')) ds.push(r); }); })(goc, '');
  ds.sort();
  for (const f of ds) vm.runInContext(fs.readFileSync(path.join(goc, f), 'utf8'), ctx, { filename: f });
  ctx.__daNap = ds; ctx.__gia = gia.trangThai;
  return ctx;
}

module.exports = { taiThuan, taiTatCa };
