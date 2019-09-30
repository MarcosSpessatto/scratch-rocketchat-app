import { MessageActionButtonsAlignment, MessageActionType } from '@rocket.chat/apps-engine/definition/messages';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IAnalytics } from '../analytics/analytics.interface';
import { MessageHelper } from '../helpers/message.helper';
import { RoomHelper } from '../helpers/room.helper';
import { UserHelper } from '../helpers/user.helper';

export class MicrolearningHandler {
	private userHelper: UserHelper;
	private roomHelper: RoomHelper;
	private messageHelper: MessageHelper;
	private analytics: IAnalytics;

	constructor(userHelper: UserHelper, roomHelper: RoomHelper, messageHelper: MessageHelper, analytics: IAnalytics) {
		this.userHelper = userHelper;
		this.roomHelper = roomHelper;
		this.messageHelper = messageHelper;
		this.analytics = analytics;
	}

	public async run(): Promise<void> {
		const usersToSendListOfStudents = (await this.roomHelper.getRoomMembersByRoomName('scratch')).filter(this.needToSendListOfStudents);
		const students = (await this.roomHelper.getRoomMembersByRoomName('scratch')).filter(this.isStudent);
		const users = students
			.sort((a, b) => {
				return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
			})
			.map((member) => {
				return {
					text: `${member.name}`,
					type: MessageActionType.BUTTON,
					msg_in_chat_window: true,
					msg: `@${member.username}`,
				};
			});
		const usersWhoAskedMost = await this.analytics.findUsersWhoAskedMost();
		const usersWhoSentMostResponses = await this.analytics.findUsersWhoSentMostResponses();
		if (usersToSendListOfStudents.length && students.length) {
			const sender = await this.userHelper.getUserByUsername('rocket.cat');
			for (const userToSend of usersToSendListOfStudents) {
				const receiver = await this.userHelper.getUserByUsername(userToSend.username);
				const dm = (await this.roomHelper.getRoomById(await this.roomHelper.createDMRoom(sender, receiver)));
				const attachment = {
					actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
					actions: users,
				};
				const usersWhoAskedMostMessage = usersWhoAskedMost.reduce((acc, user, index) => {
					acc += `*${user.userId}*: ${user.occurrences}${index === 0 || index === 1 || index === 2 ? ':warning:' : ''}\n`;
					return acc;
				}, '');
				const usersWhoSentMostResponsesMessage = usersWhoSentMostResponses.reduce((acc, user, index) => {
					acc += `*${user.userId}*: ${user.occurrences}${index === 0 || index === 1 || index === 2 ? ':first_place:' : ''}\n`;
					return acc;
				}, '');
				await this.messageHelper.sendMessage(dm, sender, `\`A Lista dos estudantes que mais perguntaram é essa:\`\n ${usersWhoAskedMostMessage}`);
				await this.messageHelper.sendMessage(dm, sender, `\`A Lista dos estudantes que mais responderam é essa:\`\n ${usersWhoSentMostResponsesMessage}`);
				await this.messageHelper.sendMessage(dm, sender, 'Aqui está a lista dos estudantes', [attachment]);
			}
		}
	}

	private needToSendListOfStudents(user: IUser): boolean {
		return user.username !== 'admin' && user.username !== 'rocket.cat' && user.roles.includes('teacher');
	}

	private isStudent(user: IUser): boolean {
		return user.username !== 'admin' && user.username !== 'rocket.cat' && user.roles.includes('student');
	}
}
