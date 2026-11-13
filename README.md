# Чистосердечно — сайт

Лендинг семейной службы уборки. **Astro 7** + **React 19** (острова) + **TypeScript**.
Собирается в статические файлы, заявки уходят в Telegram через Yandex Cloud Function.

## Запуск

```bash
npm install
npm run dev       # http://localhost:4321 — разработка с автообновлением
npm test          # тесты расчёта цены и формы
npm run build     # проверка типов + сборка в dist/
npm run preview   # посмотреть собранный сайт
```

## Где что лежит

```
src/
  pages/
    index.astro          ← главная: просто порядок секций
    privacy.astro        ← политика конфиденциальности (шаблон!)
  layouts/Layout.astro   ← <head>, шрифты, общие скрипты
  components/
    Hero.astro, Services.astro, Prices.astro, … ← секции (HTML при сборке)
    islands/
      Calculator.tsx     ← React-остров: калькулятор
      BookingForm.tsx    ← React-остров: форма заявки
    ui/                  ← Icon, Logo, SectionHead
  data/                  ← ВЕСЬ КОНТЕНТ — правится здесь
    prices.ts            ← прайс, допуслуги, скидки (калькулятор и прайс строятся отсюда)
    content.ts           ← тексты, команда, ценности, сертификаты, примеры работ, отзывы
    site.ts              ← телефон, ссылки, реквизиты
  lib/
    pricing.ts (+ test)  ← расчёт стоимости по правилам из брифа
    lead.ts (+ test)     ← маска телефона и проверка заявки
    events.ts            ← связь «выбрали услугу» → форма
  styles/
    base.css             ← токены бренда, кнопки, общие классы
    sections/*.css       ← стили каждой секции
functions/lead/          ← функция приёма заявок (Yandex Cloud Functions)
public/                  ← favicon, robots.txt, сюда же — свои фото (public/img/…)
```

### Как это работает

- `.astro`-файлы выполняются **при сборке**: в браузер уходит готовый HTML без JS.
- Интерактив — только в `islands/*.tsx`. Они подключаются с `client:visible`: React загружается, когда блок появляется на экране.
- Острова не делят состояние. Карточка услуги, сертификат или калькулятор вызывают `selectService()` из `lib/events.ts`, а форма подставляет услугу.

### Частые правки

| Что | Где |
|---|---|
| Цена, тип квартиры, лимит площади | `src/data/prices.ts` → `SERVICES` |
| Допуслуга в калькуляторе | `src/data/prices.ts` → `EXTRAS` |
| Текст карточки услуги, фото | `src/data/content.ts` → `SERVICE_CARDS` |
| Команда | `src/data/content.ts` → `TEAM` |
| Отзыв / пример «до/после» | `src/data/content.ts` → `REVIEWS` / `WORKS` (секции появятся сами) |
| Телефон, мессенджеры, ИНН | `src/data/site.ts` |
| Цвета бренда | `src/styles/base.css` → `:root` |

Свои фото: положите в `public/img/` и укажите путь `'/img/esenia.jpg'` вместо `unsplash(...)`.

## Заявки → Telegram

1. **Бот.** В Telegram: @BotFather → `/newbot` → сохранить токен. Создать общий чат, добавить бота, узнать `chat_id` (например, через @getidsbot или `https://api.telegram.org/bot<TOKEN>/getUpdates` после сообщения в чате).
2. **Функция.** Yandex Cloud → Cloud Functions → создать функцию → среда **Node.js 22** → загрузить файлы из `functions/lead/` → точка входа `index.handler` → переменные окружения `BOT_TOKEN`, `CHAT_ID`, `ALLOWED_ORIGIN=https://<ваш домен>`.
3. Сделать функцию **публичной** и скопировать её адрес.
4. В корне проекта создать `.env`:
   ```
   PUBLIC_LEAD_ENDPOINT=https://functions.yandexcloud.net/<id функции>
   ```
   и пересобрать сайт. Пока переменная пустая, форма работает в **демо-режиме** (показывает «Заявка принята», но ничего не отправляет).

> **152-ФЗ.** Персональные данные граждан РФ при сборе должны записываться в базу на серверах в России. Отправка только в Telegram — серая зона. Надёжнее, чтобы функция сначала сохраняла заявку в Yandex Database (YDB) или Managed PostgreSQL, а уже потом слала уведомление в Telegram. Это следующий шаг, когда пойдут заявки.

## Выкладка (Yandex Object Storage)

1. `npm run build` → появится папка `dist/`.
2. Yandex Cloud → Object Storage → создать бакет с именем домена (например, `chistoserdechno.ru`), публичный доступ на чтение.
3. В настройках бакета → **Веб-сайт** → хостинг, главная страница `index.html`.
4. Загрузить **содержимое** `dist/` в корень бакета (через консоль или `yc storage s3 cp --recursive dist/ s3://<бакет>/`).
5. Домен: CNAME на бакет, HTTPS — через Certificate Manager (Let's Encrypt).

## Перед запуском (TODO)

- [ ] `site.ts`: ссылки Telegram, MAX, ВКонтакте, почта, **ФИО и ИНН**
- [ ] `privacy.astro`: заполнить [поля], проверить у юриста
- [ ] Свои фото команды вместо стоковых (`content.ts` → `TEAM`)
- [ ] Список допуслуг и цен (`prices.ts` → `EXTRAS`)
- [ ] Домен в `astro.config.mjs` → `site`
- [ ] Картинка-превью `public/og.jpg` 1200×630 + `og:image` в `Layout.astro`
- [ ] Яндекс Метрика (счётчик в `Layout.astro`, цель «отправлена заявка»)
- [ ] Функция заявок + `PUBLIC_LEAD_ENDPOINT`
- [ ] Яндекс Вебмастер: добавить сайт, проверить индексацию
