export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface RepoParams extends BaseRepoParams {
  baseBranch: string;
}

export interface BranchParams extends RepoParams {
  branchName: string;
  sha: string;
}

export interface CommitFileParams extends RepoParams {
  branchName: string;
  fileSha: string;
  content: string;
  message: string;
}

export interface PullRequestParams extends RepoParams {
  branchName: string;
  packageName: string;
  newVersion: string;
}

export interface CheckBranchParams extends BaseRepoParams {
  branchName: string;
}
