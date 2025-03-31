import { Client, Events, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import { token } from '../../config.json';
// import path from 'path';
import { pathToFileURL } from 'url';
// import fs from 'fs';
import collectFiles from './collectFiles';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// スラッシュコマンドの登録
client.commands = new Collection();

// const foldersPath = path.join(__dirname, "commands");
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
// 	const commandsPath = path.join(foldersPath, folder);
//   console.log(`Loading commands from ${commandsPath}`);
// 	const commandFiles = fs
//     .readdirSync(commandsPath)
// 		.filter((file) => file.endsWith(".ts"));
  
//   console.log(commandFiles);
    
//   for (const file of commandFiles) {
//     const filePath = path.join(commandsPath, file);
//     (async () => {
//       const command = await import(pathToFileURL(filePath).href);

//       if (command.data && command.execute) {
//         console.log("set command: ", command.data.name);
//         client.commands.set(command.data.name, command);
//       } else {
//         console.log(
//           `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
//         );
//       }
//     })();
// 	}
// }

collectFiles(
  "commands",
  ".ts",
  async (filePath) => {
    const command = await import(pathToFileURL(filePath).href);

    if (command.data && command.execute) {
      console.log("set command: ", command.data.name);
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
)

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  console.log(client.commands.keys());
  const command = interaction.client.commands.get(interaction.commandName)
  console.log(command);

  console.log("interaction: ", interaction.commandName);
  console.log("command: ", command);

  if (!command) {
    console.error(
      `No command matching ${interaction.commandName} was found.`,
    );
    return;
  }
  try {
    await command.execute(interaction);
    console.log("executed command: ", interaction.commandName);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);

    if(interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(token);