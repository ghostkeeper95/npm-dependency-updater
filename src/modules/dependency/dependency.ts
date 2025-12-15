import type { UpdateDependencyParams, UpdateResult } from './types.js';

const DEP_TYPES = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

export function updateDependencyVersion({
  packageJson,
  packageName,
  newVersion,
}: UpdateDependencyParams): UpdateResult {
  let found = false;
  let updated = false;
  const updatedIn: string[] = [];

  for (const depType of DEP_TYPES) {
    const deps = packageJson[depType];
    const currentVersion = deps?.[packageName];

    if (!currentVersion) continue;

    found = true;

    if (currentVersion === newVersion) continue;

    deps[packageName] = newVersion;
    updated = true;
    updatedIn.push(depType);
  }

  return {
    found,
    updated,
    alreadyUpToDate: found && !updated,
    updatedIn,
  };
}
