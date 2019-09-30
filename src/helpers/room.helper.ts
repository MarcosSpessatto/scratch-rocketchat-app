import { IRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class RoomHelper {
	private read: IRead;
	private modify: IModify;

	constructor(read: IRead, modify: IModify) {
		this.read = read;
		this.modify = modify;
	}

	public async getRoomByRoomName(roomName: string): Promise<IRoom> {
		return await this.read.getRoomReader().getByName(roomName) as IRoom;
	}

	public async getRoomById(roomId: string): Promise<IRoom> {
		return await this.read.getRoomReader().getById(roomId) as IRoom;
	}

	public async getRoomMembersByRoomName(roomName: string): Promise<Array<IUser>> {
		return await this.read.getRoomReader().getMembers((await this.getRoomByRoomName(roomName)).id);
	}

	public async createDMRoom(sender: IUser, receiver: IUser): Promise<string> {
		const room = this
			.modify
			.getCreator()
			.startRoom()
			.setType(RoomType.DIRECT_MESSAGE)
			.setCreator(sender)
			.setDisplayName(`${receiver.username}-${sender.username}`)
			.setSlugifiedName(`${receiver.username}-${sender.username}`)
			.setMembersToBeAddedByUsernames([sender.username, receiver.username]);

		return await this.modify.getCreator().finish(room);
	}
}
