import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UserHelper } from '../helpers/user.helper';
import { MessageHelper } from './../helpers/message.helper';

export class HelpCommand {
	private messageHelper: MessageHelper;
	private userHelper: UserHelper;

	constructor(messageHelper: MessageHelper, userHelper: UserHelper) {
		this.messageHelper = messageHelper;
		this.userHelper = userHelper;
	}

	public async run(context: SlashCommandContext): Promise<void> {
		const sender = await this.userHelper.getUserByUsername('rocket.cat');
		await this.messageHelper.sendMessage(context.getRoom(), sender, `*Esses são os comandos que eu entendo:*
		\`/scratch ajuda\` (Mostra essa mensagem de ajuda)
		\`/scratch enviar-conteudo\` (Envia um conteúdo a um aluno escolhido)
		\`/scratch listar-alunos\` (Lista os alunos do grupo para mandar um conteúdo)`);
	}
}
