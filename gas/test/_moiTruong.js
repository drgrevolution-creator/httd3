'use strict';
// Bộ nạp lớp thuần: nạp mọi file gas/thuan/*.gs vào MỘT ngữ cảnh vm dùng chung,
// mô phỏng phạm vi toàn cục của Apps Script (các `var` cấp file thành biến toàn cục).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const THU_MUC_THUAN = path.join(__dirname, '..', 'thuan');

// Trả về ngữ cảnh đã nạp: ctx.SoDo, ctx.Bang, ... và ctx.__daNap (danh sách file theo thứ tự nạp).
function taiThuan() {
  const ctx = vm.createContext({ console });
  const files = fs.existsSync(THU_MUC_THUAN)
    ? fs.readdirSync(THU_MUC_THUAN).filter((f) => f.endsWith('.gs')).sort()
    : [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(THU_MUC_THUAN, f), 'utf8');
    vm.runInContext(src, ctx, { filename: f });
  }
  ctx.__daNap = files;
  return ctx;
}

module.exports = { taiThuan };
