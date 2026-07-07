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

const PAINT_EXPLOSION_DELAY_MS = 2000;
const PAINT_EXPLOSION_VISIBLE_MS = 850;
const SHUTDOWN_DURATION_MS = 60 * 1000 * 150;
const VENT_OPEN_DURATION_MS = 60 * 1000 * 15;
const PROGRESS_STORAGE_KEY = "gnome-field:basement-progress:v1";
const PROGRESS_STORAGE_VERSION = 1;
const DEFAULT_RICE_COST = 1;
const MAX_RICE_COST = 999;

const paintEffectKey = (i, j) => `${i}-${j}`;
const paintExplosionTimeoutIds = {};
const fieldStateKey = (field) =>
  field.tiles.map(({ type, visibility }) => `${type}:${visibility}`).join("|");
const mapSignatureKey = (field) =>
  JSON.stringify({
    width: field.width,
    height: field.height,
    tiles: field.tiles.map(({ type, walls }) => ({ type, walls })),
    portals: field.portals.map((portal) => ({
      entrance: portal.entrance_tiles,
      exit: portal.exit_tiles,
    })),
  });
const getProgressStorage = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch (error) {
    return null;
  }
};
const removeSavedProgress = () => {
  const storage = getProgressStorage();
  if (!storage) return;

  try {
    storage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (error) {
    // Storage can be blocked by browser settings; gameplay should continue.
  }
};
const clearPaintExplosionTimeout = (key) => {
  if (!paintExplosionTimeoutIds[key]) return;
  clearTimeout(paintExplosionTimeoutIds[key]);
  delete paintExplosionTimeoutIds[key];
};
const clearPaintExplosionTimeouts = () => {
  for (const key of Object.keys(paintExplosionTimeoutIds)) {
    clearPaintExplosionTimeout(key);
  }
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
    const response = await fetch(json_filename);
    if (!response.ok)
      throw new Error(`Network response was not ok: ${response.status}`);

    const data = await response.json();
    const tiles = data.tiles.map((tile) => {
      let newTile = new Tile(tile.type, tile.walls);
      newTile.setVisibility(TileVisibility.Closed);
      return newTile;
    });
    const portals = (data.portals ?? []).map(
      (portal) => new Portal(portal.entrance, portal.exit)
    );
    return new Field(data.width, data.height, tiles, portals);
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

    // Paint cans explode asynchronously from the store after a short delay.

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

    this.openRevealedNeighbors(i, j);
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
    if (entrance_tile_index == -1) return;

    this.tiles[entrance_tile_index].setVisibility(TileVisibility.Opened);

    const [i, j] = this.index2d(entrance_tile_index);
    if (i > 0) this.availabilityMap[this.index(i - 1, j)] = true;
    if (i < this.height - 1) this.availabilityMap[this.index(i + 1, j)] = true;
    if (j > 0) this.availabilityMap[this.index(i, j - 1)] = true;
    if (j < this.width - 1) this.availabilityMap[this.index(i, j + 1)] = true;
  }

  handleExplosion(i, j) {
    const affectedTiles = [];
    for (let h_offset = -1; h_offset <= 1; h_offset++) {
      for (let v_offset = -1; v_offset <= 1; v_offset++) {
        const tileI = i + v_offset;
        const tileJ = j + h_offset;
        if (
          tileI < 0 ||
          tileI >= this.height ||
          tileJ < 0 ||
          tileJ >= this.width
        )
          continue;

        const tile = this.tiles[this.index(tileI, tileJ)];
        tile.setVisibility(TileVisibility.Opened);
        if (tile.type == TileTypes.Target) this.targetReached = true;
        affectedTiles.push({ i: tileI, j: tileJ });
      }
    }
    return affectedTiles;
  }

  openRevealedNeighbors(i, j) {
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

  handlePortalEntrance(i, j) {
    const portal = this.portals.find((portal) =>
      portal.entrance_tiles.includes(this.index(i, j))
    );
    if (!portal) return;

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
        exit_j > 0 &&
        this.get(exit_i, exit_j - 1).visibility == TileVisibility.Revealed
      )
        this.open(exit_i, exit_j - 1);
      if (
        exit_j < this.width - 1 &&
        this.get(exit_i, exit_j + 1).visibility == TileVisibility.Revealed
      )
        this.open(exit_i, exit_j + 1);
    }
  }

  handlePortalExit(i, j) {
    const portal = this.portals.find((portal) =>
      portal.exit_tiles.includes(this.index(i, j))
    );
    if (!portal) return;

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
        const tileI = i + v_offset;
        const tileJ = j + h_offset;
        if (
          tileI < 0 ||
          tileI >= this.height ||
          tileJ < 0 ||
          tileJ >= this.width
        )
          continue;

        const tile = this.tiles[this.index(tileI, tileJ)];
        if (tile.isClosed()) tile.setVisibility(TileVisibility.Scanned);
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
    ventCountdownDate: null,
    timeToVentOpen: 0,
    showPrizeVideo: false,
    finished: false,
    riceCost: DEFAULT_RICE_COST,
    pendingPaintExplosions: {},
    activePaintExplosions: {},
    paintStains: {},
    mapLoadError: "",
    shutdownIntervalId: null,
    ventIntervalId: null,
  }),
  actions: {
    resetRunState() {
      this.clearTimers();
      clearPaintExplosionTimeouts();
      this.steps = 1;
      this.countDownDate = new Date().getTime();
      this.timeToShutdown = 0;
      this.creditsSpent = 0;
      this.journal = [];
      this.drillInitialized = false;
      this.ventCountdownDate = null;
      this.timeToVentOpen = 0;
      this.showPrizeVideo = false;
      this.finished = false;
      this.riceCost = DEFAULT_RICE_COST;
      this.pendingPaintExplosions = {};
      this.activePaintExplosions = {};
      this.paintStains = {};
    },
    async loadMap() {
      // this.field = await Field.fromCSV(32, 24, "/map.csv");
      // this.field.exportToJson("map.json");
      this.mapLoadError = "";
      this.resetRunState();

      const primaryMapUrl = `${import.meta.env.BASE_URL}map.json`;
      const mapUrls = [primaryMapUrl];
      if (primaryMapUrl != "/map.json") mapUrls.push("/map.json");

      let lastError = null;
      for (const mapUrl of mapUrls) {
        try {
          this.field = await Field.fromJSON(mapUrl);
          if (!this.restoreProgress()) {
            this.saveProgress();
          }
          return;
        } catch (error) {
          lastError = error;
          console.error(`Error loading the map from ${mapUrl}:`, error);
        }
      }

      this.field = null;
      this.mapLoadError = lastError?.message || "Unknown map loading error";
    },
    saveProgress() {
      const storage = getProgressStorage();
      if (!this.field || !storage) return;

      const progress = {
        version: PROGRESS_STORAGE_VERSION,
        savedAt: Date.now(),
        mapSignature: mapSignatureKey(this.field),
        steps: this.steps,
        countDownDate: this.countDownDate,
        creditsSpent: this.creditsSpent,
        journal: this.journal,
        drillInitialized: this.drillInitialized,
        ventCountdownDate: this.ventCountdownDate,
        showPrizeVideo: this.showPrizeVideo,
        finished: this.finished,
        riceCost: this.riceCost,
        pendingPaintExplosions: this.pendingPaintExplosions,
        paintStains: this.paintStains,
        targetReached: this.field.targetReached,
        tileVisibilities: this.field.tiles.map((tile) => tile.visibility),
      };

      try {
        storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        // Saving is useful, but a blocked/quota-full storage must not break a turn.
      }
    },
    restoreProgress() {
      const storage = getProgressStorage();
      if (!this.field || !storage) return false;

      let progress;
      try {
        progress = JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY));
      } catch (error) {
        removeSavedProgress();
        return false;
      }

      if (
        !progress ||
        progress.version != PROGRESS_STORAGE_VERSION ||
        progress.mapSignature != mapSignatureKey(this.field) ||
        !Array.isArray(progress.tileVisibilities) ||
        progress.tileVisibilities.length != this.field.tiles.length
      )
        return false;

      for (let index = 0; index < this.field.tiles.length; index++) {
        this.field.tiles[index].setVisibility(progress.tileVisibilities[index]);
      }
      this.field.targetReached = Boolean(progress.targetReached);
      this.field.updateAvailabilityMap();

      this.steps = progress.steps ?? 1;
      this.countDownDate = progress.countDownDate ?? new Date().getTime();
      this.creditsSpent = progress.creditsSpent ?? 0;
      this.journal = Array.isArray(progress.journal) ? progress.journal : [];
      this.drillInitialized = Boolean(progress.drillInitialized);
      this.ventCountdownDate = progress.ventCountdownDate ?? null;
      this.showPrizeVideo = Boolean(progress.showPrizeVideo);
      this.finished = Boolean(progress.finished);
      this.riceCost = this.normalizeRiceCost(progress.riceCost);
      this.paintStains = progress.paintStains ?? {};
      this.pendingPaintExplosions = {};
      this.activePaintExplosions = {};

      this.resumeTimers();
      this.restorePendingPaintExplosions(progress.pendingPaintExplosions ?? {});
      return true;
    },
    clearSavedProgress() {
      removeSavedProgress();
    },
    async resetProgress() {
      this.clearSavedProgress();
      this.resetRunState();
      await this.loadMap();
      this.initDrill();
      this.saveProgress();
    },
    tapTile(i, j) {
      if (!this.field) return;

      const oldTileType = this.field.get(i, j).type;
      const oldField = fieldStateKey(this.field);
      this.field.open(i, j);
      this.field.updateAvailabilityMap();
      const newField = fieldStateKey(this.field);

      if (oldField != newField) {
        this.steps++;

        this.creditsSpent += this.riceCost;

        let journalMsg = null;
        if (oldTileType == TileTypes.Bomb)
          journalMsg = "Банка треснула. Красное пятно через 2 секунды!";
        else if (oldTileType == TileTypes.PortalEntrance)
          journalMsg = "Живокрысик нырнул в вентиляционную трубу.";
        else if (oldTileType == TileTypes.Mole)
          journalMsg = "Сканер подсветил тайники подвала.";
        else if (oldTileType == TileTypes.Target)
          journalMsg = "Живокрысик нашел волшебную коробку!";

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

        this.startShutdownTimer();

        if (
          oldTileType == TileTypes.Bomb &&
          this.field.get(i, j).isOpened()
        ) {
          this.schedulePaintExplosion(i, j);
        }

        this.saveProgress();
      }
    },
    schedulePaintExplosion(i, j) {
      const key = paintEffectKey(i, j);
      if (this.pendingPaintExplosions[key] || this.paintStains[key]) return;
      const dueAt = Date.now() + PAINT_EXPLOSION_DELAY_MS;

      this.pendingPaintExplosions = {
        ...this.pendingPaintExplosions,
        [key]: dueAt,
      };

      this.queuePaintExplosion(i, j, dueAt);
      this.saveProgress();
    },
    queuePaintExplosion(i, j, dueAt) {
      const key = paintEffectKey(i, j);
      clearPaintExplosionTimeout(key);

      const delay = Math.max(0, dueAt - Date.now());
      paintExplosionTimeoutIds[key] = setTimeout(() => {
        delete paintExplosionTimeoutIds[key];
        this.completePaintExplosion(i, j);
      }, delay);
    },
    completePaintExplosion(i, j) {
      if (!this.field) return;

      const key = paintEffectKey(i, j);
      if (!this.pendingPaintExplosions[key] || this.paintStains[key]) return;

      const affectedTiles = this.field.handleExplosion(i, j);
      for (const tile of affectedTiles) {
        this.field.openRevealedNeighbors(tile.i, tile.j);
      }
      this.field.updateAvailabilityMap();

      const nextPending = { ...this.pendingPaintExplosions };
      delete nextPending[key];
      this.pendingPaintExplosions = nextPending;

      this.paintStains = {
        ...this.paintStains,
        [key]: true,
      };
      this.activePaintExplosions = {
        ...this.activePaintExplosions,
        [key]: (this.activePaintExplosions[key] || 0) + 1,
      };
      this.saveProgress();

      setTimeout(() => {
        const nextActive = { ...this.activePaintExplosions };
        delete nextActive[key];
        this.activePaintExplosions = nextActive;
      }, PAINT_EXPLOSION_VISIBLE_MS);
    },
    restorePendingPaintExplosions(pendingPaintExplosions) {
      const nextPending = {};
      for (const [key, dueAt] of Object.entries(pendingPaintExplosions)) {
        const [i, j] = key.split("-").map(Number);
        if (!Number.isFinite(i) || !Number.isFinite(j)) continue;
        if (this.paintStains[key]) continue;

        nextPending[key] = dueAt;
        this.queuePaintExplosion(i, j, dueAt);
      }
      this.pendingPaintExplosions = nextPending;
    },
    startShutdownTimer() {
      this.countDownDate = new Date().getTime() + SHUTDOWN_DURATION_MS;
      this.updateShutdownTimer();

      if (this.shutdownIntervalId !== null)
        clearInterval(this.shutdownIntervalId);

      this.shutdownIntervalId = setInterval(() => {
        this.updateShutdownTimer();
      }, 500);
      this.saveProgress();
    },
    updateShutdownTimer() {
      const now = new Date().getTime();
      this.timeToShutdown = this.countDownDate - now;
      if (this.timeToShutdown >= 0) return;

      this.timeToShutdown = 0;
      if (this.shutdownIntervalId !== null) {
        clearInterval(this.shutdownIntervalId);
        this.shutdownIntervalId = null;
      }
    },
    startVentTimer() {
      this.ventCountdownDate = new Date().getTime() + VENT_OPEN_DURATION_MS;
      this.updateVentTimer();

      if (this.ventIntervalId !== null) clearInterval(this.ventIntervalId);

      this.ventIntervalId = setInterval(() => {
        this.updateVentTimer();
      }, 500);
      this.saveProgress();
    },
    updateVentTimer() {
      const now = new Date().getTime();
      this.timeToVentOpen = this.ventCountdownDate - now;
      if (this.timeToVentOpen >= 0) return;

      this.timeToVentOpen = 0;
      this.showPrizeVideo = true;
      if (this.ventIntervalId !== null) {
        clearInterval(this.ventIntervalId);
        this.ventIntervalId = null;
      }
      this.saveProgress();
    },
    resumeTimers() {
      if (this.drillInitialized) {
        this.updateShutdownTimer();
        if (this.timeToShutdown > 0) {
          this.shutdownIntervalId = setInterval(() => {
            this.updateShutdownTimer();
          }, 500);
        }
      }

      if (this.ventCountdownDate !== null && !this.finished) {
        this.updateVentTimer();
        if (this.timeToVentOpen > 0 && !this.showPrizeVideo) {
          this.ventIntervalId = setInterval(() => {
            this.updateVentTimer();
          }, 500);
        }
      }
    },
    clearTimers() {
      if (this.shutdownIntervalId !== null) {
        clearInterval(this.shutdownIntervalId);
        this.shutdownIntervalId = null;
      }

      if (this.ventIntervalId !== null) {
        clearInterval(this.ventIntervalId);
        this.ventIntervalId = null;
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
    getPaintExplosionVersion(i, j) {
      return this.activePaintExplosions[paintEffectKey(i, j)] || 0;
    },
    hasPaintStain(i, j) {
      return Boolean(this.paintStains[paintEffectKey(i, j)]);
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
    getRiceCost() {
      return this.riceCost;
    },
    normalizeRiceCost(value) {
      const parsedValue = Number.parseInt(value, 10);
      if (!Number.isFinite(parsedValue)) return DEFAULT_RICE_COST;
      return Math.max(1, Math.min(MAX_RICE_COST, parsedValue));
    },
    setRiceCost(value) {
      const nextRiceCost = this.normalizeRiceCost(value);
      if (nextRiceCost == this.riceCost) return;

      this.riceCost = nextRiceCost;
      this.saveProgress();
    },
    getJournal() {
      return this.journal;
    },
    getTarget() {
      return this.field.target;
    },
    initDrill() {
      if (this.drillInitialized) return;
      this.startShutdownTimer();
      this.drillInitialized = true;
      this.field.openEntrance();
      this.field.updateAvailabilityMap();
      this.saveProgress();
    },
    targetReached() {
      if (this.ventCountdownDate === null && this.field.targetReached) {
        this.startVentTimer();
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
      this.saveProgress();
    },
    finishGame() {
      this.setShowPrizeVideo(false);
      this.field.targetReached = false;
      this.finished = true;
      this.clearTimers();
      this.saveProgress();
    },
    getFinished() {
      return this.finished;
    },
    getMapLoadError() {
      return this.mapLoadError;
    },
    fastForwardVent() {
      const now = new Date().getTime();
      const delta = this.ventCountdownDate - now;
      if (delta > 1000) {
        this.ventCountdownDate = now + 5000;
        this.updateVentTimer();
        this.saveProgress();
      }
    },
  },
});
