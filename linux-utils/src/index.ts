import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions, sudoDeleteFile, sudoDeleteFilePromise, sudoReadFile, sudoReadFilePromise, sudoWriteFile, sudoWriteFilePromise} from './sudo';
import {readFileSync, unlinkSync, writeFileSync} from 'fs';
export * from './sudo';

export function writeFile(fileName: string, content: Buffer, options: ILinuxSudoOptions = {sudo: false}) {
	if (options.sudo) {
		return sudoWriteFile(fileName, content, options);
	}
	return writeFileSync(fileName, content);
}

export function readFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Buffer {
	if (options.sudo) {
		return sudoReadFile(fileName, options);
	}
	return readFileSync(fileName);
}

export function deleteFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): void {
	if (options.sudo) {
		return sudoDeleteFile(fileName, options);
	}
	return unlinkSync(fileName);
}

export async function writeFilePromise(fileName: string, content: Buffer, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return sudoWriteFilePromise(fileName, content, options);
	}
	return fsPromise.writeFile(fileName, content);
}

export function readFilePromise(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<Buffer> {
	if (options.sudo) {
		return sudoReadFilePromise(fileName, options);
	}
	return fsPromise.readFile(fileName);
}

export async function deleteFilePromise(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return sudoDeleteFilePromise(fileName, options);
	}
	return fsPromise.unlink(fileName);
}
