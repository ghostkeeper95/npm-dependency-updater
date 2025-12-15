import { describe, it, expect } from 'vitest';
import { updateDependencyVersion } from '../src/modules/dependency/index.js';
import type { PackageJson } from '../src/types/index.js';

describe('updateDependencyVersion', () => {
  describe('when package exists in dependencies', () => {
    it('should update version when different', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'lodash',
        newVersion: '4.17.21',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(result.updatedIn).toEqual(['dependencies']);
      expect(packageJson.dependencies?.lodash).toBe('4.17.21');
    });

    it('should return alreadyUpToDate when version matches', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'lodash',
        newVersion: '4.17.21',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(true);
      expect(result.updatedIn).toEqual([]);
      expect(packageJson.dependencies?.lodash).toBe('4.17.21');
    });
  });

  describe('when package exists in devDependencies', () => {
    it('should update version when different', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          vitest: '1.0.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'vitest',
        newVersion: '2.0.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(result.updatedIn).toEqual(['devDependencies']);
      expect(packageJson.devDependencies?.vitest).toBe('2.0.0');
    });

    it('should return alreadyUpToDate when version matches', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          vitest: '2.0.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'vitest',
        newVersion: '2.0.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(true);
    });
  });

  describe('when package exists in peerDependencies', () => {
    it('should update version when different', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        peerDependencies: {
          react: '17.0.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(result.updatedIn).toEqual(['peerDependencies']);
      expect(packageJson.peerDependencies?.react).toBe('18.2.0');
    });
  });

  describe('when package exists in multiple dependency types', () => {
    it('should update all occurrences', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '17.0.0',
        },
        peerDependencies: {
          react: '17.0.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(result.updatedIn).toEqual(['dependencies', 'peerDependencies']);
      expect(packageJson.dependencies?.react).toBe('18.2.0');
      expect(packageJson.peerDependencies?.react).toBe('18.2.0');
    });

    it('should handle mixed versions - some match, some differ', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '18.2.0', // already at target
        },
        devDependencies: {
          react: '17.0.0', // needs update
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(packageJson.dependencies?.react).toBe('18.2.0');
      expect(packageJson.devDependencies?.react).toBe('18.2.0');
    });

    it('should return alreadyUpToDate when all versions match', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '18.2.0',
        },
        peerDependencies: {
          react: '18.2.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(true);
    });
  });

  describe('when package does not exist', () => {
    it('should return found=false for missing package', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.21',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(false);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(false);
    });

    it('should return found=false for empty dependencies', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(false);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(false);
    });

    it('should return found=false when dependencies object is empty', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'react',
        newVersion: '18.2.0',
      });

      expect(result.found).toBe(false);
      expect(result.updated).toBe(false);
      expect(result.alreadyUpToDate).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle version with caret prefix as different version', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '^4.17.21',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'lodash',
        newVersion: '4.17.21',
      });

      // ^4.17.21 !== 4.17.21, so it should update
      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.alreadyUpToDate).toBe(false);
      expect(packageJson.dependencies?.lodash).toBe('4.17.21');
    });

    it('should handle version with tilde prefix as different version', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '~4.17.21',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: 'lodash',
        newVersion: '4.17.21',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(packageJson.dependencies?.lodash).toBe('4.17.21');
    });

    it('should not modify other packages', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          lodash: '4.17.0',
          express: '4.18.0',
        },
      };

      updateDependencyVersion({
        packageJson,
        packageName: 'lodash',
        newVersion: '4.17.21',
      });

      expect(packageJson.dependencies?.lodash).toBe('4.17.21');
      expect(packageJson.dependencies?.express).toBe('4.18.0');
    });

    it('should handle scoped packages', () => {
      const packageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          '@octokit/rest': '20.0.0',
        },
      };

      const result = updateDependencyVersion({
        packageJson,
        packageName: '@octokit/rest',
        newVersion: '21.0.0',
      });

      expect(result.found).toBe(true);
      expect(result.updated).toBe(true);
      expect(packageJson.dependencies?.['@octokit/rest']).toBe('21.0.0');
    });
  });
});
