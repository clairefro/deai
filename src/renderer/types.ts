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

export type RoomType = "gallery" | "vestibule";

export interface RoomAssets {
  backgroundImg: string;
  backgroundKey: string;
  walkableMaskImg: string;
  walkableMaskKey: string;
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
