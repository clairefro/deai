import { AppConfig } from "../../../../shared/Config";
import { DotNotation } from "../../../../shared/util/DotNotation";

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
