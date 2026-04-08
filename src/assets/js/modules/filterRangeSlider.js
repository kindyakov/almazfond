import noUiSlider from 'nouislider';

const RANGE_INPUT_DEBOUNCE_MS = 250;
const numberFormatter = new Intl.NumberFormat('ru-RU');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatNumber = (value) =>
  numberFormatter.format(Math.trunc(Number(value) || 0)).replace(/\u00A0/g, ' ');

const parseFormattedNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const onlyDigits = (value) => String(value ?? '').replace(/[^\d]/g, '');

const getCurrentSliderValues = (sliderElement) => sliderElement.noUiSlider.get(true);

const renderInputValue = (input, value) => {
  const rawValue = String(Math.trunc(Number(value) || 0));
  input.dataset.filterRangeRawValue = rawValue;
  input.value = formatNumber(rawValue);
};

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
    to: (value) => formatNumber(value),
    from: (value) => parseFormattedNumber(value, 0)
  };

  noUiSlider.create(sliderElement, {
    start: [startFrom, startTo],
    connect: true,
    step,
    range: {
      min,
      max
    },
    format
  });

  const [fromInput, toInput] = inputs;
  let currentValues = [startFrom, startTo];

  const syncInputs = (values) => {
    currentValues = [values[0], values[1]];
    renderInputValue(fromInput, values[0]);
    renderInputValue(toInput, values[1]);
  };

  sliderElement.noUiSlider.on('update', (values) => {
    syncInputs(values.map((value) => parseFormattedNumber(value, 0)));
  });

  const applyInputsToSlider = () => {
    const sliderValues = getCurrentSliderValues(sliderElement);
    const fromValue = fromInput.dataset.filterRangeRawValue || onlyDigits(fromInput.value);
    const toValue = toInput.dataset.filterRangeRawValue || onlyDigits(toInput.value);

    const nextFrom = clamp(
      fromValue ? toNumber(fromValue, sliderValues[0]) : sliderValues[0],
      min,
      max
    );
    const nextTo = clamp(toValue ? toNumber(toValue, sliderValues[1]) : sliderValues[1], min, max);

    const normalizedFrom = Math.min(nextFrom, nextTo);
    const normalizedTo = Math.max(nextFrom, nextTo);

    if (normalizedFrom !== currentValues[0] || normalizedTo !== currentValues[1]) {
      sliderElement.noUiSlider.set([normalizedFrom, normalizedTo]);
    }
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
      const rawValue = onlyDigits(input.value);
      input.dataset.filterRangeRawValue = rawValue;
      input.value = rawValue ? formatNumber(rawValue) : '';
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
