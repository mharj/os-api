import {EdmSchema} from './edmComplex';
import {Edm} from './edmValue';
import {ErrorLike, errorLikeSchema} from './ErrorLike';

export const errorStatusList = ['online', 'offline', 'error', 'connecting', 'disconnected'] as const;
type ServiceStatus = typeof errorStatusList[number];

interface ServiceStateBase<S extends ServiceStatus = ServiceStatus> {
	status: S;
}

interface ServiceStateError extends ServiceStateBase<'error'> {
	errors: ErrorLike[];
}

export const isSesrivceStateError = (state: ServiceState): state is ServiceStateError => state.status === 'error';

export type ServiceState = ServiceStateBase | ServiceStateError;
