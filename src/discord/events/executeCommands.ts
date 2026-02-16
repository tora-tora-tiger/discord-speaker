import { Interaction } from "discord.js";

async function executeCommands(interaction: Interaction): Promise<void>{
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName)
  
  if (!command) {
    console.error(`[discord] No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
    console.log("[discord] executed command: ", interaction.commandName);
  } catch (error) {
    const errorCode = getDiscordErrorCode(error);
    if (errorCode === 40060 || errorCode === 10062) {
      console.warn(`[discord] Interaction already handled or expired (${errorCode}): ${interaction.commandName}`);
      return;
    }

    console.error(`[discord] Error executing ${interaction.commandName}`);
    console.error(error);

    try {
      if(interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    } catch (replyError) {
      const replyErrorCode = getDiscordErrorCode(replyError);
      if (replyErrorCode === 40060 || replyErrorCode === 10062) {
        console.warn(`[discord] Failed to send command error reply (${replyErrorCode}): ${interaction.commandName}`);
        return;
      }
      console.error(`[discord] Failed to send error response for ${interaction.commandName}`);
      console.error(replyError);
    }
  }
};

function getDiscordErrorCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code?: unknown }).code;
  if (typeof code === "number") {
    return code;
  }
  if (typeof code === "string") {
    const parsed = Number.parseInt(code, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export default executeCommands;
