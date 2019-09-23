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
import { AppSetting, settings } from './src/rocketchat/config/settings';
import { LivechatMessageHandler } from './src/rocketchat/handlers/livechat-messages.handler';
import { MessageHelper } from './src/rocketchat/helpers/message.helper';
import { RoomHelper } from './src/rocketchat/helpers/room.helper';
import { SettingsHelper } from './src/rocketchat/helpers/settings.helper';
import { StorageHelper } from './src/rocketchat/helpers/storage.helper';
import { UserHelper } from './src/rocketchat/helpers/user.helper';
import { NluSdk } from './src/rocketchat/nlu-sdk/nlu-sdk';

export class ScratchBotApp extends App implements IPostMessageSent {
	constructor(info: IAppInfo, logger: ILogger) {
		super(info, logger);
	}

	public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
		try {
			if (message.sender.id !== 'rocket.cat') {
				const isLivechatMessage = message.room.type === 'l';
				const nluServiceUrl = (await read.getEnvironmentReader().getServerSettings().getOneById(AppSetting.botCoreServiceUrl)).value;
				if (isLivechatMessage) {
					new LivechatMessageHandler(
						new RoomHelper(read),
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