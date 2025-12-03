// Core types for Spectral Diff

export interface Hunk {
  id: string;
  header: string;
  added: number;
  removed: number;
  modified: number;
  importance: number;
  diffText: string;
  redFlags: string[];
  commentSuggestion: string;
  fixSnippet: string;
  testSuggestion: string;
  patchPreview: string;
}

export interface FileChange {
  path: string;
  language: string;
  risk: number;
  locChanged: number;
  testsTouched: boolean;
  checksPassing: boolean;
  hunks: Hunk[];
  churnScore?: number;
  isHighChurn?: boolean;
}

export interface LanternCursor {
  fileIndex: number;
  hunkIndex: number;
}

export interface PRMeta {
  headSha: string;
  headRef: string;
  baseRef: string;
  user: string;
}

export type AppMode = "demo" | "real";

// Helper functions for file/hunk navigation

export function getDarkestRoom(files: FileChange[]): FileChange | null {
  if (files.length === 0) return null;
  return files.reduce((darkest, file) => 
    file.risk > darkest.risk ? file : darkest
  );
}

export function getFilesSortedByRisk(files: FileChange[]): FileChange[] {
  return [...files].sort((a, b) => b.risk - a.risk);
}

export function getAllHunksSorted(files: FileChange[]): { file: FileChange; hunk: Hunk }[] {
  const sortedFiles = getFilesSortedByRisk(files);
  const allHunks: { file: FileChange; hunk: Hunk }[] = [];
  
  for (const file of sortedFiles) {
    const sortedHunks = [...file.hunks].sort((a, b) => b.importance - a.importance);
    for (const hunk of sortedHunks) {
      allHunks.push({ file, hunk });
    }
  }
  
  return allHunks;
}

export function getNextHunkCursor(
  files: FileChange[],
  current: LanternCursor
): LanternCursor | null {
  const allHunks = getAllHunksSorted(files);
  const currentGlobalIndex = allHunks.findIndex(
    (_h, i) => {
      let count = 0;
      for (let fi = 0; fi < files.length; fi++) {
        for (let hi = 0; hi < files[fi].hunks.length; hi++) {
          if (fi === current.fileIndex && hi === current.hunkIndex) {
            return i === count;
          }
          count++;
        }
      }
      return false;
    }
  );
  
  if (currentGlobalIndex === -1 || currentGlobalIndex >= allHunks.length - 1) {
    return null;
  }
  
  const next = allHunks[currentGlobalIndex + 1];
  const fileIndex = files.findIndex(f => f.path === next.file.path);
  const hunkIndex = files[fileIndex].hunks.findIndex(h => h.id === next.hunk.id);
  
  return { fileIndex, hunkIndex };
}

export function getPrevHunkCursor(
  files: FileChange[],
  current: LanternCursor
): LanternCursor | null {
  const allHunks = getAllHunksSorted(files);
  let currentGlobalIndex = -1;
  let count = 0;
  
  outer: for (let fi = 0; fi < files.length; fi++) {
    for (let hi = 0; hi < files[fi].hunks.length; hi++) {
      if (fi === current.fileIndex && hi === current.hunkIndex) {
        currentGlobalIndex = count;
        break outer;
      }
      count++;
    }
  }
  
  if (currentGlobalIndex <= 0) {
    return null;
  }
  
  const prev = allHunks[currentGlobalIndex - 1];
  const fileIndex = files.findIndex(f => f.path === prev.file.path);
  const hunkIndex = files[fileIndex].hunks.findIndex(h => h.id === prev.hunk.id);
  
  return { fileIndex, hunkIndex };
}

export function getTotalHunks(files: FileChange[]): number {
  return files.reduce((sum, file) => sum + file.hunks.length, 0);
}

export function getCurrentHunkNumber(files: FileChange[], cursor: LanternCursor): number {
  let count = 0;
  for (let fi = 0; fi < files.length; fi++) {
    for (let hi = 0; hi < files[fi].hunks.length; hi++) {
      count++;
      if (fi === cursor.fileIndex && hi === cursor.hunkIndex) {
        return count;
      }
    }
  }
  return count;
}
