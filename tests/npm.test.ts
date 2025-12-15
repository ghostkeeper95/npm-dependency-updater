import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkPackageVersionExists } from '../src/modules/npm/index.js';

describe('checkPackageVersionExists', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when package version exists', () => {
    it('should return true for existing package version', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await checkPackageVersionExists('lodash', '4.17.21');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://registry.npmjs.org/lodash/4.17.21');
    });
  });

  describe('when package version does not exist', () => {
    it('should return false for non-existing version', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await checkPackageVersionExists('lodash', '999.999.999');

      expect(result).toBe(false);
    });

    it('should return false for non-existing package', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await checkPackageVersionExists('non-existing-package-xyz', '1.0.0');

      expect(result).toBe(false);
    });
  });

  describe('when network error occurs', () => {
    it('should return false on fetch error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await checkPackageVersionExists('lodash', '4.17.21');

      expect(result).toBe(false);
    });
  });

  describe('URL construction', () => {
    it('should correctly construct URL for regular package', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      await checkPackageVersionExists('express', '4.18.2');

      expect(fetch).toHaveBeenCalledWith('https://registry.npmjs.org/express/4.18.2');
    });

    it('should correctly construct URL for scoped package', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      await checkPackageVersionExists('@octokit/rest', '21.0.0');

      expect(fetch).toHaveBeenCalledWith('https://registry.npmjs.org/@octokit/rest/21.0.0');
    });
  });
});
