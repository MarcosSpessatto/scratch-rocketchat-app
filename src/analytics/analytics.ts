import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { SettingsHelper } from '../helpers/settings.helper';
import { AppSetting } from './../config/settings';
import { IAnalytics, IFrequentlyAskedQuestions, IFrequentWords, IUserWhoAsked, IUserWhoRespond } from './analytics.interface';

export class Analytics implements IAnalytics {
	private http: IHttp;
	private settingsHelper: SettingsHelper;

	constructor(http: IHttp, settingsHelper: SettingsHelper) {
		this.http = http;
		this.settingsHelper = settingsHelper;
	}

	public async findFrequentlyAskedQuestionsByUser(user: IUser): Promise<Array<IFrequentlyAskedQuestions>> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								is_question: true,
							},
						},
					],
				},
			},
			size: 0,
			aggregations: {
				questions: {
					terms: { field: 'text' },
					aggregations: {
						significant_topic_types: {
							significant_terms: { field: 'text' },
						},
					},
				},
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.questions.buckets.map((question) => ({
				question: question.key,
				occurrences: question.doc_count,
			} as IFrequentlyAskedQuestions));
		}
		return [];
	}

	public async findFrequentWordsByUser(user: IUser): Promise<Array<IFrequentWords>> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				frequent_tags: {
					terms: { field: 'tags' },
				},
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.frequent_tags.buckets.map((word) => ({
				word: word.key,
				occurrences: word.doc_count,
			} as IFrequentWords));
		}
		return [];
	}

	public async findQuantityOfSentMessagesInGroupByUser(user: IUser): Promise<number> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								message_origin: 'group',
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				group_messages: { value_count: { field: 'message_origin' } },
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.group_messages.value;
		}
		return 0;
	}

	public async findQuantityOfSentQuestionsInGroupByUser(user: IUser): Promise<number> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								message_origin: 'group',
							},
						},
						{
							match: {
								is_question: true,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				questions: { value_count: { field: 'is_question' } },
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.questions.value;
		}
		return 0;
	}

	public async findQuantityOfSentQuestionsByUser(user: IUser): Promise<number> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								is_question: true,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				questions: { value_count: { field: 'is_question' } },
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.questions.value;
		}
		return 0;
	}

	public async findQuantityOfSentResponsesByUser(user: IUser): Promise<number> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								is_question: false,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				responses: { value_count: { field: 'is_question' } },
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.responses.value;
		}
		return 0;
	}

	public async findQuantityOfSentQuestionsInBotByUser(user: IUser): Promise<number> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								user_id: user.username,
							},
						},
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								message_origin: 'bot',
							},
						},
						{
							match: {
								is_question: true,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				questions: { value_count: { field: 'is_question' } },
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.questions.value;
		}
		return 0;
	}

	public async findUsersWhoAskedMost(): Promise<Array<IUserWhoAsked>> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								is_question: true,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				users: {
					terms: {
						field: 'user_id',
					},
				},
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.users.buckets.map((user) => ({
				username: user.key,
				occurrences: user.doc_count,
			} as IUserWhoAsked));
		}
		return [];
	}

	public async findUsersWhoSentMostResponses(): Promise<Array<IUserWhoRespond>> {
		const query = {
			query: {
				bool: {
					must: [
						{
							match: {
								is_bot: false,
							},
						},
						{
							match: {
								is_question: false,
							},
						},
					],
				},
			},
			size: 0,
			aggs: {
				users: {
					terms: {
						field: 'user_id',
					},
				},
			},
		};
		const response = await this.http.post(`${await this.getAnalyticsBaseUrl()}/_search`, {
			data: query,
		});
		if (response.data) {
			return response.data.aggregations.users.buckets.map((user) => ({
				username: user.key,
				occurrences: user.doc_count,
			} as IUserWhoRespond));
		}
		return [];
	}

	private async getAnalyticsBaseUrl(): Promise<string> {
		return (await this.settingsHelper.getAppSettingById(AppSetting.analyticsServiceUrl)).value;
	}
}
