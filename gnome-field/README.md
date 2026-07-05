# gnome-field app

Vue/Vuetify-приложение самой игры. Оно загружает карту, открывает клетки по правилам игры, считает шаги/стоимость, показывает журнал, цель и призовое видео.

## Запуск

```bash
yarn install
yarn dev
```

Локальный порт задан в `vite.config.mjs`:

```js
server: {
  port: 3000
},
base: process.env.VITE_BASE_PATH ?? "/"
```

Локальный адрес:

```text
http://localhost:3000/
```

Из корня `C:\NotGnomes` можно запустить игру и редактор вместе:

```powershell
.\start-local.ps1
```

## Команды

```bash
yarn dev      # dev-сервер Vite
yarn build    # production-сборка в dist/
yarn preview  # просмотр production-сборки
yarn lint     # ESLint с автоисправлениями
```

## Важные файлы

```text
public/map.json                  # логика текущей карты
public/test-map.json             # маленькая тестовая карта
public/prize.mp4                 # видео, которое показывается после цели
src/assets/map.png               # фоновая картинка текущей карты
src/assets/explosion.png         # картинка взрыва
src/stores/app.js                # основная модель игры и Pinia store
src/pages/index.vue              # главный экран
src/components/GameField.vue     # фон карты + сетка + взрывы
src/components/TileGrid.vue      # CSS-grid по размеру карты
src/components/SingleTile.vue    # интерактивная клетка
src/components/StatsColumn.vue   # счетчики и журнал
src/components/TargetDialog.vue  # окно при достижении цели
src/components/PrizeVideoPlayer.vue
```

## Как приложение стартует

`src/main.js` поднимает Vue-приложение и подключает плагины. Главная страница `src/pages/index.vue` собирает экран из двух частей:

- слева поле с рамкой, фоном `map.png` и кликабельной сеткой;
- справа колонка статистики и журнала.

Карта загружается в `src/stores/app.js`:

```js
this.field = await Field.fromJSON(`${import.meta.env.BASE_URL}map.json`);
```

`import.meta.env.BASE_URL` берется из Vite. Локально это `/`, а при деплое на GitHub Pages `deploy.sh` передает `/gnome-field/`.

## Модель карты

Карта приходит из `public/map.json`:

```json
{
  "width": 32,
  "height": 24,
  "portals": [],
  "tiles": [
    {
      "type": 0,
      "walls": [false, false, false, false]
    }
  ]
}
```

Правила индексации:

- `tiles` - плоский массив длиной `width * height`.
- `index = row * width + column`.
- `walls` хранит стены в порядке `[up, right, down, left]`.

## Типы клеток

Типы описаны в `TileTypes` внутри `src/stores/app.js`.

| Код | Константа | Поведение |
| --- | --- | --- |
| `0` | `Water` | открывается волной вместе с соседней водой/песком |
| `1` | `Stone` | обычная клетка |
| `2` | `Entrance` | стартовая клетка, открывается при `initDrill()` |
| `3` | `Cliff` | особая клетка-препятствие |
| `4` | `Bomb` | при открытии вызывает взрыв 3x3 |
| `5` | `Sand` | участвует в волновом открытии, но может оставаться только раскрытой |
| `6` | `Mole` | помечает область 7x7 как просканированную |
| `7` | `PortalEntrance` | вход в портал |
| `8` | `Target` | цель игры |
| `9` | `PortalExit` | выход из портала |

## Видимость клеток

`TileVisibility` задает состояние клетки:

| Код | Константа | Что означает |
| --- | --- | --- |
| `1` | `Closed` | закрыта |
| `2` | `Scanned` | просканирована кротом/мышкой |
| `3` | `Revealed` | раскрыта частично |
| `4` | `Opened` | открыта полностью |

`SingleTile.vue` превращает эти состояния в прозрачность и цвет оверлея. Фоновая картинка поля всегда лежит под сеткой.

## Основные правила открытия

Главная функция - `Field.open(i, j)` в `src/stores/app.js`.

Клетку можно открыть, если рядом уже есть открытая проходимая клетка и между ними нет стены. Исключения и спецэффекты:

- `Entrance` открывается при запуске бура через `initDrill()`.
- `Water` и `Sand` запускают волновое открытие через `splashOpen()`.
- `Bomb` вызывает `handleExplosion()` и превращает область 3x3 в `Cliff`.
- `PortalEntrance` открывает связанный выход и может скрыть часть уже открытой области.
- `PortalExit` дооткрывает выходной 2x2-блок.
- `Mole` сканирует область 7x7 вокруг себя.
- `Target` запускает таймер до показа призового видео.

После каждого клика `tapTile(i, j)` пересчитывает доступность клеток, увеличивает счетчики и добавляет запись в журнал, если поле изменилось.

## Порталы

`public/map.json` хранит порталы так:

```json
{
  "entrance": [100, 101, 132, 133],
  "exit": [300, 301, 332, 333]
}
```

Обычно вход и выход - это 2x2-блоки. Редактор карт сам ищет такие блоки и сохраняет массив индексов.

## Призовое видео

`PrizeVideoPlayer.vue` использует `video.js` и грузит:

```js
`${import.meta.env.BASE_URL}prize.mp4`
```

Сейчас в `public/` лежит несколько видео:

```text
prize.mp4
prize-august-2024.mp4
prize-kroterra.mp4
prize-lmsh-2025.mp4
```

Чтобы заменить активное видео, проще всего заменить `public/prize.mp4` или поменять путь в `PrizeVideoPlayer.vue`.

## Связь с генератором

Игра не генерирует карту сама. Ей нужны готовые файлы:

- `public/map.json` - из `gnome-field-generator/map-editor`.
- `src/assets/map.png` - из `gnome-field-generator/src/generate.py`.

Если они не соответствуют друг другу, игрок будет кликать по одной карте, а видеть другую.

## Известные проблемы и зоны для доработки

- Часть русских строк в компонентах сейчас выглядит как испорченная кодировка (`Рџ...`). Это нужно чинить отдельной правкой в `.vue` и `app.js`.
- Путь к карте и призовому видео зависит от `import.meta.env.BASE_URL`; для нестандартного деплоя нужно выставлять `VITE_BASE_PATH`.
- Автотестов нет, поэтому после изменения `Field.open()` и связанных методов лучше проверять вручную хотя бы маленькую `test-map.json`.
- Логика игры и UI-состояние находятся в одном большом `src/stores/app.js`; при большой доработке его стоит разделить на модель поля и Pinia store.

## Деплой

```bash
./deploy.sh
```

Скрипт:

1. Выполняет `VITE_BASE_PATH=/gnome-field/ yarn build`.
2. Заходит в `dist/`.
3. Копирует `index.html` в `404.html`.
4. Инициализирует временный git-репозиторий в `dist/`.
5. Пушит сборку в `gh-pages`.
