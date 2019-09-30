import { Analytics } from './../analytics/analytics';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ScratchBotApp } from '../../ScratchBotApp';
import { MicrolearningHandler } from '../handlers/microlearning.handler';
import { MessageHelper } from '../helpers/message.helper';
import { RoomHelper } from '../helpers/room.helper';
import { UserHelper } from '../helpers/user.helper';

export class MicroLearningEndpoint extends ApiEndpoint {
	public path: string = 'microlearning';

	constructor(public app: ScratchBotApp) {
		super(app);
	}

	// tslint:disable-next-line:max-line-length
	public async get(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<IApiResponse> {
		try {
			await new MicrolearningHandler(
				new UserHelper(read),
				new RoomHelper(read, modify),
				new MessageHelper(modify),
				new Analytics(http),
			).run();
		} catch (error) {
			console.log(error);
		}
		return this.success();
	}
}
