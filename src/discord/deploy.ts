import { REST, Routes } from 'discord.js';
import { clientId, token } from '../../config.json';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';

const commands: JSON[] = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

(async () => {
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    console.log(`Loading commands from ${commandsPath}`);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts"));
    
    console.log(commandFiles);
      
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      
      const command = await import(pathToFileURL(filePath).href);

      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        console.log("set command: ", command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
      
    }
  }

  console.log("commands: ", commands);

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

  // and deploy your commands!
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data: unknown = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();