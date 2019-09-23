import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class RoomHelper {
	private read: IRead;

	constructor(read: IRead) {
		this.read = read;
	}

	public async getRoomByRoomName(roomName: string): Promise<IRoom> {
		return await this.read.getRoomReader().getByName(roomName) as IRoom;
	}

	public async getRoomMembersByRoomName(roomName: string): Promise<Array<IUser>> {
		return await this.read.getRoomReader().getMembers((await this.getRoomByRoomName(roomName)).id);
	}
}
