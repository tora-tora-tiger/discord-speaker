import { CommandInteraction } from 'discord.js';
import data from './data';

const execute = async function(interaction: CommandInteraction) {
  await interaction.reply('Pong!');
}

export default { 
  data: data,
  execute: execute
};