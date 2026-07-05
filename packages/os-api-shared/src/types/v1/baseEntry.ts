export type BaseEntry = Record<string, unknown>;

export type DistinctKey<T extends BaseEntry, Key> = T & {_idx: Key};
