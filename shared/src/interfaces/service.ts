import {type INamedService} from './namedService';
import {type IServiceStatus} from './ServiceStatus';

export type ApiServiceV1 = INamedService &
	IServiceStatus & {
		readonly version: 1;
	};

export type IApiService = ApiServiceV1;
