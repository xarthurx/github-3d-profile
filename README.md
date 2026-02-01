# GitHub 3D Profile

<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/nord-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/nord-dark.svg" width="49%" />
</p>

## Overview

> **Fork of [yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib)** (branched from v0.9.1).
> This fork adds custom themes (Nord, Solarized, Gruvbox, Rose Pine, Graphite), wave animation on 3D blocks, pie chart breathing effects, themed pie colors, gradient backgrounds, and a redesigned stats bar.
> See [CHANGE_LOG.md](./CHANGE_LOG.md) for the full list of changes.

This GitHub Action creates a GitHub contribution calendar on a 3D profile image.

## How to use (GitHub Actions) - Basic

This GitHub Action generates your github profile 3d contribution calendar and commits to your repo.
After adding the GitHub Action, the workflow runs automatically once a day.
You can also trigger the workflow manually.

### Step 1. Create special profile repository

Create a repository on GitHub with the same name as your username.

- For example, if the username is `octocat`, create a repository named `octocat/octocat`.
- See also: [Managing your profile README](https://docs.github.com/en/account-and-profile/how-tos/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme)

In this repository, follow the steps below.

### Step 2. Create workflow file

Create a workflow file like the one below.

- `.github/workflows/profile-3d.yml`

```yaml:.github/workflows/profile-3d.yml
name: GitHub-3D-Profile

on:
  schedule: # 03:00 JST == 18:00 UTC
    - cron: "0 18 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    name: generate-github-3d-profile
    steps:
      - uses: actions/checkout@v5
      - uses: xarthurx/github-3d-profile@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          USERNAME: ${{ github.repository_owner }}
      - name: Commit & Push
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add -A .
          if git commit -m "generated"; then
            git push
          fi
```

> [!NOTE]
> You can change your GitHub settings to include contributions from private repositories. To change this setting, click `Contribution settings` in the top right of the standard contribution calendar, or click your icon in the top right of the screen, select `Settings` ⇒ `Public profile` ⇒ `Contributions & Activity`, and check `Include private contributions on my profile`.
>
> If you want to include additional activities from private repositories, register a personal access token as a secret and set it to the `GITHUB_TOKEN` environment variable in the workflow file. However, in most cases the default `secrets.GITHUB_TOKEN` is sufficient.

The schedule is set to run once a day by default.
You can change the scheduled time as you like.

This will add the workflow to your repository.

#### Environment variables

In the sample, only `GITHUB_TOKEN` and `USERNAME` are specified as environment variables, but you can specify the following environment variables:

- `GITHUB_TOKEN` : (required) access token
- `USERNAME` : (required) target username (or specify with an argument).
- `MAX_REPOS` : (optional) max repositories, default 100 - since ver. 0.2.0
- `SETTING_JSON` : (optional) settings json file path. See `sample-settings/*.json` and `src/type.ts` in `xarthurx/github-3d-profile` repository for details. - since ver. 0.6.0
- `GITHUB_ENDPOINT` : (optional) Github GraphQL endpoint. For example, if you want to create a contribution calendar based on your company's GitHub Enterprise activity instead of GitHub.com, set this environment variable. e.g. `https://github.mycompany.com/api/graphql` - since ver. 0.8.0
- `YEAR` : (optional) For past calendars, specify the year. This is intended to be specified when running the tool from the command line. - since ver. 0.8.0
- `OUTPUT_DIR` : (optional) Custom output directory, default `./profile-3d-contrib`

#### About `GITHUB_TOKEN`

The `secrets.GITHUB_TOKEN` set in the `GITHUB_TOKEN` environment variable in the sample is a special access token automatically created by GitHub.

- GitHub Docs: [Use GITHUB_TOKEN for authentication in workflows](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)

If you want to generate a contribution calendar for public repositories only, use this value.
There is no need to create a secret manually.

Also, if you want to include activity in your private repositories in your contribution calendar, check "Include private contributions on my profile" in the "Profile settings" section of "Public profile" in your profile settings.

Furthermore, if you want to include additional activity information from private repositories, create an access token with the appropriate permissions.
Register that access token as a secret with any name you like (For example, `MY_PERSONAL_ACCESS_TOKEN`).
However, please note that user-created secrets cannot start with `GITHUB_`.

- GitHub Docs: [Secrets](https://docs.github.com/en/actions/concepts/security/secrets)

Set that secret as the value of the `GITHUB_TOKEN` environment variable.

```diff
          env:
-           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+           GITHUB_TOKEN: ${{ secrets.MY_PERSONAL_ACCESS_TOKEN }}
            USERNAME: ${{ github.repository_owner }}
```

#### About the time to schedule

In the sample, it is set to start at 18:00 UTC.
This is because it will run at midnight JST, which is the author's local time.

```yaml
on:
  schedule: # 03:00 JST == 18:00 UTC
    - cron: "0 18 * * *"
```

You can change it to any time you like.
We recommend midnight (around 3am) your local time.
However, please note that the time must be specified in UTC.

### Step 3. Manually run this GitHub Action

The first time, run this workflow manually.

- `Actions` -> `GitHub-3D-Profile` -> `Run workflow`

By default (without `SETTING_JSON`), the following profile images are generated:

- `profile-3d-contrib/profile-solarized-light.svg`
- `profile-3d-contrib/profile-solarized-dark.svg`

When using `SETTING_JSON` with the custom themes (see below), the output files are named according to the `fileName` property in your JSON config. For example, with `sample-settings/theme-preview.json`:

- `profile-3d-contrib/nord-light.svg`
- `profile-3d-contrib/nord-dark.svg`
- `profile-3d-contrib/solarized-light.svg`
- `profile-3d-contrib/solarized-dark.svg`
- `profile-3d-contrib/gruvbox-light.svg`
- `profile-3d-contrib/gruvbox-dark.svg`
- `profile-3d-contrib/rose-pine-light.svg`
- `profile-3d-contrib/rose-pine-dark.svg`
- `profile-3d-contrib/graphite-light.svg`
- `profile-3d-contrib/graphite-dark.svg`

### Theme previews (custom)

These previews are generated using custom settings JSON.
The workflow `.github/workflows/update-demo.yml` regenerates them on push using `sample-settings/theme-preview.json`.

**Nord**
<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/nord-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/nord-dark.svg" width="49%" />
</p>

**Solarized**
<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/solarized-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/solarized-dark.svg" width="49%" />
</p>

**Gruvbox**
<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/gruvbox-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/gruvbox-dark.svg" width="49%" />
</p>

**Rose Pine**
<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/rose-pine-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/rose-pine-dark.svg" width="49%" />
</p>

**Graphite**
<p>
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/graphite-light.svg" width="49%" />
  <img src="https://raw.githubusercontent.com/xarthurx/github-3d-profile/main/docs/demo/graphite-dark.svg" width="49%" />
</p>

### Step 4. Add image to README.md

Add the path to the generated image in your README file.

Example:

```md
![](./profile-3d-contrib/nord-light.svg)
```

## How to use (GitHub Actions) - Advanced examples

- [More info in EXAMPLES.md](./EXAMPLES.md)

## How to use (local)

Set the `GITHUB_TOKEN` environment variable to your personal access token.

```sh
export GITHUB_TOKEN=XXXXXXXXXXXXXXXXXXXXX
```

Run the following command, replacing `USER_NAME` with your GitHub username or the target username.

```sh
bunx ts-node src/index.ts USER_NAME
```

or

```sh
bun run build
node . USER_NAME
```

## License

&copy; 2021 SATO Yoshiyuki. Licensed under the MIT License.
Fork maintained by [xarthurx](https://github.com/xarthurx).
