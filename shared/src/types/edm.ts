import {Edm, EdmMap, EdmMapSingle} from './edmValue';

export interface EdmSchemaRecordValue<T extends Edm | Edm[] | EdmComplexType<any> | EdmComplexType<any>[]> {
	type: T;
	nullable?: boolean;
}

export interface EdmSchemaOptions<T extends Edm | Edm[] | EdmComplexType<any> | EdmComplexType<any>[]> {
	type: T;
	name: string;
	nullable?: boolean;
}

export type EdmComplexObject<T> = {
	[K in keyof T]: T[K] extends Array<any> ? EdmSchemaOptions<EdmMap<T[K]>> : EdmSchemaOptions<EdmMapSingle<T[K]>>;
};
export type EdmComplexType<T> = {
	[K in keyof T]: T[K] extends Array<any> ? EdmSchemaRecordValue<EdmMap<T[K]>> : EdmSchemaRecordValue<EdmMapSingle<T[K]>>;
};
export type EdsSchema<T> = T extends EdmComplexType<any> ? EdmSchemaOptions<T> : EdmSchemaOptions<EdmMapSingle<T>>;

export type AnyEdmType = Edm | Edm[] | EdmComplexType<any>;

export type AnyEdmObject<T = object | Edm | Edm[]> = T extends Edm ? Edm : T extends Array<Edm> ? Edm[] : EdmComplexObject<T>;
