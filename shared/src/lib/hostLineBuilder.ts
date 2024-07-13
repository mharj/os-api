import {type BuilderOptions, ws} from '../types/builderOptions';
import {type HostEntry} from '../types';

const defaultOptions: BuilderOptions = {
	commentsDisabled: false,
	spaceCount: 4,
	useTabs: true,
};

export function hostLineBuilder(entry: HostEntry, options: BuilderOptions = {}): string {
	const opt = {...defaultOptions, ...options};
	const {address, hostname, aliases, comment} = entry;
	if (aliases.length > 0 && !opt.commentsDisabled) {
		return `${address}${ws(opt)}${hostname} ${aliases.join(' ')}${comment ? ' # ' + comment : ''}`;
	}
	return `${address}${ws(opt)}${hostname}}${comment ? ' # ' + comment : ''}`;
}
