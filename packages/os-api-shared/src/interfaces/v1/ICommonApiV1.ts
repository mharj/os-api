/**
 * Common API v1 interface for Linux NSS databases
 * @template InputEntry - entry type for input
 * @template OutputEntry - entry type for output, defaults to InputEntry
 */
export interface ICommonApiV1<InputEntry, OutputEntry = InputEntry> {
	createDatabase(): Promise<boolean>;
	deleteDatabase(): Promise<boolean>;
	list(): Promise<OutputEntry[]>;
	delete(value: OutputEntry): Promise<boolean>;
	add(value: InputEntry): Promise<boolean>;
	replace(current: OutputEntry, replace: InputEntry): Promise<boolean>;
	count(): Promise<number>;
}
