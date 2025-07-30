import { DefaultLogFields } from 'simple-git';
import { GitCommit, GitAuthor, FileChange } from '../types';
import { DataProcessingError } from '../errors';

export class GitDataProcessor {
  
  /**
   * Convert simple-git LogResult data to our GitCommit domain objects
   */
  processCommits(simpleGitCommits: readonly DefaultLogFields[]): readonly GitCommit[] {
    try {
      return simpleGitCommits.map(commit => this.processCommit(commit));
    } catch (error) {
      throw new DataProcessingError('Failed to process commits', error as Error);
    }
  }

  /**
   * Convert a single simple-git commit to GitCommit domain object
   */
  processCommit(simpleGitCommit: DefaultLogFields): GitCommit {
    try {
      const author = this.processAuthor(simpleGitCommit.author_name, simpleGitCommit.author_email, simpleGitCommit.date);
      const committer = this.processAuthor(
        simpleGitCommit.author_name, // simple-git doesn't separate committer, use author
        simpleGitCommit.author_email,
        simpleGitCommit.date
      );

      const extendedCommit = simpleGitCommit as DefaultLogFields & { diff?: { files?: unknown[] } };
      const files = this.processFileChanges(extendedCommit.diff);
      const stats = this.calculateStats(files);
      
      return {
        hash: simpleGitCommit.hash,
        shortHash: simpleGitCommit.hash.substring(0, 7),
        author,
        committer,
        message: simpleGitCommit.message,
        subject: this.extractSubject(simpleGitCommit.message),
        body: this.extractBody(simpleGitCommit.message),
        date: new Date(simpleGitCommit.date),
        files,
        isMerge: this.isMergeCommit(simpleGitCommit),
        parents: this.extractParents(simpleGitCommit),
        stats
      };
    } catch (error) {
      throw new DataProcessingError(`Failed to process commit ${simpleGitCommit.hash}`, error as Error);
    }
  }

  /**
   * Process author information from simple-git data
   */
  private processAuthor(name: string, email: string, date: string): GitAuthor {
    return {
      name: name || 'Unknown',
      email: email || 'unknown@example.com',
      date: new Date(date)
    };
  }

  /**
   * Process file changes from simple-git diff data
   */
  private processFileChanges(diff?: { files?: unknown[] }): readonly FileChange[] {
    if (!diff || !diff.files) {
      return [];
    }

    try {
      return diff.files.map((file: unknown) => this.processFileChange(file));
    } catch {
      // Return empty array if diff processing fails - this is not critical
      return [];
    }
  }

  /**
   * Process a single file change from simple-git diff data
   */
  private processFileChange(file: unknown): FileChange {
    const fileData = file as Record<string, unknown>;
    const changeType = this.determineChangeType(fileData);
    
    return {
      path: (fileData.file as string) || (fileData.path as string) || 'unknown',
      changeType,
      insertions: (fileData.insertions as number) || undefined,
      deletions: (fileData.deletions as number) || undefined,
      oldPath: (fileData.before as string) || undefined
    };
  }

  /**
   * Determine the type of change for a file
   */
  private determineChangeType(file: Record<string, unknown>): FileChange['changeType'] {
    if (file.binary) {
      return 'modified';
    }

    const before = file.before as string;
    const current = (file.file as string) || (file.path as string);
    const insertions = (file.insertions as number) || 0;
    const deletions = (file.deletions as number) || 0;

    return this.classifyChangeType(before, current, insertions, deletions);
  }

  /**
   * Classify change type based on file paths and line changes
   */
  private classifyChangeType(
    before: string, 
    current: string, 
    insertions: number, 
    deletions: number
  ): FileChange['changeType'] {
    if (before && current !== before) {
      return 'renamed';
    }

    if (insertions > 0 && deletions === 0) {
      return 'added';
    }

    if (insertions === 0 && deletions > 0) {
      return 'deleted';
    }

    return 'modified';
  }

  /**
   * Calculate statistics from file changes
   */
  private calculateStats(files: readonly FileChange[]): GitCommit['stats'] {
    if (files.length === 0) {
      return undefined;
    }

    const totalInsertions = files.reduce((sum, file) => sum + (file.insertions || 0), 0);
    const totalDeletions = files.reduce((sum, file) => sum + (file.deletions || 0), 0);

    return {
      totalInsertions,
      totalDeletions,
      filesChanged: files.length
    };
  }

  /**
   * Extract subject line from commit message
   */
  private extractSubject(message: string): string {
    const lines = message.trim().split('\n');
    return lines[0] || '';
  }

  /**
   * Extract body from commit message (everything after subject)
   */
  private extractBody(message: string): string | undefined {
    const lines = message.trim().split('\n');
    if (lines.length <= 2) {
      return undefined;
    }

    // Skip subject line and first empty line
    const bodyLines = lines.slice(2);
    const body = bodyLines.join('\n').trim();
    
    return body || undefined;
  }

