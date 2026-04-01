const path = require('path');
const { Namer } = require('@parcel/plugin');

const COMMON_NAMES = new Set(['index', 'src', 'lib']);
const JS_EXTENSIONS = new Set(['js', 'mjs', 'cjs']);
const ASSET_TYPES = new Set([
  'avif',
  'bmp',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'tif',
  'tiff',
  'webp',
  'mp3',
  'mp4',
  'ogg',
  'wav',
  'webm',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'txt',
  'xml',
  'webmanifest'
]);

module.exports = new Namer({
  name({ bundle, bundleGraph, options }) {
    const bundleGroup = bundleGraph.getBundleGroupsContainingBundle(bundle)[0];
    if (!bundleGroup) {
      return null;
    }

    const bundleGroupBundles = bundleGraph.getBundlesInBundleGroup(bundleGroup, {
      includeInline: true
    });
    const mainBundle = bundleGroupBundles.find((candidate) =>
      candidate.getEntryAssets().some((asset) => asset.id === bundleGroup.entryAssetId)
    );

    if (!mainBundle) {
      return null;
    }

    const entryRoot = bundleGraph.getEntryRoot(bundle.target);
    const name = getBundleName({
      bundle,
      mainBundle,
      bundleGraph,
      bundleGroup,
      entryRoot,
      options
    });

    if (!name) {
      return null;
    }

    const extension = getBundleExtension(bundle);
    const folder = getOutputFolder(extension, bundle.target.distDir);

    return folder ? `${folder}/${name}.${extension}` : `${name}.${extension}`;
  }
});

function getBundleName({ bundle, mainBundle, bundleGraph, bundleGroup, entryRoot, options }) {
  const mainEntry = bundle.getMainEntry();
  if (mainEntry && !bundle.needsStableName) {
    const entryName = basenameWithoutExtension(mainEntry.filePath) || 'bundle';
    if (mainEntry.filePath.includes(`${path.sep}src${path.sep}assets${path.sep}`)) {
      if (options.mode === 'development') {
        return entryName.replace(/\\/g, '/');
      }

      return `${entryName.replace(/\\/g, '/')}.${bundle.hashReference}`;
    }

    return `${entryName.replace(/\\/g, '/')}.${bundle.hashReference}`;
  }

  const entryAsset = mainBundle
    .getEntryAssets()
    .find((asset) => asset.id === bundleGroup.entryAssetId);

  if (!entryAsset) {
    return null;
  }

  let entryFilePath = entryAsset.filePath;
  let name = basenameWithoutExtension(entryFilePath);

  if (shouldHashStableAssetBundle({ bundle, entryFilePath, options })) {
    return `${name || 'bundle'}.${bundle.hashReference}`;
  }

  if (bundle.needsStableName) {
    return path
      .join(path.relative(entryRoot, path.dirname(entryFilePath)), name)
      .replace(/\.\.(\/|\\)/g, 'up_$1')
      .replace(/\\/g, '/');
  }

  while (COMMON_NAMES.has(name)) {
    entryFilePath = path.dirname(entryFilePath);
    name = path.basename(entryFilePath);

    if (name.startsWith('.')) {
      name = name.slice(1);
    }
  }

  const safeName = (name || 'bundle').replace(/\\/g, '/');
  return `${safeName}.${bundle.hashReference}`;
}

function basenameWithoutExtension(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function shouldHashStableAssetBundle({ bundle, entryFilePath, options }) {
  if (options.mode !== 'production' || !bundle.needsStableName) {
    return false;
  }

  if (!entryFilePath.includes(`${path.sep}src${path.sep}assets${path.sep}`)) {
    return false;
  }

  return bundle.type === 'css' || JS_EXTENSIONS.has(bundle.type);
}

function getBundleExtension(bundle) {
  const entry = bundle.getMainEntry();
  if (entry && typeof entry.meta.bundleExtension === 'string') {
    return entry.meta.bundleExtension;
  }

  return bundle.type;
}

function getOutputFolder(extension, distDir) {
  const distLeaf = path.basename(distDir || '');

  if (extension === 'html') {
    return '';
  }

  if (extension === 'css') {
    if (distLeaf === 'css') {
      return '';
    }

    return 'css';
  }

  if (JS_EXTENSIONS.has(extension)) {
    if (distLeaf === 'js') {
      return '';
    }

    return 'js';
  }

  if (ASSET_TYPES.has(extension)) {
    if (distLeaf === 'css' || distLeaf === 'js') {
      return '../assets';
    }

    if (distLeaf === 'assets') {
      return '';
    }

    return 'assets';
  }

  return 'assets';
}
