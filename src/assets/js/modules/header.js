const BODY_MENU_OPEN_CLASS = 'is-menu-open';
const BODY_SEARCH_OPEN_CLASS = 'is-search-open';
const MENU_OPEN_CLASS = 'is-open-menu';
const SEARCH_OPEN_CLASS = 'is-open-search';
const HEADER_MENU_OPEN_CLASS = 'header--menu-open';
const HEADER_SEARCH_OPEN_CLASS = 'header--search-open';
const ACTIVE_CLASS = 'active';

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
  let lockedScrollY = 0;
  let isBodyScrollLocked = false;

  if (!main || !menuPanel || !searchPanel) {
    console.warn('Header: отсутствуют обязательные элементы (.main, [data-header-menu-panel], [data-header-search-panel])');
    return;
  }

  const lockBodyScroll = () => {
    if (isBodyScrollLocked) {
      return;
    }

    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    body.style.position = 'fixed';
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    isBodyScrollLocked = true;
  };

  const unlockBodyScroll = () => {
    if (!isBodyScrollLocked) {
      return;
    }

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    window.scrollTo(0, lockedScrollY);
    lockedScrollY = 0;
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

  const closeMenu = ({ syncScrollLock = true } = {}) => {
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
  };

  const openMenu = () => {
    closeSearch({ syncScrollLock: false });
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
  };

  const closeSearch = ({ syncScrollLock = true } = {}) => {
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
  };

  const openSearch = () => {
    closeMenu({ syncScrollLock: false });
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
  }, 150);

  // Слушатели
  menuToggle?.addEventListener('click', handleMenuToggle);

  searchToggles.forEach((toggle) => {
    toggle.addEventListener('click', handleSearchToggle);
  });

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  syncBodyScrollLock();
}
