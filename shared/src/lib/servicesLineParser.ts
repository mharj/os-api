import {normalizeLine, splitCommentString} from './common';
import {type ServicesEntry, serviceEntrySchema} from '../types/v1/servicesEntry';
import {type ILoggerLike} from '@avanio/logger-like';

export function parseServicesLine(line: string, logger?: ILoggerLike): ServicesEntry | undefined {
	const input = normalizeLine(line);
	if (!input) {
		logger?.info('Empty line or comment');
		return undefined;
	}
	const [entry, comment] = splitCommentString(input);
	if (!entry) {
		return undefined;
	}
	// split line to service, port/proto and aliases
	let [service, portProto, ...aliases] = entry.split(' ');
	// remove empty aliases
	aliases = aliases.filter((alias) => alias.length > 0);
	// split port and protocol
	const [port, protocol] = portProto?.split('/') || [];
	const status = serviceEntrySchema.safeParse({
		aliases,
		comment: comment?.trim(),
		port: port && parseInt(port, 10),
		protocol,
		service,
	});
	if (status.success) {
		return status.data;
	}
	return undefined;
}
