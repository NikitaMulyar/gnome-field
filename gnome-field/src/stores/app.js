// Utilities
import { defineStore } from "pinia";

export const TileTypes = {
  Water: 0,
  Stone: 1,
  Entrance: 2,
  Cliff: 3,
  Bomb: 4,
  Sand: 5,
  Mole: 6,
  PortalEntrance: 7,
  Target: 8,
  PortalExit: 9,
};

export const WallDirections = {
  Up: 0,
  Right: 1,
  Down: 2,
  Left: 3,
};

export const TileVisibility = {
  Closed: 1,
  Scanned: 2,
  Revealed: 3,
  Opened: 4,
};

export class Tile {
  constructor(type, walls) {
    this.type = type;
    this.walls = walls;
    this.visibility = TileVisibility.Closed;
  }

  isOpened() {
    return this.visibility == TileVisibility.Opened;
  }

  isClosed() {
    return (
      this.visibility == TileVisibility.Closed ||
      this.visibility == TileVisibility.Scanned
    );
  }

  isRevealed() {
    return (
      this.visibility == TileVisibility.Revealed ||
      this.visibility == TileVisibility.Opened
    );
  }

  hasWall(direction) {
    return this.walls[direction];
  }

  setVisibility(visibility) {
    this.visibility = visibility;
  }

  setType(type) {
    this.type = type;
  }
}

export class Portal {
  constructor(entrance_tiles, exit_tiles) {
    this.entrance_tiles = entrance_tiles;
    this.exit_tiles = exit_tiles;
  }
}

export class Field {
  constructor(width, height, tiles, portals = []) {
    this.width = width;
    this.height = height;
    this.tiles = tiles;
    this.portals = portals;
    this.bombs = [];
    this.target = {};
    this.availabilityMap = new Array(width * height).fill(false);
    this.targetReached = false;

    for (let i = 0; i < width * height; i++) {
      if (this.tiles[i].type == TileTypes.Bomb)
        this.bombs.push({ i: Math.floor(i / width), j: i % width });
      if (this.tiles[i].type == TileTypes.Target)
        this.target = { i: Math.floor(i / width), j: i % width };
    }
  }

  static async fromCSV(width, height, csv_filename) {
    try {
      const response = await fetch(csv_filename);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.text();
      const stored_map = data
        .split("\n")
        .map((row) => row.split(";"))
        .flat()
        .map(Number)
        .map((tile) => {
          let newTile = new Tile(tile, [false, false, false, false]);
          newTile.setVisibility(TileVisibility.Closed);
          return newTile;
        });
      return new Field(width, height, stored_map);
    } catch (error) {
      console.error("Error loading the map:", error);
    }
  }

  static async fromJSON(json_filename) {
    try {
      const response = await fetch(json_filename);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const tiles = data.tiles.map((tile) => {
        let newTile = new Tile(tile.type, tile.walls);
        newTile.setVisibility(1);
        return newTile;
      });
      const portals = data.portals.map(
        (portal) => new Portal(portal.entrance, portal.exit)
      );
      return new Field(data.width, data.height, tiles, portals);
    } catch (error) {
      console.error("Error loading the map:", error);
    }
  }

