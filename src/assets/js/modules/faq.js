import Accordion from 'accordion-js';

export const initFaq = () => {
  const containers = Array.from(document.querySelectorAll('.accordion-container')).filter((container) =>
    container.querySelector('.ac')
  );

  if (!containers.length) {
    return;
  }

  new Accordion(containers, {
    duration: 400,
    showMultiple: false,
    onlyChildNodes: false,
  });
};
