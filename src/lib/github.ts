import { Octokit } from '@octokit/rest';
import type { Endpoints } from '@octokit/types';
import { GITHUB_TOKEN, BASE_BRANCH } from '../config.js';
import { log } from './logger.js';
import type { PackageJsonResult } from '../types/index.js';
import type {
  RepoParams,
  BranchParams,
  CommitFileParams,
  PullRequestParams,
} from '../types/github.js';

type PullRequest = Endpoints['POST /repos/{owner}/{repo}/pulls']['response']['data'];

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function getPackageJson({ owner, repo }: RepoParams): Promise<PackageJsonResult> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: 'package.json',
    ref: BASE_BRANCH,
  });

  if (!('content' in data)) {
    throw new Error('package.json not found or is a directory');
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content: JSON.parse(content), sha: data.sha };
}

export async function getBaseBranchSha({ owner, repo }: RepoParams): Promise<string> {
  const { data } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${BASE_BRANCH}`,
  });
  return data.object.sha;
}

export async function createBranch({ owner, repo, branchName, sha }: BranchParams): Promise<void> {
  const branchExists = await checkBranchExists({ owner, repo, branchName });

  if (branchExists) {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });
    log.info(`Deleted existing branch: ${branchName}`);
  }

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  });
}

async function checkBranchExists({
  owner,
  repo,
  branchName,
}: RepoParams & { branchName: string }): Promise<boolean> {
  try {
    await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function commitFile({
  owner,
  repo,
  branchName,
  fileSha,
  content,
  message,
}: CommitFileParams): Promise<void> {
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'package.json',
    message,
    content: Buffer.from(content).toString('base64'),
    branch: branchName,
    sha: fileSha,
  });
}

export async function createPullRequest({
  owner,
  repo,
  branchName,
  packageName,
  newVersion,
}: PullRequestParams): Promise<PullRequest> {
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Update ${packageName} to ${newVersion}`,
    head: branchName,
    base: BASE_BRANCH,
    body: `This PR updates \`${packageName}\` to version \`${newVersion}\`.

Generated automatically by npm-dependency-updater.`,
  });

  return pr;
}
