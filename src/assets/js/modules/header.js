const BODY_MENU_OPEN_CLASS = 'is-menu-open';
const BODY_SEARCH_OPEN_CLASS = 'is-search-open';
const MENU_OPEN_CLASS = 'is-open-menu';
const SEARCH_OPEN_CLASS = 'is-open-search';
const HEADER_MENU_OPEN_CLASS = 'header--menu-open';
const HEADER_SEARCH_OPEN_CLASS = 'header--search-open';
const ACTIVE_CLASS = 'active';
const FIXED_CLASS = 'header--fixed';
const VISIBLE_CLASS = 'header--visible';

const BREAKPOINT_DESKTOP = 900;
const BREAKPOINT_MOBILE_SEARCH = 480;

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function initHeader() {
  const header = document.querySelector('[data-header]');

  if (!header) {
    return;
  }

  const body = document.body;
  const main = document.querySelector('.main');
  const menuToggle = header.querySelector('[data-header-menu-toggle]');
  const searchToggles = document.querySelectorAll('[data-header-search-toggle]');
  const menuPanel = document.querySelector('[data-header-menu-panel]');
  const searchPanel = document.querySelector('[data-header-search-panel]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  let isBodyScrollLocked = false;
  let isHeaderFixed = false;
  let revealTimer = 0;
  let scrollFrame = 0;
  const headerOffsetVar = '--header-fixed-offset';

  if (!main || !menuPanel || !searchPanel) {
    console.warn('Header: отсутствуют обязательные элементы (.main, [data-header-menu-panel], [data-header-search-panel])');
    return;
  }

  const getHeaderHeight = () => Math.ceil(header.getBoundingClientRect().height);

  const setHeaderOffset = () => {
    main.style.setProperty(headerOffsetVar, `${getHeaderHeight()}px`);
  };

  const clearHeaderOffset = () => {
    main.style.removeProperty(headerOffsetVar);
  };

  const cancelHeaderReveal = () => {
    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = 0;
    }
  };

  const shouldKeepHeaderFixed = () =>
    body.classList.contains(BODY_MENU_OPEN_CLASS) ||
    body.classList.contains(BODY_SEARCH_OPEN_CLASS);

  const syncHeaderFixedState = (animateReveal = true) => {
    const headerHeight = getHeaderHeight();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const shouldFix = scrollY > headerHeight || shouldKeepHeaderFixed();
    const shouldUnfix = scrollY <= 0 && !shouldKeepHeaderFixed();

    if (shouldFix && !isHeaderFixed) {
      isHeaderFixed = true;
      cancelHeaderReveal();
      header.classList.add(FIXED_CLASS);
      setHeaderOffset();

      if (animateReveal) {
        revealTimer = window.setTimeout(() => {
          header.classList.add(VISIBLE_CLASS);
          revealTimer = 0;
        }, 60);
      } else {
        header.classList.add(VISIBLE_CLASS);
      }

      return;
    }

    if (shouldUnfix && isHeaderFixed) {
      isHeaderFixed = false;
      cancelHeaderReveal();
      header.classList.remove(VISIBLE_CLASS);
      header.classList.remove(FIXED_CLASS);
      clearHeaderOffset();
      return;
    }

    if (isHeaderFixed) {
      setHeaderOffset();
    }
  };

  const queueHeaderFixedSync = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      syncHeaderFixedState();
    });
  };

  const lockBodyScroll = () => {
    if (isBodyScrollLocked) {
      return;
    }

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.touchAction = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.touchAction = 'none';
    body.style.paddingRight = `${scrollbarWidth}px`;
    isBodyScrollLocked = true;
  };

  const unlockBodyScroll = () => {
    if (!isBodyScrollLocked) {
      return;
    }

    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    document.documentElement.style.touchAction = '';
    body.style.overflow = '';
    body.style.overscrollBehavior = '';
    body.style.touchAction = '';
    body.style.paddingRight = '';
    body.style.width = '';
    isBodyScrollLocked = false;
  };

  const shouldLockBodyScroll = () =>
    (window.innerWidth <= BREAKPOINT_DESKTOP && body.classList.contains(BODY_MENU_OPEN_CLASS)) ||
    (window.innerWidth <= BREAKPOINT_MOBILE_SEARCH && body.classList.contains(BODY_SEARCH_OPEN_CLASS));

  const syncBodyScrollLock = () => {
    if (shouldLockBodyScroll()) {
      lockBodyScroll();
      return;
    }

    unlockBodyScroll();
  };

  const closeMenu = ({ syncScrollLock = true, syncHeaderState = true } = {}) => {
    body.classList.remove(BODY_MENU_OPEN_CLASS);
    main.classList.remove(MENU_OPEN_CLASS);
    header.classList.remove(HEADER_MENU_OPEN_CLASS);
    menuPanel.classList.remove(ACTIVE_CLASS);
    menuPanel.setAttribute('aria-hidden', 'true');

    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Открыть меню');
      menuToggle.classList.remove(ACTIVE_CLASS);
    }

    if (mobileMenu) {
      mobileMenu.classList.remove(MENU_OPEN_CLASS);
    }

    if (syncScrollLock) {
      syncBodyScrollLock();
    }

    if (syncHeaderState) {
      syncHeaderFixedState(false);
    }
  };

  const openMenu = () => {
    closeSearch({ syncScrollLock: false, syncHeaderState: false });
    body.classList.add(BODY_MENU_OPEN_CLASS);
    main.classList.add(MENU_OPEN_CLASS);
    header.classList.add(HEADER_MENU_OPEN_CLASS);
    menuPanel.classList.add(ACTIVE_CLASS);
    menuPanel.setAttribute('aria-hidden', 'false');

    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Закрыть меню');
      menuToggle.classList.add(ACTIVE_CLASS);
    }

    if (mobileMenu) {
      mobileMenu.classList.add(MENU_OPEN_CLASS);
    }

    syncBodyScrollLock();
    syncHeaderFixedState(false);
  };

  const closeSearch = ({ syncScrollLock = true, syncHeaderState = true } = {}) => {
    body.classList.remove(BODY_SEARCH_OPEN_CLASS);
    main.classList.remove(SEARCH_OPEN_CLASS);
    header.classList.remove(HEADER_SEARCH_OPEN_CLASS);

    searchToggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть поиск');
    });

    searchPanel.classList.remove(ACTIVE_CLASS);

    if (mobileMenu) {
      mobileMenu.classList.remove(SEARCH_OPEN_CLASS);
    }

    if (syncScrollLock) {
      syncBodyScrollLock();
    }

    if (syncHeaderState) {
      syncHeaderFixedState(false);
    }
  };

  const openSearch = () => {
    closeMenu({ syncScrollLock: false, syncHeaderState: false });
    body.classList.add(BODY_SEARCH_OPEN_CLASS);
    main.classList.add(SEARCH_OPEN_CLASS);
    header.classList.add(HEADER_SEARCH_OPEN_CLASS);

    searchToggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Закрыть поиск');
    });

    searchPanel.classList.add(ACTIVE_CLASS);

    if (mobileMenu) {
      mobileMenu.classList.add(SEARCH_OPEN_CLASS);
    }

    syncBodyScrollLock();
    syncHeaderFixedState(false);
  };

  const handleMenuToggle = () => {
    if (!menuToggle) return;

    if (body.classList.contains(BODY_MENU_OPEN_CLASS)) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleSearchToggle = () => {
    if (body.classList.contains(BODY_SEARCH_OPEN_CLASS)) {
      closeSearch();
      return;
    }

    openSearch();
  };

  const handleKeydown = (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    closeMenu({ syncScrollLock: false });
    closeSearch({ syncScrollLock: false });
    syncBodyScrollLock();
  };

  const handleResize = debounce(() => {
    if (window.innerWidth > BREAKPOINT_DESKTOP) {
      closeMenu({ syncScrollLock: false });
      closeSearch({ syncScrollLock: false });
      syncBodyScrollLock();
    }

    syncHeaderFixedState(false);
  }, 150);

  const handleScroll = () => {
    if (shouldKeepHeaderFixed()) {
      return;
    }

    queueHeaderFixedSync();
  };

  // Слушатели
  menuToggle?.addEventListener('click', handleMenuToggle);

  searchToggles.forEach((toggle) => {
    toggle.addEventListener('click', handleSearchToggle);
  });

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  syncBodyScrollLock();
  syncHeaderFixedState(false);
}
