import Discord from "@/discord";

const discord = new Discord();
discord.start()

process.on("SIGINT", async () => {
  console.log("[main] SIGINT received. Exiting...");
  await discord.close();
  process.exit(0);
});