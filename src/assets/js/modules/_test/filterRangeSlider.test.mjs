import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

class FakeElement {
  constructor({ dataset = {}, selectorMap = {} } = {}) {
    this.dataset = { ...dataset };
    this.selectorMap = selectorMap;
    this.value = '';
    this.attributes = new Map();
    this.listeners = new Map();
    this.noUiSlider = null;
  }

  querySelector(selector) {
    return this.selectorMap[selector]?.[0] ?? null;
  }

  querySelectorAll(selector) {
    return this.selectorMap[selector] ?? [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }
}

const importModuleWithSliderStub = async () => {
  const modulePath = resolve('src/assets/js/modules/filterRangeSlider.js');
  const source = await readFile(modulePath, 'utf8');
  const instrumentedSource = source.replace(
    "import noUiSlider from 'nouislider';",
    `const noUiSlider = {
      create(sliderElement, config) {
        let currentValues = config.start;
        const handlers = new Map();

        sliderElement.noUiSlider = {
          get() {
            return currentValues;
          },
          set(nextValues) {
            currentValues = nextValues;
            handlers.get('update')?.(nextValues);
          },
          trigger(eventName, nextValues) {
            currentValues = nextValues;
            handlers.get(eventName)?.(nextValues);
          },
          on(eventName, handler) {
            handlers.set(eventName, handler);
            if (eventName === 'update') {
              handler(currentValues);
            }
          }
        };
      }
    };`
  );

  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(instrumentedSource)}#${Date.now()}`
  );
};

test('window.filterRangeSlider exposes getValue and setValue for initialized ranges', async () => {
  const sliderElement = new FakeElement();
  const fromInput = new FakeElement();
  const toInput = new FakeElement();
  const rangeElement = new FakeElement({
    dataset: {
      filterRange: 'price',
      filterRangeMin: '0',
      filterRangeMax: '100000',
      filterRangeStartFrom: '1000',
      filterRangeStartTo: '90000'
    },
    selectorMap: {
      '[data-filter-range-slider]': [sliderElement],
      '[data-filter-range-input]': [fromInput, toInput]
    }
  });

  global.window = {
    clearTimeout,
    setTimeout
  };
  global.document = {
    querySelector(selector) {
      return selector === '[data-filter-range="price"]' ? rangeElement : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-filter-range]' ? [rangeElement] : [];
    }
  };

  const { initFilterRangeSlider } = await importModuleWithSliderStub();
  initFilterRangeSlider();

  const changes = [];
  window.filterRangeSlider.onChange = (rangeId, value) => {
    changes.push({ rangeId, value });
  };

  assert.deepEqual(window.filterRangeSlider.getValue('price'), [1000, 90000]);

  window.filterRangeSlider.setValue('price', [2500, 75000]);

  assert.deepEqual(window.filterRangeSlider.getValue('price'), [2500, 75000]);
  assert.equal(fromInput.value, '2 500');
  assert.equal(toInput.value, '75 000');
  assert.deepEqual(changes, [{ rangeId: 'price', value: [2500, 75000] }]);
});

test('window.filterRangeSlider notifies on user slider changes', async () => {
  const sliderElement = new FakeElement();
  const fromInput = new FakeElement();
  const toInput = new FakeElement();
  const rangeElement = new FakeElement({
    dataset: {
      filterRange: 'price',
      filterRangeMin: '0',
      filterRangeMax: '100000',
      filterRangeStartFrom: '1000',
      filterRangeStartTo: '90000'
    },
    selectorMap: {
      '[data-filter-range-slider]': [sliderElement],
      '[data-filter-range-input]': [fromInput, toInput]
    }
  });

  global.window = {
    clearTimeout,
    setTimeout
  };
  global.document = {
    querySelector(selector) {
      return selector === '[data-filter-range="price"]' ? rangeElement : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-filter-range]' ? [rangeElement] : [];
    }
  };

  const { initFilterRangeSlider } = await importModuleWithSliderStub();
  initFilterRangeSlider();

  const changes = [];
  window.filterRangeSlider.onChange = (rangeId, value) => {
    changes.push({ rangeId, value });
  };

  sliderElement.noUiSlider.trigger('change', [5000, 45000]);

  assert.deepEqual(changes, [{ rangeId: 'price', value: [5000, 45000] }]);
});

test('window.filterRangeSlider rounds slider float values when syncing inputs', async () => {
  const sliderElement = new FakeElement();
  const fromInput = new FakeElement();
  const toInput = new FakeElement();
  const rangeElement = new FakeElement({
    dataset: {
      filterRange: 'price',
      filterRangeMin: '0',
      filterRangeMax: '1250000',
      filterRangeStartFrom: '21000',
      filterRangeStartTo: '1250000'
    },
    selectorMap: {
      '[data-filter-range-slider]': [sliderElement],
      '[data-filter-range-input]': [fromInput, toInput]
    }
  });

  global.window = {
    clearTimeout,
    setTimeout
  };
  global.document = {
    querySelector(selector) {
      return selector === '[data-filter-range="price"]' ? rangeElement : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-filter-range]' ? [rangeElement] : [];
    }
  };

  const { initFilterRangeSlider } = await importModuleWithSliderStub();
  initFilterRangeSlider();

  sliderElement.noUiSlider.trigger('update', [99999.99999999999, 1249999.9999999998]);

  assert.equal(fromInput.value, '100 000');
  assert.equal(toInput.value, '1 250 000');
  assert.equal(fromInput.dataset.filterRangeRawValue, '100000');
  assert.equal(toInput.dataset.filterRangeRawValue, '1250000');
});

test('window.filterRangeSlider getValue returns rounded raw slider values', async () => {
  const sliderElement = new FakeElement();
  const fromInput = new FakeElement();
  const toInput = new FakeElement();
  const rangeElement = new FakeElement({
    dataset: {
      filterRange: 'price',
      filterRangeMin: '0',
      filterRangeMax: '1250000',
      filterRangeStartFrom: '21000',
      filterRangeStartTo: '1250000'
    },
    selectorMap: {
      '[data-filter-range-slider]': [sliderElement],
      '[data-filter-range-input]': [fromInput, toInput]
    }
  });

  global.window = {
    clearTimeout,
    setTimeout
  };
  global.document = {
    querySelector(selector) {
      return selector === '[data-filter-range="price"]' ? rangeElement : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-filter-range]' ? [rangeElement] : [];
    }
  };

  const { initFilterRangeSlider } = await importModuleWithSliderStub();
  initFilterRangeSlider();

  sliderElement.noUiSlider.set([99999.99999999999, 1249999.9999999998]);

  assert.deepEqual(window.filterRangeSlider.getValue('price'), [100000, 1250000]);
});
