import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class UserHelper {
	private read: IRead;

	constructor(read: IRead) {
		this.read = read;
	}

	public async getUserByUsername(username: string): Promise<IUser> {
		return await this.read.getUserReader().getByUsername(username);
	}
}
