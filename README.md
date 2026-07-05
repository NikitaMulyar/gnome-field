# gnome-field

Игра, которая использует карту из `gnome-field-generator`: показывает PNG-поле, накрывает его интерактивной сеткой и ведет состояние прохождения.

Этот репозиторий устроен с дополнительной вложенной папкой:

```text
gnome-field/
  docker-compose.yml       # запуск игры отдельно
  README.md                # этот файл: общая точка входа
  gnome-field/             # реальное Vue/Vuetify-приложение
    Dockerfile
    src/
    public/
    package.json
```

Основная документация по коду лежит в [gnome-field/README.md](gnome-field/README.md).

## Что здесь происходит

Игра состоит из двух синхронных частей:

- `public/map.json` - логическая карта: типы клеток, стены, порталы.
- `src/assets/map.png` - фоновая картинка той же карты.

`map.png` генерируется в соседнем проекте `gnome-field-generator`, а `map.json` обычно создается в `gnome-field-generator/map-editor`.

Если заменить только JSON, кликабельная логика изменится, но картинка останется старой. Если заменить только PNG, поле будет выглядеть иначе, но логика кликов останется старой. Почти всегда обновлять нужно оба файла.

## Запуск через Docker

Из этой папки можно поднять только игру:

```bash
docker compose up --build
```

Игра откроется здесь:

```text
http://localhost:3000/
```

Из корня `C:\NotGnomes` можно поднять сразу игру и редактор:

```bash
docker compose up --build
```

## Запуск без Docker

```bash
cd gnome-field
yarn install
yarn dev
```

## Как обновить карту игры

1. В `gnome-field-generator/map-editor` сделать и сохранить новый `map.json`.
2. Положить JSON сюда:

   ```text
   gnome-field-generator/src/assets/map.json
   ```

3. Из корня `C:\NotGnomes` запустить:

   ```bash
   docker compose --profile tools run --rm map-sync
   ```

4. Сервис обновит:

   ```text
   gnome-field/gnome-field/public/map.json
   gnome-field/gnome-field/src/assets/map.png
   ```

5. Открыть игру и проверить, что клики совпадают с картинкой.

## Деплой

Скрипт деплоя лежит внутри приложения:

```bash
cd gnome-field
./deploy.sh
```

Он делает сборку с `VITE_BASE_PATH=/gnome-field/`, копирует `index.html` в `404.html` для SPA-роутинга и пушит `dist/` в `gh-pages` репозитория `GregoryKogan/gnome-field`.
