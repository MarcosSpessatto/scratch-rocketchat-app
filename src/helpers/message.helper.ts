import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class MessageHelper {
	private modify: IModify;

	constructor(modify: IModify) {
		this.modify = modify;
	}

	public async sendMessage(room: IRoom, sender: IUser, message: string): Promise<string> {
		const msg = this.modify.getCreator().startMessage().setRoom(room).setSender(sender).setText(message);
		return await this.modify.getCreator().finish(msg);
	}
}
