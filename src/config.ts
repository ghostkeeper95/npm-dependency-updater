import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RepoConfig } from './types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const DEFAULT_BASE_BRANCH = 'main';

const REPOS_CONFIG_PATH = path.join(__dirname, '..', 'repos.json');

function loadRepos(): RepoConfig[] {
  // Check if file exists
  if (!fs.existsSync(REPOS_CONFIG_PATH)) {
    throw new Error(`repos.json not found at ${REPOS_CONFIG_PATH}`);
  }

  // Read and parse JSON
  let rawData: unknown;
  try {
    const fileContent = fs.readFileSync(REPOS_CONFIG_PATH, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse repos.json: ${message}`);
  }

  // Validate array
  if (!Array.isArray(rawData)) {
    throw new Error('repos.json must contain an array');
  }

  // Validate not empty
  if (rawData.length === 0) {
    throw new Error('repos.json is empty. Add at least one repository.');
  }

  // Validate and transform each entry
  const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  const invalidRepos: string[] = [];
  const result: RepoConfig[] = [];

  for (const entry of rawData) {
    if (typeof entry !== 'object' || entry === null) {
      invalidRepos.push(String(entry));
      continue;
    }

    const { repo, baseBranch } = entry as { repo?: string; baseBranch?: string };

    if (typeof repo !== 'string' || !repoPattern.test(repo)) {
      invalidRepos.push(JSON.stringify(entry));
      continue;
    }

    result.push({
      repo,
      baseBranch: baseBranch && typeof baseBranch === 'string' ? baseBranch : DEFAULT_BASE_BRANCH,
    });
  }

  if (invalidRepos.length > 0) {
    throw new Error(
      `Invalid repository format in repos.json: ${invalidRepos.join(', ')}\n` +
        'Expected format: { "repo": "owner/repo", "baseBranch": "main" }'
    );
  }

  return result;
}

export const repos: RepoConfig[] = loadRepos();
