import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { MessageHelper } from '../helpers/message.helper';
import { StorageHelper } from '../helpers/storage.helper';
import { RoomHelper } from './../helpers/room.helper';
import { UserHelper } from './../helpers/user.helper';

export class AddRoomCommand {
	private storageHelper: StorageHelper;
	private messageHelper: MessageHelper;
	private userHelper: UserHelper;
	private roomHelper: RoomHelper;

	constructor(storageHelper: StorageHelper, messageHelper: MessageHelper, userHelper: UserHelper, roomHelper: RoomHelper) {
		this.storageHelper = storageHelper;
		this.messageHelper = messageHelper;
		this.userHelper = userHelper;
		this.roomHelper = roomHelper;
	}

	public async run(context: SlashCommandContext): Promise<void> {
		const upsert = true;
		const rooms = await this.storageHelper.getItem('scratch-rooms');
		let record;
		if (rooms && rooms[0] && Array.isArray(rooms[0].rooms)) {
			if (rooms[0].rooms.includes(context.getRoom().id)) {
				return await this.messageHelper.notifyUser(context.getRoom(), await this.userHelper.getUserByUsername('rocket.cat'), context.getSender(), 'O Scratch Bot já está cuidando desta sala.');
			}
			record = { rooms: rooms[0].rooms.concat(context.getRoom().id) };
		} else {
			record = { rooms: [context.getRoom().id] };
		}
		await this.storageHelper.updateItem('scratch-rooms', record, RocketChatAssociationModel.MISC, upsert);
		await this.messageHelper.notifyUser(context.getRoom(), await this.userHelper.getUserByUsername('rocket.cat'), context.getSender(), 'Sala adicionada com sucesso.');
		await this.roomHelper.addMember(context.getRoom().id, await this.userHelper.getUserByUsername('rocket.cat'));
	}
}
