import {NssEntry} from '../types/v1/nsSwitchEntry';

export function nssConfLineBuilder(entry: NssEntry): string {
	const {database, providers} = entry;
	const providerStr = providers
		.map(({provider, action}) => {
			if (action) {
				return `${provider}[${action.status}=${action.action}]`;
			}
			return provider;
		})
		.join(' ');
	return `${database}:\t${providerStr}`;
}
