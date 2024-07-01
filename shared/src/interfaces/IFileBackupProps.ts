export type IFileBackupEnabledProps = {
	/** Create a backup of the database file before writing */
	backup: true;
	/** Backup file path */
	backupFile: string;
};

export type IFileBackupDisabledProps = {
	/** Create a backup of the database file before writing */
	backup: false;
	/** Backup file path */
	backupFile?: string;
};

export type IFileBackupProps = IFileBackupEnabledProps | IFileBackupDisabledProps;
