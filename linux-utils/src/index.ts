import {readFileSync, writeFileSync, unlinkSync} from 'fs';
import {execFileSync} from 'child_process';

export interface LinuxFileOptions {
	sudo?: boolean;
	sudoUser?: string | undefined;
}

export function writeFile(fileName: string, content: Buffer, options: LinuxFileOptions = {sudo: false}) {
	if (!options.sudo) {
		return writeFileSync(fileName, content);
	}
	const [cmd, ...args] = sudoArgs(['tee', fileName], options);
	execFileSync(cmd, args, {input: content});
}

export function readFile(fileName: string, options: LinuxFileOptions = {sudo: false}): Buffer {
	if (!options.sudo) {
		return readFileSync(fileName);
	}
	const [cmd, ...args] = sudoArgs(['cat', fileName], options);
	return execFileSync(cmd, args);
}

export function deleteFile(fileName: string, options: LinuxFileOptions = {sudo: false}): void {
	if (!options.sudo) {
		return unlinkSync(fileName);
	}
	const [cmd, ...args] = sudoArgs(['rm', '-f', fileName], options);
	execFileSync(cmd, args);
}

function sudoArgs(args: string[], options: LinuxFileOptions) {
	if (process.platform === 'win32') {
		throw new Error('sudo not supported on Windows');
	}
	if (options.sudoUser) {
		return ['sudo', '-n', '-U', options.sudoUser, ...args];
	}
	return ['sudo', '-n', ...args];
}
