export interface GitAuthor {
  readonly name: string;
  readonly email: string;
  readonly date: Date;
}

export interface FileChange {
  readonly path: string;
  readonly changeType: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  readonly insertions?: number;
  readonly deletions?: number;
  readonly oldPath?: string; // For renamed files
}

export interface GitCommit {
  readonly hash: string;
  readonly shortHash: string;
  readonly author: GitAuthor;
  readonly committer: GitAuthor;
  readonly message: string;
  readonly subject: string;
  readonly body?: string;
  readonly date: Date;
  readonly files: readonly FileChange[];
  readonly isMerge: boolean;
  readonly parents: readonly string[];
  readonly stats?: {
    readonly totalInsertions: number;
    readonly totalDeletions: number;
    readonly filesChanged: number;
  };
}

export interface GitHistoryQuery {
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly authors?: readonly string[];
  readonly authorPattern?: string;
  readonly filePaths?: readonly string[];
  readonly filePattern?: string;
  readonly maxCount?: number;
  readonly skip?: number;
  readonly includeMerges?: boolean;
  readonly sortBy?: 'date' | 'author' | 'hash';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface GitHistoryResult {
  readonly commits: readonly GitCommit[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly query: GitHistoryQuery;
}

export interface RepositoryInfo {
  readonly path: string;
  readonly isRepository: boolean;
  readonly currentBranch?: string;
  readonly remotes?: readonly string[];
  readonly lastCommit?: GitCommit;
}

export interface CacheConfig {
  readonly enabled: boolean;
  readonly ttlSeconds: number;
  readonly maxEntries: number;
}