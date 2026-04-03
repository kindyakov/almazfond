import { useDynamicAdapt } from './modules/dynamicAdapt.js';
import { initHeader } from './modules/header.js';
import { initHitsSlider } from './modules/hits.js';
import { initFaq } from './modules/faq.js';
import { initAOS } from './modules/aos.js';
import { initForms } from './modules/forms.js';
import { initModal } from './modules/modal.js';
import { initShowcaseSlider } from './modules/showcase.js';

document.addEventListener('DOMContentLoaded', () => {
  useDynamicAdapt();
  initHeader();
  initShowcaseSlider();
  initHitsSlider();
  initFaq();
  initModal();
  initForms();
  initAOS();
});
