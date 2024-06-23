import {type ShadowEntry} from '../types/v1/shadowEntry';

export function shadowLineBuilder(entry: ShadowEntry): string {
	const {username, password, changed, min, max, warn, inactive, expire, reserved} = entry;
	return [
		username,
		password,
		changed.toString(),
		min.toString(),
		max.toString(),
		warn.toString(),
		inactive?.toString() ?? '',
		expire?.toString() ?? '',
		reserved ?? '',
	].join(':');
}
