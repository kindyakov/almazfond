import IMask from 'imask';
import JustValidate from 'just-validate';
import { hideModal, showModal } from './modal.js';

const REQUEST_ENDPOINT = '';
const SUCCESS_MODAL_ID = 'success-modal';
const PHONE_MASK = '+{7} (000) 000-00-00';

const submitRequest = async (formData) => {
  if (!REQUEST_ENDPOINT) {
    return Promise.resolve(formData);
  }

  return fetch(REQUEST_ENDPOINT, {
    method: 'POST',
    body: formData,
  });
};

export const initForms = () => {
  const forms = Array.from(document.querySelectorAll('[data-request-form]'));

  if (!forms.length) {
    return;
  }

  forms.forEach((form, index) => {
    const nameInput = form.querySelector('input[name="name"]');
    const phoneInput = form.querySelector('input[name="phone"]');
    const checkboxInput = form.querySelector('input[name="policy"]');
    const submitButton = form.querySelector('button[type="submit"]');

    if (!nameInput || !phoneInput || !checkboxInput || !submitButton) {
      return;
    }

    if (!nameInput.id) {
      nameInput.id = `request-name-${index + 1}`;
    }

    if (!phoneInput.id) {
      phoneInput.id = `request-phone-${index + 1}`;
    }

    const phoneMask = IMask(phoneInput, { mask: PHONE_MASK });

    const validator = new JustValidate(form, {
      errorFieldCssClass: 'is-error',
      errorLabelCssClass: 'form-error',
      focusInvalidField: true,
      validateBeforeSubmitting: true,
    });

    validator
      .addField(nameInput, [
        {
          rule: 'required',
          errorMessage: 'Введите имя',
        },
        {
          rule: 'minLength',
          value: 2,
          errorMessage: 'Минимум 2 символа',
        },
      ])
      .addField(phoneInput, [
        {
          validator: () => phoneMask.unmaskedValue.length === 11,
          errorMessage: 'Введите телефон полностью',
        },
      ])
      .addField(checkboxInput, [
        {
          rule: 'required',
        },
      ])
      .onSuccess(async (event) => {
        event?.preventDefault();

        submitButton.disabled = true;

        try {
          await submitRequest(new FormData(form));
          form.reset();
          phoneMask.value = '';

          const parentModal = form.closest('[data-modal-dialog]');

          if (parentModal?.id) {
            hideModal(parentModal.id);
            window.setTimeout(() => showModal(SUCCESS_MODAL_ID), 50);
            return;
          }

          showModal(SUCCESS_MODAL_ID);
        } finally {
          submitButton.disabled = false;
        }
      });
  });
};
