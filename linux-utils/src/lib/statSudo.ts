import {type BigIntStats, type PathLike} from 'node:fs';
import {execFilePromise} from './execFilePromise';
import {type ILinuxSudoOptions} from './sudoUtils';
import {pathLikeToString} from './pathUtils';

function strFloatSecToMilliSecs(float: string): number {
	return Math.round(parseFloat(float) * 1000);
}

function msToNs(ms: number): bigint {
	return BigInt(ms) * 1000000n;
}

export async function statSudo(path: PathLike, options: ILinuxSudoOptions): Promise<BigIntStats> {
	const buffer = await execFilePromise('stat', ['-c', '%n %s %b %f %u %g %D %i %h %t %T %.X %.Y %.Z %.W %o', pathLikeToString(path)], undefined, {
		logFuncName: 'statSudo',
		...options,
	});
	const [_name, size, blocks, rawMode, uid, gid, dev, inode, hardlinks, major, minor, access, modified, status, created, sizeHint] = buffer
		.toString()
		.trim()
		.split(' ');
	const linuxModeBitMask = parseInt(rawMode, 16);
	const atimeMs = strFloatSecToMilliSecs(access);
	const statusMs = strFloatSecToMilliSecs(status);
	const ctimeMs = strFloatSecToMilliSecs(created);
	const mtimeMs = strFloatSecToMilliSecs(modified);
	return {
		atime: new Date(atimeMs),
		atimeMs: BigInt(atimeMs),
		atimeNs: msToNs(atimeMs),
		birthtime: new Date(ctimeMs),
		birthtimeMs: BigInt(ctimeMs),
		birthtimeNs: msToNs(ctimeMs),
		blksize: BigInt(sizeHint),
		blocks: BigInt(blocks),
		ctime: new Date(statusMs),
		ctimeMs: BigInt(statusMs),
		ctimeNs: msToNs(statusMs),
		dev: BigInt(dev),
		gid: BigInt(gid),
		ino: BigInt(inode),
		isBlockDevice: () => (linuxModeBitMask & 0o170000) === 0o060000,
		isCharacterDevice: () => (linuxModeBitMask & 0o170000) === 0o020000,
		isDirectory: () => (linuxModeBitMask & 0o170000) === 0o040000,
		isFIFO: () => (linuxModeBitMask & 0o170000) === 0o010000,
		isFile: () => (linuxModeBitMask & 0o170000) === 0o100000,
		isSocket: () => (linuxModeBitMask & 0o170000) === 0o140000,
		isSymbolicLink: () => (linuxModeBitMask & 0o170000) === 0o120000,
		mode: BigInt(parseInt(rawMode, 16)),
		mtime: new Date(mtimeMs),
		mtimeMs: BigInt(mtimeMs),
		mtimeNs: msToNs(mtimeMs),
		nlink: BigInt(hardlinks),
		rdev: BigInt(parseInt(major, 10) * 256 + parseInt(minor, 10)), // calulate rdev from major and minor
		size: BigInt(size),
		uid: BigInt(uid),
	};
}
