import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock fs module before importing config
vi.mock('fs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_CONFIG_PATH = path.join(__dirname, 'fixtures', 'repos.json');

describe('config', () => {
  const mockFsExistsSync = vi.mocked(fs.existsSync);
  const mockFsReadFileSync = vi.mocked(fs.readFileSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadRepos', () => {
    it('should throw error when repos.json does not exist', async () => {
      mockFsExistsSync.mockReturnValue(false);

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('repos.json not found');
    });

    it('should throw error when repos.json contains invalid JSON', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue('{ invalid json }');

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Failed to parse repos.json');
    });

    it('should throw error when repos.json is not an array', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ repo: 'owner/repo' }));

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('repos.json must contain an array');
    });

    it('should throw error when repos.json is empty array', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([]));

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow(
        'repos.json is empty. Add at least one repository.'
      );
    });

    it('should throw error when entry is not an object', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify(['owner/repo']));

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Invalid repository format');
    });

    it('should throw error when entry is null', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([null]));

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Invalid repository format');
    });

    it('should throw error when repo field is missing', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ baseBranch: 'main' }]));

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Invalid repository format');
    });

    it('should throw error when repo format is invalid', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify([{ repo: 'invalid-format', baseBranch: 'main' }])
      );

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Invalid repository format');
    });

    it('should throw error when repo has invalid characters', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify([{ repo: 'owner/repo with spaces', baseBranch: 'main' }])
      );

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow('Invalid repository format');
    });

    it('should successfully load valid repos with baseBranch', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify([
          { repo: 'owner/repo1', baseBranch: 'develop' },
          { repo: 'owner/repo2', baseBranch: 'master' },
        ])
      );

      const { loadRepos } = await import('../src/config.js');
      const repos = loadRepos(TEST_CONFIG_PATH);

      expect(repos).toEqual([
        { repo: 'owner/repo1', baseBranch: 'develop' },
        { repo: 'owner/repo2', baseBranch: 'master' },
      ]);
    });

    it('should use DEFAULT_BASE_BRANCH when baseBranch is not provided', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ repo: 'owner/repo' }]));

      const { loadRepos, DEFAULT_BASE_BRANCH } = await import('../src/config.js');
      const repos = loadRepos(TEST_CONFIG_PATH);

      expect(repos).toEqual([{ repo: 'owner/repo', baseBranch: DEFAULT_BASE_BRANCH }]);
    });

    it('should use DEFAULT_BASE_BRANCH when baseBranch is not a string', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ repo: 'owner/repo', baseBranch: 123 }]));

      const { loadRepos, DEFAULT_BASE_BRANCH } = await import('../src/config.js');
      const repos = loadRepos(TEST_CONFIG_PATH);

      expect(repos).toEqual([{ repo: 'owner/repo', baseBranch: DEFAULT_BASE_BRANCH }]);
    });

    it('should accept repo names with dots, underscores and hyphens', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify([{ repo: 'my-org/my_repo.js' }, { repo: 'org.name/repo-name_v2' }])
      );

      const { loadRepos } = await import('../src/config.js');
      const repos = loadRepos(TEST_CONFIG_PATH);

      expect(repos).toHaveLength(2);
      expect(repos[0].repo).toBe('my-org/my_repo.js');
      expect(repos[1].repo).toBe('org.name/repo-name_v2');
    });

    it('should report multiple invalid repos in error message', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify([{ repo: 'invalid1' }, { repo: 'valid/repo' }, { repo: 'invalid2' }])
      );

      const { loadRepos } = await import('../src/config.js');

      expect(() => loadRepos(TEST_CONFIG_PATH)).toThrow(/invalid1.*invalid2/s);
    });
  });

  describe('getRepos', () => {
    it('should cache repos after first call', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ repo: 'owner/repo' }]));

      const { getRepos, clearReposCache } = await import('../src/config.js');

      // Clear cache to start fresh
      clearReposCache();

      const repos1 = getRepos();
      const repos2 = getRepos();

      // Should be the same reference (cached)
      expect(repos1).toBe(repos2);
      // fs.readFileSync should only be called once
      expect(mockFsReadFileSync).toHaveBeenCalledTimes(1);
    });

    it('should reload repos after clearReposCache', async () => {
      mockFsExistsSync.mockReturnValue(true);
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ repo: 'owner/repo1' }]));

      const { getRepos, clearReposCache } = await import('../src/config.js');

      clearReposCache();
      const repos1 = getRepos();

      // Change mock data
      mockFsReadFileSync.mockReturnValue(JSON.stringify([{ repo: 'owner/repo2' }]));

      clearReposCache();
      const repos2 = getRepos();

      expect(repos1[0].repo).toBe('owner/repo1');
      expect(repos2[0].repo).toBe('owner/repo2');
    });
  });

  describe('exports', () => {
    it('should export DEFAULT_BASE_BRANCH as main', async () => {
      const { DEFAULT_BASE_BRANCH } = await import('../src/config.js');

      expect(DEFAULT_BASE_BRANCH).toBe('main');
    });

    it('should export GITHUB_TOKEN from environment', async () => {
      const config = await import('../src/config.js');

      // GITHUB_TOKEN comes from process.env, so it could be undefined or a value
      expect('GITHUB_TOKEN' in config).toBe(true);
    });
  });
});