  /**
   * Determine if commit is a merge commit
   */
  private isMergeCommit(commit: DefaultLogFields): boolean {
    // Simple-git doesn't always provide parent info directly
    // We can infer merge commits from message patterns or if we have the info
    const extendedCommit = commit as DefaultLogFields & { parents?: string[] };
    return commit.message.toLowerCase().includes('merge') || 
           (extendedCommit.parents?.length ?? 0) > 1 ||
           false;
  }

  /**
   * Extract parent commit hashes
   */
  private extractParents(commit: DefaultLogFields): readonly string[] {
    // simple-git may include parent info in some cases
    const extendedCommit = commit as DefaultLogFields & { parents?: string[] };
    if (extendedCommit.parents) {
      return extendedCommit.parents;
    }
    
    // For most commits, we don't have parent info from simple-git log
    // This would need to be enhanced with additional git commands if needed
    return [];
  }

  /**
   * Parse diff output to extract file change information
   */
  parseDiffOutput(diffOutput: string): readonly FileChange[] {
    try {
      const changes: FileChange[] = [];
      const lines = diffOutput.split('\n');
      
      let currentFile: Partial<FileChange> | null = null;

      for (const line of lines) {
        const processedFile = this.processDiffLine(line, currentFile);
        
        if (processedFile.shouldFinalize && currentFile) {
          changes.push(this.finalizeFileChange(currentFile));
        }
        
        currentFile = processedFile.currentFile;
      }

      // Don't forget the last file
      if (currentFile) {
        changes.push(this.finalizeFileChange(currentFile));
      }

      return changes;
    } catch (error) {
      throw new DataProcessingError('Failed to parse diff output', error as Error);
    }
  }

  /**
   * Process a single line from diff output
   */
  private processDiffLine(
    line: string, 
    currentFile: Partial<FileChange> | null
  ): { currentFile: Partial<FileChange> | null; shouldFinalize: boolean } {
    // Parse diff headers like "diff --git a/file.txt b/file.txt"
    if (line.startsWith('diff --git')) {
      return {
        currentFile: this.parseDiffHeader(line),
        shouldFinalize: true
      };
    }

    if (!currentFile) {
      return { currentFile: null, shouldFinalize: false };
    }

    const updatedFile = this.updateFileFromDiffLine(line, currentFile);
    return { currentFile: updatedFile, shouldFinalize: false };
  }

  /**
   * Update file change object based on diff line
   */
  private updateFileFromDiffLine(line: string, file: Partial<FileChange>): Partial<FileChange> {
    const updatedFile = { ...file };

    if (line.startsWith('new file mode')) {
      updatedFile.changeType = 'added';
    } else if (line.startsWith('deleted file mode')) {
      updatedFile.changeType = 'deleted';
    } else if (line.startsWith('rename from')) {
      updatedFile.changeType = 'renamed';
      updatedFile.oldPath = line.replace('rename from ', '');
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      updatedFile.insertions = (updatedFile.insertions ?? 0) + 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      updatedFile.deletions = (updatedFile.deletions ?? 0) + 1;
    }

    return updatedFile;
  }

  /**
   * Parse diff header to extract file path
   */
  private parseDiffHeader(line: string): Partial<FileChange> {
    // Parse "diff --git a/path/file.txt b/path/file.txt"
    const match = line.match(/diff --git a\/(.+) b\/(.+)/);
    if (match) {
      const [, oldPath, newPath] = match;
      return {
        path: newPath,
        oldPath: oldPath !== newPath ? oldPath : undefined,
        changeType: 'modified', // Default, may be overridden
        insertions: undefined,
        deletions: undefined
      };
    }
    
    return {
      path: 'unknown',
      changeType: 'modified',
      insertions: undefined,
      deletions: undefined
    };
  }

  /**
   * Finalize file change object with proper defaults
   */
  private finalizeFileChange(partial: Partial<FileChange>): FileChange {
    return {
      path: partial.path || 'unknown',
      changeType: partial.changeType || 'modified',
      insertions: partial.insertions ?? 0,
      deletions: partial.deletions ?? 0,
      oldPath: partial.oldPath
    };
  }

  /**
   * Enhance commit with additional metadata and statistics
   */
  enhanceCommit(commit: GitCommit, additionalData?: {
    diffOutput?: string;
    statsOutput?: string;
  }): GitCommit {
    try {
      let enhancedFiles = commit.files;
      let enhancedStats = commit.stats;

      // Enhance with diff output if provided
      if (additionalData?.diffOutput) {
        const parsedFiles = this.parseDiffOutput(additionalData.diffOutput);
        enhancedFiles = parsedFiles.length > 0 ? parsedFiles : commit.files;
        enhancedStats = this.calculateStats(enhancedFiles);
      }

      return {
        ...commit,
        files: enhancedFiles,
        stats: enhancedStats
      };
    } catch (error) {
      throw new DataProcessingError(`Failed to enhance commit ${commit.hash}`, error as Error);
    }
  }
}