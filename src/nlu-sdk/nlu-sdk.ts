import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';

export class NluSdk {
	private http: IHttp;
	private url: string;

	constructor(http: IHttp, url: string) {
		this.http = http;
		this.url = url;
	}

	public async parseMessage(message: string): Promise<any> {
		const result = await this.http.post(`${this.url}/model/parse`, {
			data: {
				text: message,
			},
		});
		if (!result) {
			return;
		}
		return result.data;
	}

	public async recognizeMessage(message: string, username: string): Promise<any> {
		const result = await this.http.post(`${this.url}/webhooks/rest/webhook`, {
			data: {
				sender: username,
				message,
			},
		});
		if (!result) {
			return;
		}
		return result.data;
	}
}
