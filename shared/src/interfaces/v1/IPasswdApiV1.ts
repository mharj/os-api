import {PasswordEntry, PasswordFileEntry} from '../../types';

export interface IPasswdApiV1 {
	list(): Promise<PasswordFileEntry[]>;
	delete(value: PasswordFileEntry): Promise<boolean>;
	add(value: PasswordEntry): Promise<boolean>;
	replace(current: PasswordFileEntry, replace: PasswordEntry): Promise<void>;
}
