import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export function initHitsSlider() {
  const sliderElement = document.querySelector('[data-hits-slider]');

  if (!sliderElement) {
    return;
  }

  new Swiper(sliderElement, {
    modules: [Navigation],
    spaceBetween: 10,
    slidesPerView: 1,
    watchOverflow: true,
    navigation: {
      prevEl: '[data-hits-prev]',
      nextEl: '[data-hits-next]'
    },
    breakpoints: {
      300: {
        spaceBetween: 10,
        slidesPerView: 1
      },
      480: {
        spaceBetween: 10,
        slidesPerView: 1.3
      },
      640: {
        spaceBetween: 10,
        slidesPerView: 1.8
      },
      768: {
        spaceBetween: 20,
        slidesPerView: 2.2
      },
      1200: {
        spaceBetween: 24,
        slidesPerView: 3
      }
    }
  });
}
