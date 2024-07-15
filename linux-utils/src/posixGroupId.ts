import {assertPosixPlatform} from './lib/platform';
import {execFilePromise} from './lib/execFilePromise';
import type {PosixGroupInput} from './types/posixCommon';

const idCommandError = 'id command not supported on Windows';

/**
 * Get effective group id
 * @param value - Group name or id
 * @returns {Promise<bigint>} - Promise of the group id
 */
export async function posixGroupId(value: PosixGroupInput): Promise<bigint> {
	assertPosixPlatform(idCommandError);
	const data = await execFilePromise('id', ['-g', value.toString()]);
	return BigInt(data.toString().trim());
}

/**
 * Get group name from group id or name
 * @param value - Group name or id
 * @returns {Promise<string>} - Promise of the group name
 */
export async function posixGroupName(value: PosixGroupInput): Promise<string> {
	assertPosixPlatform(idCommandError);
	const data = await execFilePromise('id', ['-ng', value.toString()]);
	return data.toString().trim();
}
