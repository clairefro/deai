/**
 * Sets a value in an object using a dot-notation path
 * @param obj The object to modify
 * @param path The path to the property (e.g., "apiKeys.openai")
 * @param value The value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}
