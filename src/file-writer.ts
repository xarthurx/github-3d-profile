import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const OUTPUT_FOLDER = process.env.OUTPUT_DIR || './profile-3d-contrib';

export const writeFile = (fileName: string, content: string): void => {
    const outputPath = `${OUTPUT_FOLDER}/${fileName}`;
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, content);
};
