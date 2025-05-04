/**
 * Get or set a value in an object using dot notation
 */
export function accessByDotNotation<T = any>(
  obj: any,
  path: string,
  value?: any
): T | undefined {
  const keys = path.split(".");
  let current = obj;
  const lastKey = keys.pop()!;

  // navigate to the parent of the target property
  for (const key of keys) {
    // create object if doesn't exist when setting value
    if (value !== undefined && !(key in current)) {
      current[key] = {};
    }
    // return undefined if path doesn't exist when getting value
    if (!(key in current)) return undefined;
    current = current[key];
  }

  if (value !== undefined) {
    current[lastKey] = value;
    return value;
  }

  return current[lastKey];
}