  exportToJson(filename) {
    const data = {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map((tile) => ({
        type: tile.type,
        walls: tile.walls,
        visibility: tile.visibility,
      })),
      portals: this.portals.map((portal) => ({
        entrance: portal.entrance_tiles,
        exit: portal.exit_tiles,
      })),
    };
    const json = JSON.stringify(data);

    let element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(json)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  index(i, j) {
    return i * this.width + j;
  }

  index2d(index) {
    return [Math.floor(index / this.width), index % this.width];
  }

  get(i, j) {
    if (i < 0 || i >= this.height || j < 0 || j >= this.width)
      return new Tile(TileTypes.Stone, [false, false, false, false]);
    return this.tiles[i * this.width + j];
  }

  open(i, j) {
    if (!this.canOpen(i, j)) return;

    const oldVisibility = this.tiles[this.index(i, j)].visibility;

    const left = this.get(i, j - 1);
    const right = this.get(i, j + 1);
    const up = this.get(i - 1, j);
    const down = this.get(i + 1, j);
    const current = this.get(i, j);

    if (current.type == TileTypes.Cliff)
      this.tiles[this.index(i, j)].setVisibility(TileVisibility.Opened);

    for (let dir of Object.values(WallDirections)) {
      if (current.hasWall(dir)) continue;
      if (
        (dir == WallDirections.Up &&
          i > 0 &&
          up.isOpened() &&
          up.type != TileTypes.Water &&
          up.type != TileTypes.Cliff &&
          !up.hasWall(WallDirections.Down)) ||
        (dir == WallDirections.Right &&
          j < this.width - 1 &&
          right.isOpened() &&
          right.type != TileTypes.Water &&
          right.type != TileTypes.Cliff &&
          !right.hasWall(WallDirections.Left)) ||
        (dir == WallDirections.Down &&
          i < this.height - 1 &&
          down.isOpened() &&
          down.type != TileTypes.Water &&
          down.type != TileTypes.Cliff &&
          !down.hasWall(WallDirections.Up)) ||
        (dir == WallDirections.Left &&
          j > 0 &&
          left.isOpened() &&
          left.type != TileTypes.Water &&
          left.type != TileTypes.Cliff &&
          !left.hasWall(WallDirections.Right))
      ) {
        this.tiles[this.index(i, j)].setVisibility(TileVisibility.Opened);
        break;
      }
    }
    if (!current.isOpened()) {
      this.tiles[this.index(i, j)].setVisibility(TileVisibility.Revealed);
      return;
    }

    // Splash open water and sand
    if (
      this.tiles[this.index(i, j)].type == TileTypes.Water ||
      this.tiles[this.index(i, j)].type == TileTypes.Sand
    )
      this.splashOpen(i, j);

    // Handle bomb tiles
    if (this.tiles[this.index(i, j)].type == TileTypes.Bomb)
      this.handleExplosion(i, j);

    // Handle portal tiles
    if (
      this.tiles[this.index(i, j)].type == TileTypes.PortalEntrance &&
      oldVisibility == TileVisibility.Closed
    )
      this.handlePortalEntrance(i, j);

    if (
      this.tiles[this.index(i, j)].type == TileTypes.PortalExit &&
      oldVisibility == TileVisibility.Closed
    )
      this.handlePortalExit(i, j);

    // Handle mole tiles
    if (
      this.tiles[this.index(i, j)].type == TileTypes.Mole &&
      oldVisibility == TileVisibility.Closed
    )
      this.handleMole(i, j);

    // Handle target tile
    if (
      this.tiles[this.index(i, j)].type == TileTypes.Target &&
      oldVisibility == TileVisibility.Closed
    )
      this.targetReached = true;

    // Open adjacent revealed tiles
    if (i > 0 && this.get(i - 1, j).visibility == TileVisibility.Revealed)
      this.open(i - 1, j);
    if (
      i < this.height - 1 &&
      this.get(i + 1, j).visibility == TileVisibility.Revealed
    )
      this.open(i + 1, j);
    if (j > 0 && this.get(i, j - 1).visibility == TileVisibility.Revealed)
      this.open(i, j - 1);
    if (
      j < this.width - 1 &&
      this.get(i, j + 1).visibility == TileVisibility.Revealed
    )
      this.open(i, j + 1);
  }

  canOpen(i, j) {
    if (this.get(i, j).isOpened()) return false;

    const left = this.get(i, j - 1);
    const right = this.get(i, j + 1);
    const up = this.get(i - 1, j);
    const down = this.get(i + 1, j);

    if (
      this.get(i, j).type == TileTypes.Cliff &&
      this.get(i, j).visibility == TileVisibility.Revealed &&
      (left.isOpened() || right.isOpened() || up.isOpened() || down.isOpened())
    )
      return true;

    return (
      (left.isOpened() &&
        left.type != TileTypes.Water &&
        left.type != TileTypes.Cliff &&
        !left.hasWall(WallDirections.Right)) ||
      (right.isOpened() &&
        right.type != TileTypes.Water &&
        right.type != TileTypes.Cliff &&
        !right.hasWall(WallDirections.Left)) ||
      (down.isOpened() &&
        down.type != TileTypes.Water &&
        down.type != TileTypes.Cliff &&
        !down.hasWall(WallDirections.Up)) ||
      (up.isOpened() &&
        up.type != TileTypes.Water &&
        up.type != TileTypes.Cliff &&
        !up.hasWall(WallDirections.Down))
    );
  }

  flood(i, j) {
    if (!this.canFlood(i, j)) return;

    if (this.get(i, j).type == TileTypes.Water)
      this.tiles[this.index(i, j)].setVisibility(TileVisibility.Opened);
    if (this.get(i, j).type == TileTypes.Sand)
      this.tiles[this.index(i, j)].setVisibility(TileVisibility.Revealed);
  }

  canFlood(i, j) {
    if (this.get(i, j).isRevealed()) return false;
    if (
      this.get(i, j).type != TileTypes.Water &&
      this.get(i, j).type != TileTypes.Sand
    )
      return false;

    const left = this.get(i, j - 1);
    const right = this.get(i, j + 1);
    const up = this.get(i - 1, j);
    const down = this.get(i + 1, j);

    return (
      (left.isRevealed() &&
        (left.type == TileTypes.Water || left.type == TileTypes.Sand)) ||
      (right.isRevealed() &&
        (right.type == TileTypes.Water || right.type == TileTypes.Sand)) ||
      (up.isRevealed() &&
        (up.type == TileTypes.Water || up.type == TileTypes.Sand)) ||
      (down.isRevealed() &&
        (down.type == TileTypes.Water || down.type == TileTypes.Sand))
    );
  }

  splashOpen(i, j) {
    if (
      this.get(i, j).type != TileTypes.Water &&
      this.get(i, j).type != TileTypes.Sand
    )
      return;
    this.flood(i, j);

    if (i > 0 && this.get(i - 1, j).isClosed()) this.splashOpen(i - 1, j);
    if (i < this.height - 1 && this.get(i + 1, j).isClosed())
      this.splashOpen(i + 1, j);
    if (j > 0 && this.get(i, j - 1).isClosed()) this.splashOpen(i, j - 1);
    if (j < this.width - 1 && this.get(i, j + 1).isClosed())
      this.splashOpen(i, j + 1);

    if (
      (i > 0 &&
        this.get(i - 1, j).isOpened() &&
        this.get(i - 1, j).type != TileTypes.Water) ||
      (i < this.height - 1 &&
        this.get(i + 1, j).isOpened() &&
        this.get(i + 1, j).type != TileTypes.Water) ||
      (j > 0 &&
        this.get(i, j - 1).isOpened() &&
        this.get(i, j - 1).type != TileTypes.Water) ||
      (j < this.width - 1 &&
        this.get(i, j + 1).isOpened() &&
        this.get(i, j + 1).type != TileTypes.Water)
    )
      this.open(i, j);
  }

  openEntrance() {
    const entrance_tile_index = this.tiles.findIndex(
      (tile) => tile.type == TileTypes.Entrance
    );
    this.tiles[entrance_tile_index].setVisibility(TileVisibility.Opened);

    const [i, j] = this.index2d(entrance_tile_index);
    if (i > 0) this.availabilityMap[this.index(i - 1, j)] = true;
    if (i < this.height - 1) this.availabilityMap[this.index(i + 1, j)] = true;
    if (j > 0) this.availabilityMap[this.index(i, j - 1)] = true;
    if (j < this.width - 1) this.availabilityMap[this.index(i, j + 1)] = true;
  }

  handleExplosion(i, j) {
    for (let h_offset = -1; h_offset <= 1; h_offset++) {
      for (let v_offset = -1; v_offset <= 1; v_offset++) {
        this.tiles[this.index(i + v_offset, j + h_offset)].setVisibility(
          TileVisibility.Opened
        );
        this.tiles[this.index(i + v_offset, j + h_offset)].setType(
          TileTypes.Cliff
        );
      }
    }
  }

  handlePortalEntrance(i, j) {
    const portal = this.portals.find((portal) =>
      portal.entrance_tiles.includes(this.index(i, j))
    );

    const exit_is_opened = portal.exit_tiles.some((exit_tile) =>
      this.tiles[exit_tile].isOpened()
    );

    for (let entrance_tile of portal.entrance_tiles)
      this.tiles[entrance_tile].setVisibility(TileVisibility.Opened);

    if (!exit_is_opened) this.splashHide(i, j);

    for (let exit_tile of portal.exit_tiles)
      this.tiles[exit_tile].setVisibility(TileVisibility.Opened);

    for (let exit_tile of portal.exit_tiles) {
      const [exit_i, exit_j] = this.index2d(exit_tile);
      // Open adjacent revealed tiles
      if (
        exit_i > 0 &&
        this.get(exit_i - 1, exit_j).visibility == TileVisibility.Revealed
      )
        this.open(exit_i - 1, exit_j);
      if (
        exit_i < this.height - 1 &&
        this.get(exit_i + 1, exit_j).visibility == TileVisibility.Revealed
      )
        this.open(exit_i + 1, exit_j);
      if (
        j > 0 &&
        this.get(exit_i, exit_j - 1).visibility == TileVisibility.Revealed
      )
        this.open(exit_i, exit_j - 1);
      if (
        j < this.width - 1 &&
        this.get(exit_i, exit_j + 1).visibility == TileVisibility.Revealed
      )
        this.open(exit_i, exit_j + 1);
    }
  }

  handlePortalExit(i, j) {
    const portal = this.portals.find((portal) =>
      portal.exit_tiles.includes(this.index(i, j))
    );
    for (let exit_tile of portal.exit_tiles)
      this.open(...this.index2d(exit_tile));
  }

  splashHide(i, j) {
    if (!this.tiles[this.index(i, j)].isOpened()) return;
    if (this.tiles[this.index(i, j)].type == TileTypes.Water) return;
    this.tiles[this.index(i, j)].setVisibility(TileVisibility.Revealed);

    if (i > 0) this.splashHide(i - 1, j);
    if (i < this.height - 1) this.splashHide(i + 1, j);
    if (j > 0) this.splashHide(i, j - 1);
    if (j < this.width - 1) this.splashHide(i, j + 1);
  }

  handleMole(i, j) {
    for (let h_offset = -3; h_offset <= 3; h_offset++) {
      for (let v_offset = -3; v_offset <= 3; v_offset++) {
        if (this.get(i + v_offset, j + h_offset).isClosed()) {
          this.tiles[this.index(i + v_offset, j + h_offset)].setVisibility(
            TileVisibility.Scanned
          );
        }
      }
    }
  }

  updateAvailabilityMap() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.availabilityMap[this.index(i, j)] = this.canOpen(i, j);
      }
    }
  }
}

