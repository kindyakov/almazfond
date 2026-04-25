const COLLAPSED_LABEL = 'Показать полностью';
const EXPANDED_LABEL = 'Скрыть';
const COLLAPSED_CLASS = 'is-collapsed';
const VISIBLE_LINES_COUNT = 7;

const getLineHeight = (paragraphElement) => {
  const computedStyles = window.getComputedStyle(paragraphElement);
  const lineHeight = Number.parseFloat(computedStyles.lineHeight);

  if (Number.isFinite(lineHeight)) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(computedStyles.fontSize);

  return Number.isFinite(fontSize) ? fontSize * 1.4 : 0;
};

const getCollapsedHeight = (paragraphElement) => Math.ceil(getLineHeight(paragraphElement) * VISIBLE_LINES_COUNT);

const syncDescriptionHeights = (textElement, paragraphElement) => {
  const collapsedHeight = getCollapsedHeight(paragraphElement);
  const expandedHeight = textElement.scrollHeight;

  textElement.style.setProperty('--product-description-collapsed-height', `${collapsedHeight}px`);
  textElement.style.setProperty('--product-description-expanded-height', `${expandedHeight}px`);

  return {
    collapsedHeight,
    expandedHeight
  };
};

const syncToggleAvailability = (contentElement, textElement, paragraphElement, buttonElement) => {
  const { collapsedHeight, expandedHeight } = syncDescriptionHeights(textElement, paragraphElement);
  const isToggleNeeded = expandedHeight > collapsedHeight;
  const isExpanded = contentElement.classList.contains('is-expanded');

  buttonElement.hidden = !isToggleNeeded;

  if (!isToggleNeeded) {
    setExpandedState(contentElement, textElement, buttonElement, false);
    textElement.classList.toggle(COLLAPSED_CLASS, false);
  } else if (!isExpanded) {
    setExpandedState(contentElement, textElement, buttonElement, false);
  }

  return isToggleNeeded;
};

const setExpandedState = (contentElement, textElement, buttonElement, isExpanded) => {
  contentElement.classList.toggle('is-expanded', isExpanded);
  textElement.classList.toggle(COLLAPSED_CLASS, !isExpanded);
  buttonElement.setAttribute('aria-expanded', String(isExpanded));
  buttonElement.textContent = isExpanded ? EXPANDED_LABEL : COLLAPSED_LABEL;
};

const initToggle = (buttonElement) => {
  const contentElement = buttonElement.closest('.product__description--content');
  const textElement = contentElement?.querySelector('[data-product-description-text]');
  const paragraphElement = textElement?.querySelector('p') ?? textElement;

  if (!contentElement || !textElement || !paragraphElement) {
    return;
  }

  syncToggleAvailability(contentElement, textElement, paragraphElement, buttonElement);

  buttonElement.addEventListener('click', () => {
    const isExpanded = contentElement.classList.contains('is-expanded');
    syncDescriptionHeights(textElement, paragraphElement);
    setExpandedState(contentElement, textElement, buttonElement, !isExpanded);
  });

  window.addEventListener('resize', () => {
    syncToggleAvailability(contentElement, textElement, paragraphElement, buttonElement);
  });
};

export function initProductDescriptionToggle() {
  const buttons = document.querySelectorAll('[data-product-description-toggle]');

  if (!buttons.length) {
    return;
  }

  buttons.forEach(initToggle);
}
