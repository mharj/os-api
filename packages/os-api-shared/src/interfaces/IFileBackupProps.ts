export type LinuxBackupPermission = {
	posixMode: number;
};

export type BackupPermission = LinuxBackupPermission;

export type IFileBackupEnabledProps<Permission extends BackupPermission> = {
	/** Create a backup of the database file before writing */
	backup: true;
	/** Backup file path */
	backupFile: string;
	/** Optional backup permissions */
	backupPermissions?: Permission;
};

export type IFileBackupDisabledProps<Permission extends BackupPermission> = {
	/** Create a backup of the database file before writing */
	backup: false;
	/** Backup file path */
	backupFile?: string;
	/** Optional backup permissions */
	backupPermissions?: Permission;
};

export type IFileBackupProps<Permission extends BackupPermission = BackupPermission> =
	| IFileBackupEnabledProps<Permission>
	| IFileBackupDisabledProps<Permission>;
