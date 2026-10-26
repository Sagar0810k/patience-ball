import { defaultSave, type SaveData } from '../types';
import { dbDelete, dbGet, dbPut } from './db';
import { migrate } from './migrations';

const KEY = 'save_v1';

export interface LoadResult {
  data: SaveData;
  /** Set when stored data was unreadable and defaults were used instead. */
  recovered: boolean;
}

export async function loadSave(): Promise<LoadResult> {
  try {
    const raw = await dbGet<unknown>(KEY);
    if (raw === undefined) return { data: defaultSave(), recovered: false };
    const data = migrate(raw);
    return data ? { data, recovered: false } : { data: defaultSave(), recovered: true };
  } catch {
    return { data: defaultSave(), recovered: true };
  }
}

/** Resolves false on failure (quota, private mode); the caller keeps the in-memory state and warns. */
export async function writeSave(data: SaveData): Promise<boolean> {
  try {
    await dbPut(KEY, data);
    return true;
  } catch {
    return false;
  }
}

export const exportSave = (data: SaveData) => JSON.stringify(data, null, 2);

/** Parse + validate an imported file. Never writes; the caller confirms first. */
export function parseImport(text: string): SaveData | null {
  try {
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function resetSave(): Promise<SaveData> {
  try { await dbDelete(KEY); } catch { /* nothing to delete */ }
  return defaultSave();
}
