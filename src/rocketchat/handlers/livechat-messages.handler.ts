import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { RoomHelper } from '../helpers/room.helper';
import { SettingsHelper } from '../helpers/settings.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { NluSdk } from '../nlu-sdk/nlu-sdk';
import { MessageHelper } from './../helpers/message.helper';
import { UserHelper } from './../helpers/user.helper';

export class LivechatMessageHandler {
	private roomHelper: RoomHelper;
	private userHelper: UserHelper;
	private messageHelper: MessageHelper;
	private nluSdk: NluSdk;
	private storageHelper: StorageHelper;
	private settingsHelper: SettingsHelper;

	constructor(roomHelper: RoomHelper, userHelper: UserHelper, messageHelper: MessageHelper, nluSdk: NluSdk, storageHelper: StorageHelper, settingsHelper: SettingsHelper) {
		this.roomHelper = roomHelper;
		this.userHelper = userHelper;
		this.messageHelper = messageHelper;
		this.nluSdk = nluSdk;
		this.storageHelper = storageHelper;
		this.settingsHelper = settingsHelper;
	}

	public async run(message: IMessage) {
		const userWhoSentTheMessage = message.sender;
		const roomThatSentTheMessage = message.room;
		const userToSendMessagesAsBot = await this.userHelper.getUserByUsername('rocket.cat');
		const nluParsedMessage = await this.nluSdk.parseMessage(message.text as string);
		const nluServiceHasRecognizeMessage = Boolean(nluParsedMessage.intent.name);
		if (nluServiceHasRecognizeMessage) {
			const nluServiceResponses = await this.nluSdk.recognizeMessage(message.text as string, message.sender.username);
			await this.replyWithAllNluMessages(message.room, userToSendMessagesAsBot, nluServiceResponses);
		} else {
			const attempts = await this.storageHelper.getItem(userWhoSentTheMessage.id);
			const needsRedirectMessageToHuman = Boolean(attempts.length && attempts[0].attempts >= 5);
			if (needsRedirectMessageToHuman) {
				const roomToSendAskForHelp = await this.roomHelper.getRoomByRoomName('scratch');
				const classMembers = await this.roomHelper.getRoomMembersByRoomName('scratch');
				const userAbleToHelp = await this.findUserAbleToHelp(classMembers);
				if (userAbleToHelp) {
					//await this.messageHelper.sendMessage()
				} else {
					const messageId = await this.sendMessageToClassRoomToAskForHelp(roomToSendAskForHelp, userToSendMessagesAsBot, userWhoSentTheMessage, message.text as string);
					await this.sendMessageToNotifyUserOfRedirectionToHuman(roomThatSentTheMessage, userToSendMessagesAsBot, await this.getLinkOfMessageToAskForHelp(messageId));
				}
			} else {
				await this.incrementFallbackMessage(userWhoSentTheMessage, attempts[0] && attempts[0].attempts);
			}
		}
	}

	private async sendMessageToNotifyUserOfRedirectionToHuman(room: IRoom, user: IUser, linkOfAskForHelpMessage: string): Promise<string> {
		const messageTosend = `Postei sua dúvida no grupo da turma. Acompanhe: ${linkOfAskForHelpMessage}`;
		return await this.messageHelper.sendMessage(room, user, messageTosend);
	}

	private async getLinkOfMessageToAskForHelp(messageId: string): Promise<string> {
		const siteUrl = (await this.settingsHelper.getSettingById('Site_Url')).value;
		return `${siteUrl}/channel/scratch?msg=${messageId}`;
	}

	private async sendMessageToClassRoomToAskForHelp(room: IRoom, user: IUser, userWhoAskForHelp: IUser, originalAskForHelpMessage: string): Promise<string> {
		const messageToSend = `*${userWhoAskForHelp.name}* precisa de ajuda com: ${originalAskForHelpMessage}`;
		return await this.messageHelper.sendMessage(room, user, messageToSend);
	}

	private async findUserAbleToHelp(roomMembers: Array<IUser>): Promise<IUser> {
		const usersAbleToHelp = roomMembers.filter((member) => (member.roles.includes('teacher') || member.roles.includes('tutor')));
		return usersAbleToHelp[0];
	}

	private async incrementFallbackMessage(user: IUser, attempts: number): Promise<void> {
		if (attempts) {
			attempts += 1;
			return await this.storageHelper.updateItem(user.id, { id: user.id, attempts });
		}
		await this.storageHelper.setItem(user.id, { attempts: 1 });
	}

	private async replyWithAllNluMessages(room: IRoom, sender: IUser, messages: Array<any>): Promise<void> {
		for (const message of messages) {
			this.messageHelper.sendMessage(room, sender, message.text);
		}
	}
}
