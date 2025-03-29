import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { token } from '../config.json';
import path from 'path';
import fs from 'fs';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// スラッシュコマンドの登録
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
  console.log(`Loading commands from ${commandsPath}`);
	const commandFiles = fs
    .readdirSync(commandsPath)
		.filter((file) => file.endsWith(".ts"));
  
  console.log(commandFiles);
    
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    (async () => {
      console.log("koko", filePath);
      // const command = await import(filePath);
      const command = require(filePath);
      console.log("import");

      if (command.data && command.execute) {
        console.log("set command: ", command.data.name);
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    })();
	}
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(
      `No command matching ${interaction.commandName} was found.`,
    );
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
  }
});

client.login(token);