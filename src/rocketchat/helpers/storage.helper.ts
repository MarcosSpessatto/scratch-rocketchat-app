import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';

export class StorageHelper {
	private writePersistence: IPersistence;
	private readPersistence: IPersistenceRead;

	constructor(writePersistence: IPersistence, readPersistence: IPersistenceRead) {
		this.writePersistence = writePersistence;
		this.readPersistence = readPersistence;
	}

	public async getItem(associationName: string): Promise<any> {
		const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, associationName);
		return await this.readPersistence.readByAssociation(association);
	}

	public async setItem(associationName: string, data: any): Promise<any> {
		const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, associationName);
		return await this.writePersistence.createWithAssociation(data, association);
	}

	public async updateItem(associationName: string, data: any): Promise<any> {
		const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, associationName);
		return await this.writePersistence.updateByAssociation(association, data);
	}
}
