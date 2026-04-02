import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

const DESKTOP_MEDIA_QUERY = '(min-width: 921px)';
const SCENE_VARIABLES = {
  sceneHeight: '--showcase-scene-height',
  farWidth: '--showcase-far-width',
  sideWidth: '--showcase-side-width',
  activeWidth: '--showcase-active-width',
  farOffset: '--showcase-far-offset',
  sideOffset: '--showcase-side-offset',
  sideTop: '--showcase-side-top',
  farImageHeight: '--showcase-far-image-height',
  sideImageHeight: '--showcase-side-image-height',
  activeImageHeight: '--showcase-active-image-height'
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;

const parseSceneValue = (styles, variableName) => {
  return Number.parseFloat(styles.getPropertyValue(variableName)) || 0;
};

const getSceneMetrics = (sceneElement) => {
  const styles = window.getComputedStyle(sceneElement);

  return {
    sceneHeight: parseSceneValue(styles, SCENE_VARIABLES.sceneHeight),
    anchors: [
      {
        delta: -2,
        x: -parseSceneValue(styles, SCENE_VARIABLES.farOffset),
        y: 0,
        width: parseSceneValue(styles, SCENE_VARIABLES.farWidth),
        imageHeight: parseSceneValue(styles, SCENE_VARIABLES.farImageHeight),
        opacity: 0.58
      },
      {
        delta: -1,
        x: -parseSceneValue(styles, SCENE_VARIABLES.sideOffset),
        y: parseSceneValue(styles, SCENE_VARIABLES.sideTop),
        width: parseSceneValue(styles, SCENE_VARIABLES.sideWidth),
        imageHeight: parseSceneValue(styles, SCENE_VARIABLES.sideImageHeight),
        opacity: 0.86
      },
      {
        delta: 0,
        x: 0,
        y: 0,
        width: parseSceneValue(styles, SCENE_VARIABLES.activeWidth),
        imageHeight: parseSceneValue(styles, SCENE_VARIABLES.activeImageHeight),
        opacity: 1
      },
      {
        delta: 1,
        x: parseSceneValue(styles, SCENE_VARIABLES.sideOffset),
        y: parseSceneValue(styles, SCENE_VARIABLES.sideTop),
        width: parseSceneValue(styles, SCENE_VARIABLES.sideWidth),
        imageHeight: parseSceneValue(styles, SCENE_VARIABLES.sideImageHeight),
        opacity: 0.86
      },
      {
        delta: 2,
        x: parseSceneValue(styles, SCENE_VARIABLES.farOffset),
        y: 0,
        width: parseSceneValue(styles, SCENE_VARIABLES.farWidth),
        imageHeight: parseSceneValue(styles, SCENE_VARIABLES.farImageHeight),
        opacity: 0.58
      }
    ]
  };
};

const interpolateState = (delta, metrics) => {
  if (delta < -2 || delta > 2) {
    return null;
  }

  const anchors = metrics.anchors;

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];

    if (delta >= start.delta && delta <= end.delta) {
      const localProgress = (delta - start.delta) / (end.delta - start.delta);

      return {
        x: lerp(start.x, end.x, localProgress),
        y: lerp(start.y, end.y, localProgress),
        width: lerp(start.width, end.width, localProgress),
        imageHeight: lerp(start.imageHeight, end.imageHeight, localProgress),
        opacity: lerp(start.opacity, end.opacity, localProgress)
      };
    }
  }

  return anchors[anchors.length - 1];
};

const resetCardStyles = (cardElements) => {
  cardElements.forEach((cardElement) => {
    cardElement.style.removeProperty('--showcase-card-width');
    cardElement.style.removeProperty('--showcase-card-x');
    cardElement.style.removeProperty('--showcase-card-y');
    cardElement.style.removeProperty('--showcase-card-opacity');
    cardElement.style.removeProperty('--showcase-card-z-index');
    cardElement.style.removeProperty('--showcase-card-pointer-events');
    cardElement.style.removeProperty('--showcase-image-height');
  });
};

const setSceneTransitionDuration = (sceneElement, duration = 0) => {
  sceneElement.style.setProperty('--showcase-transition-duration', `${duration}ms`);
};

