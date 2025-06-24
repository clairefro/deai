import { AllDirection, HexDirection } from "../types";

export const DEPTHS = {
  BACKGROUND: 0,
  PLAYER: 20,
  LIBRARIAN: {
    CONTAINER: 19,
    SPRITE: 25,
    NAME_TEXT: 19,
  },
  NOTEBOOK: {
    BASE: 50,
    CONTENT: 51,
    TOOLBAR: 52,
    HOVER: 53,
  },
  UI: {
    BASE: 90,
    DIALOG: 500,
    SETTINGS: {
      BASE: 95,
      MENU: 96,
      OVERLAY: 97,
      CONTROLS: 98,
    },
  },
};

export const COLORS = {
  ACCENT: "#be3813",
};

export const ACTIONS = {
  DEFAULT_RANGE: 100,
  DOOR_RANGE: 200,
  STAIRS_RANGE: 50,
  PREFIX_LIBRIAN_CHAT: "chat-",
  PREFIX_EXIT: "exit-",
  PREFIX_STAIRS: "stairs-",
  PREFIX_BOOKSHELF: "bookshelf-wall-",
};

export const LIBRARIAN_CONFIG = {
  DEFAULTS: {
    IMAGE_KEY: "ghost",
  },
  POSITIONS: {
    NAME_OFFSET_Y: -40,
    MUMBLE_OFFSET_Y: -80,
  },
  TIMING: {
    MUMBLE_DURATION: { MIN: 5000, MAX: 8000 },
    MUMBLE_GAP: { MIN: 3000, MAX: 8000 },
    RESUME_MUMBLE_DELAY: 3000,
  },
  TEXT_STYLES: {
    NAME: {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    },
    MUMBLE: {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 6, y: 3 },
      align: "center",
      fixedWidth: 200,
      wordWrap: { width: 190 },
    },
  },
};

export const CHAT_STYLES = {
  MAX_HEIGHT: 150,
  INITIAL_ROWS: 1,
};

export const EVENTS = {
  WALKABLE_MASK_CHANGED: "walkableMaskChanged",
  LOCATION_CHANGED: "locationChanged",
  STAIRS_SELECTED: "stairsSelected",
  ROOM_READY: "roomReady",
};

/** NAVIGATION */

export const HEX_DIRECTIONS: HexDirection[] = [
  "ne",
  "nw",
  "ee",
  "ww",
  "se",
  "sw",
];

export const OPPOSITE_DIRECTIONS: Record<AllDirection, AllDirection> = {
  ne: "sw",
  nw: "se",
  ee: "ww",
  ww: "ee",
  se: "nw",
  sw: "ne",
  up: "dn",
  dn: "up",
};

export const DIRECTION_DISPLAY_NAMES: Record<AllDirection, string> = {
  ne: "north east",
  nw: "north west",
  ee: "east",
  ww: "west",
  se: "south east",
  sw: "south west",
  up: "upstairs",
  dn: "downstairs",
};

// pointy-top hex grid vectors
export const DIRECTION_OFFSETS: Record<AllDirection, [number, number]> = {
  ee: [1, 0],
  ww: [-1, 0],
  ne: [1, 1],
  nw: [-1, 1],
  se: [1, -1],
  sw: [-1, -1],
  up: [0, 0],
  dn: [0, 0],
};
