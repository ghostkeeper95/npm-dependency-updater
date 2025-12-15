import { getRepos, GITHUB_TOKEN } from './config.js';
import { log } from './modules/logger/index.js';
import {
  getPackageJson,
  getBaseBranchSha,
  createBranch,
  commitFile,
  createPullRequest,
} from './modules/github/index.js';
import { checkPackageVersionExists } from './modules/npm/index.js';
import { updateDependencyVersion } from './modules/dependency/index.js';
import type { RepoConfig, Result } from './types/index.js';

// Validate GitHub token
if (!GITHUB_TOKEN) {
  log.error('GITHUB_TOKEN is not set. Please add it to your .env file.');
  log.error('See .env.sample for reference.');
  process.exit(1);
}

const [, , packageName, newVersion] = process.argv;

if (!packageName || !newVersion) {
  log.error('Usage: npx tsx src/index.ts <packageName> <newVersion>');
  log.error('Example: npx tsx src/index.ts react 18.2.0');
  process.exit(1);
}

// Validate package version exists on npm
log.step(`Checking if ${packageName}@${newVersion} exists on npm...`);
const versionExists = await checkPackageVersionExists(packageName, newVersion);

if (!versionExists) {
  log.error(`Package ${packageName}@${newVersion} does not exist on npm registry`);
  process.exit(1);
}

log.success(`Found ${packageName}@${newVersion} on npm`);

async function processRepo(
  repoConfig: RepoConfig,
  packageName: string,
  newVersion: string
): Promise<Result> {
  const [owner, repo] = repoConfig.repo.split('/');
  const baseBranch = repoConfig.baseBranch;
  log.header(`${owner}/${repo} (${baseBranch})`);

  log.step('Fetching package.json...');
  const { content: packageJson, sha: fileSha } = await getPackageJson({
    owner,
    repo,
    baseBranch,
  });

  log.step(`Updating ${packageName} to ${newVersion}...`);
  const { found, updated, alreadyUpToDate } = updateDependencyVersion({
    packageJson,
    packageName,
    newVersion,
  });

  if (!found) {
    log.warn(`${packageName} not found in dependencies`);
    return {
      repo: repoConfig.repo,
      success: true,
      skipped: true,
      skipReason: 'not found in dependencies',
    };
  }

  if (alreadyUpToDate) {
    log.warn(`${packageName} is already at version ${newVersion}, skipping...`);
    return {
      repo: repoConfig.repo,
      success: true,
      skipped: true,
      skipReason: 'already up to date',
    };
  }

  if (!updated) {
    log.warn(`${packageName} could not be updated`);
    return {
      repo: repoConfig.repo,
      success: true,
      skipped: true,
      skipReason: 'could not be updated',
    };
  }

  const newContent = JSON.stringify(packageJson, null, 2) + '\n';

  const branchName = `deps/update-${packageName}-${newVersion}`;
  log.step(`Creating branch: ${branchName}`);
  const baseSha = await getBaseBranchSha({ owner, repo, baseBranch });
  await createBranch({ owner, repo, baseBranch, branchName, sha: baseSha });

  log.step('Committing changes...');
  const commitMessage = `deps: update ${packageName} to ${newVersion}`;
  await commitFile({
    owner,
    repo,
    baseBranch,
    branchName,
    fileSha,
    content: newContent,
    message: commitMessage,
  });

  const pr = await createPullRequest({
    owner,
    repo,
    baseBranch,
    branchName,
    packageName,
    newVersion,
  });
  log.success(`Pull Request created: ${pr.html_url}`);

  return {
    repo: repoConfig.repo,
    success: true,
  };
}

async function main(): Promise<void> {
  const repos = getRepos();
  log.info(`Updating ${packageName} to ${newVersion} in ${repos.length} repo(s)...`);

  const results: Result[] = [];

  for (const repoConfig of repos) {
    try {
      const result = await processRepo(repoConfig, packageName, newVersion);
      results.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error(`${repoConfig.repo}: ${message}`);
      results.push({
        repo: repoConfig.repo,
        success: false,
        error: message,
      });
    }
  }

  const successful = results.filter((result) => result.success && !result.skipped);
  const skipped = results.filter((result) => result.skipped);
  const failed = results.filter((result) => !result.success);

  log.header('=== Summary ===');

  if (successful.length > 0) {
    log.success(`Successful: ${successful.length}`);
    successful.forEach((result) => console.log(`   ${result.repo}`));
  }

  if (skipped.length > 0) {
    log.warn(`Skipped: ${skipped.length}`);
    skipped.forEach((result) => console.log(`   ${result.repo}: ${result.skipReason}`));
  }

  if (failed.length > 0) {
    log.error(`Failed: ${failed.length}`);
    failed.forEach((result) => console.log(`   ${result.repo}: ${result.error}`));
  }

  log.info('Done!');
}

main();
