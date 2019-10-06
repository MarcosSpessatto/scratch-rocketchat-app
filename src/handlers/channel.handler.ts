import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RoomHelper } from '../helpers/room.helper';
import { NluSdk } from '../nlu-sdk/nlu-sdk';

export class ChannelHandler {
	private nluSdk: NluSdk;
	private roomHelper: RoomHelper;

	constructor(nluSdk: NluSdk, roomHelper: RoomHelper) {
		this.nluSdk = nluSdk;
		this.roomHelper = roomHelper;
	}

	public async run(message: IMessage): Promise<void> {
		const room = await this.roomHelper.getRoomByRoomName('scratch');
		if (room.id === message.room.id && message.sender.roles.includes('student')) {
			await this.sendMessageToProcess(message);
		}
	}

	private async sendMessageToProcess(message: IMessage): Promise<void> {
		await this.nluSdk.sendMessageToProcessAndStoreOnTracker(message.text as string, message.sender.username);
	}
}
