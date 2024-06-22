export interface IFileBackupProps {
	/** Create a backup of the database file before writing */
	backup: boolean;
	/** Backup file path */
	backupFile: string;
}
