import Talk from "@/Talk";
import Discord from "./discord/index";

const talk = new Talk({
  "host": process.env.TTS_HOST ?? "voicevox",
  "port": process.env.TTS_PORT ?? "50021"
});
export default talk;

const discord = new Discord();
discord.deployCommands();
discord.start()

process.on("SIGINT", async () => {
  console.log("[main] SIGINT received. Exiting...");
  await discord.close();
  process.exit(0);
});