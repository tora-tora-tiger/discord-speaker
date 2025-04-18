import type { Collection, PermissionResolvable, SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, ModalSubmitInteraction, CacheType, CommandInteraction } from "discord.js";

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
	command: SlashCommandBuilder;
	execute: (interaction : ChatInputCommandInteraction) => void;
	autocomplete?: (interaction: AutocompleteInteraction) => void;
	modal?: (interaction: ModalSubmitInteraction<CacheType>) => void;
	cooldown?: number; // in seconds
}

export interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: CommandInteraction) => Promise<void>;
	permissions?: Array<PermissionResolvable>;
	aliases?: Array<string>;
	cooldown?: number;
}