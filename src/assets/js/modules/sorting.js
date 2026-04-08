export function initSorting() {
  const sortingContainers = document.querySelectorAll('[data-sorting]');

  if (!sortingContainers.length) {
    console.warn('[sorting] Не найдено ни одного [data-sorting] на странице');
    return;
  }

  // Глобальный API для внешнего JS
  window.sorting = window.sorting || {
    /**
     * Callback при изменении значения сортировщика
     * @type {function|null}
     */
    onSort: null,

    setValue(sortingId, value) {
      const container = document.querySelector(`[data-sorting="${sortingId}"]`);
      if (!container) {
        console.warn(`[sorting] Не найден сортировщик с id="${sortingId}"`);
        return;
      }

      const actionBtn = container.querySelector('[data-sorting-action]');
      const optionsContainer = container.querySelector('[data-sorting-options]');
      if (!actionBtn || !optionsContainer) {
        console.warn(`[sorting] Не найдены элементы в сортировщике id="${sortingId}"`);
        return;
      }

      const option = optionsContainer.querySelector(`[data-sorting-option-value="${value}"]`);
      if (!option) {
        const available = Array.from(optionsContainer.querySelectorAll('[data-sorting-option-value]'))
          .map((el) => el.getAttribute('data-sorting-option-value'));
        console.warn(`[sorting] Не найдено значение "${value}" в сортировщике id="${sortingId}". Доступные: [${available.join(', ')}]`);
        return;
      }

      const textEl = actionBtn.querySelector('[data-sorting-action-text]');
      if (textEl) {
        textEl.textContent = option.textContent.trim();
      }

      actionBtn.setAttribute('data-sorting-action-value', value);

      optionsContainer.querySelectorAll('[data-sorting-option]').forEach((opt) =>
        opt.classList.remove('selected')
      );
      option.classList.add('selected');

      if (typeof window.sorting.onSort === 'function') {
        window.sorting.onSort(sortingId, value);
      }
    },

    getValue(sortingId) {
      const container = document.querySelector(`[data-sorting="${sortingId}"]`);
      if (!container) {
        console.warn(`[sorting] Не найден сортировщик с id="${sortingId}"`);
        return null;
      }
      const actionBtn = container.querySelector('[data-sorting-action]');
      if (!actionBtn) {
        console.warn(`[sorting] Не найдена кнопка в сортировщике id="${sortingId}"`);
        return null;
      }
      return actionBtn.getAttribute('data-sorting-action-value');
    }
  };

  sortingContainers.forEach((container) => {
    const sortingId = container.getAttribute('data-sorting');
    const actionBtn = container.querySelector('[data-sorting-action]');
    const optionsContainer = container.querySelector('[data-sorting-options]');

    if (!actionBtn || !optionsContainer) {
      return;
    }

    const options = optionsContainer.querySelectorAll('[data-sorting-option]');

    // Клик по кнопке сортировки — открыть/закрыть
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(container, actionBtn, optionsContainer);
    });

    // Клик по опции — выбрать и закрыть
    options.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-sorting-option-value');
        selectOption(sortingId, container, actionBtn, optionsContainer, option, value);
      });
    });
  });

  // Закрытие при клике вне
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-sorting]')) {
      closeAllDropdowns();
    }
  });

  function selectOption(sortingId, container, actionBtn, optionsContainer, option, value) {
    const textEl = actionBtn.querySelector('[data-sorting-action-text]');

    if (textEl) {
      textEl.textContent = option.textContent.trim();
    }

    actionBtn.setAttribute('data-sorting-action-value', value);

    optionsContainer.querySelectorAll('[data-sorting-option]').forEach((opt) =>
      opt.classList.remove('selected')
    );
    option.classList.add('selected');

    closeDropdown(actionBtn, optionsContainer);

    if (typeof window.sorting.onSort === 'function') {
      window.sorting.onSort(sortingId, value);
    }
  }

  function toggleDropdown(container, actionBtn, optionsContainer) {
    const isOpen = optionsContainer.classList.contains('open');

    closeAllDropdowns();

    if (!isOpen) {
      openDropdown(actionBtn, optionsContainer);
    }
  }

  function openDropdown(actionBtn, optionsContainer) {
    actionBtn.classList.add('selected');
    optionsContainer.classList.add('open');
  }

  function closeDropdown(actionBtn, optionsContainer) {
    actionBtn.classList.remove('selected');
    optionsContainer.classList.remove('open');
  }

  function closeAllDropdowns() {
    document.querySelectorAll('[data-sorting]').forEach((container) => {
      const action = container.querySelector('[data-sorting-action]');
      const options = container.querySelector('[data-sorting-options]');
      if (action && options) {
        closeDropdown(action, options);
      }
    });
  }
}
