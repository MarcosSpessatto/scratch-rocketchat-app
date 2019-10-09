import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	tryToRedirectFirstToUser = 'try_to_redirect_first_to_user',
	howManyAttemptsUntilRedirectToHuman = 'how_many_attempts_until_redirect_to_human',
	sendMicrolearningToTutor = 'send_microlearning_to_tutor',
	botCoreServiceUrl = 'bot_core_service_api_url',
	analyticsServiceUrl = 'analytics_service_url',
	cronJobServiceUrl = 'cron_job_service_url',
	cronJobServiceFrequency = 'cron_job_service_frequency',
}

export const settings: Array<ISetting> = [
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
	{
		id: AppSetting.sendMicrolearningToTutor,
		type: SettingType.BOOLEAN,
		packageValue: false,
		value: false,
		required: true,
		public: true,
		i18nLabel: 'send_microlearning_to_tutor_label',
		i18nDescription: 'send_microlearning_to_tutor_description',
	},
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
		id: AppSetting.analyticsServiceUrl,
		type: SettingType.STRING,
		packageValue: '',
		value: '',
		required: true,
		public: true,
		i18nLabel: 'analytics_service_url_label',
		i18nDescription: 'analytics_service_url_description',
	},
	{
		id: AppSetting.cronJobServiceUrl,
		type: SettingType.STRING,
		packageValue: '',
		value: '',
		required: true,
		public: true,
		i18nLabel: 'cron_job_service_url_label',
		i18nDescription: 'cron_job_service_url_description',
	},
	{
		id: AppSetting.cronJobServiceFrequency,
		type: SettingType.SELECT,
		packageValue: '{"hour": "*", "minute": "*/1", "day": "*", "day_of_week": "*"}',
		value: '{"hour": "*", "minute": "*/1", "day": "*", "day_of_week": "*"}',
		values: [{
			key: '{"hour": "12", "minute": "0", "day": "*", "day_of_week": "*"}',
			i18nLabel: 'every_day_12_hours_label',
		}, {
			key: '{"hour": "12", "minute": "0", "day": "*", "day_of_week": "3"}',
			i18nLabel: 'every_wednesday_12_label',
		},
		{
			key: '{"hour": "*", "minute": "*/1", "day": "*", "day_of_week": "*"}',
			i18nLabel: 'every_minute_label',
		},
		{
			key: '{"hour": "*/12", "minute": "0", "day": "*", "day_of_week": "*"}',
			i18nLabel: 'every_12_hours_label',
		}],
		required: true,
		public: true,
		i18nLabel: 'cron_job_service_frequency_label',
		i18nDescription: 'cron_job_service_frequency_description',
	},
];
