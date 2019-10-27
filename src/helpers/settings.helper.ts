
import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';

export class SettingsHelper {
	private read: IRead;

	constructor(read: IRead) {
		this.read = read;
	}

	public async getServerSettingById(setting: string): Promise<ISetting> {
		return this.read.getEnvironmentReader().getServerSettings().getOneById(setting);
	}

	public async getAppSettingById(setting: string): Promise<ISetting> {
		return this.read.getEnvironmentReader().getSettings().getById(setting);
	}

	public async getValueOfServerSettingById(setting: string): Promise<any> {
		return this.read.getEnvironmentReader().getServerSettings().getValueById(setting);
	}

	public async getValueOfAppSettingById(setting: string): Promise<any> {
		return this.read.getEnvironmentReader().getSettings().getValueById(setting);
	}
}
