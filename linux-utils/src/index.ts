import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions, sudoDeleteFile, sudoDeleteFilePromise, sudoReadFile, sudoReadFilePromise, sudoWriteFile, sudoWriteFilePromise} from './sudo';
import {readFileSync, unlinkSync, writeFileSync} from 'fs';
export * from './sudo';

/**
 * Write a file to disk, optionally using sudo
 * @param {string} fileName - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
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
 */
export function deleteFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): void {
	if (options.sudo) {
		return sudoDeleteFile(fileName, options);
	}
	return unlinkSync(fileName);
}

/**
 * Async write a file to disk, optionally using sudo
 * @param {string} fileName - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of write
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
 */
export async function deleteFilePromise(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return sudoDeleteFilePromise(fileName, options);
	}
	return fsPromise.unlink(fileName);
}
