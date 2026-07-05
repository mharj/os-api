import type {HostEntry} from '../types';
import {type BuilderOptions, ws} from '../types/builderOptions';

const defaultOptions: BuilderOptions = {
	commentsDisabled: false,
	spaceCount: 4,
	useTabs: true,
};

export function hostLineBuilder(entry: HostEntry, options: BuilderOptions = {}): string {
	const opt = {...defaultOptions, ...options};
	const {address, hostname, aliases, comment} = entry;
	const commentStr = comment && !opt.commentsDisabled ? ` # ${comment}` : '';
	if (aliases.length > 0 && !opt.commentsDisabled) {
		return `${address}${ws(opt)}${hostname} ${aliases.join(' ')}${commentStr}`;
	}
	return `${address}${ws(opt)}${hostname}}${commentStr}`;
}
