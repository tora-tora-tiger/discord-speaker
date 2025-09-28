import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { Command } from '@/types';

/* ディレクトリ配下のサブディレクトリから特定のファイル名を取得し，callbackを実行
 * @param directory - ディレクトリの名前
 * @param fileName - 検索するファイル名
 * @param callback - コールバック関数
 * @returns {Promise<void>}
 */
async function collectFiles (
  directory: string,
  fileName: string,
  callback: (filePath: string) => Promise<void>,
): Promise<void> {

  const folderPath = path.join(__dirname, directory);
  const subdirs = fs.readdirSync(folderPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log("[discord] found subdirs:", subdirs);

  for (const subdir of subdirs) {
    const dataFilePath = path.join(folderPath, subdir, fileName);
    if (fs.existsSync(dataFilePath)) {
      await callback(dataFilePath);
    }
  }
}

// commands/utility の中身をJSONの配列にして返す
async function collectCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  await collectFiles(
    "commands/utility",
    "index.ts",
    async (filePath) => {
      const command = (await import(pathToFileURL(filePath).href)).default;
      if (command.data) {
        commands.push(command);
        console.log("[discord] set command: ", command.data.name);
      } else {
        console.log(`[discord/collectCommands][WARNING] The command at ${filePath} is missing a required "data" property.`);
      }
    }
  );
  return commands;
}

async function collectDataCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  await collectFiles(
    "commands/utility",
    "data.ts",
    async (filePath) => {
      const data = (await import(pathToFileURL(filePath).href)).default;
      if (data) {
        commands.push({
          data: data,
          execute: async () => {} // デプロイ用のダミー関数
        });
        console.log("[discord] set command: ", data.name);
      } else {
        console.log(`[discord/collectCommands][WARNING] The command at ${filePath} is missing a required "data" property.`);
      }
    }
  );
  return commands;
}

export default collectFiles;
export { collectCommands, collectDataCommands };