import {type HostEntry} from '../types';

export function hostLineBuilder(entry: HostEntry): string {
	const {address, hostname, aliases, comment} = entry;
	if (aliases.length > 0) {
		return `${address}\t${hostname} ${aliases.join(' ')}${comment ? ' # ' + comment : ''}`;
	}
	return `${address}\t${hostname}}${comment ? ' # ' + comment : ''}`;
}
