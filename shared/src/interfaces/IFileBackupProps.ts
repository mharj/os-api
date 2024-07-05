export type LinuxBackupPermission = {
	posixMode: number;
};

export type BackupPermission = LinuxBackupPermission;

export type IFileBackupEnabledProps = {
	/** Create a backup of the database file before writing */
	backup: true;
	/** Backup file path */
	backupFile: string;
	/** Optional backup permissions */
	backupPermissions?: BackupPermission;
};

export type IFileBackupDisabledProps = {
	/** Create a backup of the database file before writing */
	backup: false;
	/** Backup file path */
	backupFile?: string;
	/** Optional backup permissions */
	backupPermissions?: BackupPermission;
};

export type IFileBackupProps = IFileBackupEnabledProps | IFileBackupDisabledProps;
