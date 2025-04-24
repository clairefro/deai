/**
 * Traverse an object and apply a transformation function to specified properties.
 * @param obj The object to traverse.
 * @param props The list of property paths to transform.
 * @param transformFn The transformation function (e.g., encrypt or decrypt).
 */
export function transformProps(
  obj: Record<string, any>,
  props: string[],
  transformFn: (value: string) => string
): void {
  for (const propPath of props) {
    const keys = propPath.split(".");
    let current = obj;

    // Traverse the object to the target property
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return; // Skip if the path doesn't exist
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (current[lastKey] !== null && current[lastKey] !== "") {
      // Only transform non-null and non-empty values
      current[lastKey] = transformFn(current[lastKey]);
    }
  }
}
