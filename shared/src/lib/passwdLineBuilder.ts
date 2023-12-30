import {PasswordEntry} from '../types';

export function passwdLineBuilder(entry: PasswordEntry): string {
	const {username, password, uid, gid, gecos, home, shell} = entry;
	return [username, password, uid.toString(), gid.toString(), gecos, home, shell].join(':');
}
