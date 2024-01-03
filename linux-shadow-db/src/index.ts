import * as fs from 'fs';
import * as path from 'path';
import {AbstractLinuxShadow, IErrorLike, isValidLine, parseShadowLine, ServiceStatusObject, ShadowEntry, shadowLineBuilder} from '@avanio/os-api-shared';
import {access, copyFile, execFilePromise, ILinuxSudoOptions} from '@avanio/os-api-linux-utils';
import {ILoggerLike} from '@avanio/logger-like';

type LinuxShadowDbProps = {
	/**
	 * NSS database file path
	 *
	 * @default '/var/lib/misc/shadow.db' as for Debian/Ubuntu based systems.
	 */
	file?: string;
	/**
	 * Makedb command path
	 * @default '/usr/bin/makedb'
	 */
	makedb?: string;
	/**
	 * Create a backup of the database file before writing
	 */
	backup?: boolean;
	/**
	 * Backup file path
	 *
	 * @default '/var/lib/misc/shadow.db.bak'
	 */
	backupFile?: string;
};

const initialProps: Required<LinuxShadowDbProps> & ILinuxSudoOptions = {
	backup: false,
	backupFile: '/var/lib/misc/shadow.db.bak',
	file: '/var/lib/misc/shadow.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
};

export class LinuxShadowDb extends AbstractLinuxShadow {
	public readonly name = 'LinuxShadowDb';
	private logger?: ILoggerLike;
	public props: Required<LinuxShadowDbProps> & ILinuxSudoOptions;
	constructor(props: LinuxShadowDbProps & ILinuxSudoOptions, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await access(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no db file ${this.props.file} found or write access denied`});
		}
		try {
			// check if we can access the makedb executable and have execute access
			await access(this.props.makedb, fs.constants.X_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no makedb executable found from ${this.props.makedb} or access denied`});
		}
		if (errors.length > 0) {
			return {
				status: 'error',
				errors,
			};
		} else {
			return {
				status: 'online',
			};
		}
	}

	protected toOutput(value: ShadowEntry): string {
		return shadowLineBuilder(value);
	}

	protected fromOutput(value: string): ShadowEntry | undefined {
		if (isValidLine(value)) {
			return parseShadowLine(value, this.logger);
		}
		return undefined;
	}

	protected async verifyWrite(value: ShadowEntry): Promise<boolean> {
		const line = this.toOutput(value);
		return (await this.listRaw()).some((v) => v === line);
	}

	protected async storeOutput(value: string[]): Promise<void> {
		if (this.props.backup) {
			this.logger?.debug(`${this.name}::backup`, this.props.backupFile);
			await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
		}
		const {cmd, args} = this.buildExecParams(['--quiet', '-o', path.resolve(this.props.file), '-']);
		this.logger?.debug(`${this.name}::storeOutput:`, cmd, args);
		await execFilePromise(cmd, args, Buffer.from(value.join('\n')));
	}

	protected async loadOutput(): Promise<string[]> {
		const {cmd, args} = this.buildExecParams(['--quiet', '-u', path.resolve(this.props.file)]);
		this.logger?.debug(`${this.name}::loadOutput:`, cmd, args);
		const data = await execFilePromise(cmd, args);
		return data
			.toString()
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
	}

	private buildExecParams(args: string[]): {cmd: string; args: string[]} {
		const newArgs = [this.props.makedb, ...args];
		if (this.props.sudo) {
			newArgs.unshift('sudo', '-b'); // add sudo and sudo background mode
		}
		const cmd = newArgs.shift();
		if (!cmd) {
			throw new Error('No command found');
		}
		return {cmd, args: newArgs};
	}
}
