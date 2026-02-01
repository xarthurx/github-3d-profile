import { readFileSync, rmSync } from 'node:fs';
import { OUTPUT_FOLDER, writeFile } from '../src/file-writer';

afterEach(() => {
    rmSync(OUTPUT_FOLDER, { recursive: true, force: true });
});

describe('file-writer', () => {
    it('writeFile', () => {
        writeFile('write-svg.svg', 'work');
        const content = readFileSync(`${OUTPUT_FOLDER}/write-svg.svg`, {
            encoding: 'utf8',
            flag: 'r',
        });
        expect(content).toEqual('work');
    });
});
