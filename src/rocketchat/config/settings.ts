import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	botCoreServiceUrl = 'bot_core_service_api_url',
	howManyTriesUntilSendToHuman = 'how_many_tries_until_send_to_human',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.botCoreServiceUrl,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: true,
		i18nLabel: 'bot_core_service_url_label',
		i18nDescription: 'bot_core_service_url_description',
	},
	{
		id: AppSetting.howManyTriesUntilSendToHuman,
		type: SettingType.NUMBER,
		packageValue: 5,
		required: true,
		public: true,
		i18nLabel: 'how_many_tries_until_send_to_human_label',
		i18nDescription: 'how_many_tries_until_send_to_human_description',
	},
];
