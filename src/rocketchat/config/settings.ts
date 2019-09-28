import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	botCoreServiceUrl = 'bot_core_service_api_url',
	howManyAttemptsUntilRedirectToHuman = 'how_many_attempts_until_redirect_to_human',
	tryToRedirectFirstToUser = 'try_to_redirect_first_to_user',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.botCoreServiceUrl,
		type: SettingType.STRING,
		packageValue: '',
		value: '',
		required: true,
		public: true,
		i18nLabel: 'bot_core_service_url_label',
		i18nDescription: 'bot_core_service_url_description',
	},
	{
		id: AppSetting.howManyAttemptsUntilRedirectToHuman,
		type: SettingType.NUMBER,
		packageValue: 5,
		value: 5,
		required: true,
		public: true,
		i18nLabel: 'how_many_attempts_until_redirect_to_human_label',
		i18nDescription: 'how_many_attempts_until_redirect_to_human_description',
	},
	{
		id: AppSetting.tryToRedirectFirstToUser,
		type: SettingType.BOOLEAN,
		packageValue: true,
		value: true,
		required: true,
		public: true,
		i18nLabel: 'try_to_redirect_first_to_user_label',
		i18nDescription: 'try_to_redirect_first_to_user_description',
	},
];
