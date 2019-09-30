import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class MessageHelper {
	private modify: IModify;

	constructor(modify: IModify) {
		this.modify = modify;
	}

	public async sendMessage(room: IRoom, sender: IUser, message: string, attachments?: Array<IMessageAttachment>): Promise<string> {
		const msg = this.modify.getCreator().startMessage().setRoom(room).setSender(sender).setText(message);
		if (attachments && attachments.length) {
			msg.setAttachments(attachments);
		}
		return await this.modify.getCreator().finish(msg);
	}
}
