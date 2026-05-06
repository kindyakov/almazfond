import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

class FakeClassList {
  constructor(initial = []) {
    this.set = new Set(initial);
  }

  add(...classNames) {
    classNames.forEach((className) => this.set.add(className));
  }

  remove(...classNames) {
    classNames.forEach((className) => this.set.delete(className));
  }

  contains(className) {
    return this.set.has(className);
  }
}

class FakeElement {
  constructor({ selectorMap = {} } = {}) {
    this.selectorMap = selectorMap;
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
  }

  querySelector(selector) {
    return this.selectorMap[selector] ?? null;
  }

  querySelectorAll(selector) {
    return this.selectorMap[selector] ?? [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.(event);
  }
}

const loadModule = async () => {
  const modulePath = resolve('src/assets/js/modules/header.js');
  const source = await readFile(modulePath, 'utf8');

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${Date.now()}`);
};

const createDom = ({ innerWidth = 390, scrollY = 240 } = {}) => {
  const menuToggle = new FakeElement();
  const searchToggle = new FakeElement();
  const header = new FakeElement({
    selectorMap: {
      '[data-header-menu-toggle]': menuToggle
    }
  });
  const body = new FakeElement();
  const main = new FakeElement();
  const menuPanel = new FakeElement();
  const searchPanel = new FakeElement();
  const mobileMenu = new FakeElement();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const scrollCalls = [];

  global.document = {
    body,
    querySelector(selector) {
      const map = {
        '[data-header]': header,
        '.main': main,
        '[data-header-menu-panel]': menuPanel,
        '[data-header-search-panel]': searchPanel,
        '[data-mobile-menu]': mobileMenu
      };

      return map[selector] ?? null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-header-search-toggle]') {
        return [searchToggle];
      }

      return [];
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    }
  };

  global.window = {
    innerWidth,
    scrollY,
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    scrollTo(x, y) {
      scrollCalls.push([x, y]);
    }
  };

  return {
    body,
    header,
    main,
    menuPanel,
    menuToggle,
    mobileMenu,
    scrollCalls,
    searchPanel,
    searchToggle,
    windowListeners
  };
};

test('initHeader locks and restores body scroll for the mobile menu overlay', async () => {
  const { body, menuToggle, scrollCalls } = createDom({ innerWidth: 390, scrollY: 240 });
  const { initHeader } = await loadModule();

  initHeader();
  menuToggle.dispatch('click');

  assert.equal(body.classList.contains('is-menu-open'), true);
  assert.equal(body.style.position, 'fixed');
  assert.equal(body.style.top, '-240px');
  assert.equal(body.style.width, '100%');

  menuToggle.dispatch('click');

  assert.equal(body.classList.contains('is-menu-open'), false);
  assert.equal(body.style.position, '');
  assert.equal(body.style.top, '');
  assert.deepEqual(scrollCalls, [[0, 240]]);
});

test('initHeader locks and restores body scroll for the mobile search overlay', async () => {
  const { body, scrollCalls, searchToggle } = createDom({ innerWidth: 390, scrollY: 180 });
  const { initHeader } = await loadModule();

  initHeader();
  searchToggle.dispatch('click');

  assert.equal(body.classList.contains('is-search-open'), true);
  assert.equal(body.style.position, 'fixed');
  assert.equal(body.style.top, '-180px');

  searchToggle.dispatch('click');

  assert.equal(body.classList.contains('is-search-open'), false);
  assert.equal(body.style.position, '');
  assert.equal(body.style.top, '');
  assert.deepEqual(scrollCalls, [[0, 180]]);
});

test('initHeader does not apply fixed body scroll locking for desktop search state', async () => {
  const { body, searchToggle, scrollCalls } = createDom({ innerWidth: 1280, scrollY: 320 });
  const { initHeader } = await loadModule();

  initHeader();
  searchToggle.dispatch('click');

  assert.equal(body.classList.contains('is-search-open'), true);
  assert.equal(body.style.position ?? '', '');
  assert.equal(body.style.top ?? '', '');
  assert.deepEqual(scrollCalls, []);
});
