import Talk from "@/Talk";
import Discord from "@/discord";

const talk = new Talk();

talk.setHost("0.0.0.0");
talk.setPort(50021);

const discord = new Discord();
discord.start()

process.on("SIGINT", async () => {
  console.log("SIGINT received. Exiting...");
  await discord.close();
  process.exit(0);
});