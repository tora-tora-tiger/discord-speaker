import { CommandInteraction } from 'discord.js';

const message = 
`:lemon::melon::cookie:
:lemon::melon::cookie:
:lemon::melon:

:lemon::melon::cookie:
:lemon::melon::cookie:
:cookie:

:lemon::melon::cookie:
:lemon::melon::cookie:
:cookie::cookie:

:lemon::melon::cookie:
:kangaroo:`

const execute = async function(interaction: CommandInteraction) {
  if(interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
    await interaction.channel.send(message);
  }
  await interaction.reply({ content: 'Lemon Melon Cookie Lemon Melon Cookie Lemon Melon Lemon Melon Cookie Lemon Melon Cookie Cookie Lemon Melon Cookie Lemon Melon Cookie Cookie Cookie Lemon Melon Cookie Kangaroo!!!!!!!!!!', ephemeral: true });
}

export default execute;