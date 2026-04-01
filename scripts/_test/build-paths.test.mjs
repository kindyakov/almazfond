import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyBasePathToHtml,
  normalizeBasePath
} from '../build-paths.mjs';

test('normalizeBasePath preserves the root path for default hosting', () => {
  assert.equal(normalizeBasePath(), '/');
  assert.equal(normalizeBasePath('/'), '/');
});

test('normalizeBasePath normalizes GitHub Pages repository paths', () => {
  assert.equal(normalizeBasePath('him-trejding'), '/him-trejding/');
  assert.equal(normalizeBasePath('/him-trejding'), '/him-trejding/');
  assert.equal(normalizeBasePath('/him-trejding/'), '/him-trejding/');
});

test('applyBasePathToHtml keeps root-relative build output for the default host', () => {
  const source = `
    <head></head>
    <link rel="stylesheet" href="../assets/css/index.css">
    <script type="module" src="../assets/js/index.js"></script>
    <img src="../assets/images/logo.svg" alt="">
    <img src="/assets/images/logo.svg" alt="">
    <a href="/about.html">About</a>
    <a href="/#activity">Activity</a>
  `;

  const html = applyBasePathToHtml(source, {
    basePath: '/',
    cssFileName: 'index.css',
    jsFileName: 'index.js'
  });

  assert.match(html, /<meta name="app-base-path" content="\/">/);
  assert.doesNotMatch(html, /\.\.\/assets\//);
  assert.match(html, /href="\/css\/index\.css"/);
  assert.match(html, /src="\/js\/index\.js"/);
  assert.match(html, /src="\/assets\/images\/logo\.svg"/);
  assert.match(html, /href="\/about\.html"/);
  assert.match(html, /href="\/#activity"/);
});

test('applyBasePathToHtml rewrites assets and page links for GitHub Pages hosting', () => {
  const source = `
    <head></head>
    <link rel="stylesheet" href="../assets/css/index.css">
    <script type="module" src="../assets/js/index.js"></script>
    <img src="../assets/images/logo.svg" alt="">
    <img src="/assets/images/logo.svg" alt="">
    <a href="/about.html">About</a>
    <a href="/#activity">Activity</a>
    <a href="/">Home</a>
  `;

  const html = applyBasePathToHtml(source, {
    basePath: '/him-trejding/',
    cssFileName: 'index.hash.css',
    jsFileName: 'index.hash.js'
  });

  assert.match(html, /<meta name="app-base-path" content="\/him-trejding\/">/);
  assert.doesNotMatch(html, /\.\.\/assets\//);
  assert.match(html, /href="\/him-trejding\/css\/index\.hash\.css"/);
  assert.match(html, /src="\/him-trejding\/js\/index\.hash\.js"/);
  assert.match(html, /src="\/him-trejding\/assets\/images\/logo\.svg"/);
  assert.match(html, /href="\/him-trejding\/about\.html"/);
  assert.match(html, /href="\/him-trejding\/#activity"/);
  assert.match(html, /href="\/him-trejding\/"/);
});
