import * as core from '@actions/core';
import * as aggregate from './aggregate-user-info';
import * as template from './color-template';
import * as create from './create-svg';
import * as f from './file-writer';
import * as client from './github-graphql';
import * as r from './settings-reader';

export const main = async (): Promise<void> => {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            core.setFailed('GITHUB_TOKEN is empty');
            return;
        }
        const userName = 3 <= process.argv.length ? process.argv[2] : process.env.USERNAME;
        if (!userName) {
            core.setFailed('USERNAME is empty');
            return;
        }
        const maxRepos = process.env.MAX_REPOS ? Number(process.env.MAX_REPOS) : 100;
        if (Number.isNaN(maxRepos)) {
            core.setFailed('MAX_REPOS is NaN');
            return;
        }
        const year = process.env.YEAR ? Number(process.env.YEAR) : null;
        if (Number.isNaN(year)) {
            core.setFailed('YEAR is NaN');
            return;
        }

        const response = await client.fetchData(token, userName, maxRepos, year);
        const userInfo = aggregate.aggregateUserInfo(response);

        if (process.env.SETTING_JSON) {
            const settingFile = r.readSettingJson(process.env.SETTING_JSON);
            const settingInfos = 'length' in settingFile ? settingFile : [settingFile];
            for (const settingInfo of settingInfos) {
                const fileName = settingInfo.fileName || 'profile-customize.svg';
                f.writeFile(fileName, create.createSvg(userInfo, settingInfo, false));
            }
        } else {
            f.writeFile(
                'profile-solarized-light.svg',
                create.createSvg(userInfo, template.SolarizedLightSettings, true),
            );
            f.writeFile(
                'profile-solarized-dark.svg',
                create.createSvg(userInfo, template.SolarizedDarkSettings, true),
            );
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(error);
        core.setFailed(message);
    }
};

void main();
