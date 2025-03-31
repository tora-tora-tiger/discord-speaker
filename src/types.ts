import type { Collection, Message, PermissionResolvable, SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, ModalSubmitInteraction, CacheType } from "discord.js";

declare module "discord.js" {
	interface Client {
		commands: Collection<
			string,
			{
				execute: (interaction: CommandInteraction) => Promise<void>
				data: SlashCommandBuilder
			}
		>;
	}
}

export interface SlashCommand {
	command: SlashCommandBuilder,
	execute: (interaction : ChatInputCommandInteraction) => void,
	autocomplete?: (interaction: AutocompleteInteraction) => void,
	modal?: (interaction: ModalSubmitInteraction<CacheType>) => void,
	cooldown?: number // in seconds
}

export interface Command {
	name: string,
	execute: (message: Message, args: Array<string>) => void,
	permissions: Array<PermissionResolvable>,
	aliases: Array<string>,
	cooldown?: number,
}