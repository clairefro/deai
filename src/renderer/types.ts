import { AppConfig } from "../shared/Config";
import { DotNotation } from "../shared/util/DotNotation";

/** NAVIGATION */

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface Location extends Coordinates {
  type: RoomType;
  exits?: HexDirection[];
  cameFrom?: HexDirection;
}

export interface TraversalRecord {
  from: Coordinates;
  to: Coordinates;
  direction: HexDirection;
  timestamp: number;
}

/** ACTIONS */
export interface ProximityAction {
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;
  range: number;
  key: string;
  getLabel: () => string;
  action: () => void;
}

/** ROOM  */

export type RoomType = "gallery" | "hallway";

export interface RoomAssets {
  background: string;
  walkableMask: string;
}

export interface RoomConfig {
  type: RoomType;
  assets: RoomAssets;
  width: number;
  height: number;
}

export interface ExitPosition {
  x: number;
  y: number;
  rotation: number;
}

export type ExitPositions = {
  [key in HexDirection]?: ExitPosition;
};

/** NAVIGTATION */

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

export const HEX_DIRECTIONS_PLANAR = HEX_DIRECTIONS.filter(
  (d) => d !== "up" && d !== "dn"
);

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

// pointy-top hex vectors
export const HEX_VECTORS: Record<HexDirection, [number, number]> = {
  ne: [1, -1], // up-right
  nw: [-1, -1], // up-left
  ee: [1, 0], // right
  ww: [-1, 0], // left
  se: [1, 1], // down-right
  sw: [-1, 1], // down-left
  up: [0, 0], // z (up) - same pos
  dn: [0, 0], // z (down) - same pos
};

/** CHAT */
export interface MessageOptions {
  speaker?: string;
  role?: "user" | "assistant" | "system";
  metadata?: Record<string, any>;
}

/** SETTINGS */

export type SettingKeys = DotNotation<AppConfig>;

export interface SelectOption {
  value: string;
  label: string;
}

export interface BaseSettingConfig {
  key: SettingKeys;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}

export interface TextSettingConfig extends BaseSettingConfig {
  type: "text";
  placeholder?: string;
}

export interface SelectSettingConfig extends BaseSettingConfig {
  type: "select";
  options?: SelectOption[];
  loadOptions?: () => Promise<SelectOption[]>;
}

export interface DirectorySettingConfig extends BaseSettingConfig {
  onDirectoryChange?: (dir: string) => void;
  type: "directory";
}

export type SettingConfig =
  | TextSettingConfig
  | SelectSettingConfig
  | DirectorySettingConfig;

/// --- for schema

interface BaseSchemaConfig extends BaseSettingConfig {
  value: (config: AppConfig) => string;
}

export interface SchemaTextConfig extends BaseSchemaConfig {
  type: "text";
  placeholder?: string;
}

export interface SchemaSelectConfig extends BaseSchemaConfig {
  type: "select";
  options?: SelectOption[];
  loadOptions?: () => Promise<SelectOption[]>;
}

export interface SchemaDirectoryConfig extends BaseSchemaConfig {
  type: "directory";
  onDirectoryChange?: (dir: string) => void;
}

export type SchemaSettingConfig =
  | SchemaTextConfig
  | SchemaSelectConfig
  | SchemaDirectoryConfig;
