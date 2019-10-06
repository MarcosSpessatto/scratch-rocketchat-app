import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { SettingsHelper } from './../helpers/settings.helper';
import { AppSetting } from './settings';

export class CronJobSetup {
	private http: IHttp;
	private settingsHelper: SettingsHelper;
	private CRON_NAME: string = 'rocketchat-scratch';

	constructor(http: IHttp, settingsHelper: SettingsHelper) {
		this.http = http;
		this.settingsHelper = settingsHelper;
	}

	public async setup(endpoint: string, settingValue: string): Promise<void> {
		try {
			const response = await this.http.get(`${await this.getBaseUrl()}/api/v1/jobs`);
			const { jobs } = response.data;
			const rcJobExists = jobs && jobs.filter((job) => job.name === this.CRON_NAME);
			if (!rcJobExists || !rcJobExists.length) {
				await this.createCronJob(endpoint, settingValue);
			}
			await this.updateCronJob(endpoint, settingValue);
		} catch (error) {
			console.log(error);
		}
	}

	private async updateCronJob(endpoint: string, settingValue: string): Promise<any> {
		const response = await this.http.get(`${await this.getBaseUrl()}/api/v1/jobs`);
		const { jobs } = response.data;
		const rcJob = jobs && jobs.find((job) => job.name === this.CRON_NAME);
		if (rcJob) {
			return await this.http.put(`${await this.getBaseUrl()}/api/v1/jobs/${rcJob.job_id}`, {
				data: {
					job_class_string: 'simple_scheduler.jobs.curl_job.CurlJob',
					name: this.CRON_NAME,
					pub_args: [endpoint, 'GET'],
					month: '*',
					...JSON.parse(settingValue),
				},
			});
		}
	}

	private async createCronJob(endpoint: string, settingValue: string): Promise<any> {
		return await this.http.post(`${await this.getBaseUrl()}/api/v1/jobs`, {
			data: {
				job_class_string: 'simple_scheduler.jobs.curl_job.CurlJob',
				name: this.CRON_NAME,
				pub_args: [endpoint, 'GET'],
				month: '*',
				...JSON.parse(settingValue),
			},
		});
	}

	private async getBaseUrl(): Promise<string> {
		return (await this.settingsHelper.getAppSettingById(AppSetting.cronJobServiceUrl)).value;
	}
}
