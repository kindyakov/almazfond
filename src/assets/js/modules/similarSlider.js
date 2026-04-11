import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export function initSimilarSlider() {
  const sliderElement = document.querySelector('.similar__slider');

  if (!sliderElement) {
    return;
  }

  new Swiper(sliderElement, {
    modules: [Navigation],
    spaceBetween: 24,
    slidesPerView: 4,
    watchOverflow: true,
    navigation: {
      prevEl: '.similar__button.prev',
      nextEl: '.similar__button.next'
    },
    breakpoints: {
      300: {
        spaceBetween: 16,
        slidesPerView: 1
      },
      520: {
        spaceBetween: 16,
        slidesPerView: 2
      },
      768: {
        spaceBetween: 20,
        slidesPerView: 3
      },
      1200: {
        spaceBetween: 24,
        slidesPerView: 4
      }
    }
  });
}
