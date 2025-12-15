import type { PackageJson } from '../../types/index.js';

export interface UpdateDependencyParams {
  packageJson: PackageJson;
  packageName: string;
  newVersion: string;
}

export interface UpdateResult {
  found: boolean;
  updated: boolean;
  alreadyUpToDate: boolean;
  updatedIn: string[];
}
