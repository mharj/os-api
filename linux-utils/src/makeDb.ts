import * as path from 'node:path';
import {execFilePromise} from './lib/execFilePromise';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {type ILoggerLike} from '@avanio/logger-like';
import {IMakeDbProps} from './types/IMakeDbProps';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './lib/pathUtils';

const initialProps: Required<IMakeDbProps> & Required<ILinuxSudoOptions> = {
	makedb: '/usr/bin/makedb',
	sudo: false,
	sudoPath: '/usr/bin/sudo',
	sudoUser: 'root',
};

type CommonMakeDbOptions = Partial<ILinuxSudoOptions> & Partial<IMakeDbProps> & {logger?: ILoggerLike};

export function buildMakeDBParams(
	makeDbArgs: string[],
	{makedb, sudo, sudoPath, sudoUser}: Required<ILinuxSudoOptions> & Required<IMakeDbProps>,
): {cmd: string; args: string[]} {
	let args: string[];
	if (sudo) {
		args = [sudoPath, '-u', sudoUser, '-b', makedb, '--quiet', ...makeDbArgs];
	} else {
		args = [makedb, '--quiet', ...makeDbArgs];
	}
	const cmd = args.shift();
	if (!cmd) {
		throw new Error('No command found');
	}
	return {cmd, args};
}

export async function writeMakeDbFile(file: PathLike, content: Buffer, {logger, ...options}: CommonMakeDbOptions): Promise<void> {
	const props = {...initialProps, ...options};
	const {cmd, args} = buildMakeDBParams(['-o', path.resolve(pathLikeToString(file)), '-'], props);
	logger?.debug(`Writing MakeDB file ${file} options: ${JSON.stringify({cmd, args})}`);
	await execFilePromise(cmd, args, content);
}

export async function readMakeDbFile(file: PathLike, {logger, ...options}: CommonMakeDbOptions): Promise<Buffer> {
	const props = {...initialProps, ...options};
	const {cmd, args} = buildMakeDBParams(['-u', path.resolve(pathLikeToString(file))], props);
	logger?.debug(`Reading MakeDB file ${file} options: ${JSON.stringify({cmd, args})}`);
	return execFilePromise(cmd, args);
}
