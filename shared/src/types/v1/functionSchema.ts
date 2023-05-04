import {EdmMap} from '../edmValue';
import {EdmSchema, SafeEdmParameterArray} from '../edmComplex';
import {FunctionWithAgs, UnPromisify} from '../utils';

type IFunctionCallV1<T extends FunctionWithAgs, PA = Parameters<T>, RT = UnPromisify<ReturnType<T>>> = {
	params: SafeEdmParameterArray<T, PA>;
	returnType: EdmMap<RT> | EdmSchema<T>;
};

export type IFunctionRecordV1<T extends object> = {[K in keyof T]: T[K] extends FunctionWithAgs ? IFunctionCallV1<T[K]> : never};

/* export type IFunctionRecordV1<T> = {
	[K in keyof T]: T[K] extends FunctionWithAgs ? IFunctionCallV1<T[K]> : never;
};
 */
