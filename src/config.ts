import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
export const BASE_BRANCH = 'main';

const REPOS_CONFIG_PATH = path.join(__dirname, '..', 'repos.json');
export const repos: string[] = JSON.parse(fs.readFileSync(REPOS_CONFIG_PATH, 'utf-8'));
