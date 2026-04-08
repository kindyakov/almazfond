import noUiSlider from 'nouislider';

const RANGE_INPUT_DEBOUNCE_MS = 250;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const onlyDigits = (value) => String(value ?? '').replace(/[^\d]/g, '');

const getCurrentSliderValues = (sliderElement) =>
  sliderElement.noUiSlider
    .get()
    .map((value) => Number.parseInt(String(value), 10))
    .map((value) => (Number.isFinite(value) ? value : 0));

const initRange = (rangeElement) => {
  const sliderElement = rangeElement.querySelector('[data-filter-range-slider]');
  const inputs = Array.from(rangeElement.querySelectorAll('[data-filter-range-input]'));

  if (!sliderElement || inputs.length !== 2 || sliderElement.noUiSlider) {
    return;
  }

  const min = toNumber(rangeElement.dataset.filterRangeMin, 0);
  const rawMax = toNumber(rangeElement.dataset.filterRangeMax, min + 1000);
  const max = Math.max(rawMax, min + 1);
  const step = Math.max(1, toNumber(rangeElement.dataset.filterRangeStep, 1));

  const startFromRaw = toNumber(rangeElement.dataset.filterRangeStartFrom, min);
  const startToRaw = toNumber(rangeElement.dataset.filterRangeStartTo, max);
  const startFrom = clamp(Math.min(startFromRaw, startToRaw), min, max);
  const startTo = clamp(Math.max(startFromRaw, startToRaw), min, max);

  const format = {
    to: (value) => `${Math.round(value)}`,
    from: (value) => Number(value)
  };

  noUiSlider.create(sliderElement, {
    start: [startFrom, startTo],
    connect: true,
    step,
    range: {
      min,
      max
    },
    tooltips: true,
    format
  });

  const [fromInput, toInput] = inputs;

  const syncInputs = (values) => {
    fromInput.value = values[0];
    toInput.value = values[1];
  };

  sliderElement.noUiSlider.on('update', (values) => {
    syncInputs(values);
  });

  const applyInputsToSlider = () => {
    const currentValues = getCurrentSliderValues(sliderElement);
    const nextFrom = clamp(
      onlyDigits(fromInput.value) ? toNumber(fromInput.value, currentValues[0]) : currentValues[0],
      min,
      max
    );
    const nextTo = clamp(
      onlyDigits(toInput.value) ? toNumber(toInput.value, currentValues[1]) : currentValues[1],
      min,
      max
    );

    sliderElement.noUiSlider.set([Math.min(nextFrom, nextTo), Math.max(nextFrom, nextTo)]);
  };

  let inputUpdateTimer = null;

  const scheduleSliderUpdate = () => {
    window.clearTimeout(inputUpdateTimer);
    inputUpdateTimer = window.setTimeout(applyInputsToSlider, RANGE_INPUT_DEBOUNCE_MS);
  };

  inputs.forEach((input) => {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('input', () => {
      input.value = onlyDigits(input.value);
      scheduleSliderUpdate();
    });

    input.addEventListener('blur', () => {
      window.clearTimeout(inputUpdateTimer);
      applyInputsToSlider();
    });
  });
};

export function initFilterRangeSlider() {
  const rangeElements = document.querySelectorAll('[data-filter-range]');

  if (!rangeElements.length) {
    return;
  }

  rangeElements.forEach(initRange);
}
