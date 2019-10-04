import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export class StorageHelper {
	private writePersistence: IPersistence;
	private readPersistence: IPersistenceRead;

	constructor(writePersistence: IPersistence, readPersistence: IPersistenceRead) {
		this.writePersistence = writePersistence;
		this.readPersistence = readPersistence;
	}

	public async getItem(associationName: string, type?: RocketChatAssociationModel): Promise<any> {
		const association = new RocketChatAssociationRecord(type || RocketChatAssociationModel.MISC, associationName);
		return await this.readPersistence.readByAssociation(association);
	}

	public async setItem(associationName: string, data: any, type?: RocketChatAssociationModel): Promise<any> {
		const association = new RocketChatAssociationRecord(type || RocketChatAssociationModel.MISC, associationName);
		return await this.writePersistence.createWithAssociation(data, association);
	}

	public async updateItem(associationName: string, data: any, type?: RocketChatAssociationModel, upsert?: boolean): Promise<any> {
		const association = new RocketChatAssociationRecord(type || RocketChatAssociationModel.MISC, associationName);
		return await this.writePersistence.updateByAssociation(association, data, upsert || false);
	}

	public async removeItem(associationName: string, type?: RocketChatAssociationModel): Promise<any> {
		const association = new RocketChatAssociationRecord(type || RocketChatAssociationModel.MISC, associationName);
		return await this.writePersistence.removeByAssociation(association);
	}
}
