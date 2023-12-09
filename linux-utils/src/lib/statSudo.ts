import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {Stats} from 'fs';

export async function statSudo(fileName: string, options: ILinuxSudoOptions): Promise<Stats> {
	const [cmd, ...args] = sudoArgs(['stat', '-c', '%n %s %b %f %u %g %D %i %h %t %T %.X %.Y %.Z %.W %o', fileName], options);
	getSudoFileLogger()?.debug('statSudo:', cmd, args);
	const buffer = await execFilePromise(cmd, args);
	const [_name, size, blocks, rawMode, uid, gid, dev, inode, hardlinks, major, minor, access, modified, status, created, sizeHint] = buffer
		.toString()
		.trim()
		.split(' ');
	const linuxModeBitMask = parseInt(rawMode, 16);
	return {
		atime: new Date(parseFloat(access) * 1000),
		atimeMs: parseFloat(access) * 1000,
		birthtime: new Date(parseFloat(created) * 1000),
		birthtimeMs: parseFloat(created) * 1000,
		blksize: parseInt(sizeHint, 10),
		blocks: parseInt(blocks, 10),
		ctime: new Date(parseFloat(status) * 1000),
		ctimeMs: parseFloat(status) * 1000,
		dev: parseInt(dev, 16),
		gid: parseInt(gid, 10),
		ino: parseInt(inode, 10),
		isBlockDevice: () => (linuxModeBitMask & 0o170000) === 0o060000,
		isCharacterDevice: () => (linuxModeBitMask & 0o170000) === 0o020000,
		isDirectory: () => (linuxModeBitMask & 0o170000) === 0o040000,
		isFIFO: () => (linuxModeBitMask & 0o170000) === 0o010000,
		isFile: () => (linuxModeBitMask & 0o170000) === 0o100000,
		isSocket: () => (linuxModeBitMask & 0o170000) === 0o140000,
		isSymbolicLink: () => (linuxModeBitMask & 0o170000) === 0o120000,
		mode: parseInt(rawMode, 16),
		mtime: new Date(parseFloat(modified) * 1000),
		mtimeMs: parseFloat(modified) * 1000,
		nlink: parseInt(hardlinks, 10),
		rdev: parseInt(major, 10) * 256 + parseInt(minor, 10), // calulate rdev from major and minor
		size: parseInt(size, 10),
		uid: parseInt(uid, 10),
	};
}
