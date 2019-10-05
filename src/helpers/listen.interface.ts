import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

export interface IListen {
	listeningFor: string;
	student?: string;
	content?: Array<any>;
}
