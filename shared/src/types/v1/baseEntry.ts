export type BaseEntry = Record<string, unknown>;

export type BaseFileEntry<T extends BaseEntry> = T & {line: number};
