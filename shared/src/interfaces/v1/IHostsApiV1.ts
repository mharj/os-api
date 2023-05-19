import {HostEntry, HostFileEntry} from '../../types/v1/hostEntry';

export interface IHostsApiV1 {
	list(): Promise<HostFileEntry[]>;
	delete(value: HostFileEntry): Promise<boolean>;
	add(value: HostEntry): Promise<boolean>;
}
