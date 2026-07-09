# GitHub Pages Deploy

Эта репа деплоит игру `Подвалище` как статический Vite-сайт на GitHub Pages.

## Что уже подготовлено

- workflow: `.github/workflows/deploy-pages.yml`;
- base path для Pages: `/gnome-field/`;
- SPA fallback: `dist/404.html`;
- локальный Docker-режим не изменен.

## Первичная настройка GitHub Pages

1. Открой репозиторий `NikitaMulyar/gnome-field` на GitHub.
2. Перейди в `Settings` -> `Pages`.
3. В `Build and deployment` выбери `Source: GitHub Actions`.
4. Сохрани настройки.
5. Запушь ветку `main`.
6. Открой вкладку `Actions` и дождись успешного workflow `Deploy GitHub Pages`.

После деплоя игра будет доступна по адресу:

```text
https://nikitamulyar.github.io/gnome-field/
```

## Ручной запуск проверки перед пушем

```bash
cd /Users/nikm/PycharmProjects/gnome-field/gnome-field
VITE_BASE_PATH=/gnome-field/ yarn build
cp dist/index.html dist/404.html
```

Для локального просмотра production build:

```bash
yarn preview --host 0.0.0.0
```

## Как обновлять карту на Pages

GitHub Pages не запускает Docker и backend. Игра на Pages просто берет уже закоммиченные файлы:

```text
gnome-field/public/map.json
gnome-field/src/assets/map.png
gnome-field/src/assets/map-tiles/art-camp/
```

Обычный рабочий процесс такой:

1. Открыть редактор локально через Docker в `gnome-field-generator`.
2. Нажать `sync to game`.
3. Проверить игру локально.
4. Закоммитить изменения в обеих репах.
5. Запушить `main`.

После пуша GitHub Actions сам пересоберет Pages.

## Почему не Docker на GitHub Pages

GitHub Pages умеет отдавать только статические файлы. Контейнеры, Python API и запись в соседний репозиторий там не работают. Для backend нужен отдельный хостинг: VPS, Render, Railway, Fly.io, Cloud Run или локальный Docker.
