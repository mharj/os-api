/**
 * Entity Data Model Primitive Type
 *
 * https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/entity-data-model-primitive-data-types
 */
export enum Edm {
	Binary = 'Edm.Binary',
	Boolean = 'Edm.Boolean',
	Byte = 'Edm.Byte',
	DateTime = 'Edm.DateTime',
	DateTimeOffset = 'Edm.DateTimeOffset',
	Decimal = 'Edm.Decimal',
	Double = 'Edm.Double',
	Float = 'Edm.Float',
	Guid = 'Edm.Guid',
	Int16 = 'Edm.Int16',
	Int32 = 'Edm.Int32',
	Int64 = 'Edm.Int64',
	SByte = 'Edm.SByte',
	String = 'Edm.String',
	Time = 'Edm.Time',
}

export type EdmString = Edm.String;
export type EdmNumber = Edm.Int16 | Edm.Int32 | Edm.Decimal | Edm.Float | Edm.Double | Edm.Int64 | Edm.SByte;

export type EdmBoolean = Edm.Boolean;

export type EdmMapSingle<T> = T extends string ? EdmString : T extends number ? EdmNumber : T extends boolean ? EdmBoolean : never;
export type EdmMapArray<T extends Array<any>> = {[K in keyof T]: EdmMapSingle<T[K]>};
export type EdmMap<T> = T extends Array<any> ? EdmMapArray<T> : EdmMapSingle<T>;
