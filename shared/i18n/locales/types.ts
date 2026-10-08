import type en from './en';

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

/** Every locale must provide exactly the same keys as the English source. */
export type Translation = DeepStrings<typeof en>;
