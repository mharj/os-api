import {assertNotWindowPlatform} from './lib/platformUtils';
import {execFilePromise} from './lib/execFilePromise';
import type {PosixAccountInput} from './types/posixCommon';

const idCommandError = 'id command not supported on Windows';

/**
 * Get effective user id
 * @param value - User name or id
 * @returns {Promise<bigint>} - Promise of the user id
 */
export async function posixAccountId(value: PosixAccountInput): Promise<bigint> {
	assertNotWindowPlatform(idCommandError);
	const data = await execFilePromise('id', ['-u', value.toString()]);
	return BigInt(data.toString().trim());
}

export async function posixAccountName(value: PosixAccountInput): Promise<string> {
	assertNotWindowPlatform(idCommandError);
	const data = await execFilePromise('id', ['-nu', value.toString()]);
	return data.toString().trim();
}
