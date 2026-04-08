import { useDynamicAdapt } from './modules/dynamicAdapt.js';
import { initHeader } from './modules/header.js';
import { initHitsSlider } from './modules/hits.js';
import { initFaq } from './modules/faq.js';
import { initAOS } from './modules/aos.js';
import { initForms } from './modules/forms.js';
import { initModal } from './modules/modal.js';
import { initShowcaseSlider } from './modules/showcase.js';
import { initSorting } from './modules/sorting.js';
import { initSubcategoriesSlider } from './modules/subcategoriesSlider.js';
import { initFilterAccordions } from './modules/filterAccordions.js';
import { initFilterRangeSlider } from './modules/filterRangeSlider.js';
import { initAsideSticky } from './modules/asideSticky.js';

document.addEventListener('DOMContentLoaded', () => {
  useDynamicAdapt();
  initHeader();
  initShowcaseSlider();
  initHitsSlider();
  initFaq();
  initModal();
  initForms();
  initAOS();
  initSorting();
  initSubcategoriesSlider();
  initFilterAccordions();
  initFilterRangeSlider();
  initAsideSticky();
});
