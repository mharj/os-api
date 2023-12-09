import {ShadowEntry, ShadowFileEntry} from '../../types';

export interface IShadowApiV1 {
	list(): Promise<ShadowFileEntry[]>;
	delete(value: ShadowFileEntry): Promise<boolean>;
	add(value: ShadowEntry): Promise<boolean>;
	replace(current: ShadowFileEntry, replace: ShadowEntry): Promise<void>;
}
