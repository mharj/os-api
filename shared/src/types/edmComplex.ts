import {Edm, EdmBoolean, EdmMap, EdmNumber, EdmString} from './edmValue';
import {FunctionWithAgs, UnPromisify} from './utils';
import {IFunctionRecordV1} from './v1/functionSchema';

type EdmSchemaValue<T> = {
	type: EdmMap<T>;
	nullable?: boolean;
};

type EdmParameterValue<T, P, N = string> = {
	type: EdmMap<P> | EdmSchema<T>;
	name: N;
	nullable?: boolean;
};

export type EdmSchema<T> = {[K in keyof T]: T extends object ? EdmSchemaValue<T[K]> : never};
export type EdmParameter<T extends object> = {[K in keyof T]: EdmParameterValue<T, T[K]>};

type EdmParameterArray<T extends FunctionWithAgs, PA = Parameters<T>> = {[K in keyof PA]: EdmParameterValue<T, PA[K]>};
export type SafeEdmParameterArray<T extends FunctionWithAgs, PA = Parameters<T>> = PA extends never[] ? undefined : EdmParameterArray<T, PA>;

/*
type EdmFunctionSchema<T extends FunctionWithAgs, PA = Parameters<T>, RT = UnPromisify<ReturnType<T>>> = {
	params: SafeEdmParameterArray<T, PA>;
	returnType: EdmMap<RT> | EdmSchema<T>;
};
type EdmFunctionObject<T extends object> = {[K in keyof T]: T[K] extends FunctionWithAgs ? EdmFunctionSchema<T[K]> : never}; 
*/

interface IHostEntry {
	address: string;
	hostname: string;
	aliases: string[];
}

const hostDataSchema: EdmSchema<IHostEntry> = {
	address: {type: Edm.String, nullable: false},
	hostname: {type: Edm.String, nullable: false},
	aliases: {type: [Edm.String], nullable: false},
};

interface IHostsApiFunctions {
	list(asd: string): Promise<IHostEntry[]>;
	list2(): Promise<IHostEntry[]>;
	add(hsot: IHostEntry[]): Promise<boolean>;
}

export const functionSchema: IFunctionRecordV1<IHostsApiFunctions> = {
	list2: {params: undefined, returnType: [hostDataSchema]},
	list: {params: [{type: Edm.String, name: 'all', nullable: false}], returnType: [hostDataSchema]},
	add: {params: [{type: hostDataSchema, name: 'all', nullable: false}], returnType: Edm.Boolean},
};
