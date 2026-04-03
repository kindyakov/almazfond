import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

const SLIDER_MEDIA_QUERY = '(min-width: 769px)';
const DESKTOP_SCENE_WIDTH = 920;
const SCENE_PROPORTIONS = {
  sceneHeight: 760 / 1320,
  activeWidth: 424 / 1320,
  sideWidth: 220 / 1320,
  farWidth: 184 / 1320,
  sideOffset: 346 / 1320,
  farOffset: 570 / 1320,
  sideTop: 168 / 760,
  activeImageHeight: 576 / 760,
  sideImageHeight: 300 / 760,
  farImageHeight: 240 / 760
};
const TABLET_SCENE_PROPORTIONS = {
  sceneHeight: 580 / DESKTOP_SCENE_WIDTH,
  activeWidth: 332 / DESKTOP_SCENE_WIDTH,
  sideWidth: 240 / DESKTOP_SCENE_WIDTH,
  sideOffset: 310 / DESKTOP_SCENE_WIDTH,
  sideTop: 128 / 580,
  activeImageHeight: 412 / 580,
  sideImageHeight: 240 / 580
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;
const measureCache = new Map();

const getModeCardGap = (isDesktopScene) => (isDesktopScene ? 20 : 14);

const getModeCacheKey = (sceneWidth, isDesktopScene) => {
  return `${Math.round(sceneWidth)}:${isDesktopScene ? 'desktop' : 'tablet'}`;
};

const measureContentHeight = (cardElement, width, measurerElement) => {
  const contentElement = cardElement.querySelector('.showcase__card-content');

  if (!contentElement) {
    return 0;
  }

  const cacheKey = `${Math.round(width)}:${contentElement.textContent?.trim() || ''}`;

  if (measureCache.has(cacheKey)) {
    return measureCache.get(cacheKey);
  }

  measurerElement.style.width = `${width}px`;
  measurerElement.innerHTML = contentElement.outerHTML;
  const height = Math.ceil(measurerElement.getBoundingClientRect().height);

  measureCache.set(cacheKey, height);

  return height;
};

const updateSliderMetrics = (sliderElement, metrics) => {
  const showcaseContainer = sliderElement.closest('.showcase__container');

  sliderElement.style.setProperty('--showcase-scene-height', `${metrics.sceneHeight}px`);

  if (showcaseContainer) {
    showcaseContainer.style.setProperty('--showcase-active-width', `${metrics.activeWidth}px`);
  }
};

const resetSliderMetrics = (sliderElement) => {
  const showcaseContainer = sliderElement.closest('.showcase__container');

  sliderElement.style.removeProperty('--showcase-scene-height');

  if (showcaseContainer) {
    showcaseContainer.style.removeProperty('--showcase-active-width');
  }
};

const getSceneMetrics = (sceneElement, sliderElement, cardElements, measurerElement) => {
  const sceneWidth = sceneElement.clientWidth || sliderElement.clientWidth || 1320;
  const isDesktopScene = sceneWidth > DESKTOP_SCENE_WIDTH;
  const modeCacheKey = getModeCacheKey(sceneWidth, isDesktopScene);

  if (sliderElement.dataset.showcaseMetricsKey === modeCacheKey) {
    return sliderElement.__showcaseMetrics;
  }

  const proportions = isDesktopScene ? SCENE_PROPORTIONS : TABLET_SCENE_PROPORTIONS;
  const activeWidth = sceneWidth * proportions.activeWidth;
  const sideWidth = sceneWidth * proportions.sideWidth;
  const sideOffset = sceneWidth * proportions.sideOffset;
  const baseSceneHeight = sceneWidth * proportions.sceneHeight;
  const sideTop = baseSceneHeight * proportions.sideTop;
  const activeImageHeight = baseSceneHeight * proportions.activeImageHeight;
  const sideImageHeight = baseSceneHeight * proportions.sideImageHeight;
  const farWidth = isDesktopScene ? sceneWidth * SCENE_PROPORTIONS.farWidth : sideWidth;
  const farOffset = isDesktopScene ? sceneWidth * SCENE_PROPORTIONS.farOffset : sideOffset;
  const farImageHeight = isDesktopScene ? baseSceneHeight * SCENE_PROPORTIONS.farImageHeight : sideImageHeight;
  const cardGap = getModeCardGap(isDesktopScene);
  const activeContentHeight = Math.max(...cardElements.map((cardElement) => measureContentHeight(cardElement, activeWidth, measurerElement)));
  const sideContentHeight = Math.max(...cardElements.map((cardElement) => measureContentHeight(cardElement, sideWidth, measurerElement)));
  const farContentHeight = isDesktopScene
    ? Math.max(...cardElements.map((cardElement) => measureContentHeight(cardElement, farWidth, measurerElement)))
    : sideContentHeight;
  const sceneHeight = Math.max(
    activeImageHeight + cardGap + activeContentHeight,
    sideTop + sideImageHeight + cardGap + sideContentHeight,
    farImageHeight + cardGap + farContentHeight
  );
  const offscreenOffset = Math.max(sceneWidth / 2 + farWidth, farOffset + farWidth + 96);
  const metrics = {
    sceneHeight,
    activeWidth,
    anchors: isDesktopScene
      ? [
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
      : [
        {
          delta: -2,
          x: -offscreenOffset,
          y: sideTop,
          width: sideWidth,
          imageHeight: sideImageHeight
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
          x: offscreenOffset,
          y: sideTop,
          width: sideWidth,
          imageHeight: sideImageHeight
        }
      ]
  };

  updateSliderMetrics(sliderElement, {
    sceneHeight,
    activeWidth
  });
  sliderElement.dataset.showcaseMetricsKey = modeCacheKey;
  sliderElement.__showcaseMetrics = metrics;

  return metrics;
};

const interpolateState = (delta, metrics) => {
  const minDelta = metrics.anchors[0].delta;
  const maxDelta = metrics.anchors[metrics.anchors.length - 1].delta;

  if (delta < minDelta || delta > maxDelta) {
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

const renderScene = (cardElements, sceneElement, sliderElement, floatingIndex, measurerElement) => {
  const metrics = getSceneMetrics(sceneElement, sliderElement, cardElements, measurerElement);

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

const syncSceneWithSwiper = (swiperInstance, cardElements, sceneElement, sliderElement, measurerElement) => {
  const maxIndex = cardElements.length - 1;
  const sliderWidth = swiperInstance.width || sceneElement.clientWidth || 1;
  const floatingIndex = clamp(-swiperInstance.translate / sliderWidth, 0, maxIndex);

  renderScene(cardElements, sceneElement, sliderElement, floatingIndex, measurerElement);
};

export const initShowcaseSlider = () => {
  const sliderElement = document.querySelector('[data-showcase-slider]');

  if (!sliderElement) {
    return;
  }

  const sceneElement = sliderElement.querySelector('[data-showcase-scene]');
  const trackElement = sliderElement.querySelector('[data-showcase-track]');
  const cardElements = Array.from(sliderElement.querySelectorAll('[data-showcase-card]'));
  const measurerElement = document.createElement('div');
  const prevButton = document.querySelector('[data-showcase-prev]');
  const nextButton = document.querySelector('[data-showcase-next]');

  if (!sceneElement || !trackElement || cardElements.length === 0 || !prevButton || !nextButton) {
    return;
  }

  measurerElement.className = 'showcase__measure';
  sliderElement.append(measurerElement);
  trackElement.innerHTML = cardElements.map(() => '<div class="showcase__ghost-slide swiper-slide"></div>').join('');

  let showcaseSwiper = null;
  const sliderMediaQuery = window.matchMedia(SLIDER_MEDIA_QUERY);
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

    if (!showcaseSwiper || !sliderMediaQuery.matches) {
      return;
    }

    if (showcaseSwiper.activeIndex !== index) {
      showcaseSwiper.slideTo(index);
    }
  };

  cardElements.forEach((cardElement, index) => {
    const cardLink = cardElement.querySelector('.showcase__card-inner');

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
    syncSceneWithSwiper(showcaseSwiper, cardElements, sceneElement, sliderElement, measurerElement);
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
      !sliderMediaQuery.matches ||
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
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement, sliderElement, measurerElement);
        },
        setTransition(swiperInstance, duration) {
          setSceneTransitionDuration(sceneElement, duration);
        },
        setTranslate(swiperInstance) {
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement, sliderElement, measurerElement);
        },
        touchStart() {
          setSceneTransitionDuration(sceneElement, 0);
        },
        transitionEnd() {
          setSceneTransitionDuration(sceneElement, 0);
        },
        resize(swiperInstance) {
          sliderElement.dataset.showcaseMetricsKey = '';
          measureCache.clear();
          setSceneTransitionDuration(sceneElement, 0);
          syncSceneWithSwiper(swiperInstance, cardElements, sceneElement, sliderElement, measurerElement);
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
    sliderElement.dataset.showcaseMetricsKey = '';
    delete sliderElement.__showcaseMetrics;
    resetSliderMetrics(sliderElement);
    resetCardStyles(cardElements);
  };

  const syncMode = () => {
    if (sliderMediaQuery.matches) {
      mountDesktopSlider();
      return;
    }

    unmountDesktopSlider();
  };

  syncMode();

  if (typeof sliderMediaQuery.addEventListener === 'function') {
    sliderMediaQuery.addEventListener('change', syncMode);
  } else {
    sliderMediaQuery.addListener(syncMode);
  }
};
