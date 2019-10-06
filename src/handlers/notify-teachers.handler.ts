import { IMessageAction, MessageActionButtonsAlignment, MessageActionType } from '@rocket.chat/apps-engine/definition/messages';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IAnalytics, IUserWhoAsked, IUserWhoRespond } from '../analytics/analytics.interface';
import { IListen } from '../helpers/listen.interface';
import { MessageHelper } from '../helpers/message.helper';
import { RoomHelper } from '../helpers/room.helper';
import { SettingsHelper } from '../helpers/settings.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { UserHelper } from '../helpers/user.helper';
import { AppSetting } from './../config/settings';

export class NotifyTeachersHandler {
	private userHelper: UserHelper;
	private roomHelper: RoomHelper;
	private messageHelper: MessageHelper;
	private storageHelper: StorageHelper;
	private settingsHelper: SettingsHelper;
	private analytics: IAnalytics;

	constructor(userHelper: UserHelper, roomHelper: RoomHelper, messageHelper: MessageHelper, storageHelper: StorageHelper, analytics: IAnalytics, settingsHelper: SettingsHelper) {
		this.userHelper = userHelper;
		this.roomHelper = roomHelper;
		this.messageHelper = messageHelper;
		this.storageHelper = storageHelper;
		this.analytics = analytics;
		this.settingsHelper = settingsHelper;
	}

	public async run(context?: SlashCommandContext): Promise<void> {
		const sendMicrolearnigToTutor = (await this.settingsHelper.getAppSettingById(AppSetting.sendMicrolearningToTutor)).value;
		const usersToSendListOfStudents = context
			? [context.getSender()]
			: (await this.roomHelper.getRoomMembersByRoomName('scratch')).filter((member) => this.needToSendListOfStudents(member, sendMicrolearnigToTutor));
		const students = (await this.roomHelper.getRoomMembersByRoomName('scratch')).filter(this.isStudent);
		if (!usersToSendListOfStudents.length || !students.length) {
			return;
		}
		const usersWhoAskedMost = await this.analytics.findUsersWhoAskedMost();
		const usersWhoSentMostResponses = await this.analytics.findUsersWhoSentMostResponses();
		const sender = await this.userHelper.getUserByUsername('rocket.cat');
		for (const userToSend of usersToSendListOfStudents) {
			let studentsToSend: Array<IUser> = students;
			if (userToSend.roles.includes('tutor')) {
				studentsToSend = students.filter((user) => userToSend.id !== user.id);
			}
			const contentStorage = await this.storageHelper.getItem(`group-${userToSend.id}`);
			const userIsAlreadyMakeContent = contentStorage && contentStorage[0] && contentStorage[0].listeningFor === 'content';
			if (context || !userIsAlreadyMakeContent) {
				const receiver = await this.userHelper.getUserByUsername(userToSend.username);
				const dm = (await this.roomHelper.getRoomById(await this.roomHelper.createDMRoom(sender, receiver)));
				if (!context) {
					await this.sendMicrolearningHourMessage(dm, sender);
				}
				if (usersWhoAskedMost.length) {
					await this.sendMessageOfUserWhoAskedMost(dm, sender, usersWhoAskedMost);
				}
				if (usersWhoSentMostResponses) {
					await this.sendMessageOfUserWhoSentMostResponses(dm, sender, usersWhoSentMostResponses);
				}
				await this.sendListOfStudentButtons(dm, sender, studentsToSend);
				await this.saveListenStatus(userToSend);
			}
		}
	}

	private async saveListenStatus(user: IUser): Promise<void> {
		const upsert = true;
		await this.storageHelper.updateItem(`group-${user.id}`, { listeningFor: 'username' } as IListen, RocketChatAssociationModel.MISC, upsert);
	}

	private async sendListOfStudentButtons(room: IRoom, sender: IUser, students: Array<IUser>): Promise<string> {
		const attachment = {
			actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
			actions: this.listOfStudentsButtonsToSend(students),
		};
		return await this.messageHelper.sendMessage(room, sender, 'Escolha um estudante para enviar um conteúdo', [attachment]);
	}

	private listOfStudentsButtonsToSend(students: Array<IUser>): Array<IMessageAction> {
		return students
			.sort((a, b) => {
				return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
			})
			.map((member) => ({
				text: `${member.name}`,
				type: MessageActionType.BUTTON,
				msg_in_chat_window: true,
				msg: `@${member.username}`,
			}));
	}

	private async sendMicrolearningHourMessage(room: IRoom, sender: IUser): Promise<string> {
		return await this.messageHelper.sendMessage(room, sender, `:books: Desculpe incomodar, esse é apenas um lembrete que talvez esteja na hora de enviar conteúdos aos alunos :books:`);
	}

	private async sendMessageOfUserWhoAskedMost(room: IRoom, sender: IUser, usersWhoAskedMost: Array<IUserWhoAsked>): Promise<string> {
		let message = '';
		for (const user of usersWhoAskedMost) {
			const rcUser = await this.userHelper.getUserByUsername(user.username);
			message += `${rcUser.name || rcUser.username}: ${user.occurrences}\n`;
		}
		return await this.messageHelper.sendMessage(room, sender, `:warning: *Essa é a lista dos estudantes que mais fizeram perguntas* :warning:\n \`\`\`${message}\`\`\``);
	}

	private async sendMessageOfUserWhoSentMostResponses(room: IRoom, sender: IUser, usersWhoSentMostResponses: Array<IUserWhoRespond>): Promise<string> {
		let message = '';
		for (const user of usersWhoSentMostResponses) {
			const rcUser = await this.userHelper.getUserByUsername(user.username);
			message += `${rcUser.name || rcUser.username}: ${user.occurrences}\n`;
		}
		return await this.messageHelper.sendMessage(room, sender, `:trophy: *Essa é a lista dos estudantes que mais mandaram mensagens que não foram perguntas* :trophy:\n \`\`\`${message}\`\`\``);
	}

	private needToSendListOfStudents(user: IUser, sendToTutor: boolean): boolean {
		if (user.roles.includes('tutor')) {
			return sendToTutor;
		}
		return user.username !== 'admin' && user.username !== 'rocket.cat' && user.roles.includes('teacher');
	}

	private isStudent(user: IUser): boolean {
		return user.username !== 'admin' && user.username !== 'rocket.cat' && user.roles.includes('student');
	}
}
