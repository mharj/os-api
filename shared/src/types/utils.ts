export type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;

export type UnPromisify<T> = T extends Promise<infer U> ? U : T;

export type FunctionWithAgs = (...args: any) => any;