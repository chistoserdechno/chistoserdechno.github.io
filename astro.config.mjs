// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // TODO: заменить на итоговый домен — нужен для canonical и sitemap
  site: 'https://chistoserdechno.github.io',
  integrations: [react()],
  // Сайт собирается в статические файлы (dist/) — их можно положить на любой хостинг
  output: 'static',
});
