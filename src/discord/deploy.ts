import { REST, Routes } from 'discord.js';
import { collectDataCommands } from '@/discord/collectFiles';

export default async function deploy(): Promise<void> {
	const token = process.env.DISCORD_TOKEN;
	const clientId = process.env.CLIENT_ID;
	const guildId = process.env.GUILD_ID;

	if (!token || !clientId) {
		throw new Error('DISCORD_TOKEN or CLIENT_ID is not defined in environment variables.');
	}

  // Grab all the command folders from the commands directory you created earlier
  const commands = await collectDataCommands();

  // console.log("[discord] commands: ", commands);

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

	// and deploy your commands!
	try {
		const isGuildDeploy = Boolean(guildId);
		const route = isGuildDeploy
			? Routes.applicationGuildCommands(clientId, guildId!)
			: Routes.applicationCommands(clientId);
		const scope = isGuildDeploy ? `guild(${guildId})` : 'global';

		console.log(`[discord] Started refreshing ${commands.length} ${scope} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			route,
			{ body: commands.map(command => command.data) },
		) as { length: number; };

		console.log(`[discord] Successfully reloaded ${data.length} ${scope} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error("[discord]", error);
	}
};
