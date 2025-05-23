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
    DIALOG: 100,
    SETTINGS: {
      BASE: 95,
      MENU: 96,
      OVERLAY: 97,
      CONTROLS: 98,
    },
  },
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
