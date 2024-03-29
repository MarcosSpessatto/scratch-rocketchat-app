import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { RoomHelper } from '../helpers/room.helper';
import { SettingsHelper } from '../helpers/settings.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { NluSdk } from '../nlu-sdk/nlu-sdk';
import { AppSetting } from './../config/settings';
import { MessageHelper } from './../helpers/message.helper';
import { UserHelper } from './../helpers/user.helper';
import { fallbackMessages } from './fallback-messages';

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

	public async run(message: IMessage): Promise<any> {
		const userWhoSentTheMessage = await this.userHelper.getUserByUsername(message.sender.username);
		const roomThatGenerateTheMessage = message.room;
		const userToSendMessagesAsABot = await this.userHelper.getUserByUsername('rocket.cat');
		const nluParsedMessage = await this.nluSdk.parseMessage(message.text as string);
		const howManyAttempsUntilRedirectToHuman = (await this.settingsHelper.getAppSettingById(AppSetting.howManyAttemptsUntilRedirectToHuman)).value;
		const tryToRedirectFirstToUser = (await this.settingsHelper.getAppSettingById(AppSetting.tryToRedirectFirstToUser)).value;
		const nluServiceHasRecognizedMessage = nluParsedMessage && nluParsedMessage.intent && Boolean(nluParsedMessage.intent.name) && nluParsedMessage.intent.confidence > 0.3;
		if (nluServiceHasRecognizedMessage) {
			const nluServiceResponses = await this.nluSdk.getResponsesFromBotCore(message.text as string, message.sender.username);
			await this.replyWithAllNluMessages(roomThatGenerateTheMessage, userToSendMessagesAsABot, nluServiceResponses);
			return await this.resetAttemptsToTryToRecognize(userWhoSentTheMessage.id);
		}
		await this.sendMessageToProcess(message);
		const attempts = await this.storageHelper.getItem(`bot-${userWhoSentTheMessage.id}`);
		const needsRedirectMessageToHuman = Boolean(attempts.length && attempts[0].attempts >= howManyAttempsUntilRedirectToHuman);
		if (needsRedirectMessageToHuman) {
			await this.sendMessageToNotifyUserOfRedirection(roomThatGenerateTheMessage, userToSendMessagesAsABot);
			const roomToSendAskForHelp = await this.getRoomToSendAskForHelp(message.sender);
			const classMembers = await this.getClassMembers(message.sender);
			const userAbleToHelp = await this.findUserAbleToHelp(classMembers, userWhoSentTheMessage);
			await this.resetAttemptsToTryToRecognize(userWhoSentTheMessage.id);
			if (tryToRedirectFirstToUser && userAbleToHelp) {
				const messageSendToDM = await this.sendMessageDirectlyToUserAbleToHelp(userAbleToHelp, userWhoSentTheMessage, message.text as string);
				const messageDMLink = await this.getLinkOfMessageToAskForHelp(messageSendToDM, 'direct', userAbleToHelp.username);
				return await this.sendMessageToNotifyUserOfRedirectionToHuman(roomThatGenerateTheMessage, userToSendMessagesAsABot, messageDMLink, 'direct');
			}
			const messageSendToGroup = await this.sendMessageToClassRoomToAskForHelp(roomToSendAskForHelp, userToSendMessagesAsABot, userWhoSentTheMessage, message.text as string);
			const messageGroupLink = await this.getLinkOfMessageToAskForHelp(messageSendToGroup, 'channel', '', roomToSendAskForHelp);
			return await this.sendMessageToNotifyUserOfRedirectionToHuman(roomThatGenerateTheMessage, userToSendMessagesAsABot, messageGroupLink);
		}
		// tslint:disable-next-line: radix
		const isTheLastAttemptToTryToRecognize = attempts[0] && attempts[0].attempts === parseInt(howManyAttempsUntilRedirectToHuman) - 1;
		if (isTheLastAttemptToTryToRecognize) {
			await this.notifyUserAboutTheLastAttemptToTryToRecognize(roomThatGenerateTheMessage, userToSendMessagesAsABot);
		} else {
			await this.sendFallbackMessage(roomThatGenerateTheMessage, userToSendMessagesAsABot);
		}
		await this.incrementFallbackMessage(userWhoSentTheMessage, attempts[0] && attempts[0].attempts);
	}

	private async getClassMembers(user: IUser): Promise<Array<IUser>> {
		const rooms = await this.storageHelper.getItem('scratch-rooms');
		if (rooms && rooms[0] && Array.isArray(rooms[0].rooms)) {
			for (const roomId of rooms[0].rooms) {
				const members = await this.roomHelper.getRoomMembersByRoomId(roomId);
				const isMemberOfRoom = members.find((member) => member.username === user.username);
				if (isMemberOfRoom) {
					return members;
				}
			}
		}
		return [];
	}

	private async getRoomToSendAskForHelp(user: IUser): Promise<IRoom> {
		const rooms = await this.storageHelper.getItem('scratch-rooms');
		if (rooms && rooms[0] && Array.isArray(rooms[0].rooms)) {
			for (const roomId of rooms[0].rooms) {
				const members = await this.roomHelper.getRoomMembersByRoomId(roomId);
				const isMemberOfRoom = members.find((member) => member.username === user.username);
				if (isMemberOfRoom) {
					return await this.roomHelper.getRoomById(roomId);
				}
			}
		}
		return await this.roomHelper.getRoomByRoomName('scratch');
	}

	private async sendMessageToProcess(message: IMessage): Promise<void> {
		await this.nluSdk.sendMessageToProcessAndStoreOnTracker(message.text as string, message.sender.username);
	}

	private async resetAttemptsToTryToRecognize(userId: string): Promise<void> {
		await this.storageHelper.removeItem(`bot-${userId}`);
	}

	private async notifyUserAboutTheLastAttemptToTryToRecognize(room: IRoom, user: IUser): Promise<string> {
		return await this.messageHelper.sendMessage(room, user, 'Estou tendo dificuldades para entender, caso não entenda sua próxima tentativa, irei redirecioná-lo à um humano =/');
	}

	private async sendFallbackMessage(room: IRoom, user: IUser): Promise<string> {
		const position = Math.floor(Math.random() * (fallbackMessages.length - 1));
		const fallbackMessage = fallbackMessages[position];
		return await this.messageHelper.sendMessage(room, user, fallbackMessage);
	}

	private async sendMessageDirectlyToUserAbleToHelp(userAbleToHelp: IUser, userWhoSentTheMessage: IUser, originalAskForHelpMessage: string): Promise<string> {
		const msg = `Você poderia me ajudar com: *_${originalAskForHelpMessage}_*`;
		let room = await this.roomHelper.getRoomById(`${userAbleToHelp.id}${userWhoSentTheMessage.id}`);
		if (!room) {
			room = await this.roomHelper.getRoomById(`${userWhoSentTheMessage.id}${userAbleToHelp.id}`);
		}
		if (!room) {
			const createdRoomId = await this.roomHelper.createDMRoom(userWhoSentTheMessage, userAbleToHelp);
			room = await this.roomHelper.getRoomById(createdRoomId);
		}
		return await this.messageHelper.sendMessage(room, userWhoSentTheMessage, msg) as string;
	}

	private async sendMessageToNotifyUserOfRedirection(room: IRoom, user: IUser): Promise<void> {
		await this.messageHelper.sendMessage(room, user, `Redirecionando sua dúvida para um humano... =)`);
	}

	private async sendMessageToNotifyUserOfRedirectionToHuman(room: IRoom, user: IUser, linkOfAskForHelpMessage: string, messageType?: string): Promise<string> {
		const where = `${messageType === 'direct' ? 'um usuário que irá lhe ajudar' : 'o grupo da turma'}`;
		const messageTosend = `Enviei sua dúvida para ${where}. Acompanhe: ${linkOfAskForHelpMessage}`;
		return await this.messageHelper.sendMessage(room, user, messageTosend);
	}

	private async getLinkOfMessageToAskForHelp(messageId: string, messageType: string, username?: string, room?: IRoom): Promise<string> {
		const siteUrl = (await this.settingsHelper.getServerSettingById('Site_Url')).value;
		if (messageType === 'direct') {
			return `${siteUrl}/direct/${username}?=${messageId}`;
		}
		return `${siteUrl}/channel/${room && room.slugifiedName}?msg=${messageId}`;
	}

	private async sendMessageToClassRoomToAskForHelp(room: IRoom, user: IUser, userWhoAskForHelp: IUser, originalAskForHelpMessage: string): Promise<string> {
		const messageToSend = `@${userWhoAskForHelp.username} precisa de ajuda com: *_${originalAskForHelpMessage}_*`;
		return await this.messageHelper.sendMessage(room, user, messageToSend);
	}

	private async findUserAbleToHelp(roomMembers: Array<IUser>, userWhoSentTheMessage: IUser): Promise<IUser> {
		const usersAbleToHelp = roomMembers.filter((member) => (member.roles.includes('teacher') || member.roles.includes('tutor')) && member.status !== 'offline' && member.id !== userWhoSentTheMessage.id);
		const position = Math.floor(Math.random() * (usersAbleToHelp.length - 1));
		return usersAbleToHelp[position];
	}

	private async incrementFallbackMessage(user: IUser, attempts: number): Promise<void> {
		if (attempts) {
			attempts += 1;
			return await this.storageHelper.updateItem(`bot-${user.id}`, { id: user.id, attempts });
		}
		await this.storageHelper.setItem(`bot-${user.id}`, { attempts: 1 });
	}

	private async replyWithAllNluMessages(room: IRoom, sender: IUser, messages: Array<any>): Promise<void> {
		for (const message of messages) {
			await this.messageHelper.sendMessage(room, sender, message.text);
		}
	}
}
