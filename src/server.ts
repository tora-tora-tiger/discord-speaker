import Talk from "@/Talk";
import Discord from "./discord/index";

const talk = new Talk({
  "host": process.env.TTS_HOST ?? "voicevox",
  "port": process.env.TTS_PORT ?? "50021"
});
export default talk;

const discord = new Discord();
discord.start()

const gracefulShutdown = async (signal: string) => {
  console.log(`[main] ${signal} received. Exiting...`);
  await discord.close();
  process.exit(0);
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});