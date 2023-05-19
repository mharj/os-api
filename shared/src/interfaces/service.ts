import {INamedService} from './namedService';
import {IServiceStatus} from './ServiceStatus';

export type ApiServiceV1 = INamedService &
	IServiceStatus & {
		version: 1;
	};

export type IApiService = ApiServiceV1;
