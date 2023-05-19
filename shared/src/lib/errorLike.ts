import {IErrorLike} from '../interfaces';

export function toErrorLike(error: unknown): IErrorLike {
	if (!error) {
		return {name: 'Error', message: 'Unknown error'};
	}
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}
	return {
		name: 'Error',
		message: `${JSON.stringify(error)}`,
	};
}
