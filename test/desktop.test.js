import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { notchBounds, safeWebsite } = createRequire(import.meta.url)('../desktop/policy.cjs');
test('notch stays centered on primary work area and expands downward', () => {
  const display = { workArea: { x: -1920, y: 48, width: 1920, height: 1032 } };
  assert.deepEqual(notchBounds(display, false), { x: -1062, y: 48, width: 204, height: 176 });
  assert.deepEqual(notchBounds(display, true), { x: -1176, y: 48, width: 432, height: 620 });
});
test('notch fits a small display', () => {
  assert.deepEqual(notchBounds({ workArea: { x: 0, y: 0, width: 320, height: 300 } }, true), { x: 0, y: 0, width: 320, height: 300 });
});
test('desktop bridge allows websites but never executable or file protocols', () => {
  assert.equal(safeWebsite('https://example.com/path'), 'https://example.com/path');
  for (const url of ['file:///C:/Windows/system32/cmd.exe', 'javascript:alert(1)', 'ms-settings:privacy', 'https://user:pass@example.com', null, {}, 'not a url']) assert.equal(safeWebsite(url), null);
});
