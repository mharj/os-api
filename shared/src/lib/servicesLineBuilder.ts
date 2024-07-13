import {type BuilderOptions, ws} from '../types/builderOptions';
import {type ServiceEntry} from '../types/v1/servicesEntry';

const defaultOptions: BuilderOptions = {
	commentsDisabled: false,
	spaceCount: 4,
	useTabs: false,
};

export function servicesLineBuilder(entry: ServiceEntry, options: BuilderOptions = {}) {
	const opt = {...defaultOptions, ...options};
	if (entry.aliases.length > 0 && !opt.commentsDisabled) {
		return `${entry.service}${ws(opt)}${entry.port.toString()}/${entry.protocol} ${entry.aliases.join(' ')}${entry.comment ? ' # ' + entry.comment : ''}`;
	}
	return `${entry.service}${ws(opt)}${entry.port.toString()}/${entry.protocol}`;
}
