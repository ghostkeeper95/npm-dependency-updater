export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface PackageJsonResult {
  content: PackageJson;
  sha: string;
}

export interface Result {
  repo: string;
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}
