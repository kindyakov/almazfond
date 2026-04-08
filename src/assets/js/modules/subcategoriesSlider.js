import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export function initSubcategoriesSlider() {
  const sliderElement = document.querySelector('[data-subcategories-slider]');

  if (!sliderElement) {
    return;
  }

  new Swiper(sliderElement, {
    modules: [Navigation],
    slidesPerView: 'auto',
    spaceBetween: 10,
    watchOverflow: true,
    navigation: {
      prevEl: '[data-subcategories-list-prev]',
      nextEl: '[data-subcategories-list-next]'
    },
    breakpoints: {
      768: {
        spaceBetween: 16
      },
      1200: {
        spaceBetween: 20
      }
    }
  });
}
