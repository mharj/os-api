import * as fsPromise from 'fs/promises';
import {accessSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import {
	ILinuxSudoOptions,
	sudoAccessFile,
	sudoAccessFilePromise,
	sudoDeleteFile,
	sudoDeleteFilePromise,
	sudoReadFile,
	sudoReadFilePromise,
	sudoWriteFile,
	sudoWriteFilePromise,
} from './sudo';
export * from './sudo';
export * from './execFilePromise';

/**
 *
 * @param fileName - The file to access
 * @param mode - The mode to access the file with
 * @param options - Options for sudo
 * @throws {Error} - If the file cannot be accessed
 * @returns void
 * @example
 * accessFile('./test.txt', fs.constants.R_OK, {sudo: true});
 */
export function accessFile(fileName: string, mode?: number, options: ILinuxSudoOptions = {sudo: false}): void {
	if (options?.sudo) {
		return sudoAccessFile(fileName, mode, options);
	}
	return accessSync(fileName, mode);
}

/**
 * Write a file to disk, optionally using sudo
 * @param {string} fileName - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @example
 * writeFile('./test.txt', Buffer.from('demo'), {sudo: true});
 */
export function writeFile(fileName: string, content: Buffer, options: ILinuxSudoOptions = {sudo: false}): void {
	if (options.sudo) {
		return sudoWriteFile(fileName, content, options);
	}
	return writeFileSync(fileName, content);
}

/**
 * Read a file from disk, optionally using sudo
 * @param {string} fileName - The file to read
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Buffer} - The file contents
 * @example
 * const buffer = readFile('./test.txt', {sudo: true});
 */

export function readFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Buffer {
	if (options.sudo) {
		return sudoReadFile(fileName, options);
	}
	return readFileSync(fileName);
}

/**
 * Delete a file from disk, optionally using sudo
 * @param {string} fileName - The file to delete
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @example
 * deleteFile('./test.txt', {sudo: true});
 */
export function deleteFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): void {
	if (options.sudo) {
		return sudoDeleteFile(fileName, options);
	}
	return unlinkSync(fileName);
}

/**
 * Async access a file on disk, optionally using sudo
 * @param fileName - The file to access
 * @param mode - The mode to access the file with
 * @param options - Options for sudo
 * @throws {Error} - If the file cannot be accessed
 * @returns Promise<void>
 * @example
 * await accessFilePromise('./test.txt', fs.constants.R_OK, {sudo: true});
 */
export function accessFilePromise(fileName: string, mode?: number, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options?.sudo) {
		return sudoAccessFilePromise(fileName, mode, options);
	}
	return fsPromise.access(fileName, mode);
}

/**
 * Async write a file to disk, optionally using sudo
 * @param {string} fileName - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of write
 * @example
 * await writeFilePromise('./test.txt', Buffer.from('demo'), {sudo: true});
 */
export async function writeFilePromise(fileName: string, content: Buffer, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return sudoWriteFilePromise(fileName, content, options);
	}
	return fsPromise.writeFile(fileName, content);
}

/**
 * Async read a file from disk, optionally using sudo
 * @param {string} fileName - The file to read
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<Buffer>} - Promise of the file content
 * @example
 * const buffer = await readFilePromise('./test.txt', {sudo: true});
 */
export function readFilePromise(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<Buffer> {
	if (options.sudo) {
		return sudoReadFilePromise(fileName, options);
	}
	return fsPromise.readFile(fileName);
}

/**
 * Async delete a file from disk, optionally using sudo
 * @param {string} fileName - The file to delete
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of delete
 * @example
 * await deleteFilePromise('./test.txt', {sudo: true});
 */
export async function deleteFilePromise(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return sudoDeleteFilePromise(fileName, options);
	}
	return fsPromise.unlink(fileName);
}
