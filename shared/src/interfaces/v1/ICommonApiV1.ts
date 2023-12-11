export interface ICommonApiV1<Entry, FileEntry> {
	list(): Promise<FileEntry[]>;
	delete(value: FileEntry): Promise<boolean>;
	add(value: Entry): Promise<boolean>;
	replace(current: FileEntry, replace: Entry): Promise<boolean>;
}
