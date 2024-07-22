import {type BuilderOptions, ws} from '../types/builderOptions';
import {type ServicesEntry} from '../types/v1/servicesEntry';

const defaultOptions: BuilderOptions = {
	commentsDisabled: false,
	spaceCount: 4,
	useTabs: false,
};

export function servicesLineBuilder(entry: ServicesEntry, options: BuilderOptions = {}) {
	const opt = {...defaultOptions, ...options};
	let output = `${entry.service}${ws(opt)}${entry.port.toString()}/${entry.protocol}`;
	// aliases
	if (entry.aliases.length > 0 && !opt.commentsDisabled) {
		output += ` ${entry.aliases.join('')}`;
	}
	// comment
	if (entry.comment && !opt.commentsDisabled) {
		output += ` # ${entry.comment}`;
	}
	return output;
}
