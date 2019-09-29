import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';

export class CronJobSetup {
	private http: IHttp;
	private CRON_NAME: string = 'rocketchat-scratch';

	constructor(http: IHttp, ) {
		this.http = http;
	}

	public async setup(endpoint: string): Promise<void> {
		try {
			const response = await this.http.get('http://192.168.0.11:8888/api/v1/jobs');
			const { jobs } = response.data;
			const rcJobExists = jobs && jobs.filter((job) => job.name === this.CRON_NAME);
			if (!rcJobExists || !rcJobExists.length) {
				await this.createCronJob(endpoint);
			}
		} catch (error) {
			console.log(error);
		}
	}

	private async createCronJob(endpoint: string): Promise<void> {
		await this.http.post('http://192.168.0.11:8888/api/v1/jobs', {
			data: {
				job_class_string: 'simple_scheduler.jobs.curl_job.CurlJob',
				name: this.CRON_NAME,
				pub_args: [endpoint, 'GET'],
				month: '*',
				day_of_week: '*',
				day: '*',
				hour: '*/1',
				minute: '*',
			},
		});
	}
}