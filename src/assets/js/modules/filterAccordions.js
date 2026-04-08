export function initFilterAccordions() {
  const accordActions = document.querySelectorAll('[data-filter-accord-action]');

  if (!accordActions.length) {
    return;
  }

  accordActions.forEach((action) => {
    action.addEventListener('click', () => {
      const accord = action.closest('[data-filter-accord]');
      const content = accord?.querySelector('[data-filter-accord-content]');

      if (!content) return;

      const isOpen = content.classList.contains('open');

      content.classList.toggle('open', !isOpen);
      action.classList.toggle('open', !isOpen);

      document.dispatchEvent(
        new CustomEvent('filter-accordions:toggle', {
          detail: {
            accord,
            content,
            action,
            isOpen: !isOpen
          }
        })
      );
    });
  });
}