export const useAppStore = defineStore("app", {
  state: () => ({
    field: null,
    steps: 1,
    countDownDate: new Date().getTime(),
    timeToShutdown: 0,
    creditsSpent: 0,
    journal: [],
    drillInitialized: false,
    mouseI: -1,
    mouseJ: -1,
    targetReached: false,
    ventCountdownDate: null,
    timeToVentOpen: 0,
    showPrizeVideo: false,
    finished: false,
  }),
  actions: {
    async loadMap() {
      // this.field = await Field.fromCSV(32, 24, "/map.csv");
      // this.field.exportToJson("map.json");
      this.field = await Field.fromJSON(`${import.meta.env.BASE_URL}map.json`);
    },
    tapTile(i, j) {
      const oldTileType = this.field.get(i, j).type;
      const oldField = this.field.tiles.map((tile) => ({ ...tile }));
      this.field.open(i, j);
      this.field.updateAvailabilityMap();
      const newField = this.field.tiles.map((tile) => ({ ...tile }));

      if (JSON.stringify(oldField) != JSON.stringify(newField)) {
        this.steps++;

        if (this.timeToShutdown == 0) this.creditsSpent += 2;
        else this.creditsSpent += 1;

        let journalMsg = null;
        if (oldTileType == TileTypes.Bomb)
          journalMsg = "Р’С‹ РЅР°С‚РєРЅСѓР»РёСЃСЊ РЅР° РїСЂРѕСЃСЂРѕС‡РµРЅРЅСѓСЋ Р°РіСѓС€Сѓ Рё РІР·РѕСЂРІР°Р»РёСЃСЊ!";
        else if (oldTileType == TileTypes.PortalEntrance)
          journalMsg = "Р’С‹ РїСЂРѕС€Р»Рё С‡РµСЂРµР· РІРѕРґРѕРІРѕСЂРѕС‚!";
        else if (oldTileType == TileTypes.Mole)
          journalMsg =
            "Р’С‹ РЅР°С‚РєРЅСѓР»РёСЃСЊ РЅР° РјС‹С€РєСѓ, РїРѕРєР°Р·С‹РІР°СЋС‰СѓСЋ РѕР±Р»Р°СЃС‚СЊ РІРѕРєСЂСѓРі!";
        else if (oldTileType == TileTypes.Target)
          journalMsg = "Р’С‹ РґРѕСЃС‚РёРіР»Рё С†РµР»Рё!";

        this.journal.push({
          tile: { i, j },
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          type: oldTileType,
          msg: journalMsg,
        });

        this.countDownDate = new Date().getTime() + 60 * 1000 * 150;
        const interval = setInterval(() => {
          const now = new Date().getTime();
          this.timeToShutdown = this.countDownDate - now;
          if (this.timeToShutdown < 0) {
            clearInterval(interval);
            this.timeToShutdown = 0;
          }
        }, 500);
      }
    },
    getWidth() {
      return this.field.width;
    },
    getHeight() {
      return this.field.height;
    },
    getTile(i, j) {
      return this.field.get(i, j);
    },
    getBombs() {
      return this.field.bombs;
    },
    isAvailable(i, j) {
      return this.field.availabilityMap[this.field.index(i, j)];
    },
    getSteps() {
      return this.steps;
    },
    getTimeToShutdown() {
      return this.timeToShutdown;
    },
    getCreditsSpent() {
      return this.creditsSpent;
    },
    getJournal() {
      return this.journal;
    },
    getTarget() {
      return this.field.target;
    },
    initDrill() {
      if (this.drillInitialized) return;
      this.countDownDate = new Date().getTime() + 60 * 1000 * 150;
      const interval = setInterval(() => {
        const now = new Date().getTime();
        this.timeToShutdown = this.countDownDate - now;
        if (this.timeToShutdown < 0) {
          clearInterval(interval);
          this.timeToShutdown = 0;
        }
      }, 500);
      this.drillInitialized = true;
      this.field.openEntrance();
    },
    targetReached() {
      if (this.ventCountdownDate === null && this.field.targetReached) {
        this.ventCountdownDate = new Date().getTime() + 60 * 1000 * 15;
        const interval = setInterval(() => {
          const now = new Date().getTime();
          this.timeToVentOpen = this.ventCountdownDate - now;
          if (this.timeToVentOpen < 0) {
            clearInterval(interval);
            this.timeToVentOpen = 0;
            this.showPrizeVideo = true;
          }
        }, 500);
      }
      return this.field.targetReached;
    },
    getTimeToVentOpen() {
      return this.timeToVentOpen;
    },
    getShowPrizeVideo() {
      return this.showPrizeVideo;
    },
    setShowPrizeVideo(show) {
      this.showPrizeVideo = show;
    },
    finishGame() {
      this.setShowPrizeVideo(false);
      this.field.targetReached = false;
      this.finished = true;
    },
    getFinished() {
      return this.finished;
    },
    fastForwardVent() {
      const now = new Date().getTime();
      const delta = this.ventCountdownDate - now;
      if (delta > 1000) {
        this.ventCountdownDate = now + 5000;
      }
    },
  },
});

