import * as path from 'node:path';
import {execFilePromise} from './lib/execFilePromise';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {type ILoggerLike} from '@avanio/logger-like';
import {type IMakeDbProps} from './types/IMakeDbProps';
import {type PathLike} from 'node:fs';
import {pathLikeToString} from './lib/pathUtils';

const initialProps: Required<IMakeDbProps> & Required<ILinuxSudoOptions> = {
	makedb: '/usr/bin/makedb',
	sudo: false,
	sudoPath: '/usr/bin/sudo',
	sudoUser: 'root',
};

type CommonMakeDbOptions = Partial<ILinuxSudoOptions> & Partial<IMakeDbProps> & {logger?: ILoggerLike};

export function buildMakeDBParams(makeDbArgs: string[], {makedb}: Required<IMakeDbProps>): [string, string, ...string[]] {
	return [makedb, '--quiet', ...makeDbArgs];
}

export async function writeMakeDbFile(file: PathLike, content: Buffer, {logger, ...options}: CommonMakeDbOptions): Promise<void> {
	const props = {...initialProps, ...options};
	const [cmd, ...args] = buildMakeDBParams(['-o', path.resolve(pathLikeToString(file)), '-'], props);
	logger?.debug(`Writing MakeDB file ${file} options: ${JSON.stringify({cmd, args})}`);
	await execFilePromise(cmd, args, content, {logFuncName: 'writeMakeDbFile', ...options});
}

export async function readMakeDbFile(file: PathLike, {logger, ...options}: CommonMakeDbOptions): Promise<Buffer> {
	const props = {...initialProps, ...options};
	const [cmd, ...args] = buildMakeDBParams(['-u', path.resolve(pathLikeToString(file))], props);
	logger?.debug(`Reading MakeDB file ${file} options: ${JSON.stringify({cmd, args})}`);
	return execFilePromise(cmd, args, undefined, {logFuncName: 'readMakeDbFile', ...options});
}
