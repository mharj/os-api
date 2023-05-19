export const serviceStatusList = ['online', 'offline', 'error', 'connecting', 'disconnected'] as const;
export type ServiceStatusType = (typeof serviceStatusList)[number];

type ServiceStatusBaseObject = {
	status: Omit<ServiceStatusType, 'error'>;
	message?: string;
};

type ServiceStatusErrorObject = {
	status: 'error';
	message?: string;
	error: Error;
};

export type ServiceStatusObject = ServiceStatusBaseObject | ServiceStatusErrorObject;

export interface IServiceStatus {
	status(): Promise<ServiceStatusObject>;
}
