import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IListen } from '../helpers/listen.interface';
import { StorageHelper } from '../helpers/storage.helper';

export class DeletedMessagesHandler {
	private storageHelper: StorageHelper;

	constructor(storageHelper: StorageHelper) {
		this.storageHelper = storageHelper;
	}

	public async run(message: IMessage): Promise<void> {
		const contentStorage = await this.storageHelper.getItem(`group-${message.sender.id}`);
		if (contentStorage && contentStorage[0] && contentStorage[0].listeningFor === 'content') {
			const messageExists = contentStorage[0].content.find((messageContent) => messageContent.id === message.id);
			if (messageExists) {
				const record: IListen = {
					listeningFor: contentStorage[0].listeningFor,
					student: contentStorage[0].student,
					content: contentStorage[0].content.filter((messageContent) => messageContent.id !== message.id),
				};
				await this.storageHelper.updateItem(`group-${message.sender.id}`, record, RocketChatAssociationModel.MISC);
			}
		}
	}
}
