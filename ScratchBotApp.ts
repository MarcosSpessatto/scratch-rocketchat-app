import {
	IConfigurationExtend,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { AppSetting, settings } from './src/config/settings';
import { LivechatMessageHandler } from './src/handlers/livechat-messages.handler';
import { MessageHelper } from './src/helpers/message.helper';
import { RoomHelper } from './src/helpers/room.helper';
import { SettingsHelper } from './src/helpers/settings.helper';
import { StorageHelper } from './src/helpers/storage.helper';
import { UserHelper } from './src/helpers/user.helper';
import { NluSdk } from './src/nlu-sdk/nlu-sdk';

export class ScratchBotApp extends App implements IPostMessageSent {
	constructor(info: IAppInfo, logger: ILogger) {
		super(info, logger);
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

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
	}
}
