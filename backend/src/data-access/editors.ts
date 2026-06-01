import { db } from '../db/index';
import { Editor } from '../types/shared';

export function listEditors(): Editor[] {
  return db.prepare('SELECT * FROM editors ORDER BY name ASC').all() as Editor[];
}

export function getEditorById(id: number): Editor | undefined {
  return db.prepare('SELECT * FROM editors WHERE id = ?').get(id) as Editor | undefined;
}
