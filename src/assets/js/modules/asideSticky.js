const DESKTOP_MEDIA_QUERY = '(min-width: 900px)';
const TOP_OFFSET = 10;
const instances = [];
let filterToggleListenerAttached = false;
let mobileToggleListenerAttached = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clearBodyStyles = (bodyElement) => {
  bodyElement.style.position = '';
  bodyElement.style.top = '';
  bodyElement.style.left = '';
  bodyElement.style.width = '';
  bodyElement.style.zIndex = '';
  bodyElement.style.bottom = '';
  bodyElement.style.boxSizing = '';
};

const resetInstance = (instance) => {
  instance.rafId = null;
  instance.mode = 'normal';
  instance.spacerElement.style.height = '0px';
  clearBodyStyles(instance.bodyElement);
};

const createSpacer = (bodyElement) => {
  const spacerElement = document.createElement('div');
  spacerElement.className = 'aside-filter__spacer';
  spacerElement.setAttribute('aria-hidden', 'true');
  bodyElement.before(spacerElement);
  return spacerElement;
};

const initMobileFilterToggle = (asideElement) => {
  if (mobileToggleListenerAttached) {
    return;
  }

  const toggleButton = document.querySelector('[data-btn-mobile-filter-toggle]');

  if (!toggleButton) {
    return;
  }

  toggleButton.addEventListener('click', () => {
    asideElement.classList.toggle('open');
  });

  mobileToggleListenerAttached = true;
};

const measure = (asideElement, bodyElement) => {
  const asideRect = asideElement.getBoundingClientRect();

  return {
    asideTop: window.scrollY + asideRect.top,
    asideHeight: asideElement.offsetHeight,
    bodyHeight: bodyElement.offsetHeight,
    asideLeft: asideRect.left,
    asideWidth: asideRect.width
  };
};

const applyNormalState = (bodyElement, spacerElement) => {
  clearBodyStyles(bodyElement);
  spacerElement.style.height = '0px';
};

const applyFixedState = (bodyElement, spacerElement, state, topOffset) => {
  spacerElement.style.height = `${state.bodyHeight}px`;
  bodyElement.style.position = 'fixed';
  bodyElement.style.top = `${topOffset}px`;
  bodyElement.style.left = `${state.asideLeft}px`;
  bodyElement.style.width = `${state.asideWidth}px`;
  bodyElement.style.zIndex = '20';
  bodyElement.style.boxSizing = 'border-box';
  bodyElement.style.bottom = '';
};

const applyBottomState = (bodyElement, spacerElement, state) => {
  spacerElement.style.height = `${state.bodyHeight}px`;
  bodyElement.style.position = 'absolute';
  bodyElement.style.top = `${clamp(state.asideHeight - state.bodyHeight, 0, state.asideHeight)}px`;
  bodyElement.style.left = '0';
  bodyElement.style.width = `${state.asideWidth}px`;
  bodyElement.style.zIndex = '20';
  bodyElement.style.boxSizing = 'border-box';
  bodyElement.style.bottom = '';
};

const syncAside = (instance) => {
  const { asideElement, bodyElement, spacerElement, desktopMedia } = instance;

  if (!desktopMedia.matches) {
    instance.mode = 'normal';
    applyNormalState(bodyElement, spacerElement);
    return;
  }

  const state = measure(asideElement, bodyElement);
  const scrollY = window.scrollY;
  const fixedStart = state.asideTop - TOP_OFFSET;
  const fixedEnd = state.asideTop + state.asideHeight - state.bodyHeight - TOP_OFFSET;

  if (scrollY < fixedStart) {
    instance.mode = 'normal';
    applyNormalState(bodyElement, spacerElement);
    return;
  }

  if (scrollY >= fixedEnd) {
    instance.mode = 'bottom';
    applyBottomState(bodyElement, spacerElement, state);
    return;
  }

  instance.mode = 'fixed';
  applyFixedState(bodyElement, spacerElement, state, TOP_OFFSET);
};

const scheduleSync = (instance) => {
  if (!instance.active || instance.rafId) return;

  instance.rafId = window.requestAnimationFrame(() => {
    instance.rafId = null;
    syncAside(instance);
  });
};

const onFilterAccordToggle = () => {
  instances.forEach((instance) => {
    if (instance.active) {
      scheduleSync(instance);
    }
  });
};

const activateInstance = (instance) => {
  if (instance.active) {
    scheduleSync(instance);
    return;
  }

  instance.active = true;
  window.addEventListener('scroll', instance.scrollHandler, { passive: true });
  window.addEventListener('resize', instance.resizeHandler);

  if (!filterToggleListenerAttached) {
    document.addEventListener('filter-accordions:toggle', onFilterAccordToggle);
    filterToggleListenerAttached = true;
  }

  if (typeof ResizeObserver !== 'undefined' && !instance.resizeObserver) {
    instance.resizeObserver = new ResizeObserver(() => {
      scheduleSync(instance);
    });
  }

  if (instance.resizeObserver) {
    instance.resizeObserver.observe(instance.bodyElement);
    instance.resizeObserver.observe(instance.asideElement);
  }

  scheduleSync(instance);
};

const deactivateInstance = (instance) => {
  if (!instance.active) {
    resetInstance(instance);
    return;
  }

  instance.active = false;
  window.removeEventListener('scroll', instance.scrollHandler);
  window.removeEventListener('resize', instance.resizeHandler);

  if (instance.resizeObserver) {
    instance.resizeObserver.unobserve(instance.bodyElement);
    instance.resizeObserver.unobserve(instance.asideElement);
    instance.resizeObserver.disconnect();
  }

  if (!instances.some((item) => item.active) && filterToggleListenerAttached) {
    document.removeEventListener('filter-accordions:toggle', onFilterAccordToggle);
    filterToggleListenerAttached = false;
  }

  resetInstance(instance);
};

const initInstance = (asideElement) => {
  const bodyElement = asideElement.querySelector('[data-aside-body]');

  if (!bodyElement) {
    return null;
  }

  const spacerElement = createSpacer(bodyElement);
  const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY);

  const instance = {
    asideElement,
    bodyElement,
    spacerElement,
    desktopMedia,
    mode: 'normal',
    rafId: null,
    resizeObserver: null,
    active: false,
    scrollHandler: null,
    resizeHandler: null,
    mediaHandler: null
  };

  instance.scrollHandler = () => scheduleSync(instance);
  instance.resizeHandler = () => scheduleSync(instance);
  instance.mediaHandler = () => {
    if (desktopMedia.matches) {
      activateInstance(instance);
    } else {
      deactivateInstance(instance);
    }
  };

  instances.push(instance);
  initMobileFilterToggle(asideElement);

  if (typeof desktopMedia.addEventListener === 'function') {
    desktopMedia.addEventListener('change', instance.mediaHandler);
  } else if (typeof desktopMedia.addListener === 'function') {
    desktopMedia.addListener(instance.mediaHandler);
  }

  if (desktopMedia.matches) {
    activateInstance(instance);
  } else {
    resetInstance(instance);
  }

  window.requestAnimationFrame(() => {
    syncAside(instance);
  });

  return instance;
};

export function initAsideSticky() {
  const asideElements = document.querySelectorAll('[data-aside]');

  if (!asideElements.length) {
    return;
  }

  asideElements.forEach((asideElement) => {
    initInstance(asideElement);
  });
}