const renderScene = (cardElements, sceneElement, floatingIndex) => {
  const metrics = getSceneMetrics(sceneElement);

  cardElements.forEach((cardElement, index) => {
    const delta = index - floatingIndex;
    const state = interpolateState(delta, metrics);

    if (!state) {
      cardElement.style.setProperty('--showcase-card-opacity', '0');
      cardElement.style.setProperty('--showcase-card-pointer-events', 'none');
      cardElement.style.setProperty('--showcase-card-z-index', '0');
      return;
    }

    const distanceFromCenter = Math.abs(delta);
    const zIndex = distanceFromCenter < 0.5 ? 3 : distanceFromCenter < 1.5 ? 2 : 1;

    cardElement.style.setProperty('--showcase-card-width', `${state.width}px`);
    cardElement.style.setProperty('--showcase-card-x', `${state.x}px`);
    cardElement.style.setProperty('--showcase-card-y', `${state.y}px`);
    cardElement.style.setProperty('--showcase-card-opacity', state.opacity.toFixed(3));
    cardElement.style.setProperty('--showcase-card-z-index', `${zIndex}`);
    cardElement.style.setProperty('--showcase-card-pointer-events', state.opacity > 0.01 ? 'auto' : 'none');
    cardElement.style.setProperty('--showcase-image-height', `${state.imageHeight}px`);
  });
};

const syncSceneWithSwiper = (swiperInstance, cardElements, sceneElement) => {
  const maxIndex = cardElements.length - 1;
  const sliderWidth = swiperInstance.width || sceneElement.clientWidth || 1;
  const floatingIndex = clamp(-swiperInstance.translate / sliderWidth, 0, maxIndex);

  renderScene(cardElements, sceneElement, floatingIndex);
};

export const initShowcaseSlider = () => {
  const sliderElement = document.querySelector('[data-showcase-slider]');

  if (!sliderElement) {
    return;
  }

  const sceneElement = sliderElement.querySelector('[data-showcase-scene]');
  const trackElement = sliderElement.querySelector('[data-showcase-track]');
  const cardElements = Array.from(sliderElement.querySelectorAll('[data-showcase-card]'));
  const prevButton = document.querySelector('[data-showcase-prev]');
  const nextButton = document.querySelector('[data-showcase-next]');

  if (!sceneElement || !trackElement || cardElements.length === 0 || !prevButton || !nextButton) {
    return;
  }

  trackElement.innerHTML = cardElements.map(() => '<div class="showcase__ghost-slide swiper-slide"></div>').join('');

  let showcaseSwiper = null;
  const desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

  const handleCardClick = (event, index) => {
    event.preventDefault();

    if (!showcaseSwiper || !desktopMediaQuery.matches) {
      return;
    }

    if (showcaseSwiper.activeIndex !== index) {
      showcaseSwiper.slideTo(index);
    }
  };

  cardElements.forEach((cardElement, index) => {
    const cardLink = cardElement.querySelector('.showcase__card-link');

    if (cardLink) {
      cardLink.addEventListener('click', (event) => {
        handleCardClick(event, index);
      });
    }
  });

  const mountDesktopSlider = () => {
    if (showcaseSwiper) {
      return;
    }

    showcaseSwiper = new Swiper(sliderElement, {
      modules: [Navigation],
      initialSlide: Math.min(2, cardElements.length - 1),
      slidesPerView: 1,
      speed: 650,
      watchOverflow: true,
      watchSlidesProgress: true,
      allowTouchMove: true,
      threshold: 8,
      resistanceRatio: 0.82,
      navigation: {
        prevEl: prevButton,
        nextEl: nextButton
      },
      on: {
        init(swiperInstance) {
          setSceneTransitionDuration(sceneElement, 0);
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement);
        },
        setTransition(swiperInstance, duration) {
          setSceneTransitionDuration(sceneElement, duration);
        },
        setTranslate(swiperInstance) {
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement);
        },
        touchStart() {
          setSceneTransitionDuration(sceneElement, 0);
        },
        transitionEnd() {
          setSceneTransitionDuration(sceneElement, 0);
        },
        resize(swiperInstance) {
          setSceneTransitionDuration(sceneElement, 0);
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement);
        }
      }
    });
  };

  const unmountDesktopSlider = () => {
    if (!showcaseSwiper) {
      resetCardStyles(cardElements);
      return;
    }

    showcaseSwiper.destroy(true, true);
    showcaseSwiper = null;
    setSceneTransitionDuration(sceneElement, 0);
    resetCardStyles(cardElements);
  };

  const syncMode = () => {
    if (desktopMediaQuery.matches) {
      mountDesktopSlider();
      return;
    }

    unmountDesktopSlider();
  };

  syncMode();

  if (typeof desktopMediaQuery.addEventListener === 'function') {
    desktopMediaQuery.addEventListener('change', syncMode);
  } else {
    desktopMediaQuery.addListener(syncMode);
  }
};
