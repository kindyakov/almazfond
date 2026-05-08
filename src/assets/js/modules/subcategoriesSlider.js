import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export function initSubcategoriesSlider() {
  const sliderElement = document.querySelector('[data-subcategories-slider]');
  const progressTrackElement = document.querySelector('.subcategories__list--progres');
  const progressRunElement = progressTrackElement?.querySelector('.subcategories__list--progres-run');

  if (!sliderElement) {
    return;
  }

  const updateProgressIndicator = (swiper) => {
    if (!progressTrackElement || !progressRunElement) {
      return;
    }

    const trackWidth = progressTrackElement.clientWidth;
    const wrapperWidth = swiper.wrapperEl.scrollWidth;
    const sliderWidth = swiper.el.clientWidth;

    if (!trackWidth || !wrapperWidth || !sliderWidth || swiper.isLocked) {
      progressRunElement.style.width = '100%';
      return;
    }

    const visibleRatio = Math.min(sliderWidth / wrapperWidth, 1);
    const clampedProgress = Math.min(Math.max(swiper.progress, 0), 1);
    const fillRatio = Math.min(visibleRatio + (1 - visibleRatio) * clampedProgress, 1);

    progressRunElement.style.width = `${fillRatio * 100}%`;
  };

  new Swiper(sliderElement, {
    modules: [Navigation],
    spaceBetween: 10,
    watchOverflow: true,
    navigation: {
      prevEl: '[data-subcategories-list-prev]',
      nextEl: '[data-subcategories-list-next]'
    },
    on: {
      init(swiper) {
        updateProgressIndicator(swiper);
      },
      progress(swiper) {
        updateProgressIndicator(swiper);
      },
      resize(swiper) {
        updateProgressIndicator(swiper);
      },
      update(swiper) {
        updateProgressIndicator(swiper);
      }
    },
    breakpoints: {
      300: {
        spaceBetween: 16,
        slidesPerView: 1.6,
      },
      380: {
        spaceBetween: 16,
        slidesPerView: 2.2,
      },
      480: {
        spaceBetween: 16,
        slidesPerView: 2.6,
      },
      640: {
        spaceBetween: 16,
        slidesPerView: 3.2,
      },
      768: {
        spaceBetween: 16,
        slidesPerView: 4.2,
      },
      900: {
        slidesPerView: 'auto',
      },
      1200: {
        spaceBetween: 20,
        slidesPerView: 'auto',
      }
    }
  });
}
