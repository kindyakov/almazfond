import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

class FakeClassList {
  constructor(initial = []) {
    this.set = new Set(initial);
  }

  toggle(className, force) {
    if (typeof force === 'boolean') {
      if (force) {
        this.set.add(className);
      } else {
        this.set.delete(className);
      }
      return force;
    }

    if (this.set.has(className)) {
      this.set.delete(className);
      return false;
    }

    this.set.add(className);
    return true;
  }

  contains(className) {
    return this.set.has(className);
  }
}

class FakeElement {
  constructor({ selectorMap = {}, scrollHeight = 0, lineHeight = '22px' } = {}) {
    this.selectorMap = selectorMap;
    this.scrollHeight = scrollHeight;
    this.lineHeight = lineHeight;
    this.style = {
      values: new Map(),
      setProperty(name, value) {
        this.values.set(name, value);
      },
      removeProperty(name) {
        this.values.delete(name);
      },
      getPropertyValue(name) {
        return this.values.get(name) ?? '';
      }
    };
    this.dataset = {};
    this.hidden = false;
    this.textContent = '';
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new FakeClassList();
  }

  querySelector(selector) {
    return this.selectorMap[selector] ?? null;
  }

  querySelectorAll(selector) {
    return this.selectorMap[selector] ?? [];
  }

  closest(selector) {
    if (selector === '.product__description--content') {
      return this;
    }

    return null;
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

  dispatch(type) {
    this.listeners.get(type)?.();
  }
}

const loadModule = async () => {
  const modulePath = resolve('src/assets/js/modules/productDescriptionToggle.js');
  const source = await readFile(modulePath, 'utf8');

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${Date.now()}`);
};

const createWindowMock = () => {
  const listeners = new Map();

  return {
    getComputedStyle: () => ({ lineHeight: '20px' }),
    addEventListener: (type, listener) => {
      listeners.set(type, listener);
    },
    dispatch: (type) => {
      listeners.get(type)?.();
    }
  };
};

test('initProductDescriptionToggle collapses content and toggles the label', async () => {
  const paragraphElement = new FakeElement({ lineHeight: '20px' });
  const textElement = new FakeElement({
    selectorMap: {
      p: paragraphElement
    },
    scrollHeight: 320
  });
  const buttonElement = new FakeElement();
  const contentElement = new FakeElement({
    selectorMap: {
      '[data-product-description-text]': textElement
    }
  });
  buttonElement.closest = () => contentElement;
  buttonElement.textContent = 'Показать полностью';
  contentElement.selectorMap['[data-product-description-text]'] = textElement;

  global.window = createWindowMock();
  global.document = {
    querySelectorAll: (selector) => (selector === '[data-product-description-toggle]' ? [buttonElement] : [])
  };

  const { initProductDescriptionToggle } = await loadModule();
  initProductDescriptionToggle();

  assert.equal(textElement.classList.contains('is-collapsed'), true);
  assert.equal(textElement.style.getPropertyValue('--product-description-collapsed-height'), '140px');
  assert.equal(textElement.style.getPropertyValue('--product-description-expanded-height'), '320px');
  assert.equal(buttonElement.textContent, 'Показать полностью');
  assert.equal(buttonElement.getAttribute('aria-expanded'), 'false');
  assert.equal(contentElement.classList.contains('is-expanded'), false);

  buttonElement.dispatch('click');

  assert.equal(textElement.classList.contains('is-collapsed'), false);
  assert.equal(textElement.style.getPropertyValue('--product-description-expanded-height'), '320px');
  assert.equal(buttonElement.textContent, 'Скрыть');
  assert.equal(buttonElement.getAttribute('aria-expanded'), 'true');
  assert.equal(contentElement.classList.contains('is-expanded'), true);

  buttonElement.dispatch('click');

  assert.equal(textElement.classList.contains('is-collapsed'), true);
  assert.equal(buttonElement.textContent, 'Показать полностью');
  assert.equal(buttonElement.getAttribute('aria-expanded'), 'false');
  assert.equal(contentElement.classList.contains('is-expanded'), false);
});

test('initProductDescriptionToggle hides the toggle when content fits collapsed height', async () => {
  const paragraphElement = new FakeElement({ lineHeight: '20px' });
  const textElement = new FakeElement({
    selectorMap: {
      p: paragraphElement
    },
    scrollHeight: 120
  });
  const buttonElement = new FakeElement();
  const contentElement = new FakeElement({
    selectorMap: {
      '[data-product-description-text]': textElement
    }
  });
  buttonElement.closest = () => contentElement;

  global.window = createWindowMock();
  global.document = {
    querySelectorAll: (selector) => (selector === '[data-product-description-toggle]' ? [buttonElement] : [])
  };

  const { initProductDescriptionToggle } = await loadModule();
  initProductDescriptionToggle();

  assert.equal(buttonElement.hidden, true);
  assert.equal(textElement.classList.contains('is-collapsed'), false);
  assert.equal(contentElement.classList.contains('is-expanded'), false);
});

test('initProductDescriptionToggle recalculates visibility when resized content starts fitting', async () => {
  const paragraphElement = new FakeElement({ lineHeight: '20px' });
  const textElement = new FakeElement({
    selectorMap: {
      p: paragraphElement
    },
    scrollHeight: 320
  });
  const buttonElement = new FakeElement();
  const contentElement = new FakeElement({
    selectorMap: {
      '[data-product-description-text]': textElement
    }
  });
  buttonElement.closest = () => contentElement;

  global.window = createWindowMock();
  global.document = {
    querySelectorAll: (selector) => (selector === '[data-product-description-toggle]' ? [buttonElement] : [])
  };

  const { initProductDescriptionToggle } = await loadModule();
  initProductDescriptionToggle();

  assert.equal(buttonElement.hidden, false);
  assert.equal(textElement.classList.contains('is-collapsed'), true);

  textElement.scrollHeight = 120;
  global.window.dispatch('resize');

  assert.equal(buttonElement.hidden, true);
  assert.equal(textElement.classList.contains('is-collapsed'), false);
  assert.equal(buttonElement.getAttribute('aria-expanded'), 'false');
  assert.equal(contentElement.classList.contains('is-expanded'), false);
});

test('initProductDescriptionToggle shows the toggle when resized content stops fitting', async () => {
  const paragraphElement = new FakeElement({ lineHeight: '20px' });
  const textElement = new FakeElement({
    selectorMap: {
      p: paragraphElement
    },
    scrollHeight: 120
  });
  const buttonElement = new FakeElement();
  const contentElement = new FakeElement({
    selectorMap: {
      '[data-product-description-text]': textElement
    }
  });
  buttonElement.closest = () => contentElement;

  global.window = createWindowMock();
  global.document = {
    querySelectorAll: (selector) => (selector === '[data-product-description-toggle]' ? [buttonElement] : [])
  };

  const { initProductDescriptionToggle } = await loadModule();
  initProductDescriptionToggle();

  assert.equal(buttonElement.hidden, true);
  assert.equal(textElement.classList.contains('is-collapsed'), false);

  textElement.scrollHeight = 320;
  global.window.dispatch('resize');

  assert.equal(buttonElement.hidden, false);
  assert.equal(textElement.classList.contains('is-collapsed'), true);
  assert.equal(buttonElement.textContent, 'Показать полностью');
  assert.equal(buttonElement.getAttribute('aria-expanded'), 'false');
});
