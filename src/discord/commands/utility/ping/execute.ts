import { CommandInteraction } from 'discord.js';

const execute = async function(interaction: CommandInteraction) {
  await interaction.reply('Pong!');
}

export default { execute };