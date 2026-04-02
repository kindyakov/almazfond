import { useDynamicAdapt } from './modules/dynamicAdapt.js';
import { initHeader } from './modules/header.js';
import { initHitsSlider } from './modules/hits.js';
import { initFaq } from './modules/faq.js';
import { initForms } from './modules/forms.js';
import { initModal } from './modules/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  useDynamicAdapt();
  initHeader();
  initHitsSlider();
  initFaq();
  initModal();
  initForms();
});
