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
  const farWidth = parseSceneValue(styles, SCENE_VARIABLES.farWidth);
  const farOffset = parseSceneValue(styles, SCENE_VARIABLES.farOffset);
  const sceneWidth = sceneElement.clientWidth;
  const offscreenOffset = Math.max(sceneWidth / 2 + farWidth, farOffset + farWidth + 96);
  const sideOffset = parseSceneValue(styles, SCENE_VARIABLES.sideOffset);
  const sideTop = parseSceneValue(styles, SCENE_VARIABLES.sideTop);
  const sideWidth = parseSceneValue(styles, SCENE_VARIABLES.sideWidth);
  const activeWidth = parseSceneValue(styles, SCENE_VARIABLES.activeWidth);
  const farImageHeight = parseSceneValue(styles, SCENE_VARIABLES.farImageHeight);
  const sideImageHeight = parseSceneValue(styles, SCENE_VARIABLES.sideImageHeight);
  const activeImageHeight = parseSceneValue(styles, SCENE_VARIABLES.activeImageHeight);

  return {
    sceneHeight: parseSceneValue(styles, SCENE_VARIABLES.sceneHeight),
    anchors: [
      {
        delta: -3,
        x: -offscreenOffset,
        y: 0,
        width: farWidth,
        imageHeight: farImageHeight
      },
      {
        delta: -2,
        x: -farOffset,
        y: 0,
        width: farWidth,
        imageHeight: farImageHeight
      },
      {
        delta: -1,
        x: -sideOffset,
        y: sideTop,
        width: sideWidth,
        imageHeight: sideImageHeight
      },
      {
        delta: 0,
        x: 0,
        y: 0,
        width: activeWidth,
        imageHeight: activeImageHeight
      },
      {
        delta: 1,
        x: sideOffset,
        y: sideTop,
        width: sideWidth,
        imageHeight: sideImageHeight
      },
      {
        delta: 2,
        x: farOffset,
        y: 0,
        width: farWidth,
        imageHeight: farImageHeight
      },
      {
        delta: 3,
        x: offscreenOffset,
        y: 0,
        width: farWidth,
        imageHeight: farImageHeight
      }
    ]
  };
};

const interpolateState = (delta, metrics) => {
  if (delta < -3 || delta > 3) {
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
        imageHeight: lerp(start.imageHeight, end.imageHeight, localProgress)
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
    cardElement.style.setProperty('--showcase-card-opacity', '1');
    cardElement.style.setProperty('--showcase-card-z-index', `${zIndex}`);
    cardElement.style.setProperty('--showcase-card-pointer-events', 'auto');
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
  const dragState = {
    active: false,
    startX: 0,
    startProgress: 0,
    moved: false,
    suppressClickUntil: 0
  };

  const handleCardClick = (event, index) => {
    event.preventDefault();

    if (dragState.suppressClickUntil > performance.now()) {
      return;
    }

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
      cardLink.setAttribute('draggable', 'false');

      cardLink.addEventListener('click', (event) => {
        handleCardClick(event, index);
      });
    }
  });

  const finishDrag = () => {
    if (!dragState.active || !showcaseSwiper) {
      return;
    }

    dragState.active = false;

    if (dragState.moved) {
      dragState.suppressClickUntil = performance.now() + 250;
      const maxIndex = Math.max(cardElements.length - 1, 1);
      const targetIndex = clamp(Math.round(showcaseSwiper.progress * maxIndex), 0, maxIndex);
      showcaseSwiper.slideTo(targetIndex, showcaseSwiper.params.speed, true);
      return;
    }

    setSceneTransitionDuration(sceneElement, 0);
  };

  const handleDragMove = (clientX) => {
    if (!dragState.active || !showcaseSwiper) {
      return;
    }

    const maxIndex = Math.max(cardElements.length - 1, 1);
    const sliderWidth = showcaseSwiper.width || sceneElement.clientWidth || 1;
    const deltaX = clientX - dragState.startX;
    const nextProgress = clamp(dragState.startProgress - deltaX / (sliderWidth * maxIndex), 0, 1);

    if (Math.abs(deltaX) > 4) {
      dragState.moved = true;
    }

    showcaseSwiper.setProgress(nextProgress, 0);
    syncSceneWithSwiper(showcaseSwiper, cardElements, sceneElement);
  };

  sliderElement.addEventListener('dragstart', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('[data-showcase-scene]')) {
      event.preventDefault();
    }
  });

  document.addEventListener('mousedown', (event) => {
    const sceneRect = sceneElement.getBoundingClientRect();
    const isInsideScene =
      event.clientX >= sceneRect.left &&
      event.clientX <= sceneRect.right &&
      event.clientY >= sceneRect.top &&
      event.clientY <= sceneRect.bottom;

    if (
      !desktopMediaQuery.matches ||
      !showcaseSwiper ||
      event.button !== 0 ||
      !isInsideScene
    ) {
      return;
    }

    event.preventDefault();
    dragState.active = true;
    dragState.startX = event.clientX;
    dragState.startProgress = showcaseSwiper.progress;
    dragState.moved = false;
    setSceneTransitionDuration(sceneElement, 0);
  }, true);

  window.addEventListener('mousemove', (event) => {
    if (!dragState.active) {
      return;
    }

    handleDragMove(event.clientX);
  });

  window.addEventListener('mouseup', finishDrag);

  const mountDesktopSlider = () => {
    if (showcaseSwiper) {
      return;
    }

    showcaseSwiper = new Swiper(sliderElement, {
      modules: [Navigation],
      initialSlide: Math.min(2, cardElements.length - 1),
      slidesPerView: 1,
      speed: 650,
      grabCursor: true,
      watchOverflow: true,
      watchSlidesProgress: true,
      allowTouchMove: true,
      simulateTouch: true,
      touchEventsTarget: 'container',
      allowSlidePrev: true,
      allowSlideNext: true,
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
