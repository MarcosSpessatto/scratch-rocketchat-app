import {
	IAppAccessors,
	IConfigurationExtend,
	IConfigurationModify,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { CronJobSetup } from './src/rocketchat/config/cron-job-setup';
import { AppSetting, settings } from './src/rocketchat/config/settings';
import { MicroLearningEndpoint } from './src/rocketchat/endpoints/microlearning';
import { LivechatMessageHandler } from './src/rocketchat/handlers/livechat-messages.handler';
import { MessageHelper } from './src/rocketchat/helpers/message.helper';
import { RoomHelper } from './src/rocketchat/helpers/room.helper';
import { SettingsHelper } from './src/rocketchat/helpers/settings.helper';
import { StorageHelper } from './src/rocketchat/helpers/storage.helper';
import { UserHelper } from './src/rocketchat/helpers/user.helper';
import { NluSdk } from './src/rocketchat/nlu-sdk/nlu-sdk';

export class ScratchBotApp extends App implements IPostMessageSent {
	private cronJobSetup: CronJobSetup;
	private acessors: IAppAccessors;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger);
		this.cronJobSetup = new CronJobSetup(accessors.http);
		this.acessors = accessors;
	}

	public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
		try {
			if (message.sender.id !== 'rocket.cat') {
				const isLivechatMessage = message.room.type === 'l';
				const nluServiceUrl = (await read.getEnvironmentReader().getSettings().getById(AppSetting.botCoreServiceUrl)).value || 'http://192.168.0.11:5005';
				if (isLivechatMessage) {
					new LivechatMessageHandler(
						new RoomHelper(read, modify),
						new UserHelper(read),
						new MessageHelper(modify),
						new NluSdk(http, nluServiceUrl),
						new StorageHelper(persistence, read.getPersistenceReader()),
						new SettingsHelper(read))
						.run(message);
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

		await configuration.api.provideApi({
			visibility: ApiVisibility.PRIVATE,
			security: ApiSecurity.UNSECURE,
			endpoints: [
				new MicroLearningEndpoint(this),
			],
		});
		const endpoint = this.acessors.providedApiEndpoints && this.acessors.providedApiEndpoints.length && this.acessors.providedApiEndpoints[0].computedPath;
		if (endpoint) {
			const siteUrl = 'http://192.168.0.11:3000'; // (await environmentRead.getServerSettings().getOneById('Site_Url')).value;
			this.cronJobSetup.setup(`${siteUrl}${endpoint}`);
		}
	}
}
