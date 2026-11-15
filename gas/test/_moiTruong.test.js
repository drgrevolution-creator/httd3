const test = require('node:test');
const assert = require('node:assert/strict');
const { taiThuan } = require('./_moiTruong');

test('nạp mọi file thuần vào một ngữ cảnh chung', () => {
  const ctx = taiThuan();
  assert.equal(typeof ctx, 'object');
  assert.ok(Array.isArray(ctx.__daNap) && ctx.__daNap.length >= 0);
});
