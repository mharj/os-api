import {IFunctionRecordV1} from '../types/v1/functionSchema';

interface IApiServiceV1<Func extends object> {
	name: string;
	version: 1;
	metadata: {
		functions: IFunctionRecordV1<Func>;
	};
}

export type IApiService<Func extends object> = IApiServiceV1<Func>;
