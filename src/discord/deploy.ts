import { REST, Routes } from 'discord.js';
import { clientId, token } from '../../config.json';
import { collectCommands } from './collectFiles';


export default async function deploy(): Promise<void> {
  const commands = await collectCommands();
  // Grab all the command folders from the commands directory you created earlier
  // const foldersPath = path.join(__dirname, 'commands');
  // const commandFolders = fs.readdirSync(foldersPath);

  console.log("commands: ", commands);

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

  // and deploy your commands!
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands.map(command => command.data) },
		) as { length: number; };

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
};

deploy();