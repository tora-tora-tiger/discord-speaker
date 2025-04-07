import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { Command } from '@/types';
import { SlashCommandBuilder } from 'discord.js';

/* ディレクトリ配下の特定の拡張子のファイルを取得し，callbackを実行
 * @param directory - ディレクトリの名前
 * @param fileType - ファイルの拡張子
 * @param callback - コールバック関数
 * @returns {Promise<void>}
 */
async function collectFiles (
  directory: string,
  fileType: string,
  callback: (filePath: string) => Promise<void>,
): Promise<void> {

  const folderPath = path.join(__dirname, directory);
  const files = fs.readdirSync(folderPath).filter(
    (file) => file.endsWith(fileType)
  );

  console.log("found", files);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    await callback(filePath);
  }
}

// commands/utility の中身をJSONの配列にして返す
async function collectCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  await collectFiles(
    "commands/utility",
    ".ts",
    async (filePath) => {
      const command = (await import(pathToFileURL(filePath).href)).default;
      if (command.data && command.execute) {
        commands.push(command);
        // console.log("set command: ", command.data.toJSON());
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  );
  return commands;
}

export default collectFiles;
export { collectCommands };