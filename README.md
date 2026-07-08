# gnome-field

Игровой фронтенд проекта "Подвалище": десктопная карта подвала, где живокрысик открывает клетки, проходит через вентиляцию, тратит рис и ищет волшебную коробку.

Рабочее Vue/Vuetify-приложение лежит в подпапке `gnome-field/`.

## Структура

```text
gnome-field/
  docker-compose.yml
  README.md
  gnome-field/
    Dockerfile
    public/
    src/
    package.json
```

Основная документация по приложению: [gnome-field/README.md](gnome-field/README.md).

## Запуск Через Docker

```bash
docker compose up --build
```

Адрес:

```text
http://127.0.0.1:3000/
```

Docker передает `VITE_BASE_PATH=/`, поэтому приложение открывается из корня.

## Запуск Без Docker

```bash
cd gnome-field
yarn install
yarn dev
```

Адрес по умолчанию:

```text
http://127.0.0.1:3000/
```

Если нужно проверить режим GitHub Pages:

```bash
VITE_BASE_PATH=/gnome-field/ yarn dev
```

Тогда адрес будет:

```text
http://127.0.0.1:3000/gnome-field/
```

Если порт занят:

```bash
yarn dev --port 3001
```

## Проверки

```bash
cd gnome-field
yarn lint
yarn build
```

`yarn build` может предупреждать о крупных Vite/Vuetify chunks. Это предупреждение, не ошибка сборки.

## Карта И Синхронизация

Игра использует два связанных файла:

- `gnome-field/public/map.json` - логика карты: типы клеток, стены, порталы.
- `gnome-field/src/assets/map.png` - preview-картинка той же карты.

В текущей версии карта также отрисовывает текстуры из `src/assets/map-tiles/art-camp/` через `AnimatedMapLayer.vue`.

Если обновлять карту из `gnome-field-generator`, важно синхронизировать JSON и preview. В соседнем репозитории есть sync tooling и генератор текстур.

## Где Что Лежит

- `gnome-field/public/map.json` - карта, которую игра загружает при старте.
- `gnome-field/src/stores/app.js` - правила открытия клеток, порталы, взрыв банки краски, таймеры.
- `gnome-field/src/components/AnimatedMapLayer.vue` - визуальный слой карты с текстурами.
- `gnome-field/src/components/TileGrid.vue` и `SingleTile.vue` - кликабельный слой закрытых/просканированных клеток.
- `gnome-field/src/components/StatsColumn.vue` - правая панель "Подвалище" и журнал живокрысика.
- `gnome-field/src/assets/map-tiles/art-camp/` - текущие текстуры карты.
- `gnome-field/src/assets/paint-explosion.gif` и `paint-stain.png` - эффект банки краски.

## Типы Клеток

| Код | Смысл |
| --- | --- |
| `0` | вода |
| `1` | разбросанные листочки |
| `2` | дверь в подвал |
| `3` | химические колбы |
| `4` | банка краски |
| `5` | картон |
| `6` | сканер |
| `7` | вход в вентиляцию |
| `8` | волшебная коробка |
| `9` | выход из вентиляции |

Стены карты отрисовываются как листы фанеры через `wall-up/right/down/left.png`.

## Анимации

В самой карте анимируются:

- вода: `water.gif`;
- сканер: `scanner.gif`;
- вход в вентиляцию: `vent-in.gif`;
- выход из вентиляции: `vent-out.gif`;
- волшебная коробка: `magic-box.gif`;
- взрыв банки краски: `paint-explosion.gif`.

После взрыва банка оставляет статичное красное пятно `paint-stain.png`.

## Деплой На GitHub Pages

Основной способ деплоя - GitHub Actions workflow:

```text
.github/workflows/deploy-pages.yml
```

Подробная инструкция: [GITHUB_PAGES.md](GITHUB_PAGES.md).

Сборка использует `VITE_BASE_PATH=/gnome-field/`, копирует `index.html` в `404.html` для SPA fallback и публикует `gnome-field/dist` через GitHub Pages Actions.
