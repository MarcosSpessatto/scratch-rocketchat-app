import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RoomHelper } from '../helpers/room.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { UserHelper } from '../helpers/user.helper';
import { MessageHelper } from './../helpers/message.helper';

export class SendContentCommand {
	private messageHelper: MessageHelper;
	private userHelper: UserHelper;
	private storageHelper: StorageHelper;
	private roomHelper: RoomHelper;

	constructor(messageHelper: MessageHelper, userHelper: UserHelper, storageHelper: StorageHelper, roomHelper: RoomHelper) {
		this.messageHelper = messageHelper;
		this.userHelper = userHelper;
		this.storageHelper = storageHelper;
		this.roomHelper = roomHelper;
	}

	public async run(context: SlashCommandContext): Promise<void> {
		const contentStorage = await this.storageHelper.getItem(`group-${context.getSender().id}`);
		if (contentStorage && contentStorage[0] && contentStorage[0].content) {
			const sender = await this.userHelper.getUserByUsername('rocket.cat');
			const receiver = await this.userHelper.getUserById(contentStorage[0].student);
			const dm = await this.roomHelper.getRoomById(await this.roomHelper.createDMRoom(sender, receiver));
			await this.messageHelper.sendMessage(dm, sender, ':books: *Desculpe incomodar, esse é um conteúdo enviado por seu professor para ajudar nos seus estudos* :books:');
			for (const content of contentStorage[0].content) {
				await this.messageHelper.sendMessage(dm, sender, content.text, content.attachments);
			}
			await this.messageHelper.sendMessage(context.getRoom(), sender, 'Conteúdo enviado com sucesso. :rocket: :rocket:');
			await this.storageHelper.removeItem(`group-${context.getSender().id}`);
		}
	}
}
