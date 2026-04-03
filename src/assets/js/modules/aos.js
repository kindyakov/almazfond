import AOS from 'aos';

const AOS_OPTIONS = {
  once: true,
  offset: 80,
  duration: 700,
  easing: 'ease-out-cubic',
  anchorPlacement: 'top-bottom',
};

export function initAOS() {
  AOS.init(AOS_OPTIONS);

  window.addEventListener(
    'load',
    () => {
      AOS.refreshHard();
    },
    { once: true },
  );
}
