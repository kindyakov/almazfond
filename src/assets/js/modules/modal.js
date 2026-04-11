import A11yDialog from 'a11y-dialog';

const BODY_MODAL_OPEN_CLASS = 'is-modal-open';
const DEFAULT_VARIANT = 'selection';
const modalControllers = new Map();

const MODAL_VARIANTS = {
  selection: {
    title: ['Профессиональная', 'помощь в выборе'],
    text: 'Оставьте заявку. <b>Консультация и подбор</b> под конкретный запрос.',
    submit: 'Подобрать изделие',
  },
  consultation: {
    title: ['Уточнить', 'Наличие'],
    text: 'Все изделия уникальны, если именно такого нет - <b>предложим аналог.</b>',
    submit: 'Уточнить наличие',
  },
};

export const initModal = () => {
  const dialogElements = Array.from(document.querySelectorAll('[data-modal-dialog]'));

  if (!dialogElements.length) {
    return;
  }

  const updateBodyState = () => {
    const hasOpenModal = dialogElements.some(
      (dialogElement) => dialogElement.getAttribute('aria-hidden') !== 'true'
    );

    document.body.classList.toggle(BODY_MODAL_OPEN_CLASS, hasOpenModal);
  };

  dialogElements.forEach((dialogElement) => {
    const dialog = new A11yDialog(dialogElement);
    modalControllers.set(dialogElement.id, dialog);

    dialog.on('show', () => {
      updateBodyState();
    });

    dialog.on('hide', () => {
      updateBodyState();
    });
  });

  const helpModalElement = document.getElementById('help-modal');

  if (!helpModalElement) {
    return;
  }

  const titleLines = Array.from(helpModalElement.querySelectorAll('[data-modal-title-line]'));
  const textElement = helpModalElement.querySelector('[data-modal-text]');
  const submitElement = helpModalElement.querySelector('[data-modal-submit]');
  const triggerElements = document.querySelectorAll('[data-a11y-dialog-show="help-modal"]');

  const applyVariant = (variantName) => {
    const variant = MODAL_VARIANTS[variantName] || MODAL_VARIANTS[DEFAULT_VARIANT];

    titleLines.forEach((lineElement, index) => {
      lineElement.textContent = variant.title[index] || '';
    });

    if (textElement) {
      textElement.innerHTML = variant.text;
    }

    if (submitElement) {
      submitElement.textContent = variant.submit;
    }
  };

  applyVariant(DEFAULT_VARIANT);

  triggerElements.forEach((triggerElement) => {
    triggerElement.addEventListener('click', () => {
      applyVariant(triggerElement.dataset.modalVariant || DEFAULT_VARIANT);
    });
  });
};

export const showModal = (modalId) => {
  modalControllers.get(modalId)?.show();
};

export const hideModal = (modalId) => {
  modalControllers.get(modalId)?.hide();
};
