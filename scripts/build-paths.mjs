const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '');

export const normalizeBasePath = (value = process.env.BASE_PATH || '/') => {
  if (typeof value !== 'string') {
    return '/';
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue === '/') {
    return '/';
  }

  return `/${trimSlashes(trimmedValue)}/`;
};

export const withBasePath = (pathname, basePath = process.env.BASE_PATH || '/') => {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (typeof pathname !== 'string' || !pathname.startsWith('/')) {
    throw new Error(`Expected a root-relative pathname, received "${pathname}"`);
  }

  if (pathname === '/') {
    return normalizedBasePath;
  }

  if (normalizedBasePath === '/') {
    return pathname;
  }

  const normalizedPathname = pathname.slice(1);

  if (normalizedPathname.startsWith(normalizedBasePath.slice(1))) {
    return pathname;
  }

  return `${normalizedBasePath}${normalizedPathname}`;
};

export const getPublicUrl = (segment, basePath = process.env.BASE_PATH || '/') => {
  const normalizedSegment = trimSlashes(segment || '');

  if (!normalizedSegment) {
    return normalizeBasePath(basePath);
  }

  return withBasePath(`/${normalizedSegment}`, basePath);
};

export const stripBasePath = (pathname, basePath = process.env.BASE_PATH || '/') => {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === '/' || typeof pathname !== 'string') {
    return pathname;
  }

  if (pathname === normalizedBasePath.slice(0, -1)) {
    return '/';
  }

  return pathname.startsWith(normalizedBasePath)
    ? `/${pathname.slice(normalizedBasePath.length)}`
    : pathname;
};

export const applyBasePathToHtml = (
  source,
  { basePath = process.env.BASE_PATH || '/', cssFileName, jsFileName }
) => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const htmlWithBasePathMeta = source.includes('name="app-base-path"')
    ? source
    : source.replace(
        '</head>',
        `  <meta name="app-base-path" content="${normalizedBasePath}">\n</head>`
      );

  return htmlWithBasePathMeta
    .replaceAll('../assets/css/index.css', getPublicUrl(`css/${cssFileName}`, normalizedBasePath))
    .replaceAll('../assets/js/index.js', getPublicUrl(`js/${jsFileName}`, normalizedBasePath))
    .replaceAll('../assets/', getPublicUrl('assets', normalizedBasePath) + '/')
    .replace(
      /(href|src|poster)=("|')\/(?!\/)([^"']*)\2/g,
      (_, attributeName, quote, pathname) =>
        `${attributeName}=${quote}${withBasePath(`/${pathname}`, normalizedBasePath)}${quote}`
    );
};
