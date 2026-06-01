import * as editorsDA from '../data-access/editors';
import { Editor } from '../types/shared';

export function getEditors(): Editor[] {
  return editorsDA.listEditors();
}
