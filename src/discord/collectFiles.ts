import fs from 'fs';
import path from 'path';

export default async function collectFiles (
  directory: string,
  fileType: string,
  callback: (filePath: string) => Promise<void>,
): Promise<void> {

  const folderPath = path.join(__dirname, directory);
  const files = fs.readdirSync(folderPath).filter(
    (file) => file.endsWith(fileType),
  );

  console.log("found", files);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    await callback(filePath);
  }
}