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
import { IMessage, IPostMessageDeleted, IPostMessageSent, IPreMessageUpdatedPrevent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Analytics } from './src/analytics/analytics';
import { Commands } from './src/commands/commands';
import { CronJobSetup } from './src/config/cron-job-setup';
import { AppSetting, settings } from './src/config/settings';
import { MicroLearningEndpoint } from './src/endpoints/microlearning';
import { ChannelHandler } from './src/handlers/channel.handler';
import { DeletedMessagesHandler } from './src/handlers/deleted-messages.handler';
import { LivechatMessageHandler } from './src/handlers/livechat-messages.handler';
import { MicrolearningHandler } from './src/handlers/microlearning.handler';
import { UpdatedMessagesHandler } from './src/handlers/updated-messages.handler';
import { MessageHelper } from './src/helpers/message.helper';
import { RoomHelper } from './src/helpers/room.helper';
import { SettingsHelper } from './src/helpers/settings.helper';
import { StorageHelper } from './src/helpers/storage.helper';
import { UserHelper } from './src/helpers/user.helper';
import { NluSdk } from './src/nlu-sdk/nlu-sdk';

export class ScratchBotApp extends App implements IPostMessageSent, IPostMessageDeleted, IPreMessageUpdatedPrevent {
	private cronJobSetup: CronJobSetup;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
		try {
			if (message.sender.id !== 'rocket.cat') {
				const isLivechatMessage = message.room.type === 'l';
				const nluServiceUrl = (await read.getEnvironmentReader().getSettings().getById(AppSetting.botCoreServiceUrl)).value;
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
				if (message.room.type === 'd') {
					if (!message.sender.roles.some((role) => role === 'tutor' || role === 'teacher' || role === 'admin')) {
						return new LivechatMessageHandler(
							new RoomHelper(read, modify),
							new UserHelper(read),
							new MessageHelper(modify),
							new NluSdk(http, nluServiceUrl),
							new StorageHelper(persistence, read.getPersistenceReader()),
							new SettingsHelper(read))
							.run(message);
					} else {
						return new MicrolearningHandler(
							new UserHelper(read),
							new MessageHelper(modify),
							new StorageHelper(persistence, read.getPersistenceReader()),
							new Analytics(http, new SettingsHelper(read)),
						).run(message);
					}
				}
				if (message.room.type === 'c') {
					return new ChannelHandler(
						new NluSdk(http, nluServiceUrl),
						new RoomHelper(read, modify),
						new StorageHelper(persistence, read.getPersistenceReader()))
						.run(message);
				}
			}
		} catch (error) {
			this.getLogger().error(error);
		}
	}

	public async executePostMessageDeleted(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
		return new DeletedMessagesHandler(new StorageHelper(persistence, read.getPersistenceReader())).run(message);
	}

	public async executePreMessageUpdatedPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
		await new UpdatedMessagesHandler(new StorageHelper(persistence, read.getPersistenceReader())).run(message);
		return false;
	}

	public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
		try {
			if (setting.id !== AppSetting.cronJobServiceUrl && setting.id !== AppSetting.cronJobServiceFrequency) {
				return;
			}
			const cronJobUrl = (await read.getEnvironmentReader().getSettings().getById(AppSetting.cronJobServiceUrl)).value;
			const cronJobFrequency = (await read.getEnvironmentReader().getSettings().getById(AppSetting.cronJobServiceFrequency)).value;
			if (!cronJobUrl || !cronJobFrequency) {
				return;
			}
			this.cronJobSetup = new CronJobSetup(this.getAccessors().http, new SettingsHelper(this.getAccessors().reader));
			const endpoint = this.getAccessors().providedApiEndpoints && this.getAccessors().providedApiEndpoints.length && this.getAccessors().providedApiEndpoints[0].computedPath;
			if (endpoint) {
				const siteUrl = (await this.getAccessors().environmentReader.getServerSettings().getOneById('Site_Url')).value;
				this.cronJobSetup.setup(`${siteUrl}${endpoint}`, cronJobFrequency);
			}
		} catch (error) {
			this.getLogger().error(error);
		}

	}

	protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		try {
			await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
			await configuration.api.provideApi({
				visibility: ApiVisibility.PRIVATE,
				security: ApiSecurity.UNSECURE,
				endpoints: [
					new MicroLearningEndpoint(this),
				],
			});
			await configuration.slashCommands.provideSlashCommand(new Commands());
		} catch (error) {
			this.getLogger().error(error);
		}
	}
}
