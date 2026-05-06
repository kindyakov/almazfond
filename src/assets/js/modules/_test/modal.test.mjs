import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const loadModule = async () => {
  const modulePath = resolve('src/assets/js/modules/modal.js');
  const source = await readFile(modulePath, 'utf8');
  const instrumentedSource = source.replace(
    "import A11yDialog from 'a11y-dialog';",
    'class A11yDialog {}'
  );

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(instrumentedSource)}#${Date.now()}`);
};

test('getModalVariantContent returns the dedicated not-found variant', async () => {
  const { getModalVariantContent } = await loadModule();

  assert.deepEqual(getModalVariantContent('not-found'), {
    title: ['Поможем', 'найти нужное'],
    text: 'Оставьте заявку. <b>Подскажем по каталогу</b> и быстро сориентируем по подходящим изделиям.',
    submit: 'Получить помощь'
  });
});

test('getModalVariantContent falls back to the default variant for unknown keys', async () => {
  const { getModalVariantContent } = await loadModule();

  assert.deepEqual(getModalVariantContent('missing-variant'), {
    title: ['Профессиональная', 'помощь в выборе'],
    text: 'Оставьте заявку. <b>Консультация и подбор</b> под конкретный запрос.',
    submit: 'Подобрать изделие'
  });
});
