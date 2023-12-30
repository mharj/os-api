import {LinuxPasswordType} from '../types/passwd';

export function getPasswordType(password: string): LinuxPasswordType {
	if (password === 'x') {
		return 'shadow';
	}
	if (password.startsWith('$6$')) {
		return 'sha512';
	}
	if (password.startsWith('$5$')) {
		return 'sha256';
	}
	if (password.startsWith('$1$')) {
		return 'md5';
	}
	if (password.startsWith('$2$')) {
		return 'bcrypt';
	}
	if (password.startsWith('$2a$')) {
		return 'bcrypt';
	}
	if (password.startsWith('$2b$')) {
		return 'bcrypt';
	}
	if (password.length === 0) {
		return 'empty';
	}
	// check des crypt from length
	if (password.length === 13) {
		return 'des';
	}
	throw new TypeError(`Unknown password type: ${password}`);
}
