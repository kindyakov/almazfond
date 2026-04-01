import { useDynamicAdapt } from './modules/dynamicAdapt.js';
import { initHeader } from './modules/header.js';

document.addEventListener('DOMContentLoaded', () => {
  useDynamicAdapt();
  initHeader();
})

