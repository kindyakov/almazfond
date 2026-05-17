import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

class FakeElement {
  constructor({ selectorMap = {} } = {}) {
    this.selectorMap = selectorMap;
    this.hidden = false;
    this.listeners = new Map();
  }

  querySelector(selector) {
    return this.selectorMap[selector] ?? null;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type) {
    this.listeners.get(type)?.();
  }
}

const loadModule = async () => {
  const modulePath = resolve('src/assets/js/modules/cookieBanner.js');
  const source = await readFile(modulePath, 'utf8');

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${Date.now()}`);
};

const createStorageMock = (initialEntries = []) => {
  const values = new Map(initialEntries);

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
};

test('initCookieBanner shows the banner until consent is accepted', async () => {
  const acceptButton = new FakeElement();
  const banner = new FakeElement({
    selectorMap: {
      '[data-cookie-banner-accept]': acceptButton
    }
  });
  const storage = createStorageMock();

  global.document = {
    querySelector: (selector) => (selector === '[data-cookie-banner]' ? banner : null)
  };
  global.localStorage = storage;

  const { initCookieBanner } = await loadModule();
  initCookieBanner();

  assert.equal(banner.hidden, false);

  acceptButton.dispatch('click');

  assert.equal(storage.getItem('almazfond_cookie_consent'), 'accepted');
  assert.equal(banner.hidden, true);
});

test('initCookieBanner keeps the banner hidden after consent was accepted', async () => {
  const acceptButton = new FakeElement();
  const banner = new FakeElement({
    selectorMap: {
      '[data-cookie-banner-accept]': acceptButton
    }
  });

  global.document = {
    querySelector: (selector) => (selector === '[data-cookie-banner]' ? banner : null)
  };
  global.localStorage = createStorageMock([['almazfond_cookie_consent', 'accepted']]);

  const { initCookieBanner } = await loadModule();
  initCookieBanner();

  assert.equal(banner.hidden, true);
});
