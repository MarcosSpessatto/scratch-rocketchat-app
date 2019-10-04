import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IListen } from '../helpers/listen.interface';
import { RoomHelper } from '../helpers/room.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { IAnalytics, IFrequentlyAskedQuestions, IFrequentWords } from './../analytics/analytics.interface';
import { MessageHelper } from './../helpers/message.helper';
import { UserHelper } from './../helpers/user.helper';

export class MicrolearningHandler {
	private userHelper: UserHelper;
	private roomHelper: RoomHelper;
	private messageHelper: MessageHelper;
	private storageHelper: StorageHelper;
	private analytics: IAnalytics;

	constructor(userHelper: UserHelper, roomHelper: RoomHelper, messageHelper: MessageHelper, storageHelper: StorageHelper, analytics: IAnalytics) {
		this.userHelper = userHelper;
		this.roomHelper = roomHelper;
		this.messageHelper = messageHelper;
		this.storageHelper = storageHelper;
		this.analytics = analytics;
	}

	public async run(message: IMessage): Promise<void> {
		const userToSendMessageAsBot = await this.userHelper.getUserByUsername('rocket.cat');
		const listenStorage = await this.storageHelper.getItem(message.sender.id, RocketChatAssociationModel.USER);
		const listenStorageExists = listenStorage && listenStorage.length && listenStorage[0];
		if (!listenStorageExists) {
			return;
		}
		const isListeningForUsername = (listenStorage[0] as IListen).listeningFor === 'username';
		const isListeningForContent = (listenStorage[0] as IListen).listeningFor === 'content';
		const userSendsAUsernameInText = Boolean(await this.userHelper.getUserByUsername(this.extractUsernameFromText(message.text as string)));
		if (isListeningForUsername || userSendsAUsernameInText) {
			return await this.handleMessageWhenItsListeningForUsername(message, userToSendMessageAsBot);
		}
		if (isListeningForContent) {

		}
	}

	private async handleMessageWhenItsListeningForUsername(message: IMessage, userToSendMessageAsBot: IUser): Promise<void> {
		const student = await this.userHelper.getUserByUsername(this.extractUsernameFromText(message.text as string));
		if (!student) {
			return await this.notifyUserDoesNotExists(message.room, userToSendMessageAsBot);
		}
		const frequentWords = await this.analytics.findFrequentWordsByUser(student);
		const frequentlyQuestions = await this.analytics.findFrequentlyAskedQuestionsByUser(student);
		const quantityOfQuestions = await this.analytics.findQuantityOfSentQuestionsByUser(student);
		const quantityOfQuestionsToBot = await this.analytics.findQuantityOfSentQuestionsInBotByUser(student);
		const quantityOfQuestionsSentInGroup = await this.analytics.findQuantityOfSentQuestionsInGroupByUser(student);
		const quantityOfSentResponses = await this.analytics.findQuantityOfSentResponsesByUser(student);
		const quantityOfMessagesSentInGroup = await this.analytics.findQuantityOfSentMessagesInGroupByUser(student);
		await this.sendInstructions(message.room, userToSendMessageAsBot);
		await this.sendFrequentQuestionsMetrics(message.room, userToSendMessageAsBot, student, frequentlyQuestions);
		await this.sendFrequentWordsMetrics(message.room, userToSendMessageAsBot, student, frequentWords);
		await this.sendQuantityOfQuestionsMetrics(message.room, userToSendMessageAsBot, student, quantityOfQuestions, quantityOfQuestionsSentInGroup, quantityOfQuestionsToBot);
		await this.sendQuantityOfMessagesSentInGroupMetrics(message.room, userToSendMessageAsBot, student, quantityOfMessagesSentInGroup, quantityOfSentResponses);
		await this.saveListenForContentStatus(message.sender, student);
	}

	private async saveListenForContentStatus(user: IUser, student: IUser): Promise<void> {
		const upsert = true;
		await this.storageHelper.updateItem(user.id, { listeningFor: 'content', student: student.id } as IListen, RocketChatAssociationModel.USER, upsert);
	}

	private async sendInstructions(room: IRoom, sender: IUser): Promise<void> {
		await this.messageHelper.sendMessage(room, sender, `Para enviar o conteúdo, basta responder essa mensagem com o conteúdo.
		O conteúdo pode ser dividido em mais de uma mensagem, você pode enviar áudio, arquivos, links, vídeos ou texto.
		Quando desejar enviar o conteúdo, basta digitar o comando: */scratch enviar*\n
		:chart_with_upwards_trend: *Abaixo são apresentadas algumas métricas individuais para tentar ajudar a decidir o conteúdo ideal* :chart_with_upwards_trend:`);
	}

	// tslint:disable-next-line: max-line-length
	private async sendQuantityOfQuestionsMetrics(room: IRoom, sender: IUser, student: IUser, quantityOfQuestions: number, quantityOfQuestionsSentInGroup: number, quantityOfQuestionsToBot: number): Promise<void> {
		await this.messageHelper.sendMessage(room, sender, `*${student.name || student.username}* enviou um total de *${quantityOfQuestions}* perguntas.`);
		await this.messageHelper.sendMessage(room, sender, `*${student.name || student.username}* enviou um total de *${quantityOfQuestionsToBot}* perguntas para o chatbot.`);
		await this.messageHelper.sendMessage(room, sender, `*${student.name || student.username}* enviou um total de *${quantityOfQuestionsSentInGroup}* perguntas no grupo.`);
	}

	private async sendQuantityOfMessagesSentInGroupMetrics(room: IRoom, sender: IUser, student: IUser, quantityOfMessagesSentInGroup: number, quantityOfSentResponses: number): Promise<void> {
		await this.messageHelper.sendMessage(room, sender, `*${student.name || student.username}* enviou um total de *${quantityOfSentResponses}* mensagens que não foram perguntas.`);
		// tslint:disable-next-line: max-line-length
		await this.messageHelper.sendMessage(room, sender, `*${student.name || student.username}* enviou um total de *${quantityOfMessagesSentInGroup}* mensagens que não foram perguntas no grupo da turma.`);
	}

	private async sendFrequentQuestionsMetrics(room: IRoom, sender: IUser, student: IUser, frequentWords: Array<IFrequentlyAskedQuestions>): Promise<void> {
		const formattedMessage = frequentWords.reduce((accumulator, word) => {
			accumulator += `${word.question}: ${word.occurrences} vezes\n`;
			return accumulator;
		}, '');
		await this.messageHelper.sendMessage(room, sender, `:question: *Essas foram as questões que ${student.name || student.username} mais fez* :question:\n \`\`\`${formattedMessage}\`\`\``)
	}

	private async sendFrequentWordsMetrics(room: IRoom, sender: IUser, student: IUser, frequentWords: Array<IFrequentWords>): Promise<void> {
		const formattedMessage = frequentWords.reduce((accumulator, word) => {
			accumulator += `${word.word}: ${word.occurrences} vezes\n`;
			return accumulator;
		}, '');
		await this.messageHelper.sendMessage(room, sender, `:pencil: *Essa foram as palavras mais utilizadas por ${student.name || student.username}* :pencil: \n \`\`\`${formattedMessage}\`\`\``)
	}

	private async notifyUserDoesNotExists(room: IRoom, sender: IUser): Promise<void> {
		await this.messageHelper.sendMessage(room, sender, 'Desculpe, não consegui encontrar o usuário que você escolheu');
	}

	private extractUsernameFromText(message: string): string {
		return message ? message.replace(/^@/, '').trim() : '';
	}
}
