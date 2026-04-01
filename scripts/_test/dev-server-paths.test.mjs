import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeRequestPathname } from '../dev-server-paths.mjs';

test('normalizeRequestPathname decodes percent-encoded cyrillic paths', () => {
  const pathname =
    '/assets/documents/%D0%A1%D0%B5%D1%80%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%82_12922_%D0%AD%D0%94705292.pdf';

  assert.equal(
    normalizeRequestPathname(pathname),
    '/assets/documents/Сертификат_12922_ЭД705292.pdf'
  );
});

test('normalizeRequestPathname preserves invalid escape sequences', () => {
  const pathname = '/assets/documents/%E0%A4%A.pdf';

  assert.equal(normalizeRequestPathname(pathname), pathname);
});
