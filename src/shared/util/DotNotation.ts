export type DotNotation<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any> // skip arrays
      ? `${Prefix}${K & string}`
      : `${Prefix}${K & string}` | DotNotation<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[]
];

type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never;
    }[keyof T]
  : "";

type PathValue<T, P extends Paths<T>> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? R extends Paths<T[K]>
      ? PathValue<T[K], R>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

export type DotNotationUpdate<T> = Partial<{
  [P in Paths<T>]: PathValue<T, P>;
}>;
