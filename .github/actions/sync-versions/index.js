const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

async function getWordPressVersion() {
    const mainFile = core.getInput('main-file');

    // Read WordPress version from the main PHP file
    const mainFileData = await fs.readFile(mainFile, 'utf-8');
    const wpVersionMatch = mainFileData.match(/Version:\s*([\d.]+)/);
    const wpVersion = wpVersionMatch ? wpVersionMatch[1] : null;

    if (!wpVersion) {
        core.setFailed('WordPress version is NOT defined.');
        return false;
    }

    return wpVersion;
}

async function getComposerVersion() {
    // Read Composer version from composer.json
    const composerJsonData = await fs.readJson(path.join('.', 'composer.json'));
    const composerVersion = composerJsonData.version;

    if (!composerVersion) {
        core.setFailed('Composer version is NOT defined.');
        return false;
    }

    return composerVersion;
}

try {
    async () => {
        const token = core.getInput('github-token');
        const octokit = github.getOctokit(token);

        const wpVersion = await getWordPressVersion();
        const composerVersion = await getComposerVersion();

        if (!wpVersion || !composerVersion || wpVersion == composerVersion) {
            return false;
        }

        const newerVersion = semver.gt(wpVersion, composerVersion) ? wpVersion : composerVersion;

        // Update the main PHP file
        const updatedMainFileData = mainFileData.replace(`Version: ${wpVersion}`, `Version: ${newerVersion}`);
        await fs.writeFile(mainFile, updatedMainFileData, 'utf-8');

        // Update composer.json
        composerJsonData.version = newerVersion;
        await fs.writeJson(composerJsonPath, composerJsonData, { spaces: 2 });

        // Commit and push changes
        const { repo: { owner, repo } } = github.context;
        const message = `Bump version to ${newerVersion}`;
        const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${github.context.ref}` });
        const tree = await octokit.git.createTree({
            owner,
            repo,
            base_tree: ref.object.sha,
            tree: [
                { path: mainFile, mode: '100644', type: 'blob', content: updatedMainFileData },
                { path: composerJsonPath, mode: '100644', type: 'blob', content: JSON.stringify(composerJsonData, null, 2) }
            ]
        });
        const newCommit = await octokit.git.createCommit({
            owner,
            repo,
            message,
            tree: tree.data.sha,
            parents: [ref.object.sha]
        });
        await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${github.context.ref}`,
            sha: newCommit.data.sha
        });

        // Output the newer version
        core.setOutput('newer-version', newerVersion);
    };
} catch (error) {
    core.setFailed(error.message);
}