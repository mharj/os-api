import {HostEntry} from '../types';

export function hostLineBuilder(entry: HostEntry): string {
	const {address, hostname, aliases, comment} = entry;
	return `${address}\t${hostname} ${aliases.join(' ')}${comment ? ' # ' + comment : ''}`;
}
