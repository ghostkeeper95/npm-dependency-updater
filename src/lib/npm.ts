export async function checkPackageVersionExists(
  packageName: string,
  version: string
): Promise<boolean> {
  const url = `https://registry.npmjs.org/${packageName}/${version}`;

  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
