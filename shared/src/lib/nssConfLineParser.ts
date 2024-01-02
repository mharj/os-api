import {NssEntry, NssEntryProvider, NssEntryProviderAction, nssEntryProviderActionSchema, nssEntrySchema} from '../types/v1/nsSwitchEntry';
import {getErrorStr} from './zodError';
import {ILoggerLike} from '@avanio/logger-like';
import {isComment} from './common';

/**
 * extract "[STATUS=ACTION]" from provider
 */
function extractAction(value: string): NssEntryProviderAction | undefined {
	const [status, action] = value.slice(1, -1).split('=');
	return nssEntryProviderActionSchema.parse({status, action});
}

export function parseNssConfLine(line: string, logger?: ILoggerLike): NssEntry | undefined {
	const input = line.trim();
	if (isComment(input)) {
		return undefined;
	}
	if (input.length === 0) {
		return undefined;
	}
	const [database, raw] = input.split(':', 2);
	// remove extra whitespace to single space and split on space
	const rawProviderData = raw?.replace(/\s+/g, ' ').trim().split(' ') || [];

	const providers = rawProviderData.reduce<NssEntryProvider[]>((data, provider, idx) => {
		const next = rawProviderData[idx + 1];
		// check and build provider action
		if (next?.startsWith('[')) {
			data.push({provider, action: extractAction(next)});
		} else {
			// we already have a provider action, so skip this one
			if (!provider.startsWith('[')) {
				data.push({provider});
			}
		}
		return data;
	}, []);

	const rawData = {
		database,
		providers,
	};
	const status = nssEntrySchema.safeParse(rawData);
	if (!status.success) {
		logger?.info(`Invalid nss line: ${getErrorStr(status, rawData)}`);
		return undefined;
	}
	return status.data;
}
