import Discord from "@/discord";
import Talk from "@/Talk";

const talk = new Talk();
export default talk;
talk.setPort(50021);

const discord = new Discord();
discord.start()

process.on("SIGINT", async () => {
  console.log("[main] SIGINT received. Exiting...");
  await discord.close();
  process.exit(0);
});