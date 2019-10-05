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
import { Analytics } from './src/analytics/analytics';
import { Commands } from './src/commands/commands';
import { CronJobSetup } from './src/config/cron-job-setup';
import { AppSetting, settings } from './src/config/settings';
import { MicroLearningEndpoint } from './src/endpoints/microlearning';
import { LivechatMessageHandler } from './src/handlers/livechat-messages.handler';
import { MicrolearningHandler } from './src/handlers/microlearning.handler';
import { MessageHelper } from './src/helpers/message.helper';
import { RoomHelper } from './src/helpers/room.helper';
import { SettingsHelper } from './src/helpers/settings.helper';
import { StorageHelper } from './src/helpers/storage.helper';
import { UserHelper } from './src/helpers/user.helper';
import { NluSdk } from './src/nlu-sdk/nlu-sdk';

export class ScratchBotApp extends App implements IPostMessageSent {
	private cronJobSetup: CronJobSetup;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
		try {
			if (message.sender.id !== 'rocket.cat') {
				const isLivechatMessage = message.room.type === 'l';
				const nluServiceUrl = (await read.getEnvironmentReader().getSettings().getById(AppSetting.botCoreServiceUrl)).value || 'http://192.168.0.11:5005';
				if (isLivechatMessage) {
					return new LivechatMessageHandler(
						new RoomHelper(read, modify),
						new UserHelper(read),
						new MessageHelper(modify),
						new NluSdk(http, nluServiceUrl),
						new StorageHelper(persistence, read.getPersistenceReader()),
						new SettingsHelper(read))
						.run(message);
				}
				return new MicrolearningHandler(
					new UserHelper(read),
					new RoomHelper(read, modify),
					new MessageHelper(modify),
					new StorageHelper(persistence, read.getPersistenceReader()),
					new Analytics(http),
				).run(message);
			}
		} catch (error) {
			console.log(error);
		}
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		this.cronJobSetup = new CronJobSetup(this.getAccessors().http);
		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

		await configuration.api.provideApi({
			visibility: ApiVisibility.PRIVATE,
			security: ApiSecurity.UNSECURE,
			endpoints: [
				new MicroLearningEndpoint(this),
			],
		});
		const endpoint = this.getAccessors().providedApiEndpoints && this.getAccessors().providedApiEndpoints.length && this.getAccessors().providedApiEndpoints[0].computedPath;
		if (endpoint) {
			const siteUrl = (await environmentRead.getServerSettings().getOneById('Site_Url')).value;
			this.cronJobSetup.setup(`${siteUrl}${endpoint}`);
		}
		await configuration.slashCommands.provideSlashCommand(new Commands());
	}
}
