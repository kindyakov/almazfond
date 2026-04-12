const CONTACTS_MAP_SELECTOR = '[data-contacts-map]';
const YANDEX_MAPS_API_URL = 'https://api-maps.yandex.ru/v3/';
const YANDEX_MAPS_SCRIPT_ID = 'yandex-maps-api-v3';
const YANDEX_MAPS_DEFAULT_LANG = 'ru_RU';

const MAP_CONFIG = {
  gallery: {
    center: [37.647145, 55.710272],
    marker: [37.647145, 55.710272],
    zoom: 16,
  },
  production: {
    center: [59.710752, 60.568514],
    marker: [59.710752, 60.568514],
    zoom: 15,
  },
};

let mapsApiPromise;

const parseCoordinates = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const coordinates = value
    .split(',')
    .map((item) => Number.parseFloat(item.trim()))
    .filter((item) => Number.isFinite(item));

  return coordinates.length === 2 ? coordinates : fallback;
};

const resolveMapOptions = (mapElement) => {
  const preset = mapElement.id === 'contacts-production-map' ? MAP_CONFIG.production : MAP_CONFIG.gallery;

  return {
    center: parseCoordinates(mapElement.dataset.mapCenter, preset.center),
    marker: parseCoordinates(mapElement.dataset.mapMarker, preset.marker),
    zoom: Number.parseFloat(mapElement.dataset.mapZoom) || preset.zoom,
  };
};

const getApiKey = (mapElements) => {
  const scopedKey = mapElements.find((element) => element.dataset.mapApiKey)?.dataset.mapApiKey;
  const metaKey = document.querySelector('meta[name="yandex-maps-api-key"]')?.content;

  return scopedKey || window.YANDEX_MAPS_API_KEY || metaKey || '';
};

const loadYandexMapsApi = async (apiKey) => {
  if (window.ymaps3) {
    await window.ymaps3.ready;
    return window.ymaps3;
  }

  if (!apiKey) {
    throw new Error('YANDEX_MAPS_API_KEY_MISSING');
  }

  if (!mapsApiPromise) {
    mapsApiPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(YANDEX_MAPS_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.ymaps3), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('YANDEX_MAPS_API_LOAD_ERROR')), {
          once: true,
        });
        return;
      }

      const scriptElement = document.createElement('script');

      scriptElement.id = YANDEX_MAPS_SCRIPT_ID;
      scriptElement.src = `${YANDEX_MAPS_API_URL}?apikey=${encodeURIComponent(apiKey)}&lang=${YANDEX_MAPS_DEFAULT_LANG}`;
      scriptElement.async = true;
      scriptElement.onload = () => resolve(window.ymaps3);
      scriptElement.onerror = () => reject(new Error('YANDEX_MAPS_API_LOAD_ERROR'));

      document.head.append(scriptElement);
    });
  }

  const ymaps3 = await mapsApiPromise;

  await ymaps3.ready;

  return ymaps3;
};

const createMarkerElement = () => {
  const markerElement = document.createElement('div');

  markerElement.className = 'contacts__map-marker';

  return markerElement;
};

const createMapInstance = async (ymaps3, mapElement) => {
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
  const options = resolveMapOptions(mapElement);

  const map = new YMap(mapElement, {
    location: {
      center: options.center,
      zoom: options.zoom,
    },
    behaviors: ['drag', 'pinchZoom', 'mouseTilt', 'mouseRotate'],
  });

  map.addChild(new YMapDefaultSchemeLayer());
  map.addChild(new YMapDefaultFeaturesLayer());
  map.addChild(
    new YMapMarker(
      {
        coordinates: options.marker,
      },
      createMarkerElement()
    )
  );

  mapElement.classList.add('contacts__map--ready');

  return map;
};

export const initContactsMaps = async () => {
  const mapElements = Array.from(document.querySelectorAll(CONTACTS_MAP_SELECTOR));

  if (!mapElements.length) {
    return;
  }

  try {
    const ymaps3 = await loadYandexMapsApi(getApiKey(mapElements));

    await Promise.all(mapElements.map((mapElement) => createMapInstance(ymaps3, mapElement)));
  } catch (error) {
    if (error instanceof Error && error.message === 'YANDEX_MAPS_API_KEY_MISSING') {
      console.warn('Yandex Maps API key is missing. Add data-map-api-key or window.YANDEX_MAPS_API_KEY.');
      return;
    }

    console.error('Failed to initialize Yandex Maps.', error);
  }
};
