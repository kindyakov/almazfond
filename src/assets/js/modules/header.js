const MENU_OPEN_CLASS = 'is-open-menu';
const SEARCH_OPEN_CLASS = 'is-open-search';

export function initHeader() {
  const header = document.querySelector('[data-header]');

  if (!header) {
    return;
  }

  const body = document.body;
  const main = document.querySelector('.main');
  const menuToggle = header.querySelector('[data-header-menu-toggle]');
  const menuPanel = document.querySelector('[data-header-menu-panel]');

  const closeMenu = () => {
    body.classList.remove(MENU_OPEN_CLASS);
    main.classList.remove(MENU_OPEN_CLASS);
    header.classList.remove('header--menu-open');
    menuPanel.classList.remove('active');
    menuPanel.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    menuToggle.classList.remove('active');
  };

  const openMenu = () => {
    closeSearch();
    body.classList.add(MENU_OPEN_CLASS);
    main.classList.add(MENU_OPEN_CLASS);
    header.classList.add('header--menu-open');
    menuPanel.classList.add('active');
    menuPanel.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Закрыть меню');
    menuToggle.classList.add('active');
  };

  const closeSearch = () => {
  };

  menuToggle?.addEventListener('click', () => {
    if (body.classList.contains(MENU_OPEN_CLASS)) {
      closeMenu();
      return;
    }

    openMenu();
  });


  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    closeMenu();
    closeSearch();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeMenu();
      closeSearch();
    }
  });
}
