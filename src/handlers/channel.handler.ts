import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RoomHelper } from '../helpers/room.helper';
import { NluSdk } from '../nlu-sdk/nlu-sdk';
import { StorageHelper } from './../helpers/storage.helper';

export class ChannelHandler {
	private nluSdk: NluSdk;
	private roomHelper: RoomHelper;
	private storageHelper: StorageHelper;

	constructor(nluSdk: NluSdk, roomHelper: RoomHelper, storageHelper: StorageHelper) {
		this.nluSdk = nluSdk;
		this.roomHelper = roomHelper;
		this.storageHelper = storageHelper;
	}

	public async run(message: IMessage): Promise<void> {
		const rooms = await this.storageHelper.getItem('scratch-rooms');
		if (rooms && rooms[0] && Array.isArray(rooms[0].rooms) && rooms[0].rooms.includes(message.room.id)) {
			if (message.sender.roles.includes('student')) {
				await this.sendMessageToProcess(message);
			}
		}
	}

	private async sendMessageToProcess(message: IMessage): Promise<void> {
		await this.nluSdk.sendMessageToProcessAndStoreOnTracker(message.text as string, message.sender.username);
	}
}
