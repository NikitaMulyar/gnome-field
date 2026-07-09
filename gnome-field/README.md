# Подвалище

Vue/Vuetify-приложение игры `gnome-field`. Оно загружает карту, открывает клетки по правилам игры, считает шаги/стоимость, показывает журнал, цель и призовое видео.

## Запуск Через Docker

Из корня репозитория:

```bash
docker compose up --build
```

Адрес:

```text
http://127.0.0.1:3000/
```

## Запуск Без Docker

Из этой папки:

```bash
yarn install
yarn dev
```

Локальный адрес по умолчанию:

```text
http://127.0.0.1:3000/
```

Для проверки GitHub Pages base path:

```bash
VITE_BASE_PATH=/gnome-field/ yarn dev
```

Адрес будет `http://127.0.0.1:3000/gnome-field/`.

## Команды

```bash
yarn lint
yarn build
yarn preview
```

`yarn lint` запускает ESLint с автоисправлениями. После него полезно смотреть `git diff`.

## Base Path

`vite.config.mjs` читает:

```js
const base = process.env.VITE_BASE_PATH ?? "/";
```

Поэтому карта и призовое видео грузятся через `import.meta.env.BASE_URL`:

```js
Field.fromJSON(`${import.meta.env.BASE_URL}map.json`);
`${import.meta.env.BASE_URL}prize.mp4`;
```

Для Docker используется `/`, для GitHub Pages используется `/gnome-field/`.

## Карта И Ассеты

Игра грузит карту из `public/map.json`. Генерировать и редактировать карту удобнее в соседнем проекте `gnome-field-generator`.

Текущая тема карты: искусство, лагерь, математика/физика/информатика, подвал.

Основные файлы:

- `src/stores/app.js` - игровая модель и правила.
- `src/pages/index.vue` - общий layout карты и правой панели.
- `src/components/AnimatedMapLayer.vue` - текстуры открытой карты и фанерные стены.
- `src/components/ExplosionTile.vue` - взрыв банки краски и пятно.
- `src/components/StatsColumn.vue` - журнал и счетчики.
- `src/components/PrizeVideoPlayer.vue` - видео приза через `video.js`.
- `src/assets/map-tiles/art-camp/` - текстуры клеток.
- `src/assets/map.png` - generated preview текущей карты.

## Формат Карты

```json
{
  "width": 32,
  "height": 24,
  "portals": [
    {
      "entrance": [1, 2, 33, 34],
      "exit": [100, 101, 132, 133]
    }
  ],
  "tiles": [
    {
      "type": 0,
      "walls": [false, false, false, false]
    }
  ]
}
```

`tiles` - плоский массив длиной `width * height`, индекс клетки: `row * width + column`.

Порядок стен: `up`, `right`, `down`, `left`.

## Типы Клеток

| Код | Значение |
| --- | --- |
| `0` | вода |
| `1` | листочки |
| `2` | дверь в подвал |
| `3` | кирпичные стены |
| `4` | банка краски |
| `5` | картон |
| `6` | сканер |
| `7` | вход в вентиляцию |
| `8` | волшебная коробка |
| `9` | выход из вентиляции |

Особые правила:

- банка краски взрывается через 1 секунду после открытия, открывает область 3x3 и оставляет красное пятно;
- вода, сканер, вентиляции и волшебная коробка используют GIF-текстуры;
- сканер подсвечивает закрытые клетки в радиусе 3;
- вход/выход вентиляции работают через `portals` в `map.json`;
- после открытия волшебной коробки запускается таймер приза.

## Призовое Видео

Активное видео: `public/prize.mp4`.

Также в `public/` есть архивные варианты:

```text
prize-august-2024.mp4
prize-kroterra.mp4
prize-lmsh-2025.mp4
```

Чтобы заменить активное видео, проще всего заменить `public/prize.mp4`.

## Деплой На GitHub Pages

Основной способ деплоя описан в корневом файле [../GITHUB_PAGES.md](../GITHUB_PAGES.md).

GitHub Actions собирает приложение с `VITE_BASE_PATH=/gnome-field/`, добавляет `404.html` и публикует `dist` на Pages.
