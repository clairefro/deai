export type HexDirection =
  | "ne" // northeast
  | "nw" // northwest
  | "ee" // east
  | "ww" // west
  | "se" // southeast
  | "sw" // southwest
  | "up"
  | "dn";

export const HEX_DIRECTIONS: HexDirection[] = [
  "ne",
  "nw",
  "ee",
  "ww",
  "se",
  "sw",
];

export const OPPOSITE_DIRECTIONS: Record<HexDirection, HexDirection> = {
  ne: "sw",
  nw: "se",
  ee: "ww",
  ww: "ee",
  se: "nw",
  sw: "ne",
  up: "dn",
  dn: "up",
};

// Pointy-top hex vectors
export const HEX_VECTORS: Record<HexDirection, [number, number]> = {
  ne: [1, -1], // Up-Right
  nw: [-1, -1], // Up-Left
  ee: [1, 0], // Right
  ww: [-1, 0], // Left
  se: [1, 1], // Down-Right
  sw: [-1, 1], // Down-Left
  up: [0, 0], // Same position, different floor
  dn: [0, 0], // Same position, different floor
};
