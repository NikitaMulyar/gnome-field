# gnome-field

Игровой фронтенд проекта "Подвалище": десктопная карта подвала, где живокрысик открывает клетки, проходит через вентиляцию, тратит рис и ищет волшебную коробку.

Код приложения лежит в подпапке `gnome-field/`.

## Быстрый Запуск

```bash
cd gnome-field
yarn install
yarn dev
```

Открывать игру нужно по адресу:

```text
http://127.0.0.1:3000/gnome-field/
```

Если порт `3000` занят:

```bash
yarn dev --port 3001
```

Тогда адрес будет `http://127.0.0.1:3001/gnome-field/`.

## Проверки

```bash
cd gnome-field
yarn lint
yarn build
```

`yarn build` сейчас может предупреждать о крупном JS/CSS chunk. Это известное предупреждение Vite/Vuetify, не ошибка сборки.

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
| `3` | булочка |
| `4` | банка краски |
| `5` | картон |
| `6` | сканер |
| `7` | вход в вентиляцию |
| `8` | волшебная коробка |
| `9` | выход из вентиляции |

Стены карты отрисовываются как листы фанеры через `wall-up/right/down/left.png`.

## Анимации

В текущей версии в самой карте анимируются только:

- вода: `water.gif`;
- сканер: `scanner.gif`;
- взрыв банки краски: `paint-explosion.gif`.

После взрыва банка оставляет статичное красное пятно `paint-stain.png`.

## Как Менять Текстуры

Текстуры можно заменить вручную в `gnome-field/src/assets/map-tiles/art-camp/`.

Важно сохранять имена файлов, которые импортирует `AnimatedMapLayer.vue`:

```text
water.gif
water.png
papers.png
basement-door.png
bun.png
paint-can.png
cardboard.png
scanner.gif
scanner.png
vent-in.png
magic-box.png
vent-out.png
wall-up.png
wall-right.png
wall-down.png
wall-left.png
```

Если текстуры генерируются скриптом, источник находится в соседнем репозитории `gnome-field-generator`.
