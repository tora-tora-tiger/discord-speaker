import Talk from "@/Talk";
import Discord from "./discord/index";

const talk = new Talk();
export default talk;
talk.setPort(50021);

const discord = new Discord();
discord.deployCommands();
discord.start()

process.on("SIGINT", async () => {
  console.log("[main] SIGINT received. Exiting...");
  await discord.close();
  process.exit(0);
});