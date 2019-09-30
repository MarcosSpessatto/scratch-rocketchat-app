import { IUser } from '@rocket.chat/apps-engine/definition/users';

export interface IAnalytics {
	findFrequentlyAskedQuestionsByUser(user: IUser): Promise<Array<IFrequentlyAskedQuestions>>;
	findFrequentWordsByUser(user: IUser): Promise<Array<IFrequentWords>>;
	findQuantityOfSentMessagesInGroupByUser(user: IUser): Promise<number>;
	findQuantityOfSentQuestionsInGroupByUser(user: IUser): Promise<number>;
	findQuantityOfSentQuestionsByUser(user: IUser): Promise<number>;
	findQuantityOfSentResponsesByUser(user: IUser): Promise<number>;
	findQuantityOfSentQuestionsInBotByUser(user: IUser): Promise<number>;
	findUsersWhoAskedMost(): Promise<Array<IUserWhoAsked>>;
	findUsersWhoSentMostResponses(): Promise<Array<IUserWhoRespond>>;
}

export interface IFrequentlyAskedQuestions {
	question: string;
	occurrences: number;
}

export interface IFrequentWords {
	word: string;
	occurrences: number;
}

export interface IUserWhoAsked {
	userId: string;
	occurrences: number;
}

export interface IUserWhoRespond {
	userId: string;
	occurrences: number;
}
