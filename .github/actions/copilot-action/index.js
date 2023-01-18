const core = require('@actions/core');
const github = require('@actions/github');
const process = require('child_process');
const packageJson = require("./package.json");

/*
inputs:
  token:
    description: "Authorized secret GitHub Personal Access Token. Defaults to github.token"
    required: false
    default: ${{ github.token }}
*/

const token = core.getInput('token');
const octokit = github.getOctokit(token);

try {
	async () => {
		// create a github workflow action that output the package.json version
		const packageJson = require('./package.json');
		console.log(packageJson.version.trim());

		// Fastest & Safest
		console.time(' - spawnSync');
		const tagSpawn = process.spawnSync('git', ['describe', '--tags', '--abbrev=0']);
		console.log(tagSpawn.stdout.toString().replace('v', '').trim());
		console.timeEnd(' - spawnSync');

		// Fast
		console.time(' - execSync');
		// using git to get the current tag and strip the v prefix
		const tag = process.execSync('git describe --tags --abbrev=0');
		console.log(tag.toString().replace('v', '').trim());
		console.timeEnd(' - execSync');

		// Slowest
		console.time(' - listTags');
		const {data} = await octokit.rest.repos.listTags({
			owner: 'pfaciana',
			repo: 'actions-test',
		});

		console.log(data[0].name.replace('v', ''));
		console.timeEnd(' - listTags');

		// compare package.json version and git tag and console log the result
		console.log(packageJson.version === tag ? 'Versions match' : 'Versions do not match');
	};
	(async () => {
		// using git check to see if there are files that have been modified
		const modified = process.execSync('git status --porcelain');
		console.log(modified.toString().trim() === '' ? 'No files modified' : 'Files modified');

		// using git check to see if there are files that need to be committed
		const untracked = process.execSync('git ls-files --others --exclude-standard');
		console.log(untracked.toString().trim() === '' ? 'No files to add' : 'Files to add');

		// using git check to see if there are files that need to be added
		const uncommitted = process.execSync('git diff --compact-summary');
		console.log(uncommitted.toString().trim() === '' ? 'No files to commit' : 'Files to commit');

		// using git check to see if there are files that need to be pushed
		const ahead = process.execSync('git rev-list --count --right-only @{u}...HEAD')
		console.log(ahead.toString().trim() === '0' ? 'No files to push' : 'Files to push');

		// using git check to see if there are files that need to be pulled
		const behind = process.execSync('git rev-list --count --left-only @{u}...HEAD');
		console.log(behind.toString().trim() === '0' ? 'No files to pull' : 'Files to pull');
	})();
} catch (error) {
	core.setFailed(error.message);
}

// act -j gulpfile --secret-file .github/local.secrets --env-file .github/local.env