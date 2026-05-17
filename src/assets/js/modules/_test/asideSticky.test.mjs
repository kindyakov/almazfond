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

  contains(className) {
    return this.set.has(className);
  }

  toggle(className) {
    if (this.set.has(className)) {
      this.set.delete(className);
      return false;
    }

    this.set.add(className);
    return true;
  }
}

class FakeElement {
  constructor({ classNames = [], rect = {}, offsetHeight = 0, selectorMap = {} } = {}) {
    this.classList = new FakeClassList(classNames);
    this.children = [];
    this.offsetHeight = offsetHeight;
    this.rect = {
      top: 0,
      left: 0,
      width: 0,
      height: offsetHeight,
      ...rect
    };
    this.selectorMap = selectorMap;
    this.style = {};
  }

  before(element) {
    this.previousSibling = element;
  }

  querySelector(selector) {
    return this.selectorMap[selector] ?? null;
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

const loadModule = async () => {
  const modulePath = resolve('src/assets/js/modules/asideSticky.js');
  const source = await readFile(modulePath, 'utf8');

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${Date.now()}`);
};

const createDom = ({
  headerClassNames = [],
  headerHeight = 80,
  scrollY = 120,
  asideTop = 200
} = {}) => {
  const bodyElement = new FakeElement({
    offsetHeight: 200,
    rect: { height: 200 }
  });
  const asideElement = new FakeElement({
    offsetHeight: 600,
    rect: { top: asideTop - scrollY, left: 32, width: 280, height: 600 },
    selectorMap: {
      '[data-aside-body]': bodyElement
    }
  });
  const headerElement = new FakeElement({
    classNames: headerClassNames,
    rect: { height: headerHeight },
    offsetHeight: headerHeight
  });

  global.ResizeObserver = undefined;
  global.document = {
    createElement() {
      return new FakeElement();
    },
    querySelector(selector) {
      if (selector === '[data-header]') {
        return headerElement;
      }

      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-aside]') {
        return [asideElement];
      }

      return [];
    },
    addEventListener() {}
  };
  global.window = {
    scrollY,
    addEventListener() {},
    matchMedia() {
      return {
        matches: true,
        addEventListener() {}
      };
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };

  return { bodyElement };
};

test('initAsideSticky offsets fixed aside below the fixed header', async () => {
  const { bodyElement } = createDom({ headerClassNames: ['header--fixed'], headerHeight: 80 });
  const { initAsideSticky } = await loadModule();

  initAsideSticky();

  assert.equal(bodyElement.style.position, 'fixed');
  assert.equal(bodyElement.style.top, '90px');
});

test('initAsideSticky keeps base offset when the header is not fixed', async () => {
  const { bodyElement } = createDom({
    headerClassNames: [],
    headerHeight: 80,
    scrollY: 95,
    asideTop: 60
  });
  const { initAsideSticky } = await loadModule();

  initAsideSticky();

  assert.equal(bodyElement.style.position, 'fixed');
  assert.equal(bodyElement.style.top, '90px');
});

test('initAsideSticky keeps the base offset before the header threshold', async () => {
  const { bodyElement } = createDom({
    headerClassNames: [],
    headerHeight: 80,
    scrollY: 70,
    asideTop: 60
  });
  const { initAsideSticky } = await loadModule();

  initAsideSticky();

  assert.equal(bodyElement.style.position, 'fixed');
  assert.equal(bodyElement.style.top, '10px');
});
