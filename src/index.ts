import { repos } from './config.js';
import { log } from './lib/logger.js';
import {
  getPackageJson,
  getBaseBranchSha,
  createBranch,
  commitFile,
  createPullRequest,
} from './lib/github.js';
import { checkPackageVersionExists } from './lib/npm.js';
import type { PackageJson } from './types/index.js';

interface Result {
  repo: string;
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

interface UpdateDependencyParams {
  packageJson: PackageJson;
  packageName: string;
  newVersion: string;
}

interface UpdateResult {
  found: boolean;
  updated: boolean;
  alreadyUpToDate: boolean;
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

function updateDependencyVersion({
  packageJson,
  packageName,
  newVersion,
}: UpdateDependencyParams): UpdateResult {
  let found = false;
  let updated = false;
  let alreadyUpToDate = false;

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

  for (const depType of depTypes) {
    const currentVersion = packageJson[depType]?.[packageName];
    if (currentVersion) {
      found = true;
      if (currentVersion === newVersion) {
        alreadyUpToDate = true;
        continue;
      }
      packageJson[depType]![packageName] = newVersion;
      updated = true;
    }
  }

  return {
    found,
    updated,
    alreadyUpToDate: found && !updated && alreadyUpToDate,
  };
}

async function processRepo(
  repoFullName: string,
  packageName: string,
  newVersion: string
): Promise<Result> {
  const [owner, repo] = repoFullName.split('/');
  log.header(`${owner}/${repo}`);

  log.step('Fetching package.json...');
  const { content: packageJson, sha: fileSha } = await getPackageJson({ owner, repo });

  log.step(`Updating ${packageName} to ${newVersion}...`);
  const { found, updated, alreadyUpToDate } = updateDependencyVersion({
    packageJson,
    packageName,
    newVersion,
  });

  if (!found) {
    log.warn(`${packageName} not found in dependencies`);
    return {
      repo: repoFullName,
      success: true,
      skipped: true,
      skipReason: 'not found in dependencies',
    };
  }

  if (alreadyUpToDate) {
    log.warn(`${packageName} is already at version ${newVersion}, skipping...`);
    return {
      repo: repoFullName,
      success: true,
      skipped: true,
      skipReason: 'already up to date',
    };
  }

  if (!updated) {
    log.warn(`${packageName} could not be updated`);
    return {
      repo: repoFullName,
      success: true,
      skipped: true,
      skipReason: 'could not be updated',
    };
  }

  const newContent = JSON.stringify(packageJson, null, 2) + '\n';

  const branchName = `deps/update-${packageName}-${newVersion}`;
  log.step(`Creating branch: ${branchName}`);
  const baseSha = await getBaseBranchSha({ owner, repo });
  await createBranch({ owner, repo, branchName, sha: baseSha });

  log.step('Committing changes...');
  const commitMessage = `deps: update ${packageName} to ${newVersion}`;
  await commitFile({
    owner,
    repo,
    branchName,
    fileSha,
    content: newContent,
    message: commitMessage,
  });

  const pr = await createPullRequest({ owner, repo, branchName, packageName, newVersion });
  log.success(`Pull Request created: ${pr.html_url}`);

  return {
    repo: repoFullName,
    success: true,
  };
}

async function main(): Promise<void> {
  log.info(`Updating ${packageName} to ${newVersion} in ${repos.length} repo(s)...`);

  const results: Result[] = [];

  for (const repoFullName of repos) {
    try {
      const result = await processRepo(repoFullName, packageName, newVersion);
      results.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error(`${repoFullName}: ${message}`);
      results.push({
        repo: repoFullName,
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
