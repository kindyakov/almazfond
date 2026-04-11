import Swiper from 'swiper';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

export const initProductGallery = () => {
  const galleryElement = document.querySelector('[data-product-gallery]');

  if (!galleryElement) {
    return;
  }

  const mainElement = galleryElement.querySelector('[data-product-gallery-main]');
  const thumbsElement = galleryElement.querySelector('[data-product-gallery-thumbs]');
  const prevButton = galleryElement.querySelector('[data-product-gallery-prev]');
  const nextButton = galleryElement.querySelector('[data-product-gallery-next]');

  if (!mainElement || !thumbsElement || !prevButton || !nextButton) {
    return;
  }

  const thumbsSwiper = new Swiper(thumbsElement, {
    modules: [FreeMode, Thumbs],
    loop: true,
    speed: 600,
    freeMode: true,
    spaceBetween: 24,
    slidesPerView: 'auto',
    allowTouchMove: true,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
    breakpoints: {
      300: {
        spaceBetween: 12
      },
      560: {
        spaceBetween: 16
      },
      900: {
        spaceBetween: 24
      }
    }
  });

  const mainSwiper = new Swiper(mainElement, {
    modules: [Navigation, Thumbs],
    loop: true,
    speed: 700,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: prevButton,
      nextEl: nextButton
    },
    thumbs: {
      swiper: thumbsSwiper,
      autoScrollOffset: 1,
      multipleActiveThumbs: false,
      slideThumbActiveClass: 'is-active'
    }
  });

  thumbsElement.addEventListener('keydown', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    const slideElement = target.closest('.swiper-slide');
    const slideIndex = slideElement?.dataset.swiperSlideIndex;

    if (slideIndex === undefined) {
      return;
    }

    event.preventDefault();
    mainSwiper.slideToLoop(Number(slideIndex));
  });
};
