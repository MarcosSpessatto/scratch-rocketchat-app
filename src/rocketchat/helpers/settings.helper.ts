import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';

export class SettingsHelper {
	private read: IRead;

	constructor(read: IRead) {
		this.read = read;
	}

	public async getSettingById(setting: string): Promise<ISetting> {
		return this.read.getEnvironmentReader().getServerSettings().getOneById(setting);
	}
}
