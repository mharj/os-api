import * as fs from 'fs';
import {AbstractLinuxHosts, HostEntry, IErrorLike, isValidLine, parseHostLine, ServiceStatusObject} from '@avanio/os-api-shared';
import {accessFilePromise, ILinuxSudoOptions, readFilePromise, writeFilePromise} from '@avanio/os-api-linux-utils';
import {ILoggerLike} from '@avanio/logger-like';

interface LinuxHostsProps {
	file?: string;
}

const initialProps = {
	file: '/etc/hosts',
	sudo: false,
} satisfies Required<LinuxHostsProps> & ILinuxSudoOptions;

export class LinuxHosts extends AbstractLinuxHosts {
	public readonly name = 'LinuxHostsFile';
	public props: Required<LinuxHostsProps> & ILinuxSudoOptions;
	private logger?: ILoggerLike;

	constructor(props: LinuxHostsProps & ILinuxSudoOptions, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await accessFilePromise(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no hosts file ${this.props.file} found or write access denied`});
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

	protected toOutput(value: HostEntry): string {
		const comment = value.comment ? ` # ${value.comment}` : '';
		return `${value.address} ${value.hostname} ${value.aliases.join(' ')}${comment}`;
	}

	protected fromOutput(value: string): HostEntry | undefined {
		if (isValidLine(value)) {
			return parseHostLine(value, this.logger);
		}
		return undefined;
	}

	protected async storeOutput(value: string[]): Promise<void> {
		return writeFilePromise(this.props.file, Buffer.from(value.join('\n')), this.props);
	}

	protected async loadOutput(): Promise<string[]> {
		return (await readFilePromise(this.props.file, this.props)).toString().split('\n');
	}
}
